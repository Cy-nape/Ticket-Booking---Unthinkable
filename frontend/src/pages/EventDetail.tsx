import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
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
  
  const [heldSeatId, setHeldSeatId] = useState<string | null>(null);
  const [waitlistCategory, setWaitlistCategory] = useState<string>("");

  useEffect(() => {
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
      setWaitlistCategory("");
    } catch (err: any) {
      setError(err.message || "Waitlist failed.");
    }
  };

  // Auto-dismiss errors after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="mb-8">
        <Link to="/" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Events
        </Link>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white">Select Your Seat</h1>
      </div>

      {/* Floating Error Toast */}
      {error && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-[bounce_0.5s_ease-out]">
          <div className="bg-slate-900/90 backdrop-blur-md border border-red-500/50 shadow-[0_10px_40px_rgba(239,68,68,0.2)] text-white px-6 py-4 rounded-2xl flex items-center gap-4 max-w-md w-max">
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center shrink-0 border border-red-500/30">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-red-400 text-sm mb-0.5">Action Failed</h4>
              <p className="text-sm text-slate-300">{error}</p>
            </div>
            <button onClick={() => setError("")} className="ml-auto text-slate-500 hover:text-white transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
      
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Seat Map */}
        <div className="flex-1 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
           
           {/* Stage Marker */}
           <div className="mb-12 relative h-16 bg-gradient-to-b from-indigo-500/20 to-transparent flex items-center justify-center rounded-t-3xl border-t-4 border-indigo-500 overflow-hidden">
              <div className="absolute inset-0 bg-indigo-500/10 blur-xl"></div>
              <span className="text-indigo-200 font-extrabold tracking-[0.3em] uppercase relative z-10 text-sm">Main Stage</span>
           </div>
           
           <div className="grid grid-cols-10 gap-3 justify-center mx-auto max-w-4xl">
             {seats.map(seat => {
                // Color Logic
                let bgColor = "bg-teal-500/20 border border-teal-500/50 text-teal-300 hover:bg-teal-500 hover:text-white cursor-pointer shadow-[0_0_15px_rgba(20,184,166,0.1)] hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]";
                
                if (seat.status === "BOOKED") {
                    bgColor = "bg-slate-800 border border-slate-700 text-slate-600 cursor-not-allowed opacity-50";
                }
                
                if (seat.status === "HELD") {
                    bgColor = "bg-amber-500/20 border border-amber-500/50 text-amber-400 cursor-not-allowed";
                    if (seat.id === heldSeatId) {
                        // User's active hold
                        bgColor = "bg-indigo-600 border border-indigo-400 text-white shadow-[0_0_25px_rgba(79,70,229,0.6)] animate-[pulse-fast_1.5s_ease-in-out_infinite]";
                    }
                }

                return (
                  <div
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    title={`${seat.category_name} - $${seat.price}`}
                    className={`h-12 w-12 flex items-center justify-center rounded-xl text-xs font-bold transition-all duration-300 ${bgColor}`}
                  >
                    {seat.row}{seat.col}
                  </div>
                )
             })}
           </div>
           
           {/* Legend */}
           <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm font-medium text-slate-400 bg-slate-950/50 py-4 px-6 rounded-2xl border border-slate-800">
             <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-teal-500/20 border border-teal-500/50 rounded-md"></div> Available
             </div>
             <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-500/20 border border-amber-500/50 rounded-md"></div> Held (Others)
             </div>
             <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-indigo-600 border border-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.6)] rounded-md"></div> Your Hold
             </div>
             <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-800 border border-slate-700 opacity-50 rounded-md"></div> Booked
             </div>
           </div>
        </div>

        {/* Action Panel */}
        <div className="w-full xl:w-96 space-y-6">
          
          {!heldSeatId && !qrCode && (
             <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center h-48 text-center">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm font-medium">Select an available seat on the map to begin your reservation.</p>
             </div>
          )}

          {heldSeatId && !qrCode && (
            <div className="bg-gradient-to-b from-indigo-900/50 to-slate-900 border border-indigo-500/30 p-8 rounded-3xl shadow-[0_0_30px_rgba(79,70,229,0.1)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
              <h3 className="text-2xl font-extrabold text-white mb-2">Confirm Purchase</h3>
              
              <div className="bg-slate-950/50 rounded-xl p-4 mb-6 border border-slate-800 flex items-center justify-between">
                 <span className="text-slate-400 text-sm">Time Remaining</span>
                 <span className="text-red-400 font-mono font-bold animate-pulse">10:00</span>
              </div>
              
              <p className="text-sm text-slate-300 mb-6">
                Your seat is temporarily locked. Please complete your transaction before the timer expires.
              </p>
              <button 
                onClick={confirmBooking}
                className="w-full bg-gradient-to-r from-indigo-600 to-teal-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all"
              >
                Buy Ticket Now
              </button>
            </div>
          )}

          {qrCode && (
             <div className="bg-emerald-900/20 border border-emerald-500/30 p-8 rounded-3xl shadow-[0_0_30px_rgba(16,185,129,0.1)] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/50">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-extrabold text-emerald-400 mb-2">Success!</h3>
                <p className="text-sm text-slate-300 mb-6">Your booking is confirmed. Scan the QR code below for entry.</p>
                
                <div className="bg-white p-4 rounded-2xl shadow-xl inline-block">
                  <img src={`data:image/png;base64,${qrCode}`} alt="Ticket QR Code" className="w-48 h-48" />
                </div>
                
                <Link to="/dashboard" className="block mt-6 text-emerald-400 hover:text-emerald-300 text-sm font-semibold transition-colors">
                  View in Dashboard &rarr;
                </Link>
             </div>
          )}

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2">Join Waitlist</h3>
            <p className="text-sm text-slate-400 mb-4">Sold out? Join the queue and we'll auto-assign a seat if one frees up.</p>
            <form onSubmit={handleWaitlist} className="flex flex-col gap-3">
              <select 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={waitlistCategory}
                onChange={(e) => setWaitlistCategory(e.target.value)}
                required
              >
                <option value="" disabled>Select Category</option>
                <option value="Premium">Premium</option>
                <option value="Standard">Standard</option>
                <option value="Balcony">Balcony</option>
              </select>
              <button type="submit" className="w-full bg-slate-800 text-white px-4 py-2.5 rounded-xl hover:bg-slate-700 transition-colors font-medium border border-slate-700">
                Join Queue
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
