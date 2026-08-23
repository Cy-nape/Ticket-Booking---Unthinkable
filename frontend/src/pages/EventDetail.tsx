import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { fetchWithAuth, API_URL, WS_URL } from "../api";
import { useAuth } from "../context/AuthContext";

interface Seat {
  id: string;
  row: string;
  col: number;
  category_name: string;
  status: string;
  price: number;
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const ws = useRef<WebSocket | null>(null);
  const { user } = useAuth();
  
  // Local state to track which seat we are actively holding
  const [heldSeatId, setHeldSeatId] = useState<string | null>(null);
  const [waitlistCategory, setWaitlistCategory] = useState<string>("");

  useEffect(() => {
    // 1. Fetch initial seats
    fetch(`${API_URL}/events/${id}/seats`)
      .then(res => res.json())
      .then(data => {
        setSeats(data);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch seats");
        setLoading(false);
      });

    // 2. Open WebSocket for live updates
    const socket = new WebSocket(`${WS_URL}/ws/events/${id}`);
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "SEAT_UPDATE") {
        setSeats(prev => prev.map(s => 
          s.id === msg.seat_id ? { ...s, status: msg.status } : s
        ));
      }
    };
    ws.current = socket;

    return () => {
      socket.close();
    };
  }, [id]);

  const handleSeatClick = async (seat: Seat) => {
    if (!user) {
      setError("Please login to book a seat.");
      return;
    }
    
    // We only allow holding one seat at a time in this simple UI
    if (heldSeatId && heldSeatId !== seat.id) {
      setError("You are already holding a seat. Complete or wait for it to expire.");
      return;
    }

    if (seat.status === "AVAILABLE") {
      try {
        setError("");
        await fetchWithAuth(`/events/${id}/hold`, {
          method: "POST",
          body: JSON.stringify({ seat_id: seat.id })
        });
        setHeldSeatId(seat.id);
        // Optimistic UI update; websocket will override anyway
        setSeats(prev => prev.map(s => s.id === seat.id ? { ...s, status: "HELD" } : s));
      } catch (err: any) {
        setError(err.message || "Failed to hold seat. Someone might have just taken it.");
      }
    }
  };

  const confirmBooking = async () => {
    if (!heldSeatId) return;
    try {
      setError("");
      const res = await fetchWithAuth(`/events/${id}/book`, {
        method: "POST",
        body: JSON.stringify({ seat_ids: [heldSeatId] })
      });
      if (res.qr_code_base64) {
        setQrCode(res.qr_code_base64);
      }
      setHeldSeatId(null);
    } catch (err: any) {
      setError(err.message || "Booking failed.");
    }
  };

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistCategory) return;
    try {
      setError("");
      await fetchWithAuth(`/events/${id}/waitlist`, {
        method: "POST",
        body: JSON.stringify({ category_name: waitlistCategory })
      });
      alert(`Successfully joined waitlist for ${waitlistCategory}`);
    } catch (err: any) {
      setError(err.message || "Waitlist failed.");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading event details...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Select Your Seat</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 mb-4 rounded">{error}</div>}
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 bg-white p-6 border border-gray-200 rounded">
           <div className="mb-6 h-12 bg-gray-200 flex items-center justify-center text-gray-500 font-bold rounded">
              STAGE
           </div>
           <div className="grid grid-cols-10 gap-2">
             {seats.map(seat => {
                let bgColor = "bg-green-500 hover:bg-green-600 cursor-pointer text-white";
                if (seat.status === "BOOKED") bgColor = "bg-gray-400 cursor-not-allowed text-gray-200";
                if (seat.status === "HELD") {
                    bgColor = "bg-yellow-400 cursor-not-allowed text-yellow-800";
                    // If we hold it, highlight it explicitly
                    if (seat.id === heldSeatId) {
                        bgColor = "bg-blue-500 text-white animate-pulse";
                    }
                }

                return (
                  <div
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    title={`${seat.category_name} - $${seat.price}`}
                    className={`h-10 w-10 flex items-center justify-center rounded text-xs font-bold transition-colors ${bgColor}`}
                  >
                    {seat.row}{seat.col}
                  </div>
                )
             })}
           </div>
           
           <div className="mt-8 flex gap-4 text-sm text-gray-600">
             <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded"></div> Available</div>
             <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-400 rounded"></div> Held</div>
             <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-400 rounded"></div> Booked</div>
             <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded"></div> Your Hold</div>
           </div>
        </div>

        <div className="w-full md:w-80 space-y-6">
          {heldSeatId && !qrCode && (
            <div className="bg-white p-6 border border-blue-200 rounded shadow-sm">
              <h3 className="text-xl font-bold mb-2">Confirm Purchase</h3>
              <p className="text-sm text-gray-600 mb-4">You have 10 minutes to complete this transaction before your hold expires.</p>
              <button 
                onClick={confirmBooking}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold"
              >
                Buy Now
              </button>
            </div>
          )}

          {qrCode && (
             <div className="bg-white p-6 border border-green-200 rounded shadow-sm text-center">
                <h3 className="text-xl font-bold text-green-600 mb-2">Success!</h3>
                <p className="text-sm text-gray-600 mb-4">Your booking is confirmed. Here is your ticket.</p>
                <img src={`data:image/png;base64,${qrCode}`} alt="Ticket QR Code" className="mx-auto w-48 h-48" />
             </div>
          )}

          <div className="bg-white p-6 border border-gray-200 rounded shadow-sm">
            <h3 className="text-xl font-bold mb-2">Waitlist</h3>
            <p className="text-sm text-gray-600 mb-4">If your desired category is sold out, join the waitlist.</p>
            <form onSubmit={handleWaitlist} className="flex gap-2">
              <select 
                className="flex-1 border border-gray-300 rounded px-2 py-1"
                value={waitlistCategory}
                onChange={(e) => setWaitlistCategory(e.target.value)}
                required
              >
                <option value="">Select Category</option>
                <option value="Premium">Premium</option>
                <option value="Standard">Standard</option>
                <option value="Balcony">Balcony</option>
              </select>
              <button type="submit" className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-900">
                Join
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
