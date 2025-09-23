import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Default settings from your existing settings_manager.py
const DEFAULT_SETTINGS = {
  "app_scheme": "https",
  "app_hostname": "bfa3-172-250-227-47.ngrok-free.app",
  "app_port": "",
  "ebay_redirect_uri_path": "/ebay-callback"
}

export async function GET() {
  try {
    // Get all settings from database
    const settings = await prisma.settings.findMany()
    
    // Convert to object format
    const settingsObject: any = {}
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value
    })

    // Merge with defaults for missing keys
    const mergedSettings = { ...DEFAULT_SETTINGS, ...settingsObject }

    return NextResponse.json({
      success: true,
      settings: mergedSettings
    })
  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch settings',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const settingsData = await request.json()
    
    if (!settingsData || typeof settingsData !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Invalid settings data' },
        { status: 400 }
      )
    }

    // Update settings in database
    const updatedSettings = []
    for (const [key, value] of Object.entries(settingsData)) {
      if (typeof value === 'string') {
        const setting = await prisma.settings.upsert({
          where: { key },
          update: { 
            value: value as string,
            updatedAt: new Date()
          },
          create: {
            key,
            value: value as string,
            description: `Setting for ${key}`
          }
        })
        updatedSettings.push(setting)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings
    })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update settings',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
