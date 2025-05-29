import { createClient } from "@/utils/supabase/client"

const supabase = createClient()

// Enhanced database types
export type MarkingSheet = {
  id: string
  name: string
  description?: string
  passing_score?: number
  total_points?: number
  password?: string
  is_enabled?: boolean
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
  checklist_responses?: Record<string, boolean>
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
  student_signature_image?: string  // base64 string or image URL
  assessor_signature_image?: string
  acknowledgment_date?: string
  ip_address?: string
  user_agent?: string
}

// Database functions
export async function getMarkingSheets(includeDisabled = false): Promise<MarkingSheet[]> {
  let query = supabase
    .from("marking_sheets")
    .select(`
      *,
      checklist_items (*)
    `)
    .order("created_at", { ascending: false })

  // Only include enabled marking sheets for public access
  if (!includeDisabled) {
    query = query.eq("is_enabled", true)
  }

  const { data, error } = await query

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
  try {
    console.log("=== SUBMITTING ASSESSMENT ===")
    console.log("Assessment data:", assessment)

    // Create a clean assessment object with only the basic required fields
    const basicAssessment = {
      student_name: assessment.student_name,
      assessor_name: assessment.assessor_name,
      marking_sheet_id: assessment.marking_sheet_id,
    }

    // Add optional fields only if they exist and are valid
    const optionalFields: any = {}

    if (assessment.checklist_responses && typeof assessment.checklist_responses === "object") {
      optionalFields.checklist_responses = assessment.checklist_responses
    }

    if (typeof assessment.total_items === "number") {
      optionalFields.total_items = assessment.total_items
    }

    if (typeof assessment.completed_items === "number") {
      optionalFields.completed_items = assessment.completed_items
    }

    if (typeof assessment.completion_percentage === "number") {
      optionalFields.completion_percentage = assessment.completion_percentage
    }

    if (typeof assessment.total_score === "number") {
      optionalFields.total_score = assessment.total_score
    }

    if (typeof assessment.max_possible_score === "number") {
      optionalFields.max_possible_score = assessment.max_possible_score
    }

    if (typeof assessment.percentage_score === "number") {
      optionalFields.percentage_score = assessment.percentage_score
    }

    if (assessment.status) {
      optionalFields.status = assessment.status
    }

    if (assessment.remarks) {
      optionalFields.remarks = assessment.remarks
    }

    if (assessment.acknowledged_at) {
      optionalFields.acknowledged_at = assessment.acknowledged_at
    }

    if (assessment.acknowledged_by) {
      optionalFields.acknowledged_by = assessment.acknowledged_by
    }

    const finalAssessment = { ...basicAssessment, ...optionalFields }
    console.log("Final assessment to submit:", finalAssessment)

    const { data, error } = await supabase.from("assessments").insert([finalAssessment]).select().single()

    if (error) {
      console.error("Supabase error:", error)
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
  passing_score: number
  password: string
  is_enabled: boolean
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
        password: data.password,
        is_enabled: data.is_enabled,
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
    password: string
    is_enabled: boolean
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
      password: data.password,
      is_enabled: data.is_enabled,
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
  status?: string
  assessorName?: string
  studentName?: string
}): Promise<Assessment[]> {
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

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.assessorName) {
    query = query.ilike("assessor_name", `%${filters.assessorName.trim()}%`)
  }

  if (filters?.studentName) {
    query = query.ilike("student_name", `%${filters.studentName.trim()}%`)
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

// Enhanced scoring calculation function with better error handling
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
  try {
    console.log("=== CALCULATE ASSESSMENT SCORE ===")
    console.log("Checklist items:", checklistItems)
    console.log("Responses:", responses)
    console.log("Passing score:", passingScore)

    // Validate inputs
    if (!Array.isArray(checklistItems)) {
      throw new Error("checklistItems must be an array")
    }

    if (!responses || typeof responses !== "object") {
      console.log("No responses provided, using empty object")
      responses = {}
    }

    if (typeof passingScore !== "number" || passingScore < 0 || passingScore > 100) {
      console.log("Invalid passing score, using default 70")
      passingScore = 70
    }

    let totalScore = 0
    let maxPossibleScore = 0
    let hasCriticalFailure = false
    const criticalFailures: string[] = []

    checklistItems.forEach((item, index) => {
      console.log(`Processing item ${index}:`, item)

      // Ensure item has required properties
      if (!item || typeof item !== "object") {
        console.warn(`Item ${index} is not a valid object:`, item)
        return
      }

      if (!item.id) {
        console.warn(`Item ${index} missing id:`, item)
        return
      }

      const points = Number(item.points) || 1
      maxPossibleScore += points

      console.log(`Item ${item.id}: points=${points}, checked=${!!responses[item.id]}, critical=${!!item.is_critical}`)

      if (responses[item.id]) {
        totalScore += points
      } else if (item.is_critical) {
        hasCriticalFailure = true
        criticalFailures.push(item.text || `Item ${item.id}`)
      }
    })

    console.log("Calculation results:", { totalScore, maxPossibleScore, hasCriticalFailure, criticalFailures })

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

    const result = {
      totalScore,
      maxPossibleScore,
      percentageScore: Math.round(percentageScore * 100) / 100,
      status,
      remarks,
    }

    console.log("Final calculation result:", result)
    return result
  } catch (error) {
    console.error("Error in calculateAssessmentScore:", error)
    throw new Error(`Score calculation failed: ${error.message}`)
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

export async function verifyMarkingSheetPassword(markingSheetId: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.from("marking_sheets").select("password").eq("id", markingSheetId).single()

  if (error) {
    console.error("Error verifying password:", error)
    throw error
  }

  return data?.password === password
}
