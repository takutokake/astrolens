/**
 * Test script to manually trigger the cron job and verify it's fetching articles
 * Run with: node test-cron.js
 */

require('dotenv').config({ path: '.env.local' });

async function testCronJob() {
  console.log('═══════════════════════════════════════════');
  console.log('  Testing Cron Job - Fetch News');
  console.log('═══════════════════════════════════════════\n');
  
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('❌ CRON_SECRET not found in .env.local');
    return;
  }
  
  console.log('🔄 Triggering cron job...');
  console.log('   This will fetch fresh articles from NewsData.io\n');
  
  try {
    const response = await fetch(
      `http://localhost:3000/api/cron/fetch-news?secret=${cronSecret}`,
      {
        method: 'GET',
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Cron job failed (${response.status}):`, error);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ Cron job completed successfully!\n');
    console.log('═══════════════════════════════════════════');
    console.log('  Results');
    console.log('═══════════════════════════════════════════');
    console.log(`Articles stored:  ${data.articles_stored}`);
    console.log(`Articles deleted: ${data.articles_deleted}`);
    console.log(`Total articles:   ${data.total_articles}`);
    console.log(`Timestamp:        ${data.timestamp}`);
    
    if (data.errors && data.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      data.errors.forEach(err => console.log(`   - ${err}`));
    }
    
    console.log('═══════════════════════════════════════════\n');
    
    if (data.total_articles > 0) {
      console.log('🎉 Articles are being fetched and stored correctly!');
      console.log('   Your FYP should now show fresh news.\n');
    } else {
      console.log('⚠️  No articles in database. Check the errors above.\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure the dev server is running:');
    console.log('   npm run dev\n');
  }
}

testCronJob();
