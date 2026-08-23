import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../api';

interface Event {
  id: string;
  title: string;
  description: string;
  date_time: string;
}

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/events`)
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Upcoming Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <div key={event.id} className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-xl font-bold mb-2">{event.title}</h2>
            <p className="text-gray-600 text-sm mb-4">{new Date(event.date_time).toLocaleString()}</p>
            <p className="text-gray-800 mb-6">{event.description}</p>
            <Link 
              to={`/events/${event.id}/seats`}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Select Seats
            </Link>
          </div>
        ))}
      </div>
      {events.length === 0 && <p className="text-gray-500">No events found.</p>}
    </div>
  );
}
