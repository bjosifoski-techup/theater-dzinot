import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

interface TicketData {
  ticketCode: string;
  bookingReference: string;
  customerName: string;
  playTitle: string;
  playSubtitle?: string;
  performanceDate: string;
  performanceTime: string;
  venueName: string;
  venueAddress: string;
  seatRow: string;
  seatNumber: string;
  price: number;
}

export async function generateTicketPDF(ticket: TicketData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [148, 210]
  });

  const primaryColor = '#667eea';
  const darkGray = '#333333';
  const lightGray = '#808080';

  doc.setDrawColor(darkGray);
  doc.setLineWidth(0.5);
  doc.rect(5, 5, 200, 138);

  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('THEATER BOX', 105, 20, { align: 'center' });

  doc.setFontSize(18);
  doc.setTextColor(darkGray);
  doc.text(ticket.playTitle, 105, 35, { align: 'center', maxWidth: 180 });

  let yPos = 35;
  if (ticket.playSubtitle) {
    yPos += 12;
    doc.setFontSize(12);
    doc.setTextColor(lightGray);
    doc.setFont('helvetica', 'normal');
    doc.text(ticket.playSubtitle, 105, yPos, { align: 'center', maxWidth: 180 });
  }

  yPos += 10;
  doc.setDrawColor(lightGray);
  doc.setLineDash([2, 2]);
  doc.line(15, yPos, 195, yPos);
  doc.setLineDash([]);

  yPos += 10;

  const dateText = new Date(ticket.performanceDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  doc.setFontSize(11);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text('Date & Time:', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dateText} at ${ticket.performanceTime}`, 50, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Venue:', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(ticket.venueName, 50, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Address:', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(ticket.venueAddress, 50, yPos, { maxWidth: 145 });

  yPos += 12;
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(1);
  doc.setFillColor(242, 242, 242);
  doc.rect(15, yPos, 180, 20, 'FD');

  const seatText = `Row ${ticket.seatRow} - Seat ${ticket.seatNumber}`;
  doc.setFontSize(18);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(seatText, 105, yPos + 13, { align: 'center' });

  yPos += 28;
  doc.setFontSize(11);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer:', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(ticket.customerName, 50, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Price:', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${ticket.price.toFixed(2)} MKD`, 50, yPos);

  yPos += 12;
  doc.setDrawColor(lightGray);
  doc.setLineWidth(0.5);
  doc.setLineDash([2, 2]);
  doc.line(15, yPos, 195, yPos);
  doc.setLineDash([]);

  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Ticket Code:', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(ticket.ticketCode, 15, yPos + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('Booking Reference:', 110, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(ticket.bookingReference, 110, yPos + 5);

  const qrData = JSON.stringify({
    ticketCode: ticket.ticketCode,
    bookingReference: ticket.bookingReference,
    customerName: ticket.customerName,
    playTitle: ticket.playTitle,
    performanceDate: ticket.performanceDate,
    performanceTime: ticket.performanceTime,
    seatRow: ticket.seatRow,
    seatNumber: ticket.seatNumber,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    width: 200,
    margin: 1,
    color: {
      dark: '#333333',
      light: '#ffffff'
    }
  });

  const qrSize = 30;
  const qrX = 170;
  const qrY = 55;
  doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  yPos += 12;
  doc.setFontSize(8);
  doc.setTextColor(lightGray);
  const footerText = 'Please arrive 15 minutes before the performance. This ticket is valid for one person only.';
  doc.text(footerText, 15, yPos, { maxWidth: 140 });

  return doc.output('blob');
}
