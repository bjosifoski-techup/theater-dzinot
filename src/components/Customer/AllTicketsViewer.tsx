import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Ticket as TicketIcon } from 'lucide-react';
import QRCode from 'qrcode';

interface Ticket {
  ticket_code: string;
  seat_id: string;
  seat: {
    row_label: string;
    seat_number: string;
  };
  price: number;
}

interface AllTicketsViewerProps {
  tickets: Ticket[];
  booking: {
    id: string;
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
  onDownload: (ticketCode: string) => void;
  onDownloadAll: () => void;
}

export function AllTicketsViewer({ tickets, booking, performance, onClose, onDownload, onDownloadAll }: AllTicketsViewerProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : tickets.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < tickets.length - 1 ? prev + 1 : 0));
  };

  const currentTicket = tickets[currentIndex];

  useEffect(() => {
    const generateQR = async () => {
      const qrData = JSON.stringify({
        ticketCode: currentTicket.ticket_code,
        bookingReference: booking.booking_reference,
        customerName: booking.customer_name,
        playTitle: performance.play.title,
        performanceDate: performance.performance_date,
        performanceTime: performance.performance_time,
        seatRow: currentTicket.seat.row_label,
        seatNumber: currentTicket.seat.seat_number,
      });

      const url = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1e40af',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(url);
    };

    generateQR();
  }, [currentIndex, currentTicket, booking, performance]);

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
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">{t('ticket.yourTickets')}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {tickets.length > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-4">
              <button
                onClick={handlePrevious}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <span className="text-sm font-medium text-slate-600">
                {t('ticket.ticketOf', { current: currentIndex + 1, total: tickets.length })}
              </span>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          )}
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
                  <p className="text-xs text-slate-500 font-medium">{t('ticket.date')}</p>
                  <p className="font-semibold">{formatDate(performance.performance_date)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-700">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{t('ticket.time')}</p>
                  <p className="font-semibold">{performance.performance_time}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-700">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{t('ticket.venue')}</p>
                  <p className="font-semibold">{performance.venue.name}</p>
                  <p className="text-sm text-slate-600">{performance.venue.address}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 rounded-lg p-6 text-center mb-6">
              <p className="text-blue-200 text-sm font-medium mb-2">{t('ticket.yourSeat')}</p>
              <p className="text-white text-3xl font-bold">
                {t('ticket.row')} {currentTicket.seat.row_label} - {t('ticket.seat')} {currentTicket.seat.seat_number}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">{t('ticket.customer')}</p>
                <p className="font-semibold text-slate-900">{booking.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">{t('ticket.price')}</p>
                <p className="font-semibold text-slate-900">{currentTicket.price.toFixed(2)} MKD</p>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-slate-300 my-6"></div>

            {qrCodeUrl && (
              <div className="flex justify-center mb-6">
                <div className="bg-white p-3 rounded-lg shadow-md border-2 border-blue-600">
                  <img src={qrCodeUrl} alt="Ticket QR Code" className="w-32 h-32" />
                  <p className="text-xs text-center text-slate-600 mt-2">Scan at entrance</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">{t('ticket.ticketCode')}</p>
                <p className="font-mono font-bold text-slate-900">{currentTicket.ticket_code}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">{t('ticket.bookingReference')}</p>
                <p className="font-mono font-bold text-slate-900">{booking.booking_reference}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                {t('ticket.arrivalNote')}
              </p>
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={() => onDownload(currentTicket.ticket_code)}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>{t('ticket.downloadThisTicket')}</span>
            </button>
            {tickets.length > 1 && (
              <button
                onClick={onDownloadAll}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>{t('myBookings.downloadAll')} ({tickets.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
