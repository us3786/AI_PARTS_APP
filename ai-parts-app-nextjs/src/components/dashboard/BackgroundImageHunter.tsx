'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, Image, CheckCircle, AlertCircle } from 'lucide-react'

interface BackgroundImageHunterProps {
  vehicleId: string
  className?: string
}

interface HuntingStatus {
  totalParts: number
  partsWithImages: number
  partsNeedingImages: number
  completionPercentage: number
}

export function BackgroundImageHunter({ vehicleId, className }: BackgroundImageHunterProps) {
  const [status, setStatus] = useState<HuntingStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [hunting, setHunting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/background/image-hunter?vehicleId=${vehicleId}`)
      const data = await response.json()
      
      if (data.success) {
        setStatus(data)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Failed to fetch image hunting status')
      console.error('Status fetch error:', err)
    }
  }

  const startImageHunting = async () => {
    setHunting(true)
    setError(null)
    
    try {
      const response = await fetch('/api/background/image-hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicleId,
          batchSize: 5
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log(`🎉 Background image hunting started: ${data.processed} parts processed`)
        // Refresh status after hunting
        setTimeout(() => fetchStatus(), 2000)
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Failed to start background image hunting')
      console.error('Hunting start error:', err)
    } finally {
      setHunting(false)
    }
  }

  useEffect(() => {
    if (vehicleId) {
      fetchStatus()
      // Refresh status every 30 seconds
      const interval = setInterval(fetchStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [vehicleId])

  if (!status) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading image hunting status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isComplete = status.completionPercentage === 100
  const hasImages = status.partsWithImages > 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Background Image Hunter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{status.totalParts}</div>
              <div className="text-sm text-gray-500">Total Parts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{status.partsWithImages}</div>
              <div className="text-sm text-gray-500">With Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{status.partsNeedingImages}</div>
              <div className="text-sm text-gray-500">Need Images</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Image Collection Progress</span>
              <span>{status.completionPercentage}%</span>
            </div>
            <Progress value={status.completionPercentage} className="h-2" />
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            {isComplete ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : hasImages ? (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Image className="h-3 w-3 mr-1" />
                In Progress
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                No Images
              </Badge>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          {!isComplete && (
            <div className="flex justify-center">
              <Button 
                onClick={startImageHunting}
                disabled={hunting || loading}
                className="w-full"
              >
                {hunting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Hunting Images...
                  </>
                ) : (
                  <>
                    <Image className="h-4 w-4 mr-2" />
                    Start Image Hunting
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Info Text */}
          <div className="text-xs text-gray-500 text-center">
            {isComplete ? (
              "All parts have images. UI will display from database only."
            ) : (
              "Background service hunts for images and stores them in database. UI reads from database only."
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
