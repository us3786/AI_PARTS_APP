'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Loader2, 
  ShoppingCart, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings,
  BarChart3,
  DollarSign,
  Package,
  Eye,
  TrendingUp,
  Clock,
  Target,
  Upload,
  Edit,
  Save,
  X,
  Bot,
  Car,
  Wrench,
  ImageIcon,
  FileText
} from 'lucide-react'
import { PartImageGallery } from '@/components/forms/PartImageGallery'
import { EbayListingTemplate } from '@/components/forms/EbayListingTemplate'

interface BulkListingDashboardProps {
  vehicleId: string
  className?: string
  refreshTrigger?: number // Add refresh trigger prop
}

interface Part {
  id: string
  partsMaster: {
    id: string
    partName: string
    category: string
    subCategory?: string
    estimatedValue: number
    images?: any[]
  }
  currentValue: number
  condition: string
  status: string
  notes?: string
}

interface ListingItem {
  partId: string
  partName: string
  category: string
  condition: string
  price: number
  title: string
  description: string
  keywords: string
  selected: boolean
  editing: boolean
}

interface VehicleInfo {
  id: string
  make: string
  model: string
  year: number
  engine?: string
  drivetrain?: string
  transmission?: string
  fuelType?: string
  vin: string
}

export function BulkListingDashboard({ vehicleId, className, refreshTrigger }: BulkListingDashboardProps) {
  const [parts, setParts] = useState<Part[]>([])
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null)
  const [listingItems, setListingItems] = useState<ListingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [bulkOperation, setBulkOperation] = useState<any>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Settings
  const [defaultShipping, setDefaultShipping] = useState(15.99)
  const [defaultHandlingTime, setDefaultHandlingTime] = useState('1')
  const [defaultReturnPolicy, setDefaultReturnPolicy] = useState('30')
  const [maxConcurrent, setMaxConcurrent] = useState(3)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchVehicleAndParts = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (loading) {
      console.log('⏳ Already loading, skipping duplicate fetchVehicleAndParts call')
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      // Fetch vehicle info
      const vehicleResponse = await fetch(`/api/vehicles/${vehicleId}`)
      const vehicleData = await vehicleResponse.json()
      
      if (vehicleData.success) {
        setVehicle(vehicleData.vehicle)
        console.log('✅ Vehicle data loaded for bulk listing:', vehicleData.vehicle)
      } else {
        console.error('❌ Failed to load vehicle data:', vehicleData)
      }

      // Fetch parts
      const partsResponse = await fetch(`/api/parts/populate-inventory?vehicleId=${vehicleId}`)
      const partsData = await partsResponse.json()

      if (partsData.success && partsData.inventory && Array.isArray(partsData.inventory)) {
        const availableParts = partsData.inventory.filter((part: Part) => 
          part.status === 'available' && part.currentValue > 0
        )
        
        // Debug: Log images for first few parts
        console.log('🔍 Debug - Parts with images:', availableParts.slice(0, 3).map(part => ({
          partName: part.partsMaster.partName,
          images: part.partsMaster.images,
          imageCount: part.partsMaster.images?.length || 0
        })))
        
        setParts(availableParts)

        // Initialize listing items with research-based titles
        const items: ListingItem[] = availableParts.map((part: Part) => {
          // Create exact research search sentence for title using the loaded vehicle data
          let researchTitle = part.partsMaster.partName
          if (vehicleData.success && vehicleData.vehicle) {
            researchTitle = `${vehicleData.vehicle.year} ${vehicleData.vehicle.make} ${vehicleData.vehicle.model} ${vehicleData.vehicle.engine || ''} ${vehicleData.vehicle.drivetrain || ''} ${part.partsMaster.partName}`.trim()
          } else {
            console.warn('⚠️ Vehicle data not available, using part name only for title')
          }
          
          return {
            partId: part.id,
            partName: part.partsMaster.partName,
            category: part.partsMaster.category,
            condition: 'used', // Default to used as requested
            price: part.currentValue || part.partsMaster.estimatedValue || 0,
            title: researchTitle, // Use exact research sentence or fallback to part name
            description: '',
            keywords: '',
            selected: false,
            editing: false
          }
        })
        setListingItems(items)
        console.log(`✅ Initialized ${items.length} listing items with research-based titles`)
      }
    } catch (err) {
      setError('Failed to fetch vehicle and parts data')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [vehicleId, loading]) // Add dependencies for useCallback

  // Function to update titles with vehicle data
  const updateTitlesWithVehicleData = useCallback((vehicleData: any, items: ListingItem[]) => {
    const updatedItems = items.map(item => {
      const researchTitle = `${vehicleData.year} ${vehicleData.make} ${vehicleData.model} ${vehicleData.engine || ''} ${vehicleData.drivetrain || ''} ${item.partName}`.trim()
      return {
        ...item,
        title: researchTitle
      }
    })
    setListingItems(updatedItems)
    console.log('✅ Updated titles with vehicle data for', updatedItems.length, 'items')
  }, []) // Empty dependency array since this function doesn't depend on any props or state

  // Add refresh function to expose to parent components
  const refreshData = useCallback(() => {
    console.log('🔄 Refreshing bulk listing data to get updated images...')
    fetchVehicleAndParts()
  }, [fetchVehicleAndParts])

  useEffect(() => {
    if (vehicleId && !vehicle) { // Only fetch if vehicleId exists and vehicle is not already loaded
      fetchVehicleAndParts()
    }
  }, [vehicleId, vehicle, fetchVehicleAndParts]) // Add fetchVehicleAndParts to dependencies

  // Watch for refresh trigger from parent component
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('🔄 Refresh trigger received, refreshing bulk listing data...')
      refreshData()
    }
  }, [refreshTrigger, refreshData])

  // Update titles when vehicle data becomes available (only once)
  useEffect(() => {
    if (vehicle && listingItems.length > 0 && listingItems[0].title === listingItems[0].partName) {
      updateTitlesWithVehicleData(vehicle, listingItems)
    }
  }, [vehicle, listingItems.length, updateTitlesWithVehicleData]) // Add updateTitlesWithVehicleData to dependencies

  // Memoize filtered parts to prevent unnecessary recalculations
  const filteredParts = useMemo(() => {
    if (!searchTerm) return listingItems
    
    return listingItems.filter(item => 
      item.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [listingItems, searchTerm])

  const generateAIDescriptions = async (selectedOnly = false) => {
    if (!vehicle) {
      setError('Vehicle information not available')
      console.error('❌ Vehicle data is null:', vehicle)
      return
    }

    console.log('🚀 Starting AI description generation...')
    console.log('Vehicle data:', vehicle)
    console.log('Selected only:', selectedOnly)
    console.log('Total listing items:', listingItems.length)

    setAiGenerating(true)
    setError(null)

    try {
      const itemsToProcess = selectedOnly 
        ? listingItems.filter(item => item.selected)
        : listingItems

      if (itemsToProcess.length === 0) {
        setError('No items to process')
        return
      }

      // Process items in batches to avoid overwhelming the API
      const batchSize = 5
      for (let i = 0; i < itemsToProcess.length; i += batchSize) {
        const batch = itemsToProcess.slice(i, i + batchSize)
        
        const promises = batch.map(async (item) => {
          try {
            console.log(`🤖 Generating eBay content for: ${item.partName}`)
            console.log('Request payload:', {
              partName: item.partName,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              engine: vehicle.engine,
              drivetrain: vehicle.drivetrain,
              condition: item.condition,
              category: item.category,
              price: item.price
            })
            
              const response = await fetch('/api/ai/ebay-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  partName: item.partName,
                  make: vehicle.make,
                  model: vehicle.model,
                  year: vehicle.year,
                  engine: vehicle.engine,
                  drivetrain: vehicle.drivetrain,
                  condition: item.condition,
                  category: item.category,
                  price: item.price,
                  vin: vehicle.vin, // Add VIN for enhanced descriptions
                  trim: vehicle.trim, // Add trim if available
                  generateTitle: false, // Don't generate title, use research sentence
                  generateDescription: true // Only generate description
                })
              })

            if (!response.ok) {
              console.error(`❌ API response not OK for ${item.partName}:`, response.status, response.statusText)
              return item
            }

            const data = await response.json()
            
            if (data.success) {
              console.log(`✅ Generated description for ${item.partName}`)
              console.log('Generated description preview:', data.description.substring(0, 100) + '...')
              return {
                ...item,
                // Keep the research-based title, only update description
                description: data.description,
                keywords: data.keywords,
                metadata: data.metadata
              }
            }
            console.log(`⚠️ Failed to generate content for ${item.partName}:`, data.message)
            return item
          } catch (err) {
            console.error(`❌ Error generating content for ${item.partName}:`, err)
            return item
          }
        })

        const updatedBatch = await Promise.all(promises)
        
        // Update state with new batch
        setListingItems(prev => 
          prev.map(item => {
            const updated = updatedBatch.find(batchItem => batchItem.partId === item.partId)
            return updated || item
          })
        )

        // Small delay between batches
        if (i + batchSize < itemsToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      setSuccess(`Generated AI titles and descriptions for ${itemsToProcess.length} parts`)
    } catch (err) {
      setError('Failed to generate AI descriptions')
      console.error('AI generation error:', err)
    } finally {
      setAiGenerating(false)
    }
  }

  const updateListingItem = (partId: string, field: keyof ListingItem, value: any) => {
    setListingItems(prev => 
      prev.map(item => 
        item.partId === partId 
          ? { ...item, [field]: value }
          : item
      )
    )
  }

  const toggleItemSelection = (partId: string) => {
    updateListingItem(partId, 'selected', !listingItems.find(item => item.partId === partId)?.selected)
  }

  const selectAllItems = () => {
    const allSelected = filteredParts.every(item => item.selected)
    setListingItems(prev => 
      prev.map(item => {
        // Only toggle items that are in the filtered results
        const isInFiltered = filteredParts.some(filteredItem => filteredItem.partId === item.partId)
        return isInFiltered ? { ...item, selected: !allSelected } : item
      })
    )
  }

  const createBulkListings = async () => {
    const selectedItems = listingItems.filter(item => item.selected)
    
    if (selectedItems.length === 0) {
      setError('Please select at least one item to list')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // First, map images for all selected items
      console.log('🖼️ Mapping images for eBay upload...')
      const imageMappingPromises = selectedItems.map(async (item) => {
        try {
          const imageResponse = await fetch('/api/ebay/image-mapping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              partId: item.partId,
              vehicleId: vehicleId
            })
          })
          
          if (imageResponse.ok) {
            const imageData = await imageResponse.json()
            return {
              ...item,
              images: imageData.images || [],
              primaryImage: imageData.primaryImage
            }
          }
          return item
        } catch (err) {
          console.error(`❌ Error mapping images for ${item.partName}:`, err)
          return item
        }
      })
      
      const itemsWithImages = await Promise.all(imageMappingPromises)
      console.log('✅ Image mapping completed for', itemsWithImages.length, 'items')

      const response = await fetch('/api/ebay/listings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          parts: itemsWithImages.map(item => ({
            partId: item.partId,
            title: item.title,
            description: item.description,
            price: item.price,
            condition: item.condition,
            shipping: defaultShipping,
            handlingTime: defaultHandlingTime,
            returnPolicy: defaultReturnPolicy
          })),
          maxConcurrent,
          listingTemplate: {
            shipping: { cost: defaultShipping, handlingTime: defaultHandlingTime },
            returns: { period: defaultReturnPolicy },
            payment: { methods: ['PayPal', 'CreditCard'] }
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Successfully created ${data.successful} eBay listings!`)
        setBulkOperation(data.operation)
      } else {
        setError(data.message || 'Failed to create bulk listings')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Bulk listing error:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectedCount = filteredParts.filter(item => item.selected).length
  const totalValue = filteredParts.reduce((sum, item) => sum + item.price, 0)
  const selectedValue = filteredParts
    .filter(item => item.selected)
    .reduce((sum, item) => sum + item.price, 0)

  if (loading && !parts.length) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading parts and vehicle data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
            Bulk eBay Listing Management
          </CardTitle>
            <div className="flex gap-2">
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                </Button>
              </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                    <DialogTitle>Listing Settings</DialogTitle>
                </DialogHeader>
                  <div className="space-y-4">
                      <div>
                      <label className="text-sm font-medium">Default Shipping Cost ($)</label>
                        <Input
                          type="number"
                        value={defaultShipping}
                        onChange={(e) => setDefaultShipping(parseFloat(e.target.value) || 0)}
                        step="0.01"
                      />
                    </div>
                      <div>
                      <label className="text-sm font-medium">Handling Time (days)</label>
                      <Select value={defaultHandlingTime} onValueChange={setDefaultHandlingTime}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                          <SelectItem value="0">Same day</SelectItem>
                          <SelectItem value="1">1 business day</SelectItem>
                          <SelectItem value="2">2 business days</SelectItem>
                          <SelectItem value="3">3 business days</SelectItem>
                          <SelectItem value="5">5 business days</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Return Policy (days)</label>
                      <Select value={defaultReturnPolicy} onValueChange={setDefaultReturnPolicy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">No returns</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search parts by name, title, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="text-sm text-gray-600">
                Showing {filteredParts.length} of {listingItems.length} parts
              </div>
            </div>
          </div>
          
          {/* Vehicle Info */}
          {vehicle && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Vehicle Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Vehicle:</span>
                  <p className="text-blue-900">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                </div>
                {vehicle.engine && (
                  <div>
                    <span className="text-blue-700 font-medium">Engine:</span>
                    <p className="text-blue-900">{vehicle.engine}</p>
                  </div>
                )}
                {vehicle.drivetrain && (
                  <div>
                    <span className="text-blue-700 font-medium">Drivetrain:</span>
                    <p className="text-blue-900">{vehicle.drivetrain}</p>
                  </div>
                )}
                {vehicle.transmission && (
                  <div>
                    <span className="text-blue-700 font-medium">Transmission:</span>
                    <p className="text-blue-900">{vehicle.transmission}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{parts.length}</div>
              <div className="text-sm text-green-600">Total Parts</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{selectedCount}</div>
              <div className="text-sm text-blue-600">Selected</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">${totalValue.toLocaleString()}</div>
              <div className="text-sm text-purple-600">Total Value</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">${selectedValue.toLocaleString()}</div>
              <div className="text-sm text-orange-600">Selected Value</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant="outline"
              onClick={selectAllItems}
              className="flex items-center gap-2"
            >
              {selectedCount === parts.length ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {selectedCount === parts.length ? 'Deselect All' : 'Select All'}
            </Button>
            
            <Button
              onClick={() => generateAIDescriptions(false)}
              disabled={aiGenerating}
              className="flex items-center gap-2"
            >
              {aiGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
              Generate All Descriptions
            </Button>

            <Button
              onClick={() => generateAIDescriptions(true)}
              disabled={aiGenerating || selectedCount === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              {aiGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
              Generate Selected ({selectedCount})
                  </Button>

            <Button
              onClick={createBulkListings}
              disabled={loading || selectedCount === 0}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
            >
                    {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                <Upload className="h-4 w-4" />
                    )}
              Create {selectedCount} Listings
                  </Button>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-4">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm mb-4">
              <CheckCircle className="h-4 w-4 inline mr-2" />
              {success}
            </div>
          )}
        </CardContent>
      </Card>

          {/* Parts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Parts Inventory ({filteredParts.length} of {parts.length} items)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedCount === parts.length && parts.length > 0}
                      onChange={selectAllItems}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description Preview</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.map((item) => (
                  <TableRow key={item.partId}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleItemSelection(item.partId)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.partName}</div>
                        <div className="text-sm text-gray-500">{item.category}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.condition === 'used' ? 'default' : 'secondary'}>
                        {item.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateListingItem(item.partId, 'price', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <PartImageGallery
                        partId={item.partId}
                        partName={item.partName}
                        images={(() => {
                          const part = parts.find(p => p.id === item.partId)
                          if (part) {
                            // Combine custom images and parts master images
                            const customImages = Array.isArray(part.customImages) ? part.customImages : []
                            const masterImages = Array.isArray(part.partsMaster.images) ? part.partsMaster.images : []
                            
                            // Convert string URLs to objects with url property for PartImageGallery
                            const convertedMasterImages = masterImages.map((img: any) => {
                              if (typeof img === 'string') {
                                return {
                                  url: img,
                                  title: `${item.partName} image`,
                                  source: 'Database',
                                  quality: 85,
                                  dimensions: 'Unknown',
                                  addedDate: new Date().toISOString(),
                                  isCustom: false
                                }
                              }
                              return img // Already an object
                            })
                            
                            const allImages = [...customImages, ...convertedMasterImages]
                            
                            // Debug: Log what images we're passing to PartImageGallery
                            if (allImages.length > 0) {
                              console.log('🖼️ Bulk Listing - Passing images to PartImageGallery for', item.partName, ':', allImages.length, 'images')
                              console.log('🖼️ First image:', allImages[0])
                            } else {
                              console.log('❌ Bulk Listing - No images found for', item.partName)
                            }
                            
                            return allImages
                          }
                          return []
                        })()}
                        onImagesUpdate={(images) => {
                          // Update the part's images in the parts array
                          setParts(prev => prev.map(p => 
                            p.id === item.partId 
                              ? { ...p, partsMaster: { ...p.partsMaster, images: images } }
                              : p
                          ))
                        }}
                        trigger={
                          <Button size="sm" variant="outline" className="flex items-center gap-1" title="Manage images">
                            <ImageIcon className="h-3 w-3" />
                            <span className="text-xs">Images</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                              {(() => {
                                const part = parts.find(p => p.id === item.partId)
                                if (part) {
                                  const customImages = Array.isArray(part.customImages) ? part.customImages : []
                                  const masterImages = Array.isArray(part.partsMaster.images) ? part.partsMaster.images : []
                                  const totalImages = customImages.length + masterImages.length
                                  return totalImages
                                }
                                return 0
                              })()}
                            </span>
                          </Button>
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {item.editing ? (
                        <Input
                          value={item.title}
                          onChange={(e) => updateListingItem(item.partId, 'title', e.target.value)}
                          placeholder="Listing title..."
                          className="min-w-[200px]"
                        />
                      ) : (
                        <div className="max-w-[200px] truncate" title={item.title}>
                          {item.title || 'Click edit to set title'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate text-sm text-gray-600" title={item.description}>
                        {item.description || 'No description generated'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateListingItem(item.partId, 'editing', !item.editing)}
                          className="flex items-center gap-1"
                          title={item.editing ? "Save changes" : "Edit title"}
                        >
                          {item.editing ? (
                            <>
                              <Save className="h-3 w-3" />
                              <span className="text-xs">Save</span>
                            </>
                          ) : (
                            <>
                              <Edit className="h-3 w-3" />
                              <span className="text-xs">Edit</span>
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateAIDescriptions(false)}
                          disabled={aiGenerating}
                          className="flex items-center gap-1"
                          title="Generate AI description"
                        >
                          {aiGenerating ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span className="text-xs">AI...</span>
                            </>
                          ) : (
                            <>
                              <Bot className="h-3 w-3" />
                              <span className="text-xs">AI</span>
                            </>
                          )}
                        </Button>
                        {vehicle && (
                          <EbayListingTemplate
                            partId={item.partId}
                            partName={item.partName}
                            category={item.category}
                            condition={item.condition}
                            vehicleInfo={{
                              year: vehicle.year,
                              make: vehicle.make,
                              model: vehicle.model,
                              engine: vehicle.engine,
                              drivetrain: vehicle.driveType,
                              transmission: vehicle.transmission
                            }}
                            currentPrice={item.price}
                            onSave={(template) => {
                              updateListingItem(item.partId, 'title', template.title)
                              updateListingItem(item.partId, 'description', template.description)
                              updateListingItem(item.partId, 'price', template.price)
                              updateListingItem(item.partId, 'keywords', template.keywords.join(', '))
                            }}
                            onPreview={(template) => {
                              // Create a preview modal
                              const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
                              if (previewWindow) {
                                previewWindow.document.write(`
                                  <!DOCTYPE html>
                                  <html>
                                  <head>
                                    <title>eBay Listing Preview - ${template.title}</title>
                                    <style>
                                      body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
                                      .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                                      .header { border-bottom: 2px solid #0064d2; padding-bottom: 15px; margin-bottom: 20px; }
                                      .title { font-size: 18px; font-weight: bold; color: #0064d2; margin-bottom: 10px; }
                                      .price { font-size: 24px; font-weight: bold; color: #e74c3c; margin-bottom: 15px; }
                                      .description { line-height: 1.6; margin-bottom: 20px; white-space: pre-wrap; }
                                      .keywords { margin-top: 20px; }
                                      .keyword { display: inline-block; background: #e9ecef; padding: 4px 8px; margin: 2px; border-radius: 4px; font-size: 12px; }
                                      .vehicle-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
                                      .vehicle-info h3 { margin-top: 0; color: #495057; }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="container">
                                      <div class="header">
                                        <div class="title">${template.title}</div>
                                        <div class="price">$${template.price.toFixed(2)}</div>
                                      </div>
                                      
                                      <div class="vehicle-info">
                                        <h3>🚗 Vehicle Compatibility</h3>
                                        <p><strong>Year:</strong> ${template.vehicleInfo.year}</p>
                                        <p><strong>Make:</strong> ${template.vehicleInfo.make}</p>
                                        <p><strong>Model:</strong> ${template.vehicleInfo.model}</p>
                                        ${template.vehicleInfo.engine ? `<p><strong>Engine:</strong> ${template.vehicleInfo.engine}</p>` : ''}
                                        ${template.vehicleInfo.transmission ? `<p><strong>Transmission:</strong> ${template.vehicleInfo.transmission}</p>` : ''}
                                        ${template.vehicleInfo.drivetrain ? `<p><strong>Drivetrain:</strong> ${template.vehicleInfo.drivetrain}</p>` : ''}
                                      </div>
                                      
                                      <div class="description">${template.description}</div>
                                      
                                      <div class="keywords">
                                        <h3>Keywords:</h3>
                                        ${template.keywords.map(keyword => `<span class="keyword">${keyword}</span>`).join('')}
                                      </div>
                                    </div>
                                  </body>
                                  </html>
                                `)
                                previewWindow.document.close()
                              } else {
                                alert('Preview blocked by popup blocker. Please allow popups for this site.')
                              }
                            }}
                            trigger={
                              <Button size="sm" variant="outline" className="flex items-center gap-1" title="eBay listing template">
                                <FileText className="h-3 w-3" />
                                <span className="text-xs">Template</span>
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}