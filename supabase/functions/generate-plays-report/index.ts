import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@^2.57.4';
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@^1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ReportParams {
  reportType: 'previous' | 'upcoming';
  venueId?: string;
}

async function generatePreviousPlaysReport(supabase: any, venueId?: string): Promise<Uint8Array> {
  let query = supabase
    .from('performances')
    .select(`
      id,
      performance_date,
      performance_time,
      base_price,
      play:plays (
        title,
        subtitle,
        genre,
        duration_minutes
      ),
      venue:venues (
        name
      ),
      bookings (
        total_seats,
        total_amount,
        status
      )
    `)
    .lt('performance_date', new Date().toISOString())
    .order('performance_date', { ascending: false });

  if (venueId) {
    query = query.eq('venue_id', venueId);
  }

  const { data: performances, error } = await query;

  if (error) throw error;

  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  const primaryColor = rgb(0.4, 0.49, 0.91);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.5, 0.5, 0.5);

  let page = pdfDoc.addPage([595, 842]);
  let yPosition = 800;

  page.drawText('Theater Box - Previous Plays Report', {
    x: 50,
    y: yPosition,
    size: 20,
    font: timesRomanBold,
    color: primaryColor,
  });

  yPosition -= 20;
  page.drawText(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, {
    x: 50,
    y: yPosition,
    size: 10,
    font: timesRoman,
    color: lightGray,
  });

  yPosition -= 40;

  for (const perf of performances || []) {
    if (yPosition < 100) {
      page = pdfDoc.addPage([595, 842]);
      yPosition = 800;
    }

    const confirmedBookings = perf.bookings?.filter((b: any) => b.status === 'confirmed') || [];
    const totalTicketsSold = confirmedBookings.reduce((sum: number, b: any) => sum + (b.total_seats || 0), 0);
    const totalRevenue = confirmedBookings.reduce((sum: number, b: any) => sum + (parseFloat(b.total_amount) || 0), 0);

    page.drawRectangle({
      x: 45,
      y: yPosition - 85,
      width: 505,
      height: 90,
      borderColor: lightGray,
      borderWidth: 1,
    });

    page.drawText(perf.play.title, {
      x: 55,
      y: yPosition - 20,
      size: 14,
      font: timesRomanBold,
      color: darkGray,
    });

    if (perf.play.subtitle) {
      page.drawText(perf.play.subtitle, {
        x: 55,
        y: yPosition - 35,
        size: 10,
        font: timesRoman,
        color: lightGray,
      });
    }

    const dateStr = new Date(perf.performance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    page.drawText(`Date: ${dateStr} at ${perf.performance_time}`, {
      x: 55,
      y: yPosition - 50,
      size: 9,
      font: timesRoman,
      color: darkGray,
    });

    page.drawText(`Venue: ${perf.venue.name}`, {
      x: 55,
      y: yPosition - 63,
      size: 9,
      font: timesRoman,
      color: darkGray,
    });

    page.drawText(`Tickets Sold: ${totalTicketsSold}`, {
      x: 400,
      y: yPosition - 50,
      size: 10,
      font: timesRomanBold,
      color: darkGray,
    });

    page.drawText(`Revenue: ${totalRevenue.toFixed(2)} MKD`, {
      x: 400,
      y: yPosition - 63,
      size: 10,
      font: timesRomanBold,
      color: primaryColor,
    });

    yPosition -= 100;
  }

  if (yPosition > 100) {
    yPosition -= 20;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: 545, y: yPosition },
      thickness: 1,
      color: lightGray,
    });

    yPosition -= 30;
    const totalRevenue = performances?.reduce((sum: number, perf: any) => {
      const confirmedBookings = perf.bookings?.filter((b: any) => b.status === 'confirmed') || [];
      return sum + confirmedBookings.reduce((s: number, b: any) => s + (parseFloat(b.total_amount) || 0), 0);
    }, 0) || 0;

    const totalTickets = performances?.reduce((sum: number, perf: any) => {
      const confirmedBookings = perf.bookings?.filter((b: any) => b.status === 'confirmed') || [];
      return sum + confirmedBookings.reduce((s: number, b: any) => s + (b.total_seats || 0), 0);
    }, 0) || 0;

    page.drawText('Total Summary', {
      x: 50,
      y: yPosition,
      size: 14,
      font: timesRomanBold,
      color: darkGray,
    });

    page.drawText(`Total Tickets Sold: ${totalTickets}`, {
      x: 50,
      y: yPosition - 20,
      size: 11,
      font: timesRoman,
      color: darkGray,
    });

    page.drawText(`Total Revenue: ${totalRevenue.toFixed(2)} MKD`, {
      x: 50,
      y: yPosition - 35,
      size: 11,
      font: timesRomanBold,
      color: primaryColor,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

async function generateUpcomingPlaysReport(supabase: any, venueId?: string): Promise<Uint8Array> {
  let query = supabase
    .from('performances')
    .select(`
      id,
      performance_date,
      performance_time,
      base_price,
      play:plays (
        title,
        subtitle,
        genre,
        duration_minutes
      ),
      venue:venues (
        name,
        total_capacity
      )
    `)
    .gte('performance_date', new Date().toISOString())
    .order('performance_date', { ascending: true });

  if (venueId) {
    query = query.eq('venue_id', venueId);
  }

  const { data: performances, error } = await query;

  if (error) throw error;

  const bookedSeatsPromises = performances?.map(async (perf: any) => {
    const { count } = await supabase
      .from('booking_seats')
      .select('id', { count: 'exact', head: true })
      .eq('performance_id', perf.id);
    return { perfId: perf.id, bookedSeats: count || 0 };
  }) || [];

  const bookedSeatsData = await Promise.all(bookedSeatsPromises);
  const bookedSeatsMap = Object.fromEntries(bookedSeatsData.map((d: any) => [d.perfId, d.bookedSeats]));

  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  const primaryColor = rgb(0.4, 0.49, 0.91);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.5, 0.5, 0.5);
  const greenColor = rgb(0.13, 0.7, 0.29);

  let page = pdfDoc.addPage([595, 842]);
  let yPosition = 800;

  page.drawText('Theater Box - Upcoming Plays Report', {
    x: 50,
    y: yPosition,
    size: 20,
    font: timesRomanBold,
    color: primaryColor,
  });

  yPosition -= 20;
  page.drawText(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, {
    x: 50,
    y: yPosition,
    size: 10,
    font: timesRoman,
    color: lightGray,
  });

  yPosition -= 40;

  for (const perf of performances || []) {
    if (yPosition < 100) {
      page = pdfDoc.addPage([595, 842]);
      yPosition = 800;
    }

    const bookedSeats = bookedSeatsMap[perf.id] || 0;
    const availableSeats = (perf.venue.total_capacity || 0) - bookedSeats;
    const occupancyPercent = perf.venue.total_capacity > 0 ? ((bookedSeats / perf.venue.total_capacity) * 100).toFixed(1) : '0.0';

    page.drawRectangle({
      x: 45,
      y: yPosition - 85,
      width: 505,
      height: 90,
      borderColor: lightGray,
      borderWidth: 1,
    });

    page.drawText(perf.play.title, {
      x: 55,
      y: yPosition - 20,
      size: 14,
      font: timesRomanBold,
      color: darkGray,
    });

    if (perf.play.subtitle) {
      page.drawText(perf.play.subtitle, {
        x: 55,
        y: yPosition - 35,
        size: 10,
        font: timesRoman,
        color: lightGray,
      });
    }

    const dateStr = new Date(perf.performance_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    page.drawText(`Date: ${dateStr} at ${perf.performance_time}`, {
      x: 55,
      y: yPosition - 50,
      size: 9,
      font: timesRoman,
      color: darkGray,
    });

    page.drawText(`Venue: ${perf.venue.name} | Price: ${perf.base_price} MKD`, {
      x: 55,
      y: yPosition - 63,
      size: 9,
      font: timesRoman,
      color: darkGray,
    });

    page.drawText(`Available: ${availableSeats}`, {
      x: 400,
      y: yPosition - 50,
      size: 10,
      font: timesRomanBold,
      color: greenColor,
    });

    page.drawText(`Occupancy: ${occupancyPercent}%`, {
      x: 400,
      y: yPosition - 63,
      size: 10,
      font: timesRoman,
      color: darkGray,
    });

    yPosition -= 100;
  }

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { reportType, venueId }: ReportParams = await req.json();

    let pdfBytes: Uint8Array;
    let filename: string;

    if (reportType === 'previous') {
      pdfBytes = await generatePreviousPlaysReport(supabase, venueId);
      filename = `Previous_Plays_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    } else {
      pdfBytes = await generateUpcomingPlaysReport(supabase, venueId);
      filename = `Upcoming_Plays_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    }

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
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