const fs = require('fs');
const path = require('path');

// Test file download functionality
async function testFileDownload() {
  console.log('Testing file download functionality...\n');
  
  // Check if uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.log('❌ Uploads directory does not exist');
    return;
  }
  
  console.log('✅ Uploads directory exists');
  
  // List all files in uploads directory
  function listFiles(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        console.log(`${prefix}📁 ${item}/`);
        listFiles(fullPath, prefix + '  ');
      } else {
        console.log(`${prefix}📄 ${item} (${stat.size} bytes)`);
      }
    });
  }
  
  console.log('\n📂 Files in uploads directory:');
  listFiles(uploadsDir);
  
  // Test API endpoint
  console.log('\n🔗 Testing API endpoint...');
  const testUrl = 'http://localhost:3001/api/files/1/8/34/1755525416544_04-2025-3-03579312-Fee-Voucher.pdf';
  
  try {
    const response = await fetch(testUrl);
    if (response.ok) {
      console.log('✅ File API endpoint is working');
      console.log(`📊 Response status: ${response.status}`);
      console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);
      console.log(`📊 Content-Disposition: ${response.headers.get('content-disposition')}`);
    } else {
      console.log(`❌ File API endpoint failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error testing API endpoint: ${error.message}`);
  }
}

// Run the test
testFileDownload().catch(console.error); 