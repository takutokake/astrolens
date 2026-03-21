#!/bin/bash
# Quick script to populate 500+ articles by calling the cron endpoint multiple times

CRON_URL="http://localhost:3000/api/cron/fetch-news?secret=astrolens_cron_secret_2024"

echo "🚀 Starting article seeding..."
echo "This will call the cron endpoint 5 times to accumulate ~100 articles"
echo ""

for i in {1..5}
do
  echo "📡 Run $i/5..."
  curl -s "$CRON_URL" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"  ✅ Stored: {data.get('articles_stored', 0)}, Total: {data.get('total_articles', 0)}\")"
  
  if [ $i -lt 5 ]; then
    echo "  ⏳ Waiting 2 seconds..."
    sleep 2
  fi
done

echo ""
echo "✨ Seeding complete! Check your database."
