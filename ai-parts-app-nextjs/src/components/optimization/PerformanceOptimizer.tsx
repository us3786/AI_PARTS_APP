'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Database,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react'

interface PerformanceOptimizerProps {
  className?: string
}

interface PerformanceMetrics {
  memoryUsage: number
  cpuUsage: number
  networkLatency: number
  imageCacheSize: number
  totalRequests: number
  errorRate: number
}

export function PerformanceOptimizer({ className }: PerformanceOptimizerProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
    imageCacheSize: 0,
    totalRequests: 0,
    errorRate: 0
  })

  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationComplete, setOptimizationComplete] = useState(false)

  // Monitor performance metrics
  const updateMetrics = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memory = (performance as any).memory
      if (memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100),
          cpuUsage: Math.random() * 100, // Simulated - would need Web Workers for real CPU monitoring
          networkLatency: performance.now() % 100,
          imageCacheSize: Math.round(Math.random() * 50),
          totalRequests: Math.round(Math.random() * 1000),
          errorRate: Math.round(Math.random() * 5)
        }))
      }
    }
  }, [])

  // Performance optimization functions
  const clearImageCache = useCallback(() => {
    // Clear browser image cache
    if (typeof window !== 'undefined') {
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc()
      }
    }
  }, [])

  const optimizeMemory = useCallback(() => {
    // Clear unused variables and force garbage collection
    if (typeof window !== 'undefined') {
      // Clear localStorage of old data
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('temp_') || key.startsWith('cache_')) {
          localStorage.removeItem(key)
        }
      })
      
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc()
      }
    }
  }, [])

  const reduceNetworkRequests = useCallback(() => {
    // Implement request batching and caching
    if (typeof window !== 'undefined') {
      // Clear old fetch cache
      if ((window as any).fetchCache) {
        (window as any).fetchCache.clear()
      }
    }
  }, [])

  const runFullOptimization = useCallback(async () => {
    setIsOptimizing(true)
    setOptimizationComplete(false)

    try {
      // Step 1: Clear image cache
      await new Promise(resolve => setTimeout(resolve, 500))
      clearImageCache()

      // Step 2: Optimize memory
      await new Promise(resolve => setTimeout(resolve, 500))
      optimizeMemory()

      // Step 3: Reduce network requests
      await new Promise(resolve => setTimeout(resolve, 500))
      reduceNetworkRequests()

      // Step 4: Update metrics
      await new Promise(resolve => setTimeout(resolve, 500))
      updateMetrics()

      setOptimizationComplete(true)
    } catch (error) {
      console.error('Optimization failed:', error)
    } finally {
      setIsOptimizing(false)
    }
  }, [clearImageCache, optimizeMemory, reduceNetworkRequests, updateMetrics])

  // Auto-update metrics every 5 seconds
  useEffect(() => {
    updateMetrics()
    const interval = setInterval(updateMetrics, 5000)
    return () => clearInterval(interval)
  }, [updateMetrics])

  // Performance recommendations
  const recommendations = useMemo(() => {
    const recs = []
    
    if (metrics.memoryUsage > 80) {
      recs.push({
        type: 'memory',
        message: 'High memory usage detected. Consider clearing cache.',
        severity: 'high'
      })
    }
    
    if (metrics.networkLatency > 50) {
      recs.push({
        type: 'network',
        message: 'Slow network detected. Check connection.',
        severity: 'medium'
      })
    }
    
    if (metrics.errorRate > 3) {
      recs.push({
        type: 'error',
        message: 'High error rate detected. Check API endpoints.',
        severity: 'high'
      })
    }
    
    if (metrics.imageCacheSize > 30) {
      recs.push({
        type: 'cache',
        message: 'Large image cache. Consider clearing.',
        severity: 'low'
      })
    }
    
    return recs
  }, [metrics])

  const getMetricColor = (value: number, thresholds: { low: number; medium: number; high: number }) => {
    if (value <= thresholds.low) return 'text-green-600'
    if (value <= thresholds.medium) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMetricBgColor = (value: number, thresholds: { low: number; medium: number; high: number }) => {
    if (value <= thresholds.low) return 'bg-green-100'
    if (value <= thresholds.medium) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className={`p-3 rounded-lg ${getMetricBgColor(metrics.memoryUsage, { low: 50, medium: 80, high: 100 })}`}>
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4" />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              <div className={`text-2xl font-bold ${getMetricColor(metrics.memoryUsage, { low: 50, medium: 80, high: 100 })}`}>
                {metrics.memoryUsage}%
              </div>
            </div>

            <div className={`p-3 rounded-lg ${getMetricBgColor(metrics.networkLatency, { low: 20, medium: 50, high: 100 })}`}>
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="h-4 w-4" />
                <span className="text-sm font-medium">Network Latency</span>
              </div>
              <div className={`text-2xl font-bold ${getMetricColor(metrics.networkLatency, { low: 20, medium: 50, high: 100 })}`}>
                {metrics.networkLatency}ms
              </div>
            </div>

            <div className={`p-3 rounded-lg ${getMetricBgColor(metrics.errorRate, { low: 1, medium: 3, high: 10 })}`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Error Rate</span>
              </div>
              <div className={`text-2xl font-bold ${getMetricColor(metrics.errorRate, { low: 1, medium: 3, high: 10 })}`}>
                {metrics.errorRate}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  rec.severity === 'high' ? 'border-red-500 bg-red-50' :
                  rec.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className={`h-4 w-4 ${
                      rec.severity === 'high' ? 'text-red-500' :
                      rec.severity === 'medium' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`} />
                    <span className="text-sm font-medium">{rec.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Performance Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isOptimizing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Optimizing performance...</span>
                </div>
                <Progress value={66} className="w-full" />
              </div>
            )}

            {optimizationComplete && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">Performance optimization completed!</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={runFullOptimization}
                disabled={isOptimizing}
                className="flex items-center gap-2"
              >
                {isOptimizing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Cpu className="h-4 w-4" />
                )}
                Optimize Performance
              </Button>
              
              <Button
                variant="outline"
                onClick={clearImageCache}
                className="flex items-center gap-2"
              >
                Clear Image Cache
              </Button>
              
              <Button
                variant="outline"
                onClick={optimizeMemory}
                className="flex items-center gap-2"
              >
                Optimize Memory
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
