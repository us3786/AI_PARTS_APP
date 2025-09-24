'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { PartsInventory, PartsMaster } from '@/types'
import { 
  Loader2, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  DollarSign, 
  Package,
  CheckSquare,
  Square,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Upload
} from 'lucide-react'
import { SellOnEbay } from '@/components/forms/SellOnEbay'

interface EnhancedPartsDashboardProps {
  vehicleId: string
  className?: string
}

interface InventoryWithParts extends PartsInventory {
  partsMaster: PartsMaster
}

export function EnhancedPartsDashboard({ vehicleId, className }: EnhancedPartsDashboardProps) {
  const [inventory, setInventory] = useState<InventoryWithParts[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryWithParts[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedCondition, setSelectedCondition] = useState('all')
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set())
  const [categories, setCategories] = useState<string[]>([])
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    listed: 0,
    sold: 0,
    totalValue: 0
  })
  const [editingPart, setEditingPart] = useState<InventoryWithParts | null>(null)
  const [viewingPart, setViewingPart] = useState<InventoryWithParts | null>(null)
  const [bulkOperation, setBulkOperation] = useState<string>('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkEditData, setBulkEditData] = useState({
    condition: '',
    status: '',
    currentValue: '',
    location: '',
    notes: ''
  })

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/parts/populate-inventory?vehicleId=${vehicleId}`)
      const data = await response.json()

      if (data.success) {
        setInventory(data.inventory || [])
        setFilteredInventory(data.inventory || [])
        setCategories([...new Set(data.inventory?.map((item: InventoryWithParts) => item.partsMaster.category) || [])])
        
        // Calculate stats
        const total = data.inventory?.length || 0
        const available = data.inventory?.filter((item: InventoryWithParts) => item.status === 'available').length || 0
        const listed = data.inventory?.filter((item: InventoryWithParts) => item.status === 'listed').length || 0
        const sold = data.inventory?.filter((item: InventoryWithParts) => item.status === 'sold').length || 0
        const totalValue = data.inventory?.reduce((sum: number, item: InventoryWithParts) => 
          sum + (item.currentValue || 0), 0) || 0

        setStats({ total, available, listed, sold, totalValue })
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (vehicleId) {
      fetchInventory()
    }
  }, [vehicleId])

  // Filter inventory based on search and filters
  useEffect(() => {
    let filtered = inventory

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.partsMaster.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partsMaster.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partsMaster.subCategory?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.partsMaster.category === selectedCategory)
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus)
    }

    // Condition filter
    if (selectedCondition !== 'all') {
      filtered = filtered.filter(item => item.condition === selectedCondition)
    }

    setFilteredInventory(filtered)
  }, [inventory, searchTerm, selectedCategory, selectedStatus, selectedCondition])


  const handleViewPart = (part: InventoryWithParts) => {
    setViewingPart(part)
  }

  const handleEditPart = (part: InventoryWithParts) => {
    setEditingPart(part)
  }

  const handleDeletePart = async (partId: string) => {
    if (confirm('Are you sure you want to delete this part?')) {
      try {
        const response = await fetch('/api/parts/bulk-operations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'delete',
            partIds: [partId],
            vehicleId: vehicleId
          })
        })

        const data = await response.json()
        
        if (data.success) {
          // Refresh inventory
          await fetchInventory()
        } else {
          alert('Failed to delete part: ' + data.message)
        }
      } catch (error) {
        console.error('Error deleting part:', error)
        alert('Error deleting part')
      }
    }
  }

  const handleCreateDraftListing = async (part: InventoryWithParts) => {
    try {
      const response = await fetch('/api/ebay/listings/create-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partId: part.id,
          vehicleId: vehicleId,
          listingData: {
            price: part.currentValue,
            images: part.partsMaster.images || []
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Draft listing created successfully! You can now view and edit it in the eBay Listings Preview section.')
      } else {
        alert('Failed to create draft listing: ' + data.message)
      }
    } catch (error) {
      console.error('Error creating draft listing:', error)
      alert('Error creating draft listing')
    }
  }

  const handleBulkOperation = async (operation: string) => {
    if (selectedParts.size === 0) return

    const selectedInventory = filteredInventory.filter(item => selectedParts.has(item.id))
    setBulkLoading(true)
    
    try {
      switch (operation) {
        case 'delete':
          if (confirm(`Are you sure you want to delete ${selectedParts.size} parts?`)) {
            const response = await fetch('/api/parts/bulk-operations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                operation: 'delete',
                partIds: Array.from(selectedParts),
                vehicleId: vehicleId
              })
            })
            
            const data = await response.json()
            if (data.success) {
              setSelectedParts(new Set())
              await fetchInventory()
              alert(`Successfully deleted ${data.deletedCount} parts`)
            } else {
              alert('Failed to delete parts: ' + data.message)
            }
          }
          break
        case 'update':
          // Open bulk edit modal
          setBulkOperation('update')
          break
        case 'export':
          // Export selected parts to CSV
          const csvData = selectedInventory.map(item => ({
            'Part Name': item.partsMaster.partName,
            'Category': item.partsMaster.category,
            'Condition': item.condition,
            'Status': item.status,
            'Current Value': item.currentValue,
            'Location': item.location || '',
            'Notes': item.notes || ''
          }))
          
          const csvContent = [
            Object.keys(csvData[0]).join(','),
            ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
          ].join('\n')
          
          const blob = new Blob([csvContent], { type: 'text/csv' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `parts_export_${new Date().toISOString().split('T')[0]}.csv`
          a.click()
          window.URL.revokeObjectURL(url)
          break
        case 'list':
          // Create bulk eBay listings
          const response = await fetch('/api/ebay/listings/create-draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              parts: selectedInventory.map(part => ({
                partId: part.id,
                vehicleId: vehicleId,
                listingData: {
                  price: part.currentValue,
                  images: part.partsMaster.images || []
                }
              }))
            })
          })
          
          const data = await response.json()
          if (data.success) {
            alert(`Successfully created ${data.createdCount} draft listings!`)
          } else {
            alert('Failed to create draft listings: ' + data.message)
          }
          break
      }
    } catch (error) {
      console.error('Bulk operation error:', error)
      alert('Error performing bulk operation')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedParts.size === filteredInventory.length) {
      setSelectedParts(new Set())
    } else {
      setSelectedParts(new Set(filteredInventory.map(item => item.id)))
    }
  }

  const handleSelectPart = (partId: string) => {
    const newSelected = new Set(selectedParts)
    if (newSelected.has(partId)) {
      newSelected.delete(partId)
    } else {
      newSelected.add(partId)
    }
    setSelectedParts(newSelected)
  }

  const handleBulkEdit = async () => {
    if (selectedParts.size === 0) return

    setBulkLoading(true)
    try {
      const updateData: any = {}
      if (bulkEditData.condition) updateData.condition = bulkEditData.condition
      if (bulkEditData.status) updateData.status = bulkEditData.status
      if (bulkEditData.currentValue) updateData.currentValue = parseFloat(bulkEditData.currentValue)
      if (bulkEditData.location) updateData.location = bulkEditData.location
      if (bulkEditData.notes) updateData.notes = bulkEditData.notes

      const response = await fetch('/api/parts/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'update',
          partIds: Array.from(selectedParts),
          vehicleId: vehicleId,
          additionalData: updateData
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setSelectedParts(new Set())
        setBulkOperation('')
        setBulkEditData({ condition: '', status: '', currentValue: '', location: '', notes: '' })
        await fetchInventory()
        alert(`Successfully updated ${data.updatedCount} parts`)
      } else {
        alert('Failed to update parts: ' + data.message)
      }
    } catch (error) {
      console.error('Bulk edit error:', error)
      alert('Error updating parts')
    } finally {
      setBulkLoading(false)
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      case 'fair': return 'bg-yellow-100 text-yellow-800'
      case 'poor': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'listed': return 'bg-blue-100 text-blue-800'
      case 'sold': return 'bg-gray-100 text-gray-800'
      case 'reserved': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading parts inventory...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Parts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Listed</p>
                <p className="text-2xl font-bold text-blue-600">{stats.listed}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sold</p>
                <p className="text-2xl font-bold text-gray-600">{stats.sold}</p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">${stats.totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Parts Inventory Management
            </CardTitle>
            
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={fetchInventory}
                variant="outline"
                size="sm"
                disabled={loading}
                className="transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              {selectedParts.size > 0 && (
                <>
                  <Button
                    onClick={() => handleBulkOperation('list')}
                    variant="default"
                    size="sm"
                    className="transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 bg-orange-600 hover:bg-orange-700"
                  >
                    List to eBay ({selectedParts.size})
                  </Button>
                  <Button
                    onClick={() => handleBulkOperation('export')}
                    variant="outline"
                    size="sm"
                    className="transition-all duration-200 hover:scale-105 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md active:scale-95"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export ({selectedParts.size})
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search parts by name, category, or subcategory..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="listed">Listed</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Operations Toolbar */}
          {selectedParts.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-800">
                    {selectedParts.size} part{selectedParts.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkOperation('export')}
                    disabled={bulkLoading}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkOperation('list')}
                    disabled={bulkLoading}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Create Listings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkOperation('update')}
                    disabled={bulkLoading}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleBulkOperation('delete')}
                    disabled={bulkLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Parts Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="p-1"
                    >
                      {selectedParts.size === filteredInventory.length ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectPart(item.id)}
                        className="p-1"
                      >
                        {selectedParts.has(item.id) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.partsMaster.partName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.partsMaster.category}</Badge>
                    </TableCell>
                    <TableCell>{item.partsMaster.subCategory || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getConditionColor(item.condition)}>
                        {item.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${item.currentValue?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewPart(item)}
                          title="View part details"
                          className="transition-all duration-200 hover:scale-110 hover:bg-blue-50 hover:text-blue-600 active:scale-95"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditPart(item)}
                          title="Edit part"
                          className="transition-all duration-200 hover:scale-110 hover:bg-green-50 hover:text-green-600 active:scale-95"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <SellOnEbay 
                          partId={item.partsMaster.id}
                          vehicleId={vehicleId}
                          partName={item.partsMaster.partName}
                          partPrice={item.currentValue || item.partsMaster.estimatedValue}
                          partCondition={item.condition}
                          trigger={
                            <Button 
                              variant="ghost" 
                              size="sm"
                              title="Sell on eBay"
                              className="transition-all duration-200 hover:scale-110 hover:bg-green-50 hover:text-green-600 active:scale-95"
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCreateDraftListing(item)}
                          title="Create eBay draft listing"
                          className="transition-all duration-200 hover:scale-110 hover:bg-orange-50 hover:text-orange-600 active:scale-95 text-blue-600 hover:text-orange-600"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeletePart(item.id)}
                          title="Delete part"
                          className="transition-all duration-200 hover:scale-110 hover:bg-red-50 hover:text-red-600 active:scale-95 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No parts found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Part Modal */}
      {viewingPart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Part Details</h3>
              <Button variant="ghost" onClick={() => setViewingPart(null)}>
                ✕
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="font-medium">Part Name:</label>
                <p>{viewingPart.partsMaster.partName}</p>
              </div>
              <div>
                <label className="font-medium">Category:</label>
                <p>{viewingPart.partsMaster.category}</p>
              </div>
              <div>
                <label className="font-medium">Subcategory:</label>
                <p>{viewingPart.partsMaster.subCategory || 'N/A'}</p>
              </div>
              <div>
                <label className="font-medium">Condition:</label>
                <p>{viewingPart.condition}</p>
              </div>
              <div>
                <label className="font-medium">Status:</label>
                <p>{viewingPart.status}</p>
              </div>
              <div>
                <label className="font-medium">Current Value:</label>
                <p>${viewingPart.currentValue?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <label className="font-medium">Location:</label>
                <p>{viewingPart.location || 'N/A'}</p>
              </div>
              <div>
                <label className="font-medium">Notes:</label>
                <p>{viewingPart.notes || 'No notes'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Part Modal */}
      {editingPart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Part</h3>
              <Button variant="ghost" onClick={() => setEditingPart(null)}>
                ✕
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="font-medium">Part Name:</label>
                <p className="text-gray-600">{editingPart.partsMaster.partName}</p>
              </div>
              <div>
                <label className="font-medium">Condition:</label>
                <Select 
                  value={editingPart.condition} 
                  onValueChange={(value) => setEditingPart({...editingPart, condition: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-medium">Status:</label>
                <Select 
                  value={editingPart.status} 
                  onValueChange={(value) => setEditingPart({...editingPart, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="listed">Listed</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-medium">Current Value:</label>
                <Input 
                  type="number" 
                  value={editingPart.currentValue || ''} 
                  onChange={(e) => setEditingPart({...editingPart, currentValue: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="font-medium">Location:</label>
                <Input 
                  value={editingPart.location || ''} 
                  onChange={(e) => setEditingPart({...editingPart, location: e.target.value})}
                />
              </div>
              <div>
                <label className="font-medium">Notes:</label>
                <textarea 
                  className="w-full p-2 border rounded"
                  rows={3}
                  value={editingPart.notes || ''} 
                  onChange={(e) => setEditingPart({...editingPart, notes: e.target.value})}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={async () => {
                  try {
                    const response = await fetch('/api/parts/bulk-operations', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        operation: 'update',
                        partIds: [editingPart.id],
                        vehicleId: vehicleId,
                        additionalData: {
                          condition: editingPart.condition,
                          status: editingPart.status,
                          currentValue: editingPart.currentValue,
                          location: editingPart.location,
                          notes: editingPart.notes
                        }
                      })
                    })

                    const data = await response.json()
                    
                    if (data.success) {
                      await fetchInventory()
                      setEditingPart(null)
                    } else {
                      alert('Failed to update part: ' + data.message)
                    }
                  } catch (error) {
                    console.error('Error updating part:', error)
                    alert('Error updating part')
                  }
                }}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingPart(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {bulkOperation === 'update' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Bulk Edit Parts</h3>
              <Button variant="ghost" onClick={() => setBulkOperation('')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Editing {selectedParts.size} selected parts. Leave fields empty to keep current values.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-medium">Condition:</label>
                  <Select value={bulkEditData.condition} onValueChange={(value) => setBulkEditData({...bulkEditData, condition: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="font-medium">Status:</label>
                  <Select value={bulkEditData.status} onValueChange={(value) => setBulkEditData({...bulkEditData, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="listed">Listed</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="font-medium">Current Value:</label>
                <Input 
                  type="number"
                  step="0.01"
                  value={bulkEditData.currentValue} 
                  onChange={(e) => setBulkEditData({...bulkEditData, currentValue: e.target.value})}
                  placeholder="Enter new value"
                />
              </div>
              
              <div>
                <label className="font-medium">Location:</label>
                <Input 
                  value={bulkEditData.location} 
                  onChange={(e) => setBulkEditData({...bulkEditData, location: e.target.value})}
                  placeholder="Enter new location"
                />
              </div>
              
              <div>
                <label className="font-medium">Notes:</label>
                <textarea 
                  className="w-full p-2 border rounded"
                  rows={3}
                  value={bulkEditData.notes} 
                  onChange={(e) => setBulkEditData({...bulkEditData, notes: e.target.value})}
                  placeholder="Enter new notes"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleBulkEdit} disabled={bulkLoading}>
                  {bulkLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Update {selectedParts.size} Parts
                </Button>
                <Button variant="outline" onClick={() => setBulkOperation('')}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
