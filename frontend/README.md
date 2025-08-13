# Yapply Frontend

A modern React-based frontend application for AI-powered interview scheduling and management platform.

## Overview

Yapply is an interview management system that allows companies to schedule AI-powered interviews with candidates using magic link authentication. The platform provides separate dashboards for companies and candidates with comprehensive interview tracking and evaluation features.

## Features

### Company Features
- **Company Authentication**: Secure login for company representatives
- **Interview Scheduling**: Create and schedule interviews for candidates
- **Dashboard Management**: View and manage all scheduled interviews
- **Candidate Evaluation**: Access evaluation results and reports
- **Credential Generation**: Generate secure access credentials for candidates
- **Interview Deletion**: Remove interviews with confirmation dialog

### Candidate Features
- **Magic Link Authentication**: Secure passwordless login via email links
- **Interview Dashboard**: View scheduled interview details
- **Invalid Link Handling**: User-friendly error pages for expired links

## Tech Stack

This project is built with modern web technologies:

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Fetch API
- **Icons**: Lucide React
- **Form Handling**: Custom form components

## Getting Started

### Prerequisites

- Node.js 18+ and npm installed
- Git for version control

### Installation

1. **Clone the repository**
   ```sh
   git clone git@github.com:Irfan-Firosh/Yapply-frontend.git
   cd Yapply-frontend
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Start the development server**
   ```sh
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint for code quality checks

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Navigation.tsx  # Navigation component
│   └── ProtectedRoute.tsx
├── contexts/           # React Context providers
│   └── AuthContext.tsx
├── hooks/              # Custom React hooks
├── pages/              # Application pages/routes
│   ├── AdminDashboard.tsx
│   ├── CandidateDashboard.tsx
│   ├── ScheduleInterview.tsx
│   ├── InvalidLogin.tsx
│   └── ...
├── lib/                # Utility functions
└── App.tsx            # Main application component
```

## API Integration

The frontend integrates with a backend API for:

- Company authentication (`/api/company/`)
- Interview management (`/api/company/interviews`)
- Candidate authentication via magic links
- Interview data retrieval and management

## Deployment

The application can be deployed to any static hosting service like:

- Vercel
- Netlify  
- GitHub Pages
- AWS S3 + CloudFront

### Build for Production

```sh
npm run build
```

The built files will be in the `dist/` directory.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.