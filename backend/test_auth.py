import requests

BASE_URL = "http://localhost:8000"

def test_auth_flow():
    print("Testing Auth Flow...")
    
    # 1. Register CUSTOMER
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": "customer@test.com", "password": "pass", "role": "CUSTOMER"
    })
    print("Register CUSTOMER:", res.status_code, res.json())
    
    # 2. Register ORGANISER
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": "org@test.com", "password": "pass", "role": "ORGANISER"
    })
    print("Register ORGANISER:", res.status_code, res.json())
    
    # 3. Register ADMIN
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": "admin@test.com", "password": "pass", "role": "ADMIN"
    })
    print("Register ADMIN:", res.status_code, res.json())

    # 4. Login CUSTOMER
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": "customer@test.com", "password": "pass"})
    customer_token = res.json()["access_token"]
    print("Login CUSTOMER: Success")

    # 5. Login ORGANISER
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": "org@test.com", "password": "pass"})
    org_token = res.json()["access_token"]
    print("Login ORGANISER: Success")

    # 6. Login ADMIN
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin@test.com", "password": "pass"})
    admin_token = res.json()["access_token"]
    print("Login ADMIN: Success")

    # 7. Test Customer accessing Admin Route (Should fail 403)
    res = requests.get(f"{BASE_URL}/admin/dashboard", headers={"Authorization": f"Bearer {customer_token}"})
    print("Customer -> Admin Route:", res.status_code, res.json())

    # 8. Test Admin accessing Admin Route (Should succeed 200)
    res = requests.get(f"{BASE_URL}/admin/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
    print("Admin -> Admin Route:", res.status_code, res.json())
    
    # 9. Test Organiser accessing Organiser Route (Should succeed 200)
    res = requests.get(f"{BASE_URL}/organiser/dashboard", headers={"Authorization": f"Bearer {org_token}"})
    print("Organiser -> Organiser Route:", res.status_code, res.json())

if __name__ == "__main__":
    test_auth_flow()
