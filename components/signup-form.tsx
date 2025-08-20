"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { showSuccessToast, showErrorToast } from "@/lib/toast"
import { UserRole, getRoleDisplayName, getRoleDescription } from "@/lib/auth-client"

export function SignupForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "coach" as UserRole
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Validation functions
  const validateForm = () => {
    const newErrors = { name: '', email: '', password: '', confirmPassword: '' }
    
    // Name validation: 2-50 characters
    if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name must be 50 characters or less'
    }
    
    // Email validation: basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Password validation: 6-50 characters
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    } else if (formData.password.length > 50) {
      newErrors.password = 'Password must be 50 characters or less'
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== '')
  }

  const clearErrors = () => {
    setErrors({ name: '', email: '', password: '', confirmPassword: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submitting
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      const roleDisplayName = getRoleDisplayName(formData.role)
      showSuccessToast(`${roleDisplayName} account created successfully! Welcome to your dashboard.`)
      router.push('/dashboard')
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Sign up to access the coaching platform</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="name">Full Name</Label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">2-50 characters</span>
                {formData.name.length >= 2 && formData.name.length <= 50 && (
                  <span className="text-green-500">✓</span>
                )}
              </div>
            </div>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleInputChange}
              maxLength={50}
              required
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Valid email format</span>
                {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                  <span className="text-green-500">✓</span>
                )}
              </div>
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <div className="p-3 bg-gray-50 border rounded-md">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">Coach</span>
                <span className="text-xs text-gray-500">• {getRoleDescription('coach')}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">6-50 characters</span>
                {formData.password.length >= 6 && formData.password.length <= 50 && (
                  <span className="text-green-500">✓</span>
                )}
              </div>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              maxLength={50}
              required
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Must match password</span>
                {formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 && (
                  <span className="text-green-500">✓</span>
                )}
              </div>
            </div>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              maxLength={50}
              required
            />
            {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating coach account..." : "Create Coach Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 