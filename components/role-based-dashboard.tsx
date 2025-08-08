"use client"

import { useState, useEffect } from "react"
import { useRoadmap } from "@/contexts/roadmap-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRole, getRoleDisplayName } from "@/lib/auth-client"
import Link from "next/link"

interface RoleBasedDashboardProps {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
  }
}

export function RoleBasedDashboard({ user }: RoleBasedDashboardProps) {
  // Debug logging
  console.log('RoleBasedDashboard rendered with user:', user)
  console.log('User role:', user.role)
  
  const renderCustomerDashboard = () => (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">COACHING XYZ</h2>
          <nav className="space-y-2">
            <a href="#" className="flex items-center px-3 py-2 text-blue-600 bg-blue-50 rounded-lg">
              <span className="mr-3">🗺️</span>
              Roadmap
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              <span className="mr-3">📚</span>
              Resources
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              <span className="mr-3">🆘</span>
              Support
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              <span className="mr-3">👥</span>
              A Community
            </a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-medium text-gray-900">Business Growth Program</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">COACHING XYZ</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">$10k/month</div>
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </header>

        {/* Roadmap Section */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">ROADMAP</h2>
              <div className="text-sm text-gray-500">
                <span className="text-blue-600 font-medium">COACHING XYZ</span>
              </div>
            </div>
            <p className="text-gray-600 mb-6">Track your coaching journey</p>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">START</span>
                <span className="text-sm font-medium text-gray-700">GOAL</span>
              </div>
              
              <div className="relative">
                <div className="flex items-center justify-between">
                  {/* Milestone Steps */}
                  {[1, 2, 3, 4, 5].map((step, index) => (
                    <div key={step} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= 2 
                          ? 'bg-blue-600 text-white' 
                          : step === 3
                          ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {step <= 2 ? '✓' : step}
                      </div>
                      <span className={`mt-2 text-xs font-medium ${
                        step <= 2 ? 'text-blue-600' : step === 3 ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Progress Line */}
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 -z-10">
                  <div className="h-full bg-blue-600" style={{ width: '40%' }}></div>
                </div>
                
                {/* Current Position Indicator */}
                <div className="absolute top-3 left-1/4 transform -translate-x-1/2">
                  <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    YOU ARE HERE
                  </div>
                </div>
              </div>
            </div>

            {/* Current Milestone Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Milestone 2</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  In Progress
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center text-sm text-gray-600">
                    <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
                    done
                  </span>
                  <span className="flex items-center text-sm text-gray-600">
                    <span className="w-4 h-4 bg-blue-500 rounded-full mr-2"></span>
                    in progress
                  </span>
                </div>
                
                <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCoachDashboard = () => {
    const [showModal, setShowModal] = useState(false);
    const [showMilestoneModal, setShowMilestoneModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [showEditTaskModal, setShowEditTaskModal] = useState(false);
    const [roadmapName, setRoadmapName] = useState("");
    const [programType, setProgramType] = useState("");
    const [milestoneName, setMilestoneName] = useState("");
    const [milestoneDescription, setMilestoneDescription] = useState("");
    const [editingMilestone, setEditingMilestone] = useState<{ id: string; name: string; description: string } | null>(null);
    const [taskName, setTaskName] = useState("");
    const [currentMilestoneId, setCurrentMilestoneId] = useState<string | null>(null);
    const [editingTask, setEditingTask] = useState<{ id: string; name: string } | null>(null);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showMemberConfirmation, setShowMemberConfirmation] = useState(false);
    const [memberData, setMemberData] = useState({
      name: '',
      email: '',
      phone: '',
      program: '',
      notes: ''
    });
    const { roadmaps, selectedRoadmapId, addRoadmap, addMilestone, editMilestone, deleteMilestone, addTask, editTask, deleteTask } = useRoadmap();

    const handleAddRoadmap = () => {
      setShowModal(true);
    };

    const handleSubmit = () => {
      if (roadmapName && roadmapName.trim() && programType && programType.trim()) {
        addRoadmap(roadmapName.trim(), programType.trim());
        console.log("Creating program:", roadmapName.trim(), "Type:", programType.trim());
        // TODO: Add logic to save roadmap to database
        setShowModal(false);
        setRoadmapName("");
        setProgramType("");
      }
    };

    const handleCancel = () => {
      setShowModal(false);
      setRoadmapName("");
      setProgramType("");
    };

    const handleAddMilestone = () => {
      setShowMilestoneModal(true);
    };

    const handleMilestoneSubmit = () => {
      if (milestoneName && milestoneName.trim() && selectedRoadmapId) {
        addMilestone(selectedRoadmapId, milestoneName.trim(), milestoneDescription.trim());
        console.log("Creating milestone:", milestoneName.trim(), "Description:", milestoneDescription.trim());
        setShowMilestoneModal(false);
        setMilestoneName("");
        setMilestoneDescription("");
      }
    };

    const handleMilestoneCancel = () => {
      setShowMilestoneModal(false);
      setMilestoneName("");
      setMilestoneDescription("");
    };

    const handleEditMilestone = (milestoneId: string, newName: string, newDescription: string) => {
      if (selectedRoadmapId) {
        editMilestone(selectedRoadmapId, milestoneId, newName, newDescription);
        setShowEditModal(false);
        setEditingMilestone(null);
      }
    };

    const openEditModal = (milestone: { id: string; name: string; description: string }) => {
      setEditingMilestone(milestone);
      setShowEditModal(true);
    };

    const closeEditModal = () => {
      setShowEditModal(false);
      setEditingMilestone(null);
    };

    const openAddTaskModal = (milestoneId: string) => {
      setCurrentMilestoneId(milestoneId);
      setShowAddTaskModal(true);
    };

    const closeAddTaskModal = () => {
      setShowAddTaskModal(false);
      setCurrentMilestoneId(null);
      setTaskName("");
    };

    const handleAddTask = () => {
      if (taskName.trim() && selectedRoadmapId && currentMilestoneId) {
        addTask(selectedRoadmapId, currentMilestoneId, taskName.trim());
        closeAddTaskModal();
      }
    };

    const handleDeleteTask = (milestoneId: string, taskId: string, taskName: string) => {
      if (window.confirm(`Are you sure you want to delete task "${taskName}"?`)) {
        if (selectedRoadmapId) {
          deleteTask(selectedRoadmapId, milestoneId, taskId);
        }
      }
    };

    const openEditTaskModal = (task: { id: string; name: string }) => {
      setEditingTask(task);
      setShowEditTaskModal(true);
    };

    const closeEditTaskModal = () => {
      setShowEditTaskModal(false);
      setEditingTask(null);
    };

    const handleEditTask = (taskId: string, newName: string) => {
      if (selectedRoadmapId && currentMilestoneId) {
        editTask(selectedRoadmapId, currentMilestoneId, taskId, newName);
        closeEditTaskModal();
      }
    };

    const handleDeleteMilestone = (milestoneId: string, milestoneName: string) => {
      if (window.confirm(`Are you sure you want to delete milestone "${milestoneName}"?`)) {
        if (selectedRoadmapId) {
          deleteMilestone(selectedRoadmapId, milestoneId);
        }
      }
    };

    // Member Management Functions
    const handleAddMember = () => {
      // Auto-fill the program name with current roadmap
      const currentRoadmap = roadmaps.find(r => r.id === selectedRoadmapId);
      const currentProgramName = currentRoadmap?.name || '';
      
      setMemberData(prev => ({
        ...prev,
        program: currentProgramName
      }));
      setShowAddMemberModal(true);
    };

    const handleMemberSubmit = () => {
      if (memberData.name.trim() && memberData.email.trim()) {
        // Close the add member modal and show confirmation
        setShowAddMemberModal(false);
        setShowMemberConfirmation(true);
      }
    };

    const handleMemberCancel = () => {
      setShowAddMemberModal(false);
      setMemberData({
        name: '',
        email: '',
        phone: '',
        program: '',
        notes: ''
      });
    };

    const handleConfirmAddMember = () => {
      const newMember = {
        id: `member-${Date.now()}`,
        name: memberData.name.trim(),
        email: memberData.email.trim(),
        phone: memberData.phone.trim(),
        program: memberData.program.trim(),
        notes: memberData.notes.trim(),
        joinedAt: new Date().toISOString(),
        status: 'active' as const
      };
      
      // Generate invitation email
      generateMemberInvitationEmail(newMember);
      
      // Show success message
      alert(`✅ Member "${newMember.name}" added successfully!\n📧 Invitation email opened in new tab!`);
      
      // Reset form and close confirmation
      setMemberData({
        name: '',
        email: '',
        phone: '',
        program: '',
        notes: ''
      });
      setShowMemberConfirmation(false);
    };

    const handleCancelConfirmation = () => {
      // Go back to the add member modal
      setShowMemberConfirmation(false);
      setShowAddMemberModal(true);
    };

    const generateMemberInvitationEmail = (member: any) => {
      const currentRoadmap = roadmaps.find(r => r.id === selectedRoadmapId);
      const programName = member.program || currentRoadmap?.name || 'Coaching Program';
      
      const emailContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Welcome to Your Coaching Program</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: bold;">🎉 Welcome to Your Coaching Journey!</h1>
                <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">Hi ${member.name}, you've been added to your coaching program</p>
              </div>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin: 0 0 15px 0; font-size: 20px;">Welcome to ${programName}</h2>
                <p style="margin: 0; line-height: 1.6; opacity: 0.9;">
                  Your coach has created a personalized program designed specifically for your success!
                </p>
              </div>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">📋 Your Program Details:</h3>
                <ul style="color: #4b5563; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><strong>👤 Name:</strong> ${member.name}</li>
                  <li><strong>📧 Email:</strong> ${member.email}</li>
                  <li><strong>📚 Program:</strong> ${programName}</li>
                  <li><strong>👨‍🏫 Coach:</strong> ${user.name} (${user.email})</li>
                  ${member.phone ? `<li><strong>📞 Phone:</strong> ${member.phone}</li>` : ''}
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/auth" 
                   style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                  🚀 Access Your Program
                </a>
              </div>
              
              <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>📝 Next Steps:</strong><br>
                  1. Click the button above to create your account<br>
                  2. Complete your profile setup<br>
                  3. Start your first milestone<br>
                  4. Connect with your coach for guidance
                </p>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  <strong>From:</strong> ${user.name} (${user.email})<br>
                  <strong>Program:</strong> ${programName}<br>
                  <strong>Sent:</strong> ${new Date().toLocaleString()}<br>
                  <strong>Member ID:</strong> ${member.id}
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0; border-top: 1px solid #f3f4f6; padding-top: 10px;">
                  📧 This is a development email preview. In production, this would be sent via email service like SendGrid or AWS SES.
                </p>
              </div>
            </div>
          </body>
        </html>
      `;
      
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(emailContent);
        newWindow.document.close();
      }
    };

    return (
      <div className="min-h-screen w-full bg-white">
        {/* Roadmaps Section - Full Screen */}
        <div className="w-full bg-white p-6 pr-8 min-h-screen">
          <div className="flex justify-end items-center">
            <div className="flex items-center space-x-3">
              <Button
                className="bg-black hover:bg-gray-800 text-white"
                onClick={handleAddMember}
              >
                + Add Member
              </Button>
              <Button
                className="bg-black hover:bg-gray-800 text-white"
                onClick={handleAddRoadmap}
              >
                + Add Program
              </Button>
            </div>
          </div>

          {/* Programs Content */}
          <div>
            {roadmaps.filter(roadmap => !selectedRoadmapId || roadmap.id === selectedRoadmapId).map((roadmap) => (
              <div key={roadmap.id} className="space-y-6">
                {/* Program Header */}
                <div className="mb-16">
                  <h1 className="text-5xl font-bold text-gray-900 mb-1">{roadmap.name}</h1>
                  <p className="text-lg text-gray-600">Design and manage comprehensive coaching programs for your customers</p>
                </div>

                {/* Program Overview Card */}
                <div className="bg-white border border-gray-300 rounded-lg p-6">
                  <div className="mb-10">
                    <h2 className="text-3xl font-bold text-gray-900">Program Overview</h2>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-10">
                    <div className="text-center py-4">
                      <div className="text-3xl font-bold text-gray-900 mb-3">{roadmap.type}</div>
                      <div className="text-base font-medium text-gray-600">Program Type</div>
                    </div>
                    <div className="text-center py-4">
                      <div className="text-3xl font-bold text-gray-900 mb-3">{roadmap.createdDate}</div>
                      <div className="text-base font-medium text-gray-600">Created</div>
                    </div>
                    <div className="text-center py-4">
                      <div className="text-3xl font-bold text-gray-900 mb-3">{roadmap.milestones.length}</div>
                      <div className="text-base font-medium text-gray-600">Milestones</div>
                    </div>
                    <div className="text-center py-4">
                      <div className="text-3xl font-bold text-gray-900 mb-3">{roadmap.duration}</div>
                      <div className="text-base font-medium text-gray-600">Duration</div>
                    </div>
                  </div>
                </div>

                {/* Milestones Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Milestones</h2>
                    <Button className="bg-black hover:bg-gray-800 text-white" onClick={handleAddMilestone}>
                      + Add Milestone
                    </Button>
                  </div>
                  
                  {/* Milestone Blocks */}
                  <div className="space-y-6">
                    {roadmap.milestones.map((milestone) => (
                      <div key={milestone.id} className="bg-white border border-gray-200 rounded-lg p-6">
                        {/* Milestone Header */}
                        <div className="flex items-start justify-between mb-8">
                          <div className="flex items-start space-x-3">
                            <div className="flex items-center justify-center w-6 h-6 mt-0.5">
                              <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                <path d="M6 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{milestone.name}</h3>
                                  <p className="text-sm text-gray-500">{milestone.description}</p>
                                </div>
                                <div className="bg-gray-100 px-3 py-1 rounded-md ml-4">
                                  <span className="text-sm font-medium text-gray-700">Order: {milestone.number}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button 
                              onClick={() => openEditModal(milestone)}
                              className="p-2.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all duration-200 group border-2 border-transparent hover:border-blue-200"
                              title="Edit milestone"
                            >
                              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"/>
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteMilestone(milestone.id, milestone.name)}
                              className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-all duration-200 group border-2 border-transparent hover:border-red-200"
                              title="Delete milestone"
                            >
                              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 16 16" fill="currentColor">
                                <path fillRule="evenodd" d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19c.9 0 1.652-.681 1.741-1.575l.66-6.6a.75.75 0 00-1.492-.15l-.66 6.6a.25.25 0 01-.249.225H5.405a.25.25 0 01-.249-.225l-.66-6.6z"/>
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Tasks Section */}
                        <div>
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-lg font-semibold text-gray-900">Tasks</h4>
                            <Button 
                              size="sm" 
                              onClick={() => openAddTaskModal(milestone.id)}
                              className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                            >
                              <span className="mr-2">+</span>
                              Add Task
                            </Button>
                          </div>
                          
                          {/* Task List */}
                          <div className="space-y-0">
                            {milestone.tasks.map((task, index) => (
                              <div key={task.id} className={`flex items-center justify-between py-4 ${index !== milestone.tasks.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                <div className="flex items-center space-x-4">
                                  <div className="w-16"></div>
                                  <div className="flex items-center space-x-3">
                                    <span className={`text-base ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                      {task.name}
                                    </span>
                                    {task.required && (
                                      <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-md font-medium">
                                        Upload Required
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={() => openEditTaskModal(task)}
                                    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors duration-200"
                                    title="Edit task"
                                  >
                                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                                      <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"/>
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteTask(milestone.id, task.id, task.name)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                                    title="Delete task"
                                  >
                                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                                      <path fillRule="evenodd" d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19c.9 0 1.652-.681 1.741-1.575l.66-6.6a.75.75 0 00-1.492-.15l-.66 6.6a.25.25 0 01-.249.225H5.405a.25.25 0 01-.249-.225l-.66-6.6z"/>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                            
                            {/* Show placeholder when no tasks */}
                            {milestone.tasks.length === 0 && (
                              <div className="flex items-center space-x-4 py-4 text-gray-400">
                                <div className="w-16"></div>
                                <span className="text-base italic">No tasks yet</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            {roadmaps.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No programs yet</p>
                <p className="text-sm">Click "Add Program" to create your first one</p>
              </div>
            )}
          </div>
        </div>



        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Blurred Background */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={handleCancel}
            ></div>
            
            {/* Modal Card */}
            <Card className="relative z-10 w-96 mx-4">
          <CardHeader>
                <CardTitle>Add New Program</CardTitle>
                <CardDescription>Enter details for your new coaching program</CardDescription>
          </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Program name..."
                  value={roadmapName}
                  onChange={(e) => setRoadmapName(e.target.value)}
                  autoFocus
                />
                <Input
                  placeholder="Program type (e.g., Business, Leadership, Sales)..."
                  value={programType}
                  onChange={(e) => setProgramType(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmit();
                    }
                    if (e.key === 'Escape') {
                      handleCancel();
                    }
                  }}
                />
                <div className="flex space-x-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-black hover:bg-gray-800 text-white"
                    onClick={handleSubmit}
                    disabled={!roadmapName.trim() || !programType.trim()}
                  >
                    Create
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
        )}

        {/* Milestone Modal */}
        {showMilestoneModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Blurred Background */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={handleMilestoneCancel}
            ></div>
            
            {/* Modal Card */}
            <Card className="relative z-10 w-96 mx-4">
          <CardHeader>
                <CardTitle>Add New Milestone</CardTitle>
                <CardDescription>
                  Milestone {selectedRoadmapId ? (roadmaps.find(r => r.id === selectedRoadmapId)?.milestones.length || 0) + 1 : 1} - Enter a name for this milestone
                </CardDescription>
          </CardHeader>
                            <CardContent className="space-y-4">
                <Input
                  placeholder="Milestone name..."
                  value={milestoneName}
                  onChange={(e) => setMilestoneName(e.target.value)}
                  autoFocus
                />
                <Input
                  placeholder="Milestone description..."
                  value={milestoneDescription}
                  onChange={(e) => setMilestoneDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleMilestoneSubmit();
                    }
                    if (e.key === 'Escape') {
                      handleMilestoneCancel();
                    }
                  }}
                />
                <div className="flex space-x-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={handleMilestoneCancel}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-black hover:bg-gray-800 text-white"
                    onClick={handleMilestoneSubmit}
                    disabled={!milestoneName.trim()}
                  >
                    Create
                  </Button>
                </div>
              </CardContent>
        </Card>
      </div>
        )}

        {/* Edit Milestone Modal */}
        {showEditModal && editingMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Blur Background Overlay */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeEditModal}
            ></div>
            
            {/* Modal Card */}
            <div className="relative bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 opacity-100">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Milestone</h2>
                <p className="text-gray-600 mt-1">Update the milestone details</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Milestone Name
                  </label>
                  <input
                    type="text"
                    value={editingMilestone.name}
                    onChange={(e) => setEditingMilestone({
                      ...editingMilestone,
                      name: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter milestone name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingMilestone.description}
                    onChange={(e) => setEditingMilestone({
                      ...editingMilestone,
                      description: e.target.value
                    })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Enter milestone description"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={closeEditModal}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditMilestone(editingMilestone.id, editingMilestone.name, editingMilestone.description)}
                  disabled={!editingMilestone.name.trim()}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={closeEditModal}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Add Task Modal */}
        {showAddTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Blur Background Overlay */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeAddTaskModal}
            ></div>
            
            {/* Modal Card */}
            <div className="relative bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 opacity-100">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Define Task</h2>
                <p className="text-gray-600 mt-1">Add a new task to this milestone</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Define Task *
                  </label>
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter task name"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={closeAddTaskModal}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTask}
                  disabled={!taskName.trim()}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Add Task
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={closeAddTaskModal}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {showEditTaskModal && editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Blur Background Overlay */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeEditTaskModal}
            ></div>
            
            {/* Modal Card */}
            <div className="relative bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 opacity-100">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Task</h2>
                <p className="text-gray-600 mt-1">Update the task details</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Name *
                  </label>
                  <input
                    type="text"
                    value={editingTask.name}
                    onChange={(e) => setEditingTask({
                      ...editingTask,
                      name: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter task name"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={closeEditTaskModal}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditTask(editingTask.id, editingTask.name)}
                  disabled={!editingTask.name.trim()}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={closeEditTaskModal}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Blur Background Overlay */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={handleMemberCancel}
            ></div>
            
            {/* Modal Card */}
            <div className="relative bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 opacity-100">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Member</h2>
                <p className="text-gray-600 mt-1">Add a new member to your coaching program</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={memberData.name}
                    onChange={(e) => setMemberData({...memberData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={memberData.email}
                    onChange={(e) => setMemberData({...memberData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={memberData.phone}
                    onChange={(e) => setMemberData({...memberData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program
                  </label>
                  <input
                    type="text"
                    value={memberData.program}
                    onChange={(e) => setMemberData({...memberData, program: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter program name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={memberData.notes}
                    onChange={(e) => setMemberData({...memberData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Add any notes about this member"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={handleMemberCancel}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMemberSubmit}
                  disabled={!memberData.name.trim() || !memberData.email.trim()}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Add Member
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={handleMemberCancel}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Member Confirmation Modal */}
        {showMemberConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Blur Background Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
            
            {/* Confirmation Card */}
            <div className="relative bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4 transform transition-all duration-300 scale-100 opacity-100">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Confirm New Member</h2>
                <p className="text-gray-600 mt-1">Please review the member details before sending invitation</p>
              </div>

              {/* Member Details Preview */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Member Details</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">👤 Name:</span>
                    <span className="text-gray-900 font-semibold">{memberData.name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">📧 Email:</span>
                    <span className="text-gray-900">{memberData.email}</span>
                  </div>
                  
                  {memberData.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">📞 Phone:</span>
                      <span className="text-gray-900">{memberData.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">📚 Program:</span>
                    <span className="text-gray-900 font-semibold">{memberData.program || 'Default Program'}</span>
                  </div>
                  
                  {memberData.notes && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-600 font-medium">📝 Notes:</span>
                      <p className="text-gray-900 mt-1">{memberData.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Note */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>📧 An invitation email will be generated</strong> and opened in a new tab for this member to join your coaching program.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelConfirmation}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  ← Go Back
                </button>
                <button
                  onClick={handleConfirmAddMember}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
    );
  }

  const renderSuperAdminDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-black opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-full mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Welcome, Super Administrator
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                You have complete administrative control over the COACHING XYZ platform. 
                Manage users, monitor system performance, and oversee all coaching operations from this centralized dashboard.
              </p>
            </div>
            
            <div className="flex justify-center space-x-4 mb-12">
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium">System Online</span>
              </div>
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium">All Services Active</span>
              </div>
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-gray-900 rounded-full mr-2"></div>
                <span className="text-sm font-medium">Administrator Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-4">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">System</h3>
            <p className="text-gray-600 text-sm">Operational</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-4">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Platform</h3>
            <p className="text-gray-600 text-sm">Monitoring</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-4">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Performance</h3>
            <p className="text-gray-600 text-sm">Optimized</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-4">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Security</h3>
            <p className="text-gray-600 text-sm">Protected</p>
          </div>
        </div>

        {/* Administrative Message */}
        <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 rounded-2xl p-12 text-center text-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Administrative Control Center</h2>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              As the Super Administrator, you maintain oversight of all platform operations. 
              Your role ensures the seamless delivery of coaching services and maintains the highest 
              standards of user experience across the entire COACHING XYZ ecosystem.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-10 rounded-xl mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">System Management</h3>
                <p className="text-gray-300 text-sm">Complete control over platform configuration and settings</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-10 rounded-xl mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">User Oversight</h3>
                <p className="text-gray-300 text-sm">Monitor and manage all coaches and customers</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-10 rounded-xl mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Analytics & Reports</h3>
                <p className="text-gray-300 text-sm">Comprehensive insights into platform performance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center mt-16">
          <p className="text-gray-600 text-lg">
            Welcome back to <span className="font-semibold text-gray-900">COACHING XYZ</span> Administration Portal
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Logged in as Super Administrator • All systems operational
          </p>
        </div>
      </div>
    </div>
  )

  // Render appropriate dashboard based on user role
  switch (user.role) {
    case 'customer':
      return renderCustomerDashboard()
    case 'coach':
      return renderCoachDashboard()
    case 'super_admin':
      return renderSuperAdminDashboard()
    default:
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Unknown Role</h2>
          <p className="text-muted-foreground">Please contact support for assistance.</p>
        </div>
      )
  }
} 