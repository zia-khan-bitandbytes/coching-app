const fs = require('fs');

async function testUploadSimple() {
  console.log('Testing upload API response structure...\n');
  
  try {
    // Create a test file
    const testFilePath = '/tmp/test-file.txt';
    fs.writeFileSync(testFilePath, 'This is a test file for upload testing.');
    
    // Read the file
    const fileBuffer = fs.readFileSync(testFilePath);
    
    // Create FormData manually
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    const formData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="test-file.txt"',
      'Content-Type: text/plain',
      '',
      fileBuffer.toString(),
      `--${boundary}`,
      'Content-Disposition: form-data; name="milestoneId"',
      '',
      '33',
      `--${boundary}`,
      'Content-Disposition: form-data; name="coachId"',
      '',
      '1',
      `--${boundary}`,
      'Content-Disposition: form-data; name="programId"',
      '',
      '7',
      `--${boundary}--`
    ].join('\r\n');
    
    console.log('Uploading test file...');
    
    // Make the upload request
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: formData
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Upload successful!');
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (data.file) {
        console.log('✅ File object present');
        console.log('File URL:', data.file.url);
        console.log('File name:', data.file.name);
        console.log('File size:', data.file.size);
      } else {
        console.log('❌ File object missing from response');
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
testUploadSimple().catch(console.error); 