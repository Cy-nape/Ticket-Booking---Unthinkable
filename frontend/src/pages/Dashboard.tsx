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

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      <div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Manage your bookings and waitlist statuses.</p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          My Tickets
        </h2>
        
        {bookings.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 border-dashed">
            You don't have any bookings yet.
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-950/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Ref ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Event Details</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Seats</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-mono text-indigo-400 font-bold">{b.booking_ref}</td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-bold text-white">{b.event.title}</div>
                        <div className="text-xs text-slate-500 mt-1">{new Date(b.event.date_time).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-300">
                        {b.seats.map(s => (
                          <span key={s.id} className="inline-block bg-slate-800 px-2 py-1 rounded-md border border-slate-700 mr-2 mb-1 text-xs font-medium">
                            {s.row}{s.col} <span className="text-slate-500 ml-1">{s.category_name}</span>
                          </span>
                        ))}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-emerald-400">${b.total_amount.toFixed(2)}</td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                          b.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Waitlist Entries
        </h2>
        
        {waitlist.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 border-dashed">
            You are not on any waitlists.
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-950/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900">
                  {waitlist.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-bold text-white">{w.event.title}</div>
                        <div className="text-xs text-slate-500 mt-1">{new Date(w.event.date_time).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm">
                        <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded-md border border-slate-700 text-xs font-medium">
                          {w.category_name}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                          w.status === 'OFFERED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' : 
                          w.status === 'FULFILLED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-400">
                        {new Date(w.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
