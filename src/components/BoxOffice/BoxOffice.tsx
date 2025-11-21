import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Performance, Booking } from '../../types/database';
import { Search, Ticket, Calendar, CheckCircle, Loader } from 'lucide-react';

export function BoxOffice() {
  const { user } = useAuth();
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data: perfs } = await supabase
      .from('performances')
      .select('*, play:plays(*), venue:venues(*)')
      .gte('performance_date', today)
      .order('performance_date')
      .order('performance_time')
      .limit(10);

    if (perfs) setPerformances(perfs);

    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, performance:performances(*, play:plays(*))')
      .eq('booking_method', 'box_office')
      .order('created_at', { ascending: false })
      .limit(10);

    if (bookings) setRecentBookings(bookings);
    setLoading(false);
  };

  const handleCheckIn = async (bookingReference: string) => {
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*, booking:bookings(*)')
      .eq('booking.booking_reference', bookingReference);

    if (tickets && tickets.length > 0) {
      for (const ticket of tickets) {
        await supabase
          .from('tickets')
          .update({
            is_checked_in: true,
            checked_in_at: new Date().toISOString(),
            checked_in_by: user?.id,
          })
          .eq('id', ticket.id);
      }

      await supabase
        .from('bookings')
        .update({ status: 'checked_in' })
        .eq('booking_reference', bookingReference);

      alert(`Booking ${bookingReference} checked in successfully!`);
      loadData();
    } else {
      alert('Booking not found');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Box Office</h1>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search booking by reference number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => handleCheckIn(searchTerm)}
              className="mt-3 w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Check In Booking</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <Ticket className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-sm text-blue-600 font-medium">Today's Performances</p>
            <p className="text-3xl font-bold text-blue-900">{performances.filter(p => p.performance_date === new Date().toISOString().split('T')[0]).length}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <Calendar className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm text-green-600 font-medium">Upcoming Shows</p>
            <p className="text-3xl font-bold text-green-900">{performances.length}</p>
          </div>

          <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
            <CheckCircle className="w-8 h-8 text-amber-600 mb-2" />
            <p className="text-sm text-amber-600 font-medium">Recent Bookings</p>
            <p className="text-3xl font-bold text-amber-900">{recentBookings.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Upcoming Performances</h2>
        <div className="space-y-4">
          {performances.map((perf) => (
            <div key={perf.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{perf.play?.title}</h3>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-slate-600">
                    <span>{new Date(perf.performance_date).toLocaleDateString()}</span>
                    <span>{perf.performance_time}</span>
                    <span>{perf.venue?.name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">${perf.base_price}</p>
                  <p className="text-sm text-slate-600">
                    {perf.available_seats || 0} seats available
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Recent Bookings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Reference</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Play</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Seats</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Total</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-mono text-slate-900">{booking.booking_reference}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{booking.customer_name}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{booking.performance?.play?.title}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{booking.total_seats}</td>
                  <td className="px-4 py-3 text-sm text-slate-900 font-medium">${booking.total_amount}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'checked_in' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
