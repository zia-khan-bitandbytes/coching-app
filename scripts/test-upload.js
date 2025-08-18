const fs = require('fs');
const FormData = require('form-data');

async function testUpload() {
  console.log('Testing upload API...\n');
  
  try {
    // Create a test file
    const testFilePath = '/tmp/test-file.txt';
    fs.writeFileSync(testFilePath, 'This is a test file for upload testing.');
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('milestoneId', '33');
    formData.append('coachId', '1');
    formData.append('programId', '7');
    
    console.log('Uploading test file...');
    
    // Make the upload request
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Upload successful!');
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (data.file && data.file.url) {
        console.log('✅ File URL is present:', data.file.url);
        
        // Test the file download
        console.log('\nTesting file download...');
        const downloadResponse = await fetch(data.file.url);
        if (downloadResponse.ok) {
          console.log('✅ File download successful!');
          console.log('Content-Type:', downloadResponse.headers.get('content-type'));
          console.log('Content-Disposition:', downloadResponse.headers.get('content-disposition'));
        } else {
          console.log('❌ File download failed:', downloadResponse.status);
        }
      } else {
        console.log('❌ File URL is missing from response');
      }
    } else {
      console.log('❌ Upload failed:', response.status);
      const errorData = await response.text();
      console.log('Error details:', errorData);
    }
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUpload().catch(console.error); 