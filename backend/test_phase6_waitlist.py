import requests
import uuid
import time

BASE_URL = "http://localhost:8000"

def create_user_and_login(role="CUSTOMER"):
    username = f"user_{uuid.uuid4()}@example.com"
    password = "password123"
    requests.post(f"{BASE_URL}/auth/register", json={
        "email": username,
        "password": password,
        "role": role
    })
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": username, "password": password})
    return res.json()["access_token"], username

def main():
    print("Cleaning up old waitlist entries to ensure a fresh test...")
    # Quick DB cleanup for testing purposes
    from app.database import SessionLocal
    from app.models import WaitlistEntry, SeatHold
    db = SessionLocal()
    db.query(WaitlistEntry).delete()
    db.query(SeatHold).delete()
    db.commit()
    db.close()

    print("Fetching events...")
    res = requests.get(f"{BASE_URL}/events")
    events = res.json()
    if not events:
        print("No events found.")
        return
    event_id = events[0]["id"]
    
    print("Fetching seats...")
    res = requests.get(f"{BASE_URL}/events/{event_id}/seats")
    seats = res.json()
    
    # Pick a random AVAILABLE Premium seat
    available_seats = [s for s in seats if s["status"] == "AVAILABLE" and s["category_name"] == "Premium"]
    if not available_seats:
         print("Not enough available Premium seats to test.")
         return
    
    target_seat = available_seats[0]
    seat_id = target_seat["seat_id"]
    category_name = target_seat["category_name"]

    print(f"Creating User A (Holder)...")
    token_a, email_a = create_user_and_login()
    headers_a = {"Authorization": f"Bearer {token_a}"}

    print(f"User A holding seat {seat_id}...")
    res = requests.post(f"{BASE_URL}/events/{event_id}/hold", json={"seat_id": seat_id}, headers=headers_a)
    if res.status_code != 201:
        print("Failed to hold seat.", res.text)
        return

    print(f"Creating User B (Waitlist)...")
    token_b, email_b = create_user_and_login()
    headers_b = {"Authorization": f"Bearer {token_b}"}

    print(f"User B joining waitlist for {category_name}...")
    res = requests.post(f"{BASE_URL}/events/{event_id}/waitlist", json={"category_name": category_name}, headers=headers_b)
    if res.status_code != 201:
        print("Failed to join waitlist.", res.text)
        return
    
    print("Waiting 10 seconds for the TTL to expire and scheduler to trigger...")
    time.sleep(10)
    
    print("User B attempting to book the auto-assigned seat...")
    book_payload = {"seat_ids": [seat_id]}
    res = requests.post(f"{BASE_URL}/events/{event_id}/book", json=book_payload, headers=headers_b)
    
    if res.status_code == 201:
        print("\nSUCCESS! User B successfully booked the seat they were waitlisted for.")
    else:
        print("\nFAILED for User B.", res.status_code, res.text)

if __name__ == "__main__":
    main()
