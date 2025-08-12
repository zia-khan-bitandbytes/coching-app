'use client'

import { ForgotPasswordForm } from "@/components/forgot-password-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Forgot Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email to receive a password reset link
          </p>
        </div>
        
        <ForgotPasswordForm />
        
        <div className="text-center">
          <Link href="/auth">
            <Button variant="link" className="text-sm">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 