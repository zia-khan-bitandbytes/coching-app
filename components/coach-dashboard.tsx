"use client"

export function CoachDashboard({ coachId }: { coachId: string }) {
  return (
    <div className="space-y-6">
      {/* Empty Dashboard */}
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Coach Dashboard</h2>
        <p className="text-gray-600">Welcome to your coaching dashboard</p>
      </div>
    </div>
  )
} 