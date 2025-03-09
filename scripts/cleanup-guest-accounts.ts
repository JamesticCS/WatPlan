import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupGuestAccounts() {
  try {
    console.log("Starting guest account cleanup...");
    
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
    
    console.log(`Found ${expiredGuests.length} expired guest accounts`);
    
    // Delete each expired guest account
    for (const guest of expiredGuests) {
      console.log(`Deleting guest account ${guest.id} (${guest.email}) with ${guest.plans.length} plans`);
      
      // Delete the user (cascades to delete their plans due to Prisma schema)
      await prisma.user.delete({
        where: {
          id: guest.id,
        },
      });
    }
    
    console.log("Guest account cleanup completed successfully");
  } catch (error) {
    console.error("Error cleaning up guest accounts:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup function
cleanupGuestAccounts();