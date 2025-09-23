'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PartsFilter } from '@/components/forms/PartsFilter'
import { PartsDashboardProps, Part, Report } from '@/types'
import { Loader2, Search, Filter, ExternalLink, DollarSign, Download, RefreshCw, TrendingUp } from 'lucide-react'

// Helper function to determine priority from category
function getPriorityFromCategory(category: string): 'high' | 'medium' | 'low' {
  const highPriority = ['Brake System', 'Engine', 'Transmission', 'Electrical System']
  const mediumPriority = ['Suspension & Steering', 'Fuel System', 'Exhaust System']
  
  if (highPriority.includes(category)) return 'high'
  if (mediumPriority.includes(category)) return 'medium'
  return 'low'
}

export function PartsDashboard({ vehicleId, className }: PartsDashboardProps) {
  const [parts, setParts] = useState<Part[]>([])
  const [filteredParts, setFilteredParts] = useState<Part[]>([])
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)
  const [priceLoading, setPriceLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchParts = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/parts/populate-inventory?vehicleId=${vehicleId}`)

      const data = await response.json()

      if (data.success) {
        // Transform inventory data to match the expected Part interface
        const transformedParts = data.inventory.map((item: any) => ({
          id: item.id,
          partNumber: item.partsMaster.oemPartNumber || 'N/A',
          description: item.partsMaster.partName,
          category: item.partsMaster.category,
          priority: getPriorityFromCategory(item.partsMaster.category),
          price: item.currentValue || item.partsMaster.estimatedValue || 0,
          imageUrl: item.customImages?.[0] || item.partsMaster.images?.[0],
          ebayListingId: null,
          ebayUrl: null,
          vehicleId: item.vehicleId,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          // Additional inventory-specific fields
          condition: item.condition,
          status: item.status,
          notes: item.notes,
          specifications: item.partsMaster.specifications
        }))
        
        setParts(transformedParts)
        setFilteredParts(transformedParts)
      } else {
        setError(data.message || 'Failed to fetch parts')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Parts fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (vehicleId) {
      fetchParts()
    }
  }, [vehicleId])

  // Listen for parts updates from VIN decoder
  useEffect(() => {
    const handlePartsUpdate = () => {
      if (vehicleId) {
        fetchParts()
      }
    }

    window.addEventListener('partsUpdated', handlePartsUpdate)
    return () => window.removeEventListener('partsUpdated', handlePartsUpdate)
  }, [vehicleId])

  const fetchRealPrices = async () => {
    if (parts.length === 0) return
    
    setPriceLoading(true)
    try {
      const partIds = parts.map(part => part.id)
      const response = await fetch('/api/parts/fetch-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ partIds }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Refresh parts data to get updated prices
        await fetchParts()
      } else {
        setError(data.message || 'Failed to fetch real prices')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Price fetch error:', err)
    } finally {
      setPriceLoading(false)
    }
  }

  const exportData = async (format: 'csv' | 'pdf' | 'json') => {
    setExportLoading(true)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          vehicleId, 
          format,
          includeImages: false 
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${vehicleId}_parts_${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setError('Failed to export data')
      }
    } catch (err) {
      setError('Export failed')
      console.error('Export error:', err)
    } finally {
      setExportLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Fetching Parts...
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold">Analyzing Vehicle Data</h3>
              <p className="text-sm text-gray-600">
                Generating AI-powered part suggestions based on your vehicle specifications
              </p>
            </div>
            {report && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{report.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${report.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{report.processedParts} processed</span>
                  <span>{report.totalParts} total</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Parts Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-red-600">
              <p className="font-semibold">Error Loading Parts</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={fetchParts} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (parts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Parts Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div>
              <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold">No Parts Found</h3>
              <p className="text-sm text-gray-600">
                Click the button below to generate AI-powered part suggestions for this vehicle
              </p>
            </div>
            <Button onClick={fetchParts}>
              <Search className="h-4 w-4 mr-2" />
              Generate Parts Suggestions
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Parts Dashboard
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={fetchRealPrices} 
                variant="outline" 
                size="sm"
                disabled={priceLoading || parts.length === 0}
              >
                {priceLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <TrendingUp className="h-4 w-4 mr-2" />
                )}
                {priceLoading ? 'Fetching...' : 'Real Prices'}
              </Button>
              <div className="relative">
                <Button variant="outline" size="sm" disabled={exportLoading}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <div className="absolute right-0 top-full mt-1 bg-white border rounded-md shadow-lg z-10 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="py-1">
                    <button
                      onClick={() => exportData('csv')}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => exportData('pdf')}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      Export PDF
                    </button>
                    <button
                      onClick={() => exportData('json')}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      Export JSON
                    </button>
                  </div>
                </div>
              </div>
              <Button onClick={fetchParts} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Parts Filter */}
            <PartsFilter 
              parts={parts} 
              onFilteredParts={setFilteredParts}
            />
            
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{parts.length}</div>
                <div className="text-sm text-blue-600">Total Parts</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {parts.filter(p => p.priority === 'high').length}
                </div>
                <div className="text-sm text-green-600">High Priority</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {parts.reduce((sum, part) => sum + (part.price || 0), 0).toFixed(0)}
                </div>
                <div className="text-sm text-purple-600">Est. Total</div>
              </div>
            </div>

            {/* Parts Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredParts.map((part) => (
                <Card key={part.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium leading-tight">
                        {part.description}
                      </CardTitle>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(part.priority)}`}>
                        {part.priority}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Category</span>
                        <span className="font-medium">{part.category}</span>
                      </div>
                      
                      {part.price && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Price</span>
                          <span className="font-semibold text-green-600 flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatPrice(part.price)}
                          </span>
                        </div>
                      )}

                      {part.partNumber && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Part Number</span>
                          <span className="font-mono text-xs">{part.partNumber}</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        {part.ebayUrl && (
                          <Button size="sm" variant="outline" className="flex-1" asChild>
                            <a href={part.ebayUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View on eBay
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="flex-1">
                          <Filter className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
