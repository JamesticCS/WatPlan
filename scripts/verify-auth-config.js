/**
 * Verification script to check if the necessary authentication
 * environment variables are set correctly.
 * 
 * Run with: node scripts/verify-auth-config.js
 */

// List of required environment variables for different auth methods
const requiredVariables = {
  core: ['NEXTAUTH_URL', 'NEXTAUTH_SECRET'],
  github: ['GITHUB_ID', 'GITHUB_SECRET'],
  google: ['GOOGLE_ID', 'GOOGLE_SECRET'],
  email: [
    'EMAIL_SERVER_HOST',
    'EMAIL_SERVER_PORT',
    'EMAIL_SERVER_USER',
    'EMAIL_SERVER_PASSWORD',
    'EMAIL_FROM'
  ],
  database: ['DATABASE_URL'],
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

// Verify environment variables
function verifyEnvironment() {
  console.log(`${colors.bright}WatPlan Authentication Configuration Verification${colors.reset}\n`);
  
  let allValid = true;
  
  // Check each category
  for (const [category, variables] of Object.entries(requiredVariables)) {
    console.log(`${colors.bright}${colors.cyan}${category.toUpperCase()} Configuration${colors.reset}`);
    
    let categoryValid = true;
    
    for (const variable of variables) {
      const value = process.env[variable];
      const isSet = !!value;
      
      if (isSet) {
        // Show masked value for sensitive information
        const displayValue = variable.includes('SECRET') || variable.includes('PASSWORD') 
          ? `${value.substring(0, 3)}${'*'.repeat(Math.max(0, value.length - 6))}${value.substring(value.length - 3)}`
          : value;
          
        console.log(`  ${colors.green}✓${colors.reset} ${variable}: ${displayValue}`);
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${variable}: ${colors.red}Not set${colors.reset}`);
        categoryValid = false;
      }
    }
    
    if (categoryValid) {
      console.log(`  ${colors.green}All ${category} variables are properly configured.${colors.reset}\n`);
    } else {
      console.log(`  ${colors.red}Some ${category} variables are missing. Authentication may not work correctly.${colors.reset}\n`);
      allValid = false;
    }
  }
  
  // Final summary
  if (allValid) {
    console.log(`${colors.bright}${colors.green}All authentication configuration variables are set correctly!${colors.reset}`);
    console.log(`${colors.green}Your authentication system should be working properly.${colors.reset}`);
  } else {
    console.log(`${colors.bright}${colors.yellow}Authentication configuration is incomplete.${colors.reset}`);
    console.log(`${colors.yellow}Please check AUTHENTICATION.md for setup instructions.${colors.reset}`);
  }
  
  // Additional OAuth URL check
  if (process.env.NEXTAUTH_URL) {
    console.log(`\n${colors.bright}OAuth Callback URLs${colors.reset}`);
    console.log(`Ensure these URLs are configured in your OAuth provider settings:`);
    console.log(`  ${colors.cyan}GitHub:${colors.reset} ${process.env.NEXTAUTH_URL}/api/auth/callback/github`);
    console.log(`  ${colors.cyan}Google:${colors.reset} ${process.env.NEXTAUTH_URL}/api/auth/callback/google`);
  }
}

// Load environment variables from .env file if it exists
try {
  require('dotenv').config();
} catch (error) {
  console.log(`${colors.yellow}Warning: dotenv package not found. Using existing environment variables.${colors.reset}`);
}

// Run the verification
verifyEnvironment();