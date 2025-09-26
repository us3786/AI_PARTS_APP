'use client'

import { useState } from 'react'
import { VINDecoder } from '@/components/forms/VINDecoder'
import { EbayConnection } from '@/components/forms/EbayConnection'
import { EnhancedPartsDashboard } from '@/components/dashboard/EnhancedPartsDashboard'
import { PriceResearchDashboard } from '@/components/dashboard/PriceResearchDashboard'
import { BulkListingDashboard } from '@/components/dashboard/BulkListingDashboard'
import { ListingPerformanceDashboard } from '@/components/dashboard/ListingPerformanceDashboard'
import { EbayListingPreview } from '@/components/dashboard/EbayListingPreview'
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard'
import { VehicleManagement } from '@/components/dashboard/VehicleManagement'
import { VehiclePhotosDashboard } from '@/components/dashboard/VehiclePhotosDashboard'
import { ImageManagementDashboard } from '@/components/dashboard/ImageManagementDashboard'
import { BackgroundImageHunter } from '@/components/dashboard/BackgroundImageHunter'
import { SectionNavigation } from '@/components/navigation/SectionNavigation'
import { Vehicle } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, Wrench, Database, Settings, CheckCircle, AlertCircle } from 'lucide-react'

export default function Home() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [setupProgress, setSetupProgress] = useState('')
  const [setupComplete, setSetupComplete] = useState(false)
  const [setupError, setSetupError] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [bulkListingRefreshTrigger, setBulkListingRefreshTrigger] = useState(0)

  const stopSetup = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
    }
    setIsSettingUp(false)
    setSetupProgress('Setup cancelled by user')
    setSetupComplete(true)
    setSetupError(true)
    console.log('🛑 Setup process cancelled by user')
  }

  const handleVehicleDecoded = async (decodedVehicle: Vehicle) => {
    setVehicle(decodedVehicle)
    setIsSettingUp(true)
    
    // Create abort controller for this setup process
    const controller = new AbortController()
    setAbortController(controller)
    
    // Automatically populate parts and run price research for new vehicle
    try {
      console.log(`🚗 New vehicle decoded: ${decodedVehicle.year} ${decodedVehicle.make} ${decodedVehicle.model}`)
      
      // Step 1: Populate parts inventory
      setSetupProgress('Populating parts inventory...')
      console.log('📦 Auto-populating parts inventory...')
      const populateResponse = await fetch('/api/parts/populate-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: decodedVehicle.id,
          selectedCategories: [] // Populate all categories
        }),
        signal: controller.signal
      })
      
      const populateData = await populateResponse.json()
      if (populateData.success) {
        // Compute the count with fallbacks to avoid undefined
        const addedCount =
          typeof populateData?.createdCount === "number"
            ? populateData.createdCount
            : Array.isArray(populateData?.parts)
              ? populateData.parts.length
              : (typeof populateData?.totalParts === "number" ? populateData.totalParts : 0);
        
        console.log(`✅ Parts populated: ${addedCount} new parts added`)
        
        // Images are now automatically collected during price research
        // No need for separate background image hunting
        console.log('✅ Images will be collected automatically during price research')
      } else {
        console.warn('⚠️ Parts population failed:', populateData.message)
      }
      
      // Step 2: Skip automatic price research - let user trigger manually
      setSetupProgress('Vehicle setup complete! Use Price Research button to analyze pricing.')
      console.log('✅ Vehicle setup complete - price research available via manual button')
      
      setSetupProgress('Setup completed!')
      setSetupComplete(true)
      setSetupError(false)
      console.log('🎉 New vehicle setup completed!')
      
    } catch (error) {
      if (controller.signal.aborted) {
        console.log('🛑 Setup cancelled by user')
        setSetupProgress('Setup cancelled by user')
        setSetupComplete(true)
        setSetupError(true)
      } else {
        console.error('❌ Error during new vehicle setup:', error)
        setSetupProgress('Setup completed with some errors')
        setSetupComplete(true)
        setSetupError(true)
      }
    } finally {
      setIsSettingUp(false)
      setAbortController(null)
      setTimeout(() => {
        setSetupProgress('')
        setSetupComplete(false)
        setSetupError(false)
      }, 5000) // Clear progress message after 5 seconds
    }
  }

  const handleVehicleSelected = async (selectedVehicle: Vehicle) => {
    setVehicle(selectedVehicle)
    console.log(`🚗 Vehicle selected: ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`)
    console.log('✅ Vehicle selected - no automatic setup needed')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Section Navigation */}
      <SectionNavigation vehicleId={vehicle?.id} />

      {/* Main Content */}
      <main className="w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="max-w-none space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Welcome Section */}
          <div className="text-center px-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Welcome to AI Parts App
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Select a saved vehicle to populate parts and prices, or decode a new VIN to get started with your automotive projects.
            </p>
            
            {/* Setup Progress Indicator */}
            {(isSettingUp || setupComplete) && (
              <div className="mt-6 max-w-md mx-auto">
                <Card className={`${
                  setupComplete 
                    ? setupError 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-green-50 border-green-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center space-x-3">
                      {isSettingUp ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      ) : setupError ? (
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      ) : (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      )}
                      <div className={`font-medium ${
                        setupComplete 
                          ? setupError 
                            ? 'text-red-800' 
                            : 'text-green-800'
                          : 'text-blue-800'
                      }`}>
                        {setupProgress}
                      </div>
                    </div>
                    {isSettingUp && (
                      <div className="mt-3 text-center">
                        <p className="text-sm text-blue-600 mb-3">
                          This may take a few minutes for comprehensive research...
                        </p>
                        <button
                          onClick={stopSetup}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                        >
                          Stop Setup
                        </button>
                      </div>
                    )}
                    {setupComplete && !setupError && (
                      <p className="text-sm text-green-600 mt-2 text-center">
                        All parts populated and price research completed!
                      </p>
                    )}
                    {setupComplete && setupError && (
                      <p className="text-sm text-red-600 mt-2 text-center">
                        Setup completed with some errors. Check console for details.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Vehicle Management Section - Primary Interface */}
          <div id="vehicle-management" data-section="vehicle-management" className="w-full">
            <VehicleManagement onVehicleSelect={handleVehicleSelected} />
          </div>

          {/* VIN Decoder Section - For adding new vehicles */}
          <div id="vin-decoder" data-section="vin-decoder" className="w-full max-w-4xl mx-auto">
            <VINDecoder onVehicleDecoded={handleVehicleDecoded} />
          </div>

          {/* Parts Dashboard - Show when vehicle is decoded */}
        {vehicle && (
          <div className="w-full space-y-4 sm:space-y-6 lg:space-y-8">
            <div id="parts-inventory" data-section="parts-inventory">
              <EnhancedPartsDashboard vehicleId={vehicle.id} />
            </div>
            <div id="vehicle-photos" data-section="vehicle-photos">
              <VehiclePhotosDashboard vehicleId={vehicle.id} />
            </div>
            <div id="image-management" data-section="image-management">
              <BackgroundImageHunter vehicleId={vehicle.id} className="mb-6" />
              <ImageManagementDashboard vehicleId={vehicle.id} />
            </div>
            <div id="price-research" data-section="price-research">
              <PriceResearchDashboard 
                vehicleId={vehicle.id} 
                onPriceResearchComplete={() => {
                  console.log('🔄 Price research completed, refreshing bulk listing...')
                  setBulkListingRefreshTrigger(prev => prev + 1)
                }}
              />
            </div>
            <div id="bulk-listing" data-section="bulk-listing">
              <BulkListingDashboard vehicleId={vehicle.id} refreshTrigger={bulkListingRefreshTrigger} />
            </div>
            <div id="ebay-preview" data-section="ebay-preview">
              <EbayListingPreview vehicleId={vehicle.id} />
            </div>
            <div id="listing-performance" data-section="listing-performance">
              <ListingPerformanceDashboard vehicleId={vehicle.id} />
            </div>
          </div>
        )}

          {/* eBay Connection Section */}
          <div className="w-full max-w-4xl mx-auto">
            <EbayConnection />
          </div>

          {/* Analytics Dashboard */}
          <div id="analytics" data-section="analytics" className="w-full">
            <AnalyticsDashboard />
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Car className="h-5 w-5 text-blue-600" />
                  <span>VIN Decoding</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Decode any 17-character VIN to get detailed vehicle information including make, model, year, and specifications.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-green-600" />
                  <span>AI Parts Search</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Get intelligent part suggestions based on your vehicle's specifications and maintenance needs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-purple-600" />
                  <span>Data Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Store and manage your vehicle data, parts inventory, and project history in one place.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Information Display */}
          {vehicle && (
            <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Car className="h-5 w-5 text-blue-600" />
                    <span>Decoded Vehicle Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Make</label>
                      <p className="text-lg font-semibold">{vehicle.make}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Model</label>
                      <p className="text-lg font-semibold">{vehicle.model}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Year</label>
                      <p className="text-lg font-semibold">{vehicle.year}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">VIN</label>
                      <p className="text-lg font-mono">{vehicle.vin}</p>
                    </div>
                    {vehicle.engine && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Engine</label>
                        <p className="text-lg">{vehicle.engine}</p>
                      </div>
                    )}
                    {vehicle.transmission && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Transmission</label>
                        <p className="text-lg">{vehicle.transmission}</p>
                      </div>
                    )}
                    {vehicle.driveType && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Drive Type</label>
                        <p className="text-lg">{vehicle.driveType}</p>
                      </div>
                    )}
                    {vehicle.fuelType && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Fuel Type</label>
                        <p className="text-lg">{vehicle.fuelType}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Parts Dashboard */}
              <EnhancedPartsDashboard vehicleId={vehicle.id} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8 sm:mt-12 lg:mt-16">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center text-gray-600">
            <p className="text-sm sm:text-base">&copy; 2025 AI Parts App. Built with Next.js and TypeScript.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}