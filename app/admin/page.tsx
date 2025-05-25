"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  getMarkingSheets,
  createMarkingSheet,
  updateMarkingSheet,
  deleteMarkingSheet,
  getCurrentUser,
  signOut,
} from "@/lib/supabase"
import type { MarkingSheet } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import EnhancedMarkingSheetForm from "@/components/admin/enhanced-marking-sheet-form"
import { Plus, Edit, Trash2, LogOut, FileText, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const [markingSheets, setMarkingSheets] = useState<MarkingSheet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingSheet, setEditingSheet] = useState<MarkingSheet | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }
      setUser(currentUser)
      fetchMarkingSheets()
    } catch (err) {
      router.push("/login")
    }
  }

  const fetchMarkingSheets = async () => {
    try {
      setIsLoading(true)
      const sheets = await getMarkingSheets(true) // Include disabled sheets for admin
      setMarkingSheets(sheets)
    } catch (err: any) {
      setError(err.message || "Failed to fetch marking sheets")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSheet = async (data: any) => {
    try {
      setIsSubmitting(true)
      await createMarkingSheet(data)
      await fetchMarkingSheets()
      setShowForm(false)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to create marking sheet")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateSheet = async (data: any) => {
    if (!editingSheet) return

    try {
      setIsSubmitting(true)
      await updateMarkingSheet(editingSheet.id, data)
      await fetchMarkingSheets()
      setEditingSheet(null)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to update marking sheet")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSheet = async (id: string) => {
    if (!confirm("Are you sure you want to delete this marking sheet?")) return

    try {
      await deleteMarkingSheet(id)
      await fetchMarkingSheets()
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to delete marking sheet")
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (err: any) {
      setError(err.message || "Failed to sign out")
    }
  }

  if (showForm || editingSheet) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <EnhancedMarkingSheetForm
          initialData={editingSheet || undefined}
          onSubmit={editingSheet ? handleUpdateSheet : handleCreateSheet}
          onCancel={() => {
            setShowForm(false)
            setEditingSheet(null)
          }}
          isLoading={isSubmitting}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link href="/assessments">
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Assessments
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Assessment Form
              </Button>
            </Link>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Create Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Marking Sheets</h2>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Sheet
          </Button>
        </div>

        {/* Marking Sheets List */}
        {isLoading ? (
          <div className="text-center py-8">Loading marking sheets...</div>
        ) : (
          <div className="grid gap-4">
            {markingSheets.map((sheet) => (
              <Card key={sheet.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle>{sheet.name}</CardTitle>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          sheet.is_enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {sheet.is_enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingSheet(sheet)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteSheet(sheet.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-2">{sheet.description}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">{sheet.checklist_items?.length || 0} checklist items</p>
                    <p className="text-sm text-gray-500">Password protected</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
