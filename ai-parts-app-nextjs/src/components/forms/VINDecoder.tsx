'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VINDecoderProps, Vehicle, VINDecodeResponse } from '@/types'
import { validateVIN } from '@/lib/utils'
import { Loader2, Car, AlertCircle } from 'lucide-react'

export function VINDecoder({ onVehicleDecoded, className }: VINDecoderProps) {
  const [vin, setVin] = useState('')
  const [loading, setLoading] = useState(false)
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDecode = async () => {
    if (!vin.trim()) {
      setError('Please enter a VIN')
      return
    }

    if (!validateVIN(vin)) {
      setError('Please enter a valid 17-character VIN')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/decode-vin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vin: vin.trim().toUpperCase() }),
      })

      const data = await response.json()
      console.log('VIN decode response:', data)

      if (data.success && data.vehicle) {
        console.log('VIN decode successful, vehicle:', data.vehicle)
        setVehicle(data.vehicle)
        onVehicleDecoded?.(data.vehicle)
        
        // Automatically fetch AI part suggestions after successful VIN decode
        console.log('About to fetch AI suggestions...')
        await fetchAISuggestions(data.vehicle)
      } else {
        console.error('VIN decode failed:', data)
        setError(data.message || 'Failed to decode VIN')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('VIN decode error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const fetchAISuggestions = async (vehicle: Vehicle) => {
    try {
      console.log('Fetching AI part suggestions for:', vehicle)
      
      const requestData = {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin
      }
      
      console.log('Sending request data:', requestData)
      
      const response = await fetch('/api/get-vehicle-part-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
      
      const data = await response.json()
      console.log('Response data:', data)

      if (data.success) {
        console.log(`✅ Generated ${data.categories?.length || 0} part categories with ${data.parts?.length || 0} individual parts`)
        // Trigger a refresh of the parts dashboard
        window.dispatchEvent(new CustomEvent('partsUpdated'))
      } else {
        console.error('AI suggestions failed:', data.message)
        console.error('Full error response:', data)
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDecode()
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            VIN Decoder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter 17-character VIN"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              maxLength={17}
              className="flex-1"
            />
            <Button 
              onClick={handleDecode} 
              disabled={loading || vin.length !== 17}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Decoding...
                </>
              ) : (
                'Decode VIN'
              )}
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {vehicle && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-semibold text-green-800 mb-2">Vehicle Decoded Successfully!</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Make:</span> {vehicle.make}</div>
                <div><span className="font-medium">Model:</span> {vehicle.model}</div>
                <div><span className="font-medium">Year:</span> {vehicle.year}</div>
                <div><span className="font-medium">VIN:</span> {vehicle.vin}</div>
                {vehicle.trimLevel && (
                  <div><span className="font-medium">Trim:</span> {vehicle.trimLevel}</div>
                )}
                {vehicle.engine && (
                  <div><span className="font-medium">Engine:</span> {vehicle.engine}</div>
                )}
                {vehicle.transmission && (
                  <div><span className="font-medium">Transmission:</span> {vehicle.transmission}</div>
                )}
                {vehicle.driveType && (
                  <div><span className="font-medium">Drive Type:</span> {vehicle.driveType}</div>
                )}
                {vehicle.fuelType && (
                  <div><span className="font-medium">Fuel Type:</span> {vehicle.fuelType}</div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
