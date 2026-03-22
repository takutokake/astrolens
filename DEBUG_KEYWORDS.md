# Debugging Keywords & Language Features

## Issue 1: Keywords Not Prioritizing Articles

### How to Test:

1. **Set Keywords in Settings:**
   - Go to `/app/settings`
   - Add keywords like: `AI, Bitcoin, Lakers`
   - Click "Save Preferences"

2. **Check if Keywords are Saved:**
   - Open browser DevTools → Network tab
   - Look for the PATCH request to `/api/user`
   - Verify the payload includes your keywords

3. **Check Database:**
   ```sql
   SELECT id, email, keywords FROM users WHERE id = 'your-user-id';
   ```
   - Keywords should be an array: `["AI", "Bitcoin", "Lakers"]`

4. **Check FYP Feed:**
   - Go to `/app` (Your Sky)
   - Open DevTools → Console
   - Look for log: `✨ Prioritized X keyword-matched articles`
   - If you see this, keyword matching is working

5. **Verify Articles Match:**
   - Scroll through feed
   - Articles with your keywords should appear first
   - Check article titles/descriptions for keyword matches

### Common Issues:

- **Keywords not saving:** Check `/api/user` PATCH endpoint
- **No log message:** Keywords might be empty array in database
- **No matches:** Articles in database might not contain your keywords

---

## Issue 2: Language Not Working

### Current Behavior:

The cron job fetches articles in **English only** by default. The language setting in user preferences doesn't affect which articles are fetched because:

1. Cron job runs globally (not per-user)
2. All users see the same article pool
3. Language parameter is hardcoded to "en" in cron

### Solution Options:

**Option A: Browser Translation (Recommended)**
- Use browser's built-in translation
- Right-click → Translate to [Language]
- Or use browser extensions like Google Translate

**Option B: Fetch Multi-Language Articles (Requires Changes)**
- Modify cron to fetch articles in multiple languages
- Store language metadata with each article
- Filter articles by user's language preference
- **Downside:** Uses more API credits

**Option C: AI Translation (Expensive)**
- Use OpenAI to translate articles on-demand
- Costs ~$0.001 per article
- **Downside:** Slow and expensive

### Current Implementation:

The language setting currently only affects:
- Which language articles are **requested** from NewsData.io
- But cron is hardcoded to English

To enable multi-language:
1. Update cron to fetch multiple languages
2. Add language filter to `/api/news`
3. Or recommend browser translation

---

## Quick Fix: Add Debug Logging

Add this to your browser console when viewing Your Sky:

```javascript
// Check if keywords are loaded
fetch('/api/user')
  .then(r => r.json())
  .then(d => console.log('User keywords:', d.user.keywords));

// Check articles in feed
fetch('/api/news')
  .then(r => r.json())
  .then(d => console.log('Articles:', d.articles.length, 'First 3:', d.articles.slice(0,3).map(a => a.title)));
```

This will show you:
1. What keywords are saved for your user
2. What articles are being returned
3. Whether keyword matching is happening
