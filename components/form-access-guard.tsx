"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Lock, Eye, EyeOff } from "lucide-react"

interface FormAccessGuardProps {
  children: React.ReactNode
  requiredPassword?: string
}

export default function FormAccessGuard({ children, requiredPassword = "assess2024" }: FormAccessGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Check if user is already authenticated (stored in sessionStorage)
  useEffect(() => {
    const storedAuth = sessionStorage.getItem("form_authenticated")
    if (storedAuth === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Simulate a small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (password === requiredPassword) {
      setIsAuthenticated(true)
      sessionStorage.setItem("form_authenticated", "true")
    } else {
      setError("Incorrect password. Please contact your administrator for the correct password.")
    }

    setIsLoading(false)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem("form_authenticated")
    setPassword("")
    setError(null)
  }

  if (isAuthenticated) {
    return (
      <div>
        {/* Logout button in top right */}
        <div className="fixed top-4 right-4 z-50">
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <Lock className="h-4 w-4 mr-2" />
            Lock Form
          </Button>
        </div>
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Assessment Form Access</CardTitle>
          <p className="text-sm text-gray-600">
            This form is password protected. Please enter the access password provided by your administrator.
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-password">Access Password</Label>
              <div className="relative">
                <Input
                  id="access-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter access password"
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Access Form"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t text-center text-sm text-gray-500">
            <p>Contact your administrator if you need the access password.</p>
            <p className="mt-2">
              <strong>Default password for testing:</strong> assess2024
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
