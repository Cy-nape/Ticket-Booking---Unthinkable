import asyncio
import websockets
import json
import requests
import threading
import time

BASE_URL = "http://localhost:8000"

async def ws_client(client_id, event_id):
    uri = f"ws://localhost:8000/ws/events/{event_id}"
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Client {client_id} connected to {uri}")
            while True:
                message = await websocket.recv()
                print(f"Client {client_id} received: {message}")
    except asyncio.CancelledError:
        pass

def trigger_debug(event_id, seat_id):
    time.sleep(2) # wait for ws connections
    print("Triggering debug hold...")
    res = requests.post(f"{BASE_URL}/events/{event_id}/debug/hold", json={"seat_id": seat_id, "status": "HELD"})
    print("Trigger response:", res.status_code)

async def main():
    # 1. Fetch an event ID
    res = requests.get(f"{BASE_URL}/events")
    events = res.json()
    if not events:
        print("No events found.")
        return
    event_id = events[0]["id"]
    
    # 2. Fetch seats to get a valid seat_id
    res = requests.get(f"{BASE_URL}/events/{event_id}/seats")
    seats = res.json()
    if not seats:
        print("No seats found.")
        return
    seat_id = seats[0]["seat_id"]
    
    # 3. Start WS clients
    task1 = asyncio.create_task(ws_client(1, event_id))
    task2 = asyncio.create_task(ws_client(2, event_id))
    
    # 4. Trigger the hold in a separate thread
    threading.Thread(target=trigger_debug, args=(event_id, seat_id)).start()
    
    await asyncio.sleep(4)
    task1.cancel()
    task2.cancel()
    print("Test finished.")

if __name__ == "__main__":
    asyncio.run(main())
