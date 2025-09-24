'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
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
  Loader2, 
  Search, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Image as ImageIcon,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Target,
  Eye,
  Settings,
  Info,
  X
} from 'lucide-react'
import { ImageManager } from '@/components/forms/ImageManager'

interface PriceResearchDashboardProps {
  vehicleId: string
  className?: string
}

interface PriceResearchResult {
  partId: string
  partName: string
  success: boolean
  sources: number
  category?: string
  cached?: boolean
  marketAnalysis: {
    averagePrice: number
    minPrice: number
    maxPrice: number
    recommendedPrice: number
    marketTrend: string
    confidence: number
    sourceCount: number
    referenceListings: ReferenceListing[]
    anomalyDetected: boolean
    finalMean?: number
    priceEvaluation: {
      method: string
      sampleSize: number
      outliersRemoved: number
      finalMean: number
      deviationFromMean: number
      isWithinRange: boolean
    }
  }
  recommendedPrice?: number
  error?: string
  imageHunting?: {
    success: boolean
    totalFound: number
    totalSaved: number
    sources: string[]
  }
}

interface ReferenceListing {
  id: string
  title: string
  price: number
  condition: string
  seller: string
  url: string
  imageUrl?: string
  isOutlier: boolean
  listingDate: string
  source?: string
  searchQuery?: string
}

interface ResearchSummary {
  totalParts: number
  successfulParts: number
  failedParts: number
  totalSources: number
  averageSources: number
  averagePrice: number
  totalValue: number
}

export function PriceResearchDashboard({ vehicleId, className }: PriceResearchDashboardProps) {
  const [researchResults, setResearchResults] = useState<PriceResearchResult[]>([])
  const [summary, setSummary] = useState<ResearchSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressDetails, setProgressDetails] = useState<{current: number, total: number, cached: number}>({current: 0, total: 0, cached: 0})
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [currentOperation, setCurrentOperation] = useState<string>('')
  const [viewingPriceDetails, setViewingPriceDetails] = useState<PriceResearchResult | null>(null)
  const [viewingSettings, setViewingSettings] = useState<PriceResearchResult | null>(null)
  const [forceRefresh, setForceRefresh] = useState(false)
  const [viewingHistory, setViewingHistory] = useState(false)
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [imageHuntingCancelled, setImageHuntingCancelled] = useState(false)
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({})
  const [bulkPriceUpdate, setBulkPriceUpdate] = useState<number | null>(null)
  const [partImages, setPartImages] = useState<Record<string, any[]>>({})

  const fetchAvailableCategories = async () => {
    try {
      const response = await fetch(`/api/parts/populate-inventory?vehicleId=${vehicleId}`)
      const data = await response.json()
      
      if (data.success && data.categories) {
        setAvailableCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    if (vehicleId) {
      fetchAvailableCategories()
      fetchPriceHistory()
      loadExistingResearchData()
    }
  }, [vehicleId])

  const loadExistingResearchData = async () => {
    try {
      // Try to load any existing price research data from the database
      const response = await fetch(`/api/price-research/history?vehicleId=${vehicleId}`)
      const data = await response.json()
      
      if (data.success && data.history && data.history.length > 0) {
        // Convert history data to research results format
        const results = data.history.map((item: any) => ({
          partId: item.id,
          partName: item.partName,
          success: true,
          sources: item.sources || 1,
          marketAnalysis: {
            averagePrice: item.averagePrice || 0,
            minPrice: item.minPrice || item.averagePrice || 0,
            maxPrice: item.maxPrice || item.averagePrice || 0,
            recommendedPrice: item.averagePrice || 0,
            marketTrend: item.marketTrend || 'stable',
            confidence: item.confidence || 75,
            sourceCount: item.sources || 1,
            referenceListings: item.marketAnalysis?.referenceListings || item.marketAnalysis?.allSources || [],
            anomalyDetected: false,
            priceEvaluation: item.marketAnalysis || {}
          },
          recommendedPrice: item.averagePrice || 0
        }))

        // Calculate summary
        const totalSources = results.reduce((sum: number, r: any) => sum + (r.sources || 0), 0)
        const totalValue = results.reduce((sum: number, r: any) => sum + (r.marketAnalysis?.averagePrice || 0), 0)

        const summary = {
          totalParts: results.length,
          successfulParts: results.length,
          failedParts: 0,
          totalSources: totalSources,
          averageSources: results.length > 0 ? Math.round(totalSources / results.length) : 0,
          averagePrice: results.length > 0 ? Math.round(totalValue / results.length) : 0,
          totalValue: Math.round(totalValue)
        }

        setResearchResults(results)
        setSummary(summary)

        console.log('✅ Loaded existing research data')
        // Note: Removed automatic image fetching to prevent browser hanging
      }
    } catch (error) {
      console.error('Error loading existing research data:', error)
    }
  }

  const fetchPriceHistory = async () => {
    try {
      const response = await fetch(`/api/price-research/history?vehicleId=${vehicleId}`)
      const data = await response.json()
      
      if (data.success) {
        setPriceHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error fetching price history:', error)
    }
  }

  const fetchPartImages = async (partId: string) => {
    try {
      console.log('🔍 Fetching images for partId:', partId)
      const response = await fetch(`/api/image-hunting?partId=${partId}`)
      const data = await response.json()
      
      console.log('📸 Image API response for partId', partId, ':', data)
      
      if (data.success && data.images && data.images.length > 0) {
        setPartImages(prev => ({
          ...prev,
          [partId]: data.images
        }))
        console.log('✅ Images loaded for partId', partId, ':', data.images.length, 'images')
      } else {
        console.log('⚠️ No images found for partId', partId, 'Response:', data)
        // Don't show error messages for missing parts - this is normal for new parts
      }
    } catch (error) {
      console.error('❌ Error fetching part images:', error)
    }
  }

  const startPriceResearch = async () => {
    setLoading(true)
    setProgress(0)
    setProgressDetails({current: 0, total: 0, cached: 0})
    setResearchResults([])
    setCurrentOperation('Starting price research...')

    try {
      // Use the new bulk price research API with smart caching
      const response = await fetch('/api/price-research/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
          vehicleId: vehicleId,
          partIds: [], // Empty array means research all parts
          forceRefresh: forceRefresh
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to complete price research')
      }

      const { results, cachedResults, newResults, errors, progress: progressData } = data
      
      // Update progress details
      setProgressDetails({
        current: progressData.processed,
        total: progressData.total,
        cached: progressData.cached
      })

      setCurrentOperation(`Research completed! ${cachedResults.length} cached, ${newResults.length} new, ${errors.length} failed`)

      // Convert API results to component format
      const formattedResults: PriceResearchResult[] = results.map((result: any) => {
        console.log('🔍 Debug - Result data for', result.partName, ':', {
          marketAnalysis: result.marketAnalysis,
          referenceListings: result.marketAnalysis?.referenceListings,
          referenceListingsLength: result.marketAnalysis?.referenceListings?.length || 0
        })
        
        return {
          partId: result.partId,
          partName: result.partName,
          success: result.success,
          cached: result.cached || false,
          sources: result.marketAnalysis?.sourceCount || 0,
          category: result.marketAnalysis?.category,
          marketAnalysis: result.marketAnalysis,
          researchDate: result.researchDate
        }
      })

      const successfulResults = formattedResults.filter(r => r.success)
      const failedResults = formattedResults.filter(r => !r.success)

      // Calculate summary
      const totalValue = successfulResults.reduce((sum, result) => {
        return sum + (result.marketAnalysis?.averagePrice || 0)
      }, 0)

        const summary: ResearchSummary = {
        totalParts: results.length,
        successfulParts: successfulResults.length,
          failedParts: failedResults.length,
          totalSources: results.reduce((sum: number, r: any) => sum + (r.sources || 0), 0),
          averageSources: results.length > 0 ? Math.round(results.reduce((sum: number, r: any) => sum + (r.sources || 0), 0) / results.length) : 0,
        averagePrice: successfulResults.length > 0 ? Math.round(totalValue / successfulResults.length) : 0,
        totalValue: Math.round(totalValue)
      }

      setResearchResults(formattedResults)
      setSummary(summary)
      setProgress(100)
      
      // Show detailed completion message
      const cachedCount = cachedResults.length
      const newCount = newResults.length
      const failedCount = errors.length
      
      if (cachedCount > 0 && newCount > 0) {
        setCurrentOperation(`✅ Complete! ${cachedCount} from cache, ${newCount} researched, ${failedCount} failed`)
      } else if (cachedCount > 0) {
        setCurrentOperation(`✅ Complete! All ${cachedCount} parts loaded from cache`)
      } else {
        setCurrentOperation(`✅ Complete! ${newCount} parts researched, ${failedCount} failed`)
      }

    } catch (error) {
      console.error('Price research error:', error)
      setCurrentOperation('Price research failed')
    } finally {
      setLoading(false)
    }
  }

  const startImageHunting = async () => {
    setLoading(true)
    setProgress(0)
    setImageHuntingCancelled(false)
    setCurrentOperation('Starting image hunting...')

    try {
      const response = await fetch(`/api/parts/populate-inventory?vehicleId=${vehicleId}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error('Failed to fetch parts')
      }

      const allParts = data.inventory || []
      const partsToHunt = selectedCategories.length > 0
        ? allParts.filter((part: any) => selectedCategories.includes(part.partsMaster.category))
        : allParts

      if (partsToHunt.length === 0) {
        setCurrentOperation('No parts found for image hunting')
        setLoading(false)
        return
      }

      setCurrentOperation(`Hunting images for ${partsToHunt.length} parts...`)

      // Process image hunting in batches
      const batchSize = 5
      const batches = []
      for (let i = 0; i < partsToHunt.length; i += batchSize) {
        batches.push(partsToHunt.slice(i, i + batchSize))
      }

      let processedBatches = 0
      const imageResults = []

      for (const batch of batches) {
        // Check if cancelled before processing each batch
        if (imageHuntingCancelled) {
          setCurrentOperation('Image hunting cancelled by user')
          break
        }

        const batchPromises = batch.map(async (part: any) => {
          try {
            const imageResponse = await fetch('/api/image-hunting', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                partId: part.partsMasterId,
                partName: part.partsMaster.partName,
                make: data.vehicle?.make,
                model: data.vehicle?.model,
                year: data.vehicle?.year,
                category: part.partsMaster.category,
                subCategory: part.partsMaster.subCategory,
                maxImages: 5
              })
            })

            const imageData = await imageResponse.json()
            return {
              partName: part.partsMaster.partName,
              success: imageData.success,
              imagesFound: imageData.totalFound || 0,
              imagesSaved: imageData.totalSaved || 0,
              sources: imageData.sources || []
            }
          } catch (error) {
            return {
              partName: part.partsMaster.partName,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        })

        const batchResults = await Promise.all(batchPromises)
        imageResults.push(...batchResults)

        processedBatches++
        setProgress((processedBatches / batches.length) * 100)
        setCurrentOperation(`Processed ${processedBatches}/${batches.length} batches...`)

        // Delay between batches
        if (processedBatches < batches.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      setCurrentOperation(`Image hunting completed! Found images for ${imageResults.filter(r => r.success).length} parts`)
      setProgress(100)

    } catch (error) {
      console.error('Image hunting error:', error)
      setCurrentOperation('Image hunting failed')
    } finally {
      setLoading(false)
    }
  }

  const cancelImageHunting = () => {
    setImageHuntingCancelled(true)
    setCurrentOperation('Cancelling image hunting...')
  }

  const handlePriceEdit = (partId: string, newPrice: number) => {
    setEditingPrices(prev => ({
      ...prev,
      [partId]: newPrice
    }))
  }

  const saveIndividualPrice = async (partId: string, newPrice: number) => {
    try {
      const response = await fetch('/api/parts/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'update',
          partIds: [partId],
          vehicleId: vehicleId,
          additionalData: {
            currentValue: newPrice
          }
        })
      })

      const data = await response.json()
      if (data.success) {
        // Update local state
        setResearchResults(prev => prev.map(result => 
          result.partId === partId ? {
            ...result,
            recommendedPrice: newPrice,
            marketAnalysis: {
              ...result.marketAnalysis,
              averagePrice: newPrice,
              recommendedPrice: newPrice
            }
          } : result
        ))
        
        // Remove from editing state
        setEditingPrices(prev => {
          const newState = { ...prev }
          delete newState[partId]
          return newState
        })
      } else {
        alert('Failed to update price: ' + data.message)
      }
    } catch (error) {
      console.error('Price update error:', error)
      alert('Error updating price')
    }
  }

  const handleBulkPriceUpdate = async () => {
    if (bulkPriceUpdate === null) return

    try {
      const response = await fetch('/api/parts/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'update',
          partIds: researchResults.map(r => r.partId),
          vehicleId: vehicleId,
          additionalData: {
            currentValue: bulkPriceUpdate
          }
        })
      })

      const data = await response.json()
      if (data.success) {
        // Update local state
        setResearchResults(prev => prev.map(result => ({
          ...result,
          recommendedPrice: bulkPriceUpdate,
          marketAnalysis: {
            ...result.marketAnalysis,
            averagePrice: bulkPriceUpdate,
            recommendedPrice: bulkPriceUpdate
          }
        })))
        
        setEditingPrices({})
        setBulkPriceUpdate(null)
        alert(`Successfully updated prices for ${data.updatedCount} parts`)
      } else {
        alert('Failed to update prices: ' + data.message)
      }
    } catch (error) {
      console.error('Bulk price update error:', error)
      alert('Error updating prices')
    }
  }

  const syncPricesToInventory = async () => {
    try {
      // Check if we have research results to sync
      if (!researchResults || researchResults.length === 0) {
        alert('No price research results to sync. Please run price research first.')
        return
      }

      console.log(`🔄 Starting bulk price sync for ${researchResults.length} parts...`)

      // Batch the updates to prevent resource exhaustion
      const batchSize = 50 // Process 50 parts at a time
      const batches = []
      
      for (let i = 0; i < researchResults.length; i += batchSize) {
        const batch = researchResults.slice(i, i + batchSize)
        batches.push(batch)
      }

      let totalSuccessCount = 0
      let totalErrorCount = 0

      // Process batches sequentially to avoid overwhelming the server
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} parts)...`)

        // Process each part in the batch individually (but with rate limiting)
        const batchPromises = batch.map(async (result) => {
          const price = result.recommendedPrice || result.marketAnalysis.averagePrice || 0
          const response = await fetch('/api/parts/bulk-operations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operation: 'update',
              partIds: [result.partId],
              vehicleId: vehicleId,
              additionalData: {
                currentValue: price
              }
            })
          })
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          return response.json()
        })

        try {
          const batchResults = await Promise.all(batchPromises)
          const batchSuccessCount = batchResults.filter(r => r.success).length
          totalSuccessCount += batchSuccessCount
          totalErrorCount += (batch.length - batchSuccessCount)
          console.log(`✅ Batch ${batchIndex + 1} completed: ${batchSuccessCount}/${batch.length} parts updated`)
        } catch (error) {
          console.error(`❌ Batch ${batchIndex + 1} error:`, error)
          totalErrorCount += batch.length
        }

        // Small delay between batches to prevent overwhelming the server
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      const successCount = totalSuccessCount
      
      if (successCount > 0) {
        alert(`Successfully synced prices for ${successCount} out of ${researchResults.length} parts to inventory`)
      } else {
        alert('Failed to sync any prices to inventory')
      }
    } catch (error) {
      console.error('Price sync error:', error)
      alert(`Error syncing prices: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'volatile':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'stable':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'moderate':
        return <BarChart3 className="h-4 w-4 text-blue-500" />
      default:
        return <Target className="h-4 w-4 text-gray-500" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800'
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Price Research & Image Hunting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Categories (leave empty for all):</label>
            <Select onValueChange={(value) => setSelectedCategories(value === "all" ? [] : [value])}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={startPriceResearch}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 border-0"
            >
              {loading && currentOperation.includes('research') ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <Search className="h-5 w-5 mr-3" />
              )}
              <span className="text-lg">🔍 Research Prices</span>
            </Button>
            
            <Button
              onClick={() => setForceRefresh(!forceRefresh)}
              disabled={loading}
              variant={forceRefresh ? "default" : "outline"}
              className={`px-4 py-3 font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-300 ${
                forceRefresh 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                  : 'border-2 border-orange-500 text-orange-600 hover:bg-orange-50'
              }`}
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${forceRefresh ? 'animate-spin' : ''}`} />
              <span className="text-lg">
                {forceRefresh ? '🔄 Force Refresh' : '💾 Use Cache'}
              </span>
            </Button>
            
            <Button
              onClick={loading && currentOperation.includes('hunting') ? cancelImageHunting : startImageHunting}
              disabled={loading && !currentOperation.includes('hunting')}
              variant="outline"
              className="flex-1 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
            >
              {loading && currentOperation.includes('hunting') ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Hunt Images
                </>
              )}
            </Button>

            <Button
              onClick={() => {
                // Hunt images for all research results
                researchResults.forEach(result => {
                  if (result.success) {
                    fetchPartImages(result.partId)
                  }
                })
              }}
              disabled={researchResults.length === 0}
              variant="outline"
              className="transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
              title="Hunt images for all researched parts"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Hunt All
            </Button>

            <Button
              onClick={() => setViewingHistory(true)}
              variant="outline"
              className="transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              History
            </Button>

            <Button
              onClick={() => {
                // Debug: Test image fetching for all research results
                researchResults.forEach(result => {
                  console.log('Testing image fetch for partId:', result.partId)
                  fetchPartImages(result.partId)
                })
              }}
              variant="outline"
              className="transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
              title="Debug: Test image fetching"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Test Images
            </Button>
          </div>

          {/* Progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentOperation}</span>
                <span>
                  {progressDetails.total > 0 ? (
                    `${progressDetails.current}/${progressDetails.total} parts`
                  ) : (
                    `${Math.round(progress)}%`
                  )}
                </span>
              </div>
              <Progress value={progress} className="w-full" />
              {progressDetails.cached > 0 && (
                <div className="text-xs text-green-600">
                  📦 {progressDetails.cached} parts loaded from cache
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Parts Researched</p>
                  <p className="text-2xl font-bold">{summary.successfulParts}/{summary.totalParts}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Sources</p>
                  <p className="text-2xl font-bold">{summary.averageSources}</p>
                </div>
                <Search className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Price</p>
                  <p className="text-2xl font-bold">${summary.averagePrice.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold">${summary.totalValue.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {researchResults.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Price Research Data</h3>
            <p className="text-gray-500 mb-4">
              Start by researching prices for your parts to see market analysis and recommendations.
            </p>
            <Button 
              onClick={startPriceResearch} 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-110 active:scale-95 transition-all duration-300 border-0 text-lg"
            >
              <Search className="h-6 w-6 mr-3" />
              🚀 Start Price Research
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bulk Price Update Controls */}
      {researchResults.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Bulk Price Update
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter new price for all parts"
                    value={bulkPriceUpdate || ''}
                    onChange={(e) => setBulkPriceUpdate(parseFloat(e.target.value) || null)}
                    className="max-w-xs"
                  />
                  <Button
                    onClick={handleBulkPriceUpdate}
                    disabled={bulkPriceUpdate === null}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    Update All Prices
                  </Button>
                  <Button
                    onClick={syncPricesToInventory}
                    disabled={researchResults.length === 0}
                    className="bg-green-500 hover:bg-green-600 text-white"
                    title="Sync all researched prices to parts inventory"
                  >
                    Sync to Inventory
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                This will update the current value for all {researchResults.length} parts
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Research Results Table */}
      {researchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Price Research Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Name</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Market Analysis</TableHead>
                    <TableHead>Recommended Price</TableHead>
                    <TableHead>Sample Links</TableHead>
                    <TableHead>Market Trend</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Sources</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {researchResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {result.partName}
                      </TableCell>
                      <TableCell>
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {(() => {
                            // First try to get image from part images (hunted images)
                            const partImagesList = partImages[result.partId] || []
                            const huntedImage = partImagesList[0]
                            
                            // Then try reference listings image
                            const referenceImage = result.marketAnalysis.referenceListings?.[0]?.imageUrl
                            
                            // Debug logging (reduced to prevent performance issues)
                            if (partImagesList.length > 0 && Math.random() < 0.01) { // Only log 1% of the time
                              console.log('Found images for partId', result.partId, ':', partImagesList.length, 'images')
                            }
                            
                            // Use hunted image if available, otherwise reference image, otherwise placeholder
                            const imageUrl = huntedImage?.url || referenceImage
                            
                            if (imageUrl) {
                              return (
                                <img 
                                  src={imageUrl} 
                                  alt={result.partName}
                                  className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => {
                                    // Navigate to vehicle photos section for multi-image view
                                    const vehiclePhotosSection = document.getElementById('vehicle-photos')
                                    if (vehiclePhotosSection) {
                                      vehiclePhotosSection.scrollIntoView({ behavior: 'smooth' })
                                    }
                                  }}
                                  onError={(e) => {
                                    // If image fails to load, show placeholder
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                  }}
                                  title="Click to view all images for this vehicle"
                                />
                              )
                            }
                            
                            return (
                              <div className="text-gray-400 text-xs text-center">
                                <div className="mb-1">📷</div>
                                <div>No Image</div>
                                <button 
                                  onClick={() => fetchPartImages(result.partId)}
                                  className="text-blue-500 hover:text-blue-700 text-xs underline mt-1"
                                  title="Hunt for images"
                                >
                                  Hunt
                                </button>
                              </div>
                            )
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div 
                            className="cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                            onClick={() => setViewingPriceDetails(result)}
                            title="Click to view reference prices"
                          >
                            Avg: ${result.marketAnalysis.averagePrice}
                          </div>
                          <div className="text-gray-500">
                            ${result.marketAnalysis.minPrice} - ${result.marketAnalysis.maxPrice}
                          </div>
                          {result.marketAnalysis.anomalyDetected && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              Anomaly Detected
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={editingPrices[result.partId] ?? result.recommendedPrice ?? 0}
                            onChange={(e) => handlePriceEdit(result.partId, parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-sm font-medium text-green-600"
                            title="Click to edit price"
                          />
                          {editingPrices[result.partId] !== undefined && editingPrices[result.partId] !== result.recommendedPrice && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => saveIndividualPrice(result.partId, editingPrices[result.partId])}
                              className="h-8 px-2 bg-green-500 hover:bg-green-600 text-white border-0"
                              title="Save price change"
                            >
                              ✓
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingPriceDetails(result)}
                            title="View price evaluation details"
                            className="p-1 h-6 w-6"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            const listings = result.marketAnalysis.referenceListings || []
                            
                            if (listings.length === 0) {
                              return (
                                <div className="text-xs text-gray-500">
                                  No links available
                                </div>
                              )
                            }
                            
                            return (
                              <>
                                {listings.slice(0, 3).map((listing: any, idx: number) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(listing.url, '_blank')}
                                    className="text-xs px-2 py-1 h-auto bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300 transition-all duration-200 hover:scale-105"
                                  >
                                    {listing.source}
                                  </Button>
                                ))}
                                {listings.length > 3 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setViewingPriceDetails(result)}
                                    className="text-xs px-2 py-1 h-auto bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-300 transition-all duration-200 hover:scale-105"
                                  >
                                    +{listings.length - 3} more
                                  </Button>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(result.marketAnalysis.marketTrend)}
                          <span className="text-sm">{result.marketAnalysis.marketTrend}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getConfidenceColor(result.marketAnalysis.confidence)}>
                          {result.marketAnalysis.confidence}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {result.sources} sources
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                          {result.cached && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                              📦 Cached
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setViewingPriceDetails(result)}
                            title="View price details and reference listings"
                            className="transition-all duration-200 hover:scale-110 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Open all sample links in new tabs
                              (result.marketAnalysis.referenceListings || []).forEach((listing: any) => {
                                window.open(listing.url, '_blank')
                              })
                            }}
                            title="Open all sample links in new tabs"
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 hover:border-purple-300 transition-all duration-200 hover:scale-110 active:scale-95"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Samples
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setViewingSettings(result)}
                            title="View price evaluation settings"
                            className="transition-all duration-200 hover:scale-110 hover:bg-green-50 hover:text-green-600 active:scale-95"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Details Modal */}
      {viewingPriceDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Price Analysis Details</h3>
              <Button variant="ghost" onClick={() => setViewingPriceDetails(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Part Info */}
              <div className="border-b pb-4">
                <h4 className="text-xl font-bold">{viewingPriceDetails.partName}</h4>
                <p className="text-gray-600">Category: {viewingPriceDetails.category}</p>
              </div>

              {/* Price Evaluation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ${viewingPriceDetails.marketAnalysis.finalMean?.toLocaleString() || viewingPriceDetails.marketAnalysis.averagePrice.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Final Mean Price</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {viewingPriceDetails.marketAnalysis.priceEvaluation?.sampleSize || viewingPriceDetails.sources}
                      </div>
                      <div className="text-sm text-gray-600">Sample Size</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {viewingPriceDetails.marketAnalysis.priceEvaluation?.outliersRemoved || 0}
                      </div>
                      <div className="text-sm text-gray-600">Outliers Removed</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Price Evaluation Method */}
              <div>
                <h5 className="font-semibold mb-2">Price Evaluation Method</h5>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Method:</strong> {viewingPriceDetails.marketAnalysis.priceEvaluation?.method || 'Statistical Analysis with Anomaly Detection'}</p>
                  <p><strong>Deviation from Mean:</strong> {viewingPriceDetails.marketAnalysis.priceEvaluation?.deviationFromMean?.toFixed(2) || '0'}%</p>
                  <p><strong>Within Range:</strong> {viewingPriceDetails.marketAnalysis.priceEvaluation?.isWithinRange ? 'Yes' : 'No'}</p>
                  <p><strong>Anomaly Detected:</strong> {viewingPriceDetails.marketAnalysis.anomalyDetected ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {/* Part Images */}
              {partImages[viewingPriceDetails.partId] && partImages[viewingPriceDetails.partId].length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold">Part Images ({partImages[viewingPriceDetails.partId].length})</h5>
                    {viewingPriceDetails.imageHunting && (
                      <div className="text-sm text-gray-600">
                        <span className="text-green-600">✓</span> Auto-hunted: {viewingPriceDetails.imageHunting.totalSaved} images from {viewingPriceDetails.imageHunting.sources?.length || 0} sources
                      </div>
                    )}
                  </div>
                  <ImageManager
                    partId={viewingPriceDetails.partId}
                    partName={viewingPriceDetails.partName}
                    images={partImages[viewingPriceDetails.partId]}
                    onImagesChange={(updatedImages) => {
                      setPartImages(prev => ({
                        ...prev,
                        [viewingPriceDetails.partId]: updatedImages
                      }))
                    }}
                  />
                </div>
              )}

              {/* Search Queries Used */}
              <div className="mb-4">
                <h5 className="font-semibold mb-2">Search Queries Used</h5>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {(viewingPriceDetails.marketAnalysis.referenceListings || []).map((listing, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`${
                                listing.source?.includes('eBay') ? 'bg-blue-100 text-blue-800' :
                                listing.source?.includes('Google') ? 'bg-green-100 text-green-800' :
                                listing.source?.includes('Car-Parts') ? 'bg-purple-100 text-purple-800' :
                                listing.source?.includes('LKQ') ? 'bg-yellow-100 text-yellow-800' :
                                listing.source?.includes('AutoZone') ? 'bg-red-100 text-red-800' :
                                listing.source?.includes('RockAuto') ? 'bg-indigo-100 text-indigo-800' :
                                listing.source?.includes('Amazon') ? 'bg-orange-100 text-orange-800' :
                                listing.source?.includes('Facebook') ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {listing.source || 'Unknown'}
                          </Badge>
                          <span className="text-gray-600 truncate max-w-xs" title={listing.searchQuery}>
                            {listing.searchQuery || 'N/A'}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            let searchUrl = ''
                            const source = listing.source || 'Unknown'
                            const query = listing.searchQuery || ''
                            
                            if (source.includes('eBay')) {
                              searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`
                            } else if (source.includes('Google')) {
                              searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
                            } else if (source.includes('LKQ')) {
                              searchUrl = `https://www.lkqonline.com/search?q=${encodeURIComponent(query)}`
                            } else if (source.includes('Car-Parts')) {
                              searchUrl = `https://www.car-parts.com/search?q=${encodeURIComponent(query)}`
                            } else if (source.includes('AutoZone')) {
                              searchUrl = `https://www.autozone.com/search?q=${encodeURIComponent(query)}`
                            } else if (source.includes('RockAuto')) {
                              searchUrl = `https://www.rockauto.com/en/catalog/${encodeURIComponent(query)}`
                            } else if (source.includes('Amazon')) {
                              searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`
                            } else if (source.includes('Facebook')) {
                              searchUrl = `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(query)}`
                            } else {
                              searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
                            }
                            window.open(searchUrl, '_blank')
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reference Listings */}
              <div>
                <h5 className="font-semibold mb-2">Reference Listings ({viewingPriceDetails.marketAnalysis.referenceListings?.length || 0})</h5>
                <div className="max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Search Query</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Outlier</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(viewingPriceDetails.marketAnalysis.referenceListings || []).map((listing, index) => (
                        <TableRow key={index} className="hover:bg-gray-50">
                          <TableCell className="max-w-xs">
                            <div className="truncate font-medium text-blue-600 hover:text-blue-800 cursor-pointer" 
                                 onClick={() => window.open(listing.url, '_blank')}
                                 title="Click to view listing">
                              {listing.title}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            ${listing.price.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`${
                                listing.source?.includes('eBay') ? 'bg-blue-100 text-blue-800' :
                                listing.source?.includes('Google') ? 'bg-green-100 text-green-800' :
                                listing.source?.includes('Car-Parts') ? 'bg-purple-100 text-purple-800' :
                                listing.source?.includes('LKQ') ? 'bg-yellow-100 text-yellow-800' :
                                listing.source?.includes('AutoZone') ? 'bg-red-100 text-red-800' :
                                listing.source?.includes('RockAuto') ? 'bg-indigo-100 text-indigo-800' :
                                listing.source?.includes('Amazon') ? 'bg-orange-100 text-orange-800' :
                                listing.source?.includes('Facebook') ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {listing.source || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-gray-600 max-w-xs truncate" title={listing.searchQuery}>
                              {listing.searchQuery || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{listing.condition}</Badge>
                          </TableCell>
                          <TableCell>
                            {listing.isOutlier ? (
                              <Badge variant="destructive">Outlier</Badge>
                            ) : (
                              <Badge variant="outline">Valid</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(listing.url, '_blank')}
                                className="bg-blue-500 hover:bg-blue-600 text-white border-0 transition-all duration-200 hover:scale-110 hover:shadow-md"
                                title="View listing"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {listing.searchQuery && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    // Create search URL based on source
                                    let searchUrl = ''
                                    const source = listing.source || 'Unknown'
                                    const query = listing.searchQuery || ''
                                    
                                    if (source.includes('eBay')) {
                                      searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`
                                    } else if (source.includes('Google')) {
                                      searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
                                    } else if (source.includes('LKQ')) {
                                      searchUrl = `https://www.lkqonline.com/search?q=${encodeURIComponent(query)}`
                                    } else if (source.includes('Car-Parts')) {
                                      searchUrl = `https://www.car-parts.com/search?q=${encodeURIComponent(query)}`
                                    } else {
                                      searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
                                    }
                                    window.open(searchUrl, '_blank')
                                  }}
                                  className="bg-green-500 hover:bg-green-600 text-white border-0 transition-all duration-200 hover:scale-110 hover:shadow-md"
                                  title="Open search query"
                                >
                                  <Search className="h-4 w-4 mr-1" />
                                  Search
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {viewingSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Price Evaluation Settings</h3>
              <Button variant="ghost" onClick={() => setViewingSettings(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{viewingSettings.partName}</h4>
                <p className="text-gray-600">Configure price evaluation parameters</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="font-medium">Anomaly Detection Threshold</label>
                  <p className="text-sm text-gray-600">Remove prices that deviate more than 30% from the mean</p>
                  <Badge variant="outline" className="mt-1">30% (Current)</Badge>
                </div>

                <div>
                  <label className="font-medium">Sample Size</label>
                  <p className="text-sm text-gray-600">Number of reference listings analyzed</p>
                  <Badge variant="outline" className="mt-1">
                    {viewingSettings.marketAnalysis.priceEvaluation?.sampleSize || viewingSettings.sources} listings
                  </Badge>
                </div>

                <div>
                  <label className="font-medium">Outlier Removal</label>
                  <p className="text-sm text-gray-600">Automatically remove statistical outliers</p>
                  <Badge variant="outline" className="mt-1">
                    {viewingSettings.marketAnalysis.priceEvaluation?.outliersRemoved || 0} removed
                  </Badge>
                </div>

                <div>
                  <label className="font-medium">Price Range Validation</label>
                  <p className="text-sm text-gray-600">Ensure final price is within acceptable range</p>
                  <Badge 
                    variant={viewingSettings.marketAnalysis.priceEvaluation?.isWithinRange ? "default" : "destructive"}
                    className="mt-1"
                  >
                    {viewingSettings.marketAnalysis.priceEvaluation?.isWithinRange ? 'Within Range' : 'Outside Range'}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={() => setViewingSettings(null)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {viewingHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Price Research History</h3>
              <Button variant="ghost" onClick={() => setViewingHistory(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {priceHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No price research history found.
                </div>
              ) : (
                <div className="space-y-4">
                  {priceHistory.map((historyItem, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{historyItem.partName}</h4>
                            <p className="text-sm text-gray-600">{historyItem.category}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              ${historyItem.averagePrice?.toLocaleString() || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(historyItem.researchDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Sources:</span> {historyItem.sources || 0}
                          </div>
                          <div>
                            <span className="font-medium">Confidence:</span> {historyItem.confidence || 0}%
                          </div>
                          <div>
                            <span className="font-medium">Trend:</span> {historyItem.marketTrend || 'Unknown'}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> 
                            <Badge 
                              variant={historyItem.isActive ? "default" : "outline"}
                              className="ml-1"
                            >
                              {historyItem.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
