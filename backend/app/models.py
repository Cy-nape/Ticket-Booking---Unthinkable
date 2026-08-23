from datetime import datetime, timezone
import enum
import uuid
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class RoleEnum(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    ORGANISER = "ORGANISER"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.CUSTOMER, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Venue(Base):
    __tablename__ = 'venues'
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    admin_id = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    seat_layout = relationship("SeatLayout", back_populates="venue", uselist=False)
    events = relationship("Event", back_populates="venue")

class SeatLayout(Base):
    __tablename__ = 'seat_layouts'
    id = Column(String, primary_key=True, default=generate_uuid)
    venue_id = Column(String, ForeignKey('venues.id'), unique=True, nullable=False)
    rows = Column(Integer, nullable=False)
    columns = Column(Integer, nullable=False)
    
    venue = relationship("Venue", back_populates="seat_layout")
    seats = relationship("Seat", back_populates="layout")

class Seat(Base):
    __tablename__ = 'seats'
    id = Column(String, primary_key=True, default=generate_uuid)
    seat_layout_id = Column(String, ForeignKey('seat_layouts.id'), nullable=False)
    row = Column(String, nullable=False) # e.g., 'A', 'B'
    col = Column(Integer, nullable=False) # e.g., 1, 2
    category_name = Column(String, nullable=False) # e.g., 'Premium', 'Standard'
    
    layout = relationship("SeatLayout", back_populates="seats")
    
    __table_args__ = (UniqueConstraint('seat_layout_id', 'row', 'col', name='_seat_layout_row_col_uc'),)

class Event(Base):
    __tablename__ = 'events'
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(String)
    date_time = Column(DateTime, nullable=False)
    venue_id = Column(String, ForeignKey('venues.id'), nullable=False)
    organiser_id = Column(String, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    venue = relationship("Venue", back_populates="events")
    categories = relationship("SeatCategory", back_populates="event")

class SeatCategory(Base):
    __tablename__ = 'seat_categories'
    id = Column(String, primary_key=True, default=generate_uuid)
    event_id = Column(String, ForeignKey('events.id'), nullable=False)
    name = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    
    event = relationship("Event", back_populates="categories")
    
    __table_args__ = (UniqueConstraint('event_id', 'name', name='_event_category_name_uc'),)

class BookingStatus(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"

class Booking(Base):
    __tablename__ = 'bookings'
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    event_id = Column(String, ForeignKey('events.id'), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.CONFIRMED, nullable=False)
    booking_ref = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    seats = relationship("BookingSeat", back_populates="booking")

class BookingSeat(Base):
    __tablename__ = 'booking_seats'
    id = Column(String, primary_key=True, default=generate_uuid)
    booking_id = Column(String, ForeignKey('bookings.id'), nullable=False)
    seat_id = Column(String, ForeignKey('seats.id'), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    
    booking = relationship("Booking", back_populates="seats")
    
    __table_args__ = (UniqueConstraint('booking_id', 'seat_id', name='_booking_seat_uc'),)

class SeatHold(Base):
    __tablename__ = 'seat_holds'
    id = Column(String, primary_key=True, default=generate_uuid)
    event_id = Column(String, ForeignKey('events.id'), nullable=False)
    seat_id = Column(String, ForeignKey('seats.id'), nullable=False)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    __table_args__ = (UniqueConstraint('event_id', 'seat_id', name='_event_seat_hold_uc'),)

class WaitlistStatus(str, enum.Enum):
    WAITING = "WAITING"
    OFFERED = "OFFERED"
    EXPIRED = "EXPIRED"
    FULFILLED = "FULFILLED"

class WaitlistEntry(Base):
    __tablename__ = 'waitlist_entries'
    id = Column(String, primary_key=True, default=generate_uuid)
    event_id = Column(String, ForeignKey('events.id'), nullable=False)
    category_name = Column(String, nullable=False)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    status = Column(Enum(WaitlistStatus), default=WaitlistStatus.WAITING, nullable=False)
    offer_expires_at = Column(DateTime)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
