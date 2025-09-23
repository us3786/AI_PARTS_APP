# Professional Image Architecture for Auto Parts Platform

## Overview
This document outlines the image management system for handling thousands of vehicle photos and part images across multiple cars and hundreds of parts per vehicle.

## Directory Structure

```
ai-parts-app-nextjs/
├── public/
│   └── uploads/
│       ├── vehicles/
│       │   ├── {vehicleId}/
│       │   │   ├── original/          # Full resolution photos
│       │   │   │   ├── {timestamp}_{index}.jpg
│       │   │   │   └── ...
│       │   │   ├── thumbnails/        # 300x300 thumbnails
│       │   │   │   ├── {timestamp}_{index}_thumb.jpg
│       │   │   │   └── ...
│       │   │   ├── medium/            # 800x800 medium size
│       │   │   │   ├── {timestamp}_{index}_med.jpg
│       │   │   │   └── ...
│       │   │   └── ebay/              # eBay optimized (1600x1600)
│       │   │       ├── {timestamp}_{index}_ebay.jpg
│       │   │       └── ...
│       │   └── ...
│       └── parts/
│           ├── {partId}/
│           │   ├── original/          # Full resolution part images
│           │   ├── thumbnails/        # 150x150 thumbnails
│           │   ├── medium/             # 600x600 medium size
│           │   └── ebay/              # eBay optimized
│           └── ...
├── src/
│   ├── lib/
│   │   ├── imageProcessor.ts          # Image processing utilities
│   │   ├── imageStorage.ts            # Storage management
│   │   └── cdn.ts                     # CDN integration
│   ├── app/
│   │   └── api/
│   │       ├── images/
│   │       │   ├── upload/            # Image upload endpoint
│   │       │   ├── process/           # Image processing endpoint
│   │       │   └── serve/             # Image serving endpoint
│   │       └── vehicle-photos/
│   └── components/
│       └── dashboard/
│           ├── ImageManager.tsx       # Advanced image management
│           └── BulkImageUpload.tsx   # Bulk upload component
└── scripts/
    ├── imageOptimization.js          # Batch image optimization
    ├── cleanupImages.js              # Cleanup unused images
    └── migrateToCDN.js               # CDN migration script
```

## Image Processing Pipeline

### 1. Upload Process
```
User Upload → Validation → Temporary Storage → Processing → Multiple Sizes → Database → CDN
```

### 2. Image Sizes Generated
- **Original**: Full resolution (up to 4K)
- **Thumbnail**: 300x300px (vehicle), 150x150px (parts)
- **Medium**: 800x800px (vehicle), 600x600px (parts)
- **eBay Optimized**: 1600x1600px (both)

### 3. Storage Strategy
- **Local Development**: File system storage
- **Production**: AWS S3 + CloudFront CDN
- **Backup**: Multiple regions for redundancy

## Database Schema

```sql
-- Vehicle Photos Table
CREATE TABLE VehiclePhoto (
  id VARCHAR(36) PRIMARY KEY,
  vehicleId VARCHAR(36) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  originalName VARCHAR(255) NOT NULL,
  fileSize INTEGER NOT NULL,
  mimeType VARCHAR(100) NOT NULL,
  width INTEGER,
  height INTEGER,
  isPrimary BOOLEAN DEFAULT FALSE,
  tags JSON,
  description TEXT,
  uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processedAt TIMESTAMP,
  cdnUrl VARCHAR(500),
  localPath VARCHAR(500),
  FOREIGN KEY (vehicleId) REFERENCES Vehicle(id)
);

-- Part Images Table
CREATE TABLE PartImage (
  id VARCHAR(36) PRIMARY KEY,
  partId VARCHAR(36) NOT NULL,
  source VARCHAR(100) NOT NULL, -- 'hunted', 'uploaded', 'vehicle'
  filename VARCHAR(255) NOT NULL,
  originalName VARCHAR(255) NOT NULL,
  fileSize INTEGER NOT NULL,
  mimeType VARCHAR(100) NOT NULL,
  width INTEGER,
  height INTEGER,
  quality INTEGER, -- AI quality score
  relevance INTEGER, -- AI relevance score
  isPrimary BOOLEAN DEFAULT FALSE,
  tags JSON,
  description TEXT,
  uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processedAt TIMESTAMP,
  cdnUrl VARCHAR(500),
  localPath VARCHAR(500),
  FOREIGN KEY (partId) REFERENCES PartsMaster(id)
);

-- Image Processing Queue
CREATE TABLE ImageProcessingQueue (
  id VARCHAR(36) PRIMARY KEY,
  imageId VARCHAR(36) NOT NULL,
  imageType ENUM('vehicle', 'part') NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  retryCount INTEGER DEFAULT 0,
  errorMessage TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processedAt TIMESTAMP
);
```

## Performance Considerations

### 1. Image Optimization
- **WebP Format**: 30% smaller than JPEG
- **Progressive JPEG**: Better loading experience
- **Compression**: 85% quality for web, 95% for eBay
- **Lazy Loading**: Load images as needed

### 2. Caching Strategy
- **Browser Cache**: 1 year for static images
- **CDN Cache**: 30 days for processed images
- **Database Cache**: Frequently accessed images
- **Redis Cache**: Image metadata and URLs

### 3. Scalability
- **Horizontal Scaling**: Multiple image processing workers
- **Queue System**: Redis/RabbitMQ for processing queue
- **Load Balancing**: Distribute processing across servers
- **Auto-scaling**: Scale workers based on queue size

## Security & Access Control

### 1. Upload Security
- **File Type Validation**: Only image files allowed
- **Size Limits**: Max 10MB per image
- **Virus Scanning**: Scan uploaded files
- **Rate Limiting**: Prevent abuse

### 2. Access Control
- **Authentication**: User must be logged in
- **Authorization**: Can only upload to own vehicles
- **Watermarking**: Add invisible watermarks
- **Hotlink Protection**: Prevent unauthorized use

## CDN Integration

### 1. AWS S3 + CloudFront
```javascript
// Example CDN configuration
const cdnConfig = {
  bucket: 'auto-parts-images',
  region: 'us-east-1',
  cloudFrontDomain: 'd1234567890.cloudfront.net',
  cachePolicy: 'images-cache-policy',
  originPolicy: 'images-origin-policy'
}
```

### 2. Image URLs
- **Development**: `http://localhost:3000/uploads/vehicles/{id}/medium/{filename}`
- **Production**: `https://d1234567890.cloudfront.net/vehicles/{id}/medium/{filename}`

## Monitoring & Analytics

### 1. Performance Metrics
- **Upload Success Rate**: Track failed uploads
- **Processing Time**: Monitor image processing speed
- **Storage Usage**: Track disk space usage
- **CDN Performance**: Monitor cache hit rates

### 2. Error Handling
- **Retry Logic**: Automatic retry for failed uploads
- **Fallback Images**: Default images for missing files
- **Error Logging**: Comprehensive error tracking
- **Alert System**: Notify on critical failures

## Cost Optimization

### 1. Storage Costs
- **Lifecycle Policies**: Move old images to cheaper storage
- **Compression**: Reduce file sizes
- **Cleanup**: Remove unused images
- **Tiered Storage**: Hot, warm, cold storage tiers

### 2. CDN Costs
- **Cache Optimization**: Maximize cache hit rates
- **Geographic Distribution**: Serve from nearest location
- **Compression**: Reduce bandwidth usage
- **Monitoring**: Track usage and costs

## Implementation Priority

### Phase 1: Basic Implementation
1. ✅ File system storage
2. ✅ Basic image processing
3. ✅ Database schema
4. ✅ Upload functionality

### Phase 2: Optimization
1. 🔄 CDN integration
2. 🔄 Advanced processing
3. 🔄 Queue system
4. 🔄 Monitoring

### Phase 3: Scale
1. ⏳ Auto-scaling
2. ⏳ Advanced analytics
3. ⏳ AI-powered optimization
4. ⏳ Multi-region deployment
