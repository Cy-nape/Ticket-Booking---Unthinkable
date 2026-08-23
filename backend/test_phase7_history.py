import requests
import uuid

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
    available_seats = [s for s in seats if s["status"] == "AVAILABLE" and s["category_name"] == "Premium"]
    
    if not available_seats:
         print("Not enough available Premium seats to test.")
         return
    
    target_seat = available_seats[0]
    seat_id = target_seat["seat_id"]
    category_name = target_seat["category_name"]

    print("Creating User...")
    token, email = create_user_and_login()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Join Waitlist
    print(f"Joining waitlist for {category_name}...")
    requests.post(f"{BASE_URL}/events/{event_id}/waitlist", json={"category_name": category_name}, headers=headers)

    # 2. Book a Seat
    print(f"Holding and booking seat {seat_id}...")
    requests.post(f"{BASE_URL}/events/{event_id}/hold", json={"seat_id": seat_id}, headers=headers)
    requests.post(f"{BASE_URL}/events/{event_id}/book", json={"seat_ids": [seat_id]}, headers=headers)

    # 3. Fetch History
    print("\n--- Fetching Bookings ---")
    res = requests.get(f"{BASE_URL}/users/me/bookings", headers=headers)
    bookings = res.json()
    import json
    print(json.dumps(bookings, indent=2))

    print("\n--- Fetching Waitlist ---")
    res = requests.get(f"{BASE_URL}/users/me/waitlist", headers=headers)
    waitlist = res.json()
    print(json.dumps(waitlist, indent=2))

if __name__ == "__main__":
    main()
