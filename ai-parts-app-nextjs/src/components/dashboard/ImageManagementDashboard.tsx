'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Eye, 
  Download,
  Camera,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  BarChart3,
  HardDrive,
  Zap,
  Shield
} from 'lucide-react'

interface ImageManagementDashboardProps {
  vehicleId: string
  className?: string
}

interface ImageStats {
  totalImages: number
  totalSize: number
  averageSize: number
  formats: Record<string, number>
  processingQueue: number
  cdnEnabled: boolean
  breakdown?: {
    vehiclePhotos: number
    partsImages: number
    partsWithImages: number
  }
}

interface ProcessingJob {
  id: string
  filename: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
}

export function ImageManagementDashboard({ vehicleId, className }: ImageManagementDashboardProps) {
  const [stats, setStats] = useState<ImageStats>({
    totalImages: 0,
    totalSize: 0,
    averageSize: 0,
    formats: {},
    processingQueue: 0,
    cdnEnabled: false
  })
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([])
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)

  useEffect(() => {
    if (vehicleId) {
      fetchImageStats()
      fetchProcessingJobs()
    }
  }, [vehicleId])

  const fetchImageStats = async () => {
    try {
      const response = await fetch(`/api/image-management/stats?vehicleId=${vehicleId}`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching image stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProcessingJobs = async () => {
    try {
      const response = await fetch(`/api/image-management/jobs?vehicleId=${vehicleId}`)
      const data = await response.json()
      
      if (data.success) {
        setProcessingJobs(data.jobs)
      }
    } catch (error) {
      console.error('Error fetching processing jobs:', error)
    }
  }

  const optimizeImages = async () => {
    setOptimizing(true)
    try {
      const response = await fetch('/api/image-management/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Optimization complete! ${data.optimizedFiles} files optimized, ${data.spaceSaved}MB saved`)
        fetchImageStats()
      } else {
        alert(`Optimization failed: ${data.message}`)
      }
    } catch (error) {
      console.error('Optimization error:', error)
      alert('Optimization failed')
    } finally {
      setOptimizing(false)
    }
  }

  const cleanupUnusedImages = async () => {
    if (!confirm('Are you sure you want to clean up unused images? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/image-management/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Cleanup complete! ${data.deletedFiles} files deleted, ${data.freedSpace}MB freed`)
        fetchImageStats()
      } else {
        alert(`Cleanup failed: ${data.message}`)
      }
    } catch (error) {
      console.error('Cleanup error:', error)
      alert('Cleanup failed')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatPercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading image management data...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Image Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Image Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-900">{stats.totalImages}</div>
              <div className="text-sm text-blue-600">Total Images</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <HardDrive className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-900">{formatFileSize(stats.totalSize)}</div>
              <div className="text-sm text-green-600">Total Size</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Zap className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-900">{formatFileSize(stats.averageSize)}</div>
              <div className="text-sm text-purple-600">Average Size</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Settings className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-orange-900">{stats.processingQueue}</div>
              <div className="text-sm text-orange-600">Processing Queue</div>
            </div>
          </div>

          {/* Image Breakdown */}
          {stats.breakdown && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Image Source Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-900">{stats.breakdown.vehiclePhotos}</div>
                  <div className="text-xs text-blue-600">Vehicle Photos</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-900">{stats.breakdown.partsImages}</div>
                  <div className="text-xs text-green-600">Parts Images</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-900">{stats.breakdown.partsWithImages}</div>
                  <div className="text-xs text-purple-600">Parts with Images</div>
                </div>
              </div>
            </div>
          )}

          {/* Format Distribution */}
          {Object.keys(stats.formats).length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Image Format Distribution</h4>
              <div className="space-y-2">
                {Object.entries(stats.formats).map(([format, count]) => (
                  <div key={format} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {format.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-600">{count} files</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${formatPercentage(count, stats.totalImages)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">
                        {formatPercentage(count, stats.totalImages)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Queue */}
      {processingJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5" />
              Processing Queue ({processingJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processingJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {job.filename}
                    </span>
                    <Badge 
                      variant={job.status === 'completed' ? 'default' : 
                              job.status === 'failed' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {job.status}
                    </Badge>
                  </div>
                  {job.status === 'processing' && (
                    <div className="space-y-1">
                      <Progress value={job.progress} className="h-2" />
                      <div className="text-xs text-gray-500 text-right">
                        {job.progress}%
                      </div>
                    </div>
                  )}
                  {job.status === 'failed' && job.error && (
                    <div className="text-xs text-red-600 mt-1">
                      Error: {job.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Image Management Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Optimization</h4>
              <Button
                onClick={optimizeImages}
                disabled={optimizing}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                {optimizing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Optimize Images
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500">
                Re-compress images with better algorithms to reduce file sizes
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Cleanup</h4>
              <Button
                onClick={cleanupUnusedImages}
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cleanup Unused Images
              </Button>
              <p className="text-xs text-gray-500">
                Remove orphaned image files to free up disk space
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CDN Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            CDN & Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${stats.cdnEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium text-gray-900">
                {stats.cdnEnabled ? 'CDN Enabled' : 'CDN Disabled'}
              </span>
            </div>
            <Badge variant={stats.cdnEnabled ? 'default' : 'secondary'}>
              {stats.cdnEnabled ? 'Production Ready' : 'Development Mode'}
            </Badge>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            {stats.cdnEnabled ? (
              <p>✅ Images are served via CDN for optimal performance worldwide</p>
            ) : (
              <p>⚠️ Images are served locally. Enable CDN for production deployment.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            Performance Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📸 Image Optimization</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use JPEG for photos, PNG for graphics</li>
                <li>• Compress images to 85% quality</li>
                <li>• Resize to appropriate dimensions</li>
                <li>• Enable WebP for modern browsers</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🚀 Performance</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use CDN for global distribution</li>
                <li>• Implement lazy loading</li>
                <li>• Cache processed images</li>
                <li>• Monitor storage usage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
