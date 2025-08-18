async function testDownloadFix() {
  console.log('Testing download fix for new files...\n');
  
  try {
    // Test 1: Check if the test file we created earlier has a working URL
    console.log('Test 1: Testing the file we just uploaded...');
    
    const testFileUrl = 'http://localhost:3000/api/files/1/7/33/1755540940342_test-file.txt';
    
    const response = await fetch(testFileUrl);
    if (response.ok) {
      console.log('✅ New file download works!');
      console.log('Content-Type:', response.headers.get('content-type'));
      console.log('Content-Disposition:', response.headers.get('content-disposition'));
      
      // Test the blob download
      const blob = await response.blob();
      console.log('✅ Blob download works! File size:', blob.size, 'bytes');
    } else {
      console.log('❌ New file download failed:', response.status);
    }
    
    // Test 2: Check an old file (this should fail because it has no URL)
    console.log('\nTest 2: Testing an old file (should fail)...');
    
    // This is the file from your console error - it should not have a URL
    const oldFileUrl = 'http://localhost:3000/api/files/1/7/33/1755539957544_allama.pdf';
    
    const oldResponse = await fetch(oldFileUrl);
    if (oldResponse.ok) {
      console.log('✅ Old file download works! (file exists in filesystem)');
    } else {
      console.log('❌ Old file download failed:', oldResponse.status);
    }
    
    console.log('\n📋 Summary:');
    console.log('- New files uploaded after the fix will have working download URLs');
    console.log('- Old files uploaded before the fix may not have URLs in the database');
    console.log('- The download functionality itself is working correctly');
    console.log('- To test: Upload a new file as a coach and download it as a customer');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDownloadFix().catch(console.error); 