// Simple test script to verify milestone progression logic
// This simulates the logic used in the API

function testMilestoneProgression() {
  console.log('Testing Milestone Progression Logic...\n')
  
  // Simulate milestone data from database
  const milestonesData = [
    { id: 1, order_index: 1, completed: false, title: "Foundation Setup" },
    { id: 2, order_index: 2, completed: false, title: "Goal Setting" },
    { id: 3, order_index: 3, completed: false, title: "Strategy Development" },
    { id: 4, order_index: 4, completed: false, title: "Implementation" },
    { id: 5, order_index: 5, completed: false, title: "Optimization" }
  ]
  
  console.log('Initial state:')
  milestonesData.forEach(m => {
    console.log(`  Milestone ${m.order_index}: ${m.title} - Completed: ${m.completed}`)
  })
  
  // Simulate the API logic
  function calculateMilestoneStatus(milestones) {
    return milestones.map(row => {
      let status = "in-progress"
      let isLocked = false
      
      if (row.completed) {
        status = "completed"
        isLocked = false
      } else if (row.order_index > 1) {
        // Check if previous milestone is completed
        const previousMilestone = milestones.find(m => m.order_index === row.order_index - 1)
        if (!previousMilestone || !previousMilestone.completed) {
          status = "locked"
          isLocked = true
        }
      }
      
      return {
        ...row,
        status,
        isLocked
      }
    })
  }
  
  // Test initial state
  console.log('\nInitial calculation:')
  const initialStatus = calculateMilestoneStatus(milestonesData)
  initialStatus.forEach(m => {
    console.log(`  Milestone ${m.order_index}: ${m.title} - Status: ${m.status}, Locked: ${m.isLocked}`)
  })
  
  // Test milestone 1 completion
  console.log('\n--- Completing Milestone 1 ---')
  milestonesData[0].completed = true
  const afterMilestone1 = calculateMilestoneStatus(milestonesData)
  afterMilestone1.forEach(m => {
    console.log(`  Milestone ${m.order_index}: ${m.title} - Status: ${m.status}, Locked: ${m.isLocked}`)
  })
  
  // Test milestone 2 completion
  console.log('\n--- Completing Milestone 2 ---')
  milestonesData[1].completed = true
  const afterMilestone2 = calculateMilestoneStatus(milestonesData)
  afterMilestone2.forEach(m => {
    console.log(`  Milestone ${m.order_index}: ${m.title} - Status: ${m.status}, Locked: ${m.isLocked}`)
  })
  
  // Test milestone 3 completion
  console.log('\n--- Completing Milestone 3 ---')
  milestonesData[2].completed = true
  const afterMilestone3 = calculateMilestoneStatus(milestonesData)
  afterMilestone3.forEach(m => {
    console.log(`  Milestone ${m.order_index}: ${m.title} - Status: ${m.status}, Locked: ${m.isLocked}`)
  })
  
  // Test milestone 4 completion
  console.log('\n--- Completing Milestone 4 ---')
  milestonesData[3].completed = true
  const afterMilestone4 = calculateMilestoneStatus(milestonesData)
  afterMilestone4.forEach(m => {
    console.log(`  Milestone ${m.order_index}: ${m.title} - Status: ${m.status}, Locked: ${m.isLocked}`)
  })
  
  console.log('\n✅ Test completed!')
  console.log('\nExpected behavior:')
  console.log('- Milestone 1: Always unlocked (first milestone)')
  console.log('- Milestone 2: Unlocked after Milestone 1 is completed')
  console.log('- Milestone 3: Unlocked after Milestone 2 is completed')
  console.log('- Milestone 4: Unlocked after Milestone 3 is completed')
  console.log('- Milestone 5: Unlocked after Milestone 4 is completed')
}

// Run the test
testMilestoneProgression()
