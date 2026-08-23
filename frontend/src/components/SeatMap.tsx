import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

interface SeatStatus {
  seat_id: string;
  row: string;
  col: number;
  category_name: string;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  price: float;
}

export default function SeatMap() {
  const { id: event_id } = useParams<{ id: string }>();
  const [seats, setSeats] = useState<SeatStatus[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 1. Fetch initial state
    fetch(`http://localhost:8000/events/${event_id}/seats`)
      .then(res => res.json())
      .then(data => setSeats(data))
      .catch(err => console.error(err));

    // 2. Open WebSocket for real-time updates
    const ws = new WebSocket(`ws://localhost:8000/ws/events/${event_id}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // data: { seat_id: string, status: string }
      setSeats(prevSeats => 
        prevSeats.map(seat => 
          seat.seat_id === data.seat_id 
            ? { ...seat, status: data.status as any }
            : seat
        )
      );
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [event_id]);

  // Group seats by row
  const rows = Array.from(new Set(seats.map(s => s.row))).sort();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Select Seats</h1>
      
      <div className="flex flex-col items-center">
        {/* Screen / Stage indicator */}
        <div className="w-full max-w-2xl bg-gray-300 text-center py-2 text-sm text-gray-700 font-semibold mb-12 shadow-inner rounded-b-xl border-t-4 border-gray-400">
          STAGE
        </div>

        {/* Seat Grid */}
        <div className="space-y-4">
          {rows.map(rowLabel => {
            const rowSeats = seats.filter(s => s.row === rowLabel).sort((a, b) => a.col - b.col);
            return (
              <div key={rowLabel} className="flex items-center space-x-4">
                <div className="w-8 text-center font-bold text-gray-500">{rowLabel}</div>
                <div className="flex space-x-2">
                  {rowSeats.map(seat => {
                    let bgColor = "bg-green-500 hover:bg-green-600 cursor-pointer";
                    if (seat.status === "HELD") bgColor = "bg-yellow-400 cursor-not-allowed";
                    if (seat.status === "BOOKED") bgColor = "bg-gray-400 cursor-not-allowed";
                    if (seat.category_name === "Premium" && seat.status === "AVAILABLE") {
                       bgColor = "bg-purple-500 hover:bg-purple-600 cursor-pointer";
                    }

                    return (
                      <div 
                        key={seat.seat_id}
                        title={`${seat.category_name} - $${seat.price} (${seat.status})`}
                        className={`w-10 h-10 rounded-t-lg flex items-center justify-center text-white text-xs font-bold transition-colors shadow-sm ${bgColor}`}
                        onClick={() => {
                           if(seat.status === 'AVAILABLE') {
                               alert(`Seat ${seat.row}${seat.col} selected. Hold API call goes here.`);
                           }
                        }}
                      >
                        {seat.col}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-12 flex justify-center space-x-6 text-sm text-gray-700">
        <div className="flex items-center space-x-2"><div className="w-4 h-4 bg-green-500 rounded-sm"></div><span>Available (Standard)</span></div>
        <div className="flex items-center space-x-2"><div className="w-4 h-4 bg-purple-500 rounded-sm"></div><span>Available (Premium)</span></div>
        <div className="flex items-center space-x-2"><div className="w-4 h-4 bg-yellow-400 rounded-sm"></div><span>Held</span></div>
        <div className="flex items-center space-x-2"><div className="w-4 h-4 bg-gray-400 rounded-sm"></div><span>Booked</span></div>
      </div>
    </div>
  );
}
