const fs = require('fs');

async function testCustomerUploadEndToEnd() {
  console.log('🧪 Testing Customer Upload End-to-End...\n');
  
  try {
    // Step 1: Create a test file
    const testFilePath = '/tmp/customer-e2e-test.txt';
    const testContent = 'This is a customer upload end-to-end test file.';
    fs.writeFileSync(testFilePath, testContent);
    console.log('✅ Test file created');
    
    // Step 2: Upload file as customer
    console.log('\n📤 Uploading file as customer...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('milestoneId', '33');
    formData.append('taskId', '80');
    formData.append('programId', '7');
    
    const uploadResponse = await fetch('http://localhost:3000/api/customer/2/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }
    
    const uploadData = await uploadResponse.json();
    console.log('✅ File uploaded successfully');
    console.log('Upload response:', JSON.stringify(uploadData, null, 2));
    
    // Step 3: Verify file is accessible via download
    console.log('\n📥 Testing file download...');
    const downloadResponse = await fetch(`http://localhost:3000${uploadData.file.url}`);
    
    if (!downloadResponse.ok) {
      throw new Error(`Download failed: ${downloadResponse.status} ${downloadResponse.statusText}`);
    }
    
    const downloadedContent = await downloadResponse.text();
    console.log('✅ File download successful');
    console.log('Downloaded content:', downloadedContent);
    
    // Step 4: Verify file appears in customer tasks
    console.log('\n📋 Checking if file appears in customer tasks...');
    const tasksResponse = await fetch('http://localhost:3000/api/customer/2/milestones/33/tasks');
    
    if (!tasksResponse.ok) {
      throw new Error(`Tasks fetch failed: ${tasksResponse.status} ${tasksResponse.statusText}`);
    }
    
    const tasksData = await tasksResponse.json();
    const task80 = tasksData.tasks.find(task => task.id === 80);
    
    if (!task80) {
      throw new Error('Task 80 not found in customer tasks');
    }
    
    console.log('✅ Task 80 found in customer tasks');
    
    if (!task80.files || !Array.isArray(task80.files)) {
      throw new Error('Task 80 does not have files array');
    }
    
    const uploadedFile = task80.files.find(file => file.name === 'customer-e2e-test.txt');
    
    if (!uploadedFile) {
      throw new Error('Uploaded file not found in task files');
    }
    
    console.log('✅ Uploaded file found in task files');
    console.log('File in task:', JSON.stringify(uploadedFile, null, 2));
    
    // Step 5: Verify file URL matches
    if (uploadedFile.url !== uploadData.file.url) {
      throw new Error('File URL mismatch between upload response and task files');
    }
    
    console.log('✅ File URL matches between upload and task');
    
    console.log('\n🎉 All tests passed! Customer upload functionality is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    // Clean up test file
    try {
      fs.unlinkSync('/tmp/customer-e2e-test.txt');
      console.log('\n🧹 Test file cleaned up');
    } catch (error) {
      console.log('\n⚠️ Could not clean up test file:', error.message);
    }
  }
}

// Check if we're in a Node.js environment that supports fetch
if (typeof fetch === 'undefined') {
  console.log('⚠️ Fetch not available, using node-fetch...');
  const fetch = require('node-fetch');
}

testCustomerUploadEndToEnd().catch(console.error); 