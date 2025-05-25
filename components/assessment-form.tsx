"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  getMarkingSheets,
  submitAssessment,
  calculateAssessmentScore,
  verifyMarkingSheetPassword,
} from "@/lib/supabase"
import type { MarkingSheet, Assessment } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle, AlertCircle, FileText, User, Eye, Lock, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AssessmentForm() {
  const [markingSheets, setMarkingSheets] = useState<MarkingSheet[]>([])
  const [selectedSheet, setSelectedSheet] = useState<MarkingSheet | null>(null)
  const [isSheetUnlocked, setIsSheetUnlocked] = useState(false)
  const [sheetPassword, setSheetPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false)
  const [studentName, setStudentName] = useState("")
  const [assessorName, setAssessorName] = useState("")
  const [sectionName, setSectionName] = useState("")
  const [className, setClassName] = useState("")
  const [checklistResponses, setChecklistResponses] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "preview" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [assessmentResults, setAssessmentResults] = useState<any>(null)
  const [studentSignature, setStudentSignature] = useState("")
  const [assessorSignature, setAssessorSignature] = useState("")

  // Fetch marking sheets on component mount
  useEffect(() => {
    fetchMarkingSheets()
  }, [])

  const fetchMarkingSheets = async () => {
    try {
      setIsLoading(true)
      setError(null)
      // Only fetch enabled marking sheets for public use
      const sheets = await getMarkingSheets(false)
      console.log("Fetched enabled marking sheets:", sheets)
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
    console.log("Selected sheet:", sheet)
    setSelectedSheet(sheet || null)
    setIsSheetUnlocked(false)
    setSheetPassword("")
    setChecklistResponses({})
    setSubmitStatus("idle")
    setAssessmentResults(null)
    setStudentSignature("")
    setAssessorSignature("")
    setError(null)
  }

  const handlePasswordVerification = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSheet || !sheetPassword.trim()) {
      setError("Please enter the password")
      return
    }

    setIsVerifyingPassword(true)
    setError(null)

    try {
      const isValid = await verifyMarkingSheetPassword(selectedSheet.id, sheetPassword.trim())

      if (isValid) {
        setIsSheetUnlocked(true)
        setError(null)
      } else {
        setError("Incorrect password. Please contact your administrator for the correct password.")
      }
    } catch (err: any) {
      setError("Failed to verify password. Please try again.")
      console.error("Password verification error:", err)
    } finally {
      setIsVerifyingPassword(false)
    }
  }

  const handleChecklistChange = (itemId: string, checked: boolean) => {
    setChecklistResponses((prev) => {
      const updated = {
        ...prev,
        [itemId]: checked,
      }
      console.log("Updated checklist responses:", updated)
      return updated
    })
  }

  const handlePreviewResults = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSheet || !studentName.trim() || !assessorName.trim() || !sectionName.trim() || !className.trim()) {
      setError("Please fill in all required fields")
      return
    }

    setError(null)

    try {
      console.log("=== STARTING RESULTS CALCULATION ===")
      console.log("Selected sheet:", selectedSheet)
      console.log("Checklist items:", selectedSheet.checklist_items)
      console.log("Current checklist responses:", checklistResponses)
      console.log("Passing score:", selectedSheet.passing_score)

      const checklistItems = selectedSheet.checklist_items || []

      if (checklistItems.length === 0) {
        setError("No checklist items found for this marking sheet")
        return
      }

      // Calculate scoring with enhanced error handling
      let scoreResult
      try {
        scoreResult = calculateAssessmentScore(checklistItems, checklistResponses, selectedSheet.passing_score || 70)
        console.log("Score calculation result:", scoreResult)
      } catch (scoreError: any) {
        console.error("Error in calculateAssessmentScore:", scoreError)
        setError(`Score calculation failed: ${scoreError.message}`)
        return
      }

      const totalItems = checklistItems.length
      const completedItems = Object.values(checklistResponses).filter(Boolean).length
      const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

      console.log("Calculated stats:", { totalItems, completedItems, completionPercentage })

      // Create results object with proper variable references
      const results = {
        student_name: studentName.trim(),
        assessor_name: assessorName.trim(),
        section_name: sectionName.trim(),
        class_name: className.trim(),
        marking_sheet_name: selectedSheet.name,
        marking_sheet_id: selectedSheet.id,
        checklist_responses: { ...checklistResponses }, // Create a copy to avoid reference issues
        total_items: totalItems,
        completed_items: completedItems,
        completion_percentage: Math.round(completionPercentage * 100) / 100,
        total_score: scoreResult.totalScore,
        max_possible_score: scoreResult.maxPossibleScore,
        percentage_score: scoreResult.percentageScore,
        status: scoreResult.status,
        remarks: scoreResult.remarks,
        assessment_date: new Date().toLocaleDateString(),
      }

      console.log("Final results object:", results)
      console.log("Checklist responses in results:", results.checklist_responses)

      setAssessmentResults(results)
      setSubmitStatus("preview")
    } catch (err: any) {
      console.error("=== ERROR IN PREVIEW RESULTS ===", err)
      console.error("Error stack:", err.stack)
      setError(`Failed to calculate results: ${err.message || "Unknown error"}`)
    }
  }

  const handleFinalSubmit = async () => {
    if (!assessmentResults || !studentSignature.trim() || !assessorSignature.trim()) {
      setError("Both student and assessor signatures are required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      console.log("=== STARTING FINAL SUBMISSION ===")
      console.log("Assessment results:", assessmentResults)
      console.log("Checklist responses from results:", assessmentResults.checklist_responses)

      // Ensure we have valid checklist responses
      const validChecklistResponses = assessmentResults.checklist_responses || {}
      console.log("Valid checklist responses:", validChecklistResponses)

      const assessmentData: Omit<Assessment, "id" | "created_at" | "updated_at"> = {
        student_name: assessmentResults.student_name,
        assessor_name: assessmentResults.assessor_name,
        section_name: assessmentResults.section_name,
        class_name: assessmentResults.class_name,
        marking_sheet_id: assessmentResults.marking_sheet_id,
        checklist_responses: validChecklistResponses,
        total_items: assessmentResults.total_items,
        completed_items: assessmentResults.completed_items,
        completion_percentage: assessmentResults.completion_percentage,
        total_score: assessmentResults.total_score,
        max_possible_score: assessmentResults.max_possible_score,
        percentage_score: assessmentResults.percentage_score,
        status: assessmentResults.status,
        remarks: assessmentResults.remarks,
        // Mark as immediately acknowledged with both signatures
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: `Student: ${studentSignature.trim()} | Assessor: ${assessorSignature.trim()}`,
      }

      console.log("Final assessment data to submit:", assessmentData)

      const result = await submitAssessment(assessmentData)
      console.log("Assessment submitted successfully:", result)

      setSubmitStatus("success")

      // Reset form after successful submission
      setTimeout(() => {
        setStudentName("")
        setAssessorName("")
        setSectionName("")
        setClassName("")
        setSelectedSheet(null)
        setIsSheetUnlocked(false)
        setSheetPassword("")
        setChecklistResponses({})
        setAssessmentResults(null)
        setStudentSignature("")
        setAssessorSignature("")
        setSubmitStatus("idle")
      }, 3000)
    } catch (err: any) {
      console.error("=== ERROR IN FINAL SUBMISSION ===", err)
      console.error("Error stack:", err.stack)
      setError(`Failed to submit assessment: ${err.message || "Unknown error"}`)
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToEdit = () => {
    setSubmitStatus("idle")
    setAssessmentResults(null)
    setStudentSignature("")
    setAssessorSignature("")
    setError(null)
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

  // Results Preview Screen
  if (submitStatus === "preview" && assessmentResults) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardHeader className="text-center bg-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl">Assessment Results Preview</CardTitle>
              <p>Please show this to the student for review and signatures</p>
            </CardHeader>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
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
                  <p className="text-lg">{assessmentResults.student_name}</p>
                </div>
                <div>
                  <Label className="font-semibold">Section</Label>
                  <p className="text-lg">{assessmentResults.section_name}</p>
                </div>
                <div>
                  <Label className="font-semibold">Class</Label>
                  <p className="text-lg">{assessmentResults.class_name}</p>
                </div>
                <div>
                  <Label className="font-semibold">Assessor</Label>
                  <p className="text-lg">{assessmentResults.assessor_name}</p>
                </div>
                <div>
                  <Label className="font-semibold">Assessment Date</Label>
                  <p>{assessmentResults.assessment_date}</p>
                </div>
                <div>
                  <Label className="font-semibold">Marking Sheet</Label>
                  <p>{assessmentResults.marking_sheet_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Results */}
          <Card>
            <CardHeader>
              <CardTitle
                className={`flex items-center gap-2 ${
                  assessmentResults.status === "passed" ? "text-green-700" : "text-red-700"
                }`}
              >
                {assessmentResults.status === "passed" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                Assessment Result: {assessmentResults.status?.toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{assessmentResults.total_score}</div>
                  <div className="text-sm text-blue-600">Points Earned</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-700">{assessmentResults.max_possible_score}</div>
                  <div className="text-sm text-gray-600">Total Points</div>
                </div>
                <div
                  className={`text-center p-4 rounded-lg ${
                    assessmentResults.status === "passed" ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${
                      assessmentResults.status === "passed" ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {assessmentResults.percentage_score}%
                  </div>
                  <div
                    className={`text-sm ${assessmentResults.status === "passed" ? "text-green-600" : "text-red-600"}`}
                  >
                    Final Score
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="font-semibold">Remarks</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg">{assessmentResults.remarks}</p>
              </div>
            </CardContent>
          </Card>

          {/* Signatures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Acknowledgment Signatures
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student-signature">
                    Student Signature *
                    <span className="text-sm text-gray-500 block">
                      Student acknowledges reviewing the assessment results
                    </span>
                  </Label>
                  <Input
                    id="student-signature"
                    value={studentSignature}
                    onChange={(e) => setStudentSignature(e.target.value)}
                    placeholder="Student types full name here"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assessor-signature">
                    Assessor Signature *
                    <span className="text-sm text-gray-500 block">Assessor confirms the assessment results</span>
                  </Label>
                  <Input
                    id="assessor-signature"
                    value={assessorSignature}
                    onChange={(e) => setAssessorSignature(e.target.value)}
                    placeholder="Assessor types full name here"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={handleBackToEdit} className="flex-1">
              Back to Edit Assessment
            </Button>
            <Button
              onClick={handleFinalSubmit}
              disabled={!studentSignature.trim() || !assessorSignature.trim() || isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Assessment"
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Password verification screen for selected marking sheet
  if (selectedSheet && !isSheetUnlocked) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-md mx-auto mt-20">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Access Required</CardTitle>
              <p className="text-sm text-gray-600">
                "{selectedSheet.name}" is password protected. Please enter the access password.
              </p>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handlePasswordVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sheet-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="sheet-password"
                      type={showPassword ? "text" : "password"}
                      value={sheetPassword}
                      onChange={(e) => setSheetPassword(e.target.value)}
                      placeholder="Enter marking sheet password"
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

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedSheet(null)
                      setSheetPassword("")
                      setError(null)
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isVerifyingPassword} className="flex-1">
                    {isVerifyingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Access"
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

  // Main Assessment Form
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

            <form onSubmit={handlePreviewResults} className="space-y-6">
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
                    {markingSheets.length === 0 ? (
                      <SelectItem value="no-sheets" disabled>
                        No marking sheets available
                      </SelectItem>
                    ) : (
                      markingSheets.map((sheet) => (
                        <SelectItem key={sheet.id} value={sheet.id} className="py-3">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-gray-400" />
                            {sheet.name}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {markingSheets.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No marking sheets are currently available. Please contact your administrator.
                  </p>
                )}
              </div>

              {/* Only show the rest of the form if a sheet is selected and unlocked */}
              {selectedSheet && isSheetUnlocked && (
                <>
                  {/* Student Information */}
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

                  {/* Section and Class Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="section-name" className="text-lg font-semibold">
                        Section *
                      </Label>
                      <Input
                        id="section-name"
                        value={sectionName}
                        onChange={(e) => setSectionName(e.target.value)}
                        placeholder="e.g., Section A, Rose, etc."
                        className="h-12 text-base"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="class-name" className="text-lg font-semibold">
                        Class/Grade *
                      </Label>
                      <Input
                        id="class-name"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        placeholder="e.g., Grade 5, Year 10, etc."
                        className="h-12 text-base"
                        required
                      />
                    </div>
                  </div>

                  {/* Dynamic Checklist Items */}
                  <div className="space-y-4">
                    <Separator />
                    <h3 className="text-xl font-semibold text-gray-800">Assessment Checklist: {selectedSheet.name}</h3>

                    <div className="space-y-6">
                      {Object.entries(groupedItems).map(([category, items]) => (
                        <div key={category} className="space-y-3">
                          <h4 className="text-lg font-medium text-blue-700 border-b border-blue-200 pb-1">
                            {category}
                          </h4>
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
                                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                        CRITICAL
                                      </span>
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

                  {/* Preview Results Button */}
                  <div className="pt-6">
                    <Button
                      type="submit"
                      disabled={
                        !selectedSheet ||
                        !studentName.trim() ||
                        !assessorName.trim() ||
                        !sectionName.trim() ||
                        !className.trim()
                      }
                      className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Eye className="mr-2 h-5 w-5" />
                      Preview Results & Get Signatures
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
