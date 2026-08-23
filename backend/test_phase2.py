import requests
from datetime import datetime, timezone, timedelta

BASE_URL = "http://localhost:8000"

def test_phase2():
    print("Testing Phase 2 Flow...")
    
    # 1. Login ADMIN and ORGANISER to get tokens (assuming they were created in test_auth.py)
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin@test.com", "password": "pass"})
    admin_token = res.json().get("access_token")
    if not admin_token:
        print("Failed to login Admin. Did you run test_auth.py first?")
        return

    res = requests.post(f"{BASE_URL}/auth/login", data={"username": "org@test.com", "password": "pass"})
    org_token = res.json().get("access_token")

    # 2. Create Venue (Admin)
    print("Creating Venue (Grand Theater)...")
    venue_payload = {
        "name": "Grand Theater",
        "location": "Downtown",
        "rows": 5,
        "columns": 5,
        "seat_configs": [
            {"row": "A", "col": 1, "category_name": "Premium"},
            {"row": "A", "col": 2, "category_name": "Premium"},
            {"row": "A", "col": 3, "category_name": "Premium"},
            {"row": "A", "col": 4, "category_name": "Premium"},
            {"row": "A", "col": 5, "category_name": "Premium"}
        ]
    }
    res = requests.post(f"{BASE_URL}/venues", json=venue_payload, headers={"Authorization": f"Bearer {admin_token}"})
    print(res.status_code, res.json())
    venue_id = res.json()["id"]

    # 3. Create Event (Organiser)
    print("Creating Event (Inception Premiere)...")
    event_payload = {
        "title": "Inception Premiere",
        "description": "Opening night!",
        "date_time": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "venue_id": venue_id,
        "categories": [
            {"name": "Premium", "price": 50.0},
            {"name": "Standard", "price": 20.0}
        ]
    }
    res = requests.post(f"{BASE_URL}/events", json=event_payload, headers={"Authorization": f"Bearer {org_token}"})
    print(res.status_code, res.json())

    # 4. Fetch events
    print("Fetching all events...")
    res = requests.get(f"{BASE_URL}/events")
    print(res.status_code, res.json())

if __name__ == "__main__":
    test_phase2()
