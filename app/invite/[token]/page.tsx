"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, AlertCircle, User, BookOpen, Building } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface InvitationData {
  id: string
  token: string
  coach_id: string
  program_id: string
  customer_email: string
  customer_name: string
  status: string
  created_at: string
  expires_at: string
  program: {
    name: string
    description: string
    calculated_duration?: number
    price: number
  }
  coach: {
    name: string
    business_name: string
    specialization: string
  }
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.token) {
      fetchInvitation(params.token as string)
    }
  }, [params.token])

  const fetchInvitation = async (token: string) => {
    try {
      const response = await fetch(`/api/invite/${token}`)
      const data = await response.json()
      
      if (data.success) {
        setInvitation(data.invitation)
      } else {
        setError(data.error || 'Invalid invitation')
      }
    } catch (error) {
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!invitation) return
    
    setAccepting(true)
    try {
      const response = await fetch(`/api/invite/${invitation.token}/accept`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        if (data.customer_exists) {
          // Customer already exists - redirect to dashboard
          toast({
            title: "Welcome back!",
            description: `You've successfully joined ${invitation.program.name}!`,
          })
          
          // Automatically log in the existing customer
          if (data.user_data) {
            localStorage.setItem("user", JSON.stringify(data.user_data))
          }
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else {
          // Customer doesn't exist - redirect to signup
          toast({
            title: "Invitation Accepted!",
            description: "Please complete your profile to continue.",
          })
          
          // Store invitation data in localStorage for the signup process
          localStorage.setItem('invitationData', JSON.stringify(data.invitation_data))
          
          // Redirect to customer signup after a short delay
          setTimeout(() => {
            router.push('/customer-signup')
          }, 2000)
        }
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to accept invitation',
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: 'Failed to accept invitation',
        variant: "destructive"
      })
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>
              {error || 'This invitation link is invalid or has expired.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isExpired = new Date(invitation.expires_at) < new Date()
  const isAccepted = invitation.status === 'accepted'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center justify-center mb-4">
              {isAccepted ? (
                <CheckCircle className="h-16 w-16 text-green-300" />
              ) : isExpired ? (
                <Clock className="h-16 w-16 text-red-300" />
              ) : (
                <BookOpen className="h-16 w-16 text-blue-300" />
              )}
            </div>
            <CardTitle className="text-3xl">
              {isAccepted ? 'Welcome!' : isExpired ? 'Invitation Expired' : 'You\'re Invited!'}
            </CardTitle>
            <CardDescription className="text-blue-100 text-lg">
              {isAccepted 
                ? `You've joined ${invitation.program.name}`
                : isExpired 
                  ? 'This invitation has expired'
                  : `Join ${invitation.program.name} by ${invitation.coach.business_name}`
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            {!isExpired && !isAccepted && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700 font-medium">Invited for:</span>
                  <span className="text-lg font-semibold">{invitation.customer_name}</span>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <Building className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700 font-medium">Organization:</span>
                  <span className="text-lg font-semibold">{invitation.coach.business_name}</span>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                {invitation.program.name}
              </h3>
              <p className="text-gray-600 mb-4">{invitation.program.description}</p>
              
              <div className="flex gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{invitation.program.calculated_duration || 0} days</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>${invitation.program.price}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h4 className="font-semibold text-blue-800 mb-2">Your Coach</h4>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">{invitation.coach.name}</p>
                  <p className="text-sm text-blue-700">{invitation.coach.specialization}</p>
                </div>
              </div>
            </div>

            {isExpired ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  This invitation has expired. Please contact your coach for a new invitation.
                </p>
                <Button onClick={() => router.push('/')} className="w-full">
                  Go to Homepage
                </Button>
              </div>
            ) : isAccepted ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="text-green-600 font-medium">Invitation Accepted!</span>
                </div>
                <p className="text-gray-600 mb-4">
                  You're all set! Redirecting you to your dashboard...
                </p>
                <Button onClick={() => router.push('/dashboard')} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button 
                  onClick={handleAcceptInvitation} 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={accepting}
                >
                  {accepting ? 'Accepting...' : 'Accept Invitation'}
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  By accepting this invitation, you agree to join the coaching program and 
                  will be redirected to create your account or sign in.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

