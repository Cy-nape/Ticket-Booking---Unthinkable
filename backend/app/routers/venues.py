from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Venue, SeatLayout, Seat
from app.schemas import VenueCreate, VenueResponse
from app.auth import require_role

router = APIRouter(prefix="/venues", tags=["Venues"])

@router.post("", response_model=VenueResponse, status_code=status.HTTP_201_CREATED)
def create_venue(venue_in: VenueCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(["ADMIN"]))):
    # 1. Create Venue
    db_venue = Venue(
        name=venue_in.name,
        location=venue_in.location,
        admin_id=current_user.id
    )
    db.add(db_venue)
    db.flush() # To get db_venue.id

    # 2. Create SeatLayout
    db_layout = SeatLayout(
        venue_id=db_venue.id,
        rows=venue_in.rows,
        columns=venue_in.columns
    )
    db.add(db_layout)
    db.flush()

    # 3. Create Seats based on configuration
    # Create a lookup for fast category checking
    config_lookup = {(cfg.row, cfg.col): cfg.category_name for cfg in venue_in.seat_configs}
    
    seats_to_insert = []
    # Simple row generation A, B, C... (Assuming max 26 rows for simplicity, otherwise AA, AB etc is needed, but sufficient for this demo)
    for r in range(venue_in.rows):
        row_char = chr(65 + r) # 0 -> A, 1 -> B
        for c in range(1, venue_in.columns + 1):
            category = config_lookup.get((row_char, c), "Standard")
            seats_to_insert.append(
                Seat(
                    seat_layout_id=db_layout.id,
                    row=row_char,
                    col=c,
                    category_name=category
                )
            )
    
    db.add_all(seats_to_insert)
    db.commit()
    db.refresh(db_venue)
    return db_venue

@router.get("", response_model=list[VenueResponse])
def get_venues(db: Session = Depends(get_db)):
    return db.query(Venue).all()
