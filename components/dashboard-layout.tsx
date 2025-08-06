"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useRouter } from "next/navigation"
import { User, LogOut, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const coachingOffers = [
  { id: "business-growth", name: "Business Growth Program" },
  { id: "leadership", name: "Leadership Mastery" },
  { id: "sales-excellence", name: "Sales Excellence" },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<{ email: string; name: string; role: string } | null>(null)
  const [selectedOffer, setSelectedOffer] = useState("business-growth")
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push("/")
    }
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem("user")
      router.push("/auth")
    }
  }

  const switchToAdmin = () => {
    router.push("/admin")
  }

  const switchToClient = () => {
    router.push("/dashboard")
  }

  if (!user) {
    return <div>Loading...</div>
  }

  const isAdmin = user.role === 'super_admin'
  const isCoach = user.role === 'coach'
  const isCustomer = user.role === 'customer'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-900">COACHING XYZ</h1>

            {isCustomer && (
              <Select value={selectedOffer} onValueChange={setSelectedOffer}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {coachingOffers.map((offer) => (
                    <SelectItem key={offer.id} value={offer.id}>
                      {offer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {isAdmin ? "Admin Account" : user.name}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAdmin ? (
                  <DropdownMenuItem onClick={switchToClient}>Switch to Client View</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={switchToAdmin}>Switch to Admin</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Avatar>
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex">
        {isAdmin ? <AdminSidebar /> : <Sidebar />}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
