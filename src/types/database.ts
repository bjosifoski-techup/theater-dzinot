export interface Venue {
  id: string;
  name: string;
  description: string | null;
  address: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeatSection {
  id: string;
  venue_id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

export interface PricingTier {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  created_at: string;
}

export interface Seat {
  id: string;
  venue_id: string;
  section_id: string | null;
  row_label: string;
  seat_number: string;
  is_wheelchair_accessible: boolean;
  is_companion_seat: boolean;
  is_restricted_view: boolean;
  is_available: boolean;
  notes: string | null;
  created_at: string;
}

export interface Actor {
  id: string;
  full_name: string;
  biography: string | null;
  photo_url: string | null;
  social_media: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Play {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  synopsis: string | null;
  genre: string;
  duration_minutes: number;
  age_rating: string;
  director_name: string | null;
  language: string;
  poster_url: string | null;
  images: string[];
  trailer_url: string | null;
  special_notes: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlayActor {
  id: string;
  play_id: string;
  actor_id: string;
  role_name: string;
  billing_order: number;
  created_at: string;
  actor?: Actor;
}

export interface Performance {
  id: string;
  play_id: string;
  venue_id: string;
  performance_date: string;
  performance_time: string;
  base_price: number;
  status: 'scheduled' | 'sold_out' | 'cancelled' | 'postponed' | 'completed';
  available_seats: number | null;
  total_seats: number | null;
  created_at: string;
  updated_at: string;
  play?: Play;
  venue?: Venue;
}

export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_tickets: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_reference: string;
  performance_id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total_seats: number;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  booking_fee: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded' | 'checked_in';
  booked_by_user_id: string | null;
  booking_method: 'online' | 'box_office';
  discount_code_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  performance?: Performance;
}

export interface BookingSeat {
  id: string;
  booking_id: string;
  seat_id: string;
  price: number;
  created_at: string;
  seat?: Seat;
}

export interface CartReservation {
  id: string;
  session_id: string;
  performance_id: string;
  seat_id: string;
  user_id: string | null;
  reserved_until: string;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  payment_method: 'credit_card' | 'debit_card' | 'cash' | 'digital_wallet' | 'other';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  transaction_id: string | null;
  payment_gateway: string | null;
  payment_details: Record<string, unknown>;
  processed_at: string | null;
  refunded_amount: number;
  refunded_at: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  booking_id: string;
  seat_id: string;
  ticket_code: string;
  barcode_data: string;
  is_checked_in: boolean;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
}

export interface CancellationPolicy {
  id: string;
  days_before_performance: number;
  refund_percentage: number;
  description: string | null;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
}
