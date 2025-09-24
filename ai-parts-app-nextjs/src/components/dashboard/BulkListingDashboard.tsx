'use client'

import { useState, useEffect } from 'react'
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

export function BulkListingDashboard({ vehicleId, className }: BulkListingDashboardProps) {
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

  const fetchVehicleAndParts = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch vehicle info
      const vehicleResponse = await fetch(`/api/vehicles/${vehicleId}`)
      const vehicleData = await vehicleResponse.json()
      
      if (vehicleData.success) {
        setVehicle(vehicleData.vehicle)
      }

      // Fetch parts
      const partsResponse = await fetch(`/api/parts/populate-inventory?vehicleId=${vehicleId}`)
      const partsData = await partsResponse.json()

      if (partsData.success) {
        const availableParts = partsData.inventory.filter((part: Part) => 
          part.status === 'available' && part.currentValue > 0
        )
        setParts(availableParts)

        // Initialize listing items
        const items: ListingItem[] = availableParts.map((part: Part) => ({
          partId: part.id,
          partName: part.partsMaster.partName,
          category: part.partsMaster.category,
          condition: 'used', // Default to used as requested
          price: part.currentValue || part.partsMaster.estimatedValue || 0,
          title: '',
          description: '',
          keywords: '',
          selected: false,
          editing: false
        }))
        setListingItems(items)
      }
    } catch (err) {
      setError('Failed to fetch vehicle and parts data')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (vehicleId) {
      fetchVehicleAndParts()
    }
  }, [vehicleId])

  const generateAIDescriptions = async (selectedOnly = false) => {
    if (!vehicle) {
      setError('Vehicle information not available')
      return
    }

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
            const response = await fetch('/api/ai/description', {
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
                category: item.category
              })
            })

            const data = await response.json()
            
            if (data.success) {
              return {
                ...item,
                title: data.title,
                description: data.description,
                keywords: data.keywords
              }
            }
            return item
          } catch (err) {
            console.error(`Error generating description for ${item.partName}:`, err)
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

      setSuccess(`Generated AI descriptions for ${itemsToProcess.length} parts`)
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
    const allSelected = listingItems.every(item => item.selected)
    setListingItems(prev => 
      prev.map(item => ({ ...item, selected: !allSelected }))
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
      const response = await fetch('/api/ebay/listings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          parts: selectedItems.map(item => ({
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

  const selectedCount = listingItems.filter(item => item.selected).length
  const totalValue = listingItems.reduce((sum, item) => sum + item.price, 0)
  const selectedValue = listingItems
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
          <CardTitle>Parts Inventory ({parts.length} items)</CardTitle>
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
                {listingItems.map((item) => (
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
                            return [...customImages, ...masterImages]
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
                          <Button size="sm" variant="outline">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            Images
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
                        >
                          {item.editing ? (
                            <Save className="h-3 w-3" />
                          ) : (
                            <Edit className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateAIDescriptions(false)}
                          disabled={aiGenerating}
                        >
                          {aiGenerating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Bot className="h-3 w-3" />
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
                              console.log('Preview template:', template)
                              // You can implement a preview modal here
                            }}
                            trigger={
                              <Button size="sm" variant="outline">
                                <FileText className="h-3 w-3" />
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