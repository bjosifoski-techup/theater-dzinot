import { X, Download, Calendar, Clock, MapPin, Ticket as TicketIcon } from 'lucide-react';

interface TicketPreviewProps {
  ticket: {
    ticket_code: string;
    seat: {
      row_label: string;
      seat_number: string;
    };
    price: number;
  };
  booking: {
    booking_reference: string;
    customer_name: string;
  };
  performance: {
    performance_date: string;
    performance_time: string;
    play: {
      title: string;
      subtitle: string | null;
    };
    venue: {
      name: string;
      address: string;
    };
  };
  onClose: () => void;
  onDownload: () => void;
}

export function TicketPreview({ ticket, booking, performance, onClose, onDownload }: TicketPreviewProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Ticket Preview</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="border-4 border-blue-600 rounded-lg p-8 bg-gradient-to-br from-white to-blue-50">
            <div className="text-center mb-6">
              <div className="inline-block p-3 bg-blue-600 rounded-full mb-4">
                <TicketIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-2">THEATER BOX</h3>
              <div className="w-24 h-1 bg-blue-600 mx-auto rounded"></div>
            </div>

            <div className="text-center mb-6">
              <h4 className="text-2xl font-bold text-slate-900 mb-2">
                {performance.play.title}
              </h4>
              {performance.play.subtitle && (
                <p className="text-lg text-slate-600">{performance.play.subtitle}</p>
              )}
            </div>

            <div className="border-t-2 border-dashed border-slate-300 my-6"></div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3 text-slate-700">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Date</p>
                  <p className="font-semibold">{formatDate(performance.performance_date)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-700">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Time</p>
                  <p className="font-semibold">{performance.performance_time}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-700">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Venue</p>
                  <p className="font-semibold">{performance.venue.name}</p>
                  <p className="text-sm text-slate-600">{performance.venue.address}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 rounded-lg p-6 text-center mb-6">
              <p className="text-blue-200 text-sm font-medium mb-2">Your Seat</p>
              <p className="text-white text-3xl font-bold">
                Row {ticket.seat.row_label} - Seat {ticket.seat.seat_number}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Customer</p>
                <p className="font-semibold text-slate-900">{booking.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Price</p>
                <p className="font-semibold text-slate-900">{ticket.price.toFixed(2)} MKD</p>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-slate-300 my-6"></div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Ticket Code</p>
                <p className="font-mono font-bold text-slate-900">{ticket.ticket_code}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Booking Reference</p>
                <p className="font-mono font-bold text-slate-900">{booking.booking_reference}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                Please arrive 15 minutes before the performance. This ticket is valid for one person only.
              </p>
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={onDownload}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-md font-medium hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
