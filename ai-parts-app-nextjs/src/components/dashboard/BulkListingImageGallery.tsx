'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Plus, 
  X,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  Link,
  Unlink
} from 'lucide-react'

interface ImageData {
  id: string
  url: string
  source: string
  title: string
  quality: number
  dimensions: string
  listingUrl?: string
  addedDate: string
  isCustom?: boolean
  partId?: string
  partName?: string
  vehicleId?: string
}

interface BulkListingImageGalleryProps {
  vehicleId: string
  selectedParts: string[]
  onImagesChange?: (images: Record<string, ImageData[]>) => void
  className?: string
}

export function BulkListingImageGallery({ 
  vehicleId, 
  selectedParts, 
  onImagesChange,
  className 
}: BulkListingImageGalleryProps) {
  const [allImages, setAllImages] = useState<ImageData[]>([])
  const [partImages, setPartImages] = useState<Record<string, ImageData[]>>({})
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSource, setFilterSource] = useState<string>('all')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [availableSources, setAvailableSources] = useState<string[]>([])
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())

  // Fetch all images for the vehicle
  const fetchImages = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/images/vehicle/${vehicleId}`)
      const data = await response.json()
      
      if (data.success) {
        setAllImages(data.images || [])
        console.log(`📸 Loaded ${data.images?.length || 0} images for bulk listing`)
        
        // Group images by part
        const groupedImages: Record<string, ImageData[]> = {}
        data.images.forEach((image: ImageData) => {
          if (image.partId) {
            if (!groupedImages[image.partId]) {
              groupedImages[image.partId] = []
            }
            groupedImages[image.partId].push(image)
          }
        })
        setPartImages(groupedImages)
        
        // Notify parent component
        if (onImagesChange) {
          onImagesChange(groupedImages)
        }
      } else {
        console.error('❌ Failed to fetch images:', data.message)
      }
    } catch (error) {
      console.error('❌ Error fetching images:', error)
    } finally {
      setLoading(false)
    }
  }

  // Extract unique sources from images
  useEffect(() => {
    const sources = [...new Set(allImages.map(img => img.source))]
    setAvailableSources(sources)
  }, [allImages])

  useEffect(() => {
    fetchImages()
  }, [vehicleId])

  // Filter images based on search and filters
  const filteredImages = allImages.filter(image => {
    const matchesSearch = !searchTerm || 
      image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.partName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSource = filterSource === 'all' || image.source === filterSource
    
    return matchesSearch && matchesSource
  })

  // Handle image deletion
  const handleDeleteImages = async () => {
    if (selectedImages.size === 0) return
    
    const confirmed = confirm(`Are you sure you want to delete ${selectedImages.size} image(s)?`)
    if (!confirmed) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/images/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds: Array.from(selectedImages) })
      })
      
      const data = await response.json()
      if (data.success) {
        await fetchImages() // Refresh the image list
        setSelectedImages(new Set())
        console.log(`✅ Deleted ${data.deletedCount} images`)
      } else {
        console.error('❌ Failed to delete images:', data.message)
      }
    } catch (error) {
      console.error('❌ Error deleting images:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle bulk upload
  const handleBulkUpload = async (files: FileList) => {
    if (!files.length) return
    
    setUploading(true)
    const formData = new FormData()
    
    Array.from(files).forEach((file, index) => {
      formData.append(`images`, file)
    })
    
    formData.append('vehicleId', vehicleId)
    formData.append('source', 'bulk_upload')
    
    try {
      const response = await fetch('/api/images/bulk-upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      if (data.success) {
        console.log(`✅ Uploaded ${data.uploadedCount} images`)
        await fetchImages() // Refresh the image list
        setShowUploadDialog(false)
      } else {
        console.error('❌ Upload failed:', data.message)
      }
    } catch (error) {
      console.error('❌ Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  // Toggle image selection
  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
      } else {
        newSet.add(imageId)
      }
      return newSet
    })
  }

  // Select all visible images
  const selectAllVisible = () => {
    const visibleIds = filteredImages.map(img => img.id)
    setSelectedImages(new Set(visibleIds))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedImages(new Set())
  }

  // Get images for selected parts
  const getSelectedPartsImages = () => {
    const selectedPartsImages: ImageData[] = []
    selectedParts.forEach(partId => {
      if (partImages[partId]) {
        selectedPartsImages.push(...partImages[partId])
      }
    })
    return selectedPartsImages
  }

  const selectedPartsImages = getSelectedPartsImages()

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Bulk Listing Image Gallery
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </Button>
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Upload
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Image Upload</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bulk-upload">Select Images</Label>
                      <Input
                        id="bulk-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleBulkUpload(e.target.files)
                          }
                        }}
                        disabled={uploading}
                      />
                    </div>
                    {uploading && (
                      <div className="text-center text-sm text-gray-600">
                        Uploading images...
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Selected Parts Summary */}
          {selectedParts.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">
                    Selected Parts: {selectedParts.length}
                  </h4>
                  <p className="text-sm text-blue-700">
                    Images available: {selectedPartsImages.length}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Filter to show only selected parts images
                      setSearchTerm('')
                      setFilterSource('all')
                    }}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Show Selected Parts Only
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search Images</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by title or part name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="source-filter">Source</Label>
              <select
                id="source-filter"
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sources</option>
                {availableSources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Selection Actions */}
          {selectedImages.size > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-red-900">
                {selectedImages.size} image(s) selected for deletion
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteImages}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
              >
                Clear Selection
              </Button>
            </div>
          )}

          {/* Image Grid/List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading images...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-8">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No images found</p>
              <p className="text-sm text-gray-500 mt-1">
                {allImages.length === 0 ? 'Upload some images to get started' : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Showing {filteredImages.length} of {allImages.length} images
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllVisible}
                  >
                    Select All Visible
                  </Button>
                </div>
              </div>

              {/* Image Display */}
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
                : 'space-y-2'
              }>
                {filteredImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                      selectedImages.has(image.id) ? 'ring-2 ring-red-500' : ''
                    } ${viewMode === 'list' ? 'flex items-center p-2' : ''}`}
                  >
                    <div className={`relative ${viewMode === 'list' ? 'w-16 h-16 mr-3' : 'w-full h-32'}`}>
                      <img
                        src={image.url}
                        alt={image.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/no-image.png'
                        }}
                      />
                      <button
                        onClick={() => toggleImageSelection(image.id)}
                        className={`absolute top-1 right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                          selectedImages.has(image.id)
                            ? 'bg-red-500 border-red-500 text-white'
                            : 'bg-white border-gray-300 text-gray-600 hover:border-red-500'
                        }`}
                      >
                        {selectedImages.has(image.id) && '✓'}
                      </button>
                    </div>
                    
                    {viewMode === 'list' && (
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{image.title}</p>
                        <p className="text-sm text-gray-600 truncate">
                          {image.partName || 'Vehicle Image'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {image.source} • {image.quality}% quality
                        </p>
                      </div>
                    )}
                    
                    {viewMode === 'grid' && (
                      <div className="p-2">
                        <p className="text-xs font-medium truncate" title={image.title}>
                          {image.title}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {image.partName || 'Vehicle Image'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {image.source} • {image.quality}%
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
