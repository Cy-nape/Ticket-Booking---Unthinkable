import requests
import json
import uuid
import time

BASE_URL = "http://localhost:8000"

def create_user_and_login():
    username = f"user_{uuid.uuid4()}@example.com"
    password = "password123"
    requests.post(f"{BASE_URL}/auth/register", json={
        "email": username,
        "password": password,
        "role": "CUSTOMER"
    })
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": username, "password": password})
    return res.json()["access_token"], username

def main():
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
    
    # Pick a random AVAILABLE seat
    available_seats = [s for s in seats if s["status"] == "AVAILABLE"]
    if len(available_seats) < 2:
         print("Not enough available seats to test.")
         return
    
    seat_1 = available_seats[0]["seat_id"]
    seat_2 = available_seats[1]["seat_id"]

    print(f"Creating user for booking...")
    token, email = create_user_and_login()
    headers = {"Authorization": f"Bearer {token}"}

    print(f"Holding seats {seat_1} and {seat_2}...")
    res1 = requests.post(f"{BASE_URL}/events/{event_id}/hold", json={"seat_id": seat_1}, headers=headers)
    res2 = requests.post(f"{BASE_URL}/events/{event_id}/hold", json={"seat_id": seat_2}, headers=headers)

    if res1.status_code != 201 or res2.status_code != 201:
        print("Failed to hold seats.", res1.text, res2.text)
        return
    
    print("Successfully held seats. Now booking them...")
    book_payload = {"seat_ids": [seat_1, seat_2]}
    res = requests.post(f"{BASE_URL}/events/{event_id}/book", json=book_payload, headers=headers)
    
    if res.status_code == 201:
        data = res.json()
        print("\nSUCCESS! Booking confirmed.")
        print(f"Booking ID: {data['id']}")
        print(f"Total Price: ${data['total_price']}")
        print(f"QR Code Base64 Length: {len(data['qr_code_base64'])}")
        print("\nCheck the FastAPI server logs to verify the simulated email was sent.")
    else:
        print("FAILED to book seats.", res.status_code, res.text)

if __name__ == "__main__":
    main()
