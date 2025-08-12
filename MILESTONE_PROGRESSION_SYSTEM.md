# Milestone Progression System

## Overview

The milestone progression system ensures that customers can only complete milestones in sequential order. This prevents them from skipping ahead and ensures proper learning progression through coaching programs.

## How It Works

### 1. Sequential Completion
- **Milestone 1**: Always unlocked (first milestone)
- **Milestone 2**: Unlocked only after Milestone 1 is completed
- **Milestone 3**: Unlocked only after Milestone 2 is completed
- **And so on...**

### 2. Example Scenario: Emma Davis
- **Completed**: Milestones 1 & 2 (Foundation Setup, Goal Setting)
- **Current**: Milestone 3 (Strategy Development) - can be completed
- **Locked**: Milestone 4 (Implementation Phase) - must wait for Milestone 3
- **Locked**: Milestone 5 (Optimization & Scaling) - must wait for Milestone 4

## Implementation Details

### Backend Validation (API)
The system validates milestone completion order at the API level:

```typescript
// Check if all previous milestones are completed
if (milestone.order_index > 1) {
  const previousMilestonesCheck = await pool.query(`
    SELECT m.id, m.order_index, mp.completed
    FROM milestones m
    LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = $1
    WHERE m.program_id = $2 
      AND m.order_index < $3
      AND (mp.completed IS NULL OR mp.completed = false)
    ORDER BY m.order_index
  `, [customerId, milestone.program_id, milestone.order_index])

  if (previousMilestonesCheck.rows.length > 0) {
    return NextResponse.json({
      success: false,
      error: `Cannot complete milestone "${milestone.title}". You must complete the previous milestone(s) first.`,
      incompleteMilestones: incompleteMilestones
    }, { status: 400 })
  }
}
```

### Frontend Status Calculation
Milestones are automatically assigned one of three statuses:

1. **"completed"** - Milestone has been finished
2. **"in-progress"** - Milestone is unlocked and can be worked on
3. **"locked"** - Milestone is locked until previous milestones are completed

### Visual Indicators
- **Locked milestones**: Gray background, lock icon, "Locked" badge
- **In-progress milestones**: Blue border, clock icon, "In Progress" badge  
- **Completed milestones**: Green checkmark, "Done" badge

## User Experience Features

### 1. Clear Locked State
- Locked milestones show a lock icon
- Visual styling (gray background, reduced opacity)
- "Locked - Complete previous milestone first" label

### 2. Helpful Guidance
- Blue info box showing which milestone needs to be completed first
- Tooltip on expand button explaining the requirement
- Clear error messages when attempting to complete locked milestones

### 3. Progressive Unlocking
- Milestones automatically unlock when previous ones are completed
- Real-time status updates
- Smooth transitions between states

## Error Handling

### Attempting to Complete Locked Milestone
When a customer tries to complete a milestone out of order:

1. **API Response**: Returns 400 status with detailed error message
2. **Frontend Display**: Shows user-friendly error toast
3. **Specific Guidance**: Lists which milestone(s) need to be completed first

Example error message:
```
"Cannot complete milestone 'Implementation Phase'. 
You must complete the previous milestone(s) first."
```

## Database Schema

The system uses these key tables:

- **milestones**: Defines milestone structure and order
- **milestone_progress**: Tracks customer completion status
- **user_programs**: Links customers to coaching programs

## Testing

A test page is available at `/test-milestone-progression` that demonstrates:

- Sample milestone data
- Interactive milestone completion
- Visual progression system
- Locked/unlocked states

## Benefits

1. **Structured Learning**: Ensures customers follow the intended program flow
2. **Prevents Confusion**: Clear visual indicators of what's available
3. **Maintains Quality**: Customers must complete foundational work before advanced topics
4. **User Guidance**: Helpful messages guide users on next steps
5. **Data Integrity**: Backend validation prevents bypassing the system

## Future Enhancements

Potential improvements could include:

- **Flexible Prerequisites**: Allow coaches to set custom milestone dependencies
- **Parallel Milestones**: Enable some milestones to be completed simultaneously
- **Milestone Skipping**: Allow coaches to unlock specific milestones for advanced users
- **Progress Analytics**: Track milestone completion patterns and bottlenecks
