import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { jsPDF } from 'npm:jspdf@^2.5.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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

function generateTicketPDF(ticket: TicketData): Uint8Array {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 420]
  });
  
  const primaryColor = '#667eea';
  const darkGray = '#333333';
  const lightGray = '#808080';
  const borderGray = '#cccccc';
  
  doc.setDrawColor(darkGray);
  doc.setLineWidth(0.5);
  doc.rect(5, 5, 410, 287);
  
  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('THEATER BOX', 210, 20, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setTextColor(darkGray);
  doc.text(ticket.playTitle, 210, 35, { align: 'center' });
  
  if (ticket.playSubtitle) {
    doc.setFontSize(12);
    doc.setTextColor(lightGray);
    doc.setFont('helvetica', 'normal');
    doc.text(ticket.playSubtitle, 210, 45, { align: 'center' });
  }
  
  doc.setDrawColor(lightGray);
  doc.setLineDash([2, 2]);
  doc.line(15, 55, 405, 55);
  doc.setLineDash([]);
  
  let yPos = 70;
  
  const dateText = new Date(ticket.performanceDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  doc.setFontSize(11);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text('Date & Time:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dateText} at ${ticket.performanceTime}`, 60, yPos);
  
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Venue:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(ticket.venueName, 60, yPos);
  
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Address:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(ticket.venueAddress, 60, yPos);
  
  yPos += 20;
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(1);
  doc.setFillColor(242, 242, 242);
  doc.rect(20, yPos, 380, 25, 'FD');
  
  const seatText = `Row ${ticket.seatRow} - Seat ${ticket.seatNumber}`;
  doc.setFontSize(20);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(seatText, 210, yPos + 17, { align: 'center' });
  
  yPos += 40;
  doc.setFontSize(11);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(ticket.customerName, 60, yPos);
  
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Price:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${ticket.price.toFixed(2)} MKD`, 60, yPos);
  
  yPos += 20;
  doc.setDrawColor(lightGray);
  doc.setLineWidth(0.5);
  doc.setLineDash([2, 2]);
  doc.line(15, yPos, 405, yPos);
  doc.setLineDash([]);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Ticket Code:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(ticket.ticketCode, 20, yPos + 7);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Booking Reference:', 150, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(ticket.bookingReference, 150, yPos + 7);
  
  yPos += 20;
  doc.setFontSize(8);
  doc.setTextColor(lightGray);
  const footerText = 'Please arrive 15 minutes before the performance. This ticket is valid for one person only.';
  doc.text(footerText, 20, yPos, { maxWidth: 380 });
  
  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const ticket: TicketData = await req.json();
    
    console.log('Generating PDF for ticket:', ticket.ticketCode);
    
    const pdfBytes = generateTicketPDF(ticket);
    
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Ticket_${ticket.ticketCode}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, stack: errorStack }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});