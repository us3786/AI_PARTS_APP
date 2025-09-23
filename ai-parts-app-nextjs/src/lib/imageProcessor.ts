import sharp from 'sharp'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export interface ImageProcessingOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  progressive?: boolean
  optimize?: boolean
}

export interface ProcessedImage {
  originalPath: string
  processedPath: string
  width: number
  height: number
  size: number
  format: string
}

export class ImageProcessor {
  private static instance: ImageProcessor
  private processingQueue: Map<string, Promise<ProcessedImage[]>> = new Map()

  static getInstance(): ImageProcessor {
    if (!ImageProcessor.instance) {
      ImageProcessor.instance = new ImageProcessor()
    }
    return ImageProcessor.instance
  }

  /**
   * Process a single image into multiple sizes
   */
  async processImage(
    inputPath: string,
    outputDir: string,
    filename: string,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage[]> {
    const cacheKey = `${inputPath}-${JSON.stringify(options)}`
    
    if (this.processingQueue.has(cacheKey)) {
      return this.processingQueue.get(cacheKey)!
    }

    const processingPromise = this._processImage(inputPath, outputDir, filename, options)
    this.processingQueue.set(cacheKey, processingPromise)
    
    try {
      const result = await processingPromise
      this.processingQueue.delete(cacheKey)
      return result
    } catch (error) {
      this.processingQueue.delete(cacheKey)
      throw error
    }
  }

  private async _processImage(
    inputPath: string,
    outputDir: string,
    filename: string,
    options: ImageProcessingOptions
  ): Promise<ProcessedImage[]> {
    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true })
    }

    const baseFilename = filename.replace(/\.[^/.]+$/, '')
    const results: ProcessedImage[] = []

    // Get original image metadata
    const metadata = await sharp(inputPath).metadata()
    const originalWidth = metadata.width || 0
    const originalHeight = metadata.height || 0

    // Define processing configurations
    const configs = [
      {
        name: 'original',
        width: originalWidth,
        height: originalHeight,
        quality: 95,
        format: 'jpeg' as const,
        progressive: true
      },
      {
        name: 'ebay',
        width: 1600,
        height: 1600,
        quality: 90,
        format: 'jpeg' as const,
        progressive: true
      },
      {
        name: 'medium',
        width: 800,
        height: 800,
        quality: 85,
        format: 'jpeg' as const,
        progressive: true
      },
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        quality: 80,
        format: 'jpeg' as const,
        progressive: false
      }
    ]

    // Process each configuration
    for (const config of configs) {
      const outputPath = join(outputDir, `${baseFilename}_${config.name}.jpg`)
      
      try {
        let processor = sharp(inputPath)
          .resize(config.width, config.height, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({
            quality: config.quality,
            progressive: config.progressive,
            mozjpeg: true
          })

        await processor.toFile(outputPath)

        // Get processed image info
        const processedMetadata = await sharp(outputPath).metadata()
        const stats = await import('fs').then(fs => fs.promises.stat(outputPath))

        results.push({
          originalPath: inputPath,
          processedPath: outputPath,
          width: processedMetadata.width || 0,
          height: processedMetadata.height || 0,
          size: stats.size,
          format: 'jpeg'
        })

      } catch (error) {
        console.error(`Error processing ${config.name} size:`, error)
        // Continue with other sizes even if one fails
      }
    }

    return results
  }

  /**
   * Process vehicle photos with specific configurations
   */
  async processVehiclePhotos(
    inputPath: string,
    vehicleId: string,
    filename: string
  ): Promise<ProcessedImage[]> {
    const outputDir = join(process.cwd(), 'public', 'uploads', 'vehicles', vehicleId)
    return this.processImage(inputPath, outputDir, filename, {
      quality: 90,
      format: 'jpeg',
      progressive: true
    })
  }

  /**
   * Process part images with specific configurations
   */
  async processPartImages(
    inputPath: string,
    partId: string,
    filename: string
  ): Promise<ProcessedImage[]> {
    const outputDir = join(process.cwd(), 'public', 'uploads', 'parts', partId)
    return this.processImage(inputPath, outputDir, filename, {
      quality: 85,
      format: 'jpeg',
      progressive: true
    })
  }

  /**
   * Generate WebP versions for better compression
   */
  async generateWebPVersions(
    inputPath: string,
    outputDir: string,
    filename: string
  ): Promise<ProcessedImage[]> {
    const baseFilename = filename.replace(/\.[^/.]+$/, '')
    const results: ProcessedImage[] = []

    const configs = [
      { name: 'medium', width: 800, height: 800 },
      { name: 'thumbnail', width: 300, height: 300 }
    ]

    for (const config of configs) {
      const outputPath = join(outputDir, `${baseFilename}_${config.name}.webp`)
      
      try {
        await sharp(inputPath)
          .resize(config.width, config.height, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 80 })
          .toFile(outputPath)

        const metadata = await sharp(outputPath).metadata()
        const stats = await import('fs').then(fs => fs.promises.stat(outputPath))

        results.push({
          originalPath: inputPath,
          processedPath: outputPath,
          width: metadata.width || 0,
          height: metadata.height || 0,
          size: stats.size,
          format: 'webp'
        })

      } catch (error) {
        console.error(`Error generating WebP ${config.name}:`, error)
      }
    }

    return results
  }

  /**
   * Optimize image for eBay listing
   */
  async optimizeForEbay(inputPath: string): Promise<Buffer> {
    return sharp(inputPath)
      .resize(1600, 1600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 90,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer()
  }

  /**
   * Add watermark to image
   */
  async addWatermark(
    inputPath: string,
    watermarkPath: string,
    outputPath: string,
    opacity: number = 0.3
  ): Promise<void> {
    await sharp(inputPath)
      .composite([
        {
          input: watermarkPath,
          blend: 'over',
          opacity: opacity
        }
      ])
      .jpeg({ quality: 90 })
      .toFile(outputPath)
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        if (existsSync(filePath)) {
          await unlink(filePath)
        }
      } catch (error) {
        console.error(`Error cleaning up ${filePath}:`, error)
      }
    }
  }

  /**
   * Get image metadata without processing
   */
  async getImageMetadata(filePath: string) {
    try {
      const metadata = await sharp(filePath).metadata()
      const stats = await import('fs').then(fs => fs.promises.stat(filePath))
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: stats.size,
        hasAlpha: metadata.hasAlpha,
        density: metadata.density,
        space: metadata.space
      }
    } catch (error) {
      console.error('Error getting image metadata:', error)
      return null
    }
  }

  /**
   * Validate image file
   */
  async validateImage(filePath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const metadata = await sharp(filePath).metadata()
      
      if (!metadata.width || !metadata.height) {
        return { valid: false, error: 'Invalid image dimensions' }
      }
      
      if (metadata.width < 100 || metadata.height < 100) {
        return { valid: false, error: 'Image too small (minimum 100x100)' }
      }
      
      if (metadata.width > 8000 || metadata.height > 8000) {
        return { valid: false, error: 'Image too large (maximum 8000x8000)' }
      }
      
      const supportedFormats = ['jpeg', 'png', 'webp', 'gif', 'bmp']
      if (!metadata.format || !supportedFormats.includes(metadata.format)) {
        return { valid: false, error: 'Unsupported image format' }
      }
      
      return { valid: true }
    } catch (error) {
      return { valid: false, error: 'Invalid image file' }
    }
  }
}

// Export singleton instance
export const imageProcessor = ImageProcessor.getInstance()
