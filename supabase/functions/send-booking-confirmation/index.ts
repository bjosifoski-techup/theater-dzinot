import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@^1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface BookingData {
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  playTitle: string;
  playSubtitle?: string;
  performanceDate: string;
  performanceTime: string;
  venueName: string;
  venueAddress: string;
  seats: Array<{ row: string; number: string; price: number }>;
  totalAmount: number;
  bookingFee: number;
  tickets: Array<{ ticketCode: string; seatRow: string; seatNumber: string; price: number }>;
}

async function generateTicketPDF(booking: BookingData, ticket: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([420, 297]);
  const { width, height } = page.getSize();
  
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);
  
  const primaryColor = rgb(0.4, 0.49, 0.91);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.5, 0.5, 0.5);
  
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: darkGray,
    borderWidth: 2,
  });
  
  let yPosition = height - 50;
  
  page.drawText('🎭 Theater Box', {
    x: width / 2 - 70,
    y: yPosition,
    size: 24,
    font: timesRomanBold,
    color: primaryColor,
  });
  
  yPosition -= 30;
  page.drawText(booking.playTitle, {
    x: width / 2 - (booking.playTitle.length * 4),
    y: yPosition,
    size: 18,
    font: timesRomanBold,
    color: darkGray,
  });
  
  if (booking.playSubtitle) {
    yPosition -= 18;
    page.drawText(booking.playSubtitle, {
      x: width / 2 - (booking.playSubtitle.length * 2.5),
      y: yPosition,
      size: 12,
      font: timesRoman,
      color: lightGray,
    });
  }
  
  yPosition -= 30;
  page.drawLine({
    start: { x: 40, y: yPosition },
    end: { x: width - 40, y: yPosition },
    thickness: 1,
    color: lightGray,
    dashArray: [3, 3],
  });
  
  yPosition -= 30;
  const dateText = new Date(booking.performanceDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  page.drawText('Date & Time:', {
    x: 40,
    y: yPosition,
    size: 11,
    font: timesRomanBold,
    color: darkGray,
  });
  page.drawText(`${dateText} at ${booking.performanceTime}`, {
    x: 150,
    y: yPosition,
    size: 11,
    font: timesRoman,
    color: darkGray,
  });
  
  yPosition -= 20;
  page.drawText('Venue:', {
    x: 40,
    y: yPosition,
    size: 11,
    font: timesRomanBold,
    color: darkGray,
  });
  page.drawText(booking.venueName, {
    x: 150,
    y: yPosition,
    size: 11,
    font: timesRoman,
    color: darkGray,
  });
  
  yPosition -= 20;
  page.drawText('Address:', {
    x: 40,
    y: yPosition,
    size: 11,
    font: timesRomanBold,
    color: darkGray,
  });
  page.drawText(booking.venueAddress, {
    x: 150,
    y: yPosition,
    size: 11,
    font: timesRoman,
    color: darkGray,
  });
  
  yPosition -= 40;
  page.drawRectangle({
    x: 40,
    y: yPosition - 35,
    width: width - 80,
    height: 50,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: primaryColor,
    borderWidth: 2,
  });
  
  page.drawText(`Row ${ticket.seatRow} - Seat ${ticket.seatNumber}`, {
    x: width / 2 - 70,
    y: yPosition - 15,
    size: 20,
    font: timesRomanBold,
    color: primaryColor,
  });
  
  yPosition -= 60;
  page.drawText('Customer:', {
    x: 40,
    y: yPosition,
    size: 11,
    font: timesRomanBold,
    color: darkGray,
  });
  page.drawText(booking.customerName, {
    x: 150,
    y: yPosition,
    size: 11,
    font: timesRoman,
    color: darkGray,
  });
  
  yPosition -= 20;
  page.drawText('Price:', {
    x: 40,
    y: yPosition,
    size: 11,
    font: timesRomanBold,
    color: darkGray,
  });
  page.drawText(`${ticket.price.toFixed(2)} MKD`, {
    x: 150,
    y: yPosition,
    size: 11,
    font: timesRoman,
    color: darkGray,
  });
  
  yPosition -= 40;
  page.drawLine({
    start: { x: 40, y: yPosition },
    end: { x: width - 40, y: yPosition },
    thickness: 1,
    color: lightGray,
    dashArray: [3, 3],
  });
  
  yPosition -= 25;
  page.drawText('Ticket Code:', {
    x: 40,
    y: yPosition,
    size: 10,
    font: timesRomanBold,
    color: darkGray,
  });
  page.drawText(ticket.ticketCode, {
    x: 40,
    y: yPosition - 15,
    size: 10,
    font: courier,
    color: darkGray,
  });
  
  page.drawText('Booking Reference:', {
    x: 240,
    y: yPosition,
    size: 10,
    font: timesRomanBold,
    color: darkGray,
  });
  page.drawText(booking.bookingReference, {
    x: 240,
    y: yPosition - 15,
    size: 10,
    font: courier,
    color: darkGray,
  });
  
  yPosition -= 40;
  const footerText = 'Please arrive 15 minutes before the performance. This ticket is valid for one person only.';
  page.drawText(footerText, {
    x: 40,
    y: yPosition,
    size: 8,
    font: timesRoman,
    color: lightGray,
    maxWidth: width - 80,
  });
  
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY not configured');
    }

    const booking: BookingData = await req.json();

    const performanceDateTime = new Date(booking.performanceDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const seatsText = booking.seats.map(s => `Row ${s.row}, Seat ${s.number}`).join(', ');

    const attachments = [];
    for (const ticket of booking.tickets) {
      const pdfBytes = await generateTicketPDF(booking, ticket);
      const base64Pdf = btoa(String.fromCharCode(...pdfBytes));
      attachments.push({
        name: `Ticket_${ticket.ticketCode}.pdf`,
        content: base64Pdf,
      });
    }

    const emailData = {
      sender: {
        name: 'Theater Box',
        email: 'teatar@techup.me',
      },
      to: [
        {
          email: booking.customerEmail,
          name: booking.customerName,
        },
      ],
      subject: `Booking Confirmation - ${booking.playTitle}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .booking-box { background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .booking-ref { font-size: 24px; font-weight: bold; color: #2563eb; text-align: center; margin: 10px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .label { font-weight: bold; }
            .total { background: #f3f4f6; padding: 15px; border-radius: 5px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Booking Confirmed!</h1>
              <p>Your tickets are ready</p>
            </div>
            <div class="content">
              <p>Dear ${booking.customerName},</p>
              <p>Thank you for your booking! Your tickets for <strong>${booking.playTitle}</strong> have been confirmed.</p>
              
              <div class="booking-ref">Booking Reference: ${booking.bookingReference}</div>
              
              <div class="booking-box">
                <div class="info-row">
                  <span class="label">Performance:</span>
                  <span>${booking.playTitle}</span>
                </div>
                <div class="info-row">
                  <span class="label">Date & Time:</span>
                  <span>${performanceDateTime} - ${booking.performanceTime}</span>
                </div>
                <div class="info-row">
                  <span class="label">Venue:</span>
                  <span>${booking.venueName}</span>
                </div>
                <div class="info-row">
                  <span class="label">Address:</span>
                  <span>${booking.venueAddress}</span>
                </div>
                <div class="info-row">
                  <span class="label">Seats:</span>
                  <span>${seatsText}</span>
                </div>
                <div class="info-row" style="border-bottom: none;">
                  <span class="label">Number of Tickets:</span>
                  <span>${booking.seats.length}</span>
                </div>
                
                <div class="total">
                  <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span>Subtotal:</span>
                    <span>${(booking.totalAmount - booking.bookingFee).toFixed(2)} MKD</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span>Booking Fee:</span>
                    <span>${booking.bookingFee.toFixed(2)} MKD</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 2px solid #d1d5db; font-size: 18px; font-weight: bold;">
                    <span>Total Paid:</span>
                    <span>${booking.totalAmount.toFixed(2)} MKD</span>
                  </div>
                </div>
              </div>
              
              <p style="margin-top: 20px;"><strong>Important Information:</strong></p>
              <ul>
                <li>Please arrive at least 15 minutes before the performance</li>
                <li>Your tickets are attached to this email as PDF files</li>
                <li>Present your tickets (printed or on mobile) at the entrance</li>
                <li>Keep your booking reference for any inquiries</li>
              </ul>
              
              <p>We look forward to welcoming you to Theater Box!</p>
            </div>
            <div class="footer">
              <p>Theater Box - Professional Theater Management System</p>
              <p>If you have any questions, please contact us at teatar@techup.me</p>
              <p>© 2024 Theater Box. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachment: attachments,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Brevo API error: ${error}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, messageId: result.messageId }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
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