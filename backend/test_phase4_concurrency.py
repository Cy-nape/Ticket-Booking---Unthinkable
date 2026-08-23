import concurrent.futures
import requests
import json
import uuid

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
    return res.json()["access_token"]

def hold_seat(token, event_id, seat_id):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.post(f"{BASE_URL}/events/{event_id}/hold", json={"seat_id": seat_id}, headers=headers)
    return res.status_code

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
    if not seats:
        print("No seats found.")
        return
    
    # Pick a random AVAILABLE seat
    available_seats = [s for s in seats if s["status"] == "AVAILABLE"]
    if not available_seats:
         print("No available seats to test.")
         return
    
    seat_id = available_seats[0]["seat_id"]
    print(f"Testing concurrency on seat {seat_id} for event {event_id}")

    # Create 10 different users
    print("Creating 10 users...")
    tokens = [create_user_and_login() for _ in range(10)]

    print("Firing 10 concurrent requests to hold the same seat...")
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(hold_seat, t, event_id, seat_id) for t in tokens]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())

    print("\nResults Summary:")
    print(f"Total Requests: {len(results)}")
    print(f"Successful Holds (201 Created): {results.count(201)}")
    print(f"Conflicts (409 Conflict): {results.count(409)}")
    print(f"Other Status Codes: {[r for r in results if r not in [201, 409]]}")
    
    if results.count(201) == 1 and results.count(409) == 9:
        print("\nSUCCESS! Concurrency protection works perfectly. Exactly 1 hold succeeded, and 9 were blocked.")
    else:
        print("\nFAILURE! Concurrency protection failed.")

if __name__ == "__main__":
    main()
