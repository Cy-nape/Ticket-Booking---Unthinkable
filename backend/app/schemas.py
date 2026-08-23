from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "CUSTOMER" # CUSTOMER, ORGANISER, ADMIN

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class SeatConfig(BaseModel):
    row: str
    col: int
    category_name: str

class VenueCreate(BaseModel):
    name: str
    location: str
    rows: int
    columns: int
    seat_configs: list[SeatConfig] = []

class VenueResponse(BaseModel):
    id: str
    name: str
    location: str
    admin_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class EventCategoryPricing(BaseModel):
    name: str
    price: float

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date_time: datetime
    venue_id: str
    categories: list[EventCategoryPricing]

class EventResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    date_time: datetime
    venue_id: str
    organiser_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class SeatStatus(BaseModel):
    seat_id: str
    row: str
    col: int
    category_name: str
    status: str # AVAILABLE, HELD, BOOKED
    price: float

class SeatHoldRequest(BaseModel):
    seat_id: str

class SeatHoldResponse(BaseModel):
    id: str
    user_id: str
    event_id: str
    seat_id: str
    expires_at: datetime

    class Config:
        from_attributes = True

class BookingRequest(BaseModel):
    seat_ids: List[str]

class BookingResponse(BaseModel):
    id: str
    user_id: str
    event_id: str
    total_price: float
    status: str
    created_at: datetime
    seat_ids: List[str]
    qr_code_base64: Optional[str] = None

    class Config:
        from_attributes = True

class WaitlistRequest(BaseModel):
    category_name: str

class WaitlistResponse(BaseModel):
    id: str
    event_id: str
    category_name: str
    user_id: str
    status: str
    created_at: datetime
    offer_expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DashboardEvent(BaseModel):
    id: str
    title: str
    date_time: datetime

class DashboardSeat(BaseModel):
    id: str
    row: str
    col: int
    category_name: str
    price: float

class UserBookingResponse(BaseModel):
    id: str
    booking_ref: str
    event: DashboardEvent
    seats: List[DashboardSeat]
    total_amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserWaitlistResponse(BaseModel):
    id: str
    event: DashboardEvent
    category_name: str
    status: str
    created_at: datetime
    offer_expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True
