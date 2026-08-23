import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api";

interface Event {
  id: string;
  title: string;
  description: string;
  date_time: string;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/events`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
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
    <div className="flex-grow flex flex-col">
      {/* Hero Section */}
      <div className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-900 border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 to-teal-900/40 mix-blend-multiply"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400">Live Events</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-300">
            Secure your spot instantly with our real-time, concurrency-safe ticketing platform. No double-bookings, ever.
          </p>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold text-white">Upcoming Events</h2>
          <div className="h-px bg-slate-800 flex-grow ml-8 hidden sm:block"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <div 
              key={event.id} 
              className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-slate-700 transition-all duration-300 flex flex-col"
            >
              {/* Event Image Placeholder */}
              <div className="h-48 bg-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-teal-500/20 mix-blend-overlay group-hover:scale-105 transition-transform duration-500"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-slate-600 text-6xl font-bold opacity-20">EVENT</span>
                </div>
              </div>
              
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                    {new Date(event.date_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">
                    {new Date(event.date_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors">
                  {event.title}
                </h2>
                <p className="text-slate-400 mb-6 line-clamp-3 text-sm flex-grow">
                  {event.description}
                </p>
                
                <Link
                  to={`/events/${event.id}`}
                  className="block w-full text-center bg-slate-800 text-white py-3 rounded-xl hover:bg-gradient-to-r hover:from-indigo-600 hover:to-teal-500 font-semibold shadow-lg hover:shadow-indigo-500/25 transition-all duration-300"
                >
                  Book Tickets
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        {events.length === 0 && (
          <div className="text-slate-500 text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
            <svg className="mx-auto h-12 w-12 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            No events scheduled at the moment.
          </div>
        )}
      </div>
    </div>
  );
}
