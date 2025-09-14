// Quick test of API response
fetch('http://localhost:3004/api/dashboard')
  .then(res => res.json())
  .then(data => {
    console.log('📊 Dashboard API Response:');
    console.log('LastUpdate:', data.lastUpdateDate);
    console.log('Summary:', data.summary);
    console.log('TodayUsage Length:', data.todayUsage.length);
    console.log('Categories Length:', data.categories.length);

    if (data.todayUsage.length > 0) {
      console.log('\n🎯 Top Usage Items:');
      data.todayUsage.slice(0, 5).forEach((item, i) => {
        console.log(`${i + 1}. ${item.name} (${item.category}): ${item.used} ${item.unit}`);
      });
    } else {
      console.log('\n⚠️ No usage data found');
    }

    if (data.categories.length > 0) {
      console.log('\n🏷️ Categories:');
      console.log(data.categories);
    } else {
      console.log('\n⚠️ No categories found');
    }
  })
  .catch(err => console.error('❌ Error:', err));