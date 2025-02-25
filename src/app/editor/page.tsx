"use client"

import { useState, useRef } from "react"
import useSWR from "swr"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ChevronRight, Play, Pause, Plus, Minus, Scissors, Timer, GripVertical, Trash2 } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Video {
  id: string
  prompt: string
  videoUrl: string
  createdAt: string
  duration?: number // in seconds
}

export default function EditorPage() {
  const { data: videoData } = useSWR<{ videos: Video[] }>("/api/generate/video", fetcher)
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null)
  const previewRef = useRef<HTMLVideoElement>(null)

  const togglePlay = () => {
    if (previewRef.current) {
      if (isPlaying) {
        previewRef.current.pause()
      } else {
        previewRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const timeline = e.currentTarget
    const rect = timeline.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const totalDuration = selectedVideos.reduce((acc, video) => acc + (video.duration || 0), 0)
    setCurrentTime(percentage * totalDuration)
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(selectedVideos)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSelectedVideos(items)
  }

  const removeVideo = (index: number) => {
    setSelectedVideos(selectedVideos.filter((_, i) => i !== index))
    if (selectedVideoIndex === index) {
      setSelectedVideoIndex(null)
    }
  }

  const addVideo = (video: Video) => {
    if (!selectedVideos.find((v) => v.id === video.id)) {
      setSelectedVideos([...selectedVideos, { ...video, duration: 10 }]) // Example duration
    }
  }

  return (
    <div className="container mx-auto max-w-7xl py-6">
      <div className="flex flex-col gap-6">
        {/* Preview Section */}
        <div className="bg-black rounded-lg aspect-video overflow-hidden">
          {selectedVideoIndex !== null && selectedVideos[selectedVideoIndex] ? (
            <video
              ref={previewRef}
              src={selectedVideos[selectedVideoIndex].videoUrl}
              className="w-full h-full"
              controls={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50">
              Select a clip to preview
            </div>
          )}
        </div>

        {/* Timeline Controls */}
        <div className="flex items-center gap-4 bg-muted p-4 rounded-lg">
          <Button variant="ghost" size="icon" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon">
            <Scissors className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm">{Math.round(zoomLevel * 100)}%</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            <span className="font-mono">
              {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Time markers */}
          <div className="flex justify-between px-4 text-sm text-muted-foreground">
            {Array.from({ length: 11 }).map((_, i) => (
              <span key={i}>{i}s</span>
            ))}
          </div>
          
          {/* Timeline tracks */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="timeline">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="mt-2 bg-muted rounded-lg p-4 min-h-[200px]"
                  onClick={handleTimelineClick}
                >
                  {selectedVideos.map((video, index) => (
                    <Draggable key={video.id} draggableId={video.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-2 p-2 mb-2 bg-background rounded-md border ${
                            selectedVideoIndex === index ? "border-primary" : ""
                          }`}
                          onClick={() => setSelectedVideoIndex(index)}
                        >
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="w-24 h-14 bg-muted rounded overflow-hidden">
                            <video src={video.videoUrl} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{video.id}</div>
                            <div className="text-xs text-muted-foreground">
                              Duration: {video.duration}s
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => removeVideo(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Playhead */}
          <div
            className="absolute top-0 w-px h-full bg-primary"
            style={{
              left: `${(currentTime / (selectedVideos.reduce((acc, video) => acc + (video.duration || 0), 0))) * 100}%`,
            }}
          />
        </div>

        {/* Available Clips */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Available Clips</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {videoData?.videos.map((video) => (
              <Card
                key={video.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedVideos.find((v) => v.id === video.id) ? "border-primary" : ""
                }`}
                onClick={() => addVideo(video)}
              >
                <CardContent className="p-2">
                  <div className="aspect-video rounded-md overflow-hidden bg-muted">
                    <video src={video.videoUrl} className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-2 text-xs font-medium truncate">{video.id}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
