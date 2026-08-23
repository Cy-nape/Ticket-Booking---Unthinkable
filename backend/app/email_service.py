import logging

# Configure basic logging for the email stub
logging.basicConfig(level=logging.INFO, format='%(asctime)s - EMAIL_STUB - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def send_booking_confirmation(email: str, booking_id: str, event_title: str, total_price: float, seats: list[str]):
    """
    Simulates sending an email ticket to the user.
    """
    seats_str = ", ".join(seats)
    
    email_body = f"""
    ========================================================
    🎟️  TICKET BOOKING CONFIRMATION
    ========================================================
    To: {email}
    Subject: Your Tickets for {event_title} are confirmed!
    
    Hello!
    Your booking has been successfully confirmed.
    
    Booking ID: {booking_id}
    Event: {event_title}
    Seats: {seats_str}
    Total Paid: ${total_price:.2f}
    
    (A QR code is attached to this email for entry)
    
    Thank you for using TicketBooking!
    ========================================================
    """
    
    logger.info(email_body)

def send_waitlist_offer(email: str, event_title: str, seat_label: str):
    """
    Simulates sending a waitlist offer email to the user.
    """
    email_body = f"""
    ========================================================
    🕒  WAITLIST OFFER ALERT
    ========================================================
    To: {email}
    Subject: Great news! A seat opened up for {event_title}
    
    Hello!
    A seat ({seat_label}) you were waitlisted for has just become available!
    We have automatically placed a HOLD on this seat for you.
    
    You have EXACTLY 2 HOURS to complete your booking. 
    If you do not book within 2 hours, the hold will expire and the seat 
    will be offered to the next person on the waitlist.
    
    Hurry and secure your ticket!
    ========================================================
    """
    
    logger.info(email_body)
