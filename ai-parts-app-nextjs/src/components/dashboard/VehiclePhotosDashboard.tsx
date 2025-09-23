'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Eye, 
  Download,
  Camera,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface VehiclePhotosDashboardProps {
  vehicleId: string
  className?: string
}

interface VehiclePhoto {
  id: string
  vehicleId: string
  filename: string
  originalName: string
  url: string
  thumbnailUrl?: string
  uploadedAt: string
  fileSize: number
  mimeType: string
  isPrimary: boolean
  tags: string[]
  description?: string
}

export function VehiclePhotosDashboard({ vehicleId, className }: VehiclePhotosDashboardProps) {
  const [photos, setPhotos] = useState<VehiclePhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (vehicleId) {
      fetchVehiclePhotos()
    }
  }, [vehicleId])

  const fetchVehiclePhotos = async () => {
    try {
      const response = await fetch(`/api/vehicle-photos?vehicleId=${vehicleId}`)
      const data = await response.json()
      
      if (data.success) {
        setPhotos(data.photos || [])
      }
    } catch (error) {
      console.error('Error fetching vehicle photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length !== fileArray.length) {
      alert('Only image files are allowed')
      return
    }
    
    setSelectedFiles(prev => [...prev, ...imageFiles])
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const uploadPhotos = async () => {
    if (selectedFiles.length === 0) return
    
    setUploading(true)
    setUploadProgress(0)
    
    try {
      const formData = new FormData()
      formData.append('vehicleId', vehicleId)
      
      selectedFiles.forEach((file, index) => {
        formData.append(`photos`, file)
        formData.append(`descriptions`, `Vehicle photo ${index + 1}`)
      })
      
      const response = await fetch('/api/vehicle-photos', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        setPhotos(prev => [...prev, ...data.uploadedPhotos])
        setSelectedFiles([])
        alert(`Successfully uploaded ${data.uploadedPhotos.length} photos!`)
      } else {
        alert(`Upload failed: ${data.message}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const deletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return
    
    try {
      const response = await fetch(`/api/vehicle-photos/${photoId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setPhotos(prev => prev.filter(photo => photo.id !== photoId))
        alert('Photo deleted successfully')
      } else {
        alert(`Delete failed: ${data.message}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Delete failed')
    }
  }

  const setPrimaryPhoto = async (photoId: string) => {
    try {
      const response = await fetch(`/api/vehicle-photos/${photoId}/primary`, {
        method: 'PUT'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setPhotos(prev => prev.map(photo => ({
          ...photo,
          isPrimary: photo.id === photoId
        })))
        alert('Primary photo updated')
      } else {
        alert(`Update failed: ${data.message}`)
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Update failed')
    }
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading vehicle photos...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Upload Vehicle Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop photos here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Upload multiple photos of the vehicle (JPG, PNG, WebP)
                </p>
              </div>
              <div>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  id="photo-upload"
                />
                <Button
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  variant="outline"
                  className="bg-white hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Choose Photos
                </Button>
              </div>
            </div>
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Selected Files ({selectedFiles.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSelectedFile(index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </div>
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-20 object-cover rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={uploadPhotos}
                disabled={uploading}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {selectedFiles.length} Photos
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Vehicle Photos ({photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No photos uploaded yet</p>
              <p className="text-sm">Upload photos of the vehicle to associate with all parts</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                  <div className="relative">
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={photo.originalName}
                      className="w-full h-48 object-cover"
                    />
                    {photo.isPrimary && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPrimaryPhoto(photo.id)}
                        disabled={photo.isPrimary}
                        className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                        title="Set as primary photo"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePhoto(photo.id)}
                        className="h-8 w-8 p-0 bg-white/80 hover:bg-white text-red-500 hover:text-red-700"
                        title="Delete photo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {photo.originalName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(photo.fileSize)} • {new Date(photo.uploadedAt).toLocaleDateString()}
                    </div>
                    <div className="mt-2 flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(photo.url, '_blank')}
                        className="flex-1 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = photo.url
                          link.download = photo.originalName
                          link.click()
                        }}
                        className="flex-1 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            How Vehicle Photos Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📸 Upload Process</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Upload multiple photos of the vehicle</li>
                <li>• Photos are automatically resized and optimized</li>
                <li>• Set one photo as "Primary" for listings</li>
                <li>• All photos are associated with vehicle parts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🛒 eBay Integration</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Primary photo used as main listing image</li>
                <li>• Additional photos added to eBay listings</li>
                <li>• Photos help buyers see part condition</li>
                <li>• Improves listing quality and sales</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
