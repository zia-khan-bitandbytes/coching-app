const pool = require('./../lib/db');

async function fixTaskFileUrls() {
  console.log('Fixing task file URLs...\n');
  
  try {
    // Get all tasks that have files in their description
    const result = await pool.query(`
      SELECT id, description, milestone_id
      FROM tasks 
      WHERE description LIKE '%[FILES:%'
    `);
    
    console.log(`Found ${result.rows.length} tasks with files to fix`);
    
    for (const task of result.rows) {
      console.log(`\nProcessing task ${task.id}...`);
      
      try {
        // Parse files from description
        const filesMatch = task.description.match(/\[FILES:(.*?)\]$/)
        if (filesMatch) {
          const files = JSON.parse(filesMatch[1])
          console.log(`Found ${files.length} files in task ${task.id}`)
          
          // Update each file with the correct URL
          const updatedFiles = files.map(file => {
            // For existing files, we need to find the actual file in the filesystem
            // and construct the correct URL based on the file's actual location
            
            // First, let's try to find the file in the uploads directory
            const fs = require('fs');
            const path = require('path');
            
            // Search for the file in the uploads directory
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
            let foundFile = null;
            
            // Walk through the uploads directory to find the file
            function findFile(dir, targetName) {
              if (fs.existsSync(dir)) {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                  const fullPath = path.join(dir, item);
                  const stat = fs.statSync(fullPath);
                  if (stat.isDirectory()) {
                    const result = findFile(fullPath, targetName);
                    if (result) return result;
                  } else if (item.includes(targetName.replace(/[^a-zA-Z0-9.-]/g, '_'))) {
                    return fullPath;
                  }
                }
              }
              return null;
            }
            
            const foundPath = findFile(uploadsDir, file.name);
            
            if (foundPath) {
              // Extract the path components from the found file
              const relativePath = path.relative(path.join(process.cwd(), 'public', 'uploads'), foundPath);
              const url = `/api/files/${relativePath.replace(/\\/g, '/')}`;
              
              console.log(`Found file: ${foundPath} -> URL: ${url}`);
              
              return {
                ...file,
                url: url
              };
            } else {
              console.log(`Could not find file: ${file.name}`);
              return file; // Keep the original file object without URL
            }
          })
          
          // Update the description with the new file data
          const filesInfo = JSON.stringify(updatedFiles)
          const newDescription = task.description.replace(/\n\n\[FILES:.*?\]$/, `\n\n[FILES:${filesInfo}]`)
          
          // Update the task in the database
          await pool.query(`
            UPDATE tasks 
            SET description = $1
            WHERE id = $2
          `, [newDescription, task.id])
          
          console.log(`✅ Updated task ${task.id} with ${updatedFiles.length} files`)
          console.log(`Files:`, updatedFiles.map(f => ({ name: f.name, url: f.url })))
        }
      } catch (error) {
        console.error(`❌ Error processing task ${task.id}:`, error.message)
      }
    }
    
    console.log('\n✅ Task file URL fix completed!')
    
  } catch (error) {
    console.error('❌ Error fixing task file URLs:', error)
  } finally {
    await pool.end()
  }
}

// Run the fix
fixTaskFileUrls().catch(console.error); 