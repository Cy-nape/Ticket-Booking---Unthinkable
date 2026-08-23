import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../api";

interface Booking {
  id: string;
  booking_ref: string;
  event: { id: string; title: string; date_time: string };
  seats: { id: string; row: string; col: number; category_name: string; price: number }[];
  total_amount: number;
  status: string;
  created_at: string;
}

interface Waitlist {
  id: string;
  event: { id: string; title: string; date_time: string };
  category_name: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [waitlist, setWaitlist] = useState<Waitlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchWithAuth("/users/me/bookings"),
      fetchWithAuth("/users/me/waitlist"),
    ])
      .then(([bookingsData, waitlistData]) => {
        setBookings(bookingsData);
        setWaitlist(waitlistData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <section>
        <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-gray-500">You have no bookings.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{b.booking_ref}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{b.event.title}</div>
                      <div className="text-xs text-gray-400">{new Date(b.event.date_time).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {b.seats.map(s => `${s.row}${s.col} (${s.category_name})`).join(", ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${b.total_amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${b.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Waitlist Entries</h2>
        {waitlist.length === 0 ? (
          <p className="text-gray-500">You are not on any waitlists.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {waitlist.map((w) => (
                  <tr key={w.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{w.event.title}</div>
                      <div className="text-xs text-gray-400">{new Date(w.event.date_time).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{w.category_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                       <span className={`px-2 py-1 rounded text-xs font-bold ${w.status === 'OFFERED' ? 'bg-yellow-100 text-yellow-800' : w.status === 'FULFILLED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(w.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
