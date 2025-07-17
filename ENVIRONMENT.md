# Environment Variables for Mobile App

This mobile app requires the following environment variables to be set for Supabase connection.

## Required Environment Variables

Add these to your `.env` file in the root of the mobile app directory:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Setup Instructions

1. Create a `.env` file in the `apps/mobile/aac-app/` directory
2. Copy the environment variables above and replace with your actual values
3. **NEVER** commit your `.env` file to version control
4. The `.env` file should already be in your `.gitignore`

## Getting Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings > API
4. Copy the Project URL and anon/public key

## Security Note

The previous `supabaseClient.ts` file contained hardcoded credentials which was a security risk. This new setup uses environment variables which is the proper secure approach. 