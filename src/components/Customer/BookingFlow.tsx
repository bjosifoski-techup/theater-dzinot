import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Play, Performance, Seat } from '../../types/database';
import { SeatMap } from './SeatMap';
import { ArrowLeft, Calendar, Clock, MapPin, CreditCard, Loader, CheckCircle } from 'lucide-react';
import { generateTicketPDF } from '../../lib/pdfGenerator';

interface BookingFlowProps {
  playId: string;
  onBack: () => void;
}

export function BookingFlow({ playId, onBack }: BookingFlowProps) {
  const { user } = useAuth();
  const [play, setPlay] = useState<Play | null>(null);
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [selectedPerformance, setSelectedPerformance] = useState<Performance | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [step, setStep] = useState<'performance' | 'seats' | 'details' | 'payment' | 'success'>('performance');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [bookingReference, setBookingReference] = useState('');

  const MAX_SEATS = 10;
  const BOOKING_FEE_PERCENTAGE = 2.5;

  useEffect(() => {
    loadPlayAndPerformances();
  }, [playId]);

  useEffect(() => {
    if (selectedPerformance && selectedSeats.length > 0) {
      loadSeatDetails();
    }
  }, [selectedSeats]);

  const loadPlayAndPerformances = async () => {
    const { data: playData } = await supabase
      .from('plays')
      .select('*')
      .eq('id', playId)
      .maybeSingle();

    if (playData) {
      setPlay(playData);
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: performancesData } = await supabase
      .from('performances')
      .select('*, venue:venues(*)')
      .eq('play_id', playId)
      .gte('performance_date', today)
      .in('status', ['scheduled'])
      .order('performance_date')
      .order('performance_time');

    if (performancesData) {
      setPerformances(performancesData);
    }
    setLoading(false);
  };

  const loadSeatDetails = async () => {
    const { data } = await supabase
      .from('seats')
      .select('*')
      .in('id', selectedSeats);

    if (data) {
      setSeats(data);
    }
  };

  const handleSeatToggle = async (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      await supabase
        .from('cart_reservations')
        .delete()
        .eq('session_id', sessionId)
        .eq('seat_id', seatId);
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      const reservedUntil = new Date();
      reservedUntil.setMinutes(reservedUntil.getMinutes() + 10);

      await supabase.from('cart_reservations').insert({
        session_id: sessionId,
        performance_id: selectedPerformance!.id,
        seat_id: seatId,
        user_id: user?.id || null,
        reserved_until: reservedUntil.toISOString(),
      });
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const calculateTotals = () => {
    const subtotal = seats.length * (selectedPerformance?.base_price || 0);
    const bookingFee = subtotal * (BOOKING_FEE_PERCENTAGE / 100);
    const total = subtotal + bookingFee;
    return { subtotal, bookingFee, total };
  };

  const handleProceedToDetails = () => {
    if (selectedSeats.length === 0) return;
    setStep('details');
  };

  const handleProceedToPayment = () => {
    if (!customerName || !customerEmail) return;
    setStep('payment');
  };

  const handleCompleteBooking = async () => {
    setProcessing(true);

    try {
      const { subtotal, bookingFee, total } = calculateTotals();

      const { data: bookingData, error: bookingError } = await supabase.rpc(
        'generate_booking_reference'
      );

      if (bookingError) throw bookingError;
      const reference = bookingData;

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          booking_reference: reference,
          performance_id: selectedPerformance!.id,
          user_id: user?.id || null,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
          total_seats: selectedSeats.length,
          subtotal,
          discount_amount: 0,
          total_amount: total,
          booking_fee: bookingFee,
          status: 'confirmed',
          booked_by_user_id: user?.id || null,
          booking_method: 'online',
        })
        .select()
        .single();

      if (error) throw error;

      const { data: venueData } = await supabase
        .from('venues')
        .select('address')
        .eq('id', selectedPerformance!.venue_id)
        .single();

      const ticketsData = [];

      for (const seatId of selectedSeats) {
        const { error: seatError } = await supabase.from('booking_seats').insert({
          booking_id: booking.id,
          seat_id: seatId,
          price: selectedPerformance!.base_price,
        });

        if (seatError) {
          console.error('Error creating booking seat:', seatError);
          throw new Error(`Failed to create booking seat: ${seatError.message}`);
        }

        const { data: ticketCode, error: ticketCodeError } = await supabase.rpc('generate_ticket_code');

        if (ticketCodeError) {
          console.error('Error generating ticket code:', ticketCodeError);
          throw new Error(`Failed to generate ticket code: ${ticketCodeError.message}`);
        }

        const { error: ticketError } = await supabase.from('tickets').insert({
          booking_id: booking.id,
          seat_id: seatId,
          ticket_code: ticketCode,
          barcode_data: `${reference}-${seatId}`,
        });

        if (ticketError) {
          console.error('Error creating ticket:', ticketError);
          throw new Error(`Failed to create ticket: ${ticketError.message}`);
        }

        const { data: seatData } = await supabase
          .from('seats')
          .select('row_label, seat_number')
          .eq('id', seatId)
          .single();

        if (seatData) {
          ticketsData.push({
            ticketCode: ticketCode,
            seatRow: seatData.row_label,
            seatNumber: seatData.seat_number,
            price: selectedPerformance!.base_price,
          });

          const ticketPdfBlob = await generateTicketPDF({
            ticketCode: ticketCode,
            bookingReference: reference,
            customerName,
            playTitle: play!.title,
            playSubtitle: play!.subtitle || '',
            performanceDate: selectedPerformance!.performance_date,
            performanceTime: selectedPerformance!.performance_time,
            venueName: selectedPerformance!.venue?.name || '',
            venueAddress: venueData?.address || '',
            seatRow: seatData.row_label,
            seatNumber: seatData.seat_number,
            price: selectedPerformance!.base_price,
          });

          const fileName = `${user?.id || 'guest'}/${booking.id}/${ticketCode}.pdf`;
          await supabase.storage
            .from('tickets')
            .upload(fileName, ticketPdfBlob, {
              contentType: 'application/pdf',
              upsert: true,
            });
        }
      }

      const { error: paymentError } = await supabase.from('payments').insert({
        booking_id: booking.id,
        amount: total,
        payment_method: 'credit_card',
        payment_status: 'completed',
        transaction_id: `TXN-${Date.now()}`,
        processed_at: new Date().toISOString(),
      });

      if (paymentError) {
        console.error('Error creating payment:', paymentError);
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();

        const emailData = {
          bookingReference: reference,
          customerName,
          customerEmail,
          playTitle: play!.title,
          playSubtitle: play!.subtitle || '',
          performanceDate: selectedPerformance!.performance_date,
          performanceTime: selectedPerformance!.performance_time,
          venueName: selectedPerformance!.venue?.name || '',
          venueAddress: venueData?.address || '',
          seats: seats.map(s => ({
            row: s.row_label,
            number: s.seat_number,
            price: selectedPerformance!.base_price,
          })),
          totalAmount: total,
          bookingFee,
          tickets: ticketsData,
        };

        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-booking-confirmation`;

        await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }

      await supabase
        .from('cart_reservations')
        .delete()
        .eq('session_id', sessionId);

      setBookingReference(reference);
      setStep('success');
    } catch (error) {
      console.error('Booking error:', error);
      alert(`Failed to complete booking: ${error instanceof Error ? error.message : 'Unknown error'}. Please contact support.`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!play) {
    return <div>Play not found</div>;
  }

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Booking Confirmed!</h2>
          <p className="text-lg text-slate-600 mb-2">
            Your booking reference: <span className="font-mono font-bold text-blue-600">{bookingReference}</span>
          </p>
          <p className="text-slate-600 mb-6">
            A confirmation email has been sent to {customerEmail} with your tickets.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Plays</span>
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start space-x-4 mb-6">
          {play.poster_url && (
            <img src={play.poster_url} alt={play.title} className="w-32 h-48 object-cover rounded" />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{play.title}</h1>
            {play.subtitle && <p className="text-lg text-slate-600 mb-3">{play.subtitle}</p>}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {play.genre}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                {play.duration_minutes} min
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                {play.age_rating}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2 mb-6 border-b border-slate-200">
          <button
            className={`px-4 py-2 font-medium ${
              step === 'performance'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500'
            }`}
          >
            1. Select Performance
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              step === 'seats'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500'
            }`}
          >
            2. Choose Seats
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              step === 'details'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500'
            }`}
          >
            3. Your Details
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              step === 'payment'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500'
            }`}
          >
            4. Payment
          </button>
        </div>

        {step === 'performance' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Select a Performance</h2>
            {performances.length === 0 ? (
              <p className="text-slate-600">No upcoming performances available.</p>
            ) : (
              performances.map(perf => (
                <button
                  key={perf.id}
                  onClick={() => {
                    setSelectedPerformance(perf);
                    setStep('seats');
                  }}
                  className="w-full p-4 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-slate-600" />
                          <span className="font-medium">
                            {new Date(perf.performance_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-slate-600" />
                          <span className="font-medium">{perf.performance_time}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4" />
                        <span>{perf.venue?.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">${perf.base_price}</p>
                      <p className="text-sm text-slate-600">per seat</p>
                      {perf.available_seats !== null && (
                        <p className="text-sm text-slate-500 mt-1">
                          {perf.available_seats} seats left
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {step === 'seats' && selectedPerformance && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Select Your Seats</h2>
              <div className="text-right">
                <p className="text-sm text-slate-600">Selected: {selectedSeats.length} / {MAX_SEATS}</p>
                <p className="text-lg font-bold text-slate-900">
                  Total: ${(selectedSeats.length * selectedPerformance.base_price).toFixed(2)}
                </p>
              </div>
            </div>

            <SeatMap
              performanceId={selectedPerformance.id}
              selectedSeats={selectedSeats}
              onSeatToggle={handleSeatToggle}
              maxSeats={MAX_SEATS}
            />

            <button
              onClick={handleProceedToDetails}
              disabled={selectedSeats.length === 0}
              className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Details
            </button>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Your Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <button
              onClick={handleProceedToPayment}
              disabled={!customerName || !customerEmail}
              className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Payment
            </button>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Payment</h2>

            <div className="bg-slate-50 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-slate-900 mb-4">Booking Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Seats ({selectedSeats.length})</span>
                <span className="font-medium">${calculateTotals().subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Booking Fee ({BOOKING_FEE_PERCENTAGE}%)</span>
                <span className="font-medium">${calculateTotals().bookingFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-300 pt-3 flex justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-slate-900 text-lg">
                  ${calculateTotals().total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
              <CreditCard className="w-5 h-5 inline-block mr-2" />
              Payment processing is simulated for this demo. Click below to complete your booking.
            </div>

            <button
              onClick={handleCompleteBooking}
              disabled={processing}
              className="w-full py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Complete Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
