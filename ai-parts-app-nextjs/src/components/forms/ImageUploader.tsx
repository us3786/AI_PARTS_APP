'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'

interface ImageUploaderProps {
  onImageUpload: (file: File) => Promise<string | null>
  onImageRemove?: () => void
  currentImageUrl?: string
  className?: string
  title?: string
}

export function ImageUploader({ 
  onImageUpload, 
  onImageRemove, 
  currentImageUrl, 
  className,
  title = "Upload Image"
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB')
      return
    }

    setUploading(true)
    try {
      const imageUrl = await onImageUpload(file)
      if (!imageUrl) {
        alert('Failed to upload image')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const removeImage = () => {
    if (onImageRemove) {
      onImageRemove()
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentImageUrl ? (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={currentImageUrl}
                alt="Uploaded"
                className="w-full h-48 object-cover rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={openFileDialog} variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Change Image
            </Button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {uploading ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-600" />
                <p className="text-lg font-medium">Uploading image...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium">Drop an image here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                </div>
                <Button onClick={openFileDialog} variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
                <p className="text-xs text-gray-400">
                  Supports: JPG, PNG, GIF up to 10MB
                </p>
              </div>
            )}
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  )
}
