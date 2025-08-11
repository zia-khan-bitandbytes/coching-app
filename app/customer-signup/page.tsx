"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  MapPin, 
  Calendar,
  Building,
  Globe,
  Target,
  Star,
  CheckCircle,
  ArrowRight,
  Upload,
  Eye,
  EyeOff,
  Shield,
  Zap,
  Award,
  Users,
  BookOpen,
  TrendingUp
} from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/lib/toast"

interface SignupFormData {
  // Personal Information
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  
  // Profile Picture
  profilePicture: File | null
  
  // Address Information
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  
  // Professional Information
  company: string
  jobTitle: string
  industry: string
  experience: string
  
  // Goals & Preferences
  primaryGoal: string
  secondaryGoals: string[]
  preferredContact: string
  timezone: string
  
  // Account Security
  password: string
  confirmPassword: string
  acceptTerms: boolean
  marketingEmails: boolean
}

export default function CustomerSignupPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [invitationData, setInvitationData] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    profilePicture: null,
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    company: "",
    jobTitle: "",
    industry: "",
    experience: "",
    primaryGoal: "",
    secondaryGoals: [],
    preferredContact: "email",
    timezone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    marketingEmails: false
  })

  // Check for invitation data on component mount
  useEffect(() => {
    const storedInvitationData = localStorage.getItem('invitationData')
    if (storedInvitationData) {
      try {
        const parsedData = JSON.parse(storedInvitationData)
        setInvitationData(parsedData)
        
        // Pre-fill form with invitation data
        if (parsedData.email) {
          setFormData(prev => ({
            ...prev,
            email: parsedData.email
          }))
        }
        
        if (parsedData.name) {
          const nameParts = parsedData.name.split(' ')
          setFormData(prev => ({
            ...prev,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || ''
          }))
        }
      } catch (error) {
        console.error('Error parsing invitation data:', error)
      }
    }
  }, [])

  const steps = [
    { id: 1, title: "Welcome", icon: Star },
    { id: 2, title: "Personal Info", icon: User },
    { id: 3, title: "Security", icon: Shield }
  ]

  const industries = [
    "Technology", "Healthcare", "Finance", "Education", "Manufacturing", 
    "Retail", "Real Estate", "Consulting", "Marketing", "Legal",
    "Non-profit", "Government", "Other"
  ]

  const experienceLevels = [
    "Entry Level (0-2 years)", "Mid Level (3-7 years)", 
    "Senior Level (8-15 years)", "Executive (15+ years)"
  ]

  const primaryGoals = [
    "Career Advancement", "Skill Development", "Leadership Training",
    "Business Growth", "Personal Development", "Industry Transition"
  ]

  const secondaryGoals = [
    "Public Speaking", "Strategic Planning", "Team Management",
    "Financial Management", "Marketing Skills", "Technical Skills",
    "Networking", "Work-Life Balance", "Time Management"
  ]

  const timezones = [
    "UTC-12", "UTC-11", "UTC-10", "UTC-9", "UTC-8", "UTC-7", "UTC-6",
    "UTC-5", "UTC-4", "UTC-3", "UTC-2", "UTC-1", "UTC+0", "UTC+1",
    "UTC+2", "UTC+3", "UTC+4", "UTC+5", "UTC+6", "UTC+7", "UTC+8",
    "UTC+9", "UTC+10", "UTC+11", "UTC+12"
  ]

  const handleInputChange = (field: keyof SignupFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleInputChange('profilePicture', file)
    }
  }

  const handleSecondaryGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      secondaryGoals: prev.secondaryGoals.includes(goal)
        ? prev.secondaryGoals.filter(g => g !== goal)
        : [...prev.secondaryGoals, goal]
    }))
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      // Create user object
      const newUser = {
        id: Date.now().toString(),
        name: formData.firstName + " " + formData.lastName,
        email: formData.email,
        role: "customer"
      }
      
      // If user came from invitation, create account via API
      if (invitationData) {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            name: newUser.name,
            password: formData.password,
            role: 'customer',
            invitation_data: {
              coach_id: invitationData.coach_id,
              program_id: invitationData.program_id
            }
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          newUser.id = result.user.id
          
          // Link customer to coach and program
          await fetch('/api/invite/link-customer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customer_id: newUser.id,
              coach_id: invitationData.coach_id,
              program_id: invitationData.program_id
            })
          })
          
          // Clear invitation data
          localStorage.removeItem('invitationData')
          
          showSuccessToast("Account created successfully! Welcome to your coaching journey.")
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create account')
        }
      } else {
        // Regular signup (no invitation)
        showSuccessToast("Account created successfully! Welcome to your coaching journey.")
      }
      
      // Save user to localStorage
      localStorage.setItem("user", JSON.stringify(newUser))
      
      // Redirect to customer dashboard
      window.location.href = "/dashboard"
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Failed to create account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const progressPercentage = (currentStep / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Diego Coaching
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Progress */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky top-8"
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Your Journey
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-blue-600">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  {/* Steps */}
                  <div className="space-y-4">
                    {steps.map((step, index) => {
                      const Icon = step.icon
                      const isActive = currentStep === step.id
                      const isCompleted = currentStep > step.id
                      
                      return (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                            isActive 
                              ? 'bg-blue-50 border border-blue-200' 
                              : isCompleted 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isActive 
                              ? 'bg-blue-600 text-white' 
                              : isCompleted 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-300 text-gray-600'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className={`font-medium ${
                              isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-600'
                            }`}>
                              {step.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {isActive ? 'Current step' : isCompleted ? 'Completed' : 'Upcoming'}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Benefits */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">What you'll get:</h4>
                    <div className="space-y-2">
                      {[
                        { icon: Users, text: "Personalized coaching" },
                        { icon: BookOpen, text: "Expert resources" },
                        { icon: TrendingUp, text: "Progress tracking" },
                        { icon: Award, text: "Certification" }
                      ].map((benefit, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-2 text-sm text-gray-600"
                        >
                          <benefit.icon className="h-4 w-4 text-green-600" />
                          {benefit.text}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      {currentStep === 1 && <Star className="h-6 w-6 text-yellow-500" />}
                      {currentStep === 2 && <User className="h-6 w-6 text-blue-500" />}
                      {currentStep === 3 && <Shield className="h-6 w-6 text-red-500" />}
                      {steps[currentStep - 1].title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Step 1: Welcome */}
                    {currentStep === 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-6"
                      >
                        {invitationData && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                          >
                            <div className="flex items-center gap-2 justify-center mb-2">
                              <CheckCircle className="h-5 w-5 text-blue-600" />
                              <span className="font-semibold text-blue-800">Invitation Accepted!</span>
                            </div>
                            <p className="text-sm text-blue-700">
                              You're completing your profile to join the coaching program. 
                              Your email ({invitationData.email}) has been pre-filled.
                            </p>
                          </motion.div>
                        )}
                        
                        <div className="space-y-4">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto"
                          >
                            <Star className="h-10 w-10 text-white" />
                          </motion.div>
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {invitationData ? 'Complete Your Profile' : 'Welcome to Your Coaching Journey'}
                          </h2>
                          <p className="text-gray-600 max-w-2xl mx-auto">
                            {invitationData 
                              ? 'You\'re almost there! Complete your profile to start your coaching journey.'
                              : 'Join thousands of professionals who have transformed their careers with personalized coaching. Let\'s create your success story together.'
                            }
                          </p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-6 mt-8">
                          {[
                            { icon: Users, title: "Personalized Coaching", desc: "One-on-one sessions with expert coaches" },
                            { icon: BookOpen, title: "Rich Resources", desc: "Access to premium learning materials" },
                            { icon: TrendingUp, title: "Track Progress", desc: "Monitor your growth and achievements" },
                            { icon: Award, title: "Get Certified", desc: "Earn recognized certifications" }
                          ].map((feature, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100"
                            >
                              <feature.icon className="h-8 w-8 text-blue-600 mb-3" />
                              <h3 className="font-semibold text-gray-800 mb-1">{feature.title}</h3>
                              <p className="text-sm text-gray-600">{feature.desc}</p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Personal Information */}
                    {currentStep === 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) => handleInputChange('firstName', e.target.value)}
                              placeholder="Enter your first name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) => handleInputChange('lastName', e.target.value)}
                              placeholder="Enter your last name"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              placeholder="Enter your email"
                              readOnly={!!invitationData}
                              className={invitationData ? "bg-gray-50 cursor-not-allowed" : ""}
                            />
                            {invitationData && (
                              <p className="text-xs text-blue-600">
                                Email pre-filled from your invitation
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              placeholder="Enter your phone number"
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                            <Input
                              id="dateOfBirth"
                              type="date"
                              value={formData.dateOfBirth}
                              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                              <SelectTrigger id="gender">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Profile Picture Upload */}
                        <div className="space-y-4">
                          <Label>Profile Picture</Label>
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                              {formData.profilePicture ? (
                                <img
                                  src={URL.createObjectURL(formData.profilePicture)}
                                  alt="Profile"
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <Camera className="h-8 w-8 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Photo
                              </Button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Security */}
                    {currentStep === 3 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                placeholder="Create a strong password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password *</Label>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                placeholder="Confirm your password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="acceptTerms"
                              checked={formData.acceptTerms}
                              onCheckedChange={(checked) => handleInputChange('acceptTerms', checked)}
                            />
                            <Label htmlFor="acceptTerms" className="text-sm">
                              I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and{" "}
                              <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a> *
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="marketingEmails"
                              checked={formData.marketingEmails}
                              onCheckedChange={(checked) => handleInputChange('marketingEmails', checked)}
                            />
                            <Label htmlFor="marketingEmails" className="text-sm">
                              I would like to receive marketing emails about new features and updates
                            </Label>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2"
                      >
                        Previous
                      </Button>
                      
                      {currentStep < steps.length ? (
                        <Button
                          type="button"
                          onClick={nextStep}
                          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          Next Step
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isLoading}
                          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                        >
                          {isLoading ? "Creating Account..." : "Create Account"}
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
} 