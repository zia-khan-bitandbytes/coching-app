import { DashboardLayout } from "@/components/dashboard-layout"
import { RoadmapEditor } from "@/components/roadmap-editor"

export default function RoadmapEditorPage() {
  return (
    <DashboardLayout isAdmin={true}>
      <RoadmapEditor />
    </DashboardLayout>
  )
}
