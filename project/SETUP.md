# JobBoard Pro - Setup Guide

A full-featured job board and resume selection platform built with React, Vite, Tailwind CSS, and Supabase.

## Features

### For Job Seekers (Users)
- Browse and search active job postings
- View detailed job descriptions with requirements and benefits
- Apply to jobs with resume upload
- Track application status
- Receive real-time notifications about application updates
- Manage profile and view application history

### For Employers (Admins)
- Post and manage job listings
- Mark jobs as featured to appear on the home page
- Review all received applications
- View applicant details and resumes
- Accept or reject applications with custom messages
- Send notifications to applicants
- Manage admin profile

## Technology Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS with custom admin (blue) and user (green) color themes
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (email/password)
- **Storage**: Supabase Storage for resume uploads
- **Routing**: React Router v6

## Getting Started

### Prerequisites
- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Install dependencies:
```bash
npm install
```

2. The database schema has already been set up with:
   - User profiles with role-based access (admin/user)
   - Jobs table with featured job support
   - Applications with status tracking
   - Notifications system
   - Storage bucket for resume uploads

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## First Steps

### Creating Admin and User Accounts

1. **Register as Admin**:
   - Go to the registration page
   - Fill in your details
   - Select "Employer / Admin" role
   - Complete registration

2. **Register as User (Job Seeker)**:
   - Go to the registration page
   - Fill in your details
   - Select "Job Seeker" role
   - Complete registration

### Admin Workflow

1. **Post a Job**:
   - Login as admin
   - Go to Job Management
   - Click "Add New Job"
   - Fill in job details (title, company, location, salary, description, etc.)
   - Optionally mark as "Featured" to show on home page
   - Submit

2. **Manage Applications**:
   - Go to Applications page
   - View all received applications
   - Click on an application to see full details and resume
   - Accept or reject with custom messages
   - Notifications are automatically sent to applicants

3. **Update Profile**:
   - Go to Profile page
   - Click Edit Profile
   - Update your information
   - Save changes

### User Workflow

1. **Browse Jobs**:
   - Login as user
   - View all active job listings
   - Use search and filters to find relevant positions

2. **Apply to a Job**:
   - Click on a job to view details
   - Click "Apply Now"
   - Fill in application form
   - Upload your resume (PDF, DOC, or DOCX)
   - Submit application

3. **Track Applications**:
   - Go to My Profile
   - Switch to "My Applications" tab
   - View status of all your applications
   - Download your submitted resume

4. **Check Notifications**:
   - Go to My Profile
   - Switch to "Notifications" tab
   - View messages from employers about your applications
   - Click to mark as read

## Project Structure

```
src/
├── components/
│   ├── AdminLayout.jsx      # Admin panel layout with navigation
│   ├── UserLayout.jsx       # User panel layout with navigation
│   └── ProtectedRoute.jsx   # Route protection by role
├── contexts/
│   └── AuthContext.jsx      # Authentication state management
├── lib/
│   └── supabase.js          # Supabase client configuration
├── pages/
│   ├── Home.jsx             # Public home page with featured jobs
│   ├── Login.jsx            # Login page
│   ├── Register.jsx         # Registration page
│   ├── admin/
│   │   ├── AdminDashboard.jsx      # Job management
│   │   ├── AdminApplications.jsx   # Application review
│   │   └── AdminProfile.jsx        # Admin profile
│   └── user/
│       ├── UserJobs.jsx     # Job browsing
│       ├── JobDetails.jsx   # Job details and application
│       └── UserProfile.jsx  # User profile, applications, notifications
├── App.jsx                  # Main app with routing
├── index.css               # Tailwind CSS and custom styles
└── main.jsx                # App entry point
```

## Design Features

- **Minimal UI**: Clean, modern interface with focus on content
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Color Coding**:
  - Admin sections: Blue theme (#1e40af)
  - User sections: Green theme (#059669)
  - Home page: Gradient mix of both
- **Smooth Animations**: Hover effects, transitions, and loading states
- **Intuitive Navigation**: Clear navigation with active state indicators
- **Status Indicators**: Color-coded badges for application and job status

## Database Schema

### Tables
- **profiles**: User profiles with role (admin/user)
- **jobs**: Job listings with featured flag
- **applications**: Job applications with status tracking
- **notifications**: User notifications

### Storage
- **job-applications**: Bucket for resume uploads in /resumes folder

## Security Features

- Row Level Security (RLS) enabled on all tables
- Role-based access control (admin/user)
- Authenticated-only access to job data
- Secure resume storage with proper access policies
- Session management with Supabase Auth

## Support

For issues or questions, please refer to the documentation or contact support.

---

Built with care for job seekers and employers.
