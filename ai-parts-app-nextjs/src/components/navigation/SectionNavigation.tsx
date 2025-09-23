'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Car, 
  Package, 
  DollarSign, 
  Upload, 
  BarChart3, 
  ExternalLink,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'

interface SectionNavigationProps {
  vehicleId?: string
}

const sections = [
  {
    id: 'vin-decoder',
    label: 'VIN Decoder',
    icon: Car,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100'
  },
  {
    id: 'vehicle-management',
    label: 'Vehicle Management',
    icon: Car,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100'
  },
  {
    id: 'parts-inventory',
    label: 'Parts Inventory',
    icon: Package,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100'
  },
  {
    id: 'price-research',
    label: 'Price Research',
    icon: DollarSign,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100'
  },
  {
    id: 'bulk-listing',
    label: 'Bulk Listing',
    icon: Upload,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100'
  },
  {
    id: 'ebay-preview',
    label: 'eBay Preview',
    icon: ExternalLink,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100'
  },
  {
    id: 'listing-performance',
    label: 'Performance',
    icon: BarChart3,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100'
  }
]

export function SectionNavigation({ vehicleId }: SectionNavigationProps) {
  const [activeSection, setActiveSection] = useState('vin-decoder')
  const [isScrolling, setIsScrolling] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 80 // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      
      setActiveSection(sectionId)
      setIsMobileMenuOpen(false)
    }
  }

  // Track scroll position to highlight active section
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true)
      
      // Find which section is currently in view
      const sections = document.querySelectorAll('[data-section]')
      let currentSection = 'vin-decoder'
      
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect()
        if (rect.top <= 100 && rect.bottom >= 100) {
          currentSection = section.id
        }
      })
      
      setActiveSection(currentSection)
      
      // Clear scrolling state after a delay
      setTimeout(() => setIsScrolling(false), 150)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between py-4">
          <div className="flex items-center space-x-1">
            <Car className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">AI Parts App</span>
          </div>
          
          <nav className="flex items-center space-x-1">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              
              return (
                <Button
                  key={section.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => scrollToSection(section.id)}
                  className={`
                    transition-all duration-200 ease-in-out transform
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md scale-105' 
                      : `${section.bgColor} ${section.color} hover:scale-105 hover:shadow-sm`
                    }
                    ${isScrolling ? 'animate-pulse' : ''}
                    hover:scale-110 active:scale-95
                  `}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {section.label}
                </Button>
              )
            })}
          </nav>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <Car className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">AI Parts App</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="transition-all duration-200 hover:scale-110"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="pb-4 border-t">
              <div className="grid grid-cols-2 gap-2 mt-4">
                {sections.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  
                  return (
                    <Button
                      key={section.id}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => scrollToSection(section.id)}
                      className={`
                        transition-all duration-200 ease-in-out transform
                        ${isActive 
                          ? 'bg-blue-600 text-white shadow-md scale-105' 
                          : `${section.bgColor} ${section.color} hover:scale-105`
                        }
                        hover:scale-110 active:scale-95
                        justify-start
                      `}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {section.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
