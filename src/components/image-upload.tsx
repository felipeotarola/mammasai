"use client"

import type React from "react"

import { useState, useCallback } from "react"

interface ImageUploadProps {
  value: string | null
  onChange: (file: File | null) => void
  onRemove: () => void
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, onRemove }) => {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragging(false)

      const files = event.dataTransfer.files
      if (files && files.length > 0) {
        onChange(files[0])
      }
    },
    [onChange],
  )

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }, [])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (files && files.length > 0) {
        onChange(files[0])
      }
    },
    [onChange],
  )

  return (
    <div
      className={`relative border-2 border-dashed rounded-md p-4 ${
        isDragging ? "border-pink-500" : "border-gray-300 dark:border-gray-700"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {value ? (
        <div className="relative aspect-square w-full">
          <img src={value || "/placeholder.svg"} alt="Uploaded" className="object-cover rounded-md w-full h-full" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ) : (
        <>
          <label htmlFor="file-upload" className="flex flex-col items-center justify-center h-48 cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.854-6.354l1.511-1.512a.75.75 0 011.06 1.06l-1.512 1.512a3 3 0 001.224 4.243M16.5 19.5a4.5 4.5 0 001.854-6.354l-1.511-1.512a.75.75 0 00-1.06 1.06l1.512 1.512a3 3 0 01-1.224 4.243"
              />
            </svg>
            <p className="text-gray-500">{isDragging ? "Drop here" : "Click to upload or drag and drop"}</p>
          </label>
          <input id="file-upload" type="file" className="hidden" onChange={handleChange} />
        </>
      )}
    </div>
  )
}

