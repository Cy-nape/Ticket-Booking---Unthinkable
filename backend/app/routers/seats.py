import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Dict, List
from datetime import timedelta

from app.database import get_db
from app.models import Event, Seat, SeatLayout, SeatCategory, SeatHold, BookingSeat, Booking, BookingStatus, User
from app.schemas import SeatStatus, SeatHoldRequest, SeatHoldResponse
from app.auth import get_current_user
from app.config import settings

router = APIRouter(tags=["Seats"])

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        # event_id -> list of connected websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, event_id: str):
        await websocket.accept()
        if event_id not in self.active_connections:
            self.active_connections[event_id] = []
        self.active_connections[event_id].append(websocket)

    def disconnect(self, websocket: WebSocket, event_id: str):
        if event_id in self.active_connections:
            self.active_connections[event_id].remove(websocket)

    async def broadcast_seat_status(self, event_id: str, seat_id: str, status: str):
        if event_id in self.active_connections:
            message = json.dumps({"seat_id": seat_id, "status": status})
            for connection in self.active_connections[event_id]:
                try:
                    await connection.send_text(message)
                except:
                    # Ignore disconnected clients
                    pass

manager = ConnectionManager()

@router.get("/events/{event_id}/seats", response_model=List[SeatStatus])
def get_event_seats(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    layout = db.query(SeatLayout).filter(SeatLayout.venue_id == event.venue_id).first()
    seats = db.query(Seat).filter(Seat.seat_layout_id == layout.id).all()
    
    # Get Pricing
    categories = db.query(SeatCategory).filter(SeatCategory.event_id == event_id).all()
    price_map = {cat.name: cat.price for cat in categories}

    # Get Active Holds
    now = datetime.now(timezone.utc)
    active_holds = db.query(SeatHold).filter(
        SeatHold.event_id == event_id,
        SeatHold.expires_at > now
    ).all()
    held_seat_ids = {h.seat_id for h in active_holds}

    # Get Booked Seats
    booked_seats = db.query(BookingSeat).join(Booking).filter(
        Booking.event_id == event_id,
        Booking.status == BookingStatus.CONFIRMED
    ).all()
    booked_seat_ids = {bs.seat_id for bs in booked_seats}

    result = []
    for seat in seats:
        status = "AVAILABLE"
        if seat.id in booked_seat_ids:
            status = "BOOKED"
        elif seat.id in held_seat_ids:
            status = "HELD"
            
        result.append(
            SeatStatus(
                seat_id=seat.id,
                row=seat.row,
                col=seat.col,
                category_name=seat.category_name,
                status=status,
                price=float(price_map.get(seat.category_name, 0.0))
            )
        )
    return result

@router.websocket("/ws/events/{event_id}")
async def websocket_endpoint(websocket: WebSocket, event_id: str):
    await manager.connect(websocket, event_id)
    try:
        while True:
            # We don't expect messages from client, but we must receive to keep connection open and detect disconnects
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, event_id)

from pydantic import BaseModel
class DebugHold(BaseModel):
    seat_id: str
    status: str

@router.post("/events/{event_id}/debug/hold")
async def debug_hold_seat(event_id: str, data: DebugHold):
    # This just broadcasts a WebSocket event to test real-time updates for Phase 3
    await manager.broadcast_seat_status(event_id, data.seat_id, data.status)
    return {"message": "Broadcasted"}
@router.post("/events/{event_id}/hold", response_model=SeatHoldResponse, status_code=201)
async def hold_seat(
    event_id: str, 
    payload: SeatHoldRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Verify Event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # 1. Row-level lock on the Seat to prevent concurrent hold attempts on the same seat
    # This forces other transactions trying to hold this exact seat to wait here.
    seat = db.query(Seat).with_for_update().filter(Seat.id == payload.seat_id).first()
    if not seat:
        db.rollback()
        raise HTTPException(status_code=404, detail="Seat not found")
        
    # Verify seat belongs to event venue
    layout = db.query(SeatLayout).filter(SeatLayout.venue_id == event.venue_id).first()
    if seat.seat_layout_id != layout.id:
        db.rollback()
        raise HTTPException(status_code=400, detail="Seat does not belong to this event")

    now = datetime.now(timezone.utc)

    # 2. Cleanup expired holds for this seat inline
    db.query(SeatHold).filter(
        SeatHold.seat_id == payload.seat_id,
        SeatHold.event_id == event_id,
        SeatHold.expires_at <= now
    ).delete(synchronize_session=False)

    # 3. Check for existing active hold
    active_hold = db.query(SeatHold).filter(
        SeatHold.seat_id == payload.seat_id,
        SeatHold.event_id == event_id
    ).first()

    if active_hold:
        db.rollback()
        raise HTTPException(status_code=409, detail="Seat is already held")

    # 4. Check for existing confirmed booking
    booked_seat = db.query(BookingSeat).join(Booking).filter(
        BookingSeat.seat_id == payload.seat_id,
        Booking.event_id == event_id,
        Booking.status == BookingStatus.CONFIRMED
    ).first()

    if booked_seat:
        db.rollback()
        raise HTTPException(status_code=409, detail="Seat is already booked")

    # 5. Insert new hold
    expires_at = now + timedelta(minutes=settings.SEAT_HOLD_TTL_MINUTES)
    new_hold = SeatHold(
        user_id=current_user.id,
        event_id=event_id,
        seat_id=payload.seat_id,
        expires_at=expires_at
    )
    db.add(new_hold)
    
    try:
        db.commit()
        db.refresh(new_hold)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error during hold")

    # 6. Broadcast real-time status
    await manager.broadcast_seat_status(event_id, payload.seat_id, "HELD")

    return new_hold
