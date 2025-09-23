'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Car, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'

interface Vehicle {
  id: string
  vin: string
  make: string
  model: string
  year: number
  createdAt: string
  updatedAt: string
}

interface VehicleStats {
  totalParts: number
  uniqueParts: number
  duplicateGroups: number
  duplicates: Array<{
    partsMasterId: string
    count: number
  }>
  totalValue: number
  averagePrice: number
}

interface VehicleManagementProps {
  onVehicleSelect?: (vehicle: Vehicle) => void
  className?: string
}

export function VehicleManagement({ onVehicleSelect, className }: VehicleManagementProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleStats, setVehicleStats] = useState<Record<string, VehicleStats>>({})
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState<string | null>(null)
  const [populating, setPopulating] = useState<string | null>(null)

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles')
      const data = await response.json()
      
      if (data.success) {
        setVehicles(data.vehicles)
        
        // Fetch stats for each vehicle
        for (const vehicle of data.vehicles) {
          await fetchVehicleStats(vehicle.id)
        }
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicleStats = async (vehicleId: string) => {
    try {
      const response = await fetch(`/api/cleanup-duplicates?vehicleId=${vehicleId}`)
      const data = await response.json()
      
      if (data.success) {
        // Calculate price data
        const totalValue = data.parts?.reduce((sum: number, part: any) => 
          sum + (part.currentValue || part.partsMaster?.estimatedValue || 0), 0) || 0
        const averagePrice = data.totalParts > 0 ? totalValue / data.totalParts : 0
        
        setVehicleStats(prev => ({
          ...prev,
          [vehicleId]: {
            totalParts: data.totalParts,
            uniqueParts: data.uniqueParts,
            duplicateGroups: data.duplicateGroups,
            duplicates: data.duplicates,
            totalValue: Math.round(totalValue),
            averagePrice: Math.round(averagePrice)
          }
        }))
      }
    } catch (error) {
      console.error('Error fetching vehicle stats:', error)
    }
  }

  const cleanupDuplicates = async (vehicleId: string) => {
    setCleaning(vehicleId)
    try {
      const response = await fetch('/api/cleanup-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh stats
        await fetchVehicleStats(vehicleId)
        // Refresh vehicles list
        await fetchVehicles()
      }
    } catch (error) {
      console.error('Error cleaning up duplicates:', error)
    } finally {
      setCleaning(null)
    }
  }

  const populatePartsAndPrices = async (vehicle: Vehicle) => {
    setPopulating(vehicle.id)
    try {
      // First populate parts inventory
      const partsResponse = await fetch('/api/parts/populate-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          vin: vehicle.vin
        })
      })
      
      const partsData = await partsResponse.json()
      
      if (partsData.success) {
        // Then start price research for all parts
        const priceResponse = await fetch('/api/price-research/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleId: vehicle.id,
            partIds: partsData.inventory?.map((part: any) => part.id) || []
          })
        })
        
        const priceData = await priceResponse.json()
        
        if (priceData.success) {
          // Start image hunting for all parts
          try {
            const imagePromises = partsData.inventory?.map(async (part: any) => {
              const imageResponse = await fetch('/api/image-hunting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  partId: part.partsMasterId,
                  partName: part.partsMaster.partName,
                  make: vehicle.make,
                  model: vehicle.model,
                  year: vehicle.year,
                  category: part.partsMaster.category,
                  subCategory: part.partsMaster.subCategory,
                  maxImages: 5
                })
              })
              return imageResponse.json()
            }) || []

            // Wait for all image hunting to complete
            await Promise.all(imagePromises)
          } catch (imageError) {
            console.error('Image hunting error:', imageError)
            // Don't fail the whole process if image hunting fails
          }

          // Select the vehicle after successful population
          onVehicleSelect?.(vehicle)
          alert(`Successfully populated ${partsData.totalParts} parts, started price research, and hunted for images!`)
        } else {
          alert(`Parts populated but price research failed: ${priceData.message}`)
        }
      } else {
        alert(`Failed to populate parts: ${partsData.message}`)
      }
    } catch (error) {
      console.error('Error populating parts and prices:', error)
      alert('Error populating parts and prices')
    } finally {
      setPopulating(null)
    }
  }

  const deleteVehicle = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle and all its parts?')) {
      return
    }

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setVehicles(prev => prev.filter(v => v.id !== vehicleId))
        setVehicleStats(prev => {
          const newStats = { ...prev }
          delete newStats[vehicleId]
          return newStats
        })
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error)
    }
  }

  const getDuplicateStatus = (vehicleId: string) => {
    const stats = vehicleStats[vehicleId]
    if (!stats) return { status: 'unknown', color: 'gray' }
    
    if (stats.duplicateGroups === 0) {
      return { status: 'clean', color: 'green' }
    } else if (stats.duplicateGroups < 10) {
      return { status: 'minor', color: 'yellow' }
    } else {
      return { status: 'major', color: 'red' }
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading vehicles...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Vehicle Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vehicles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No vehicles found. Decode a VIN to get started.
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>Parts</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Avg Price</TableHead>
                    <TableHead>Duplicates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quick Actions</TableHead>
                    <TableHead>Manage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => {
                    const stats = vehicleStats[vehicle.id]
                    const duplicateStatus = getDuplicateStatus(vehicle.id)
                    
                    return (
                      <TableRow key={vehicle.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </div>
                            <div className="text-sm text-gray-500">
                              Added {new Date(vehicle.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {vehicle.vin}
                        </TableCell>
                        <TableCell>
                          {stats ? (
                            <div>
                              <div className="font-medium">{stats.totalParts}</div>
                              <div className="text-sm text-gray-500">
                                {stats.uniqueParts} unique
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400">Loading...</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {stats ? (
                            <div className="font-medium text-green-600">
                              ${stats.totalValue?.toLocaleString() || 0}
                            </div>
                          ) : (
                            <div className="text-gray-400">Loading...</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {stats ? (
                            <div className="font-medium text-blue-600">
                              ${stats.averagePrice || 0}
                            </div>
                          ) : (
                            <div className="text-gray-400">Loading...</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {stats ? (
                            <div>
                              <div className="font-medium">{stats.duplicateGroups}</div>
                              <div className="text-sm text-gray-500">
                                groups
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400">Loading...</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {stats ? (
                            <Badge 
                              variant={duplicateStatus.color === 'green' ? 'default' : 
                                     duplicateStatus.color === 'yellow' ? 'secondary' : 'destructive'}
                            >
                              {duplicateStatus.status === 'clean' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {duplicateStatus.status === 'minor' && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {duplicateStatus.status === 'major' && <XCircle className="h-3 w-3 mr-1" />}
                              {duplicateStatus.status}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Loading</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => onVehicleSelect?.(vehicle)}
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              Select Vehicle
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => populatePartsAndPrices(vehicle)}
                              disabled={populating === vehicle.id}
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                              {populating === vehicle.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  Populating...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Populate Parts & Prices
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {stats && stats.duplicateGroups > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cleanupDuplicates(vehicle.id)}
                                disabled={cleaning === vehicle.id}
                                className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
                              >
                                {cleaning === vehicle.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                                Clean Duplicates
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteVehicle(vehicle.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
