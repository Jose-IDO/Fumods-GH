# Database Hosting Guide - Step by Step

> NOTE: This guide documents legacy Supabase/PostgreSQL hosting and is not aligned with the current Firebase Firestore backend. Use it only for reference while migrating or archiving old documentation.

## Simplest Method: Supabase (Free PostgreSQL Database)

This guide will walk you through hosting your PostgreSQL database online using Supabase, which is the simplest and easiest free option available.

---

## Prerequisites
- A Supabase account (free)
- Your backend code ready
- Access to your GitHub repository

---

## PART 1: Setting Up Supabase Database

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Click **"Start your project"** or **"Sign Up"**
3. Sign up using:
   - GitHub account (recommended), OR
   - Email address
4. Verify your email if required

### Step 2: Create a New Project
1. Once logged in, click **"New Project"** button
2. Fill in the project details:
   - **Name**: `delta-hotel-db` (or any name you prefer)
   - **Database Password**: Create a strong password (SAVE THIS - you'll need it!)
     - Use a password manager or write it down securely
     - Example: `MySecurePass123!@#`
   - **Region**: Choose closest to your users (e.g., `South Africa` if available, or `US East`)
3. Click **"Create new project"**
4. Wait 2-3 minutes for the project to be created

### Step 3: Get Database Connection Details
1. Once project is created, go to **Settings** (gear icon in left sidebar)
2. Click on **"Database"** in the settings menu
3. Scroll down to **"Connection string"** section
4. Find **"URI"** tab - this is your full connection string
5. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
6. Also note these individual values (you'll need them):
   - **Host**: `db.xxxxx.supabase.co` (the part after @)
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: The password you created in Step 2

### Step 4: Test Database Connection (Optional)
1. In Supabase dashboard, go to **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Type: `SELECT version();`
4. Click **"Run"** (or press Ctrl+Enter)
5. You should see PostgreSQL version information - this confirms your database is working

---

## PART 2: Setting Up Database Tables

### Step 5: Run Database Migrations
Your backend has SQL migration files that need to be run on Supabase.

1. In Supabase dashboard, go to **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Open your local project and navigate to: `server/src/sql/`
4. You'll see files numbered like:
   - `000_setup.sql`
   - `001_init.sql`
   - `002_add_status_column.sql`
   - etc.

5. **Run migrations in order:**
   - Copy the contents of `000_setup.sql`
   - Paste into Supabase SQL Editor
   - Click **"Run"**
   - Wait for success message
   - Repeat for `001_init.sql`
   - Continue with all numbered files in order

6. **Alternative method** (if you have many files):
   - You can combine all SQL files into one
   - Copy all content from all `.sql` files in order
   - Paste into one query in Supabase
   - Click **"Run"**

### Step 6: Verify Tables Were Created
1. In Supabase dashboard, go to **"Table Editor"** (left sidebar)
2. You should see tables like:
   - `users`
   - `rooms`
   - `bookings`
   - `payments`
   - etc.
3. If you see these tables, your database is set up correctly!

---

## PART 3: Hosting Your Backend API

### Step 7: Choose Backend Hosting Platform
**Recommended: Railway** (easiest and free tier available)

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Sign up using GitHub (recommended)

### Step 8: Deploy Backend to Railway
1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub if prompted
4. Select your repository: `Mlab_Hotel_Team_Delta`
5. Railway will detect your project

### Step 9: Configure Railway Project
1. **After Selecting Repository:**
   - After selecting your repo in Step 8, Railway will create your project
   - You'll be taken to your project page
   - A right-side panel will slide open from the right side of the screen
   - This panel shows tabs: **"Deployments"**, **"Variables"**, **"Metrics"**, and **"Settings"**

2. **Open the Settings Tab:**
   - In the right-side panel, click on the **"Settings"** tab (usually the rightmost tab)
   - The Settings tab content will appear in the panel

3. **Find Root Directory Setting:**
   - In the Settings tab, scroll down within the right-side panel
   - Look for a setting labeled **"Root Directory"** or **"Working Directory"**
   - It may be under a section like "Build & Deploy" or "General"

4. **Set Root Directory:**
   - Click on the **"Root Directory"** input field
   - Type: `server` (this tells Railway where your backend code is located)
   - Make sure there are no extra spaces before or after

5. **Save the Setting:**
   - Look for a **"Save"** button (usually at the bottom of the Settings panel or next to the Root Directory field)
   - Click **"Save"**
   - Railway will automatically redeploy with the new setting

### Step 10: Set Environment Variables in Railway
1. **Navigate to Your Project:**
   - In Railway dashboard, click on your project (the one you created in Step 8)
   - A right-side panel will slide open from the right side of the screen
   - This panel shows tabs: **"Deployments"**, **"Variables"**, **"Metrics"**, and **"Settings"**

2. **Open the Variables Tab:**
   - In the right-side panel, click on the **"Variables"** tab (it's usually the second tab from the left)
   - The Variables tab content will appear in the panel

3. **Add a New Variable:**
   - In the Variables tab, look for a **"New Variable"** button (usually at the top of the variables list)
   - Click the **"New Variable"** button
   - A form or input fields will appear for adding a new variable

4. **Add Each Variable One by One:**
   - For each variable below, click **"New Variable"**, enter the Name and Value, then click **"Save"** or **"Add"**
   - Repeat this process for each variable:

   **Database Variables:**
   - Name: `DB_HOST`
     Value: `db.xxxxx.supabase.co` (from Step 3)
   
   - Name: `DB_USER`
     Value: `postgres`
   
   - Name: `DB_PASS`
     Value: Your Supabase password (from Step 2)
   
   - Name: `DB_NAME`
     Value: `postgres`
   
   - Name: `DB_PORT`
     Value: `5432`

   **Server Variables:**
   - Name: `PORT`
     Value: `4000`

   **JWT Secret:**
   - Name: `JWT_SECRET`
     Value: Generate a random string (you can use: https://randomkeygen.com/)
     Example: `aB3$kL9@mN2#pQ7&rT5*wY8!`

   **OAuth/Public URL:**
   - Name: `PUBLIC_BASE_URL`
     Value: Your frontend URL (e.g., `https://Jose-IDO.github.io/Mlab_Hotel_Team_Delta`)

   **Cloudinary (if using image uploads):**
   - Name: `CLOUDINARY_CLOUD_NAME`
     Value: Your Cloudinary cloud name (if you have one)
   
   - Name: `CLOUDINARY_API_KEY`
     Value: Your Cloudinary API key
   
   - Name: `CLOUDINARY_API_SECRET`
     Value: Your Cloudinary API secret

5. After adding all variables, Railway will automatically redeploy

### Step 11: Get Your Backend API URL
1. **Navigate to Railway Dashboard:**
   - Open your web browser
   - Go to https://railway.app
   - Make sure you're logged in (if not, click "Log In" in the top right corner)

2. **Find Your Project:**
   - On the Railway dashboard homepage, you'll see a list of your projects
   - Look for the project you created in Step 8 (it should show the name you gave it or your repository name)
   - Click on the project card/box to open it

3. **Open the Right-Side Panel:**
   - After clicking on your project, a panel will slide open from the right side of the screen
   - This panel contains tabs at the top: **"Deployments"**, **"Variables"**, **"Metrics"**, and **"Settings"**
   - You should see this panel on the right side of your screen

4. **Click on the Settings Tab:**
   - In the right-side panel, look at the top where the tabs are displayed
   - Click on the **"Settings"** tab (it's usually the rightmost tab in the list)
   - The Settings tab content will appear in the panel

5. **Find the Domains Section:**
   - In the Settings tab, scroll down within the right-side panel
   - Look for a section labeled **"Domains"** or **"Custom Domain"** or **"Public Domain"**
   - This section shows your Railway-generated domain
   - You may need to scroll down past other settings like "General", "Build & Deploy", etc.

6. **Copy Your Domain:**
   - In the Domains section, you'll see a domain that looks like: `your-app-name.railway.app` or `your-app-name-production.up.railway.app`
   - There may be a **"Copy"** button (clipboard icon) next to it - click it to copy
   - OR you can manually click and drag to select the entire domain text, then press `Ctrl+C` (Windows) or `Cmd+C` (Mac) to copy
   - The full URL format is: `https://your-app-name.railway.app` (make sure to include `https://` when using it)
   - Example: `https://delta-hotel-api.railway.app`
   - **Save this URL** - you'll need it for the next steps! 

7. **Note the Domain:**
   - Write down or copy this URL to a text file
   - This is your backend API base URL
   - All your API endpoints will be accessed through this URL

### Step 12: Test Your Backend API
1. **Open a New Browser Tab:**
   - In your web browser, press `Ctrl+T` (Windows) or `Cmd+T` (Mac) to open a new tab
   - Or click the "+" icon next to your current tab

2. **Navigate to Health Endpoint:**
   - In the address bar at the top, type: `https://your-backend-url.railway.app/health`
   - Replace `your-backend-url.railway.app` with the actual domain you copied in Step 11
   - Example: If your domain is `delta-hotel-api.railway.app`, type: `https://delta-hotel-api.railway.app/health`
   - Press `Enter` to load the page

3. **Check the Response:**
   - The page should display JSON text (not a webpage)
   - You should see something like:
     ```json
     {"ok": true, "message": "Server is running"}
     ```
   - Or it might show: `{"status": "ok"}` or similar

4. **Verify It's Working:**
   - If you see JSON with a success message, your backend is working correctly! ✅
   - If you see an error page (404, 500, etc.), check:
     - Did you use the correct domain from Step 11?
     - Did you include `https://` at the beginning?
     - Did you add `/health` at the end?
     - Is your Railway service still running? (Go back to Railway dashboard and check the service status)

5. **Alternative: Use Browser Developer Tools:**
   - Press `F12` to open Developer Tools
   - Click on the **"Network"** tab
   - Refresh the page (F5)
   - Look for the `/health` request
   - Click on it to see the response details

---

## PART 4: Updating Frontend to Use Hosted Backend

### Step 13: Create Frontend Environment File
1. **Open Your Project in Your Code Editor:**
   - Open VS Code, Cursor, or your preferred code editor
   - Open the project folder: `C:\Users\steve\Documents\mlcab-hotel` (or wherever your project is located)
   - Make sure you can see the file explorer/sidebar on the left

2. **Navigate to Project Root:**
   - In the file explorer, look for `package.json` file
   - The `.env` file needs to be in the same folder as `package.json` (this is called the "project root")
   - If you see folders like `src`, `server`, `node_modules` at the same level as `package.json`, you're in the right place

3. **Create the .env File:**
   - **Method 1 (VS Code/Cursor):**
     - Right-click in the file explorer sidebar (in the empty space, not on a file)
     - Select **"New File"** from the context menu
     - Type exactly: `.env` (including the dot at the beginning)
     - Press `Enter` to create the file
   
   - **Method 2 (File Explorer):**
     - Open Windows File Explorer
     - Navigate to your project root folder
     - Right-click in the folder → **"New"** → **"Text Document"**
     - Rename it to `.env` (you may need to enable "Show file extensions" in File Explorer settings)
     - When Windows warns about changing the extension, click **"Yes"**

4. **Add the Environment Variable:**
   - Open the `.env` file you just created (double-click it in your editor)
   - Type this exact line (no spaces around the equals sign):
     ```
     VITE_API_URL=https://your-backend-url.railway.app
     ```
   - Replace `your-backend-url.railway.app` with the actual Railway URL you copied in Step 11
   - Example: If your Railway URL is `https://delta-hotel-api.railway.app`, the line should be:
     ```
     VITE_API_URL=https://delta-hotel-api.railway.app
     ```
   - Make sure there are no extra spaces, quotes, or characters
   - Save the file: Press `Ctrl+S` (Windows) or `Cmd+S` (Mac)

5. **Verify .gitignore Exists:**
   - In your file explorer, look for a file named `.gitignore` in the project root (same folder as `package.json`)
   - If `.gitignore` exists, proceed to step 6
   - If `.gitignore` does NOT exist, create it:
     - Right-click in file explorer → **"New File"**
     - Name it: `.gitignore`
     - Open it and add this line: `.env`
     - Save the file

6. **Check .gitignore Contains .env:**
   - Open the `.gitignore` file
   - Look for a line that says `.env`
   - If it's there, you're good! ✅
   - If it's NOT there, add it:
     - Go to the end of the file
     - Press `Enter` to create a new line
     - Type: `.env`
     - Save the file (`Ctrl+S` or `Cmd+S`)

7. **Verify File Location:**
   - Your `.env` file should be at: `C:\Users\steve\Documents\mlcab-hotel\.env`
   - It should be at the same level as `package.json`, `src`, `server`, etc.
   - It should NOT be inside the `src` folder or any other subfolder

### Step 14: Update Frontend Code (If Needed)
Check if your frontend code uses the environment variable correctly:

1. **Check the Centralized API Config (Recommended Approach):**
   - In your code editor's file explorer (left sidebar)
   - Navigate to: `src` → `config`
   - Click on `api.ts` to open it
   - This file should contain a function that handles API URL configuration
   - **Verify it looks like this:**
     ```typescript
     const getApiUrl = () => {
       // Production: Railway backend
       if (import.meta.env.PROD) {
         return 'https://mlabhotelteamdelta-production.up.railway.app';
       }
       // Development: use .env file
       return import.meta.env.VITE_API_URL || 'http://localhost:4000';
     };
     export const API_URL = getApiUrl();
     ```
   - **If the production URL is different**, update it with your Railway URL from Step 11
   - This centralized config is the **best practice** - it handles both development and production

2. **Check if Files Use the Centralized Config:**
   - Press `Ctrl+Shift+F` (Windows) or `Cmd+Shift+F` (Mac) to open "Search in Files"
   - Type: `import.*API_URL.*from.*config/api` and press `Enter`
   - This will show files that import from the centralized config
   - **Files using the centralized config are correct!** ✅

3. **Check Files That Define API_URL Directly:**
   - In the same "Search in Files" dialog, search for: `const API_URL =`
   - This will show files that define `API_URL` directly (not using the centralized config)
   - **These files should be updated** to use the centralized config instead

4. **Verify Direct Definitions (If Not Using Centralized Config):**
   - For files that define `API_URL` directly, check if they use:
     - `const API_URL = (import.meta as any).env.VITE_API_URL as string;` ✅ (works, but no fallback)
     - `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';` ✅ (good - has fallback)
     - `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';` ⚠️ (wrong port - should be 4000)
     - `const API_URL = import.meta.env.VITE_API_URL;` ✅ (works, but no fallback)

5. **Recommended: Update Files to Use Centralized Config:**
   - **Best practice:** Update all files to import from the centralized config
   - For each file that defines `API_URL` directly:
     - Remove the line: `const API_URL = ...`
     - Add at the top with other imports: `import { API_URL } from '../config/api';` (adjust path as needed)
     - Example paths:
       - From `src/Components/SearchSection/` → `import { API_URL } from '../../config/api';`
       - From `src/Pages/` → `import { API_URL } from '../config/api';`
       - From `src/` → `import { API_URL } from './config/api';`

6. **Alternative: If You Don't Want to Use Centralized Config:**
   - Make sure all files that define `API_URL` directly use: `import.meta.env.VITE_API_URL || 'http://localhost:4000'`
   - The fallback port should be `4000` (not `3000`) to match your backend
   - Files without a fallback will fail if `.env` is missing, so adding a fallback is recommended

### Step 15: Test Frontend Locally
1. **Verify .env File Location:**
   - In your file explorer, confirm `.env` is in the project root (same folder as `package.json`)
   - Open `.env` and verify it contains: `VITE_API_URL=https://your-backend-url.railway.app`
   - Make sure the URL matches the one from Step 11

2. **Open Terminal/Command Prompt:**
   - In VS Code/Cursor: Press `` Ctrl+` `` (backtick key, usually above Tab) to open integrated terminal
   - OR open PowerShell/Command Prompt separately
   - Navigate to your project folder:
     ```bash
     cd C:\Users\steve\Documents\mlcab-hotel
     ```

3. **Stop Any Running Dev Server:**
   - If you see a process running in the terminal (showing logs, "Local: http://localhost:5173", etc.)
   - Press `Ctrl+C` to stop it
   - Wait for it to fully stop (you'll see the command prompt return)

4. **Start the Development Server:**
   - In the terminal, type: `npm run dev`
   - Press `Enter`
   - Wait for the server to start (you'll see output like "Local: http://localhost:5173" or similar)
   - **Don't close this terminal** - keep it running

5. **Open Your App in Browser:**
   - The terminal will show a URL like: `http://localhost:5173` or `http://localhost:3000`
   - Click on the URL in the terminal (it should be a clickable link)
   - OR manually open your browser and type the URL in the address bar
   - Your app should load in the browser

6. **Open Browser Developer Console:**
   - In your browser, press `F12` to open Developer Tools
   - Click on the **"Console"** tab at the top of the Developer Tools panel
   - This will show any errors or warnings from your app

7. **Check for API Errors:**
   - Look in the Console tab for any red error messages
   - Common errors to look for:
     - "Failed to fetch" - means the API URL might be wrong
     - "CORS error" - means backend CORS settings need adjustment
     - "404 Not Found" - means the API endpoint doesn't exist
   - If you see errors, note them down for troubleshooting

8. **Test Data Loading:**
   - In your app, try to:
     - View the homepage (should show rooms/deals if your app loads them)
     - Navigate to different pages
     - Try searching for rooms (if you have a search feature)
     - Check if data appears on the page
   - Watch the Console tab while doing this - it should show API requests

9. **Verify API Connection:**
   - In the Developer Tools, click on the **"Network"** tab
   - Refresh the page (press `F5`)
   - Look for requests to your Railway backend URL (you should see requests like `https://your-app.railway.app/api/...`)
   - Click on a request to see if it succeeded (status should be 200) or failed (status 404, 500, etc.)

10. **Confirm Success:**
    - If data loads on your page and you see successful API requests (status 200) in the Network tab, your frontend is connected correctly! ✅
    - If you see errors, check:
      - Is the `.env` file in the correct location?
      - Did you restart the dev server after creating `.env`?
      - Is the Railway backend URL correct in `.env`?
      - Is your Railway backend still running? (Test the `/health` endpoint again)

---

## PART 5: Deploying Updated Frontend

### Step 16: Build and Deploy Frontend
1. **Verify .env File is NOT Committed:**
   - Open your terminal/command prompt
   - Navigate to project root: `cd C:\Users\steve\Documents\mlcab-hotel`
   - Check git status: `git status`
   - Look for `.env` in the list - it should NOT appear (if it does, it means it's being tracked)
   - If `.env` appears, make sure it's in `.gitignore` (see Step 13, step 6)
   - If `.env` is listed as "untracked" or doesn't appear at all, that's correct! ✅

2. **Stop Development Server:**
   - If your dev server is still running (from Step 15), go to that terminal
   - Press `Ctrl+C` to stop it
   - Wait for it to fully stop

3. **Build Your Frontend:**
   - In your terminal, make sure you're in the project root directory
   - Type: `npm run build`
   - Press `Enter`
   - Wait for the build to complete (this may take 1-2 minutes)
   - You'll see output like "Build completed" or "dist/index.html"

4. **Verify Build Output:**
   - After the build completes, check your file explorer
   - You should see a new folder called `dist` in your project root
   - Open the `dist` folder - it should contain:
     - `index.html`
     - `assets` folder (with CSS and JS files)
     - Other static files
   - This is your production-ready frontend code

5. **Check package.json for Deploy Script:**
   - Open `package.json` in your code editor
   - Look for a `"scripts"` section
   - Check if there's a `"deploy"` script (it might say something like `"deploy": "npm run build && gh-pages -d dist"`)
   - If it exists, proceed to step 6
   - If it doesn't exist, you'll need to set up GitHub Pages manually (see step 7)

6. **Deploy to GitHub Pages (If Deploy Script Exists):**
   - In your terminal, type: `npm run deploy`
   - Press `Enter`
   - This will:
     - Build your app (if not already built)
     - Push the `dist` folder to the `gh-pages` branch on GitHub
     - Your site will be available at: `https://Jose-IDO.github.io/Mlab_Hotel_Team_Delta`
   - Wait for the deployment to complete (you'll see "Published" or similar message)

7. **Manual GitHub Pages Deployment (If No Deploy Script):**
   - Go to your GitHub repository: https://github.com/Jose-IDO/Mlab_Hotel_Team_Delta
   - Click on the **"Settings"** tab (top right of the repository page)
   - Scroll down to **"Pages"** in the left sidebar (under "Code and automation")
   - Under **"Source"**, select **"Deploy from a branch"**
   - Choose branch: `gh-pages` (or `main` if you prefer)
   - Select folder: `/ (root)` or `/dist` depending on your setup
   - Click **"Save"**
   - GitHub will provide a URL like: `https://Jose-IDO.github.io/Mlab_Hotel_Team_Delta`

8. **Important Note About Environment Variables:**
   - GitHub Pages is static hosting (no server-side processing)
   - Your `.env` file will NOT work on GitHub Pages
   - You need to hardcode the API URL in your code for production
   - This is why Step 17 is necessary

### Step 17: Create Production Config (For GitHub Pages)
Since GitHub Pages is static hosting, create a config file that hardcodes the production API URL:

1. **Create the Config Directory:**
   - In your code editor's file explorer, navigate to: `src` folder
   - Right-click on the `src` folder
   - Select **"New Folder"** from the context menu
   - Name it: `config` (all lowercase)
   - Press `Enter` to create it

2. **Create the API Config File:**
   - Right-click on the `config` folder you just created
   - Select **"New File"** from the context menu
   - Type exactly: `api.ts` (make sure it's `.ts`, not `.js`)
   - Press `Enter` to create the file

3. **Add the Config Code:**
   - Open the `api.ts` file you just created
   - Copy and paste this code into it:
     ```typescript
     const getApiUrl = () => {
       // In production (GitHub Pages), use the Railway backend URL
       if (import.meta.env.PROD) {
         return 'https://your-backend-url.railway.app';
       }
       // In development, use environment variable or default
       return import.meta.env.VITE_API_URL || 'http://localhost:4000';
     };

     export const API_URL = getApiUrl();
     ```
   - **IMPORTANT:** Replace `https://your-backend-url.railway.app` with your actual Railway URL from Step 11
   - Example: If your Railway URL is `https://delta-hotel-api.railway.app`, the line should be:
     ```typescript
     return 'https://delta-hotel-api.railway.app';
     ```
   - Save the file: Press `Ctrl+S` (Windows) or `Cmd+S` (Mac)

4. **Find All Files Using API_URL:**
   - Press `Ctrl+Shift+F` (Windows) or `Cmd+Shift+F` (Mac) to open "Search in Files"
   - Type: `API_URL` in the search box
   - Click "Search" or press `Enter`
   - This will show all files that contain `API_URL`
   - Note down the file paths (you'll need to update each one)

5. **Update Each File to Import from Config:**
   - For each file that uses `API_URL`, you need to:
     - Open the file
     - Find the line that defines `API_URL` (like `const API_URL = ...`)
     - Delete or comment out that line
     - At the top of the file (with other imports), add:
       ```typescript
       import { API_URL } from '../config/api';
       ```
       (Adjust the path `../config/api` based on the file's location relative to `src/config/api.ts`)
     - If the file is in `src/Components/SearchSection/`, use: `import { API_URL } from '../../config/api';`
     - If the file is in `src/`, use: `import { API_URL } from './config/api';`
   - Save each file after updating

6. **Verify the Import Paths:**
   - The import path depends on where the file is located:
     - From `src/Components/...` → `import { API_URL } from '../../config/api';`
     - From `src/pages/...` → `import { API_URL } from '../config/api';`
     - From `src/` → `import { API_URL } from './config/api';`
   - Make sure the path is correct, or you'll get import errors

7. **Test Locally:**
   - After updating all files, restart your dev server:
     - Stop it: `Ctrl+C` in terminal
     - Start it: `npm run dev`
   - Check if your app still works (it should use the `.env` file in development)
   - Check the browser console for any import errors

8. **Rebuild for Production:**
   - After making these changes, rebuild: `npm run build`
   - The production build will now use the hardcoded Railway URL
   - Deploy again: `npm run deploy` (or push to GitHub if using manual deployment)

---

## PART 6: Verification Checklist

### Step 18: Verify Everything Works
Go through this detailed checklist and verify each item:

1. **Supabase Database is Created and Accessible:**
   - Open browser → Go to https://app.supabase.com
   - Log in to your account
   - You should see your project listed on the dashboard
   - Click on your project to open it
   - If you can see the project dashboard, this is verified ✅

2. **Database Tables are Created:**
   - In Supabase dashboard, look at the left sidebar
   - Click on **"Table Editor"** (it has a table/grid icon)
   - You should see a list of tables like: `users`, `rooms`, `bookings`, `payments`, etc.
   - If you see multiple tables listed, this is verified ✅
   - If you see "No tables found" or an empty list, go back to Step 5 and run your migrations

3. **Backend is Deployed on Railway:**
   - Open browser → Go to https://railway.app
   - Log in to your account
   - Click on your project
   - A right-side panel will slide open from the right side of the screen
   - In the right-side panel, click on the **"Deployments"** tab (usually the first tab on the left)
   - You should see a list of recent deployments
   - Look for deployments with "Active" or "Success" status (usually shown with a green checkmark or indicator)
   - If you see an active/successful deployment, this is verified ✅

4. **Backend Health Check Works:**
   - Open a new browser tab
   - Go to: `https://your-backend-url.railway.app/health` (use your actual Railway URL)
   - You should see JSON response: `{"ok": true, "message": "Server is running"}` or similar
   - If you see a success message, this is verified ✅
   - If you see an error (404, 500, etc.), check Railway logs and verify the backend is running

5. **Environment Variables are Set in Railway:**
   - In Railway dashboard, click on your project
   - A right-side panel will slide open from the right side of the screen
   - In the right-side panel, click on the **"Variables"** tab (usually the second tab from the left)
   - You should see a list of environment variables you added in Step 10:
     - `DB_HOST`
     - `DB_USER`
     - `DB_PASS`
     - `DB_NAME`
     - `DB_PORT`
     - `PORT`
     - `JWT_SECRET`
     - `PUBLIC_BASE_URL`
   - Scroll through the list to verify all variables are present
   - If all these variables are listed with values (you can see their values or they show as "Set"), this is verified ✅
   - If any are missing, go back to Step 10 and add them

6. **Frontend .env File has Correct API URL:**
   - In your code editor, open the `.env` file in the project root
   - Check that it contains: `VITE_API_URL=https://your-backend-url.railway.app`
   - Verify the URL matches your Railway backend URL from Step 11
   - If the URL is correct, this is verified ✅

7. **Frontend Can Connect to Backend (Local Testing):**
   - Start your dev server: `npm run dev` (in terminal)
   - Open your app in browser: `http://localhost:5173` (or the URL shown in terminal)
   - Press `F12` to open Developer Tools
   - Click on **"Console"** tab
   - Look for any red error messages
   - Click on **"Network"** tab
   - Refresh the page (F5)
   - Look for API requests to your Railway backend URL
   - If requests show status 200 (success), this is verified ✅
   - If you see "Failed to fetch" or CORS errors, check your backend CORS settings

8. **Data Loads on Frontend (Local):**
   - In your browser with the app open
   - Navigate through your app (homepage, rooms page, etc.)
   - Check if data appears (rooms, deals, etc. should be visible)
   - If you see actual data/content (not just empty placeholders), this is verified ✅
   - If data doesn't load, check the Network tab for failed API requests

9. **Frontend is Deployed to GitHub Pages:**
   - Open browser → Go to: `https://Jose-IDO.github.io/Mlab_Hotel_Team_Delta`
   - The page should load (not show 404 error)
   - If the page loads, this is verified ✅
   - If you see 404, check GitHub repository Settings → Pages to verify deployment

10. **Live Site Shows Data from Hosted Database:**
    - On your GitHub Pages site (`https://Jose-IDO.github.io/Mlab_Hotel_Team_Delta`)
    - Check if the same data appears as in your local version
    - Try navigating through the site
    - If data loads and the site functions, this is verified ✅
    - If the site loads but shows no data, check:
      - Is the API URL correct in `src/config/api.ts`?
      - Is your Railway backend still running?
      - Check browser console (F12) for errors

### Step 19: Test All Features
Test these features systematically to ensure they work on your live site:

1. **User Registration:**
   - Go to your live site: `https://Jose-IDO.github.io/Mlab_Hotel_Team_Delta`
   - Look for a **"Sign Up"** or **"Register"** button/link
   - Click on it
   - Fill in the registration form (email, password, name, etc.)
   - Click **"Submit"** or **"Register"**
   - Check if you see a success message or get redirected
   - Verify in Supabase Table Editor → `users` table that a new user was created
   - If registration works, check this box ✅

2. **User Login:**
   - On your live site, look for **"Login"** or **"Sign In"** button/link
   - Click on it
   - Enter the email and password you just registered with
   - Click **"Login"** or **"Sign In"**
   - Check if you're logged in (you might see your name, a logout button, or different content)
   - If login works and you see user-specific content, check this box ✅

3. **View Rooms:**
   - Navigate to the rooms page (look for "Rooms", "Accommodations", or similar in navigation)
   - Check if a list of rooms is displayed
   - Verify room details are shown (name, price, description, images, etc.)
   - If rooms are displayed with correct information, check this box ✅

4. **View Deals:**
   - Navigate to deals/specials page (look for "Deals", "Special Offers", or similar)
   - Check if deals are displayed
   - Verify deal information is shown (discount, dates, etc.)
   - If deals are displayed, check this box ✅

5. **Search Functionality:**
   - Look for a search bar or search form on your site
   - Type in a search term (e.g., "suite", "ocean view", etc.)
   - Click **"Search"** or press Enter
   - Check if search results are displayed
   - Verify the results match your search criteria
   - If search returns relevant results, check this box ✅

6. **Booking Creation:**
   - Navigate to a room detail page
   - Select dates (if there's a date picker)
   - Click **"Book Now"** or **"Reserve"** button
   - Fill in booking details if prompted
   - Submit the booking
   - Check if you see a confirmation message or booking ID
   - Verify in Supabase Table Editor → `bookings` table that a new booking was created
   - If booking is created successfully, check this box ✅

7. **Payment Processing:**
   - If your app has payment functionality:
     - Complete a booking (see step 6)
     - Look for payment options (credit card, PayPal, etc.)
     - Enter test payment details (if using a test payment gateway)
     - Submit payment
     - Check if payment confirmation is shown
     - Verify in Supabase Table Editor → `payments` table that payment was recorded
   - If payment processing works, check this box ✅
   - If your app doesn't have payment yet, skip this

8. **Admin Dashboard (If Applicable):**
   - If your app has an admin section:
     - Log in as an admin user (or create one if needed)
     - Navigate to admin dashboard (usually `/admin` or similar URL)
     - Check if you can view:
       - All bookings
       - All users
       - Room management
       - Analytics/reports
     - Try creating/editing a room or deal
     - If admin features work, check this box ✅
   - If your app doesn't have an admin dashboard, skip this

---

## Troubleshooting

### Problem: Backend returns 500 errors
**Solution:**
- Check Railway logs:
  1. Go to Railway dashboard → Click on your project
  2. A right-side panel will open
  3. Click on the **"Deployments"** tab (first tab on the left)
  4. Click on the latest deployment in the list
  5. You'll see deployment details - look for a **"Logs"** button or section
  6. Click on **"Logs"** to view the deployment logs
  7. Scroll through the logs to find error messages
- Check if database connection is correct (verify DB_HOST, DB_USER, DB_PASS in Variables tab)
- Verify all environment variables are set (check the Variables tab in the right-side panel)

### Problem: Frontend shows "Failed to fetch"
**Solution:**
- Check if backend URL is correct in `.env`
- Check browser console for CORS errors
- Verify backend is running (test `/health` endpoint)
- Make sure Railway service is not sleeping (free tier may sleep after inactivity)

### Problem: Database connection fails
**Solution:**
- Verify Supabase database is running (check Supabase dashboard)
- Check if password is correct
- Verify host, port, and database name are correct
- Check Supabase connection pooling settings

### Problem: Tables not found
**Solution:**
- Re-run SQL migrations in Supabase SQL Editor
- Check if migrations ran successfully (no errors)
- Verify table names match what your code expects

### Problem: CORS errors
**Solution:**
- Backend should have CORS enabled (check `server/src/app.ts`)
- Add your frontend URL to CORS allowed origins in backend
- For Railway, you may need to configure CORS for your domain

---

## Quick Reference: Important URLs

- **Supabase Dashboard**: https://app.supabase.com
- **Railway Dashboard**: https://railway.app
- **Your Backend API**: `https://your-app.railway.app`
- **Your Frontend**: `https://Jose-IDO.github.io/Mlab_Hotel_Team_Delta`

---

## Environment Variables Summary

### Supabase Database:
```
Host: db.xxxxx.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [Your Supabase password]
```

### Railway Backend:
```
DB_HOST=db.xxxxx.supabase.co
DB_USER=postgres
DB_PASS=[Your Supabase password]
DB_NAME=postgres
DB_PORT=5432
PORT=4000
JWT_SECRET=[Random secure string]
PUBLIC_BASE_URL=https://Jose-IDO.github.io/Mlab_Hotel_Team_Delta
```

### Frontend (.env):
```
VITE_API_URL=https://your-backend-url.railway.app
```

---

## Next Steps After Setup

1. **Seed initial data** (if needed):
   - Add some test rooms, deals, etc. through Supabase Table Editor
   - Or create a seed script in your backend

2. **Set up monitoring**:
   - Railway provides basic logs
   - Supabase has built-in monitoring

3. **Backup strategy**:
   - Supabase free tier includes daily backups
   - Consider exporting database periodically

4. **Scale when needed**:
   - Upgrade Supabase plan if database grows
   - Upgrade Railway plan if traffic increases

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Railway Docs**: https://docs.railway.app
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## Notes

- Supabase free tier is generous but has limits (500MB database, 2GB bandwidth)
- Railway free tier gives $5 credit/month
- Both services may sleep after inactivity (free tier limitation)
- Always keep your database password and JWT secret secure
- Never commit `.env` files to Git

---

**Last Updated**: January 2025
**Method**: Supabase (Database) + Railway (Backend API)

