# Vagrova Production Deployment Guide (Render + Neon)

## 1. Backend API + Neon PostgreSQL (`vagrova`)
- **Service Type:** Render Web Service (Docker)
- **URL:** `https://vagrova.onrender.com/api/v1`
- **Database:** Neon PostgreSQL (`DATABASE_URL`)
- **Key Environment Variables:**
  - `DATABASE_URL` = *(Neon PostgreSQL connection string)*
  - `JWT_SECRET` = *(strong random 32+ char secret)*
  - `NODE_ENV` = `production`
  - `PORT` = `10000`
  - `STORAGE_DRIVER` = `local`
  - `SMS_PROVIDER` = `smsonline`
  - `SMS_API_KEY` = *(SMSOnlineGH API key)*
  - `SMS_SENDER_ID` = `VAGROVA`
  - `ADMIN_ALERT_PHONE` = *(Admin phone for instant order alerts)*

---

## 2. Customer & Driver PWA (`vagrova-app`)
- **Service Type:** Render Static Site
- **URL:** `https://vagrova-app.onrender.com`
- **Build Command:** `pnpm install && pnpm --filter @vagrova/ui build && pnpm --filter @vagrova/web build`
- **Publish Directory:** `apps/web/out`
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL` = `https://vagrova.onrender.com/api/v1`
  - `NEXT_PUBLIC_WS_URL` = `https://vagrova.onrender.com`

---

## 3. Laptop-Only Admin Console (`vagrova-admin`)
- **Service Type:** Render Static Site
- **Build Command:** `pnpm install && pnpm --filter @vagrova/ui build && pnpm --filter @vagrova/admin build`
- **Publish Directory:** `apps/admin/out`
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL` = `https://vagrova.onrender.com/api/v1`
- Access this private URL only from your laptop/desktop (`>= 1024px` enforced by `AdminShell`).
