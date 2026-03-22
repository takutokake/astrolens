# Cron Job Setup Guide

Your "Your Sky" feed needs fresh articles to be fetched hourly. Here's how to set it up:

## The Problem

The cron endpoint exists at `/api/cron/fetch-news` but it needs to be triggered every hour. This doesn't happen automatically - you need to set up an external service to call it.

## Solution Options

### Option 1: Vercel Cron Jobs (Recommended for Production)

1. **Create `vercel.json` in your project root:**

```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-news?secret=astrolens_cron_secret_2024",
      "schedule": "0 * * * *"
    }
  ]
}
```

2. **Deploy to Vercel:**
```bash
vercel --prod
```

3. **Verify in Vercel Dashboard:**
   - Go to your project settings
   - Click "Cron Jobs"
   - You should see the job scheduled

**Schedule:** `0 * * * *` = Every hour at minute 0

---

### Option 2: External Cron Service (For Development/Testing)

Use a free service like **cron-job.org** or **EasyCron**:

1. Sign up at https://cron-job.org
2. Create a new cron job:
   - **URL:** `https://your-domain.vercel.app/api/cron/fetch-news?secret=astrolens_cron_secret_2024`
   - **Schedule:** Every 1 hour
   - **Method:** GET

---

### Option 3: Manual Trigger (For Testing)

Run this command to manually fetch articles:

```bash
curl "http://localhost:3000/api/cron/fetch-news?secret=astrolens_cron_secret_2024"
```

Or use the test script:
```bash
# Start dev server first
npm run dev

# In another terminal
node test-cron.js
```

---

## How to Verify It's Working

### Check Database Articles:

1. Go to Supabase Dashboard
2. Navigate to Table Editor → `articles`
3. Check `published_at` column - should have recent timestamps
4. Check `created_at` column - should update every hour

### Check Cron Logs (Vercel):

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" → Latest deployment
3. Click "Functions" → Find `/api/cron/fetch-news`
4. Check logs for execution

### Test Manually:

```bash
# Replace with your actual domain
curl "https://your-app.vercel.app/api/cron/fetch-news?secret=astrolens_cron_secret_2024"
```

Expected response:
```json
{
  "success": true,
  "articles_stored": 15,
  "articles_deleted": 0,
  "total_articles": 487,
  "timestamp": "2026-03-21T..."
}
```

---

## Current Status

❌ **Cron job is NOT automatically running**

You need to:
1. Create `vercel.json` (see Option 1)
2. Deploy to Vercel
3. Or set up external cron service

---

## What the Cron Does

Every hour, it:
1. ✅ Fetches ~20 articles from NewsData.io (2 batches of categories)
2. ✅ Stores them in Supabase `articles` table
3. ✅ Removes articles older than 7 days
4. ✅ Maintains ~500-1000 fresh articles
5. ✅ Updates cache metadata

---

## Troubleshooting

### "No articles showing in FYP"

1. Check if articles exist in database:
   ```sql
   SELECT COUNT(*) FROM articles;
   ```

2. Manually trigger cron:
   ```bash
   curl "http://localhost:3000/api/cron/fetch-news?secret=astrolens_cron_secret_2024"
   ```

3. Check user categories are set:
   ```sql
   SELECT categories FROM users WHERE id = 'your-user-id';
   ```

### "Cron returns 401 Unauthorized"

- Check `CRON_SECRET` in `.env.local` matches the URL parameter

### "Cron returns 500 Error"

- Check `NEWSDATA_API_KEY` is set in `.env.local`
- Verify API key is valid at https://newsdata.io

---

## Next Steps

1. **Create `vercel.json`** (I can do this for you)
2. **Deploy to Vercel**
3. **Verify cron is running** in Vercel dashboard
4. **Test FYP** - should show fresh articles

Would you like me to create the `vercel.json` file for you?
