#!/usr/bin/env ts-node
/**
 * Script to apply the case-insensitive email migration
 * Run with: npx ts-node scripts/apply-email-case-insensitive.ts
 */
import { exec } from 'child_process';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
    
    // Apply the SQL migration directly
    console.log('Applying SQL migration directly...');
    
    // SQL to create a trigger for normalizing emails
    const sql = `
    -- First, create a function to handle case-insensitive email comparison
    CREATE OR REPLACE FUNCTION normalize_email(email TEXT) 
    RETURNS TEXT AS $$ 
    BEGIN 
      RETURN lower(email); 
    END; 
    $$ LANGUAGE plpgsql;

    -- Create a trigger function that normalizes email on insert or update
    CREATE OR REPLACE FUNCTION normalize_email_trigger()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Only normalize if email is not null
      IF NEW.email IS NOT NULL THEN
        NEW.email = lower(NEW.email);
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create a trigger on the User table
    DROP TRIGGER IF EXISTS normalize_user_email ON "User";
    CREATE TRIGGER normalize_user_email
    BEFORE INSERT OR UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION normalize_email_trigger();
    `;
    
    // Execute the SQL directly
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('SQL migration applied successfully!');
      console.log('Email addresses are now case-insensitive in the database.');
    } catch (sqlError) {
      console.error('Error applying SQL migration:', sqlError);
    }
    
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();