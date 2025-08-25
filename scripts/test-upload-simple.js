const fs = require('fs')
const path = require('path')

// Create a simple test file
const testContent = 'This is a test file for upload testing.'
const testFilePath = path.join(__dirname, 'test-upload.txt')

// Write test file
fs.writeFileSync(testFilePath, testContent)
console.log('✅ Test file created:', testFilePath)

// Test the upload API
const testUpload = async () => {
  try {
    const FormData = require('form-data')
    const form = new FormData()
    
    // Add the test file
    form.append('file', fs.createReadStream(testFilePath))
    form.append('milestoneId', '1')
    form.append('taskId', '2') // Business Plan task
    form.append('programId', '1')
    
    console.log('📤 Testing file upload to Business Plan task...')
    
    const response = await fetch('http://localhost:3000/api/customer/3/upload', {
      method: 'POST',
      body: form
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Upload successful:', result)
      
      // Test if the task now shows the file
      console.log('\n📋 Checking if task now has files...')
      const taskResponse = await fetch('http://localhost:3000/api/customer/3/milestones/1/tasks')
      if (taskResponse.ok) {
        const taskResult = await taskResponse.json()
        const businessPlanTask = taskResult.tasks.find(t => t.id === 2)
        console.log('Business Plan task files:', businessPlanTask.files)
        console.log('Business Plan task completed:', businessPlanTask.completed)
      }
    } else {
      const error = await response.text()
      console.log('❌ Upload failed:', response.status, error)
    }
  } catch (error) {
    console.error('❌ Error testing upload:', error)
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.log('⚠️  Fetch not available, install node-fetch or use Node 18+')
  console.log('📁 Test file created at:', testFilePath)
  console.log('🔧 You can test the upload manually in the browser')
} else {
  testUpload()
} 