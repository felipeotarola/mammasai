"use client"

import type React from "react"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Wand2 } from "lucide-react"
import Image from "next/image"

interface GeneratedImage {
  id: string
  prompt: string
  imageUrl: string
  createdAt: string
}

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")

  // Use SWR to fetch images
  const {
    data,
    isLoading,
    error: fetchError,
  } = useSWR<{ images: GeneratedImage[] }>("/api/generate", fetcher, {
    refreshInterval: 0, // Only refresh on demand
    revalidateOnFocus: false,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsGenerating(true)
    setError("")

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate image")
      }

      // Reset prompt and revalidate the images data
      setPrompt("")
      mutate("/api/generate")
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">AI Image Creator</h1>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Describe the image you want to create... (e.g. 'A beautiful garden with colorful flowers and butterflies')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
            <Button type="submit" className="w-full" disabled={isGenerating || !prompt.trim()}>
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 animate-spin" />
                  Creating magic...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Create Image
                </span>
              )}
            </Button>
          </form>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error state */}
      {fetchError && (
        <div className="text-center py-8 text-red-500">Failed to load images. Please try refreshing the page.</div>
      )}

      {/* Images grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.images.map((image) => (
          <Card key={image.id} className="overflow-hidden group">
            <CardContent className="p-2">
              <div className="relative aspect-square">
                <Image
                  src={image.imageUrl || "/placeholder.svg"}
                  alt={image.prompt}
                  fill
                  className="object-cover rounded-lg transition-transform group-hover:scale-105"
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2 p-2">{image.prompt}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {data?.images.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No images generated yet. Try creating your first one!
        </div>
      )}
    </div>
  )
}

