'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  CheckCircle,
  Eye,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  Award,
  ExternalLink
} from 'lucide-react'

interface ListingPerformanceDashboardProps {
  vehicleId: string
  className?: string
}

interface PerformanceSummary {
  period: string
  totalListings: number
  activeListings: number
  soldListings: number
  endedListings: number
  totalListedValue: number
  totalSoldValue: number
  averageListingPrice: number
  sellThroughRate: number
}

interface CategoryPerformance {
  category: string
  totalListings: number
  soldListings: number
  totalValue: number
  soldValue: number
  sellThroughRate: number
  averagePrice: number
}

interface WeeklyTrend {
  week: string
  listings: number
  sold: number
  value: number
}

interface TopPerformingPart {
  partName: string
  totalListings: number
  soldListings: number
  totalValue: number
  averagePrice: number
  sellThroughRate: number
}

export function ListingPerformanceDashboard({ vehicleId, className }: ListingPerformanceDashboardProps) {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null)
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([])
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([])
  const [topPerformingParts, setTopPerformingParts] = useState<TopPerformingPart[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('30')

  const fetchPerformanceData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ebay/listings/performance?vehicleId=${vehicleId}&days=${selectedPeriod}`)
      const data = await response.json()

      if (data.success) {
        setSummary(data.summary)
        setCategoryPerformance(data.categoryPerformance || [])
        setWeeklyTrends(data.weeklyTrends || [])
        setTopPerformingParts(data.topPerformingParts || [])
      }
    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (vehicleId) {
      fetchPerformanceData()
    }
  }, [vehicleId, selectedPeriod])

  const getSellThroughColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600'
    if (rate >= 50) return 'text-yellow-600'
    if (rate >= 30) return 'text-orange-600'
    return 'text-red-600'
  }

  const getSellThroughBadgeColor = (rate: number) => {
    if (rate >= 70) return 'bg-green-100 text-green-800'
    if (rate >= 50) return 'bg-yellow-100 text-yellow-800'
    if (rate >= 30) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading performance data...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Period Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              eBay Listing Performance
            </CardTitle>
            
            <div className="flex items-center gap-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                  <SelectItem value="365">1 Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={fetchPerformanceData} variant="outline" size="sm">
                <Loader2 className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Performance Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Listings</p>
                  <p className="text-2xl font-bold">{summary.totalListings}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Listings</p>
                  <p className="text-2xl font-bold text-green-600">{summary.activeListings}</p>
                </div>
                <Eye className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sold Items</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.soldListings}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sell-Through Rate</p>
                  <p className={`text-2xl font-bold ${getSellThroughColor(summary.sellThroughRate)}`}>
                    {summary.sellThroughRate.toFixed(1)}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Listed Value</p>
                  <p className="text-2xl font-bold">${summary.totalListedValue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sold Value</p>
                  <p className="text-2xl font-bold">${summary.totalSoldValue.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Listing Price</p>
                  <p className="text-2xl font-bold">${summary.averageListingPrice.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Period</p>
                  <p className="text-2xl font-bold">{summary.period}</p>
                </div>
                <Calendar className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Performance */}
      {categoryPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Performance by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Listings</TableHead>
                    <TableHead>Sold</TableHead>
                    <TableHead>Sell-Through Rate</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Avg Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryPerformance.map((category, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {category.category}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{category.totalListings}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{category.soldListings}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSellThroughBadgeColor(category.sellThroughRate)}>
                          {category.sellThroughRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${category.totalValue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ${category.averagePrice.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Parts */}
      {topPerformingParts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performing Parts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Name</TableHead>
                    <TableHead>Listings</TableHead>
                    <TableHead>Sold</TableHead>
                    <TableHead>Sell-Through Rate</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Avg Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPerformingParts.map((part, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {part.partName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{part.totalListings}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{part.soldListings}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSellThroughBadgeColor(part.sellThroughRate)}>
                          {part.sellThroughRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${part.totalValue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ${part.averagePrice.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Trends */}
      {weeklyTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyTrends.map((week, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Week of {new Date(week.week).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">
                      {week.listings} listings, {week.sold} sold
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${week.value.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Value</p>
                  </div>
                  <div className="w-32">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Sold</span>
                      <span>{week.listings > 0 ? Math.round((week.sold / week.listings) * 100) : 0}%</span>
                    </div>
                    <Progress 
                      value={week.listings > 0 ? (week.sold / week.listings) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!summary && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Listing Data</h3>
            <p className="text-gray-500">
              No eBay listings found for this vehicle. Create some listings to see performance data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
