# WatPlan - UWaterloo Degree Planner (Beta)

WatPlan is a degree planning tool for University of Waterloo students, designed to simplify the complex process of academic planning. Currently in beta, WatPlan helps students visualize their course sequence and plan their academic journey in one place.

![WatPlan Dashboard Overview](/public/screenshots/dashboard-overview.png)

## Current Features

### Interactive Degree Planning
Create and manage your academic plans with a visual term-by-term layout. Easily add, remove, and rearrange courses across different terms to see how your degree will unfold.

![Planning Interface](/public/screenshots/planning-interface.gif)

### PDF Transcript Upload (Beta)
Upload your UWaterloo transcript to import your completed courses. The system attempts to map courses to your plan and organize them by term.

### Course Catalog
Access a database of UWaterloo courses with descriptions and basic information.

### Flexible Authentication
Register with email/password, sign in with Google or GitHub, or try the system with a temporary guest account that can later be converted to a permanent account.

## Upcoming Features

### Requirement Validation
Track degree requirements and see which ones you've fulfilled and which ones you still need to complete.

### Program Explorer
Browse detailed information about UWaterloo programs, including required courses and options.

### Multi-Program Support
Add multiple programs to your plan (majors, minors, options, specializations).

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- PostgreSQL database

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/watplan.git
   cd watplan
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   - Copy `.env.example` to `.env` and fill in the required values
   - You'll need to provide database connection details and OAuth credentials

4. Set up the database
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

5. Run the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Responsive Design Goals

WatPlan is being designed with responsiveness in mind and aims to work well on devices of all sizes, from desktop to mobile phones.

## Data Sources

Course and program data comes from multiple sources:
- UWaterloo's official academic calendar
- UWFlow API for additional course ratings and information
- Manual curation to ensure accuracy of degree requirements

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with Google, GitHub, and Email providers
- **PDF Processing**: react-pdftotext for client-side transcript parsing

## Deployment

This application can be easily deployed on [Vercel](https://vercel.com), which provides a seamless experience for Next.js applications.

## API Documentation

For a comprehensive list of API endpoints, see [API.md](API.md)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- University of Waterloo for providing comprehensive degree requirement information
- UWFlow for additional course data and inspiration
- All contributors who have helped to build and improve this project