# Supabase Notification System Setup Guide

> NOTE: This guide documents legacy Supabase/PostgreSQL setup and is not aligned with the current Firebase Firestore backend. Use it only for reference while migrating or archiving old documentation.

## Overview
This guide will walk you through setting up the notification system database tables in Supabase. The notification system allows users to receive real-time notifications for booking confirmations, booking updates, and promotional messages.

---

## Prerequisites
- ✅ Supabase database is created and accessible
- ✅ Railway backend is deployed and connected to Supabase
- ✅ Database connection pooler is configured (to avoid IPv6 issues)

---

## PART 1: Run Database Migrations

### Step 1: Open Supabase SQL Editor
1. **Navigate to Supabase Dashboard:**
   - Open your web browser
   - Go to https://app.supabase.com
   - Make sure you're logged in (if not, click "Log In" in the top right corner)

2. **Select Your Project:**
   - On the Supabase dashboard homepage, you'll see a list of your projects
   - Click on your project: `delta-hotel-db` (or your project name)

3. **Open SQL Editor:**
   - In the left sidebar, look for **"SQL Editor"** (it has a code/file icon)
   - Click on **"SQL Editor"**
   - The SQL Editor will open in the main panel

4. **Create a New Query:**
   - In the SQL Editor, look for a button labeled **"New query"** (usually at the top)
   - Click **"New query"**
   - A blank query editor will appear

---

### Step 2: Run Migration 1 - Add Type Column

1. **Open the Migration File:**
   - In your local project, navigate to: `server/src/sql/`
   - Open the file: `012_add_notification_type.sql`
   - Select all the contents (Ctrl+A) and copy it (Ctrl+C)

2. **Paste into Supabase SQL Editor:**
   - Go back to Supabase SQL Editor (in your browser)
   - Click in the query editor area
   - Paste the SQL code (Ctrl+V)
   - You should see SQL code that starts with:
     ```sql
     -- Add type column to notifications table for categorizing notifications
     DO $$
     BEGIN
     ...
     ```

3. **Run the Migration:**
   - Look for a **"Run"** button (usually at the bottom right of the editor, or press Ctrl+Enter)
   - Click **"Run"** or press `Ctrl+Enter`
   - Wait for the query to execute (usually takes 1-2 seconds)

4. **Verify Success:**
   - You should see a success message in the results panel
   - Look for: `✅ Added type column to notifications table` or similar
   - If you see an error, check the error message and try again

---

### Step 3: Run Migration 2 - Fix UUID Types (REQUIRED)

**⚠️ IMPORTANT:** This migration will delete all existing notifications because it changes column types from INT to UUID. This is expected and necessary.

1. **Create a New Query:**
   - In Supabase SQL Editor, click **"New query"** again
   - This creates a fresh query editor

2. **Open the Migration File:**
   - In your local project, navigate to: `server/src/sql/`
   - Open the file: `013_fix_notification_uuid_types.sql`
   - Select all the contents (Ctrl+A) and copy it (Ctrl+C)

3. **Paste into Supabase SQL Editor:**
   - Go back to Supabase SQL Editor
   - Click in the new query editor area
   - Paste the SQL code (Ctrl+V)
   - You should see SQL code that starts with:
     ```sql
     -- Fix notifications table to use UUID types for user_id and booking_id
     ...
     ```

4. **Review the Migration:**
   - This migration will:
     - Drop foreign key constraints
     - **Delete all existing notifications** (TRUNCATE TABLE)
     - Change `user_id` from INT to UUID
     - Change `booking_id` from INT to UUID
     - Re-add foreign key constraints

5. **Run the Migration:**
   - Click **"Run"** or press `Ctrl+Enter`
   - Wait for the query to execute (usually takes 1-2 seconds)

6. **Verify Success:**
   - You should see a success message: `✅ Notifications table updated to use UUID types!`
   - If you see an error, check the error message

---

## PART 2: Verify Tables Were Created/Updated

### Step 4: Check Notifications Table

1. **Open Table Editor:**
   - In Supabase Dashboard, look at the left sidebar
   - Click on **"Table Editor"** (it has a table/grid icon)
   - The Table Editor will open showing all your tables

2. **Find the Notifications Table:**
   - Scroll through the list of tables
   - Look for a table named **"notifications"**
   - Click on it to open the table view

3. **Verify Table Structure:**
   - The table should have these columns:
     - `id` - Type: `int4` or `serial` (Primary Key)
     - `user_id` - Type: `uuid` ✅ (Must be UUID, not int4)
     - `message` - Type: `text`
     - `booking_id` - Type: `uuid` ✅ (Must be UUID, not int4, can be NULL)
     - `type` - Type: `varchar` or `text` ✅ (Should exist)
     - `read` - Type: `bool` or `boolean`
     - `created_at` - Type: `timestamp`

4. **Check Column Types:**
   - **Critical:** `user_id` and `booking_id` must be `uuid` type
   - If they show as `int4` or `integer`, the migration didn't work correctly
   - If `type` column is missing, Migration 1 didn't run correctly

---

## PART 3: Test the Notification System

### Step 5: Test Backend API Endpoint

1. **Test Notifications Endpoint:**
   - Open a new browser tab
   - Go to: `https://mlabhotelteamdelta-production.up.railway.app/notifications`
   - You should see a JSON response (may be empty array `[]` if no notifications exist)
   - If you see `{"ok": false, "error": "..."}`, check the error message

2. **Expected Response:**
   ```json
   {"ok": true, "data": []}
   ```
   - Empty array is fine - it means no notifications yet, but the endpoint works

3. **If You Get 401 Error:**
   - This is expected - the endpoint requires authentication
   - The endpoint is working correctly, it just needs a logged-in user

---

### Step 6: Test in Your Application

1. **Start Your Frontend:**
   - In your terminal, make sure you're in the project root
   - Run: `npm run dev`
   - Wait for the dev server to start

2. **Log In as a User:**
   - Open your app in browser: `http://localhost:5173` (or your dev URL)
   - Log in with a user account
   - You should see the notification bell icon in the navbar

3. **Create a Test Booking:**
   - Navigate to hotel details or booking page
   - Create a test booking
   - After booking is created, check the notification bell
   - You should see a notification badge with "1" or similar
   - Click the bell to see the booking confirmation notification

4. **Test Admin Promotions:**
   - Log in as an admin user
   - Go to Admin Dashboard
   - Look for "Send Promotions" in the sidebar
   - Click on it
   - Enter a test message
   - Click "Send to All Users"
   - Check if users receive the promotion notification

---

## Troubleshooting

### Problem: Migration fails with "column already exists"
**Solution:**
- The `type` column might already exist
- Check the Table Editor to see if the column exists
- If it exists, you can skip Migration 1
- If you want to re-run it, you can modify the SQL to use `IF NOT EXISTS` (which the migration already does)

### Problem: Migration fails with "cannot cast type integer to uuid"
**Solution:**
- This means there's existing data in the notifications table
- Migration 2 should handle this by truncating the table first
- Make sure you're running Migration 2 (013_fix_notification_uuid_types.sql), not Migration 1
- If the error persists, manually delete all rows: `DELETE FROM notifications;` then re-run Migration 2

### Problem: Notifications not appearing in frontend
**Solution:**
1. Check browser console (F12) for errors
2. Verify user is authenticated (`hotel_token` in localStorage)
3. Check Network tab - look for requests to `/notifications` endpoint
4. Verify the endpoint returns data: Test `https://mlabhotelteamdelta-production.up.railway.app/notifications` with authentication
5. Check Railway logs for backend errors

### Problem: "relation 'notifications' does not exist"
**Solution:**
- The notifications table doesn't exist yet
- Check if you ran the initial migrations (from `001_init.sql`)
- The notifications table should be created in `001_init.sql`
- If it doesn't exist, you may need to create it manually or run all migrations from the beginning

### Problem: Foreign key constraint errors
**Solution:**
- This usually means `user_id` or `booking_id` values don't match existing users/bookings
- Make sure the `users` and `bookings` tables exist and have UUID primary keys
- Verify the foreign key constraints are set up correctly in Migration 2

---

## Verification Checklist

After completing all steps, verify:

- [ ] Migration 1 (012_add_notification_type.sql) ran successfully
- [ ] Migration 2 (013_fix_notification_uuid_types.sql) ran successfully
- [ ] `notifications` table exists in Supabase Table Editor
- [ ] `user_id` column is UUID type (not INT)
- [ ] `booking_id` column is UUID type (not INT)
- [ ] `type` column exists and is VARCHAR/TEXT type
- [ ] Backend endpoint `/notifications` returns JSON (not 500 error)
- [ ] Notification bell appears in navbar when logged in
- [ ] Creating a booking generates a notification
- [ ] Admin can send promotional notifications

---

## Quick Reference: Migration Files Location

- **Migration 1:** `server/src/sql/012_add_notification_type.sql`
- **Migration 2:** `server/src/sql/013_fix_notification_uuid_types.sql`

---

## Next Steps After Setup

1. **Test the System:**
   - Create a booking as a user
   - Check notification bell for confirmation
   - Have admin update booking status
   - Check for update notification
   - Send a promotional notification from admin panel

2. **Monitor for Issues:**
   - Check Railway logs if notifications don't appear
   - Check browser console for frontend errors
   - Verify database connection is working

3. **Customize (Optional):**
   - Adjust notification polling interval (currently 30 seconds)
   - Customize notification messages
   - Add more notification types if needed

---

## Support

If you encounter issues:
1. Check Railway deployment logs for backend errors
2. Check Supabase SQL Editor for any error messages
3. Verify all environment variables are set correctly in Railway
4. Ensure database connection pooler is configured (to avoid IPv6 issues)

---

**Last Updated:** November 20, 2025  
**Compatible With:** Supabase Free Tier + Railway Backend

