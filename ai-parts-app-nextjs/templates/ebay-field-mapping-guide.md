# eBay Bulk Upload Field Mapping Guide

## Overview
This guide maps your parts inventory data to eBay's required fields for bulk upload.

## Required Fields Mapping

### Basic Listing Information
| eBay Field | Your Data Source | Example | Notes |
|------------|------------------|---------|-------|
| **Action** | Static | "Add" | Always "Add" for new listings |
| **Title** | `partName` + `make` + `model` + `year` | "2005 Honda Civic EX Engine Oil Filter Used" | Max 80 characters |
| **Description** | `partName` + `category` + condition details | "Used OEM engine oil filter..." | Detailed description |
| **Condition ID** | Static | "3000" | 3000 = Used, 1000 = New |
| **Start Price** | `marketAnalysis.averagePrice` | "15.99" | Minimum bid price |
| **Buy It Now Price** | `marketAnalysis.recommendedPrice` | "19.99" | Fixed price option |
| **Quantity** | Static | "1" | Usually 1 for used parts |
| **Category ID** | Static | "6030" | Parts & Accessories > Cars & Trucks |

### Product Identifiers
| eBay Field | Your Data Source | Example | Notes |
|------------|------------------|---------|-------|
| **MPN** | `partsMaster.partNumber` | "15400-PLC-004" | Manufacturer Part Number |
| **Brand** | `make` or `partsMaster.brand` | "Honda" | Manufacturer brand |

### Vehicle Compatibility
| eBay Field | Your Data Source | Example | Notes |
|------------|------------------|---------|-------|
| **Compatibility Year** | `vehicle.year` | "2005" | Vehicle year |
| **Compatibility Make** | `vehicle.make` | "Honda" | Vehicle make |
| **Compatibility Model** | `vehicle.model` | "Civic" | Vehicle model |
| **Compatibility Trim** | `vehicle.trimLevel` | "EX" | Trim level |
| **Compatibility Engine** | `vehicle.engineSize` | "1.7L 4-Cylinder" | Engine specification |
| **Drive Type** | `vehicle.driveType` | "FWD", "RWD", "AWD" | Drive configuration |

### Item Specifics
| eBay Field | Your Data Source | Example | Notes |
|------------|------------------|---------|-------|
| **Item Specifics** | `category` + `subCategory` + condition | "Part Type: Oil Filter\|Condition: Used\|Compatibility: Honda Civic 2005" | Pipe-separated values |

### Shipping & Returns
| eBay Field | Your Data Source | Example | Notes |
|------------|------------------|---------|-------|
| **Shipping Service** | Static | "USPS Priority Mail" | Shipping method |
| **Shipping Cost** | Calculated | "8.99" | Based on weight/size |
| **Handling Time** | Static | "1" | Days to ship |
| **Return Policy** | Static | "30 Day Returns" | Return policy |

### Images
| eBay Field | Your Data Source | Example | Notes |
|------------|------------------|---------|-------|
| **Image URL 1-12** | `partImages[].url` | "https://example.com/image1.jpg" | Up to 12 images |

## Data Transformation Rules

### Title Generation
```
Title = "{year} {make} {model} {trimLevel} {engineSize} {driveType} {partName} Used {brand}"
- Only add engineSize for engine-related parts
- Only add driveType for drive-related parts (transmission, differential, etc.)
- Only add brand if different from make
- Trim level only if different from model
Examples: 
- "2005 Honda Civic EX 1.7L Engine Oil Filter Used"
- "2005 Honda Civic EX FWD Automatic Transmission Used"
- "2005 Ford Mustang GT RWD Rear Differential Used"
```

### Description Template
```
Description = "Used {brand} {partName} removed from {year} {make} {model} {trimLevel}. 
Part shows normal wear from use but functions properly. 
Cleaned and inspected. Fits {year} {make} {model} {trimLevel} models with {engineSize} engine. 
{additionalDetails}. Ready to install."
```

### Item Specifics Format
```
Item Specifics = "Part Type: {category}|Condition: Used|Compatibility: {make} {model} {year}|Engine Size: {engineSize}|Drive Type: {driveType}|Position: {subCategory}"
```

### Price Calculation
```
Start Price = marketAnalysis.averagePrice * 0.8  // 20% below average
Buy It Now Price = marketAnalysis.recommendedPrice * 1.1  // 10% above recommended
```

## Category Mapping
| Your Category | eBay Category ID | eBay Category Name |
|--------------|------------------|-------------------|
| Engine | 6030 | Parts & Accessories > Cars & Trucks > Engine |
| Transmission | 6030 | Parts & Accessories > Cars & Trucks > Transmission |
| Brakes | 6030 | Parts & Accessories > Cars & Trucks > Brakes |
| Suspension | 6030 | Parts & Accessories > Cars & Trucks > Suspension |
| Electrical | 6030 | Parts & Accessories > Cars & Trucks > Electrical |
| Body | 6030 | Parts & Accessories > Cars & Trucks > Body |

## Condition Codes
| Condition | Code | Description |
|-----------|------|-------------|
| New | 1000 | Brand new, unused |
| Used | 3000 | Previously used, good condition |
| Refurbished | 2000 | Restored to working condition |

## Shipping Cost Matrix
| Part Weight | Shipping Method | Cost |
|-------------|------------------|------|
| < 1 lb | USPS First Class | $4.99 |
| 1-5 lbs | USPS Priority Mail | $8.99 |
| 5-15 lbs | USPS Priority Mail | $12.99 |
| 15+ lbs | FedEx Ground | $15.99 |

## Validation Rules
1. **Title**: Max 80 characters, include year, make, model, part name
2. **Description**: Min 50 characters, include condition details
3. **Price**: Start price < Buy It Now price
4. **Images**: At least 1 image required, max 12 images
5. **Compatibility**: Must include year, make, model
6. **MPN**: Required for most parts
7. **Condition**: Must be "Used" for used parts
