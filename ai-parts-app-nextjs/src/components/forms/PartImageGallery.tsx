'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Loader2, 
  Upload,
  X,
  Eye,
  Download,
  Trash2,
  Plus,
  Image as ImageIcon,
  AlertCircle,
  Globe,
  Search
} from 'lucide-react'
import { LazyImage } from '@/components/optimization/LazyImage'

interface PartImageGalleryProps {
  partId: string
  partName: string
  images: any[]
  onImagesUpdate: (images: any[]) => void
  trigger?: React.ReactNode
  className?: string
}

export function PartImageGallery({
  partId,
  partName,
  images: initialImages,
  onImagesUpdate,
  trigger,
  className
}: PartImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [images, setImages] = useState(initialImages || [])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing images from database when dialog opens
  useEffect(() => {
    if (isOpen && images.length === 0) {
      // Only load existing images, don't trigger web hunting automatically
      loadExistingImages()
    }
  }, [isOpen])

  const loadExistingImages = async () => {
    setLoading(true)
    try {
      console.log('🔍 Loading existing images for partId:', partId)
      
      // Use the populate-inventory API to get parts data with images
      const response = await fetch(`/api/parts/populate-inventory?vehicleId=${vehicleId}`)
      
      if (!response.ok) {
        console.error('❌ API response not OK:', response.status, response.statusText)
        return
      }
      
      const data = await response.json()
      console.log('📸 Inventory data for', partName, ':', data)
      
      if (data.success && data.inventory && Array.isArray(data.inventory)) {
        // Find the specific part in the inventory
        const partData = data.inventory.find((item: any) => 
          item.partsMaster?.id === partId || item.partsMasterId === partId
        )
        
        if (partData?.partsMaster?.images && Array.isArray(partData.partsMaster.images)) {
          // Filter out placeholder images
          const realImages = partData.partsMaster.images.filter((img: any) => 
            typeof img === 'object' && 
            img.url && 
            !img.url.includes('via.placeholder.com') && 
            !img.url.includes('placeholder.com')
          )
          
          if (realImages.length > 0) {
            // Limit to first 6 images for eBay (max 12 total - 6 part images + 6 car pictures)
            const limitedImages = realImages.slice(0, 6)
            setImages(limitedImages)
            onImagesUpdate(limitedImages)
            console.log('✅ Loaded', limitedImages.length, 'real images for', partName, '(limited to 6 for eBay from', realImages.length, 'total)')
          } else {
            console.log('⚠️ No real images found for', partName)
          }
        } else {
          console.log('⚠️ No images found for', partName)
        }
      } else {
        console.log('⚠️ No inventory data found')
      }
    } catch (err) {
      console.error('❌ Error loading existing images:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchFromWeb = async () => {
    setFetching(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('🌐 Fetching images from web for partId:', partId)
      const response = await fetch('/api/image-hunting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId,
          partName,
          maxImages: 10
        })
      })
      
      if (!response.ok) {
        console.error('❌ Image hunting API response not OK:', response.status, response.statusText)
        setError('Failed to fetch images from web')
        return
      }
      
      const data = await response.json()
      console.log('🌐 Web fetch response for', partName, ':', data)
      
      if (data.success && data.images && data.images.length > 0) {
        setImages(data.images)
        onImagesUpdate(data.images)
        setSuccess(`Found ${data.images.length} images from web sources!`)
        console.log('✅ Web fetch successful for', partName)
      } else {
        setError('No images found from web sources')
        console.log('⚠️ No images found from web for', partName)
      }
    } catch (err) {
      setError('Failed to fetch images from web')
      console.error('❌ Web fetch error:', err)
    } finally {
      setFetching(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('partId', partId)

      const response = await fetch('/api/parts/upload-image', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Image uploaded successfully!')
        const updatedImages = [...images, data.imageInfo]
        setImages(updatedImages)
        onImagesUpdate(updatedImages)
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setError(data.message || 'Failed to upload image')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async (imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const response = await fetch('/api/parts/upload-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partId, imageUrl })
      })

      const data = await response.json()

      if (data.success) {
        const updatedImages = images.filter(img => img.url !== imageUrl)
        setImages(updatedImages)
        onImagesUpdate(updatedImages)
        setSuccess('Image deleted successfully!')
      } else {
        setError(data.message || 'Failed to delete image')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Delete error:', err)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      <ImageIcon className="h-4 w-4" />
      Images ({images.length})
    </Button>
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Images for {partName}
            </DialogTitle>
            <DialogDescription>
              Upload and manage images for this part
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Messages */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                {success}
              </div>
            )}

            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                      id={`file-upload-${partId}`}
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2"
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                    <Button
                      onClick={fetchFromWeb}
                      disabled={fetching}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {fetching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                      {fetching ? 'Searching...' : 'Fetch from Web'}
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>• Upload: JPEG, PNG, WebP up to 5MB</p>
                    <p>• Fetch from Web: Search eBay and other sources for part images</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images Grid */}
            <div className="flex-1 overflow-y-auto">
              {images.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No images uploaded yet</p>
                  <p className="text-sm text-gray-400">Upload your first image to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <Card key={index} className="relative group">
                      <CardContent className="p-2">
                        <div 
                          className="aspect-square relative cursor-pointer"
                          onClick={() => setSelectedImage(image.url)}
                        >
                          <LazyImage
                            src={image.url}
                            alt={image.title || `Image ${index + 1}`}
                            className="w-full h-full object-cover rounded-md"
                            onError={() => {
                              // Error handling is built into LazyImage
                            }}
                            width={200}
                            height={200}
                          />
                          
                          {/* Overlay Actions */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setSelectedImage(image.url)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteImage(image.url)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-600">
                          <div className="truncate" title={image.title}>
                            {image.title || `Image ${index + 1}`}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              image.source === 'User Upload' ? 'bg-green-100 text-green-700' :
                              image.source === 'eBay' ? 'bg-blue-100 text-blue-700' :
                              image.source === 'Google Images' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {image.source || 'Unknown'}
                            </span>
                            {image.quality && (
                              <span className="text-gray-400">
                                {image.quality}%
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Image Preview</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <LazyImage
                src={selectedImage || ''}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain rounded-md"
                onError={() => {
                  // Error handling is built into LazyImage
                }}
                width={400}
                height={300}
                priority={true}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
