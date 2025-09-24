'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  ExternalLink, 
  DollarSign,
  Calendar,
  Package,
  TrendingUp,
  Settings,
  CheckCircle,
  AlertCircle,
  Target
} from 'lucide-react'

interface SellOnEbayProps {
  partId?: string
  vehicleId?: string
  partName?: string
  partPrice?: number
  partCondition?: string
  trigger?: React.ReactNode
  className?: string
}

interface ListingTemplate {
  title: string
  description: string
  category: string
  condition: string
  pricing: {
    startingPrice?: number
    buyItNowPrice: number
    reservePrice?: number
  }
  shipping: {
    service: string
    cost: number
    handlingTime: string
  }
  returns: {
    accepted: boolean
    period: string
    description: string
  }
  payment: {
    methods: string[]
    immediatePayment: boolean
  }
}

export function SellOnEbay({ 
  partId, 
  vehicleId, 
  partName,
  partPrice,
  partCondition,
  trigger,
  className 
}: SellOnEbayProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [listingTemplate, setListingTemplate] = useState<ListingTemplate>({
    title: '',
    description: '',
    category: '33615', // Auto Parts category
    condition: partCondition || 'used',
    pricing: {
      buyItNowPrice: partPrice || 0
    },
    shipping: {
      service: 'StandardShipping',
      cost: 15.99,
      handlingTime: '1'
    },
    returns: {
      accepted: true,
      period: '30',
      description: 'Returns accepted within 30 days. Item must be in original condition.'
    },
    payment: {
      methods: ['PayPal', 'CreditCard'],
      immediatePayment: false
    }
  })

  // Initialize title when dialog opens
  useEffect(() => {
    if (isOpen && partName && !listingTemplate.title) {
      setListingTemplate(prev => ({
        ...prev,
        title: `${partName} - Auto Part`
      }))
    }
  }, [isOpen, partName, listingTemplate.title])

  const createEbayListing = async () => {
    if (!partId || !vehicleId) {
      setError('Part ID and Vehicle ID are required')
      return
    }

    if (!listingTemplate.title.trim()) {
      setError('Listing title is required')
      return
    }

    if (!listingTemplate.pricing.buyItNowPrice || listingTemplate.pricing.buyItNowPrice <= 0) {
      setError('Valid price is required')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/ebay/listings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId,
          vehicleId,
          partName,
          price: listingTemplate.pricing.buyItNowPrice,
          condition: listingTemplate.condition,
          description: listingTemplate.description,
          listingTemplate: {
            title: listingTemplate.title,
            category: listingTemplate.category,
            shipping: listingTemplate.shipping,
            returns: listingTemplate.returns,
            payment: listingTemplate.payment
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Successfully created eBay listing! Listing ID: ${data.listingId}`)
        // Close dialog after 3 seconds
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(null)
        }, 3000)
      } else {
        setError(data.message || 'Failed to create eBay listing')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Create listing error:', err)
    } finally {
      setLoading(false)
    }
  }

  const createDraftListing = async () => {
    if (!partId || !vehicleId) {
      setError('Part ID and Vehicle ID are required')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/ebay/listings/create-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId,
          vehicleId,
          partName,
          price: listingTemplate.pricing.buyItNowPrice,
          condition: listingTemplate.condition,
          description: listingTemplate.description,
          listingTemplate: {
            title: listingTemplate.title,
            category: listingTemplate.category,
            shipping: listingTemplate.shipping,
            returns: listingTemplate.returns,
            payment: listingTemplate.payment
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Draft listing created successfully! You can edit it later on eBay.')
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(null)
        }, 3000)
      } else {
        setError(data.message || 'Failed to create draft listing')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Create draft error:', err)
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      <Upload className="h-4 w-4" />
      Sell on eBay
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Sell Part on eBay
          </DialogTitle>
          <DialogDescription>
            Create an eBay listing for your part: {partName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
              <CheckCircle className="h-4 w-4 inline mr-2" />
              {success}
            </div>
          )}

          {/* Listing Configuration */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Listing Title</label>
                  <Input
                    value={listingTemplate.title}
                    onChange={(e) => setListingTemplate(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter listing title..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={listingTemplate.description}
                    onChange={(e) => setListingTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the part condition, fitment, etc..."
                    className="w-full mt-1 p-3 border rounded-md resize-none h-24"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Condition</label>
                  <Select 
                    value={listingTemplate.condition} 
                    onValueChange={(value) => setListingTemplate(prev => ({ ...prev, condition: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                      <SelectItem value="refurbished">Refurbished</SelectItem>
                      <SelectItem value="for-parts">For Parts/Not Working</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Buy It Now Price</label>
                  <Input
                    type="number"
                    value={listingTemplate.pricing.buyItNowPrice}
                    onChange={(e) => setListingTemplate(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, buyItNowPrice: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Shipping Cost</label>
                  <Input
                    type="number"
                    value={listingTemplate.shipping.cost}
                    onChange={(e) => setListingTemplate(prev => ({
                      ...prev,
                      shipping: { ...prev.shipping, cost: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Handling Time</label>
                  <Select 
                    value={listingTemplate.shipping.handlingTime} 
                    onValueChange={(value) => setListingTemplate(prev => ({
                      ...prev,
                      shipping: { ...prev.shipping, handlingTime: value }
                    }))}
                  >
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
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button 
              variant="outline" 
              onClick={createDraftListing}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Create Draft
            </Button>
            
            <Button 
              onClick={createEbayListing}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              List on eBay
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
