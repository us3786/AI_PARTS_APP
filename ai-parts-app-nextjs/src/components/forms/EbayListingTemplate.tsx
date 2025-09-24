'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Loader2, 
  Bot, 
  Edit, 
  Save, 
  X, 
  Copy,
  DollarSign,
  FileText,
  ImageIcon,
  Car,
  Wrench,
  Settings,
  Eye
} from 'lucide-react'

interface EbayListingTemplateProps {
  partId: string
  partName: string
  category: string
  condition: string
  vehicleInfo: {
    year: number
    make: string
    model: string
    engine?: string
    drivetrain?: string
    transmission?: string
  }
  currentPrice?: number
  onSave: (template: ListingTemplate) => void
  onPreview: (template: ListingTemplate) => void
  trigger?: React.ReactNode
  className?: string
}

interface ListingTemplate {
  title: string
  description: string
  price: number
  condition: string
  category: string
  keywords: string[]
  images: string[]
  vehicleInfo: {
    year: number
    make: string
    model: string
    engine?: string
    drivetrain?: string
    transmission?: string
  }
  aiGenerated: boolean
  customizations: {
    titleOverride?: string
    descriptionOverride?: string
    priceOverride?: number
  }
}

export function EbayListingTemplate({
  partId,
  partName,
  category,
  condition,
  vehicleInfo,
  currentPrice = 0,
  onSave,
  onPreview,
  trigger,
  className
}: EbayListingTemplateProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [template, setTemplate] = useState<ListingTemplate>({
    title: '',
    description: '',
    price: currentPrice,
    condition,
    category,
    keywords: [],
    images: [],
    vehicleInfo,
    aiGenerated: false,
    customizations: {}
  })

  const [editing, setEditing] = useState({
    title: false,
    description: false,
    price: false
  })

  // Generate AI template when dialog opens
  useEffect(() => {
    if (isOpen && !template.aiGenerated) {
      generateAITemplate()
    }
  }, [isOpen])

  const generateAITemplate = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/ai/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partName,
          category,
          condition,
          vehicleInfo,
          currentPrice,
          templateType: 'ebay_listing'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const generatedTemplate: ListingTemplate = {
          title: data.title || generateDefaultTitle(),
          description: data.description || generateDefaultDescription(),
          price: data.suggestedPrice || currentPrice || generateEstimatedPrice(),
          condition,
          category,
          keywords: data.keywords || generateDefaultKeywords(),
          images: [],
          vehicleInfo,
          aiGenerated: true,
          customizations: {}
        }
        
        setTemplate(generatedTemplate)
      } else {
        // Fallback to default template
        setTemplate({
          title: generateDefaultTitle(),
          description: generateDefaultDescription(),
          price: currentPrice || generateEstimatedPrice(),
          condition,
          category,
          keywords: generateDefaultKeywords(),
          images: [],
          vehicleInfo,
          aiGenerated: false,
          customizations: {}
        })
      }
    } catch (error) {
      console.error('Error generating AI template:', error)
      // Fallback to default template
      setTemplate({
        title: generateDefaultTitle(),
        description: generateDefaultDescription(),
        price: currentPrice || generateEstimatedPrice(),
        condition,
        category,
        keywords: generateDefaultKeywords(),
        images: [],
        vehicleInfo,
        aiGenerated: false,
        customizations: {}
      })
    } finally {
      setGenerating(false)
    }
  }

  const generateDefaultTitle = () => {
    const { year, make, model, engine, drivetrain } = vehicleInfo
    let title = `${year} ${make} ${model} ${partName}`
    
    if (engine) title += ` ${engine}`
    if (drivetrain) title += ` ${drivetrain}`
    title += ` - ${condition} Condition`
    
    return title
  }

  const generateDefaultDescription = () => {
    const { year, make, model, engine, transmission, drivetrain } = vehicleInfo
    
    return `🚗 **${year} ${make} ${model} ${partName}** - ${condition.toUpperCase()} CONDITION

✅ **Vehicle Compatibility:**
• Year: ${year}
• Make: ${make}
• Model: ${model}
${engine ? `• Engine: ${engine}` : ''}
${transmission ? `• Transmission: ${transmission}` : ''}
${drivetrain ? `• Drivetrain: ${drivetrain}` : ''}

🔧 **Part Details:**
• Part Name: ${partName}
• Category: ${category}
• Condition: ${condition}
• OEM/Aftermarket: Please verify compatibility

📋 **Listing Information:**
• Item is sold as-is
• Please verify fitment before purchase
• Contact seller with any questions
• Fast shipping available

💡 **Why Choose Us:**
• Quality used auto parts
• Competitive pricing
• Fast shipping
• Excellent customer service

⚠️ **Important:** Please verify this part fits your specific vehicle before purchasing. Compatibility information is provided as a guide only.`
  }

  const generateEstimatedPrice = () => {
    // Simple price estimation based on category and condition
    const basePrice = currentPrice || 50
    const conditionMultiplier = {
      'excellent': 1.2,
      'good': 1.0,
      'fair': 0.8,
      'poor': 0.6
    }
    
    return Math.round(basePrice * (conditionMultiplier[condition as keyof typeof conditionMultiplier] || 1.0))
  }

  const generateDefaultKeywords = () => {
    const { year, make, model, engine } = vehicleInfo
    return [
      `${year} ${make} ${model}`,
      partName.toLowerCase(),
      category.toLowerCase(),
      condition.toLowerCase(),
      engine || '',
      'used auto parts',
      'automotive parts',
      'car parts'
    ].filter(Boolean)
  }

  const handleSave = () => {
    onSave(template)
    setIsOpen(false)
  }

  const handlePreview = () => {
    onPreview(template)
  }

  const updateTemplate = (field: keyof ListingTemplate, value: any) => {
    setTemplate(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateCustomization = (field: keyof ListingTemplate['customizations'], value: any) => {
    setTemplate(prev => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        [field]: value
      }
    }))
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      <FileText className="h-4 w-4" />
      eBay Template
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            eBay Listing Template - {partName}
          </DialogTitle>
          <DialogDescription>
            AI-generated eBay listing with customizable title, description, and pricing
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* AI Generation Status */}
          {generating && (
            <Card>
              <CardContent className="flex items-center gap-2 p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating AI-powered listing template...</span>
              </CardContent>
            </Card>
          )}

          {/* Title Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="h-5 w-5" />
                Listing Title
                {template.aiGenerated && (
                  <Badge variant="secondary" className="ml-2">
                    <Bot className="h-3 w-3 mr-1" />
                    AI Generated
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing.title ? (
                <div className="space-y-2">
                  <Input
                    value={template.title}
                    onChange={(e) => updateTemplate('title', e.target.value)}
                    placeholder="Enter listing title..."
                    maxLength={80}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setEditing({...editing, title: false})}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing({...editing, title: false})}>
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{template.title}</p>
                  <Button size="sm" variant="outline" onClick={() => setEditing({...editing, title: true})}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing.description ? (
                <div className="space-y-2">
                  <Textarea
                    value={template.description}
                    onChange={(e) => updateTemplate('description', e.target.value)}
                    placeholder="Enter listing description..."
                    rows={10}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setEditing({...editing, description: false})}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing({...editing, description: false})}>
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {template.description}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setEditing({...editing, description: true})}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit Description
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing.price ? (
                <div className="space-y-2">
                  <Label htmlFor="price">Listing Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={template.price}
                    onChange={(e) => updateTemplate('price', parseFloat(e.target.value) || 0)}
                    placeholder="Enter price..."
                    step="0.01"
                    min="0"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setEditing({...editing, price: false})}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing({...editing, price: false})}>
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">${template.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Suggested listing price</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setEditing({...editing, price: true})}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit Price
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Keywords Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5" />
                Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {template.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
