from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid

from app.database import get_db
from app.models import Event, SeatHold, Booking, BookingSeat, BookingStatus, User, Seat, SeatCategory, WaitlistEntry, WaitlistStatus
from app.schemas import BookingRequest, BookingResponse
from app.auth import get_current_user
from app.routers.seats import manager
from app.email_service import send_booking_confirmation
from app.qr_service import generate_qr_code

router = APIRouter(tags=["Bookings"])

@router.post("/events/{event_id}/book", response_model=BookingResponse, status_code=201)
async def book_seats(
    event_id: str, 
    payload: BookingRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if not payload.seat_ids:
        raise HTTPException(status_code=400, detail="No seats provided")

    # Verify event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    now = datetime.now(timezone.utc)
    
    # 1. Verify holds for all requested seats
    holds = db.query(SeatHold).filter(
        SeatHold.event_id == event_id,
        SeatHold.seat_id.in_(payload.seat_ids),
        SeatHold.user_id == current_user.id,
        SeatHold.expires_at > now
    ).all()

    if len(holds) != len(payload.seat_ids):
        raise HTTPException(status_code=400, detail="One or more seats are not held by the user or hold expired")

    # 2. Calculate Total Price
    # Need to get the categories for these seats
    seats = db.query(Seat).filter(Seat.id.in_(payload.seat_ids)).all()
    categories = db.query(SeatCategory).filter(SeatCategory.event_id == event_id).all()
    price_map = {cat.name: cat.price for cat in categories}
    
    total_price = sum(price_map.get(seat.category_name, 0.0) for seat in seats)

    # 3. Create Booking
    booking_ref = f"BKG-{uuid.uuid4().hex[:8].upper()}"
    booking = Booking(
        user_id=current_user.id,
        event_id=event_id,
        total_amount=total_price,
        booking_ref=booking_ref,
        status=BookingStatus.CONFIRMED
    )
    db.add(booking)
    db.flush() # Get booking ID

    # 4. Create BookingSeats and Delete Holds
    for seat in seats:
        seat_price = price_map.get(seat.category_name, 0.0)
        bs = BookingSeat(booking_id=booking.id, seat_id=seat.id, price=seat_price)
        db.add(bs)
        # Delete the hold
        db.query(SeatHold).filter(SeatHold.seat_id == seat.id, SeatHold.event_id == event_id).delete(synchronize_session=False)

    # 5. Mark any OFFERED waitlist entries as FULFILLED
    category_names = {seat.category_name for seat in seats}
    db.query(WaitlistEntry).filter(
        WaitlistEntry.event_id == event_id,
        WaitlistEntry.user_id == current_user.id,
        WaitlistEntry.category_name.in_(category_names),
        WaitlistEntry.status == WaitlistStatus.OFFERED
    ).update({"status": WaitlistStatus.FULFILLED}, synchronize_session=False)

    try:
        db.commit()
        db.refresh(booking)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Booking transaction failed")

    # 5. Broadcast Booked Status
    for seat_id in payload.seat_ids:
        await manager.broadcast_seat_status(event_id, seat_id, "BOOKED")

    # 6. Generate QR Code
    qr_base64 = generate_qr_code(booking.id)

    # 7. Simulate sending email
    seat_labels = [f"{s.row}{s.col}" for s in seats]
    send_booking_confirmation(
        email=current_user.email,
        booking_id=booking.id,
        event_title=event.title,
        total_price=total_price,
        seats=seat_labels
    )

    return BookingResponse(
        id=booking.id,
        user_id=booking.user_id,
        event_id=booking.event_id,
        total_price=float(booking.total_amount),
        status=booking.status.value,
        created_at=booking.created_at,
        seat_ids=payload.seat_ids,
        qr_code_base64=qr_base64
    )
