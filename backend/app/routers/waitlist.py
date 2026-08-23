from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Event, WaitlistEntry, WaitlistStatus, SeatCategory, User
from app.schemas import WaitlistRequest, WaitlistResponse
from app.auth import get_current_user

router = APIRouter(tags=["Waitlist"])

@router.post("/events/{event_id}/waitlist", response_model=WaitlistResponse, status_code=201)
def join_waitlist(
    event_id: str, 
    payload: WaitlistRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Verify event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Verify category exists for this event
    category = db.query(SeatCategory).filter(
        SeatCategory.event_id == event_id,
        SeatCategory.name == payload.category_name
    ).first()
    if not category:
        raise HTTPException(status_code=400, detail="Seat category does not exist for this event")

    # Check if user is already on the waitlist for this category
    existing = db.query(WaitlistEntry).filter(
        WaitlistEntry.event_id == event_id,
        WaitlistEntry.category_name == payload.category_name,
        WaitlistEntry.user_id == current_user.id,
        WaitlistEntry.status == WaitlistStatus.WAITING
    ).first()

    if existing:
        raise HTTPException(status_code=409, detail="You are already on the waitlist for this category")

    entry = WaitlistEntry(
        event_id=event_id,
        category_name=payload.category_name,
        user_id=current_user.id,
        status=WaitlistStatus.WAITING
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return entry
