import { DebugMilestones } from "@/components/debug-milestones"

export default function DebugMilestonesPage() {
  // For testing, we'll use a sample customer ID
  // In a real app, this would come from authentication
  const sampleCustomerId = "1" // Adjust this based on your test data
  
  return <DebugMilestones customerId={sampleCustomerId} />
}
