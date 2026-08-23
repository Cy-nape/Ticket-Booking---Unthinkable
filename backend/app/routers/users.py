from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Booking, WaitlistEntry, User, Event, BookingSeat, Seat
from app.schemas import UserBookingResponse, UserWaitlistResponse, DashboardEvent, DashboardSeat
from app.auth import get_current_user

router = APIRouter(tags=["Users"])

@router.get("/users/me/bookings", response_model=List[UserBookingResponse])
def get_user_bookings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bookings = db.query(Booking).filter(Booking.user_id == current_user.id).order_by(Booking.created_at.desc()).all()
    
    response_list = []
    for b in bookings:
        event = db.query(Event).filter(Event.id == b.event_id).first()
        
        seat_objects = []
        for bs in b.seats:
            seat = db.query(Seat).filter(Seat.id == bs.seat_id).first()
            seat_objects.append(DashboardSeat(
                id=seat.id,
                row=seat.row,
                col=seat.col,
                category_name=seat.category_name,
                price=float(bs.price)
            ))
            
        response_list.append(UserBookingResponse(
            id=b.id,
            booking_ref=b.booking_ref,
            event=DashboardEvent(id=event.id, title=event.title, date_time=event.date_time),
            seats=seat_objects,
            total_amount=float(b.total_amount),
            status=b.status.value,
            created_at=b.created_at
        ))
        
    return response_list

@router.get("/users/me/waitlist", response_model=List[UserWaitlistResponse])
def get_user_waitlist(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    entries = db.query(WaitlistEntry).filter(WaitlistEntry.user_id == current_user.id).order_by(WaitlistEntry.created_at.desc()).all()
    
    response_list = []
    for e in entries:
        event = db.query(Event).filter(Event.id == e.event_id).first()
        response_list.append(UserWaitlistResponse(
            id=e.id,
            event=DashboardEvent(id=event.id, title=event.title, date_time=event.date_time),
            category_name=e.category_name,
            status=e.status.value,
            created_at=e.created_at,
            offer_expires_at=e.offer_expires_at
        ))
        
    return response_list
