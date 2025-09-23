'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Part } from '@/types'
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

interface PartsFilterProps {
  parts: Part[]
  onFilteredParts: (parts: Part[]) => void
  className?: string
}

interface FilterState {
  search: string
  category: string
  priority: string
  priceRange: [number, number]
  sortBy: string
  sortOrder: 'asc' | 'desc'
  showExpanded: boolean
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'category', label: 'Category' },
  { value: 'priority', label: 'Priority' },
]

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'high', label: 'High Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'low', label: 'Low Priority' },
]

export function PartsFilter({ parts, onFilteredParts, className }: PartsFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    priority: 'all',
    priceRange: [0, 1000],
    sortBy: 'relevance',
    sortOrder: 'asc',
    showExpanded: false
  })

  // Extract unique categories from parts
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(parts.map(part => part.category)))
    return [
      { value: 'all', label: 'All Categories' },
      ...uniqueCategories.map(cat => ({ value: cat, label: cat }))
    ]
  }, [parts])

  // Get price range from parts
  const priceRange = useMemo(() => {
    if (parts.length === 0) return [0, 1000]
    const prices = parts.map(p => p.price || 0).filter(p => p > 0)
    if (prices.length === 0) return [0, 1000]
    return [Math.min(...prices), Math.max(...prices)]
  }, [parts])

  const filteredParts = useMemo(() => {
    let filtered = [...parts]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(part =>
        part.description.toLowerCase().includes(searchLower) ||
        part.category.toLowerCase().includes(searchLower) ||
        part.partNumber.toLowerCase().includes(searchLower)
      )
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(part => part.category === filters.category)
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(part => part.priority === filters.priority)
    }

    // Price filter
    filtered = filtered.filter(part => {
      const price = part.price || 0
      return price >= filters.priceRange[0] && price <= filters.priceRange[1]
    })

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortBy) {
        case 'price-low':
        case 'price-high':
          const priceA = a.price || 0
          const priceB = b.price || 0
          comparison = priceA - priceB
          if (filters.sortBy === 'price-high') comparison = -comparison
          break
        case 'name':
          comparison = a.description.localeCompare(b.description)
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          comparison = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
          break
        default:
          // Keep original order for relevance
          comparison = 0
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [parts, filters])

  // Update filtered parts when filters change
  useEffect(() => {
    onFilteredParts(filteredParts)
  }, [filteredParts, onFilteredParts])

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      priority: 'all',
      priceRange: priceRange,
      sortBy: 'relevance',
      sortOrder: 'asc',
      showExpanded: false
    })
  }

  const activeFiltersCount = [
    filters.search,
    filters.category !== 'all',
    filters.priority !== 'all',
    filters.priceRange[0] !== priceRange[0] || filters.priceRange[1] !== priceRange[1]
  ].filter(Boolean).length

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Parts Filter
            {activeFiltersCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {activeFiltersCount} active
              </span>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilter('showExpanded', !filters.showExpanded)}
            >
              {filters.showExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  More
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search parts..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category */}
          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={filters.priority}
            onChange={(e) => updateFilter('priority', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {PRIORITY_OPTIONS.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Expanded Filters */}
        {filters.showExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Price Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
              </label>
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange[0]}
                  onChange={(e) => updateFilter('priceRange', [parseInt(e.target.value) || 0, filters.priceRange[1]])}
                  className="w-24"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange[1]}
                  onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], parseInt(e.target.value) || 1000])}
                  className="w-24"
                />
              </div>
            </div>

            {/* Sort Order */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium">Sort Order:</label>
              <div className="flex gap-2">
                <Button
                  variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilter('sortOrder', 'asc')}
                >
                  Ascending
                </Button>
                <Button
                  variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilter('sortOrder', 'desc')}
                >
                  Descending
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="text-sm text-gray-600 pt-2 border-t">
          Showing {filteredParts.length} of {parts.length} parts
          {activeFiltersCount > 0 && ` (${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied)`}
        </div>
      </CardContent>
    </Card>
  )
}
