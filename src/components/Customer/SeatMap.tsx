import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Seat, Performance } from '../../types/database';
import { Eye, Loader, CircleDot } from 'lucide-react';

interface SeatMapProps {
  performanceId: string;
  selectedSeats: string[];
  onSeatToggle: (seatId: string) => void;
  maxSeats: number;
}

interface SeatWithStatus extends Seat {
  isBooked: boolean;
  isReserved: boolean;
  section_name?: string;
}

export function SeatMap({ performanceId, selectedSeats, onSeatToggle, maxSeats }: SeatMapProps) {
  const [seats, setSeats] = useState<SeatWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<Performance | null>(null);

  useEffect(() => {
    loadSeatsAndPerformance();
  }, [performanceId]);

  const loadSeatsAndPerformance = async () => {
    const { data: perfData } = await supabase
      .from('performances')
      .select('*, venue:venues(*)')
      .eq('id', performanceId)
      .maybeSingle();

    if (perfData) {
      setPerformance(perfData);

      const { data: seatsData } = await supabase
        .from('seats')
        .select(`
          *,
          section:seat_sections(name)
        `)
        .eq('venue_id', perfData.venue_id)
        .eq('is_available', true)
        .order('row_label')
        .order('seat_number');

      const { data: bookedSeats } = await supabase
        .from('tickets')
        .select('seat_id, booking:bookings!inner(performance_id, status)')
        .eq('booking.performance_id', performanceId)
        .in('booking.status', ['confirmed', 'checked_in']);

      const { data: reservedSeats } = await supabase
        .from('cart_reservations')
        .select('seat_id')
        .eq('performance_id', performanceId)
        .gt('reserved_until', new Date().toISOString());

      const bookedSeatIds = new Set(bookedSeats?.map(bs => bs.seat_id) || []);
      const reservedSeatIds = new Set(reservedSeats?.map(rs => rs.seat_id) || []);

      const seatsWithStatus: SeatWithStatus[] = (seatsData || []).map(seat => ({
        ...seat,
        isBooked: bookedSeatIds.has(seat.id),
        isReserved: reservedSeatIds.has(seat.id),
        section_name: seat.section?.name,
      })).sort((a, b) => {
        if (a.row_label !== b.row_label) {
          return a.row_label.localeCompare(b.row_label);
        }
        const seatNumA = parseInt(a.seat_number) || 0;
        const seatNumB = parseInt(b.seat_number) || 0;
        return seatNumA - seatNumB;
      });

      setSeats(seatsWithStatus);
    }
    setLoading(false);
  };

  const getSeatColor = (seat: SeatWithStatus): string => {
    if (seat.isBooked) return 'bg-slate-400 cursor-not-allowed';
    if (seat.isReserved && !selectedSeats.includes(seat.id)) return 'bg-slate-300 cursor-not-allowed';
    if (selectedSeats.includes(seat.id)) return 'bg-amber-500 hover:bg-amber-600';
    return 'bg-green-500 hover:bg-green-600';
  };

  const canSelectSeat = (seat: SeatWithStatus): boolean => {
    if (seat.isBooked) return false;
    if (seat.isReserved && !selectedSeats.includes(seat.id)) return false;
    if (!selectedSeats.includes(seat.id) && selectedSeats.length >= maxSeats) return false;
    return true;
  };

  const handleSeatClick = (seat: SeatWithStatus) => {
    if (canSelectSeat(seat) || selectedSeats.includes(seat.id)) {
      onSeatToggle(seat.id);
    }
  };

  const groupedSeats = seats.reduce((acc, seat) => {
    if (!acc[seat.row_label]) {
      acc[seat.row_label] = [];
    }
    acc[seat.row_label].push(seat);
    return acc;
  }, {} as Record<string, SeatWithStatus[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 text-white text-center py-4 rounded-t-lg">
        <p className="text-lg font-semibold">STAGE</p>
      </div>

      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-green-500 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-amber-500 rounded"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-slate-400 rounded"></div>
          <span>Unavailable</span>
        </div>
        <div className="flex items-center space-x-2">
          <CircleDot className="w-6 h-6 text-blue-600" />
          <span>Wheelchair</span>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 space-y-4">
        {Object.entries(groupedSeats).map(([row, rowSeats]) => (
          <div key={row} className="flex items-center justify-center space-x-2">
            <div className="w-8 text-center font-semibold text-slate-700">{row}</div>
            <div className="flex space-x-1">
              {rowSeats.map(seat => (
                <button
                  key={seat.id}
                  onClick={() => handleSeatClick(seat)}
                  disabled={!canSelectSeat(seat) && !selectedSeats.includes(seat.id)}
                  className={`relative w-10 h-10 rounded ${getSeatColor(seat)} text-white text-xs font-medium transition-all duration-200 transform hover:scale-110 disabled:hover:scale-100 disabled:opacity-60`}
                  title={`Row ${seat.row_label}, Seat ${seat.seat_number}${seat.is_wheelchair_accessible ? ' (Wheelchair Accessible)' : ''}${seat.is_restricted_view ? ' (Restricted View)' : ''}`}
                >
                  {seat.seat_number}
                  {seat.is_wheelchair_accessible && (
                    <CircleDot className="absolute -top-1 -right-1 w-3 h-3 text-blue-600 bg-white rounded-full p-0.5" />
                  )}
                  {seat.is_restricted_view && (
                    <Eye className="absolute -bottom-1 -right-1 w-3 h-3 text-orange-600 bg-white rounded-full p-0.5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedSeats.length >= maxSeats && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
          Maximum of {maxSeats} seats reached. Deselect a seat to choose a different one.
        </div>
      )}
    </div>
  );
}
