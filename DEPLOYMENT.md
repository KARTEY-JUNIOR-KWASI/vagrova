# Vagrova Staging & Production Deployment Guide

## 1. Deploy Backend API + PostgreSQL + Redis (Railway)

1. Push this repository to GitHub (make sure `.env` is NOT committed).
2. Create a new project on **Railway** (`https://railway.app`) → **Deploy from GitHub repo**.
3. Railway will auto-detect `railway.json` and `apps/api/Dockerfile`.
4. Add **PostgreSQL** and **Redis** plugins in the same Railway project.
5. Set the following Environment Variables on the API service:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `REDIS_URL` = `${{Redis.REDIS_URL}}`
   - `JWT_SECRET` = *(strong random 32+ char secret)*
   - `NODE_ENV` = `production`
   - `STORAGE_DRIVER` = `local`
   - `SMS_PROVIDER` = `smsonline`
   - `SMS_API_KEY` = *(your SMSOnlineGH API key)*
   - `SMS_SENDER_ID` = `VAGROVA`
   - `ADMIN_ALERT_PHONE` = `+233XXXXXXXXX` *(your Admin phone for instant order alerts)*
6. Once deployed, copy your Railway API URL (e.g. `https://vagrova-api-production.up.railway.app`).
7. Seed initial equipment categories & Super Admin once via Railway Shell:
   ```bash
   npx tsx prisma/seed.ts
   ```

---

## 2. Deploy Mobile Web App (`apps/web`) on Vercel

1. In **Vercel** (`https://vercel.com`), import the GitHub repo and set **Root Directory** to `apps/web`.
2. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL` = `https://<your-railway-api-domain>/api/v1`
   - `NEXT_PUBLIC_WS_URL` = `https://<your-railway-api-domain>`
3. Deploy and open the generated `https://*.vercel.app` link directly on your mobile phone to test responsiveness, OTP login, booking requests, and driver mode.

---

## 3. Deploy Laptop-Only Admin Console (`apps/admin`) on Vercel

1. Create a **second** Vercel project from the same GitHub repo with **Root Directory** set to `apps/admin`.
2. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://<your-railway-api-domain>/api/v1`
3. Deploy. Access this private URL only from your laptop/desktop (`>= 1024px` enforced by `AdminShell`).
