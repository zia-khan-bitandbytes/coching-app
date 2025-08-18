const fs = require('fs');

async function testCustomerUpload() {
  console.log('Testing customer upload functionality...\n');
  
  try {
    // Create a test file
    const testFilePath = '/tmp/customer-test-file.txt';
    fs.writeFileSync(testFilePath, 'This is a test file uploaded by a customer.');
    
    // Create FormData manually
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    const formData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="customer-test-file.txt"',
      'Content-Type: text/plain',
      '',
      fs.readFileSync(testFilePath).toString(),
      `--${boundary}`,
      'Content-Disposition: form-data; name="milestoneId"',
      '',
      '33',
      `--${boundary}`,
      'Content-Disposition: form-data; name="taskId"',
      '',
      '79', // Use an existing task ID
      `--${boundary}`,
      'Content-Disposition: form-data; name="programId"',
      '',
      '7',
      `--${boundary}--`
    ].join('\r\n');
    
    console.log('Uploading test file as customer...');
    
    // Make the upload request to customer endpoint
    const response = await fetch('http://localhost:3000/api/customer/2/upload', {
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
      console.log('✅ Customer upload successful!');
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (data.file) {
        console.log('✅ File object present');
        console.log('File URL:', data.file.url);
        console.log('File name:', data.file.name);
        console.log('File size:', data.file.size);
        
        // Test the file download
        console.log('\nTesting file download...');
        const downloadResponse = await fetch(`http://localhost:3000${data.file.url}`);
        if (downloadResponse.ok) {
          console.log('✅ File download successful!');
          console.log('Content-Type:', downloadResponse.headers.get('content-type'));
          console.log('Content-Disposition:', downloadResponse.headers.get('content-disposition'));
        } else {
          console.log('❌ File download failed:', downloadResponse.status);
        }
      } else {
        console.log('❌ File object missing from response');
      }
    } else {
      console.log('❌ Customer upload failed:', response.status);
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
testCustomerUpload().catch(console.error); 