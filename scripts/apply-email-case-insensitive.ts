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
    
    // Execute each SQL statement separately
    try {
      console.log('Creating normalize_email function...');
      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION normalize_email(email TEXT) 
        RETURNS TEXT AS $$ 
        BEGIN 
          RETURN lower(email); 
        END; 
        $$ LANGUAGE plpgsql;
      `);
      
      console.log('Creating normalize_email_trigger function...');
      await prisma.$executeRawUnsafe(`
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
      `);
      
      console.log('Dropping existing trigger if any...');
      await prisma.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS normalize_user_email ON "User";
      `);
      
      console.log('Creating trigger on User table...');
      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER normalize_user_email
        BEFORE INSERT OR UPDATE ON "User"
        FOR EACH ROW
        EXECUTE FUNCTION normalize_email_trigger();
      `);
      
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