import cron from 'node-cron';
import { PrismaClient } from "@prisma/client";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const LOG_DIR = path.join(__dirname, '../logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Setup logging
function logToFile(message: string) {
  const date = new Date().toISOString().split('T')[0];
  const logFile = path.join(LOG_DIR, `cleanup-${date}.log`);
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  fs.appendFileSync(logFile, logMessage);
  console.log(message);
}

async function cleanupGuestAccounts() {
  try {
    logToFile("Starting guest account cleanup...");
    
    const now = new Date();
    
    // Find expired guest accounts
    const expiredGuests = await prisma.user.findMany({
      where: {
        isGuest: true,
        guestExpiresAt: {
          lt: now,
        },
      },
      include: {
        plans: true,
      },
    });
    
    logToFile(`Found ${expiredGuests.length} expired guest accounts`);
    
    // Delete each expired guest account
    for (const guest of expiredGuests) {
      logToFile(`Deleting guest account ${guest.id} (${guest.email}) with ${guest.plans.length} plans`);
      
      // Delete the user (cascades to delete their plans due to Prisma schema)
      await prisma.user.delete({
        where: {
          id: guest.id,
        },
      });
    }
    
    logToFile("Guest account cleanup completed successfully");
  } catch (error) {
    logToFile(`Error cleaning up guest accounts: ${error}`);
  }
}

// Schedule the cleanup to run daily at 3:00 AM
cron.schedule('0 3 * * *', async () => {
  logToFile('Running scheduled guest account cleanup task');
  await cleanupGuestAccounts();
});

// Also provide a way to run cleanup immediately
if (process.argv.includes('--run-now')) {
  (async () => {
    logToFile('Running immediate guest account cleanup');
    await cleanupGuestAccounts();
    await prisma.$disconnect();
    process.exit(0);
  })();
} else {
  logToFile('Guest account cleanup scheduler started. Running daily at 3:00 AM.');
}