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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Image as ImageIcon, 
  Edit, 
  Trash2, 
  Plus, 
  Upload, 
  X,
  Save,
  ExternalLink,
  Star,
  StarOff
} from 'lucide-react'

interface ImageData {
  url: string
  source: string
  title: string
  quality: number
  dimensions: string
  listingUrl?: string
  addedDate: string
  isCustom?: boolean
  aiAnalysis?: {
    quality: number
    consistency: number
    isRelevant: boolean
    confidence: number
    issues: string[]
    recommendations: string[]
    aiScore: number
  }
}

interface ImageManagerProps {
  partId: string
  partName: string
  images: ImageData[]
  onImagesChange: (images: ImageData[]) => void
  className?: string
}

export function ImageManager({ 
  partId, 
  partName, 
  images, 
  onImagesChange, 
  className 
}: ImageManagerProps) {
  const [editingImage, setEditingImage] = useState<ImageData | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newImageData, setNewImageData] = useState({
    url: '',
    title: partName,
    source: 'Custom Upload',
    quality: 100,
    dimensions: ''
  })

  const handleDeleteImage = async (imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/image-management?partId=${partId}&imageUrl=${encodeURIComponent(imageUrl)}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        const updatedImages = images.filter(img => img.url !== imageUrl)
        onImagesChange(updatedImages)
      } else {
        alert('Failed to delete image: ' + data.message)
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Failed to delete image')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateImage = async (imageUrl: string, updates: Partial<ImageData>) => {
    setLoading(true)
    try {
      const response = await fetch('/api/image-management', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId,
          imageUrl,
          updates
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const updatedImages = images.map(img => 
          img.url === imageUrl ? { ...img, ...updates } : img
        )
        onImagesChange(updatedImages)
        setIsEditDialogOpen(false)
        setEditingImage(null)
      } else {
        alert('Failed to update image: ' + data.message)
      }
    } catch (error) {
      console.error('Error updating image:', error)
      alert('Failed to update image')
    } finally {
      setLoading(false)
    }
  }

  const handleAddImage = async () => {
    if (!newImageData.url.trim()) {
      alert('Please enter an image URL')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/image-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId,
          imageData: newImageData
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const updatedImages = [...images, data.newImage]
        onImagesChange(updatedImages)
        setIsAddDialogOpen(false)
        setNewImageData({
          url: '',
          title: partName,
          source: 'Custom Upload',
          quality: 100,
          dimensions: ''
        })
      } else {
        alert('Failed to add image: ' + data.message)
      }
    } catch (error) {
      console.error('Error adding image:', error)
      alert('Failed to add image')
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (image: ImageData) => {
    setEditingImage(image)
    setIsEditDialogOpen(true)
  }

  const getQualityColor = (quality: number) => {
    if (quality >= 90) return 'text-green-600'
    if (quality >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'eBay': return 'bg-blue-100 text-blue-800'
      case 'Google': return 'bg-green-100 text-green-800'
      case 'LKQ': return 'bg-yellow-100 text-yellow-800'
      case 'Car-Parts.com': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Image Manager ({images.length} images)
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Image
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Image</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={newImageData.url}
                      onChange={(e) => setNewImageData(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="imageTitle">Title</Label>
                    <Input
                      id="imageTitle"
                      value={newImageData.title}
                      onChange={(e) => setNewImageData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Image title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="imageSource">Source</Label>
                    <Select
                      value={newImageData.source}
                      onValueChange={(value) => setNewImageData(prev => ({ ...prev, source: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Custom Upload">Custom Upload</SelectItem>
                        <SelectItem value="eBay">eBay</SelectItem>
                        <SelectItem value="Google">Google</SelectItem>
                        <SelectItem value="LKQ">LKQ</SelectItem>
                        <SelectItem value="Car-Parts.com">Car-Parts.com</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="imageQuality">Quality (1-100)</Label>
                    <Input
                      id="imageQuality"
                      type="number"
                      min="1"
                      max="100"
                      value={newImageData.quality}
                      onChange={(e) => setNewImageData(prev => ({ ...prev, quality: parseInt(e.target.value) || 100 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="imageDimensions">Dimensions</Label>
                    <Input
                      id="imageDimensions"
                      value={newImageData.dimensions}
                      onChange={(e) => setNewImageData(prev => ({ ...prev, dimensions: e.target.value }))}
                      placeholder="800x600"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddImage} disabled={loading} className="flex-1">
                      {loading ? 'Adding...' : 'Add Image'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/no-image.png'
                    }}
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0"
                      onClick={() => openEditDialog(image)}
                      title="Edit image"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 w-6 p-0"
                      onClick={() => handleDeleteImage(image.url)}
                      disabled={loading}
                      title="Delete image"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {image.isCustom && (
                    <div className="absolute top-2 left-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="font-medium text-sm truncate" title={image.title}>
                    {image.title}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded ${getSourceColor(image.source)}`}>
                      {image.source}
                    </span>
                    <div className="flex items-center gap-1">
                      {image.aiAnalysis && (
                        <span className={`text-xs px-1 py-0.5 rounded ${
                          image.aiAnalysis.isRelevant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`} title="AI Relevance">
                          {image.aiAnalysis.isRelevant ? '✓' : '✗'}
                        </span>
                      )}
                      <span className={`text-xs font-medium ${getQualityColor(image.quality)}`}>
                        {image.quality}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {image.dimensions}
                  </div>
                  {image.listingUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => window.open(image.listingUrl, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Source
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {images.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No images found for this part</p>
              <p className="text-sm">Click "Add Image" to upload your first image</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Image Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
          </DialogHeader>
          {editingImage && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={editingImage.url}
                  alt={editingImage.title}
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              </div>
              <div>
                <Label htmlFor="editTitle">Title</Label>
                <Input
                  id="editTitle"
                  value={editingImage.title}
                  onChange={(e) => setEditingImage(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editSource">Source</Label>
                <Select
                  value={editingImage.source}
                  onValueChange={(value) => setEditingImage(prev => prev ? { ...prev, source: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eBay">eBay</SelectItem>
                    <SelectItem value="Google">Google</SelectItem>
                    <SelectItem value="LKQ">LKQ</SelectItem>
                    <SelectItem value="Car-Parts.com">Car-Parts.com</SelectItem>
                    <SelectItem value="Custom Upload">Custom Upload</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editQuality">Quality (1-100)</Label>
                <Input
                  id="editQuality"
                  type="number"
                  min="1"
                  max="100"
                  value={editingImage.quality}
                  onChange={(e) => setEditingImage(prev => prev ? { ...prev, quality: parseInt(e.target.value) || 0 } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editDimensions">Dimensions</Label>
                <Input
                  id="editDimensions"
                  value={editingImage.dimensions}
                  onChange={(e) => setEditingImage(prev => prev ? { ...prev, dimensions: e.target.value } : null)}
                  placeholder="800x600"
                />
              </div>
              
              {/* AI Analysis Display */}
              {editingImage.aiAnalysis && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">AI Analysis</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium">AI Score:</span> {editingImage.aiAnalysis.aiScore}/100
                    </div>
                    <div>
                      <span className="font-medium">Relevance:</span> 
                      <span className={`ml-1 ${editingImage.aiAnalysis.isRelevant ? 'text-green-600' : 'text-red-600'}`}>
                        {editingImage.aiAnalysis.isRelevant ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Consistency:</span> {editingImage.aiAnalysis.consistency}%
                    </div>
                    <div>
                      <span className="font-medium">Confidence:</span> {editingImage.aiAnalysis.confidence}%
                    </div>
                  </div>
                  
                  {editingImage.aiAnalysis.issues.length > 0 && (
                    <div className="mt-2">
                      <span className="font-medium text-red-600">Issues:</span>
                      <ul className="list-disc list-inside text-red-600">
                        {editingImage.aiAnalysis.issues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {editingImage.aiAnalysis.recommendations.length > 0 && (
                    <div className="mt-2">
                      <span className="font-medium text-blue-600">Recommendations:</span>
                      <ul className="list-disc list-inside text-blue-600">
                        {editingImage.aiAnalysis.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleUpdateImage(editingImage.url, editingImage)} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
