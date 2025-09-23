const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupDuplicateResearch() {
  try {
    console.log('🧹 Starting cleanup of duplicate price research records...')
    
    // Get all active price research records
    const allResearch = await prisma.priceResearch.findMany({
      where: { isActive: true },
      orderBy: [
        { partsMasterId: 'asc' },
        { researchDate: 'desc' }
      ]
    })
    
    console.log(`📊 Found ${allResearch.length} active research records`)
    
    // Group by partsMasterId
    const groupedByPart = {}
    allResearch.forEach(record => {
      if (!groupedByPart[record.partsMasterId]) {
        groupedByPart[record.partsMasterId] = []
      }
      groupedByPart[record.partsMasterId].push(record)
    })
    
    console.log(`📊 Found ${Object.keys(groupedByPart).length} unique parts`)
    
    let totalDeleted = 0
    let totalKept = 0
    
    // For each part, keep only the most recent record and deactivate the rest
    for (const [partsMasterId, records] of Object.entries(groupedByPart)) {
      if (records.length > 1) {
        console.log(`🔄 Part ${partsMasterId} has ${records.length} records, keeping most recent...`)
        
        // Sort by research date (most recent first)
        const sortedRecords = records.sort((a, b) => new Date(b.researchDate) - new Date(a.researchDate))
        
        // Keep the first (most recent) record
        const keepRecord = sortedRecords[0]
        const deleteRecords = sortedRecords.slice(1)
        
        // Deactivate the older records
        const deleteIds = deleteRecords.map(r => r.id)
        await prisma.priceResearch.updateMany({
          where: {
            id: { in: deleteIds }
          },
          data: {
            isActive: false
          }
        })
        
        totalDeleted += deleteRecords.length
        totalKept += 1
        
        console.log(`✅ Kept record ${keepRecord.id} (${keepRecord.partName}), deactivated ${deleteRecords.length} duplicates`)
      } else {
        totalKept += 1
      }
    }
    
    console.log(`\n🎉 Cleanup completed!`)
    console.log(`📊 Summary:`)
    console.log(`   - Total parts processed: ${Object.keys(groupedByPart).length}`)
    console.log(`   - Records kept: ${totalKept}`)
    console.log(`   - Duplicate records deactivated: ${totalDeleted}`)
    console.log(`   - Original total records: ${allResearch.length}`)
    console.log(`   - Final active records: ${totalKept}`)
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanupDuplicateResearch()
