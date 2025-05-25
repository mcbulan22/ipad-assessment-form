"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getMarkingSheets, submitAssessment, calculateAssessmentScore } from "@/lib/supabase"
import type { MarkingSheet, Assessment } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AssessmentForm() {
  const [markingSheets, setMarkingSheets] = useState<MarkingSheet[]>([])
  const [selectedSheet, setSelectedSheet] = useState<MarkingSheet | null>(null)
  const [studentName, setStudentName] = useState("")
  const [assessorName, setAssessorName] = useState("")
  const [checklistResponses, setChecklistResponses] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  // Fetch marking sheets on component mount
  useEffect(() => {
    fetchMarkingSheets()
  }, [])

  const fetchMarkingSheets = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const sheets = await getMarkingSheets()
      setMarkingSheets(sheets)
    } catch (err) {
      setError("Failed to fetch marking sheets. Please check your connection.")
      console.error("Error fetching marking sheets:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSheetSelection = (sheetId: string) => {
    const sheet = markingSheets.find((s) => s.id === sheetId)
    setSelectedSheet(sheet || null)
    setChecklistResponses({})
    setSubmitStatus("idle")
  }

  const handleChecklistChange = (itemId: string, checked: boolean) => {
    setChecklistResponses((prev) => ({
      ...prev,
      [itemId]: checked,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSheet || !studentName.trim() || !assessorName.trim()) {
      setError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Calculate scoring with new function
      const scoreResult = calculateAssessmentScore(
        selectedSheet.checklist_items || [],
        checklistResponses,
        selectedSheet.passing_score || 70,
      )

      const assessmentData: Omit<Assessment, "id" | "created_at" | "updated_at"> = {
        student_name: studentName.trim(),
        assessor_name: assessorName.trim(),
        marking_sheet_id: selectedSheet.id,
        checklist_responses,
        total_items: selectedSheet.checklist_items?.length || 0,
        completed_items: Object.values(checklistResponses).filter(Boolean).length,
        completion_percentage:
          Math.round(
            (Object.values(checklistResponses).filter(Boolean).length / (selectedSheet.checklist_items?.length || 1)) *
              100 *
              100,
          ) / 100,
        total_score: scoreResult.totalScore,
        max_possible_score: scoreResult.maxPossibleScore,
        percentage_score: scoreResult.percentageScore,
        status: scoreResult.status,
        remarks: scoreResult.remarks,
      }

      const result = await submitAssessment(assessmentData)
      console.log("Assessment submitted successfully:", result)

      setSubmitStatus("success")

      // Reset form after successful submission
      setTimeout(() => {
        setStudentName("")
        setAssessorName("")
        setSelectedSheet(null)
        setChecklistResponses({})
        setSubmitStatus("idle")
      }, 3000)
    } catch (err) {
      setError("Failed to submit assessment. Please try again.")
      setSubmitStatus("error")
      console.error("Error submitting assessment:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const groupedItems =
    selectedSheet?.checklist_items?.reduce(
      (acc, item) => {
        const category = item.category || "General"
        if (!acc[category]) acc[category] = []
        acc[category].push(item)
        return acc
      },
      {} as Record<string, NonNullable<typeof selectedSheet.checklist_items>>,
    ) || {}

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading marking sheets...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="bg-blue-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-center">Student Assessment Form</CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {submitStatus === "success" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">Assessment submitted successfully!</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Marking Sheet Selection */}
              <div className="space-y-2">
                <Label htmlFor="marking-sheet" className="text-lg font-semibold">
                  Select Marking Sheet *
                </Label>
                <Select onValueChange={handleSheetSelection}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Choose a marking sheet..." />
                  </SelectTrigger>
                  <SelectContent>
                    {markingSheets.map((sheet) => (
                      <SelectItem key={sheet.id} value={sheet.id} className="py-3">
                        {sheet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Student and Assessor Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="student-name" className="text-lg font-semibold">
                    Student Name *
                  </Label>
                  <Input
                    id="student-name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter student name"
                    className="h-12 text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assessor-name" className="text-lg font-semibold">
                    Assessor Name *
                  </Label>
                  <Input
                    id="assessor-name"
                    value={assessorName}
                    onChange={(e) => setAssessorName(e.target.value)}
                    placeholder="Enter assessor name"
                    className="h-12 text-base"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Checklist Items */}
              {selectedSheet && (
                <div className="space-y-4">
                  <Separator />
                  <h3 className="text-xl font-semibold text-gray-800">Assessment Checklist: {selectedSheet.name}</h3>

                  <div className="space-y-6">
                    {Object.entries(groupedItems).map(([category, items]) => (
                      <div key={category} className="space-y-3">
                        <h4 className="text-lg font-medium text-blue-700 border-b border-blue-200 pb-1">{category}</h4>
                        <div className="grid gap-3">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                                item.is_critical ? "bg-red-50 border border-red-200" : "bg-gray-50"
                              }`}
                            >
                              <Checkbox
                                id={item.id}
                                checked={checklistResponses[item.id] || false}
                                onCheckedChange={(checked) => handleChecklistChange(item.id, checked as boolean)}
                                className="mt-1 h-5 w-5"
                              />
                              <div className="flex-1">
                                <Label
                                  htmlFor={item.id}
                                  className="text-base leading-relaxed cursor-pointer flex items-center gap-2"
                                >
                                  {item.text}
                                  <span className="text-sm font-medium text-blue-600">({item.points || 1} pts)</span>
                                  {item.is_critical && (
                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">CRITICAL</span>
                                  )}
                                </Label>
                                {item.is_critical && item.critical_condition && (
                                  <p className="text-xs text-red-600 mt-1">{item.critical_condition}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={!selectedSheet || !studentName.trim() || !assessorName.trim() || isSubmitting}
                  className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting Assessment...
                    </>
                  ) : (
                    "Submit Assessment"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
