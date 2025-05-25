"use client"

import type React from "react"

import { useState } from "react"
import type { MarkingSheet } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2 } from "lucide-react"

interface ChecklistItemForm {
  text: string
  category: string
  order_index: number
}

interface MarkingSheetFormProps {
  initialData?: MarkingSheet
  onSubmit: (data: {
    name: string
    description?: string
    checklist_items: ChecklistItemForm[]
  }) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export default function MarkingSheetForm({ initialData, onSubmit, onCancel, isLoading }: MarkingSheetFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [checklistItems, setChecklistItems] = useState<ChecklistItemForm[]>(
    initialData?.checklist_items?.map((item, index) => ({
      text: item.text,
      category: item.category || "",
      order_index: index + 1,
    })) || [{ text: "", category: "", order_index: 1 }],
  )

  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, { text: "", category: "", order_index: checklistItems.length + 1 }])
  }

  const removeChecklistItem = (index: number) => {
    const newItems = checklistItems.filter((_, i) => i !== index)
    setChecklistItems(newItems.map((item, i) => ({ ...item, order_index: i + 1 })))
  }

  const updateChecklistItem = (index: number, field: keyof ChecklistItemForm, value: string | number) => {
    const newItems = [...checklistItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setChecklistItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      name,
      description,
      checklist_items: checklistItems.filter((item) => item.text.trim()),
    })
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Marking Sheet" : "Create New Marking Sheet"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Assessment description"
                rows={3}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Checklist Items</h3>
              <Button type="button" onClick={addChecklistItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {checklistItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded-lg">
                  <div className="md:col-span-2">
                    <Input
                      value={item.text}
                      onChange={(e) => updateChecklistItem(index, "text", e.target.value)}
                      placeholder="Checklist item text"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={item.category}
                      onChange={(e) => updateChecklistItem(index, "category", e.target.value)}
                      placeholder="Category"
                    />
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
