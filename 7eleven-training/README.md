# 7-Eleven Training Management System

Training Management System for 7-Eleven Demonstration Store - Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## ✨ Features

### 1. Authentication System
- Login using Student ID + Birthdate/OTP
- Role-based access (Student, Admin, Instructor)
- Secure session management with Zustand

### 2. Student Dashboard
- Training status and progress tracking
- Course catalog with registration
- Progress visualization with charts
- Quick access to courses and bookings

### 3. Course Catalog & Registration
- Browse available courses
- One-click registration with confirmation dialog
- Course details and duration display

### 4. Learning Module
- **Pre-test**: Multiple choice quiz, no retake allowed
- **Video Player**: 
  - No skip/seek forward protection
  - Progress tracking
  - Unlocks post-test only after video completion
- **Post-test**: Unlocked after training completion
- Automatic score calculation and Pass/Fail status

### 5. Practical Training Booking
- Calendar-based slot selection
- **Hard limit: 100 students per slot**
- Real-time availability display
- QR Code generation for check-in
- Booking confirmation tickets

### 6. On-Site Operations
- **Check-in System**: 
  - QR Code scanning or manual student ID input
  - Mobile-friendly interface for instructors
- **Digital Stamp System**: 
  - Stamp students for passing training bases (Service, Warming, etc.)
  - Must complete all bases to proceed
  - Real-time status tracking

### 7. Evaluation & Reporting
- Satisfaction survey (1-5 star rating)
- **Admin Dashboard**: 
  - Table view of all students
  - Progress status tracking
  - **Export to Excel** functionality
  - Statistics overview

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **Database:** Supabase (PostgreSQL)
- **State Management:** Zustand
- **Icons:** Lucide React
- **Video Player:** React Player
- **Excel Export:** XLSX

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- SQLite database from PIMX project (for student data import)

### Quick Setup (Recommended)

1. **Install dependencies:**
```bash
npm install
```

2. **Initialize environment variables:**
```bash
npm run init-env
```
This interactive script will help you set up `.env.local` with your Supabase credentials.

3. **Verify setup:**
```bash
npm run verify
```
This will check if everything is configured correctly.

4. **Run complete setup (migrations + import):**
```bash
npm run setup
```
This will:
- ✅ Verify Supabase connection
- ✅ Run Prisma migrations automatically
- ✅ Import all students from SQLite database

5. **Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Manual Setup

If you prefer to set up manually:

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_postgresql_connection_string
```

3. **Set up database:**
   - Create a new Supabase project
   - Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```
   - Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

4. **Import students:**
```bash
npm run import-students
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run init-env` - Interactive environment setup
- `npm run check-status` - Check system status
- `npm run verify` - Verify setup completeness
- `npm run setup` - Complete setup (migrations + import)
- `npm run import-students` - Import students from SQLite

### Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide with troubleshooting
- **[README-IMPORT.md](./README-IMPORT.md)** - Student import documentation

## 📊 Database Schema

The system uses Prisma with PostgreSQL (Supabase). Key entities:

- **Users:** Student authentication and profiles
- **Courses:** Training course catalog
- **Enrollments:** Student course registrations with progress tracking
- **Quizzes:** Pre-test and post-test with questions
- **QuizAttempts:** Student quiz attempts with scores
- **Bookings:** Practical training slot reservations (max 100 per slot)
- **Stations:** Training bases (Service, Warming, etc.)
- **StationLogs:** Digital stamp records
- **Evaluations:** Student feedback and ratings

## 📁 Project Structure

```
7eleven-training/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   │   └── login/         # Login page
│   ├── (student)/         # Student routes
│   │   ├── dashboard/     # Student dashboard
│   │   ├── courses/       # Course catalog
│   │   ├── learn/         # Learning module
│   │   ├── quiz/          # Quiz pages
│   │   ├── bookings/      # Booking system
│   │   ├── my-bookings/   # My bookings
│   │   └── evaluation/    # Evaluation form
│   ├── (instructor)/      # Instructor routes
│   │   ├── checkin/       # Check-in system
│   │   └── stamps/        # Digital stamp system
│   └── (admin)/           # Admin routes
│       └── dashboard/     # Admin dashboard
├── components/            # React components
│   └── ui/               # Shadcn UI components
├── lib/                   # Utilities and helpers
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Utility functions
├── store/                 # Zustand state management
│   └── auth-store.ts     # Authentication store
├── prisma/                # Database schema
│   └── schema.prisma     # Prisma schema
└── middleware.ts         # Next.js middleware
```

## 🎯 Key Features Implementation

### Video Player No-Skip Protection
- Tracks video progress
- Prevents seeking forward
- Only unlocks next step after video completion
- Progress saved to database

### Booking System (100 Student Limit)
- Real-time slot availability checking
- Hard limit enforcement at database level
- QR Code generation for each booking
- Check-in tracking

### Digital Stamp System
- Mobile-friendly interface
- Per-station stamping (passed/failed)
- All stations must be passed to proceed
- Real-time status updates

### Admin Dashboard
- Comprehensive student progress tracking
- Excel export with all student data
- Statistics and analytics
- Filter and search capabilities

## 🔐 Authentication

- **Students:** Login with Student ID + Birthdate or OTP
- **Instructors/Admins:** Same login system, role-based access
- Session managed with Zustand + localStorage persistence

## 📝 Notes

- Pre-test cannot be retaken (enforced at database level)
- Video must be watched completely before post-test unlocks
- Booking slots are limited to 100 students (hard constraint)
- All stations must be passed before post-test access
- Excel export includes all student progress data

## 📄 License

MIT
