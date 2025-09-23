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
  Target
} from 'lucide-react'

interface BulkListingDashboardProps {
  vehicleId: string
  className?: string
}

interface BulkOperation {
  id: string
  operationName: string
  status: string
  progress: number
  totalParts: number
  processedParts: number
  successfulListings: number
  failedListings: number
  createdAt: Date
  updatedAt: Date
  ebayListings: any[]
}

interface ListingResult {
  partId: string
  partName: string
  success: boolean
  ebayItemId?: string
  ebayUrl?: string
  listingPrice?: number
  originalPrice?: number
  error?: string
}

interface ListingTemplate {
  returnPolicy: string
  shippingPolicy: string
  paymentPolicy: string
  descriptionTemplate: string
  titleTemplate: string
}

interface PricingStrategy {
  discountPercentage: number
  minimumPrice: number
  maximumPrice: number
  pricingMethod: 'market' | 'fixed' | 'competitive'
}

export function BulkListingDashboard({ vehicleId, className }: BulkListingDashboardProps) {
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set())
  const [availableParts, setAvailableParts] = useState<any[]>([])
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentOperation, setCurrentOperation] = useState<string>('')
  const [showListingDialog, setShowListingDialog] = useState(false)
  const [listingTemplate, setListingTemplate] = useState<ListingTemplate>({
    returnPolicy: '30',
    shippingPolicy: 'standard',
    paymentPolicy: 'paypal',
    descriptionTemplate: 'detailed',
    titleTemplate: 'professional'
  })
  const [pricingStrategy, setPricingStrategy] = useState<PricingStrategy>({
    discountPercentage: 0,
    minimumPrice: 10,
    maximumPrice: 10000,
    pricingMethod: 'competitive'
  })
  const [maxConcurrent, setMaxConcurrent] = useState(3)

  const fetchAvailableParts = async () => {
    try {
      const response = await fetch(`/api/parts/populate-inventory?vehicleId=${vehicleId}`)
      const data = await response.json()

      if (data.success) {
        // Filter for parts that can be listed (available status)
        const listableParts = data.inventory.filter((part: any) => 
          part.status === 'available' && part.currentValue > 0
        )
        setAvailableParts(listableParts)
      }
    } catch (error) {
      console.error('Error fetching available parts:', error)
    }
  }

  const fetchBulkOperations = async () => {
    try {
      const response = await fetch(`/api/ebay/listings/bulk?vehicleId=${vehicleId}`)
      const data = await response.json()

      if (data.success) {
        setBulkOperations(data.operations || [])
      }
    } catch (error) {
      console.error('Error fetching bulk operations:', error)
    }
  }

  useEffect(() => {
    if (vehicleId) {
      fetchAvailableParts()
      fetchBulkOperations()
    }
  }, [vehicleId])

  const handleSelectPart = (partId: string) => {
    const newSelected = new Set(selectedParts)
    if (newSelected.has(partId)) {
      newSelected.delete(partId)
    } else {
      newSelected.add(partId)
    }
    setSelectedParts(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedParts.size === availableParts.length) {
      setSelectedParts(new Set())
    } else {
      setSelectedParts(new Set(availableParts.map(part => part.id)))
    }
  }

  const startBulkListing = async () => {
    if (selectedParts.size === 0) {
      alert('Please select at least one part to list')
      return
    }

    setLoading(true)
    setProgress(0)
    setCurrentOperation('Starting bulk listing process...')

    try {
      const response = await fetch('/api/ebay/listings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partIds: Array.from(selectedParts),
          vehicleId: vehicleId,
          listingTemplate: listingTemplate,
          pricingStrategy: pricingStrategy,
          maxConcurrent: maxConcurrent,
          schedulingOptions: {
            startImmediately: true
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        setCurrentOperation('Bulk listing completed successfully!')
        setProgress(100)
        
        // Refresh data
        await Promise.all([
          fetchAvailableParts(),
          fetchBulkOperations()
        ])
        
        // Clear selection
        setSelectedParts(new Set())
        setShowListingDialog(false)
      } else {
        throw new Error(data.message || 'Bulk listing failed')
      }

    } catch (error) {
      console.error('Bulk listing error:', error)
      setCurrentOperation('Bulk listing failed')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const totalSelectedValue = Array.from(selectedParts).reduce((sum, partId) => {
    const part = availableParts.find(p => p.id === partId)
    return sum + (part?.currentValue || 0)
  }, 0)

  const estimatedListingValue = totalSelectedValue * (1 - pricingStrategy.discountPercentage / 100)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Bulk eBay Listing Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selection Summary */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex items-center gap-2"
              >
                {selectedParts.size === availableParts.length ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Package className="h-4 w-4" />
                )}
                {selectedParts.size === availableParts.length ? 'Deselect All' : 'Select All'}
              </Button>
              
              <div className="text-sm">
                <span className="font-medium">{selectedParts.size}</span> parts selected
              </div>
              
              <div className="text-sm text-gray-600">
                Total Value: <span className="font-medium">${totalSelectedValue.toLocaleString()}</span>
              </div>
              
              <div className="text-sm text-green-600">
                Est. Listing Value: <span className="font-medium">${estimatedListingValue.toLocaleString()}</span>
              </div>
            </div>

            <Dialog open={showListingDialog} onOpenChange={setShowListingDialog}>
              <DialogTrigger asChild>
                <Button 
                  disabled={selectedParts.size === 0 || loading}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Create Listings ({selectedParts.size})
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Bulk eBay Listing Configuration</DialogTitle>
                  <DialogDescription>
                    Configure your bulk listing settings for {selectedParts.size} parts
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Pricing Strategy */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Pricing Strategy</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Pricing Method</label>
                        <Select 
                          value={pricingStrategy.pricingMethod} 
                          onValueChange={(value: any) => setPricingStrategy(prev => ({ ...prev, pricingMethod: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="market">Market Price</SelectItem>
                            <SelectItem value="competitive">Competitive</SelectItem>
                            <SelectItem value="fixed">Fixed Price</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Discount %</label>
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          value={pricingStrategy.discountPercentage}
                          onChange={(e) => setPricingStrategy(prev => ({ ...prev, discountPercentage: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Listing Template */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Listing Template</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Return Policy (Days)</label>
                        <Select 
                          value={listingTemplate.returnPolicy} 
                          onValueChange={(value) => setListingTemplate(prev => ({ ...prev, returnPolicy: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="14">14 Days</SelectItem>
                            <SelectItem value="30">30 Days</SelectItem>
                            <SelectItem value="60">60 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Shipping Policy</label>
                        <Select 
                          value={listingTemplate.shippingPolicy} 
                          onValueChange={(value) => setListingTemplate(prev => ({ ...prev, shippingPolicy: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard Shipping</SelectItem>
                            <SelectItem value="expedited">Expedited</SelectItem>
                            <SelectItem value="free">Free Shipping</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Processing Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Processing Settings</h3>
                    
                    <div>
                      <label className="text-sm font-medium">Max Concurrent Listings</label>
                      <Select 
                        value={maxConcurrent.toString()} 
                        onValueChange={(value) => setMaxConcurrent(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 (Safest)</SelectItem>
                          <SelectItem value="3">3 (Recommended)</SelectItem>
                          <SelectItem value="5">5 (Fast)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowListingDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={startBulkListing} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Listings...
                      </>
                    ) : (
                      'Create Listings'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentOperation}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Parts Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Est. Listing Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableParts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectPart(part.id)}
                        className="p-1"
                      >
                        {selectedParts.has(part.id) ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Package className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {part.partsMaster.partName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{part.partsMaster.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{part.condition}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${part.currentValue?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      ${Math.round((part.currentValue || 0) * (1 - pricingStrategy.discountPercentage / 100)).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{part.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {availableParts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No parts available for listing. Please ensure parts have values and are marked as available.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Operations History */}
      {bulkOperations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Bulk Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulkOperations.map((operation) => (
                    <TableRow key={operation.id}>
                      <TableCell className="font-medium">
                        {operation.operationName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(operation.status)}
                          <Badge className={getStatusColor(operation.status)}>
                            {operation.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={operation.progress} className="w-20" />
                          <span className="text-sm">{Math.round(operation.progress)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-green-600">✓ {operation.successfulListings} successful</div>
                          <div className="text-red-600">✗ {operation.failedListings} failed</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(operation.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
