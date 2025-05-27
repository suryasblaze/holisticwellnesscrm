const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Applying migration: ${path.basename(filePath)}`);
    
    // Execute the SQL with RPC to avoid API limitations
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('Migration applied successfully');
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

// Usage: node apply-migration.js <migration-file-path>
const migrationFilePath = process.argv[2];

if (!migrationFilePath) {
  console.error('Please provide a migration file path');
  console.log('Usage: node apply-migration.js <migration-file-path>');
  process.exit(1);
}

applyMigration(migrationFilePath); 