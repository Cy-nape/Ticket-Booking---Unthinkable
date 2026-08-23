import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.database import SessionLocal
from app.models import SeatHold, WaitlistEntry, WaitlistStatus, Seat, Event, User
from app.routers.seats import manager
from app.email_service import send_waitlist_offer

scheduler = AsyncIOScheduler()

async def release_expired_holds():
    """
    Background job to find expired SeatHolds, delete them,
    and either broadcast an 'AVAILABLE' status OR auto-assign the seat
    to the next person on the waitlist.
    """
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        
        # Find expired holds
        expired_holds = db.query(SeatHold).filter(SeatHold.expires_at <= now).all()
        
        # Extract data before deletion to avoid detached instance errors
        expired_data = [{"id": h.id, "event_id": h.event_id, "seat_id": h.seat_id} for h in expired_holds]

        # Delete them
        expired_ids = [d["id"] for d in expired_data]
        db.query(SeatHold).filter(SeatHold.id.in_(expired_ids)).delete(synchronize_session=False)

        # Process each released seat
        for data in expired_data:
            # Check waitlist
            seat = db.query(Seat).filter(Seat.id == data["seat_id"]).first()
            if not seat:
                continue

            waitlist_entry = db.query(WaitlistEntry).filter(
                WaitlistEntry.event_id == data["event_id"],
                WaitlistEntry.category_name == seat.category_name,
                WaitlistEntry.status == WaitlistStatus.WAITING
            ).order_by(WaitlistEntry.created_at.asc()).first()

            if waitlist_entry:
                # 1. Update WaitlistEntry
                offer_expiry = now + timedelta(hours=2)
                waitlist_entry.status = WaitlistStatus.OFFERED
                waitlist_entry.offer_expires_at = offer_expiry
                
                # 2. Create new SeatHold for this user
                new_hold = SeatHold(
                    user_id=waitlist_entry.user_id,
                    event_id=data["event_id"],
                    seat_id=data["seat_id"],
                    expires_at=offer_expiry
                )
                db.add(new_hold)
                
                # 3. Get user and event details for email
                user = db.query(User).filter(User.id == waitlist_entry.user_id).first()
                event = db.query(Event).filter(Event.id == data["event_id"]).first()
                
                db.commit()
                
                print(f"Auto-assigned seat {data['seat_id']} to waitlist user {waitlist_entry.user_id}")
                
                # 4. Notify user and broadcast HELD
                send_waitlist_offer(user.email, event.title, f"{seat.row}{seat.col}")
                await manager.broadcast_seat_status(data["event_id"], data["seat_id"], "HELD")
            else:
                # No one on waitlist, broadcast AVAILABLE
                db.commit()
                print(f"Auto-released seat {data['seat_id']} for event {data['event_id']}")
                await manager.broadcast_seat_status(data["event_id"], data["seat_id"], "AVAILABLE")

    except Exception as e:
        db.rollback()
        print(f"Error in release_expired_holds job: {e}")
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            release_expired_holds,
            trigger=IntervalTrigger(seconds=5),
            id="release_expired_holds",
            name="Release Expired Seat Holds",
            replace_existing=True
        )
        scheduler.start()
        print("Background scheduler started.")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        print("Background scheduler stopped.")
