'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Truck, 
  Package, 
  DollarSign, 
  Clock, 
  MapPin,
  Calculator,
  Loader2,
  ExternalLink
} from 'lucide-react'

interface ShippingOption {
  service: string
  cost: number
  estimatedDays: number
  carrier: 'USPS' | 'FedEx' | 'UPS'
  description: string
}

interface ShippingCalculatorProps {
  partName: string
  partCategory: string
  partPrice?: number
  onShippingCalculated?: (shippingInfo: any) => void
  className?: string
}

export function ShippingCalculator({ 
  partName, 
  partCategory, 
  partPrice = 0,
  onShippingCalculated,
  className 
}: ShippingCalculatorProps) {
  const [zipCode, setZipCode] = useState('90210')
  const [country, setCountry] = useState('US')
  const [loading, setLoading] = useState(false)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [recommendedOption, setRecommendedOption] = useState<ShippingOption | null>(null)
  const [totalCostInfo, setTotalCostInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const calculateShipping = async () => {
    if (!zipCode || zipCode.length < 5) {
      setError('Please enter a valid ZIP code')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partName,
          partCategory,
          destination: {
            zipCode,
            country,
            state: getStateFromZip(zipCode)
          },
          partPrice,
          freeShippingThreshold: 100
        })
      })

      const data = await response.json()

      if (data.success) {
        setShippingOptions(data.data.shippingOptions)
        setRecommendedOption(data.data.recommendedOption)
        setTotalCostInfo(data.data.totalCostInfo)
        
        if (onShippingCalculated) {
          onShippingCalculated(data.data)
        }
      } else {
        setError(data.message || 'Failed to calculate shipping')
      }
    } catch (err) {
      setError('Failed to calculate shipping costs')
      console.error('Shipping calculation error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-calculate when component mounts or key props change
  useEffect(() => {
    if (partName && partCategory) {
      calculateShipping()
    }
  }, [partName, partCategory, partPrice])

  const getStateFromZip = (zip: string): string => {
    // Simple ZIP to state mapping (first digit)
    const firstDigit = parseInt(zip[0])
    const stateMap: Record<number, string> = {
      0: 'NJ', 1: 'NY', 2: 'FL', 3: 'TX', 4: 'CA',
      5: 'IL', 6: 'WA', 7: 'CO', 8: 'CA', 9: 'CA'
    }
    return stateMap[firstDigit] || 'CA'
  }

  const getCarrierColor = (carrier: string) => {
    switch (carrier) {
      case 'USPS': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'FedEx': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'UPS': return 'bg-brown-100 text-brown-800 border-brown-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-600" />
          Shipping Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Destination Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="zipCode">Destination ZIP Code</Label>
            <Input
              id="zipCode"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="90210"
              maxLength={5}
            />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Calculate Button */}
        <Button 
          onClick={calculateShipping} 
          disabled={loading || !zipCode}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Shipping
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Shipping Options */}
        {shippingOptions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Shipping Options</h4>
            
            {shippingOptions.map((option, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg ${
                  recommendedOption?.service === option.service 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getCarrierColor(option.carrier)}>
                      {option.carrier}
                    </Badge>
                    <span className="font-medium text-sm">{option.service}</span>
                    {recommendedOption?.service === option.service && (
                      <Badge variant="default" className="bg-green-600">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {formatCurrency(option.cost)}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {option.estimatedDays} day{option.estimatedDays !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1">{option.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Total Cost Summary */}
        {totalCostInfo && partPrice > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Total Cost Breakdown</h4>
            <div className="flex justify-between text-sm">
              <span>Item Price:</span>
              <span>{formatCurrency(totalCostInfo.itemPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping:</span>
              <span className={totalCostInfo.freeShipping ? 'text-green-600 font-medium' : ''}>
                {totalCostInfo.freeShipping ? 'FREE' : formatCurrency(totalCostInfo.shippingCost)}
              </span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>{formatCurrency(totalCostInfo.totalCost)}</span>
            </div>
            {totalCostInfo.freeShipping && (
              <p className="text-xs text-green-600">
                🎉 Free shipping on orders over $100!
              </p>
            )}
          </div>
        )}

        {/* Shipping Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span>Part: {partName} ({partCategory})</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>Shipping to: {zipCode}, {country}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
