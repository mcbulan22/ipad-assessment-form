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

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<any[]>([])
  const [markingSheets, setMarkingSheets] = useState<MarkingSheet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    markingSheetId: "",
    startDate: "",
    endDate: "",
  })
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (markingSheets.length > 0) {
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

  const fetchAssessments = async () => {
    try {
      setIsLoading(true)
      const data = await getAssessments(
        filters.markingSheetId || filters.startDate || filters.endDate ? filters : undefined,
      )
      setAssessments(data)
    } catch (err: any) {
      setError(err.message || "Failed to fetch assessments")
    } finally {
      setIsLoading(false)
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
    ]
    const csvData = assessments.map((assessment) => [
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
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Marking Sheet</Label>
                <Select
                  value={filters.markingSheetId}
                  onValueChange={(value) => setFilters({ ...filters, markingSheetId: value })}
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

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((assessment) => (
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
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const url = `${window.location.origin}/acknowledge/${assessment.id}`
                              navigator.clipboard.writeText(url)
                              alert("Acknowledgment link copied to clipboard!")
                            }}
                          >
                            Copy Link
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
