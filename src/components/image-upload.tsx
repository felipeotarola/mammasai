"use client"
import { useDropzone } from "react-dropzone"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ImageUploadProps {
  value: string | null
  onChange: (file: File) => void
  onRemove: () => void
  className?: string
}

export function ImageUpload({ value, onChange, onRemove, className }: ImageUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onChange(acceptedFiles[0])
      }
    },
  })

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed transition-colors",
          isDragActive && "border-primary/50 bg-primary/5",
          value && "border-primary/50 bg-primary/5",
        )}
      >
        <input {...getInputProps()} />
        {value ? (
          <>
            <div className="absolute right-2 top-2 z-10">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <img src={value || "/placeholder.svg"} alt="Preview" className="h-full w-full rounded-lg object-cover" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 p-4 text-center">
            <div className="flex items-center justify-center rounded-full border bg-background p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                <line x1="16" x2="22" y1="5" y2="5" />
                <line x1="19" x2="19" y1="2" y2="8" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <div className="text-sm font-medium">
              {isDragActive ? "Drop the image here" : "Drag & drop an image here"}
            </div>
            <div className="text-xs text-muted-foreground">Or click to select a file</div>
          </div>
        )}
      </div>
    </div>
  )
}

