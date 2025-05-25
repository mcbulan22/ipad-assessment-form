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
  marking_sheets?: { name: string; passing_score?: number }
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
  try {
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
  } catch (err) {
    console.error("Error in getMarkingSheets:", err)
    throw err
  }
}

export async function getChecklistItems(markingSheetId: string): Promise<ChecklistItem[]> {
  try {
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
  } catch (err) {
    console.error("Error in getChecklistItems:", err)
    throw err
  }
}

export async function submitAssessment(
  assessment: Omit<Assessment, "id" | "created_at" | "updated_at">,
): Promise<Assessment> {
  try {
    // Ensure we have the minimum required fields
    if (!assessment.student_name || !assessment.assessor_name || !assessment.marking_sheet_id) {
      throw new Error("Missing required fields: student_name, assessor_name, or marking_sheet_id")
    }

    // Create a clean assessment object
    const cleanAssessment = {
      student_name: assessment.student_name.trim(),
      assessor_name: assessment.assessor_name.trim(),
      marking_sheet_id: assessment.marking_sheet_id,
      checklist_responses: assessment.checklist_responses || {},
      total_items: assessment.total_items || 0,
      completed_items: assessment.completed_items || 0,
      completion_percentage: assessment.completion_percentage || 0,
      ...(assessment.total_score !== undefined && { total_score: assessment.total_score }),
      ...(assessment.max_possible_score !== undefined && { max_possible_score: assessment.max_possible_score }),
      ...(assessment.percentage_score !== undefined && { percentage_score: assessment.percentage_score }),
      ...(assessment.status && { status: assessment.status }),
      ...(assessment.remarks && { remarks: assessment.remarks }),
    }

    console.log("Submitting assessment with data:", cleanAssessment)

    const { data, error } = await supabase.from("assessments").insert([cleanAssessment]).select().single()

    if (error) {
      console.error("Supabase error details:", error)
      console.error("Error code:", error.code)
      console.error("Error message:", error.message)
      console.error("Error details:", error.details)
      throw error
    }

    console.log("Assessment submitted successfully:", data)
    return data
  } catch (err) {
    console.error("Error in submitAssessment:", err)
    throw err
  }
}

// Enhanced admin functions for marking sheets
export async function createMarkingSheet(data: {
  name: string
  description?: string
  passing_score?: number
  checklist_items: Array<{
    text: string
    category?: string
    order_index: number
    points?: number
    is_critical?: boolean
    critical_condition?: string
  }>
}): Promise<MarkingSheet> {
  try {
    const totalPoints = data.checklist_items.reduce((sum, item) => sum + (item.points || 1), 0)

    // Create the marking sheet with only basic fields first
    const sheetData = {
      name: data.name,
      description: data.description || null,
      ...(data.passing_score !== undefined && { passing_score: data.passing_score }),
      total_points: totalPoints,
    }

    console.log("Creating marking sheet with data:", sheetData)

    const { data: sheet, error: sheetError } = await supabase
      .from("marking_sheets")
      .insert([sheetData])
      .select()
      .single()

    if (sheetError) {
      console.error("Error creating marking sheet:", sheetError)
      throw sheetError
    }

    // Insert checklist items
    const itemsToInsert = data.checklist_items.map((item) => ({
      text: item.text,
      category: item.category || null,
      order_index: item.order_index,
      marking_sheet_id: sheet.id,
      ...(item.points !== undefined && { points: item.points }),
      ...(item.is_critical !== undefined && { is_critical: item.is_critical }),
      ...(item.critical_condition && { critical_condition: item.critical_condition }),
    }))

    const { error: itemsError } = await supabase.from("checklist_items").insert(itemsToInsert)

    if (itemsError) {
      console.error("Error creating checklist items:", itemsError)
      throw itemsError
    }

    return sheet
  } catch (err) {
    console.error("Error in createMarkingSheet:", err)
    throw err
  }
}

export async function updateMarkingSheet(
  id: string,
  data: {
    name: string
    description?: string
    passing_score?: number
    checklist_items: Array<{
      id?: string
      text: string
      category?: string
      order_index: number
      points?: number
      is_critical?: boolean
      critical_condition?: string
    }>
  },
): Promise<MarkingSheet> {
  try {
    const totalPoints = data.checklist_items.reduce((sum, item) => sum + (item.points || 1), 0)

    const updateData = {
      name: data.name,
      description: data.description || null,
      total_points: totalPoints,
      ...(data.passing_score !== undefined && { passing_score: data.passing_score }),
    }

    const { data: sheet, error: sheetError } = await supabase
      .from("marking_sheets")
      .update(updateData)
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
      category: item.category || null,
      order_index: item.order_index,
      marking_sheet_id: id,
      ...(item.points !== undefined && { points: item.points }),
      ...(item.is_critical !== undefined && { is_critical: item.is_critical }),
      ...(item.critical_condition && { critical_condition: item.critical_condition }),
    }))

    const { error: itemsError } = await supabase.from("checklist_items").insert(itemsToInsert)

    if (itemsError) {
      console.error("Error updating checklist items:", itemsError)
      throw itemsError
    }

    return sheet
  } catch (err) {
    console.error("Error in updateMarkingSheet:", err)
    throw err
  }
}

export async function deleteMarkingSheet(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("marking_sheets").delete().eq("id", id)

    if (error) {
      console.error("Error deleting marking sheet:", error)
      throw error
    }
  } catch (err) {
    console.error("Error in deleteMarkingSheet:", err)
    throw err
  }
}

// Enhanced assessment functions
export async function getAssessments(filters?: {
  markingSheetId?: string
  startDate?: string
  endDate?: string
  status?: string
}): Promise<Assessment[]> {
  try {
    let query = supabase
      .from("assessments")
      .select(`
        *,
        marking_sheets (name)
      `)
      .order("created_at", { ascending: false })

    if (filters?.markingSheetId && filters.markingSheetId !== "all") {
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
  } catch (err) {
    console.error("Error in getAssessments:", err)
    throw err
  }
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  try {
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
  } catch (err) {
    console.error("Error in getAssessmentById:", err)
    throw err
  }
}

export async function acknowledgeAssessment(
  assessmentId: string,
  acknowledgmentData: Omit<AssessmentAcknowledgment, "id" | "acknowledgment_date">,
): Promise<void> {
  try {
    // Insert acknowledgment record
    const { error: ackError } = await supabase.from("assessment_acknowledgments").insert([acknowledgmentData])

    if (ackError) {
      console.error("Error creating acknowledgment:", ackError)
      throw ackError
    }

    // Update assessment with acknowledgment info
    const updateData = {
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: acknowledgmentData.student_signature,
    }

    const { error: updateError } = await supabase.from("assessments").update(updateData).eq("id", assessmentId)

    if (updateError) {
      console.error("Error updating assessment acknowledgment:", updateError)
      throw updateError
    }
  } catch (err) {
    console.error("Error in acknowledgeAssessment:", err)
    throw err
  }
}

// Scoring calculation function
export function calculateAssessmentScore(
  checklistItems: ChecklistItem[],
  responses: Record<string, boolean>,
  passingScore = 70,
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

// Auth functions
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Error signing in:", error)
      throw error
    }

    return data
  } catch (err) {
    console.error("Error in signIn:", err)
    throw err
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Error signing out:", error)
      throw error
    }
  } catch (err) {
    console.error("Error in signOut:", err)
    throw err
  }
}

export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting current user:", error)
      throw error
    }

    return user
  } catch (err) {
    console.error("Error in getCurrentUser:", err)
    throw err
  }
}
