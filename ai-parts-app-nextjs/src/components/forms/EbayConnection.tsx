'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface EbayTokens {
  id: string
  accessToken: string
  refreshToken?: string
  expiresAt: Date
  tokenType: string
  scope?: string
  createdAt: Date
  updatedAt: Date
}

export function EbayConnection() {
  const [tokens, setTokens] = useState<EbayTokens | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  const checkConnectionStatus = async () => {
    setCheckingStatus(true)
    try {
      const response = await fetch('/api/ebay/status')
      if (response.ok) {
        const data = await response.json()
        setTokens(data.tokens)
      }
    } catch (err) {
      console.error('Error checking eBay connection:', err)
    } finally {
      setCheckingStatus(false)
    }
  }

  const connectToEbay = () => {
    setLoading(true)
    setError(null)
    
    // Redirect to eBay OAuth
    window.location.href = '/api/ebay/oauth'
  }

  const refreshToken = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ebay/refresh', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        setTokens(prev => prev ? { ...prev, accessToken: data.token, expiresAt: new Date(data.expiresAt) } : null)
      } else {
        setError(data.message || 'Failed to refresh token')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Token refresh error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkConnectionStatus()
  }, [])

  const isTokenExpired = (expiresAt: Date) => {
    return new Date() >= new Date(expiresAt)
  }

  const isTokenExpiringSoon = (expiresAt: Date) => {
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)
    return new Date(expiresAt) <= fiveMinutesFromNow
  }

  if (checkingStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            eBay Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Checking connection status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!tokens) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            eBay Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto text-orange-500" />
            <h3 className="font-semibold">Not Connected to eBay</h3>
            <p className="text-sm text-gray-600">
              Connect to eBay to enable parts searching and price comparison features.
            </p>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button onClick={connectToEbay} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect to eBay
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const tokenExpired = isTokenExpired(tokens.expiresAt)
  const tokenExpiringSoon = isTokenExpiringSoon(tokens.expiresAt)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          eBay Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {tokenExpired ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : tokenExpiringSoon ? (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          <span className="font-medium">
            {tokenExpired ? 'Connection Expired' : tokenExpiringSoon ? 'Connection Expiring Soon' : 'Connected'}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Token Type:</span>
            <span>{tokens.tokenType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Expires:</span>
            <span className={tokenExpired ? 'text-red-600' : tokenExpiringSoon ? 'text-yellow-600' : 'text-green-600'}>
              {new Date(tokens.expiresAt).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Connected:</span>
            <span>{new Date(tokens.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={refreshToken} 
            disabled={loading} 
            variant="outline" 
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Refreshing...
              </>
            ) : (
              'Refresh Token'
            )}
          </Button>
          <Button onClick={connectToEbay} variant="outline" className="flex-1">
            Reconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
