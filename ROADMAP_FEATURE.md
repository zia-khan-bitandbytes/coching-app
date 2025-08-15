# Dynamic Roadmap Feature

## Overview
The Dynamic Roadmap is a visually appealing, interactive component that displays a customer's learning journey through their coaching program. It shows real-time milestone progression, task completion, and provides an engaging user experience with animations and visual effects.

## Features

### 🎯 Visual Roadmap
- **Timeline View**: Horizontal timeline showing all milestones in order
- **Progress Indicator**: Animated progress line that fills based on completion
- **Milestone Icons**: Unique icons for each milestone type (BookOpen, Target, Zap, Play, Award, GraduationCap, Star)
- **Status Colors**: Color-coded milestones (Green: Completed, Blue: In Progress, Gray: Locked)

### 🚶‍♂️ Interactive Avatar
- **Walking Animation**: Human avatar that moves along the timeline
- **Position Tracking**: Avatar position reflects the latest completed milestone
- **"YOU" Label**: Clear identification of the user's current position
- **Walking Trail**: Animated trail effect showing movement

### ✨ Animations & Effects
- **Framer Motion**: Smooth animations for all interactions
- **Staggered Loading**: Milestones appear with sequential delays
- **Hover Effects**: Interactive hover states for milestone circles
- **Completion Sparkles**: Special effects for completed milestones
- **Progress Animations**: Smooth progress bar animations

### 📊 Real-time Data
- **Database Integration**: Fetches real milestone and task data from the database
- **Live Updates**: Real-time progress tracking and milestone completion
- **Task Management**: Shows individual tasks within each milestone
- **Progress Calculation**: Automatic calculation of completion percentages

### 🔧 Interactive Features
- **Expandable Milestones**: Click to expand and see detailed task information
- **Task Completion**: Visual indicators for completed vs. pending tasks
- **Milestone Actions**: Mark milestones as complete (with validation)
- **Locked State Handling**: Prevents completion of milestones out of order

## Technical Implementation

### Components
- **CustomerRoadmap**: Main roadmap component
- **API Integration**: Fetches data from `/api/customer/[customerId]/milestones` and `/api/customer/[customerId]/milestones/[milestoneId]/tasks`

### Data Flow
1. Component mounts and fetches customer milestones
2. For each milestone, fetches associated tasks
3. Calculates progress and status for each milestone
4. Renders interactive timeline with real data
5. Handles user interactions (expand/collapse, mark complete)

### State Management
- `milestones`: Array of milestone data with tasks
- `expandedMilestones`: Set of expanded milestone IDs
- `updatingMilestones`: Set of milestones being updated
- `loading` & `error`: UI state management

## Usage

### For Customers
1. Navigate to Dashboard → Roadmap tab
2. View your learning journey timeline
3. Click on milestone circles to expand details
4. View tasks and completion status
5. Mark milestones as complete when ready

### For Developers
```tsx
import { CustomerRoadmap } from "@/components/customer-roadmap"

// In your component
<CustomerRoadmap customerId={customerId} />
```

## API Endpoints

### GET `/api/customer/[customerId]/milestones`
Returns customer's milestones with progress status

### GET `/api/customer/[customerId]/milestones/[milestoneId]/tasks`
Returns tasks for a specific milestone

### POST `/api/customer/[customerId]/milestones/[milestoneId]/progress`
Marks a milestone as complete

## Styling & Customization

### Tailwind Classes
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Color Scheme**: Consistent with the app's design system
- **Animations**: Smooth transitions and hover effects
- **Typography**: Clear hierarchy and readability

### Animation Customization
- **Duration**: Configurable animation durations
- **Easing**: Smooth easing functions for natural movement
- **Delays**: Staggered animations for visual appeal

## Future Enhancements

### Planned Features
- **Drag & Drop**: Reorder tasks within milestones
- **Progress Sharing**: Share progress with coaches
- **Achievement Badges**: Gamification elements
- **Timeline Zoom**: Zoom in/out for detailed view
- **Export Progress**: Generate progress reports

### Technical Improvements
- **Real-time Updates**: WebSocket integration for live updates
- **Offline Support**: Cache roadmap data for offline viewing
- **Performance**: Virtual scrolling for large numbers of milestones
- **Accessibility**: Enhanced screen reader support

## Troubleshooting

### Common Issues
1. **Milestones not loading**: Check API endpoints and database connections
2. **Tasks missing**: Verify task API integration
3. **Animation glitches**: Ensure Framer Motion is properly installed
4. **Progress calculation errors**: Check milestone completion logic

### Debug Mode
Enable console logging for debugging:
```tsx
// Add to component for debugging
console.log('Milestones:', milestones)
console.log('Tasks:', tasks)
```

## Performance Considerations

### Optimization
- **Lazy Loading**: Load milestone details on demand
- **Memoization**: Cache expensive calculations
- **Debouncing**: Limit API calls during rapid interactions
- **Image Optimization**: Optimize milestone icons

### Best Practices
- **Efficient Re-renders**: Use React.memo and useMemo where appropriate
- **API Caching**: Implement proper caching strategies
- **Bundle Size**: Tree-shake unused Framer Motion features
- **Accessibility**: Ensure keyboard navigation and screen reader support
