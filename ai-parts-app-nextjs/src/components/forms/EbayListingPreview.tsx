'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  ExternalLink, 
  DollarSign, 
  Clock, 
  Truck, 
  Shield, 
  Star,
  ImageIcon,
  Copy,
  CheckCircle
} from 'lucide-react'

interface EbayListingPreviewProps {
  template: {
    title: string
    description: string
    price: number
    condition: string
    category: string
    keywords: string[]
    images: string[]
    vehicleInfo: {
      year: number
      make: string
      model: string
      engine?: string
      drivetrain?: string
      transmission?: string
    }
  }
  onEdit?: () => void
  onPublish?: () => void
  trigger?: React.ReactNode
  className?: string
}

export function EbayListingPreview({
  template,
  onEdit,
  onPublish,
  trigger,
  className
}: EbayListingPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price)
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      <ExternalLink className="h-4 w-4" />
      Preview
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
            <ExternalLink className="h-5 w-5" />
            eBay Listing Preview
          </DialogTitle>
          <DialogDescription>
            How your listing will appear on eBay
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* eBay-style listing card */}
          <Card className="border-2 border-orange-200 bg-orange-50/30">
            <CardContent className="p-0">
              {/* Header */}
              <div className="bg-orange-600 text-white p-3 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">eBay</span>
                  <Badge variant="secondary" className="bg-white text-orange-600">
                    Live Preview
                  </Badge>
                </div>
              </div>

              <div className="p-4">
                {/* Title */}
                <div className="mb-4">
                  <h1 className="text-xl font-semibold text-gray-900 mb-2">
                    {template.title}
                  </h1>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {template.condition.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Compatible with: {template.vehicleInfo.year} {template.vehicleInfo.make} {template.vehicleInfo.model}
                    </span>
                  </div>
                </div>

                {/* Price and Actions */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {formatPrice(template.price)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Buy It Now price
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white mb-2">
                      Buy It Now
                    </Button>
                    <div className="text-sm text-gray-500">
                      Free shipping
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Photos
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {template.images.length > 0 ? (
                      template.images.map((image, index) => (
                        <div key={index} className="aspect-square bg-gray-100 rounded border flex items-center justify-center">
                          <img 
                            src={image} 
                            alt={`Part image ${index + 1}`}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="aspect-square bg-gray-100 rounded border flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                        <div className="aspect-square bg-gray-100 rounded border flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                        <div className="aspect-square bg-gray-100 rounded border flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                        <div className="aspect-square bg-gray-100 rounded border flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {template.description}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Vehicle Compatibility */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Vehicle Compatibility</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">Year</div>
                      <div className="text-blue-700">{template.vehicleInfo.year}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">Make</div>
                      <div className="text-blue-700">{template.vehicleInfo.make}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">Model</div>
                      <div className="text-blue-700">{template.vehicleInfo.model}</div>
                    </div>
                    {template.vehicleInfo.engine && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-blue-900">Engine</div>
                        <div className="text-blue-700">{template.vehicleInfo.engine}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping & Returns */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Truck className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <div className="text-sm font-medium">Shipping</div>
                    <div className="text-xs text-gray-600">Free Standard</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                    <div className="text-sm font-medium">Handling</div>
                    <div className="text-xs text-gray-600">1 business day</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Shield className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <div className="text-sm font-medium">Returns</div>
                    <div className="text-xs text-gray-600">30 days</div>
                  </div>
                </div>

                {/* Keywords */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {template.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Seller Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                        A
                      </div>
                      <div>
                        <div className="font-medium">AutoPartsPro</div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1">4.9 (1,234)</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <div>99.8% Positive feedback</div>
                      <div>Member since 2020</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Copy Actions */}
          <div className="mt-4 flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={() => handleCopyToClipboard(template.title)}
              className="flex items-center gap-2"
            >
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy Title
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCopyToClipboard(template.description)}
              className="flex items-center gap-2"
            >
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copy Description
            </Button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                Edit Template
              </Button>
            )}
            {onPublish && (
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                Publish to eBay
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
