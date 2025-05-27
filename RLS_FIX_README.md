# Fix for Supabase RLS and Missing Function Issues

This README explains how to fix two issues:

1. The missing `isValidEmail` function
2. The Row-Level Security (RLS) policy error for the `leads` table

## What's been fixed

1. **Added missing `isValidEmail` function**:
   - Added the missing function to `src/lib/utils.ts`

2. **Created RLS policies for the leads table**:
   - Created migration files to properly set up RLS policies
   - Added a script to apply migrations

## How to Apply the Fixes

### Step 1: Make sure you have the required environment variables

Add the following to your `.env.local` file if not already present:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get these values from your Supabase project dashboard.

### Step 2: Install required dependencies

```bash
npm install dotenv --save-dev
```

### Step 3: Apply the migrations

First, run the SQL function migration:

```bash
node scripts/apply-migration.js src/lib/migrations/003_create_exec_sql_function.sql
```

Then, apply the RLS policy migration:

```bash
node scripts/apply-migration.js src/lib/migrations/002_leads_rls_policy.sql
```

### Step 4: Restart your application

```bash
npm run dev
```

## Explanation

The error was occurring because:

1. The `isValidEmail` function was imported in `supabase.ts` but not defined in `utils.ts`
2. The `leads` table had Row-Level Security enabled, but no policy was set for anonymous inserts, which is needed for the registration form to work

These fixes allow the registration form to properly insert new leads into the database. 