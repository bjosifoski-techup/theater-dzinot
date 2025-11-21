# Theater Ticket Booking System - Setup Guide

## Initial Setup

### 1. Create Superadmin Account

The system requires an initial superadmin account with email: **teatar@techup.me**

**Steps:**
1. Start the application: `npm run dev`
2. Navigate to Sign Up
3. Create an account with:
   - Email: `teatar@techup.me`
   - Full Name: `Theater Administrator`
   - Phone: `+389 70 123 456`
   - Password: (your secure password)

4. After signup, the account needs to be upgraded to admin role. Go to Supabase Dashboard:
   - Navigate to: Table Editor → `user_profiles`
   - Find your user with email `teatar@techup.me`
   - Change the `role` field from `customer` to `admin`
   - Save changes

5. Sign out and sign back in. You now have full administrator access.

### 2. Configure Brevo Email Service

The system uses Brevo (formerly Sendinblue) for sending emails. You need to configure your Brevo API key.

**Steps:**
1. Create a Brevo account at https://www.brevo.com
2. Get your API key from: Settings → SMTP & API → API Keys
3. In Supabase Dashboard, go to: Project Settings → Edge Functions → Secrets
4. Add a new secret:
   - Name: `BREVO_API_KEY`
   - Value: (your Brevo API key)

**Note:** Edge Functions are already deployed and configured. The system will automatically use your Brevo API key for:
- Staff invitation emails
- Booking confirmation emails with PDF tickets

## Features Implemented

### Multi-language Support

The system supports **Macedonian (default)** and **English**:

- Default language: Macedonian
- Users can switch languages using a language selector
- All UI elements are translated
- Currency is displayed in MKD (Macedonian Denars)

### Staff Invitation System

Administrators can invite sales personnel through the system:

1. Go to Admin Dashboard → Invite Staff tab
2. Enter the email address of the person you want to invite
3. Select their role (Sales Person or Administrator)
4. Click "Send Invitation"

The invited person will receive an email with:
- An invitation link valid for 7 days
- Instructions to accept and set up their account
- Their assigned role and permissions

### Email Notifications

The system automatically sends emails for:

1. **Staff Invitations**
   - Sent when admin invites a new staff member
   - Includes secure invitation link
   - Expires after 7 days

2. **Booking Confirmations**
   - Sent after successful ticket purchase
   - Includes booking reference number
   - Attached PDF tickets (one per seat)
   - Performance details and venue information
   - Payment summary

### Sample Data

The system includes sample data with Macedonian cultural context:

**Venues:**
- Македонски народен театар (Main venue - 200 seats)
- Театар Комедија (Studio venue - 80 seats)

**Plays:**
1. **Турско огледало** (Drama)
   - Director: Билјана Петровска
   - Venue: Македонски народен театар
   - Prices: 250-300 MKD

2. **Балканска шпионка** (Thriller)
   - Director: Дарко Ангеловски
   - Venue: Македонски народен театар
   - Prices: 350 MKD

3. **Љубовни приказни од Вардар** (Comedy)
   - Director: Елена Николовска
   - Venue: Театар Комедија
   - Prices: 180-200 MKD

4. **Гоце Делчев: Легенда** (Historical)
   - Director: Марко Стојановски
   - Venue: Македонски народен театар
   - Prices: 350-400 MKD

**Actors:**
- Катерина Коцева
- Никола Ристоски
- Марија Стојчевска
- Дарко Петрески

## User Roles & Access

### Administrator (teatar@techup.me)
**Full system access:**
- Manage all plays and performances
- Configure venues and seating
- Invite and manage staff members
- View all bookings and sales
- Access reports and analytics

### Sales Person (Invited via email)
**Box office operations:**
- Process in-person ticket sales
- Check-in customers using booking reference
- View upcoming performances
- View all bookings
- Cannot modify plays or system settings

### Customer (Self-registered)
**Public access:**
- Browse and search plays
- View performance schedules
- Book tickets online
- View booking history
- Manage own reservations

## Testing the System

### Test Staff Invitation Flow

1. Log in as admin (teatar@techup.me)
2. Go to Admin Dashboard → Invite Staff
3. Enter a test email address
4. Click "Send Invitation"
5. Check the email inbox for invitation
6. Click the invitation link
7. Complete signup with the invited email
8. Verify the user has the correct role

### Test Booking Flow

1. Browse plays as a guest or logged-in user
2. Select a play and performance
3. Choose seats from the interactive seat map
4. Enter customer details
5. Complete simulated payment
6. Verify booking confirmation on screen
7. Check email for confirmation with PDF tickets

### Test Box Office

1. Log in as Sales Person
2. Go to Box Office
3. Search for a booking by reference number
4. Click "Check In Booking"
5. Verify booking status changes to "checked_in"

## Database Schema

The system includes 20+ database tables with Row Level Security:

**Core Tables:**
- `user_profiles` - User accounts with roles
- `venues` - Theater spaces
- `seats` - Individual seat inventory
- `plays` - Play information
- `performances` - Scheduled showings
- `bookings` - Reservations
- `tickets` - Individual tickets with barcodes
- `payments` - Payment transactions
- `staff_invitations` - Invitation tracking

## Edge Functions

Two edge functions are deployed:

1. **send-invitation-email**
   - Sends staff invitation emails via Brevo
   - Includes secure token and expiration
   - URL: `{SUPABASE_URL}/functions/v1/send-invitation-email`

2. **send-booking-confirmation**
   - Sends booking confirmations with PDF tickets
   - Includes all booking details
   - Generates HTML tickets for printing
   - URL: `{SUPABASE_URL}/functions/v1/send-booking-confirmation`

## Environment Variables

Required environment variables (already configured in `.env`):

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Edge Function environment variables (configured in Supabase Dashboard):
```
BREVO_API_KEY=your_brevo_api_key
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Production Checklist

Before deploying to production:

- [ ] Configure Brevo API key in Supabase
- [ ] Create superadmin account (teatar@techup.me)
- [ ] Update seed data or clear sample data
- [ ] Configure email sender domain in Brevo
- [ ] Test email delivery
- [ ] Test all user roles and permissions
- [ ] Set up backup procedures
- [ ] Configure SSL/HTTPS
- [ ] Review and adjust cancellation policies
- [ ] Test payment processing integration
- [ ] Set up monitoring and logging

## Support & Troubleshooting

### Email Not Sending

1. Check Brevo API key is configured correctly
2. Verify sender email (teatar@techup.me) is authorized in Brevo
3. Check Edge Function logs in Supabase Dashboard
4. Verify recipient email is valid

### Invitation Link Not Working

1. Check invitation hasn't expired (7 days)
2. Verify invitation status is "pending" in database
3. Check invitation token is correct
4. Ensure user hasn't already accepted

### Seat Booking Conflicts

1. Cart reservations expire after 10 minutes
2. Run cleanup function: `SELECT clean_expired_cart_reservations();`
3. Check booking status in database
4. Verify RLS policies are active

### Language Not Switching

1. Clear browser cache
2. Check i18n configuration in `src/i18n/config.ts`
3. Verify translation files exist in `src/i18n/locales/`
4. Check browser console for errors

## Future Enhancements

Potential improvements:
- Real payment gateway integration (Stripe, PayPal)
- SMS notifications via Twilio
- Advanced reporting with charts
- QR code barcode scanner app
- Mobile responsive improvements
- Performance caching and optimization
- Automated email reminders 24h before performance
- Discount code management UI
- Waitlist for sold-out shows
- Social media integration
- Customer review system

## Security Notes

- All tables have Row Level Security enabled
- Passwords are hashed by Supabase Auth
- API keys are stored as environment variables
- Invitation tokens are cryptographically secure
- Email content is sanitized
- SQL injection prevention through parameterized queries
- XSS protection through React's built-in escaping

## License

Proprietary software for theater management.
