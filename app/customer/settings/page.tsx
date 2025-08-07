"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { showSuccessToast, showErrorToast } from "@/lib/toast"

export default function CustomerSettingsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      setFormData((prev) => ({ ...prev, name: user.name, email: user.email }))
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (formData.password && formData.password !== formData.confirmPassword) {
      showErrorToast("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/customer/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password || undefined
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Update failed")
      showSuccessToast("Profile updated successfully!")
      // Optionally update localStorage
      localStorage.setItem("user", JSON.stringify({ ...data.user }))
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Update failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium" htmlFor="name">Name</label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div>
              <label className="block mb-1 font-medium" htmlFor="email">Email</label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
            </div>
            <div>
              <label className="block mb-1 font-medium" htmlFor="password">New Password</label>
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} placeholder="Leave blank to keep current password" />
            </div>
            <div>
              <label className="block mb-1 font-medium" htmlFor="confirmPassword">Confirm New Password</label>
              <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Leave blank to keep current password" />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}