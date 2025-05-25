"use client"

import type React from "react"

import { useState } from "react"
import type { MarkingSheet } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, AlertTriangle } from "lucide-react"

interface ChecklistItemForm {
  text: string
  category: string
  order_index: number
  points: number
  is_critical: boolean
  critical_condition: string
}

interface EnhancedMarkingSheetFormProps {
  initialData?: MarkingSheet
  onSubmit: (data: {
    name: string
    description?: string
    passing_score: number
    password?: string
    is_enabled?: boolean
    checklist_items: ChecklistItemForm[]
  }) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export default function EnhancedMarkingSheetForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: EnhancedMarkingSheetFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [passingScore, setPassingScore] = useState(initialData?.passing_score || 70)
  const [password, setPassword] = useState(initialData?.password || "assess2024")
  const [isEnabled, setIsEnabled] = useState(initialData?.is_enabled ?? true)
  const [checklistItems, setChecklistItems] = useState<ChecklistItemForm[]>(
    initialData?.checklist_items?.map((item, index) => ({
      text: item.text,
      category: item.category || "",
      order_index: index + 1,
      points: item.points || 1,
      is_critical: item.is_critical || false,
      critical_condition: item.critical_condition || "",
    })) || [
      {
        text: "",
        category: "",
        order_index: 1,
        points: 1,
        is_critical: false,
        critical_condition: "",
      },
    ],
  )

  const addChecklistItem = () => {
    setChecklistItems([
      ...checklistItems,
      {
        text: "",
        category: "",
        order_index: checklistItems.length + 1,
        points: 1,
        is_critical: false,
        critical_condition: "",
      },
    ])
  }

  const removeChecklistItem = (index: number) => {
    const newItems = checklistItems.filter((_, i) => i !== index)
    setChecklistItems(newItems.map((item, i) => ({ ...item, order_index: i + 1 })))
  }

  const updateChecklistItem = (index: number, field: keyof ChecklistItemForm, value: string | number | boolean) => {
    const newItems = [...checklistItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setChecklistItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      name,
      description,
      passing_score: passingScore,
      password,
      is_enabled: isEnabled,
      checklist_items: checklistItems.filter((item) => item.text.trim()),
    })
  }

  const totalPoints = checklistItems.reduce((sum, item) => sum + (item.points || 0), 0)
  const criticalItems = checklistItems.filter((item) => item.is_critical)

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Marking Sheet" : "Create New Marking Sheet"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Assessment name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passing-score">Passing Score (%) *</Label>
              <Input
                id="passing-score"
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                placeholder="70"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Access Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Total Points</Label>
              <div className="h-10 px-3 py-2 border rounded-md bg-gray-50 flex items-center">{totalPoints} points</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Assessment description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Marking Sheet Status</Label>
              <div className="flex items-center space-x-2 h-10">
                <Checkbox checked={isEnabled} onCheckedChange={(checked) => setIsEnabled(checked as boolean)} />
                <span className="text-sm">
                  {isEnabled ? "Enabled (visible to assessors)" : "Disabled (hidden from assessors)"}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Critical Items Summary */}
          {criticalItems.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-800">Critical Items ({criticalItems.length})</h4>
              </div>
              <p className="text-sm text-yellow-700">
                These items will cause automatic failure if not checked, regardless of total score.
              </p>
            </div>
          )}

          {/* Checklist Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Checklist Items</h3>
              <Button type="button" onClick={addChecklistItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {checklistItems.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-4">
                    {/* Item Text and Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Item Text *</Label>
                        <Input
                          value={item.text}
                          onChange={(e) => updateChecklistItem(index, "text", e.target.value)}
                          placeholder="Checklist item text"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Input
                          value={item.category}
                          onChange={(e) => updateChecklistItem(index, "category", e.target.value)}
                          placeholder="e.g., Safety, Technical Skills"
                        />
                      </div>
                    </div>

                    {/* Points and Critical Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Points</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.points}
                          onChange={(e) => updateChecklistItem(index, "points", Number(e.target.value))}
                          placeholder="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Critical Item</Label>
                        <div className="flex items-center space-x-2 h-10">
                          <Checkbox
                            checked={item.is_critical}
                            onCheckedChange={(checked) => updateChecklistItem(index, "is_critical", checked as boolean)}
                          />
                          <span className="text-sm">Auto-fail if not checked</span>
                        </div>
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeChecklistItem(index)}
                          disabled={checklistItems.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Critical Condition */}
                    {item.is_critical && (
                      <div className="space-y-2">
                        <Label>Critical Condition (Optional)</Label>
                        <Input
                          value={item.critical_condition}
                          onChange={(e) => updateChecklistItem(index, "critical_condition", e.target.value)}
                          placeholder="e.g., If safety procedures are not followed, student automatically fails"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Marking Sheet"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
