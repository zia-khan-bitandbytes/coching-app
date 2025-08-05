"use client"

import { useState } from "react"
import { LoginForm } from "@/components/login-form"
import { SignupForm } from "@/components/signup-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">COACHING XYZ</h1>
          <p className="text-gray-600 mt-2">Access your coaching roadmap</p>
        </div>
        
        {isLogin ? <LoginForm /> : <SignupForm />}
        
        <div className="mt-6 text-center space-y-2">
          {isLogin && (
            <div>
              <Link href="/forgot-password">
                <Button variant="link" className="text-sm">
                  Forgot your password?
                </Button>
              </Link>
            </div>
          )}
          <p className="text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Button
              variant="link"
              className="p-0 h-auto font-semibold"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
} 