import pool from '../lib/db'

async function checkRelationships() {
  try {
    console.log('Checking coach-program-milestone relationships...')
    
    // Check all coaches
    const coachesResult = await pool.query(`
      SELECT DISTINCT coach_id 
      FROM coaching_programs 
      WHERE coach_id IS NOT NULL
    `)
    
    console.log('Coaches with programs:')
    coachesResult.rows.forEach(row => {
      console.log(`  Coach ID: ${row.coach_id}`)
    })
    
    // Check programs for each coach
    for (const coachRow of coachesResult.rows) {
      const coachId = coachRow.coach_id
      console.log(`\nChecking programs for coach ${coachId}:`)
      
      const programsResult = await pool.query(`
        SELECT id, name, coach_id 
        FROM coaching_programs 
        WHERE coach_id = $1
      `, [coachId])
      
      programsResult.rows.forEach(program => {
        console.log(`  Program ID: ${program.id}, Name: ${program.name}`)
      })
      
      // Check milestones for each program
      for (const programRow of programsResult.rows) {
        const programId = programRow.id
        console.log(`  Checking milestones for program ${programId}:`)
        
        const milestonesResult = await pool.query(`
          SELECT id, title, program_id 
          FROM milestones 
          WHERE program_id = $1
        `, [programId])
        
        milestonesResult.rows.forEach(milestone => {
          console.log(`    Milestone ID: ${milestone.id}, Title: ${milestone.title}`)
        })
      }
    }
    
    // Check the verification query for a specific case
    console.log('\nTesting verification query...')
    const testVerificationResult = await pool.query(`
      SELECT m.id, m.title, cp.id as program_id, cp.name as program_name, cp.coach_id
      FROM milestones m
      JOIN coaching_programs cp ON m.program_id = cp.id
      LIMIT 5
    `)
    
    console.log('Sample milestone-program-coach relationships:')
    testVerificationResult.rows.forEach(row => {
      console.log(`  Milestone ${row.id} (${row.title}) -> Program ${row.program_id} (${row.program_name}) -> Coach ${row.coach_id}`)
    })
    
  } catch (error) {
    console.error('Error checking relationships:', error)
  } finally {
    await pool.end()
  }
}

checkRelationships() 