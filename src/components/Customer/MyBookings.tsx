import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MapPin, Ticket, Loader, Mail, Phone, User, Download, Eye } from 'lucide-react';
import { AllTicketsViewer } from './AllTicketsViewer';

interface Booking {
  id: string;
  booking_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total_seats: number;
  total_amount: number;
  status: string;
  created_at: string;
  performance: {
    id: string;
    performance_date: string;
    performance_time: string;
    base_price: number;
    play: {
      title: string;
      subtitle: string | null;
      poster_url: string | null;
      genre: string;
    };
    venue: {
      name: string;
      address: string;
    };
  };
  booking_seats: Array<{
    id: string;
    price: number;
    seat: {
      row_label: string;
      seat_number: string;
    };
  }>;
  tickets: Array<{
    id: string;
    ticket_code: string;
    seat_id: string;
  }>;
}

export function MyBookings() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingTickets, setDownloadingTickets] = useState<string | null>(null);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          performance:performances (
            id,
            performance_date,
            performance_time,
            base_price,
            venue_id,
            play:plays (
              title,
              subtitle,
              poster_url,
              genre
            ),
            venue:venues (
              name,
              address
            )
          ),
          booking_seats (
            id,
            price,
            seat:seats (
              row_label,
              seat_number
            )
          ),
          tickets (
            id,
            ticket_code,
            seat_id
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadSingleTicket = async (ticketCode: string, bookingId: string) => {
    try {
      const fileName = `${user?.id || 'guest'}/${bookingId}/${ticketCode}.pdf`;

      const { data, error } = await supabase.storage
        .from('tickets')
        .download(fileName);

      if (error) {
        console.error('Error downloading ticket from storage:', error);
        throw error;
      }

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ticket_${ticketCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading ticket:', error);
      alert('Failed to download ticket. Please try again.');
    }
  };

  const downloadAllTickets = async (booking: Booking) => {
    setDownloadingTickets(booking.id);
    try {
      for (const ticket of booking.tickets) {
        await downloadSingleTicket(ticket.ticket_code, booking.id);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error downloading tickets:', error);
    } finally {
      setDownloadingTickets(null);
    }
  };

  const viewTickets = (booking: Booking) => {
    setViewingBooking(booking);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          statusColors[status] || 'bg-slate-100 text-slate-800'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('myBookings.noBookings')}</h2>
        <p className="text-slate-600 mb-6">
          {t('myBookings.noBookingsMessage')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">{t('myBookings.title')}</h1>
        <p className="text-slate-600">{bookings.length} {bookings.length === 1 ? t('plays.play') : t('plays.plays')}</p>
      </div>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="flex">
              {booking.performance.play.poster_url && (
                <div className="w-32 flex-shrink-0">
                  <img
                    src={booking.performance.play.poster_url}
                    alt={booking.performance.play.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">
                      {booking.performance.play.title}
                    </h3>
                    {booking.performance.play.subtitle && (
                      <p className="text-sm text-slate-600 mb-2">
                        {booking.performance.play.subtitle}
                      </p>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {booking.performance.play.genre}
                      </span>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600 mb-1">{t('myBookings.bookingReference')}</p>
                    <p className="font-mono font-bold text-lg text-blue-600">
                      {booking.booking_reference}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-200">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-slate-700">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>
                        {new Date(booking.performance.performance_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-700">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>{booking.performance.performance_time}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>{booking.performance.venue.name}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-slate-700">
                      <User className="w-4 h-4 text-slate-500" />
                      <span>{booking.customer_name}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-700">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span>{booking.customer_email}</span>
                    </div>
                    {booking.customer_phone && (
                      <div className="flex items-center space-x-2 text-sm text-slate-700">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <span>{booking.customer_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-xs text-slate-600">Seats</p>
                      <p className="font-semibold text-slate-900">
                        {booking.booking_seats
                          .map((bs) => `${bs.seat.row_label}${bs.seat.seat_number}`)
                          .join(', ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">{t('myBookings.totalSeats')}</p>
                      <p className="font-semibold text-slate-900">{booking.total_seats}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">{t('myBookings.totalAmount')}</p>
                    <p className="text-2xl font-bold text-slate-900">
                      ${Number(booking.total_amount).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    {t('myBookings.bookedOn')}{' '}
                    {new Date(booking.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => viewTickets(booking)}
                      className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-md font-medium hover:bg-slate-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{t('myBookings.viewTickets')}</span>
                    </button>
                    <button
                      onClick={() => downloadAllTickets(booking)}
                      disabled={downloadingTickets === booking.id}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingTickets === booking.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>{t('myBookings.downloading')}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>{t('myBookings.downloadAll')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {viewingBooking && (
        <AllTicketsViewer
          tickets={viewingBooking.booking_seats.map((bs, index) => ({
            ticket_code: viewingBooking.tickets[index]?.ticket_code || '',
            seat_id: viewingBooking.tickets[index]?.seat_id || '',
            seat: bs.seat,
            price: bs.price,
          }))}
          booking={{
            id: viewingBooking.id,
            booking_reference: viewingBooking.booking_reference,
            customer_name: viewingBooking.customer_name,
          }}
          performance={{
            performance_date: viewingBooking.performance.performance_date,
            performance_time: viewingBooking.performance.performance_time,
            play: {
              title: viewingBooking.performance.play.title,
              subtitle: viewingBooking.performance.play.subtitle,
            },
            venue: {
              name: viewingBooking.performance.venue.name,
              address: viewingBooking.performance.venue.address,
            },
          }}
          onClose={() => setViewingBooking(null)}
          onDownload={(ticketCode) => downloadSingleTicket(ticketCode, viewingBooking.id)}
          onDownloadAll={() => {
            downloadAllTickets(viewingBooking);
            setViewingBooking(null);
          }}
        />
      )}
    </div>
  );
}
