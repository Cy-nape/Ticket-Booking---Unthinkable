from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Event, SeatCategory, Venue, SeatLayout, Seat
from app.schemas import EventCreate, EventResponse
from app.auth import require_role

router = APIRouter(prefix="/events", tags=["Events"])

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(event_in: EventCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(["ORGANISER", "ADMIN"]))):
    # 1. Verify Venue exists
    venue = db.query(Venue).filter(Venue.id == event_in.venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
        
    # 2. Verify all categories present in the venue are priced in the event config
    # A robust system requires pricing for all physical seat categories
    layout = db.query(SeatLayout).filter(SeatLayout.venue_id == venue.id).first()
    if not layout:
        raise HTTPException(status_code=400, detail="Venue has no seat layout")
        
    distinct_categories = set(s.category_name for s in db.query(Seat).filter(Seat.seat_layout_id == layout.id).all())
    provided_categories = set(cat.name for cat in event_in.categories)
    
    if not distinct_categories.issubset(provided_categories):
        missing = distinct_categories - provided_categories
        raise HTTPException(status_code=400, detail=f"Missing pricing for seat categories: {missing}")

    # 3. Create Event
    db_event = Event(
        title=event_in.title,
        description=event_in.description,
        date_time=event_in.date_time,
        venue_id=event_in.venue_id,
        organiser_id=current_user.id
    )
    db.add(db_event)
    db.flush()

    # 4. Create Category Pricing
    categories_to_insert = []
    for cat in event_in.categories:
        categories_to_insert.append(
            SeatCategory(
                event_id=db_event.id,
                name=cat.name,
                price=cat.price
            )
        )
    
    db.add_all(categories_to_insert)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.get("", response_model=list[EventResponse])
def get_events(db: Session = Depends(get_db)):
    return db.query(Event).all()
