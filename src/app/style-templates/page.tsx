"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Plus, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface StyleTemplate {
  id: string
  name: string
  description: string | null
  prompt: string
  isDefault: boolean
  createdAt: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function StyleTemplates() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<StyleTemplate | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: templates, error } = useSWR<{ templates: StyleTemplate[] }>("/api/style-templates", fetcher)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    prompt: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/style-templates", {
        method: editingTemplate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTemplate ? { ...formData, id: editingTemplate.id } : formData),
      })

      if (!response.ok) throw new Error("Något gick fel")

      toast.success(editingTemplate ? "Mallen har uppdaterats!" : "Ny mall har skapats!")
      mutate("/api/style-templates")
      setIsOpen(false)
      resetForm()
    } catch (error) {
      toast.error("Något gick fel. Försök igen.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna mall?")) return

    try {
      const response = await fetch(`/api/style-templates/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Något gick fel")

      toast.success("Mallen har tagits bort!")
      mutate("/api/templates")
    } catch (error) {
      toast.error("Kunde inte ta bort mallen. Försök igen.")
    }
  }

  const handleEdit = (template: StyleTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || "",
      prompt: template.prompt,
    })
    setIsOpen(true)
  }

  const resetForm = () => {
    setFormData({ name: "", description: "", prompt: "" })
    setEditingTemplate(null)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka till Bildkreatören
        </Link>

        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ny Stilmall
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Redigera Stilmall" : "Skapa Ny Stilmall"}</DialogTitle>
              <DialogDescription>
                Skapa en ny mall för att enkelt återanvända dina favoritinstruktioner.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Namn på stilen</Label>
                <Input
                  id="name"
                  placeholder="T.ex. 'Min Favorit Akvarell'"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivning (valfritt)</Label>
                <Input
                  id="description"
                  placeholder="Kort beskrivning av stilen"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Instruktioner till AI</Label>
                <Textarea
                  id="prompt"
                  placeholder="Skriv instruktionerna som AI ska följa..."
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  className="min-h-[100px]"
                  required
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Sparar..." : "Spara Mall"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {error && (
          <div className="text-center py-8 text-red-500">Kunde inte ladda mallarna. Försök uppdatera sidan.</div>
        )}

        {templates?.templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{template.name}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {template.description && <p className="text-sm text-muted-foreground">{template.description}</p>}
              <p className="text-sm border rounded-md p-3 bg-muted/50">{template.prompt}</p>
            </CardContent>
          </Card>
        ))}

        {templates?.templates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Inga mallar skapade än. Skapa din första mall genom att klicka på "Ny Stilmall"!
          </div>
        )}
      </div>
    </div>
  )
}

