1. Database (Supabase)
   Go to Supabase Dashboard -> New Project.
   Go to Project Settings -> Database.
   Copy the Connection String (Transaction mode, Port 6543) as your DATABASE_URL.
2. Redis (Upstash)
   Go to Upstash Console -> Create Database.
   Copy the Endpoint (Host & Port) and Password.
   These go into REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD.
3. Backend (Render)
   Create a New Web Service and connect your GitHub repo.
   Root Directory: apps/backend
   Build Command: npm install && npm run build
   Start Command: npm run start:prod
   Env Vars: Add DATABASE_URL, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, and your JWT_SECRET.
   Note: After the first deploy, run npm run db:migrate and npm run db:seed via the Render "Shell" or a local script.
4. Frontend (Vercel)
   Create a New Project and connect your GitHub repo.
   Framework Preset: Next.js
   Root Directory: apps/frontend
   Env Vars: Add NEXT_PUBLIC_API_URL (the URL Render gives you, e.g., <https://backend.onrender.com>).
5. Final Step: Signed URLs
   Ensure your Supabase Storage Bucket (verification-documents) is set to Public if you want to avoid complex policy setup for the demo, or ensure the SUPABASE_SERVICE_ROLE_KEY is added to the Render environment variables so the backend can generate signed URLs.

That’s it! Your monorepo will be live and connected.
