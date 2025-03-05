# WatPlan - UWaterloo Degree Planner

WatPlan is a comprehensive degree planning tool for University of Waterloo students. It helps students track their academic progress, explore course options, and ensure they meet all their degree requirements.

## Features

- **Degree Planning**: Create and manage your academic plans
- **Course Tracking**: Add courses you've taken or plan to take
- **Requirement Tracking**: See which degree requirements you've fulfilled and which ones you still need to complete
- **Multiple Programs**: Support for majors, minors, specializations, and more
- **Course Catalog**: Browse available courses and their descriptions
- **Program Explorer**: View detailed information about UWaterloo programs

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with GitHub and Google OAuth

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
   npx prisma migrate dev
   ```

5. Run the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Data Sources

The application data is manually entered based on the University of Waterloo academic calendar and degree requirements. This ensures accurate and up-to-date information for students planning their degrees.

## Deploy on Vercel

The easiest way to deploy this app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- University of Waterloo for providing comprehensive degree requirement information
- All contributors who have helped to build and improve this project