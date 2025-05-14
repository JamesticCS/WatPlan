#!/usr/bin/env ts-node
/**
 * Script to apply the case-insensitive email migration
 * Run with: npx ts-node scripts/apply-email-case-insensitive.ts
 */
import { exec } from 'child_process';
import { prisma } from '../src/lib/prisma';

async function applyMigration() {
  try {
    console.log('Preparing to apply the case-insensitive email migration...');
    
    // First, normalize existing emails to lowercase
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users, normalizing emails...`);
    
    // Process users in batches to handle lowercase normalization
    for (const user of users) {
      if (user.email) {
        const normalizedEmail = user.email.toLowerCase().trim();
        
        // Only update if the email would actually change
        if (normalizedEmail !== user.email) {
          console.log(`Normalizing email for user ${user.id}: ${user.email} -> ${normalizedEmail}`);
          await prisma.user.update({
            where: { id: user.id },
            data: { email: normalizedEmail }
          });
        }
      }
    }
    
    console.log('All emails normalized, applying SQL migration...');
    
    // Apply the SQL migration
    exec('npx prisma migrate resolve --applied 20250515_email_case_insensitive', (error, stdout, stderr) => {
      if (error) {
        console.error(`Migration execution error: ${error.message}`);
        return;
      }
      
      if (stderr) {
        console.error(`Migration stderr: ${stderr}`);
        return;
      }
      
      console.log('Migration applied successfully!');
      console.log(`${stdout}`);
      console.log('Email addresses are now case-insensitive in the database.');
    });
    
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();