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
import { 
  Loader2, 
  Eye, 
  Edit, 
  Trash2, 
  ExternalLink,
  Save,
  X,
  RefreshCw,
  DollarSign,
  Image as ImageIcon,
  FileText
} from 'lucide-react'

interface EbayListingPreviewProps {
  vehicleId: string
  className?: string
}

interface ListingPreview {
  id: string
  partName: string
  category: string
  subCategory?: string
  condition: string
  price: number
  title: string
  description: string
  categoryId: string
  images: string[]
  status: 'draft' | 'ready' | 'listed' | 'ended' | 'sold'
  listingDate?: Date
  ebayItemId?: string
  ebayUrl?: string
  performanceData?: any
}

export function EbayListingPreview({ vehicleId, className }: EbayListingPreviewProps) {
  const [listings, setListings] = useState<ListingPreview[]>([])
  const [filteredListings, setFilteredListings] = useState<ListingPreview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingListing, setEditingListing] = useState<ListingPreview | null>(null)
  const [viewingListing, setViewingListing] = useState<ListingPreview | null>(null)

  const fetchListings = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/ebay/listings/create?vehicleId=${vehicleId}`)
      const data = await response.json()

      if (data.success) {
        setListings(data.listings || [])
        setFilteredListings(data.listings || [])
      } else {
        setError(data.message || 'Failed to fetch listings')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Error fetching listings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (vehicleId) {
      fetchListings()
    }
  }, [vehicleId])

  // Filter listings based on search and status
  useEffect(() => {
    let filtered = listings

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(listing => listing.status === statusFilter)
    }

    setFilteredListings(filtered)
  }, [listings, searchTerm, statusFilter])

  const handleEditListing = (listing: ListingPreview) => {
    setEditingListing(listing)
  }

  const handleViewListing = (listing: ListingPreview) => {
    setViewingListing(listing)
  }

  const handleDeleteListing = async (listingId: string) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      try {
        const response = await fetch('/api/ebay/listings/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listingId,
            action: 'endListing'
          })
        })

        const data = await response.json()
        
        if (data.success) {
          await fetchListings()
        } else {
          alert('Failed to delete listing: ' + data.message)
        }
      } catch (error) {
        console.error('Error deleting listing:', error)
        alert('Error deleting listing')
      }
    }
  }

  const handleSaveListing = async () => {
    if (!editingListing) return

    try {
      const response = await fetch('/api/ebay/listings/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: editingListing.id,
          action: 'updateStatus',
          data: {
            status: editingListing.status,
            title: editingListing.title,
            description: editingListing.description,
            price: editingListing.price
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchListings()
        setEditingListing(null)
      } else {
        alert('Failed to update listing: ' + data.message)
      }
    } catch (error) {
      console.error('Error updating listing:', error)
      alert('Error updating listing')
    }
  }

  const generateListingPreview = (listing: ListingPreview) => {
    return {
      title: listing.title,
      description: listing.description,
      price: listing.price,
      condition: listing.condition,
      category: listing.category,
      images: listing.images,
      status: listing.status
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            eBay Listings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading listings...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              eBay Listings Preview
            </CardTitle>
            <Button onClick={fetchListings} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search listings by part name, title, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="listed">Listed</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Listings Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium">
                      {listing.partName}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {listing.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{listing.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{listing.condition}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${listing.price.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          listing.status === 'listed' ? 'default' :
                          listing.status === 'sold' ? 'secondary' :
                          listing.status === 'draft' ? 'outline' : 'destructive'
                        }
                      >
                        {listing.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewListing(listing)}
                          title="Preview listing"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditListing(listing)}
                          title="Edit listing"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {listing.ebayUrl && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(listing.ebayUrl, '_blank')}
                            title="View on eBay"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteListing(listing.id)}
                          title="Delete listing"
                          className="text-red-600 hover:text-red-700"
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

          {filteredListings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No listings found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Listing Modal */}
      {viewingListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">eBay Listing Preview</h3>
              <Button variant="ghost" onClick={() => setViewingListing(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Listing Title */}
              <div>
                <label className="font-medium text-sm text-gray-600">Listing Title</label>
                <h2 className="text-xl font-bold text-gray-900 mt-1">
                  {viewingListing.title}
                </h2>
              </div>

              {/* Price and Status */}
              <div className="flex gap-4">
                <div>
                  <label className="font-medium text-sm text-gray-600">Price</label>
                  <p className="text-2xl font-bold text-green-600">
                    ${viewingListing.price.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="font-medium text-sm text-gray-600">Status</label>
                  <Badge 
                    variant={
                      viewingListing.status === 'listed' ? 'default' :
                      viewingListing.status === 'sold' ? 'secondary' :
                      viewingListing.status === 'draft' ? 'outline' : 'destructive'
                    }
                    className="mt-1"
                  >
                    {viewingListing.status}
                  </Badge>
                </div>
              </div>

              {/* Images */}
              {viewingListing.images && viewingListing.images.length > 0 && (
                <div>
                  <label className="font-medium text-sm text-gray-600">Images</label>
                  <div className="flex gap-2 mt-2">
                    {viewingListing.images.map((image, index) => (
                      <div key={index} className="w-20 h-20 border rounded overflow-hidden">
                        <img 
                          src={image} 
                          alt={`Listing image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="font-medium text-sm text-gray-600">Description</label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: viewingListing.description }}
                  />
                </div>
              </div>

              {/* eBay Link */}
              {viewingListing.ebayUrl && (
                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => window.open(viewingListing.ebayUrl, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on eBay
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {editingListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit eBay Listing</h3>
              <Button variant="ghost" onClick={() => setEditingListing(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="font-medium">Part Name</label>
                <p className="text-gray-600">{editingListing.partName}</p>
              </div>

              <div>
                <label className="font-medium">Listing Title</label>
                <Input 
                  value={editingListing.title} 
                  onChange={(e) => setEditingListing({...editingListing, title: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-medium">Price</label>
                <Input 
                  type="number" 
                  value={editingListing.price} 
                  onChange={(e) => setEditingListing({...editingListing, price: parseFloat(e.target.value) || 0})}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-medium">Status</label>
                <Select 
                  value={editingListing.status} 
                  onValueChange={(value) => setEditingListing({...editingListing, status: value as any})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="listed">Listed</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-medium">Description</label>
                <textarea 
                  className="w-full p-3 border rounded mt-1"
                  rows={8}
                  value={editingListing.description} 
                  onChange={(e) => setEditingListing({...editingListing, description: e.target.value})}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveListing}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingListing(null)}>
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
