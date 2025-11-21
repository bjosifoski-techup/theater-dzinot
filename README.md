# Theater Ticket Booking System

A comprehensive online ticket booking and management system for a local theater, built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### For Customers
- Browse and search plays by title, genre, or description
- View detailed play information including cast, duration, and ratings
- Select performance date and time
- Interactive seating chart with real-time availability
- Secure online booking with seat selection (up to 10 seats)
- Guest checkout or create an account
- View booking history and manage reservations
- Email confirmation with tickets

### For Sales Personnel (Box Office)
- Process in-person ticket sales
- View real-time seating availability
- Check-in customers using booking reference
- View upcoming performances and recent bookings
- Handle customer inquiries

### For Administrators
- Complete play management (add, edit, archive)
- Manage theater venues and seating layouts
- Schedule performances with flexible pricing
- User account management with role assignment
- View sales reports and analytics
- Configure system settings

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL database with Row Level Security)
- **Authentication**: Supabase Auth with email/password
- **Build Tool**: Vite

## Database Schema

The system includes comprehensive database tables:
- User profiles with role-based access control
- Venues and seating layouts
- Plays, actors, and performances
- Bookings, payments, and tickets
- Cart reservations with automatic expiration
- Discount codes and cancellation policies
- System settings and audit trails

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. The environment variables are already configured in `.env` file with your Supabase credentials.

3. The database schema and sample data have been applied automatically.

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## Sample Data

The system includes sample data for demonstration:
- 2 venues (Main Theater Hall, Studio Theater)
- 50 seats in Main Theater Hall (rows A-E, seats 1-10)
- 4 plays (Hamlet, A Midsummer Night's Dream, The Phantom of the Opera, Death of a Salesman)
- Multiple upcoming performances
- 4 sample actors with roles assigned

## User Roles

### Creating Test Accounts

You can create accounts with different roles:

1. **Customer Account** (default)
   - Sign up normally through the application
   - Can browse plays and make bookings

2. **Sales Person Account**
   - Sign up normally, then have an admin change your role
   - Access to box office features
   - Can check-in customers

3. **Admin Account**
   - Sign up normally, then manually update role in database
   - Full system access
   - Can manage plays, venues, users, and view reports

To create an admin account:
1. Sign up through the UI
2. Go to Supabase Dashboard → Table Editor → user_profiles
3. Find your user and change `role` from 'customer' to 'admin'

## Key Features Implementation

### Booking Flow
1. Customer browses plays and selects a performance
2. Interactive seating chart shows availability
3. Seats are temporarily reserved in cart (10 minutes)
4. Customer enters details and completes payment
5. Booking confirmed with tickets generated
6. Automatic seat reservation cleanup

### Seat Management
- Real-time availability updates
- Visual seat map with row and seat numbers
- Wheelchair accessible seats marked
- Restricted view seats indicated
- Maximum 10 seats per booking
- Concurrent booking prevention

### Security
- Row Level Security (RLS) on all tables
- Role-based access control
- Customers can only view their own bookings
- Sales personnel can view all bookings
- Admins have full access
- Secure authentication with Supabase Auth

### Payment Processing
- Simulated payment processing (demo mode)
- Booking fee calculation
- Discount code support (infrastructure ready)
- Payment transaction tracking
- Refund management infrastructure

## Project Structure

```
src/
├── components/
│   ├── Admin/           # Admin dashboard and management
│   ├── Auth/            # Sign in and sign up
│   ├── BoxOffice/       # Sales person interface
│   ├── Customer/        # Play browsing and booking
│   └── Layout.tsx       # Main layout with navigation
├── contexts/
│   └── AuthContext.tsx  # Authentication context
├── lib/
│   └── supabase.ts      # Supabase client
├── types/
│   └── database.ts      # TypeScript types
├── App.tsx              # Main app component
└── main.tsx            # Entry point
```

## Future Enhancements

Potential features for future development:
- Email notification system integration
- PDF ticket generation
- Barcode scanner integration for check-in
- Advanced reporting and analytics
- Discount code management UI
- Waitlist for sold-out shows
- Gift cards and season passes
- Customer reviews and ratings
- Multi-language support
- Mobile app
- SMS notifications
- Social media integration

## Support

For issues or questions, please contact the development team.

## License

This project is proprietary software for theater management.
