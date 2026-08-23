import React, { useEffect, useState } from "react";
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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading events...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Upcoming Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white p-6 border border-gray-200 rounded shadow-sm hover:shadow-md transition">
            <h2 className="text-xl font-bold mb-2">{event.title}</h2>
            <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
            <p className="text-sm text-gray-500 mb-6">
              {new Date(event.date_time).toLocaleString()}
            </p>
            <Link
              to={`/events/${event.id}`}
              className="block w-full text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              View Seats
            </Link>
          </div>
        ))}
      </div>
      {events.length === 0 && (
        <div className="text-gray-500 text-center py-12">No events found.</div>
      )}
    </div>
  );
}
