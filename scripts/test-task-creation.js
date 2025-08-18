const fs = require('fs');

async function testTaskCreation() {
  console.log('Testing task creation with files...\n');
  
  try {
    // First, upload a file
    console.log('Step 1: Uploading file...');
    
    // Create a test file
    const testFilePath = '/tmp/test-file.txt';
    fs.writeFileSync(testFilePath, 'This is a test file for task creation testing.');
    
    // Create FormData manually
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    const formData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="test-file.txt"',
      'Content-Type: text/plain',
      '',
      fs.readFileSync(testFilePath).toString(),
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
    
    const uploadResponse = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }
    
    const uploadData = await uploadResponse.json();
    console.log('✅ Upload successful!');
    console.log('Upload response:', JSON.stringify(uploadData, null, 2));
    
    // Step 2: Create a task with the uploaded file
    console.log('\nStep 2: Creating task with uploaded file...');
    
    const taskData = {
      title: 'Test Task with File',
      description: 'This is a test task with an uploaded file',
      requiresUpload: false,
      uploadedFiles: [
        {
          name: uploadData.file.name,
          size: uploadData.file.size,
          type: uploadData.file.type,
          url: uploadData.file.url
        }
      ]
    };
    
    console.log('Task data being sent:', JSON.stringify(taskData, null, 2));
    
    const taskResponse = await fetch('http://localhost:3000/api/coach/1/programs/7/milestones/33/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData)
    });
    
    if (!taskResponse.ok) {
      throw new Error(`Task creation failed: ${taskResponse.status}`);
    }
    
    const taskResult = await taskResponse.json();
    console.log('✅ Task creation successful!');
    console.log('Task response:', JSON.stringify(taskResult, null, 2));
    
    // Step 3: Fetch the task to see if files are preserved
    console.log('\nStep 3: Fetching task to verify files...');
    
    const fetchResponse = await fetch('http://localhost:3000/api/coach/1/programs/7/milestones/33/tasks');
    
    if (!fetchResponse.ok) {
      throw new Error(`Fetch failed: ${fetchResponse.status}`);
    }
    
    const fetchResult = await fetchResponse.json();
    console.log('✅ Fetch successful!');
    console.log('Fetch response:', JSON.stringify(fetchResult, null, 2));
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTaskCreation().catch(console.error); 