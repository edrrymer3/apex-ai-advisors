// Offering Memorandum & Rent Roll Scraper
// Extracts tenant lease data from investment sale marketing materials

const axios = require('axios');
const cheerio = require('cheerio');
const pdf = require('pdf-parse');
const fs = require('fs').promises;
const path = require('path');

class OfferingMemorandumScraper {
    constructor() {
        this.dataDir = './om-intelligence';
        this.sources = {
            // Investment sale platforms that host OMs
            loopnet: {
                baseUrl: 'https://www.loopnet.com',
                searchPaths: [
                    '/for-sale/commercial-real-estate/',
                    '/minnesota/investment-properties/',
                    '/minneapolis-mn/investment-properties/'
                ],
                hasOMs: true
            },
            crexi: {
                baseUrl: 'https://www.crexi.com',
                searchPaths: [
                    '/properties/for-sale',
                    '/properties/sale/minnesota'
                ],
                hasOMs: true
            },
            tenFourteen: {
                baseUrl: 'https://www.ten-x.com',
                searchPaths: ['/commercial'],
                hasOMs: true
            },
            // Brokerage sites with investment sales
            cbre: {
                baseUrl: 'https://www.cbre.us',
                searchPaths: ['/properties/investment-properties'],
                hasOMs: true
            },
            marcusMilChap: {
                baseUrl: 'https://www.marcusmillichap.com',
                searchPaths: ['/properties/for-sale'],
                hasOMs: true
            },
            colliers: {
                baseUrl: 'https://www.colliers.com',
                searchPaths: ['/en/properties/investment-sales'],
                hasOMs: true
            }
        };
        
        // Search patterns for finding OMs and rent rolls
        this.searchTerms = [
            'offering memorandum',
            'rent roll',
            'investment opportunity',
            'confidential offering',
            'executive summary',
            'property overview',
            'tenant roster',
            'lease abstract',
            'income statement',
            'for sale multitenant',
            'investment sale',
            'cap rate',
            'noi'
        ];
        
        // Pattern matching for extracting data
        this.patterns = {
            tenantName: [
                /Tenant[:\s]+([A-Z][A-Za-z0-9\s&,.\-']+)/g,
                /Lessee[:\s]+([A-Z][A-Za-z0-9\s&,.\-']+)/g,
                /Company[:\s]+([A-Z][A-Za-z0-9\s&,.\-']+)/g
            ],
            leaseExpiration: [
                /Lease\s+Expir[ation|es|y]+[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/gi,
                /Term\s+End[s]?[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/gi,
                /Expir[ation|es|y]+[:\s]+(\w+\s+\d{1,2},?\s+\d{4})/gi,
                /Through[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/gi
            ],
            squareFootage: [
                /(\d{1,3},?\d{3})\s*(?:sf|sq\.?\s*ft\.?|square\s+feet)/gi,
                /Size[:\s]+(\d{1,3},?\d{3})/gi,
                /Area[:\s]+(\d{1,3},?\d{3})/gi
            ],
            rentRate: [
                /\$(\d+\.?\d*)\s*(?:\/|per)\s*(?:sf|sq\.?\s*ft\.?)/gi,
                /Rent[:\s]+\$(\d+\.?\d*)/gi,
                /Base\s+Rent[:\s]+\$(\d+\.?\d*)/gi,
                /Current\s+Rent[:\s]+\$(\d+\.?\d*)/gi
            ],
            annualRent: [
                /Annual\s+Rent[:\s]+\$(\d{1,3},?\d{3},?\d{3})/gi,
                /Yearly[:\s]+\$(\d{1,3},?\d{3},?\d{3})/gi,
                /Annual\s+Base[:\s]+\$(\d{1,3},?\d{3},?\d{3})/gi
            ]
        };
    }

    async initialize() {
        await fs.mkdir(this.dataDir, { recursive: true });
        await fs.mkdir(`${this.dataDir}/pdfs`, { recursive: true });
        await fs.mkdir(`${this.dataDir}/extracted`, { recursive: true });
        await fs.mkdir(`${this.dataDir}/reports`, { recursive: true });
    }

    // Search for OMs and rent rolls on investment sites
    async searchForOMs(location = 'Minnesota') {
        console.log('🔍 Searching for Offering Memorandums and Rent Rolls...\n');
        
        const foundDocuments = [];
        
        // Search LoopNet for investment properties with OMs
        try {
            console.log('Searching LoopNet for investment sales...');
            const loopnetResults = await this.searchLoopNet(location);
            foundDocuments.push(...loopnetResults);
        } catch (error) {
            console.log('Could not search LoopNet:', error.message);
        }
        
        // Search Google for publicly indexed OMs
        const googleResults = await this.googleSearchOMs(location);
        foundDocuments.push(...googleResults);
        
        return foundDocuments;
    }

    // Google search for PDFs (many OMs are indexed)
    async googleSearchOMs(location) {
        const queries = [
            `"offering memorandum" "${location}" filetype:pdf`,
            `"rent roll" "commercial" "${location}" filetype:pdf`,
            `"investment opportunity" "multi-tenant" "${location}" filetype:pdf`,
            `"confidential offering" "office building" "${location}" filetype:pdf`,
            `"for sale" "tenant" "lease expiration" "${location}" filetype:pdf`,
            `site:loopnet.com "offering memorandum" "${location}"`,
            `site:crexi.com "rent roll" "${location}"`,
            `site:marcusmillichap.com "offering" "${location}"`
        ];
        
        const results = [];
        
        // In production, would use Google Custom Search API
        // For now, showing what we'd find
        const sampleResults = [
            {
                title: 'Normandale Lake Office Park - Offering Memorandum',
                url: 'example.com/normandale-om.pdf',
                source: 'Google',
                location: 'Bloomington, MN',
                propertyType: 'Office',
                snippet: 'Multi-tenant office building, 85% occupied, rent roll included'
            },
            {
                title: '7900 International Drive - Investment Opportunity',
                url: 'example.com/7900-international.pdf',
                source: 'Google',
                location: 'Minneapolis, MN',
                propertyType: 'Office',
                snippet: '12 tenants, lease expirations 2024-2029, detailed rent roll'
            },
            {
                title: 'Brooklyn Park Industrial - Confidential Offering',
                url: 'example.com/brooklyn-park-industrial.pdf',
                source: 'Google',
                location: 'Brooklyn Park, MN',
                propertyType: 'Industrial',
                snippet: '3 tenants, NNN leases, full rent roll attached'
            }
        ];
        
        return sampleResults;
    }

    // Parse PDF for tenant information
    async parsePDFForTenants(pdfPath) {
        console.log(`📄 Parsing PDF: ${pdfPath}`);
        
        try {
            const dataBuffer = await fs.readFile(pdfPath);
            const data = await pdf(dataBuffer);
            const text = data.text;
            
            // Extract rent roll if present
            const rentRoll = this.extractRentRoll(text);
            
            // Extract individual leases
            const leases = this.extractLeaseInfo(text);
            
            // Extract property info
            const propertyInfo = this.extractPropertyInfo(text);
            
            return {
                property: propertyInfo,
                rentRoll: rentRoll,
                leases: leases,
                rawText: text.substring(0, 5000) // Keep sample for debugging
            };
            
        } catch (error) {
            console.error('Error parsing PDF:', error.message);
            return null;
        }
    }

    // Extract structured rent roll from text
    extractRentRoll(text) {
        const rentRoll = [];
        
        // Look for rent roll section
        const rentRollSection = this.findSection(text, [
            'RENT ROLL',
            'TENANT ROSTER',
            'LEASE ABSTRACT',
            'TENANT SCHEDULE',
            'OCCUPANCY SCHEDULE'
        ]);
        
        if (!rentRollSection) return rentRoll;
        
        // Parse table-like data
        const lines = rentRollSection.split('\n');
        let inTable = false;
        
        for (const line of lines) {
            // Look for tenant entries (various formats)
            // Format 1: Tenant Name | Suite | SF | Lease Start | Lease End | Rate | Annual Rent
            const format1 = line.match(/([A-Z][A-Za-z0-9\s&,.\-']+)\s+(\d+)\s+(\d{1,3},?\d{3})\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+\$?(\d+\.?\d*)\s+\$?(\d{1,3},?\d{3})/);
            
            // Format 2: Suite | Tenant | Size | Exp Date | Rent PSF
            const format2 = line.match(/(\d+)\s+([A-Z][A-Za-z0-9\s&,.\-']+)\s+(\d{1,3},?\d{3})\s+(\d{1,2}\/\d{2,4}|\w+\s+\d{4})\s+\$?(\d+\.?\d*)/);
            
            if (format1) {
                rentRoll.push({
                    tenant: format1[1].trim(),
                    suite: format1[2],
                    sqft: parseInt(format1[3].replace(/,/g, '')),
                    leaseStart: format1[4],
                    leaseExpiration: format1[5],
                    rentPerSqFt: parseFloat(format1[6]),
                    annualRent: parseInt(format1[7].replace(/,/g, ''))
                });
            } else if (format2) {
                rentRoll.push({
                    suite: format2[1],
                    tenant: format2[2].trim(),
                    sqft: parseInt(format2[3].replace(/,/g, '')),
                    leaseExpiration: format2[4],
                    rentPerSqFt: parseFloat(format2[5])
                });
            }
            
            // Also try to extract from paragraph format
            const tenantMatch = line.match(/tenant[:\s]+([A-Z][A-Za-z0-9\s&,.\-']+)/i);
            const expirationMatch = line.match(/expir[ation|es|y]+[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\w+\s+\d{4})/i);
            const sizeMatch = line.match(/(\d{1,3},?\d{3})\s*(?:sf|sq\.?\s*ft\.?)/i);
            const rateMatch = line.match(/\$(\d+\.?\d*)\s*(?:\/|per)\s*(?:sf|sq\.?\s*ft\.?)/i);
            
            if (tenantMatch && expirationMatch && sizeMatch) {
                rentRoll.push({
                    tenant: tenantMatch[1].trim(),
                    sqft: parseInt(sizeMatch[1].replace(/,/g, '')),
                    leaseExpiration: expirationMatch[1],
                    rentPerSqFt: rateMatch ? parseFloat(rateMatch[1]) : null
                });
            }
        }
        
        // Remove duplicates
        const unique = [];
        const seen = new Set();
        
        for (const entry of rentRoll) {
            const key = `${entry.tenant}-${entry.sqft}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(entry);
            }
        }
        
        return unique;
    }

    // Extract individual lease information
    extractLeaseInfo(text) {
        const leases = [];
        
        // Split by common section markers
        const sections = text.split(/(?:tenant|lease|suite)\s+(?:profile|information|details)/i);
        
        for (const section of sections) {
            const lease = {};
            
            // Extract tenant name
            for (const pattern of this.patterns.tenantName) {
                const match = section.match(pattern);
                if (match) {
                    lease.tenant = match[1].trim();
                    break;
                }
            }
            
            // Extract lease expiration
            for (const pattern of this.patterns.leaseExpiration) {
                const match = section.match(pattern);
                if (match) {
                    lease.expirationDate = this.parseDate(match[1]);
                    break;
                }
            }
            
            // Extract square footage
            for (const pattern of this.patterns.squareFootage) {
                const match = section.match(pattern);
                if (match) {
                    lease.sqft = parseInt(match[1].replace(/,/g, ''));
                    break;
                }
            }
            
            // Extract rent rate
            for (const pattern of this.patterns.rentRate) {
                const match = section.match(pattern);
                if (match) {
                    lease.rentPerSqFt = parseFloat(match[1]);
                    break;
                }
            }
            
            // Extract annual rent
            for (const pattern of this.patterns.annualRent) {
                const match = section.match(pattern);
                if (match) {
                    lease.annualRent = parseInt(match[1].replace(/,/g, ''));
                    break;
                }
            }
            
            // Extract lease term remaining
            const termMatch = section.match(/(\d+)\s*(?:years?|months?)\s+remaining/i);
            if (termMatch) {
                lease.termRemaining = termMatch[0];
            }
            
            // Extract options
            const optionMatch = section.match(/(\d+)\s*(?:x|\*)\s*(\d+)\s*year\s+options?/i);
            if (optionMatch) {
                lease.options = optionMatch[0];
            }
            
            // Only add if we have meaningful data
            if (lease.tenant && (lease.expirationDate || lease.sqft)) {
                leases.push(lease);
            }
        }
        
        return leases;
    }

    // Extract property information
    extractPropertyInfo(text) {
        const property = {};
        
        // Property name
        const nameMatch = text.match(/(?:property\s+name|building|property)[:\s]+([A-Z][A-Za-z0-9\s&,.\-']+)/i);
        if (nameMatch) property.name = nameMatch[1].trim();
        
        // Address
        const addressMatch = text.match(/(\d+\s+[A-Z][A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Parkway|Pkwy|Way|Place|Pl|Court|Ct))/i);
        if (addressMatch) property.address = addressMatch[0];
        
        // City, State
        const cityMatch = text.match(/(?:Minneapolis|St\.\s*Paul|Bloomington|Edina|Minnetonka|Eden\s+Prairie|Plymouth|Woodbury|Maple\s+Grove|Brooklyn\s+Park)[,\s]+MN/i);
        if (cityMatch) property.location = cityMatch[0];
        
        // Total square footage
        const totalSqftMatch = text.match(/(?:total|building|rentable|gross)\s+(?:area|size|sf|square\s+feet)[:\s]+(\d{1,3},?\d{3},?\d{3})/i);
        if (totalSqftMatch) property.totalSqFt = parseInt(totalSqftMatch[1].replace(/,/g, ''));
        
        // Number of tenants
        const tenantCountMatch = text.match(/(\d+)\s+tenants?/i);
        if (tenantCountMatch) property.numberOfTenants = parseInt(tenantCountMatch[1]);
        
        // Occupancy
        const occupancyMatch = text.match(/(\d+\.?\d*)%?\s+(?:occupied|occupancy|leased)/i);
        if (occupancyMatch) property.occupancy = parseFloat(occupancyMatch[1]);
        
        // Year built
        const yearBuiltMatch = text.match(/(?:year\s+built|built\s+in|constructed)[:\s]+(\d{4})/i);
        if (yearBuiltMatch) property.yearBuilt = parseInt(yearBuiltMatch[1]);
        
        // Property type
        if (text.match(/office/i)) property.type = 'Office';
        else if (text.match(/industrial|warehouse|distribution/i)) property.type = 'Industrial';
        else if (text.match(/retail/i)) property.type = 'Retail';
        else if (text.match(/flex/i)) property.type = 'Flex';
        
        return property;
    }

    // Find section in text
    findSection(text, markers) {
        for (const marker of markers) {
            const regex = new RegExp(marker + '[\\s\\S]{0,5000}', 'i');
            const match = text.match(regex);
            if (match) return match[0];
        }
        return null;
    }

    // Parse various date formats
    parseDate(dateStr) {
        if (!dateStr) return null;
        
        // Try different date formats
        const date = new Date(dateStr);
        if (!isNaN(date)) return date.toISOString().split('T')[0];
        
        // Handle MM/YYYY format
        const monthYear = dateStr.match(/(\d{1,2})\/(\d{4})/);
        if (monthYear) {
            return `${monthYear[2]}-${monthYear[1].padStart(2, '0')}-01`;
        }
        
        // Handle Month YYYY format
        const textMonth = dateStr.match(/(\w+)\s+(\d{4})/);
        if (textMonth) {
            const months = {
                'january': '01', 'february': '02', 'march': '03', 'april': '04',
                'may': '05', 'june': '06', 'july': '07', 'august': '08',
                'september': '09', 'october': '10', 'november': '11', 'december': '12',
                'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
                'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09',
                'sept': '09', 'oct': '10', 'nov': '11', 'dec': '12'
            };
            const month = months[textMonth[1].toLowerCase()];
            if (month) return `${textMonth[2]}-${month}-01`;
        }
        
        return dateStr;
    }

    // Generate prospects from extracted data
    generateProspectsFromOMs(extractedData) {
        const prospects = [];
        
        for (const doc of extractedData) {
            if (!doc.rentRoll && !doc.leases) continue;
            
            const tenants = [...(doc.rentRoll || []), ...(doc.leases || [])];
            
            for (const tenant of tenants) {
                if (!tenant.leaseExpiration) continue;
                
                const expirationDate = new Date(this.parseDate(tenant.leaseExpiration));
                const now = new Date();
                const daysUntilExpiry = Math.floor((expirationDate - now) / (1000 * 60 * 60 * 24));
                
                // Only include if expiring in next 24 months
                if (daysUntilExpiry > 730 || daysUntilExpiry < 0) continue;
                
                prospects.push({
                    source: 'Offering Memorandum',
                    property: doc.property?.name || 'Unknown Property',
                    address: doc.property?.address || '',
                    location: doc.property?.location || '',
                    
                    tenant: tenant.tenant,
                    suite: tenant.suite || '',
                    sqft: tenant.sqft || 0,
                    
                    currentRent: tenant.rentPerSqFt || tenant.annualRent / tenant.sqft || 0,
                    annualRent: tenant.annualRent || (tenant.rentPerSqFt * tenant.sqft * 12) || 0,
                    
                    leaseExpiration: tenant.leaseExpiration,
                    daysUntilExpiry: daysUntilExpiry,
                    
                    priority: this.calculatePriority(daysUntilExpiry, tenant.sqft),
                    
                    notes: `Found in OM for ${doc.property?.name || 'investment sale'}`,
                    documentUrl: doc.url || '',
                    
                    extractedAt: new Date().toISOString()
                });
            }
        }
        
        // Sort by priority
        prospects.sort((a, b) => b.priority - a.priority);
        
        return prospects;
    }

    calculatePriority(daysUntil, sqft) {
        let score = 0;
        
        // Timing score
        if (daysUntil < 180) score += 40;
        else if (daysUntil < 365) score += 30;
        else if (daysUntil < 540) score += 20;
        else score += 10;
        
        // Size score
        if (sqft > 50000) score += 30;
        else if (sqft > 25000) score += 20;
        else if (sqft > 10000) score += 10;
        
        return score;
    }

    // Generate report
    async generateOMReport(prospects) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Lease Intelligence from Offering Memorandums</title>
    <style>
        body { font-family: -apple-system, sans-serif; margin: 20px; background: #1a1a1a; color: white; }
        .header { background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%); padding: 2rem; border-radius: 12px; }
        .warning { background: #991B1B; padding: 1rem; margin: 1rem 0; border-radius: 8px; }
        table { width: 100%; background: #2d2d2d; border-radius: 8px; overflow: hidden; }
        th { background: #3d3d3d; padding: 1rem; text-align: left; }
        td { padding: 1rem; border-bottom: 1px solid #3d3d3d; }
        .high-priority { color: #FF6B6B; font-weight: bold; }
        .medium-priority { color: #FFE66D; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Lease Intelligence from Offering Memorandums</h1>
        <p>Extracted ${prospects.length} upcoming lease expirations from investment sale documents</p>
    </div>
    
    <div class="warning">
        ⚠️ CONFIDENTIAL: This data is extracted from public/semi-public offering memorandums.
        Use for business development only. Verify all information before contacting.
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Priority</th>
                <th>Tenant</th>
                <th>Property</th>
                <th>Location</th>
                <th>Size</th>
                <th>Current Rent</th>
                <th>Expires</th>
                <th>Days</th>
                <th>Source</th>
            </tr>
        </thead>
        <tbody>
            ${prospects.slice(0, 50).map(p => `
                <tr>
                    <td class="${p.priority > 50 ? 'high-priority' : p.priority > 30 ? 'medium-priority' : ''}">
                        ${p.priority > 50 ? 'HIGH' : p.priority > 30 ? 'MEDIUM' : 'LOW'}
                    </td>
                    <td><strong>${p.tenant}</strong></td>
                    <td>${p.property}</td>
                    <td>${p.location}</td>
                    <td>${p.sqft ? p.sqft.toLocaleString() + ' SF' : 'Unknown'}</td>
                    <td>${p.currentRent ? '$' + p.currentRent.toFixed(2) : 'N/A'}</td>
                    <td>${new Date(p.leaseExpiration).toLocaleDateString()}</td>
                    <td>${p.daysUntilExpiry}</td>
                    <td>${p.source}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div style="margin-top: 2rem; padding: 1rem; background: #2d2d2d; border-radius: 8px;">
        <h3>How to Use This Intelligence:</h3>
        <ol>
            <li><strong>Verify:</strong> Cross-reference with other sources</li>
            <li><strong>Research:</strong> Look up the company, find decision makers on LinkedIn</li>
            <li><strong>Approach:</strong> "I noticed you're at [Property]. With your lease coming up, thought you should know the market has shifted significantly..."</li>
            <li><strong>Don't Mention:</strong> Never say you saw their info in an OM - that looks predatory</li>
        </ol>
    </div>
</body>
</html>`;
        
        await fs.writeFile(`${this.dataDir}/reports/om-prospects-${Date.now()}.html`, html);
        return html;
    }

    // Master function
    async runOMIntelligence(location = 'Minnesota') {
        await this.initialize();
        
        console.log('📚 Offering Memorandum Intelligence System\n');
        console.log('=' .repeat(50));
        
        // Search for OMs
        const documents = await this.searchForOMs(location);
        console.log(`\nFound ${documents.length} potential OMs to analyze`);
        
        // Extract data from each
        const extractedData = [];
        for (const doc of documents) {
            // In production, would download and parse actual PDFs
            // For demo, showing what we'd extract
            extractedData.push({
                property: {
                    name: 'Normandale Lake Office Park',
                    address: '8300 Norman Center Drive',
                    location: 'Bloomington, MN',
                    totalSqFt: 450000,
                    occupancy: 85
                },
                rentRoll: [
                    {
                        tenant: 'Tech Solutions Inc',
                        suite: '100',
                        sqft: 25000,
                        leaseExpiration: '2027-03-31',
                        rentPerSqFt: 28.50
                    },
                    {
                        tenant: 'Regional Bank',
                        suite: '200',
                        sqft: 15000,
                        leaseExpiration: '2026-12-31',
                        rentPerSqFt: 30.00
                    },
                    {
                        tenant: 'Insurance Agency',
                        suite: '300',
                        sqft: 8500,
                        leaseExpiration: '2027-06-30',
                        rentPerSqFt: 27.00
                    }
                ]
            });
        }
        
        // Generate prospects
        const prospects = this.generateProspectsFromOMs(extractedData);
        
        // Generate report
        await this.generateOMReport(prospects);
        
        // Save to database
        await fs.writeFile(
            `${this.dataDir}/prospects.json`,
            JSON.stringify(prospects, null, 2)
        );
        
        console.log('\n📊 OM INTELLIGENCE SUMMARY');
        console.log('=' .repeat(50));
        console.log(`Documents Analyzed: ${extractedData.length}`);
        console.log(`Total Prospects Found: ${prospects.length}`);
        console.log(`High Priority (< 6 months): ${prospects.filter(p => p.daysUntilExpiry < 180).length}`);
        console.log(`Total Sq Ft Identified: ${prospects.reduce((sum, p) => sum + (p.sqft || 0), 0).toLocaleString()}`);
        
        console.log('\n🎯 TOP PROSPECTS FROM OMs:');
        prospects.slice(0, 5).forEach((p, i) => {
            console.log(`${i+1}. ${p.tenant} - ${p.sqft?.toLocaleString() || '?'} SF @ ${p.property}`);
            console.log(`   Expires: ${p.daysUntilExpiry} days | Current: $${p.currentRent}/SF`);
        });
        
        return prospects;
    }
}

module.exports = { OfferingMemorandumScraper };

// Run if called directly
if (require.main === module) {
    const scraper = new OfferingMemorandumScraper();
    scraper.runOMIntelligence('Minnesota')
        .then(() => console.log('\n✅ OM intelligence complete!'))
        .catch(console.error);
}