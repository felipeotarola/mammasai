import type React from "react"
import { useState } from "react"
import useSWR, { mutate } from "swr"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Trash2, Maximize2, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export interface GeneratedImage {
  id: string
  prompt: string
  imageUrl: string
  createdAt: string
}

export interface GeneratedVideo {
  modelName: string
  id: string
  prompt: string
  videoUrl: string
  createdAt: string
}

interface PaginatedImages {
  images: GeneratedImage[]
  totalPages: number
}

interface PaginatedVideos {
  videos: GeneratedVideo[]
  totalPages: number
}

interface MediaGridProps {
  tab?: "videos" | "images"
}

const MediaGrid: React.FC<MediaGridProps> = ({ tab = "videos" }) => {
  // Use the prop value as the initial state for filtering.
  const [filter, setFilter] = useState<"all" | "videos" | "images">(tab)
  const [expandedMedia, setExpandedMedia] = useState<{
    type: "image" | "video"
    url: string
    prompt: string
  } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "image" | "video"
    id: string
  } | null>(null)

  // Pagination state for images and videos.
  const [imagePage, setImagePage] = useState(1)
  const [videoPage, setVideoPage] = useState(1)

  // Fetch images and videos with pagination.
  const { data: imageData, isLoading: imagesLoading } = useSWR<PaginatedImages>(
    `/api/generate/images?page=${imagePage}`,
    fetcher,
    { refreshInterval: 0, revalidateOnFocus: false },
  )

  const { data: videoData, isLoading: videosLoading } = useSWR<PaginatedVideos>(
    `/api/generate/videos?page=${videoPage}`,
    fetcher,
    { refreshInterval: 0, revalidateOnFocus: false },
  )

  const handleDelete = async () => {
    if (!deleteConfirm) return

    try {
      const { type, id } = deleteConfirm
      const endpoint = type === "image" ? `/api/media/image/${id}` : `/api/media/video/${id}`

      const response = await fetch(endpoint, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete ${type}`)
      }

      // Update the cache for the respective endpoint.
      if (type === "image") {
        mutate(
          `/api/generate/images?page=${imagePage}`,
          {
            images: imageData?.images.filter((img) => img.id !== id),
            totalPages: imageData?.totalPages,
          },
          false,
        )
      } else {
        mutate(
          `/api/generate/videos?page=${videoPage}`,
          {
            videos: videoData?.videos.filter((video) => video.id !== id),
            totalPages: videoData?.totalPages,
          },
          false,
        )
      }

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`)
    } catch (error) {
      toast.error(`Failed to delete: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setDeleteConfirm(null)
    }
  }

  if (imagesLoading || videosLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    )
  }

  return (
    <div>
      {/* Filter buttons */}
      <div className="flex justify-center gap-4 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className={filter === "all" ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white" : ""}
        >
          All
        </Button>
        <Button
          variant={filter === "videos" ? "default" : "outline"}
          onClick={() => setFilter("videos")}
          className={filter === "videos" ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white" : ""}
        >
          Videos
        </Button>
        <Button
          variant={filter === "images" ? "default" : "outline"}
          onClick={() => setFilter("images")}
          className={filter === "images" ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white" : ""}
        >
          Images
        </Button>
      </div>

      {/* Video grid (if filter is not "images") */}
      {filter !== "images" && videoData?.videos && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {videoData.videos.map((video) => (
              <Card
                key={video.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("videoUrl", video.videoUrl)
                }}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-pink-100 dark:border-pink-900 hover:border-pink-300 dark:hover:border-pink-700 relative"
              >
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
                    onClick={() =>
                      setExpandedMedia({
                        type: "video",
                        url: video.videoUrl,
                        prompt: video.prompt,
                      })
                    }
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-red-500/70 hover:bg-red-500/90 text-white"
                    onClick={() =>
                      setDeleteConfirm({
                        type: "video",
                        id: video.id,
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-3">
                  <div className="overflow-hidden rounded-lg">
                    <video
                      controls
                      className="w-full h-48 rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                      onClick={() =>
                        setExpandedMedia({
                          type: "video",
                          url: video.videoUrl,
                          prompt: video.prompt,
                        })
                      }
                    >
                      <source src={video.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </CardContent>
                <CardFooter className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 p-3">
                  <div className="space-y-1 w-full">
                    <CardTitle className="text-sm font-semibold">
                      <ScrollArea className="h-[60px]">{video.prompt}</ScrollArea>
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(video.createdAt).toLocaleString()}
                    </CardDescription>
                    <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                      {video.modelName}
                    </CardDescription>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
          {/* Video Pagination */}
          <div className="flex justify-center mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setVideoPage((prev) => (prev > 1 ? prev - 1 : prev))
                    }
                  />
                </PaginationItem>
                {/* Render page numbers dynamically */}
                {Array.from({ length: videoData.totalPages }).map((_, idx) => {
                  const pageNumber = idx + 1
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setVideoPage(pageNumber)}
                        className={videoPage === pageNumber ? "bg-pink-500 text-white" : ""}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setVideoPage((prev) =>
                        prev < videoData.totalPages ? prev + 1 : prev,
                      )
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}

      {/* Image grid (if filter is not "videos") */}
      {filter !== "videos" && imageData?.images && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {imageData.images.map((img) => (
              <Card
                key={img.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("imageUrl", img.imageUrl)
                }}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-pink-100 dark:border-pink-900 hover:border-pink-300 dark:hover:border-pink-700 relative"
              >
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
                    onClick={() =>
                      setExpandedMedia({
                        type: "image",
                        url: img.imageUrl,
                        prompt: img.prompt,
                      })
                    }
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-red-500/70 hover:bg-red-500/90 text-white"
                    onClick={() =>
                      setDeleteConfirm({
                        type: "image",
                        id: img.id,
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-3">
                  <div className="overflow-hidden rounded-lg">
                    <div
                      className="relative aspect-square cursor-pointer"
                      onClick={() =>
                        setExpandedMedia({
                          type: "image",
                          url: img.imageUrl,
                          prompt: img.prompt,
                        })
                      }
                    >
                      <Image
                        src={img.imageUrl || "/placeholder.svg"}
                        alt={img.prompt}
                        fill
                        className="object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 p-3">
                  <div className="space-y-1 w-full">
                    <CardTitle className="text-sm font-semibold">
                      <ScrollArea className="h-[60px]">{img.prompt}</ScrollArea>
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(img.createdAt).toLocaleString()}
                    </CardDescription>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
          {/* Image Pagination */}
          <div className="flex justify-center mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setImagePage((prev) => (prev > 1 ? prev - 1 : prev))
                    }
                  />
                </PaginationItem>
                {Array.from({ length: imageData.totalPages }).map((_, idx) => {
                  const pageNumber = idx + 1
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setImagePage(pageNumber)}
                        className={imagePage === pageNumber ? "bg-pink-500 text-white" : ""}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setImagePage((prev) =>
                        prev < imageData.totalPages ? prev + 1 : prev,
                      )
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}

      {/* Expanded Media Modal */}
      {expandedMedia && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-5xl w-full max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={() => setExpandedMedia(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="p-4">
              {expandedMedia.type === "image" ? (
                <div className="relative w-full h-[70vh]">
                  <Image
                    src={expandedMedia.url || "/placeholder.svg"}
                    alt={expandedMedia.prompt}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <video controls className="w-full max-h-[70vh]">
                  <source src={expandedMedia.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h3 className="font-medium text-lg mb-2">Prompt</h3>
                <p className="text-gray-700 dark:text-gray-300">{expandedMedia.prompt}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {deleteConfirm?.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default MediaGrid
