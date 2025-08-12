import pool from '../lib/db';
import bcrypt from 'bcryptjs';

async function populateTestData() {
  const client = await pool.connect();
  try {
    console.log('Populating database with comprehensive test data...');

    // Insert tasks for existing milestones
    console.log('Adding tasks to milestones...');
    
    // Tasks for "Market Validation" milestone (Startup to Scale program)
    await client.query(`
      INSERT INTO tasks (milestone_id, title, description, order_index, completed, completed_at) VALUES
      (
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Startup to Scale' AND m.title = 'Market Validation'),
        'Conduct Customer Interviews',
        'Interview 10-15 potential customers to understand their pain points and validate your solution',
        1, TRUE, NOW() - INTERVAL '5 days'
      ),
      (
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Startup to Scale' AND m.title = 'Market Validation'),
        'Create Customer Personas',
        'Develop detailed customer personas based on research findings',
        2, TRUE, NOW() - INTERVAL '3 days'
      ),
      (
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Startup to Scale' AND m.title = 'Market Validation'),
        'Analyze Competitor Landscape',
        'Research and analyze direct and indirect competitors',
        3, TRUE, NOW() - INTERVAL '1 day'
      ),
      (
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Startup to Scale' AND m.title = 'Market Validation'),
        'Define Value Proposition',
        'Create a clear and compelling value proposition statement',
        4, FALSE, NULL
      )
      ON CONFLICT DO NOTHING;
    `);

    // Tasks for "MVP Development" milestone
    await client.query(`
      INSERT INTO tasks (milestone_id, title, description, order_index, completed, completed_at) VALUES
      (
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Startup to Scale' AND m.title = 'MVP Development'),
        'Define MVP Features',
        'List core features needed for the minimum viable product',
        1, TRUE, NOW() - INTERVAL '2 days'
      ),
      (
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Startup to Scale' AND m.title = 'MVP Development'),
        'Create Wireframes',
        'Design wireframes for key user flows and interfaces',
        2, TRUE, NOW() - INTERVAL '1 day'
      ),
      (
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Startup to Scale' AND m.title = 'MVP Development'),
        'Build Core Features',
        'Develop the essential features identified for the MVP',
        3, FALSE, NULL
      ),
      (
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Startup to Scale' AND m.title = 'MVP Development'),
        'Test MVP with Beta Users',
        'Get 5-10 beta users to test the MVP and provide feedback',
        4, FALSE, NULL
      )
      ON CONFLICT DO NOTHING;
    `);

    // Tasks for "Strategic Thinking" milestone (Executive Leadership program)
    await client.query(`
      INSERT INTO tasks (milestone_id, title, description, order_index, completed, completed_at) VALUES
      (
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Leadership Excellence' AND cp.name = 'Executive Leadership' AND m.title = 'Strategic Thinking'),
        'Complete Strategic Assessment',
        'Analyze your organization''s current strategic position',
        1, TRUE, NOW() - INTERVAL '4 days'
      ),
      (
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Leadership Excellence' AND cp.name = 'Executive Leadership' AND m.title = 'Strategic Thinking'),
        'Develop 3-Year Vision',
        'Create a comprehensive 3-year strategic vision for your organization',
        2, TRUE, NOW() - INTERVAL '2 days'
      ),
      (
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Leadership Excellence' AND cp.name = 'Executive Leadership' AND m.title = 'Strategic Thinking'),
        'Create Strategic Framework',
        'Design a strategic planning framework for ongoing use',
        3, FALSE, NULL
      )
      ON CONFLICT DO NOTHING;
    `);

    // Tasks for "Prospecting Mastery" milestone (B2B Sales program)
    await client.query(`
      INSERT INTO tasks (milestone_id, title, description, order_index, completed, completed_at) VALUES
      (
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Sales Mastery Institute' AND cp.name = 'B2B Sales Mastery' AND m.title = 'Prospecting Mastery'),
        'Build Ideal Customer Profile',
        'Define your ideal customer profile and target criteria',
        1, FALSE, NULL
      ),
      (
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Sales Mastery Institute' AND cp.name = 'B2B Sales Mastery' AND m.title = 'Prospecting Mastery'),
        'Create Prospecting Sequence',
        'Develop a multi-touch prospecting sequence for outreach',
        2, FALSE, NULL
      ),
      (
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Sales Mastery Institute' AND cp.name = 'B2B Sales Mastery' AND m.title = 'Prospecting Mastery'),
        'Practice Cold Calling',
        'Complete 50 cold calls using the taught techniques',
        3, FALSE, NULL
      )
      ON CONFLICT DO NOTHING;
    `);

    console.log('Tasks added successfully!');

    // Add community messages for each coach
    console.log('Adding community messages...');
    
    await client.query(`
      INSERT INTO messages (coach_id, user_id, text, created_at) VALUES
      -- Messages for Business Growth Academy community
      (
        (SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'),
        (SELECT id FROM users WHERE email = 'coach1@example.com'),
        'Welcome to our Business Growth Academy community! I am excited to work with all of you on your entrepreneurial journey. Feel free to share your wins, challenges, and questions here.',
        NOW() - INTERVAL '7 days'
      ),
      (
        (SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'),
        (SELECT id FROM users WHERE email = 'customer1@example.com'),
        'Thanks John! Really excited to be here. Just finished my customer interviews and the feedback has been incredibly valuable.',
        NOW() - INTERVAL '6 days'
      ),
      (
        (SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'),
        (SELECT id FROM users WHERE email = 'customer2@example.com'),
        'That is awesome Emma! I am still working on getting my interview schedule set up. Any tips on how you approached potential interviewees?',
        NOW() - INTERVAL '6 days'
      ),
      (
        (SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'),
        (SELECT id FROM users WHERE email = 'customer1@example.com'),
        '@Alex I found that offering a small incentive (like a $10 gift card) really helped with response rates. Also, keeping it short - 15 minutes max - made people more willing to participate.',
        NOW() - INTERVAL '5 days'
      ),
      (
        (SELECT id FROM coaches WHERE business_name = 'Business Growth Academy'),
        (SELECT id FROM users WHERE email = 'coach1@example.com'),
        'Great insights Emma! That is exactly the kind of practical approach that leads to success. Alex, also consider reaching out to your existing network first - they are usually more willing to help.',
        NOW() - INTERVAL '5 days'
      ),
      
      -- Messages for Leadership Excellence community
      (
        (SELECT id FROM coaches WHERE business_name = 'Leadership Excellence'),
        (SELECT id FROM users WHERE email = 'coach2@example.com'),
        'Welcome to the Leadership Excellence community! This is your space to discuss leadership challenges, share insights, and support each others growth.',
        NOW() - INTERVAL '5 days'
      ),
      (
        (SELECT id FROM coaches WHERE business_name = 'Leadership Excellence'),
        (SELECT id FROM users WHERE email = 'customer3@example.com'),
        'Hi everyone! Just completed the strategic assessment exercise. It was eye-opening to see how much our department has been operating in reactive mode.',
        NOW() - INTERVAL '4 days'
      ),
      (
        (SELECT id FROM coaches WHERE business_name = 'Leadership Excellence'),
        (SELECT id FROM users WHERE email = 'customer4@example.com'),
        'That is a common realization Lisa! I went through the same thing. The strategic thinking framework really helps you step back and see the bigger picture.',
        NOW() - INTERVAL '3 days'
      ),
      
      -- Messages for Sales Mastery Institute community
      (
        (SELECT id FROM coaches WHERE business_name = 'Sales Mastery Institute'),
        (SELECT id FROM users WHERE email = 'coach3@example.com'),
        'Welcome to Sales Mastery Institute! This community is all about driving results and supporting each other in achieving sales excellence.',
        NOW() - INTERVAL '3 days'
      ),
      (
        (SELECT id FROM coaches WHERE business_name = 'Sales Mastery Institute'),
        (SELECT id FROM users WHERE email = 'customer5@example.com'),
        'Excited to be here! Looking forward to improving my prospecting skills. The cold calling aspect makes me a bit nervous though.',
        NOW() - INTERVAL '2 days'
      ),
      (
        (SELECT id FROM coaches WHERE business_name = 'Sales Mastery Institute'),
        (SELECT id FROM users WHERE email = 'coach3@example.com'),
        'That is totally normal Maria! Cold calling can be intimidating at first, but with the right approach and practice, it becomes much more natural. We will work on building your confidence step by step.',
        NOW() - INTERVAL '1 day'
      )
      ON CONFLICT DO NOTHING;
    `);

    console.log('Community messages added successfully!');

    // Add message reactions
    console.log('Adding message reactions...');
    
    await client.query(`
      INSERT INTO message_reactions (message_id, user_id, emoji) VALUES
      -- Reactions to welcome messages
      (1, (SELECT id FROM users WHERE email = 'customer1@example.com'), '👍'),
      (1, (SELECT id FROM users WHERE email = 'customer2@example.com'), '🙌'),
      (2, (SELECT id FROM users WHERE email = 'coach1@example.com'), '💪'),
      (2, (SELECT id FROM users WHERE email = 'customer2@example.com'), '👏'),
      (4, (SELECT id FROM users WHERE email = 'coach1@example.com'), '💡'),
      (4, (SELECT id FROM users WHERE email = 'customer2@example.com'), '🙏'),
      (6, (SELECT id FROM users WHERE email = 'customer3@example.com'), '👍'),
      (6, (SELECT id FROM users WHERE email = 'customer4@example.com'), '💯'),
      (7, (SELECT id FROM users WHERE email = 'coach2@example.com'), '🎯'),
      (9, (SELECT id FROM users WHERE email = 'customer5@example.com'), '👍'),
      (10, (SELECT id FROM users WHERE email = 'customer5@example.com'), '❤️')
      ON CONFLICT DO NOTHING;
    `);

    console.log('Message reactions added successfully!');

    // Add more milestone progress for realistic scenarios
    console.log('Adding additional milestone progress...');
    
    await client.query(`
      INSERT INTO milestone_progress (user_id, milestone_id, completed, completed_at, notes) VALUES
      -- Customer 2 (Alex) progress in Revenue Optimization program
      (
        (SELECT id FROM users WHERE email = 'customer2@example.com'),
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Revenue Optimization' 
         LIMIT 1),
        FALSE, NULL, 'Currently working on identifying revenue optimization opportunities'
      ),
      
      -- Customer 4 (David) progress in Team Management program
      (
        (SELECT id FROM users WHERE email = 'customer4@example.com'),
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Leadership Excellence' AND cp.name = 'Team Management' 
         LIMIT 1),
        TRUE, NOW() - INTERVAL '2 days', 'Completed initial team assessment. Identified key areas for improvement in team communication and goal alignment.'
      ),
      
      -- Customer 5 (Maria) starting B2B Sales Mastery
      (
        (SELECT id FROM users WHERE email = 'customer5@example.com'),
        (SELECT m.id FROM milestones m JOIN coaching_programs cp ON m.program_id = cp.id 
         JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Sales Mastery Institute' AND cp.name = 'B2B Sales Mastery' AND m.title = 'Prospecting Mastery'),
        FALSE, NULL, 'Just started the program. Working on understanding the fundamentals of B2B prospecting.'
      )
      ON CONFLICT DO NOTHING;
    `);

    console.log('Additional milestone progress added successfully!');

    // Add more payments with different statuses
    console.log('Adding additional payment records...');
    
    await client.query(`
      INSERT INTO payments (user_id, program_id, amount, status, payment_date) VALUES
      -- Additional payments for existing enrollments
      (
        (SELECT id FROM users WHERE email = 'customer4@example.com'),
        (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Leadership Excellence' AND cp.name = 'Team Management'),
        1499.00, 'completed', NOW() - INTERVAL '10 days'
      ),
      (
        (SELECT id FROM users WHERE email = 'customer5@example.com'),
        (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Sales Mastery Institute' AND cp.name = 'B2B Sales Mastery'),
        3999.00, 'completed', NOW() - INTERVAL '5 days'
      ),
      
      -- Some pending/failed payments for realistic scenarios
      (
        (SELECT id FROM users WHERE email = 'customer2@example.com'),
        (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Startup to Scale'),
        2999.00, 'pending', NOW() - INTERVAL '1 day'
      ),
      (
        (SELECT id FROM users WHERE email = 'customer1@example.com'),
        (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Revenue Optimization'),
        1999.00, 'failed', NOW() - INTERVAL '3 days'
      )
      ON CONFLICT DO NOTHING;
    `);

    console.log('Additional payment records added successfully!');

    // Add more program enrollments
    console.log('Adding additional program enrollments...');
    
    await client.query(`
      INSERT INTO user_programs (user_id, program_id, status) VALUES
      -- Customer 1 trying another program
      (
        (SELECT id FROM users WHERE email = 'customer1@example.com'),
        (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Revenue Optimization'),
        'active'
      ),
      -- Customer 2 considering additional program
      (
        (SELECT id FROM users WHERE email = 'customer2@example.com'),
        (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Startup to Scale'),
        'paused'
      )
      ON CONFLICT DO NOTHING;
    `);

    console.log('Additional program enrollments added successfully!');

    // Add more milestones for existing programs
    console.log('Adding additional milestones...');
    
    await client.query(`
      INSERT INTO milestones (program_id, title, description, order_index) VALUES
      -- Additional milestones for Revenue Optimization program
      (
        (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Revenue Optimization'),
        'Revenue Analysis', 'Conduct comprehensive analysis of current revenue streams', 1
      ),
      (
        (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Revenue Optimization'),
        'Pricing Strategy', 'Develop and implement optimized pricing strategies', 2
      ),
      (
        (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Business Growth Academy' AND cp.name = 'Revenue Optimization'),
        'Upselling Systems', 'Create systematic upselling and cross-selling processes', 3
      ),
      
      -- Additional milestones for Team Management program
      (
        (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Leadership Excellence' AND cp.name = 'Team Management'),
        'Team Assessment', 'Evaluate current team dynamics and performance levels', 1
      ),
      (
        (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Leadership Excellence' AND cp.name = 'Team Management'),
        'Communication Framework', 'Establish clear communication protocols and feedback systems', 2
      ),
      (
        (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Leadership Excellence' AND cp.name = 'Team Management'),
        'Performance Management', 'Implement performance management and development processes', 3
      ),
      
      -- Additional milestones for Sales Team Training program
      (
        (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Sales Mastery Institute' AND cp.name = 'Sales Team Training'),
        'Team Skills Assessment', 'Evaluate individual and team sales capabilities', 1
      ),
      (
        (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Sales Mastery Institute' AND cp.name = 'Sales Team Training'),
        'Training Implementation', 'Execute customized training programs for team members', 2
      ),
      (
        (SELECT cp.id FROM coaching_programs cp JOIN coaches c ON cp.coach_id = c.id 
         WHERE c.business_name = 'Sales Mastery Institute' AND cp.name = 'Sales Team Training'),
        'Performance Tracking', 'Establish metrics and tracking systems for ongoing improvement', 3
      )
      ON CONFLICT DO NOTHING;
    `);

    console.log('Additional milestones added successfully!');

    console.log('\n🎉 Test data population completed successfully!');
    console.log('\nSummary of added test data:');
    console.log('✅ Tasks for milestones with realistic completion status');
    console.log('✅ Community messages and conversations between coaches and customers');
    console.log('✅ Message reactions for engagement');
    console.log('✅ Additional milestone progress with notes');
    console.log('✅ Payment records with various statuses (completed, pending, failed)');
    console.log('✅ Additional program enrollments with different statuses');
    console.log('✅ More milestones for all coaching programs');
    console.log('\nThe database now contains realistic test data for:');
    console.log('- 3 coaches with different specializations');
    console.log('- 5 customers enrolled in various programs');
    console.log('- 6 coaching programs with comprehensive milestones');
    console.log('- Task assignments with completion tracking');
    console.log('- Active community discussions');
    console.log('- Payment history and enrollment tracking');
    console.log('- Progress tracking across multiple programs');

  } catch (error) {
    console.error('Error populating test data:', error);
    throw error;
  } finally {
    client.release();
  }
}

populateTestData();