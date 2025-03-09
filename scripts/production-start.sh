#!/bin/bash

# This script starts the Next.js application and the guest cleanup scheduler

# Start the cleanup scheduler in the background
echo "Starting guest account cleanup scheduler..."
npm run cleanup:start-scheduler &
SCHEDULER_PID=$!

# Start the Next.js application
echo "Starting Next.js application..."
npm run start

# When the application stops, also stop the scheduler
echo "Application stopped. Stopping scheduler..."
kill $SCHEDULER_PID