# 🏗️ AI Parts App - Next.js Project Structure

## 📁 **Complete Directory Structure**

```
ai-parts-app-nextjs/
├── 📁 prisma/                          # Database schema and migrations
├── 📁 public/                          # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── 📁 src/                            # Source code
│   ├── 📁 app/                        # Next.js App Router
│   │   ├── 📁 api/                    # API Routes (Backend)
│   │   │   ├── 📁 decode-vin/         # VIN decoding endpoint
│   │   │   ├── 📁 ebay/               # eBay integration endpoints
│   │   │   ├── 📁 fetch-parts/        # Parts fetching endpoints
│   │   │   └── 📁 settings/           # Settings management
│   │   ├── favicon.ico
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home page
│   ├── 📁 components/                 # React Components
│   │   ├── 📁 dashboard/              # Dashboard components
│   │   ├── 📁 forms/                  # Form components
│   │   └── 📁 ui/                     # UI component library
│   ├── 📁 hooks/                      # Custom React hooks
│   ├── 📁 lib/                        # Utility functions
│   └── 📁 types/                      # TypeScript type definitions
├── eslint.config.mjs                  # ESLint configuration
├── next.config.ts                     # Next.js configuration
├── next-env.d.ts                      # Next.js TypeScript definitions
├── package.json                       # Dependencies and scripts
├── package-lock.json                  # Lock file
├── postcss.config.mjs                 # PostCSS configuration
├── README.md                          # Project documentation
└── tsconfig.json                      # TypeScript configuration
```

## 🎯 **Directory Purposes**

### **📁 prisma/**
- Database schema definitions
- Migration files
- Seed data
- Prisma client configuration

### **📁 src/app/api/**
- **decode-vin/**: VIN decoding API endpoints
- **ebay/**: eBay OAuth and data fetching APIs
- **fetch-parts/**: AI-powered parts suggestion APIs
- **settings/**: Application settings management APIs

### **📁 src/components/**
- **ui/**: Reusable UI components (buttons, inputs, cards)
- **forms/**: Form-specific components (VIN decoder, settings)
- **dashboard/**: Dashboard and data visualization components

### **📁 src/lib/**
- Database connection utilities
- API client functions
- Helper functions and utilities
- Configuration management

### **📁 src/types/**
- TypeScript interfaces and types
- API response types
- Database model types
- Component prop types

### **📁 src/hooks/**
- Custom React hooks
- State management hooks
- API integration hooks

## ✅ **Structure Status**
- ✅ All directories created
- ✅ Next.js 14 project initialized
- ✅ TypeScript configured
- ✅ Tailwind CSS configured
- ✅ ESLint configured
- ⏳ Dependencies installation (next)
- ⏳ Prisma setup (next)
- ⏳ Environment configuration (next)

## 🚀 **Next Steps**
1. Install all required dependencies
2. Initialize Prisma ORM
3. Create database schema
4. Set up environment variables
5. Create basic components
6. Implement API routes
