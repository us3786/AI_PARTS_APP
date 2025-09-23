import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// eBay API endpoints
const EBAY_API_BASE = 'https://api.ebay.com'
const EBAY_SANDBOX_BASE = 'https://api.sandbox.ebay.com'

export async function POST(request: NextRequest) {
  try {
    const { 
      partId, 
      partName, 
      category, 
      subCategory, 
      price, 
      condition, 
      description, 
      images, 
      make, 
      model, 
      year,
      vehicleId,
      listingTemplate 
    } = await request.json()
    
    if (!partId || !partName || !price) {
      return NextResponse.json(
        { success: false, message: 'Part ID, name, and price are required' },
        { status: 400 }
      )
    }

    console.log(`🛒 Creating eBay listing for: ${partName} (${year} ${make} ${model})`)

    // Get eBay access token
    const ebayToken = await getEbayAccessToken()
    if (!ebayToken) {
      return NextResponse.json(
        { success: false, message: 'eBay authentication required. Please connect to eBay first.' },
        { status: 401 }
      )
    }

    // Generate listing data
    const listingData = await generateListingData({
      partId,
      partName,
      category,
      subCategory,
      price,
      condition,
      description,
      images,
      make,
      model,
      year,
      listingTemplate
    })

    // Create eBay listing
    const listingResult = await createEbayListing(ebayToken, listingData)

    if (listingResult.success) {
      // Save listing to database
      const savedListing = await saveEbayListing({
        partId,
        vehicleId,
        ebayItemId: listingResult.itemId,
        title: listingData.title,
        description: listingData.description,
        price: price,
        categoryId: listingData.categoryId,
        images: images,
        status: 'listed',
        listingDate: new Date()
      })

      // Update part status
      await prisma.partsInventory.update({
        where: { id: partId },
        data: { 
          status: 'listed',
          ebayListings: {
            connect: { id: savedListing.id }
          }
        }
      })

      return NextResponse.json({
        success: true,
        message: `Successfully created eBay listing for ${partName}`,
        listing: savedListing,
        ebayItemId: listingResult.itemId,
        ebayUrl: listingResult.viewItemUrl
      })
    } else {
      throw new Error(listingResult.error || 'Failed to create eBay listing')
    }

  } catch (error) {
    console.error('eBay listing creation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create eBay listing',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get eBay access token from database
async function getEbayAccessToken() {
  try {
    const tokenRecord = await prisma.ebayTokens.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!tokenRecord) {
      return null
    }

    // Check if token is expired
    if (new Date() >= tokenRecord.expiresAt) {
      // Try to refresh token
      const refreshResult = await refreshEbayToken(tokenRecord.refreshToken || '')
      if (refreshResult) {
        return refreshResult.access_token
      }
      return null
    }

    return tokenRecord.accessToken
  } catch (error) {
    console.error('Error getting eBay token:', error)
    return null
  }
}

// Refresh eBay token
// Refresh eBay token (env-only; no literals)
async function refreshEbayToken(refreshToken: string) {
  try {
    const clientId = process.env.EBAY_CLIENT_ID as string | undefined;
    const clientSecret = process.env.EBAY_CLIENT_SECRET as string | undefined;
    if (!clientId || !clientSecret) {
      throw new Error('Missing EBAY_CLIENT_ID / EBAY_CLIENT_SECRET');
    }

    // Build Basic auth from env
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // Allow overriding the base host if you ever need sandbox via env
    const oauthBase = process.env.EBAY_OAUTH_BASE ?? 'https://api.ebay.com';

    // Scopes aren't secrets; keep a sane default
    const scope =
      process.env.EBAY_SCOPES ??
      'https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.fulfillment https://api.ebay.com/oauth/api_scope/sell.marketing';

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope,
    }).toString();

    const response = await fetch(`${oauthBase}/identity/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const data = (await response.json().catch(() => ({}))) as any;

    if (!response.ok) {
      console.error('eBay token refresh failed:', data);
      throw new Error(
        data?.error_description || data?.message || `eBay token refresh failed (${response.status})`
      );
    }

    // Persist new tokens
    await prisma.ebayTokens.create({
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? refreshToken,
        expiresAt: new Date(Date.now() + (Number(data.expires_in) || 0) * 1000),
        tokenType: data.token_type ?? 'Bearer',
        scope: data.scope,
      },
    });

    return data as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      token_type: string;
      scope?: string;
    };
  } catch (err) {
    console.error('Error refreshing eBay token:', err);
    return null;
  }
}

// Generate comprehensive listing data
async function generateListingData({
  partName,
  category,
  subCategory,
  price,
  condition,
  description,
  images,
  make,
  model,
  year,
  listingTemplate
}: any) {
  // Generate professional title
  const title = generateListingTitle(partName, make, model, year, condition)
  
  // Generate detailed description
  const fullDescription = await generateListingDescription({
    partName,
    category,
    subCategory,
    condition,
    make,
    model,
    year,
    description,
    listingTemplate
  })

  // Get eBay category ID
  const categoryId = getEbayCategoryId(category, subCategory)

  // Process images
  const processedImages = processListingImages(images)

  return {
    title,
    description: fullDescription,
    categoryId,
    condition: mapConditionToEbay(condition),
    price: parseFloat(price),
    images: processedImages,
    returnPolicy: listingTemplate?.returnPolicy || getDefaultReturnPolicy(),
    shippingPolicy: listingTemplate?.shippingPolicy || getDefaultShippingPolicy(),
    paymentPolicy: listingTemplate?.paymentPolicy || getDefaultPaymentPolicy()
  }
}

// Generate professional listing title
function generateListingTitle(partName: string, make: string, model: string, year: number, condition: string) {
  const conditionText = condition === 'excellent' ? 'Excellent' : 
                       condition === 'good' ? 'Good' : 
                       condition === 'fair' ? 'Fair' : 'Used'
  
  return `${year} ${make} ${model} ${partName} - ${conditionText} Condition - OEM Quality`
}

// Generate detailed listing description
async function generateListingDescription({
  partName,
  category,
  subCategory,
  condition,
  make,
  model,
  year,
  description,
  listingTemplate
}: any) {
  const conditionText = condition === 'excellent' ? 'Excellent' : 
                       condition === 'good' ? 'Good' : 
                       condition === 'fair' ? 'Fair' : 'Used'

  const descriptionText = `
<div style="font-family: Arial, sans-serif; line-height: 1.6;">
  <h2 style="color: #0066cc;">${year} ${make} ${model} ${partName}</h2>
  
  <h3 style="color: #333;">Part Details:</h3>
  <ul>
    <li><strong>Part:</strong> ${partName}</li>
    <li><strong>Category:</strong> ${category}${subCategory ? ' - ' + subCategory : ''}</li>
    <li><strong>Condition:</strong> ${conditionText}</li>
    <li><strong>Vehicle:</strong> ${year} ${make} ${model}</li>
    <li><strong>OEM Quality:</strong> Original Equipment Manufacturer part</li>
  </ul>

  <h3 style="color: #333;">Condition Description:</h3>
  <p>This part is in ${conditionText.toLowerCase()} condition and ready for immediate use. All parts are carefully inspected before listing to ensure quality and functionality.</p>

  <h3 style="color: #333;">Compatibility:</h3>
  <p>This part is specifically designed for ${year} ${make} ${model} vehicles. Please verify compatibility with your specific vehicle before purchasing.</p>

  <h3 style="color: #333;">Shipping:</h3>
  <ul>
    <li>Fast and secure shipping</li>
    <li>Carefully packaged to prevent damage</li>
    <li>Tracking information provided</li>
  </ul>

  <h3 style="color: #333;">Return Policy:</h3>
  <p>We offer a 30-day return policy for unused items in original packaging. Please contact us if you have any questions.</p>

  <p style="color: #666; font-size: 12px; margin-top: 20px;">
    <strong>Note:</strong> This is a used automotive part. Some wear and minor cosmetic imperfections may be present, but the part is fully functional.
  </p>
</div>
  `.trim()

  return descriptionText
}

// Get eBay category ID for automotive parts
function getEbayCategoryId(category: string, subCategory?: string) {
  // Main automotive parts category
  const baseCategory = '6030' // Cars & Trucks > Parts

  // Map specific categories to eBay subcategories
  const categoryMap: { [key: string]: string } = {
    'Engine': '6030', // Engine & Engine Parts
    'Brakes': '6030', // Brake System
    'Suspension': '6030', // Suspension & Steering
    'Steering': '6030', // Suspension & Steering
    'Body': '6030', // Body & Trim
    'Lighting': '6030', // Lighting & Lamps
    'Interior': '6030', // Interior Parts
    'Electrical': '6030', // Electrical System
    'HVAC': '6030', // Heating & Cooling
    'Exhaust': '6030', // Exhaust System
    'Wheels': '6030' // Wheels & Tires
  }

  return categoryMap[category] || baseCategory
}

// Map internal condition to eBay condition
function mapConditionToEbay(condition: string) {
  const conditionMap: { [key: string]: string } = {
    'excellent': '3000', // Used
    'good': '3000', // Used
    'fair': '3000', // Used
    'poor': '3000' // Used
  }
  return conditionMap[condition] || '3000'
}

// Process images for eBay listing
function processListingImages(images: any[]) {
  if (!images || images.length === 0) {
    return []
  }

  // eBay allows up to 12 images, prioritize by quality
  return images
    .sort((a, b) => (b.quality || 0) - (a.quality || 0))
    .slice(0, 12)
    .map(img => ({
      imageUrl: img.url,
      title: img.title || 'Part Image'
    }))
}

// Get default return policy
function getDefaultReturnPolicy() {
  return {
    returnsAccepted: true,
    returnsWithin: '30',
    shippingCostPaidBy: 'Buyer',
    description: 'Returns accepted within 30 days. Item must be in original condition.'
  }
}

// Get default shipping policy
function getDefaultShippingPolicy() {
  return {
    shippingService: 'StandardShipping',
    shippingCost: '15.99',
    freeShipping: false,
    handlingTime: '1'
  }
}

// Get default payment policy
function getDefaultPaymentPolicy() {
  return {
    paymentMethods: ['PayPal', 'CreditCard'],
    immediatePaymentRequired: false
  }
}

// Create actual eBay listing via API
async function createEbayListing(accessToken: string, listingData: any) {
  try {
    const listingPayload = {
      listing: {
        listingDescription: listingData.description,
        quantity: 1,
        format: 'FixedPrice',
        duration: 'GTC', // Good 'Til Cancelled
        listingPolicies: {
          returnPolicy: listingData.returnPolicy,
          shippingPolicy: listingData.shippingPolicy,
          paymentPolicy: listingData.paymentPolicy
        },
        pricingSummary: {
          price: {
            value: listingData.price.toString(),
            currency: 'USD'
          }
        },
        categoryId: listingData.categoryId,
        condition: listingData.condition,
        title: listingData.title,
        aspects: {
          'Brand': 'OEM',
          'Part Type': listingData.partName,
          'Condition': listingData.condition
        },
        imageUrls: listingData.images.map((img: any) => img.imageUrl)
      }
    }

    const response = await fetch(`${EBAY_API_BASE}/sell/inventory/v1/inventory_item`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      },
      body: JSON.stringify(listingPayload)
    })

    const responseData = await response.json()

    if (response.ok) {
      return {
        success: true,
        itemId: responseData.listingId,
        viewItemUrl: responseData.viewItemUrl
      }
    } else {
      console.error('eBay API Error:', responseData)
      return {
        success: false,
        error: responseData.errors?.[0]?.message || 'Unknown eBay API error'
      }
    }

  } catch (error) {
    console.error('eBay listing creation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Save eBay listing to database
async function saveEbayListing(listingData: any) {
  try {
    const listing = await prisma.ebayListing.create({
      data: {
        partsInventoryId: listingData.partId,
        partsMasterId: listingData.partsMasterId,
        ebayItemId: listingData.ebayItemId,
        title: listingData.title,
        description: listingData.description,
        price: listingData.price,
        currency: 'USD',
        categoryId: listingData.categoryId,
        images: listingData.images,
        status: listingData.status,
        listingDate: listingData.listingDate
      }
    })

    return listing
  } catch (error) {
    console.error('Error saving eBay listing:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    const status = searchParams.get('status')

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: 'Vehicle ID is required' },
        { status: 400 }
      )
    }

    // Get eBay listings for vehicle
    const whereClause: any = {
      partsInventory: {
        vehicleId: vehicleId
      }
    }

    if (status) {
      whereClause.status = status
    }

    const listings = await prisma.ebayListing.findMany({
      where: whereClause,
      include: {
        partsInventory: {
          include: {
            partsMaster: true
          }
        }
      },
      orderBy: { listingDate: 'desc' }
    })

    return NextResponse.json({
      success: true,
      listings,
      totalListings: listings.length
    })

  } catch (error) {
    console.error('Error fetching eBay listings:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch eBay listings',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
