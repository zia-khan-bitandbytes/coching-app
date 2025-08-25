"use client"

import { useState, useEffect } from "react"

export function DebugUser() {
  const [userData, setUserData] = useState<any>(null)
  const [coachId, setCoachId] = useState<string | null>(null)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (user) {
      const parsedUser = JSON.parse(user)
      setUserData(parsedUser)
      setCoachId(parsedUser.coach_id || parsedUser.id)
    }
  }, [])

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">Debug User Data</h3>
      <div className="space-y-2 text-sm">
        <div><strong>User ID:</strong> {userData?.id}</div>
        <div><strong>Email:</strong> {userData?.email}</div>
        <div><strong>Role:</strong> {userData?.role}</div>
        <div><strong>Coach ID:</strong> {userData?.coach_id || 'Not set'}</div>
        <div><strong>Using Coach ID:</strong> {coachId}</div>
        <div><strong>Business Name:</strong> {userData?.business_name || 'Not set'}</div>
      </div>
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Test API Calls:</h4>
        <div className="space-y-2">
          <button 
            onClick={() => fetch(`/api/coach/${coachId}/programs`).then(r => r.json()).then(console.log)}
            className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
          >
            Test Programs API
          </button>
          <button 
            onClick={() => fetch(`/api/coach/${coachId}/customers`).then(r => r.json()).then(console.log)}
            className="px-3 py-1 bg-green-500 text-white rounded text-xs ml-2"
          >
            Test Customers API
          </button>
          <button 
            onClick={() => fetch(`/api/coach/${coachId}/stats`).then(r => r.json()).then(console.log)}
            className="px-3 py-1 bg-purple-500 text-white rounded text-xs ml-2"
          >
            Test Stats API
          </button>
        </div>
      </div>
    </div>
  )
}
