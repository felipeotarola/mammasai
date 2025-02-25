"use client"

import React from "react"

import { useState } from "react"
import useSWR from "swr"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/image-upload"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Wand2 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface GeneratedImage {
  id: string
  prompt: string
  imageUrl: string
  createdAt: string
}

interface GeneratedVideos {
  id: string
  prompt: string
  videoUrl: string
  createdAt: string
}

const ENCOURAGING_MESSAGES = [
  "Skapar något vackert åt dig...",
  "Låt kreativiteten flöda...",
  "Din bild är på väg...",
  "Målar din vision...",
  "Nästan klar...",
];


export default function GeneratePage() {
  const [image, setImage] = useState<File | string | null>(null)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<"all" | "videos" | "images">("all")
  const [isGenerating, setIsGenerating] = useState(false);
  const [encouragingMessageIndex, setEncouragingMessageIndex] = useState(0);

  const { data } = useSWR<{ images: GeneratedImage[] }>("/api/generate", fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })

  const { data: videodata } = useSWR<{ videos: GeneratedVideos[] }>("/api/generate/video", fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })
  }
// Rotate encouraging messages during generation
React.useEffect(() => {
  if (isGenerating) {
    const interval = setInterval(() => {
      setEncouragingMessageIndex((prev) =>
        prev === ENCOURAGING_MESSAGES.length - 1 ? 0 : prev + 1
      );
    }, 2000);
    return () => clearInterval(interval);
  }
}, [isGenerating]);



  const handleGenerate = async () => {
    if (!image) return

    setLoading(true)
    setIsGenerating(true);
    setEncouragingMessageIndex(0);

    try {
      let firstFrameImage: string

      if (typeof image !== "string") {
        firstFrameImage = await fileToDataUrl(image)
      } else {
        firstFrameImage = image
      }

      const response = await fetch("/api/generate/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: text,
          systemPrompt: "",
          firstFrameImage,
        }),
      })

      const result = await response.json()
      console.log("Video generated:", result)
    } catch (error) {
      console.error("Error generating video:", error)
    } finally {
      setLoading(false)
      setIsGenerating(false);

    }
  }

    

  const imagePreview = typeof image === "string" ? image : image ? URL.createObjectURL(image) : null

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedImageUrl = e.dataTransfer.getData("imageUrl")
    if (droppedImageUrl) {
      setImage(droppedImageUrl)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  return (
    <div className="bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-950 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate Video</CardTitle>
            <CardDescription>Upload an image or drag one from the grid below to generate a video.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div onDrop={handleDrop} onDragOver={handleDragOver} className="border-2 border-dashed p-4 rounded-md">
              <Label htmlFor="image">Image</Label>
              <ImageUpload value={imagePreview} onChange={(file) => setImage(file)} onRemove={() => setImage(null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text">Text</Label>
              <Textarea
                id="text"
                placeholder="Enter text for your video..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerate}
              disabled={!image || loading}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
            >
              {loading ? "Generating..." : "Generate Video"}
              {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {ENCOURAGING_MESSAGES[encouragingMessageIndex]}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4" />
                    Skapa Bild
                  </span>
                )}
            </Button>
          </CardFooter>
        </Card>

        <div className="flex justify-center gap-4 mb-6">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
            All
          </Button>
          <Button variant={filter === "videos" ? "default" : "outline"} onClick={() => setFilter("videos")}>
            Videos
          </Button>
          <Button variant={filter === "images" ? "default" : "outline"} onClick={() => setFilter("images")}>
            Images
          </Button>
        </div>

        {filter !== "images" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {videodata?.videos.map((video) => (
              <Card
                key={video.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("videoUrl", video.videoUrl)
                }}
                className="hover:shadow-lg transition-shadow duration-200 border-pink-100 dark:border-pink-900"
              >
                <CardContent>
                  <video controls className="w-full h-48 rounded-lg object-cover">
                    <source src={video.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </CardContent>
                <CardFooter>
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold">
                      <ScrollArea className="h-[60px]">{video.prompt}</ScrollArea>
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500">
                      {new Date(video.createdAt).toLocaleString()}
                    </CardDescription>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {filter !== "videos" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {data?.images.map((img) => (
              <Card
                key={img.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("imageUrl", img.imageUrl)
                }}
                className="hover:shadow-lg transition-shadow duration-200 border-pink-100 dark:border-pink-900"
              >
                <CardContent>
                  <div className="relative aspect-square">
                    <Image
                      src={img.imageUrl || "/placeholder.svg"}
                      alt={img.prompt}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold">
                      <ScrollArea className="h-[60px]">{img.prompt}</ScrollArea>
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500">
                      {new Date(img.createdAt).toLocaleString()}
                    </CardDescription>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

