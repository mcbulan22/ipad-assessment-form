"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getAssessmentById, acknowledgeAssessment } from "@/lib/supabase"
import type { Assessment } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, FileText, User } from "lucide-react"

interface StudentAcknowledgmentProps {
  assessmentId: string
}

export default function StudentAcknowledgment({ assessmentId }: StudentAcknowledgmentProps) {
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [signature, setSignature] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAcknowledged, setIsAcknowledged] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchAssessment()
  }, [assessmentId])

  const fetchAssessment = async () => {
    try {
      setIsLoading(true)
      const data = await getAssessmentById(assessmentId)
      setAssessment(data)
      setIsAcknowledged(!!data?.acknowledged_at)
    } catch (err: any) {
      setError(err.message || "Failed to fetch assessment")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcknowledge = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!signature.trim()) {
      setError("Please enter your signature")
      return
    }

    if (!assessment) return

    setIsSubmitting(true)
    setError(null)

    try {
      await acknowledgeAssessment(assessment.id!, {
        assessment_id: assessment.id!,
        student_signature: signature.trim(),
        ip_address: await fetch("/api/ip")
          .then((r) => r.text())
          .catch(() => ""),
        user_agent: navigator.userAgent,
      })

      setIsAcknowledged(true)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to acknowledge assessment")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading assessment...</div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Assessment not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Assessment Results</CardTitle>
            <p className="text-gray-600">Please review your assessment results below</p>
          </CardHeader>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isAcknowledged && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Assessment acknowledged successfully on {new Date(assessment.acknowledged_at!).toLocaleString()}
            </AlertDescription>
          </Alert>
        )}

        {/* Assessment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Assessment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Student Name</Label>
                <p className="text-lg">{assessment.student_name}</p>
              </div>
              <div>
                <Label className="font-semibold">Assessor</Label>
                <p className="text-lg">{assessment.assessor_name}</p>
              </div>
              <div>
                <Label className="font-semibold">Assessment Date</Label>
                <p>{new Date(assessment.created_at!).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="font-semibold">Marking Sheet</Label>
                <p>{assessment.marking_sheets?.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Results */}
        <Card>
          <CardHeader>
            <CardTitle
              className={`flex items-center gap-2 ${
                assessment.status === "passed" ? "text-green-700" : "text-red-700"
              }`}
            >
              {assessment.status === "passed" ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              Assessment Result: {assessment.status?.toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{assessment.total_score}</div>
                <div className="text-sm text-blue-600">Points Earned</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-700">{assessment.max_possible_score}</div>
                <div className="text-sm text-gray-600">Total Points</div>
              </div>
              <div
                className={`text-center p-4 rounded-lg ${assessment.status === "passed" ? "bg-green-50" : "bg-red-50"}`}
              >
                <div
                  className={`text-2xl font-bold ${assessment.status === "passed" ? "text-green-700" : "text-red-700"}`}
                >
                  {assessment.percentage_score}%
                </div>
                <div className={`text-sm ${assessment.status === "passed" ? "text-green-600" : "text-red-600"}`}>
                  Final Score
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="font-semibold">Remarks</Label>
              <p className="mt-1 p-3 bg-gray-50 rounded-lg">{assessment.remarks}</p>
            </div>
          </CardContent>
        </Card>

        {/* Acknowledgment Form */}
        {!isAcknowledged && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Acknowledgment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAcknowledge} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signature">
                    I acknowledge that I have reviewed my assessment results and understand the feedback provided.
                  </Label>
                  <Input
                    id="signature"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Type your full name as digital signature"
                    required
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Acknowledging..." : "Acknowledge Assessment"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
