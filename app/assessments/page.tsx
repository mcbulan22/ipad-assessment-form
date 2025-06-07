"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getAssessments, getMarkingSheets, getCurrentUser } from "@/lib/supabase"
import type { MarkingSheet } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, ArrowLeft, Filter } from "lucide-react"
import Link from "next/link"

function parseSignatures(acknowledgedBy: string | null | undefined) {
  if (!acknowledgedBy) return { studentSignature: null, assessorSignature: null };

  // Try splitting by ' | ' or ' = | ' (depending on actual separator)
  // You can adjust if needed
  const parts = acknowledgedBy.split(' | ');

  let studentSignature: string | null = null;
  let assessorSignature: string | null = null;

  parts.forEach((part) => {
    part = part.trim();

    if (part.startsWith('Student:')) {
      // Remove label and trim
      studentSignature = part.replace('Student:', '').trim();
    } else if (part.startsWith('Assessor:')) {
      assessorSignature = part.replace('Assessor:', '').trim();
    }
  });

  // Optional: double-check they start with data:image/png;base64,
  if (studentSignature && !studentSignature.startsWith('data:image/png;base64,')) {
    studentSignature = null;
  }
  if (assessorSignature && !assessorSignature.startsWith('data:image/png;base64,')) {
    assessorSignature = null;
  }

  return { studentSignature, assessorSignature };
}


export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<any[]>([])
  const [markingSheets, setMarkingSheets] = useState<MarkingSheet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    assessorName: "",
    studentName: "",
    markingSheetId: "",
    startDate: "",
  })

  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const fetchAssessments = async () => {
    try {
      setIsLoading(true)

      console.log("Filters being used:", filters)

      const hasAnyFilter = Object.values(filters).some(val => val && val.trim() !== "")
      const data = await getAssessments(hasAnyFilter ? filters : undefined)

      setAssessments(data)
    } catch (err: any) {
      setError(err.message || "Failed to fetch assessments")
    } finally {
      setIsLoading(false)
    }
  }


  useEffect(() => {
    if (markingSheets.length > 0) {
      console.log("Filters changed:", filters)
      fetchAssessments()
    }
  }, [filters, markingSheets])


  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      await fetchMarkingSheets()
    } catch (err) {
      router.push("/login")
    }
  }

  const fetchMarkingSheets = async () => {
    try {
      const sheets = await getMarkingSheets()
      setMarkingSheets(sheets)
    } catch (err: any) {
      setError(err.message || "Failed to fetch marking sheets")
    }
  }


  const exportToCSV = () => {
    const headers = [
      "Student Name",
      "Assessor",
      "Marking Sheet",
      "Date",
      "Score",
      "Max Score",
      "Percentage",
      "Status",
      "Remarks",
      "Acknowledged",
      "Student Signature URL",
      "Assessor Signature URL",
    ]

    const csvData = assessments.map((assessment) => {
      const { studentSignature, assessorSignature } = parseSignatures(assessment.acknowledged_by)

      return [
        assessment.student_name,
        assessment.assessor_name,
        assessment.marking_sheets?.name || "Unknown",
        new Date(assessment.created_at).toLocaleDateString(),
        assessment.total_score || 0,
        assessment.max_possible_score || 0,
        `${assessment.percentage_score || 0}%`,
        assessment.status || "pending",
        assessment.remarks || "",
        assessment.acknowledged_at ? "Yes" : "No",
        studentSignature || "No Signature",
        assessorSignature || "No Signature",
      ]
    })

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `assessments-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }


  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Assessment Summary</h1>
          </div>
          <Button onClick={exportToCSV} disabled={assessments.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              {/* Student Name */}
              <div className="space-y-2">
                <Label>Student Name</Label>
                <Input
                  type="text"
                  value={filters.studentName}
                  onChange={(e) => setFilters({ ...filters, studentName: e.target.value })}
                  placeholder="e.g. Juan Dela Cruz"
                />
              </div>

              {/* Assessor Name */}
              <div className="space-y-2">
                <Label>Assessor Name</Label>
                <Input
                  type="text"
                  value={filters.assessorName}
                  onChange={(e) => setFilters({ ...filters, assessorName: e.target.value })}
                  placeholder="e.g. Marlon Bulan"
                />
              </div>

              {/* Marking Sheet */}
              <div className="space-y-2">
                <Label>Marking Sheet</Label>
                <Select
                  value={filters.markingSheetId}
                  onValueChange={(value) =>
                    setFilters({ ...filters, markingSheetId: value === "all" ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All marking sheets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All marking sheets</SelectItem>
                    {markingSheets.map((sheet) => (
                      <SelectItem key={sheet.id} value={sheet.id}>
                        {sheet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4 text-right">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({
                    assessorName: "",
                    studentName: "",
                    markingSheetId: "",
                    startDate: "",
                  })
                }
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>


        {/* Assessments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Assessments ({assessments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading assessments...</div>
            ) : assessments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No assessments found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Assessor</TableHead>
                      <TableHead>Marking Sheet</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Acknowledged</TableHead>
                      <TableHead>Student Signature</TableHead>
                      <TableHead>Assessor Signature</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((assessment) => {
                      const { studentSignature, assessorSignature } = parseSignatures(assessment.acknowledged_by);

                      console.log('Assessment', assessment.id, {
                        studentSignature,
                        assessorSignature,
                      });

                        return (
                          <TableRow key={assessment.id}>
                            <TableCell className="font-medium">{assessment.student_name}</TableCell>
                            <TableCell>{assessment.assessor_name}</TableCell>
                            <TableCell>{assessment.marking_sheets?.name || "Unknown"}</TableCell>
                            <TableCell>{new Date(assessment.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>
                                  {assessment.total_score}/{assessment.max_possible_score}
                                </div>
                                <div className="text-gray-500">({assessment.percentage_score}%)</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded text-sm font-medium ${
                                  assessment.status === "passed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}
                              >
                                {assessment.status?.toUpperCase()}
                              </span>
                            </TableCell>
                            <TableCell>
                              {assessment.acknowledged_at ? (
                                <span className="text-green-600 text-sm">✓ Acknowledged</span>
                              ) : (
                                <span className="text-gray-500 text-sm">Pending</span>
                              )}
                            </TableCell>

                            {/* New columns for signatures */}
                            <TableCell>
                              {studentSignature ? (
                                <img
                                  src={studentSignature}
                                  alt="Student Signature"
                                  style={{ width: 120, height: 60, objectFit: 'contain', border: '1px solid #ccc', borderRadius: 4 }}
                                />
                              ) : (
                                <span className="text-gray-400 text-sm">No Signature</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {assessorSignature ? (
                                <img
                                  src={assessorSignature}
                                  alt="Assessor Signature"
                                  style={{ width: 120, height: 60, objectFit: 'contain', border: '1px solid #ccc', borderRadius: 4 }}
                                />
                              ) : (
                                <span className="text-gray-400 text-sm">No Signature</span>
                              )}
                            </TableCell>
                          </TableRow>
                          )
                        })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
