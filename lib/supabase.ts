import { createClient } from "@/utils/supabase/client"

const supabase = createClient()

// Enhanced database types
export type MarkingSheet = {
  id: string
  name: string
  description?: string
  passing_score?: number
  total_points?: number
  created_at?: string
  checklist_items?: ChecklistItem[]
}

export type ChecklistItem = {
  id: string
  marking_sheet_id: string
  text: string
  category?: string
  order_index?: number
  points?: number
  is_critical?: boolean
  critical_condition?: string
  created_at?: string
}

export type Assessment = {
  id?: string
  student_name: string
  assessor_name: string
  marking_sheet_id: string
  checklist_responses: Record<string, boolean>
  total_items?: number
  completed_items?: number
  completion_percentage?: number
  total_score?: number
  max_possible_score?: number
  percentage_score?: number
  status?: "pending" | "passed" | "failed"
  remarks?: string
  acknowledged_at?: string
  acknowledged_by?: string
  created_at?: string
  updated_at?: string
  marking_sheets?: { name: string }
}

export type AssessmentAcknowledgment = {
  id?: string
  assessment_id: string
  student_signature: string
  acknowledgment_date?: string
  ip_address?: string
  user_agent?: string
}

// Database functions
export async function getMarkingSheets(): Promise<MarkingSheet[]> {
  const { data, error } = await supabase
    .from("marking_sheets")
    .select(`
      *,
      checklist_items (*)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching marking sheets:", error)
    throw error
  }

  return data || []
}

export async function getChecklistItems(markingSheetId: string): Promise<ChecklistItem[]> {
  const { data, error } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("marking_sheet_id", markingSheetId)
    .order("order_index", { ascending: true })

  if (error) {
    console.error("Error fetching checklist items:", error)
    throw error
  }

  return data || []
}

export async function submitAssessment(
  assessment: Omit<Assessment, "id" | "created_at" | "updated_at">,
): Promise<Assessment> {
  const { data, error } = await supabase.from("assessments").insert([assessment]).select().single()

  if (error) {
    console.error("Error submitting assessment:", error)
    throw error
  }

  return data
}

// Enhanced admin functions for marking sheets
export async function createMarkingSheet(data: {
  name: string
  description?: string
  passing_score: number
  checklist_items: Array<{
    text: string
    category?: string
    order_index: number
    points: number
    is_critical: boolean
    critical_condition?: string
  }>
}): Promise<MarkingSheet> {
  const totalPoints = data.checklist_items.reduce((sum, item) => sum + item.points, 0)

  const { data: sheet, error: sheetError } = await supabase
    .from("marking_sheets")
    .insert([
      {
        name: data.name,
        description: data.description,
        passing_score: data.passing_score,
        total_points: totalPoints,
      },
    ])
    .select()
    .single()

  if (sheetError) {
    console.error("Error creating marking sheet:", sheetError)
    throw sheetError
  }

  // Insert checklist items
  const itemsToInsert = data.checklist_items.map((item) => ({
    ...item,
    marking_sheet_id: sheet.id,
  }))

  const { error: itemsError } = await supabase.from("checklist_items").insert(itemsToInsert)

  if (itemsError) {
    console.error("Error creating checklist items:", itemsError)
    throw itemsError
  }

  return sheet
}

export async function updateMarkingSheet(
  id: string,
  data: {
    name: string
    description?: string
    passing_score: number
    checklist_items: Array<{
      id?: string
      text: string
      category?: string
      order_index: number
      points: number
      is_critical: boolean
      critical_condition?: string
    }>
  },
): Promise<MarkingSheet> {
  const totalPoints = data.checklist_items.reduce((sum, item) => sum + item.points, 0)

  const { data: sheet, error: sheetError } = await supabase
    .from("marking_sheets")
    .update({
      name: data.name,
      description: data.description,
      passing_score: data.passing_score,
      total_points: totalPoints,
    })
    .eq("id", id)
    .select()
    .single()

  if (sheetError) {
    console.error("Error updating marking sheet:", sheetError)
    throw sheetError
  }

  // Delete existing items and insert new ones
  await supabase.from("checklist_items").delete().eq("marking_sheet_id", id)

  const itemsToInsert = data.checklist_items.map((item) => ({
    text: item.text,
    category: item.category,
    order_index: item.order_index,
    points: item.points,
    is_critical: item.is_critical,
    critical_condition: item.critical_condition,
    marking_sheet_id: id,
  }))

  const { error: itemsError } = await supabase.from("checklist_items").insert(itemsToInsert)

  if (itemsError) {
    console.error("Error updating checklist items:", itemsError)
    throw itemsError
  }

  return sheet
}

export async function deleteMarkingSheet(id: string): Promise<void> {
  const { error } = await supabase.from("marking_sheets").delete().eq("id", id)

  if (error) {
    console.error("Error deleting marking sheet:", error)
    throw error
  }
}

// Enhanced assessment functions
export async function getAssessments(filters?: {
  markingSheetId?: string
  startDate?: string
  endDate?: string
  status?: string
}): Promise<Assessment[]> {
  let query = supabase
    .from("assessments")
    .select(`
      *,
      marking_sheets (name)
    `)
    .order("created_at", { ascending: false })

  if (filters?.markingSheetId) {
    query = query.eq("marking_sheet_id", filters.markingSheetId)
  }

  if (filters?.startDate) {
    query = query.gte("created_at", filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte("created_at", filters.endDate)
  }

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching assessments:", error)
    throw error
  }

  return data || []
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  const { data, error } = await supabase
    .from("assessments")
    .select(`
      *,
      marking_sheets (name, passing_score)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching assessment:", error)
    throw error
  }

  return data
}

export async function acknowledgeAssessment(
  assessmentId: string,
  acknowledgmentData: Omit<AssessmentAcknowledgment, "id" | "acknowledgment_date">,
): Promise<void> {
  // Insert acknowledgment record
  const { error: ackError } = await supabase.from("assessment_acknowledgments").insert([acknowledgmentData])

  if (ackError) {
    console.error("Error creating acknowledgment:", ackError)
    throw ackError
  }

  // Update assessment with acknowledgment info
  const { error: updateError } = await supabase
    .from("assessments")
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: acknowledgmentData.student_signature,
    })
    .eq("id", assessmentId)

  if (updateError) {
    console.error("Error updating assessment acknowledgment:", updateError)
    throw updateError
  }
}

// Scoring calculation function
export function calculateAssessmentScore(
  checklistItems: ChecklistItem[],
  responses: Record<string, boolean>,
  passingScore: number,
): {
  totalScore: number
  maxPossibleScore: number
  percentageScore: number
  status: "passed" | "failed"
  remarks: string
} {
  let totalScore = 0
  let maxPossibleScore = 0
  let hasCriticalFailure = false
  const criticalFailures: string[] = []

  checklistItems.forEach((item) => {
    const points = item.points || 1
    maxPossibleScore += points

    if (responses[item.id]) {
      totalScore += points
    } else if (item.is_critical) {
      hasCriticalFailure = true
      criticalFailures.push(item.text)
    }
  })

  const percentageScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0

  let status: "passed" | "failed" = "failed"
  let remarks = ""

  if (hasCriticalFailure) {
    status = "failed"
    remarks = `Critical failure: ${criticalFailures.join(", ")}`
  } else if (percentageScore >= passingScore) {
    status = "passed"
    remarks = `Excellent performance! Score: ${percentageScore.toFixed(1)}%`
  } else {
    status = "failed"
    remarks = `Below passing score. Required: ${passingScore}%, Achieved: ${percentageScore.toFixed(1)}%`
  }

  return {
    totalScore,
    maxPossibleScore,
    percentageScore: Math.round(percentageScore * 100) / 100,
    status,
    remarks,
  }
}

// Auth functions (unchanged)
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Error signing in:", error)
    throw error
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error("Error getting current user:", error)
    throw error
  }

  return user
}
