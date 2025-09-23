'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Car, 
  Download,
  RefreshCw
} from 'lucide-react'

interface AnalyticsData {
  totalVehicles: number
  totalParts: number
  totalValue: number
  averagePartsPerVehicle: number
  categoryBreakdown: Array<{ category: string; count: number; value: number }>
  priorityBreakdown: Array<{ priority: string; count: number; value: number }>
  recentActivity: Array<{ type: string; description: string; timestamp: string }>
  topCategories: Array<{ category: string; count: number }>
}

interface AnalyticsDashboardProps {
  className?: string
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analytics')
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.analytics)
      } else {
        setError(data.message || 'Failed to fetch analytics')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading analytics...</span>
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
            <BarChart3 className="h-5 w-5" />
            Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-red-600">
              <p className="font-semibold">Error Loading Analytics</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={fetchAnalytics} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400" />
            <div>
              <h3 className="text-lg font-semibold">No Data Available</h3>
              <p className="text-sm text-gray-600">
                Analytics will appear here once you start using the app
              </p>
            </div>
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
              <BarChart3 className="h-5 w-5" />
              Analytics Dashboard
            </CardTitle>
            <Button onClick={fetchAnalytics} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Car className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-600">{analytics.totalVehicles}</div>
              <div className="text-sm text-blue-600">Vehicles</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Package className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600">{analytics.totalParts}</div>
              <div className="text-sm text-green-600">Parts</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(analytics.totalValue)}
              </div>
              <div className="text-sm text-purple-600">Total Value</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto text-orange-600 mb-2" />
              <div className="text-2xl font-bold text-orange-600">
                {analytics.averagePartsPerVehicle.toFixed(1)}
              </div>
              <div className="text-sm text-orange-600">Avg Parts/Vehicle</div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topCategories.slice(0, 5).map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category.category}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(category.count / analytics.topCategories[0].count) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{category.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.priorityBreakdown.map((priority) => (
                    <div key={priority.priority} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{priority.priority}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              priority.priority === 'high' ? 'bg-red-500' :
                              priority.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(priority.count / analytics.totalParts) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{priority.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.type}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
