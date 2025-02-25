"use client"

import { useState } from "react"
import useSWR from "swr"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/image-upload"

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

export default function GeneratePage() {
  // image state can be a File (from upload) or a string (URL from the grid)
  const [image, setImage] = useState<File | string | null>(null)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)

  const { data } = useSWR<{ images: GeneratedImage[] }>("/api/generate", fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })

  const { data: videodata } = useSWR<{ videos: GeneratedVideos[] }>("/api/generate/video", fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })

  // Helper: convert a File to a data URL using FileReader
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })
  }

  const handleGenerate = async () => {
    if (!image) return

    setLoading(true)
    try {
      // Determine the firstFrameImage URL.
      let firstFrameImage: string

      // If the image is a File, convert it to a data URL.
      if (typeof image !== "string") {
        firstFrameImage = await fileToDataUrl(image)
      } else {
        // Otherwise, image is already a URL (from dragging the grid)
        firstFrameImage = image
      }

      // Now, generate the video using the determined URL.
      const response = await fetch("/api/generate/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: text,
          systemPrompt: "",
          firstFrameImage, // Use the data URL or the grid URL
        }),
      })

      const result = await response.json()
      console.log("Video generated:", result)
      // Optionally, update your UI or SWR cache here.
    } catch (error) {
      console.error("Error generating video:", error)
    } finally {
      setLoading(false)
    }
  }

  // Compute preview URL for the ImageUpload component.
  const imagePreview =
    typeof image === "string"
      ? image
      : image
      ? URL.createObjectURL(image)
      : null

  // Drop zone handlers for the image upload area.
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
    <div className="container mx-auto max-w-3xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Video</CardTitle>
          <CardDescription>
            Upload an image or drag one from the grid below to generate a video
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wrap the ImageUpload in a drop zone */}
          <div onDrop={handleDrop} onDragOver={handleDragOver} className="border-2 border-dashed p-4 rounded-md">
            <Label htmlFor="image">Image</Label>
            <ImageUpload
              value={imagePreview}
              onChange={(file) => setImage(file)}
              onRemove={() => setImage(null)}
            />
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
          <Button onClick={handleGenerate} disabled={!image || loading} className="w-full">
            {loading ? "Generating..." : "Generate Video"}
          </Button>
        </CardFooter>
      </Card>
      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {videodata?.videos.map((video) => (
          <Card
            key={video.id}
            draggable
            onDragStart={(e) => {
              // Set our custom data transfer field with the video URL.
              e.dataTransfer.setData("videoUrl", video.videoUrl)
            }}
          >
            <CardContent>
              <video controls className="w-full h-48 rounded-lg object-cover">
                <source src={video.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </CardContent>
            <CardFooter>
              <CardTitle>{video.id}</CardTitle>
              <CardDescription>{new Date(video.createdAt).toLocaleString()}</CardDescription>
            </CardFooter>
          </Card>
        ))}
      </div>
      {/* Images grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {data?.images.map((img) => (
          <Card
            key={img.id}
            draggable
            onDragStart={(e) => {
              // Set our custom data transfer field with the image URL.
              e.dataTransfer.setData("imageUrl", img.imageUrl)
            }}
          >
            <CardContent>
              <img src={img.imageUrl} alt={img.prompt} className="w-full h-48 object-cover rounded-lg" />
            </CardContent>
            <CardFooter>
              <CardTitle>{img.id}</CardTitle>
              <CardDescription>{new Date(img.createdAt).toLocaleString()}</CardDescription>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
