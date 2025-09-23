import { VINDecodeResponse, EbayTokenResponse, EbaySearchResponse } from '@/types'

// Extract trim level from NHTSA API response
function extractTrimLevel(variables: any): string | null {
  // Common field names that might contain trim level information
  const trimFields = [
    'Series',
    'Trim',
    'Trim Level',
    'SubModel',
    'Body Style',
    'Vehicle Type',
    'Series/Trim',
    'Trim/Style',
    'Model/Trim',
    'Trim Level/Series',
    'Body Type',
    'Style',
    'Grade',
    'Package',
    'Edition',
    'Version',
    'Configuration'
  ]
  
  // Look for trim level in various fields
  for (const field of trimFields) {
    const value = variables[field]
    if (value && value !== 'Not Applicable' && value !== 'N/A' && value.trim() !== '') {
      return value.trim()
    }
  }
  
  // Try to extract from model field if it contains trim info
  const model = variables.Model
  if (model && typeof model === 'string') {
    // Look for common trim patterns in model name
    const trimPatterns = [
      /(EX|LX|DX|Si|Type R|Sport|Touring|Limited|Premium|Base|SE|LE|XLE|XSE|Hybrid|Platinum|Titanium|ST|RS|GT|GTS|Turbo|EcoBoost)/i,
      /(S|SV|SL|SR|SR5|TRD|Off-Road|Pro|Adventure|Nightshade|Night Edition)/i,
      /(LT|LS|LTZ|Z71|High Country|Custom|Work Truck|RST|Premier|Activ)/i,
      /(SEL|SE|S|Titanium|Platinum|Limited|King Ranch|Lariat|XLT|XL|STX)/i,
      /(S|SV|SL|SR|SR5|TRD|Off-Road|Pro|Adventure|Nightshade|Night Edition)/i
    ]
    
    for (const pattern of trimPatterns) {
      const match = model.match(pattern)
      if (match) {
        return match[1]
      }
    }
  }
  
  // Try to extract from body style if it contains trim info
  const bodyStyle = variables['Body Style'] || variables['Body Type']
  if (bodyStyle && typeof bodyStyle === 'string') {
    const bodyStylePatterns = [
      /(EX|LX|DX|Si|Type R|Sport|Touring|Limited|Premium|Base|SE|LE|XLE|XSE|Hybrid|Platinum|Titanium|ST|RS|GT|GTS|Turbo|EcoBoost)/i,
      /(S|SV|SL|SR|SR5|TRD|Off-Road|Pro|Adventure|Nightshade|Night Edition)/i,
      /(LT|LS|LTZ|Z71|High Country|Custom|Work Truck|RST|Premier|Activ)/i,
      /(SEL|SE|S|Titanium|Platinum|Limited|King Ranch|Lariat|XLT|XL|STX)/i
    ]
    
    for (const pattern of bodyStylePatterns) {
      const match = bodyStyle.match(pattern)
      if (match) {
        return match[1]
      }
    }
  }
  
  return null
}

// Extract engine size from NHTSA API response
function extractEngineSize(variables: any): string | null {
  // Common field names that might contain engine size information
  const engineSizeFields = [
    'Displacement (L)',
    'Displacement (CC)',
    'Displacement',
    'Engine Displacement (L)',
    'Engine Displacement (CC)',
    'Engine Size (L)',
    'Engine Size (CC)',
    'Engine Size',
    'Displacement (Liters)',
    'Displacement (Cubic Centimeters)',
    'Engine Displacement',
    'Engine Displacement (Liters)',
    'Engine Displacement (Cubic Centimeters)',
    'Engine Configuration',
    'Engine Cylinders',
    'Engine Type',
    'Engine Model',
    'Engine Family',
    'Engine Series',
    'Engine Code',
    'Engine Name',
    'Engine Description'
  ]
  
  // Look for engine size in various fields
  for (const field of engineSizeFields) {
    const value = variables[field]
    if (value && value !== 'Not Applicable' && value !== 'N/A' && value.trim() !== '') {
      // Format the engine size nicely
      let formattedSize = value.trim()
      
      // If it's just a number, add "L" for liters
      if (/^\d+\.?\d*$/.test(formattedSize)) {
        formattedSize = `${formattedSize}L`
      }
      
      // If it's in CC, convert to L
      if (formattedSize.includes('CC') || formattedSize.includes('cc')) {
        const ccValue = parseFloat(formattedSize.replace(/[^\d.]/g, ''))
        if (!isNaN(ccValue)) {
          formattedSize = `${(ccValue / 1000).toFixed(1)}L`
        }
      }
      
      return formattedSize
    }
  }
  
  // Try to extract from engine configuration if available
  const engineConfig = variables['Engine Configuration']
  if (engineConfig && typeof engineConfig === 'string') {
    // Look for common engine size patterns
    const enginePatterns = [
      /(\d+\.?\d*)\s*L/i,
      /(\d+\.?\d*)\s*Liter/i,
      /(\d+\.?\d*)\s*Litre/i,
      /(\d+\.?\d*)\s*CC/i,
      /(\d+\.?\d*)\s*cc/i,
      /V(\d+)/i,
      /I(\d+)/i,
      /H(\d+)/i
    ]
    
    for (const pattern of enginePatterns) {
      const match = engineConfig.match(pattern)
      if (match) {
        let size = match[1]
        if (pattern.source.includes('CC') || pattern.source.includes('cc')) {
          const ccValue = parseFloat(size)
          if (!isNaN(ccValue)) {
            size = `${(ccValue / 1000).toFixed(1)}L`
          }
        } else if (pattern.source.includes('V') || pattern.source.includes('I') || pattern.source.includes('H')) {
          size = `${size}-Cylinder`
        } else if (!size.includes('L')) {
          size = `${size}L`
        }
        return size
      }
    }
  }
  
  return null
}

// NHTSA VIN Decoding API
export async function decodeVIN(vin: string): Promise<VINDecodeResponse> {
  try {
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`)
    
    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.Results && data.Results.length > 0) {
      // NHTSA API returns an array of variable-value pairs, not a single object
      const variables = data.Results.reduce((acc: any, item: any) => {
        acc[item.Variable] = item.Value
        return acc
      }, {})
      
      // Extract trim level from various possible fields
      const trimLevel = extractTrimLevel(variables)
      
      // Extract engine size information
      const engineSize = extractEngineSize(variables)
      
      return {
        success: true,
        vin: vin,
        make: variables.Make || '',
        model: variables.Model || '',
        year: variables['Model Year'] || '',
        submodel: variables.SubModel || '',
        trimLevel: trimLevel,
        engineSize: engineSize,
        details: variables
      }
    } else {
      return {
        success: false,
        vin: vin,
        message: 'No vehicle data found for this VIN'
      }
    }
  } catch (error) {
    console.error('VIN decode error:', error)
    return {
      success: false,
      vin: vin,
      message: `Error decoding VIN: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Keep your existing EbayTokenResponse type.
// import type { EbayTokenResponse } from './wherever';

const OAUTH_BASE = process.env.EBAY_OAUTH_BASE ?? 'https://api.ebay.com'; // set to https://api.sandbox.ebay.com for sandbox

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function basicAuthHeader(): string {
  const clientId = requireEnv('EBAY_CLIENT_ID');
  const clientSecret = requireEnv('EBAY_CLIENT_SECRET');
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  return `Basic ${credentials}`;
}

// eBay OAuth Token Exchange (authorization_code → tokens)
export async function exchangeCodeForTokens(code: string): Promise<EbayTokenResponse | null> {
  try {
    const redirectUri = requireEnv('EBAY_REDIRECT_URI'); // must EXACTLY match what's registered with eBay

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString();

    const res = await fetch(`${OAUTH_BASE}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: basicAuthHeader(),
      },
      body,
    });

    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      throw new Error(data?.error_description || data?.message || `eBay token exchange failed (${res.status})`);
    }

    return data as EbayTokenResponse;
  } catch (err) {
    console.error('eBay token exchange error:', err);
    return null;
  }
}

// eBay Token Refresh (refresh_token → new tokens)
export async function refreshEbayToken(refreshToken: string): Promise<EbayTokenResponse | null> {
  try {
    const scopes =
      process.env.EBAY_SCOPES ??
      'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.fulfillment https://api.ebay.com/oauth/api_scope/sell.marketing';

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: scopes,
    }).toString();

    const res = await fetch(`${OAUTH_BASE}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: basicAuthHeader(),
      },
      body,
    });

    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      throw new Error(data?.error_description || data?.message || `eBay token refresh failed (${res.status})`);
    }

    return data as EbayTokenResponse;
  } catch (err) {
    console.error('eBay token refresh error:', err);
    return null;
  }
}

// eBay Parts Search
export async function searchEbayParts(partNumber: string, accessToken: string): Promise<EbaySearchResponse | null> {
  try {
    const response = await fetch('https://api.ebay.com/buy/browse/v1/item_summary/search', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      // Note: This is a simplified example. You'll need to implement the full eBay API integration
      // based on your existing fetch_parts.py logic
    })
    
    if (!response.ok) {
      throw new Error(`eBay search failed: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('eBay search error:', error)
    return null
  }
}

// Generate eBay OAuth URL
export function generateEbayAuthUrl(): string {
  // Use environment variable or fallback to ngrok URL
  const redirectUri = 'http://localhost:3000/api/ebay/callback'
  
  const params = new URLSearchParams({
    const clientId = process.env.EBAY_CLIENT_ID as string;,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.fulfillment https://api.ebay.com/oauth/api_scope/sell.marketing',
    state: 'ebay_oauth_state'
  })
  
  const authUrl = `https://auth.ebay.com/oauth2/authorize?${params.toString()}`
  console.log('Generated eBay OAuth URL:', authUrl)
  console.log('Using redirect URI:', redirectUri)
  return authUrl
}
