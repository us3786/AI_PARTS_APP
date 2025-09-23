# 🚗 AI Parts Application

[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16.2-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.x-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

A modern, professional-grade automotive parts management and eBay listing system built with Next.js, TypeScript, and Prisma. Transform your automotive parts business with AI-powered suggestions, multi-source price research, and automated eBay listing capabilities.

## 🚀 Features

- **VIN Decoding**: NHTSA API integration for vehicle identification
- **Parts Population**: Auto-generates 290+ automotive parts per vehicle
- **Price Research**: Multi-source pricing (eBay, AutoZone, RockAuto, LKQ)
- **Image Hunting**: AI-powered image collection and ranking
- **eBay Integration**: OAuth 2.0 authentication and bulk listing
- **Analytics Dashboard**: Performance tracking and metrics
- **Export Functions**: CSV, PDF, and JSON export capabilities

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **UI**: Tailwind CSS + Radix UI components
- **State**: Zustand + TanStack Query
- **APIs**: eBay API, NHTSA API

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ai-parts-app.git
cd ai-parts-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Initialize database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-parts-app.git
   cd ai-parts-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Initialize database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Required Environment Variables

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_NHTSA_API_BASE_URL="https://vpic.nhtsa.dot.gov/api/vehicles/"
NEXT_PUBLIC_APP_BASE_URL="http://localhost:3000"
EBAY_CLIENT_ID="your_ebay_client_id"
EBAY_CLIENT_SECRET="your_ebay_client_secret"
EBAY_REDIRECT_URI="your_ngrok_url/api/ebay/callback"
EBAY_SCOPES="https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.fulfillment https://api.ebay.com/oauth/api_scope/sell.marketing"
```

### eBay API Setup

1. **Create eBay Developer Account**
   - Go to [eBay Developers](https://developer.ebay.com/)
   - Create a new application
   - Note your Client ID and Client Secret

2. **Set up ngrok for OAuth**
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Start tunnel
   ngrok http 3000
   
   # Copy the HTTPS URL and update EBAY_REDIRECT_URI
   ```

## 🗂️ Project Structure

For detailed project structure and architecture, see:
- **[PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)** - Comprehensive architecture documentation
- **[SYSTEM_LOGIC_FLOW.md](./SYSTEM_LOGIC_FLOW.md)** - Complete system logic flow

### Quick Overview
```
ai-parts-app-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (20+ endpoints)
│   │   └── page.tsx           # Main dashboard
│   ├── components/            # React components
│   │   ├── dashboard/         # 5 dashboard components
│   │   ├── forms/             # 4 form components
│   │   └── ui/                # 8 reusable UI components
│   ├── lib/                   # Utilities & API functions
│   └── types/                 # TypeScript definitions
├── prisma/
│   ├── schema.prisma          # Database schema (9 models)
│   ├── seed.ts               # Database seeding
│   └── complete-parts-master-data.ts  # 290+ parts catalog
├── public/                    # Static assets
├── scripts/                   # Build scripts
├── PROJECT_ARCHITECTURE.md    # Detailed architecture docs
├── SYSTEM_LOGIC_FLOW.md       # System logic documentation
└── requirements.txt           # Project requirements
```

## 🚀 Usage

### 1. VIN Decoding
- Enter a VIN number in the input field
- System automatically decodes vehicle information
- Populates 290+ relevant automotive parts

### 2. Parts Management
- View all generated parts in organized categories
- Filter by category, condition, status, or price
- Edit part details and pricing
- Bulk operations for multiple parts

### 3. Price Research
- Research market prices from multiple sources
- Compare competitor pricing
- Update part values based on market data

### 4. eBay Listing
- Connect to eBay via OAuth
- Create individual or bulk listings
- Professional templates with optimized titles
- Multiple image upload and management

### 5. Analytics
- Track listing performance
- Monitor sales metrics
- Export data for analysis

## 📊 Database Schema

- **Vehicle**: Vehicle information from VIN decoding
- **PartsMaster**: Master catalog of 290+ automotive parts
- **PartsInventory**: Actual parts from specific vehicles
- **PriceResearch**: Market pricing data
- **EbayListing**: eBay listing management
- **BulkOperation**: Bulk listing operations

## 🔄 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema changes to database
npm run db:seed      # Seed database with parts data
npm run db:reset     # Reset and reseed database
```

## 🚨 Troubleshooting

### eBay OAuth Issues
- Ensure ngrok tunnel is active
- Verify redirect URI matches ngrok URL
- Check eBay Developer Console settings

### Database Issues
- Run `npm run db:push` to sync schema
- Run `npm run db:seed` to populate data
- Check `.env` file for correct DATABASE_URL

### API Issues
- Verify environment variables are set
- Check API rate limits
- Ensure proper authentication tokens

## 📝 License

This project is for educational and commercial use. Please ensure compliance with eBay API terms of service.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📚 Documentation

### Comprehensive Documentation
- **[PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)** - Complete system architecture, database schema, API endpoints, and component structure
- **[SYSTEM_LOGIC_FLOW.md](./SYSTEM_LOGIC_FLOW.md)** - Detailed logic flows, business rules, and data processing workflows
- **[ISSUES_AND_ACTION_PLAN.md](./ISSUES_AND_ACTION_PLAN.md)** - Current issues, testing checklist, and action plan for completion
- **[NGROK_SETUP_INSTRUCTIONS.md](./NGROK_SETUP_INSTRUCTIONS.md)** - Step-by-step eBay OAuth setup with ngrok
- **[requirements.txt](./requirements.txt)** - Project requirements and setup guide

### Key Features Documentation
- **VIN Decoding**: NHTSA API integration with automatic vehicle data extraction
- **Parts Population**: AI-powered generation of 290+ automotive parts per vehicle
- **Price Research**: Multi-source market analysis (eBay, AutoZone, RockAuto, LKQ)
- **eBay Integration**: OAuth 2.0 authentication and bulk listing management
- **Analytics**: Performance tracking and business metrics

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the comprehensive documentation files
- Check eBay Developer Console status
- Verify ngrok tunnel is active for OAuth