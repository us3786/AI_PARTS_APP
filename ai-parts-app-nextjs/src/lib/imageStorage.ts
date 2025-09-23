import { writeFile, mkdir, unlink, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { imageProcessor } from './imageProcessor'

export interface ImageStorageConfig {
  baseDir: string
  useCDN: boolean
  cdnDomain?: string
  enableWebP: boolean
  enableWatermark: boolean
  watermarkPath?: string
}

export interface StoredImage {
  id: string
  originalPath: string
  thumbnailPath: string
  mediumPath: string
  ebayPath: string
  webpPaths: string[]
  cdnUrls: {
    original: string
    thumbnail: string
    medium: string
    ebay: string
    webp: string[]
  }
  metadata: {
    width: number
    height: number
    size: number
    format: string
  }
}

export class ImageStorageManager {
  private static instance: ImageStorageManager
  private config: ImageStorageConfig

  constructor(config: ImageStorageConfig) {
    this.config = config
  }

  static getInstance(): ImageStorageManager {
    if (!ImageStorageManager.instance) {
      ImageStorageManager.instance = new ImageStorageManager({
        baseDir: join(process.cwd(), 'public', 'uploads'),
        useCDN: process.env.NODE_ENV === 'production',
        cdnDomain: process.env.CDN_DOMAIN,
        enableWebP: true,
        enableWatermark: false
      })
    }
    return ImageStorageManager.instance
  }

  /**
   * Store vehicle photos with full processing pipeline
   */
  async storeVehiclePhotos(
    vehicleId: string,
    files: File[],
    descriptions: string[] = []
  ): Promise<StoredImage[]> {
    const vehicleDir = join(this.config.baseDir, 'vehicles', vehicleId)
    const storedImages: StoredImage[] = []

    // Ensure vehicle directory exists
    await this.ensureDirectoryExists(vehicleDir)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const description = descriptions[i] || `Vehicle photo ${i + 1}`
      
      try {
        const storedImage = await this.storeSingleImage(
          file,
          vehicleDir,
          'vehicle',
          vehicleId,
          description
        )
        storedImages.push(storedImage)
      } catch (error) {
        console.error(`Error storing vehicle photo ${i + 1}:`, error)
        // Continue with other files
      }
    }

    return storedImages
  }

  /**
   * Store part images with full processing pipeline
   */
  async storePartImages(
    partId: string,
    files: File[],
    descriptions: string[] = []
  ): Promise<StoredImage[]> {
    const partDir = join(this.config.baseDir, 'parts', partId)
    const storedImages: StoredImage[] = []

    // Ensure part directory exists
    await this.ensureDirectoryExists(partDir)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const description = descriptions[i] || `Part image ${i + 1}`
      
      try {
        const storedImage = await this.storeSingleImage(
          file,
          partDir,
          'part',
          partId,
          description
        )
        storedImages.push(storedImage)
      } catch (error) {
        console.error(`Error storing part image ${i + 1}:`, error)
        // Continue with other files
      }
    }

    return storedImages
  }

  /**
   * Store a single image with full processing
   */
  private async storeSingleImage(
    file: File,
    outputDir: string,
    type: 'vehicle' | 'part',
    entityId: string,
    description: string
  ): Promise<StoredImage> {
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const baseFilename = `${timestamp}_${entityId}`
    const originalFilename = `${baseFilename}.${extension}`

    // Create temporary file path
    const tempPath = join(outputDir, `temp_${originalFilename}`)
    
    // Write file to temporary location
    const bytes = await file.arrayBuffer()
    await writeFile(tempPath, Buffer.from(bytes))

    // Validate image
    const validation = await imageProcessor.validateImage(tempPath)
    if (!validation.valid) {
      await unlink(tempPath)
      throw new Error(validation.error)
    }

    // Get original metadata
    const originalMetadata = await imageProcessor.getImageMetadata(tempPath)
    if (!originalMetadata) {
      await unlink(tempPath)
      throw new Error('Could not read image metadata')
    }

    // Process image into multiple sizes
    const processedImages = await imageProcessor.processImage(
      tempPath,
      outputDir,
      originalFilename,
      {
        quality: type === 'vehicle' ? 90 : 85,
        format: 'jpeg',
        progressive: true
      }
    )

    // Generate WebP versions if enabled
    let webpPaths: string[] = []
    if (this.config.enableWebP) {
      const webpImages = await imageProcessor.generateWebPVersions(
        tempPath,
        outputDir,
        originalFilename
      )
      webpPaths = webpImages.map(img => img.processedPath)
    }

    // Clean up temporary file
    await unlink(tempPath)

    // Find processed image paths
    const originalPath = processedImages.find(img => img.processedPath.includes('_original'))?.processedPath || tempPath
    const thumbnailPath = processedImages.find(img => img.processedPath.includes('_thumbnail'))?.processedPath || ''
    const mediumPath = processedImages.find(img => img.processedPath.includes('_medium'))?.processedPath || ''
    const ebayPath = processedImages.find(img => img.processedPath.includes('_ebay'))?.processedPath || ''

    // Generate CDN URLs
    const cdnUrls = this.generateCDNUrls(
      originalPath,
      thumbnailPath,
      mediumPath,
      ebayPath,
      webpPaths
    )

    return {
      id: `${entityId}_${timestamp}`,
      originalPath,
      thumbnailPath,
      mediumPath,
      ebayPath,
      webpPaths,
      cdnUrls,
      metadata: {
        width: originalMetadata.width || 0,
        height: originalMetadata.height || 0,
        size: originalMetadata.size || 0,
        format: originalMetadata.format || 'unknown'
      }
    }
  }

  /**
   * Generate CDN URLs for all image sizes
   */
  private generateCDNUrls(
    originalPath: string,
    thumbnailPath: string,
    mediumPath: string,
    ebayPath: string,
    webpPaths: string[]
  ) {
    const baseUrl = this.config.useCDN && this.config.cdnDomain 
      ? `https://${this.config.cdnDomain}`
      : ''

    const getRelativePath = (fullPath: string) => {
      return fullPath.replace(join(process.cwd(), 'public'), '')
    }

    return {
      original: `${baseUrl}${getRelativePath(originalPath)}`,
      thumbnail: `${baseUrl}${getRelativePath(thumbnailPath)}`,
      medium: `${baseUrl}${getRelativePath(mediumPath)}`,
      ebay: `${baseUrl}${getRelativePath(ebayPath)}`,
      webp: webpPaths.map(path => `${baseUrl}${getRelativePath(path)}`)
    }
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true })
    }
  }

  /**
   * Delete image and all its variants
   */
  async deleteImage(imagePaths: string[]): Promise<void> {
    for (const path of imagePaths) {
      try {
        if (existsSync(path)) {
          await unlink(path)
        }
      } catch (error) {
        console.error(`Error deleting image ${path}:`, error)
      }
    }
  }

  /**
   * Get image statistics
   */
  async getImageStats(entityId: string, type: 'vehicle' | 'part'): Promise<{
    totalImages: number
    totalSize: number
    averageSize: number
    formats: Record<string, number>
  }> {
    const entityDir = join(this.config.baseDir, type === 'vehicle' ? 'vehicles' : 'parts', entityId)
    
    if (!existsSync(entityDir)) {
      return {
        totalImages: 0,
        totalSize: 0,
        averageSize: 0,
        formats: {}
      }
    }

    // This would need to be implemented with proper file system scanning
    // For now, return placeholder data
    return {
      totalImages: 0,
      totalSize: 0,
      averageSize: 0,
      formats: {}
    }
  }

  /**
   * Clean up unused images
   */
  async cleanupUnusedImages(): Promise<{
    deletedFiles: number
    freedSpace: number
  }> {
    // Implementation would scan for orphaned image files
    // and remove them to free up space
    return {
      deletedFiles: 0,
      freedSpace: 0
    }
  }

  /**
   * Optimize all images in a directory
   */
  async optimizeDirectory(dirPath: string): Promise<{
    optimizedFiles: number
    spaceSaved: number
  }> {
    // Implementation would re-process all images with better compression
    return {
      optimizedFiles: 0,
      spaceSaved: 0
    }
  }
}

// Export singleton instance
export const imageStorage = ImageStorageManager.getInstance()
