// Intelligent Data Extractor for Office & Industrial Only
// Auto-populates: Company Name, Location, SF, Rent, Lease Expiration

const pdf = require('pdf-parse');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class IntelligentDataExtractor {
    constructor() {
        this.database = [];
        this.propertyTypeFilters = {
            // INCLUDE these property types
            include: [
                'office', 'industrial', 'warehouse', 'distribution',
                'manufacturing', 'flex', 'r&d', 'research and development',
                'tech', 'corporate', 'headquarters', 'hq', 'logistics',
                'fulfillment', 'data center', 'lab', 'laboratory',
                'business park', 'commerce center', 'corporate campus'
            ],
            
            // EXCLUDE these property types
            exclude: [
                'retail', 'restaurant', 'shopping', 'mall', 'store',
                'apartment', 'residential', 'multifamily', 'housing',
                'hotel', 'hospitality', 'motel', 'inn',
                'medical retail', 'bank branch', 'gas station',
                'car wash', 'self storage', 'mini storage',
                'land', 'development site', 'vacant land'
            ]
        };
        
        // Pattern matching for data extraction
        this.extractionPatterns = {
            company: [
                /(?:Tenant|Lessee|Company|Occupant)[:\s]+([A-Z][A-Za-z0-9\s&,.\-']+(?:Inc|LLC|Corp|Company|Group|Partners|LLP|LP)?)/gi,
                /^([A-Z][A-Za-z0-9\s&,.\-']+(?:Inc|LLC|Corp|Company|Group|Partners|LLP|LP)?)\s+\d+,?\d+\s+(?:sf|sq|square)/gmi,
                /([A-Z][A-Za-z0-9\s&,.\-']+(?:Inc|LLC|Corp|Company|Group|Partners|LLP|LP)?)\s+(?:leases?|occupies?|rents?)\s+\d+/gi
            ],
            
            location: [
                /(?:Location|Address|Property)[:\s]+([^,\n]+(?:,\s*[A-Z]{2})?)/gi,
                /(\d+\s+[A-Z][A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Parkway|Pkwy|Way|Lane|Ln|Court|Ct|Plaza|Place|Circle|Cir))/gi,
                /(?:Minneapolis|St\.?\s*Paul|Bloomington|Edina|Minnetonka|Eden\s+Prairie|Plymouth|Brooklyn\s+Park|Maple\s+Grove|Woodbury|Burnsville|Eagan|Apple\s+Valley|Lakeville|Shakopee)[,\s]+MN/gi
            ],
            
            squareFootage: [
                /(\d{1,3},?\d{3})\s*(?:sf|sq\.?\s*ft\.?|square\s+feet|rentable|usable)/gi,
                /(?:Size|Area|Space)[:\s]+(\d{1,3},?\d{3})/gi,
                /(?:leases?|occupies?|rents?)\s+(\d{1,3},?\d{3})\s*(?:sf|square)/gi
            ],
            
            rent: [
                /\$(\d+\.?\d*)\s*(?:\/|per)\s*(?:sf|sq\.?\s*ft\.?|square\s+foot)/gi,
                /(?:Base\s+)?Rent[:\s]+\$(\d+\.?\d*)/gi,
                /(?:asking|quoted|current|contract)\s+(?:rate|rent)[:\s]+\$(\d+\.?\d*)/gi,
                /(\d+\.?\d*)\s*(?:NNN|NN|Modified\s+Gross|Full\s+Service)/gi
            ],
            
            leaseExpiration: [
                /(?:Lease\s+)?(?:Expir[ation|es|y|ing]+|Term\s+End[s]?|Through)[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/gi,
                /(?:Expir[ation|es|y|ing]+|End[s]?)[:\s]+(\w+\s+\d{1,2},?\s+\d{4})/gi,
                /(?:Lease\s+)?Term[:\s]+(?:\d+\s+years?\s+)?(?:through|until|ending)\s+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/gi,
                /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\s+(?:expir|end|term)/gi
            ]
        };
        
        this.dbPath = './prospect-database.json';
    }

    // Main extraction pipeline
    async extractFromSource(source, type = 'pdf') {
        console.log(`🔍 Extracting data from ${type} source...`);
        
        let rawText = '';
        
        if (type === 'pdf') {
            rawText = await this.extractPDFText(source);
        } else if (type === 'web') {
            rawText = await this.extractWebText(source);
        } else if (type === 'text') {
            rawText = source;
        }
        
        // Check if it's office/industrial (filter out retail/apartments)
        if (!this.isOfficeIndustrial(rawText)) {
            console.log('⚠️ Skipping: Not office/industrial property');
            return null;
        }
        
        // Extract structured data
        const prospects = this.extractProspectData(rawText);
        
        // Validate and enrich
        const validated = await this.validateAndEnrich(prospects);
        
        // Save to database
        await this.saveToDatabase(validated);
        
        return validated;
    }

    // Check if content is office/industrial
    isOfficeIndustrial(text) {
        const lowerText = text.toLowerCase();
        
        // Check for exclude keywords (retail, apartments, etc.)
        for (const excludeWord of this.propertyTypeFilters.exclude) {
            if (lowerText.includes(excludeWord)) {
                // Double-check it's not just mentioned in passing
                const regex = new RegExp(`(?:property\\s+type|asset\\s+type|class|category)[:\\s]*${excludeWord}`, 'i');
                if (regex.test(text)) {
                    return false; // Definitely not office/industrial
                }
            }
        }
        
        // Check for include keywords
        for (const includeWord of this.propertyTypeFilters.include) {
            if (lowerText.includes(includeWord)) {
                return true;
            }
        }
        
        // Default to true if unclear (manual review can exclude later)
        return true;
    }

    // Extract text from PDF
    async extractPDFText(pdfPath) {
        try {
            const dataBuffer = await fs.readFile(pdfPath);
            const data = await pdf(dataBuffer);
            return data.text;
        } catch (error) {
            console.error('Error reading PDF:', error.message);
            return '';
        }
    }

    // Extract text from web page
    async extractWebText(url) {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            
            // Remove scripts and styles
            $('script, style').remove();
            
            // Get text content
            return $('body').text();
        } catch (error) {
            console.error('Error fetching web page:', error.message);
            return '';
        }
    }

    // Extract prospect data from text
    extractProspectData(text) {
        const prospects = [];
        const sections = this.segmentText(text);
        
        for (const section of sections) {
            const prospect = {
                company: null,
                location: null,
                sqft: null,
                rent: null,
                leaseExpiration: null,
                propertyType: null,
                source: 'Extracted',
                extractedAt: new Date().toISOString()
            };
            
            // Extract company name
            for (const pattern of this.extractionPatterns.company) {
                const matches = [...section.matchAll(pattern)];
                if (matches.length > 0) {
                    prospect.company = this.cleanCompanyName(matches[0][1]);
                    break;
                }
            }
            
            // Extract location
            for (const pattern of this.extractionPatterns.location) {
                const matches = [...section.matchAll(pattern)];
                if (matches.length > 0) {
                    prospect.location = this.cleanLocation(matches[0][1] || matches[0][0]);
                    break;
                }
            }
            
            // Extract square footage
            for (const pattern of this.extractionPatterns.squareFootage) {
                const matches = [...section.matchAll(pattern)];
                if (matches.length > 0) {
                    prospect.sqft = parseInt(matches[0][1].replace(/,/g, ''));
                    break;
                }
            }
            
            // Extract rent
            for (const pattern of this.extractionPatterns.rent) {
                const matches = [...section.matchAll(pattern)];
                if (matches.length > 0) {
                    prospect.rent = parseFloat(matches[0][1]);
                    break;
                }
            }
            
            // Extract lease expiration
            for (const pattern of this.extractionPatterns.leaseExpiration) {
                const matches = [...section.matchAll(pattern)];
                if (matches.length > 0) {
                    prospect.leaseExpiration = this.parseDate(matches[0][1]);
                    break;
                }
            }
            
            // Determine property type
            prospect.propertyType = this.detectPropertyType(section);
            
            // Only add if we have minimum required data
            if (prospect.company && (prospect.sqft || prospect.leaseExpiration)) {
                // Filter out small spaces (likely retail)
                if (!prospect.sqft || prospect.sqft >= 2000) {
                    prospects.push(prospect);
                }
            }
        }
        
        return prospects;
    }

    // Segment text into potential tenant sections
    segmentText(text) {
        const segments = [];
        
        // Try to split by tenant/lease sections
        const splitPatterns = [
            /tenant\s+(?:profile|information|details)/gi,
            /lease\s+(?:abstract|summary|details)/gi,
            /suite\s+\d+/gi,
            /floor\s+\d+/gi
        ];
        
        let workingText = text;
        for (const pattern of splitPatterns) {
            const parts = workingText.split(pattern);
            if (parts.length > 1) {
                segments.push(...parts);
                return segments;
            }
        }
        
        // If no clear sections, split by double newlines
        const paragraphs = text.split(/\n\n+/);
        
        // Group related paragraphs
        let currentSegment = '';
        for (const para of paragraphs) {
            currentSegment += para + '\n\n';
            
            // If segment is large enough, save it
            if (currentSegment.length > 500) {
                segments.push(currentSegment);
                currentSegment = '';
            }
        }
        
        if (currentSegment) {
            segments.push(currentSegment);
        }
        
        return segments.length > 0 ? segments : [text];
    }

    // Detect property type from context
    detectPropertyType(text) {
        const lowerText = text.toLowerCase();
        
        // Check for specific property type mentions
        if (lowerText.includes('office') && !lowerText.includes('medical office')) {
            return 'Office';
        }
        if (lowerText.includes('industrial') || lowerText.includes('warehouse') || 
            lowerText.includes('distribution') || lowerText.includes('manufacturing')) {
            return 'Industrial';
        }
        if (lowerText.includes('flex') || lowerText.includes('r&d')) {
            return 'Flex';
        }
        
        // Check for building class (indicates office)
        if (/class\s+[abc]/i.test(text)) {
            return 'Office';
        }
        
        // Check for dock doors (indicates industrial)
        if (/dock\s+door|loading\s+dock|truck\s+court/i.test(text)) {
            return 'Industrial';
        }
        
        // Check for clear height (indicates industrial/warehouse)
        if (/clear\s+height|ceiling\s+height\s*:\s*\d+/i.test(text)) {
            return 'Industrial';
        }
        
        return 'Office'; // Default to office if unclear
    }

    // Clean extracted company name
    cleanCompanyName(name) {
        if (!name) return null;
        
        // Remove extra whitespace
        name = name.trim().replace(/\s+/g, ' ');
        
        // Remove common prefixes
        name = name.replace(/^(?:Tenant|Lessee|Company|Occupant)[:\s]+/i, '');
        
        // Ensure proper capitalization for suffixes
        name = name.replace(/\b(inc|llc|corp|llp|lp)\b/gi, match => match.toUpperCase());
        
        // Remove trailing punctuation
        name = name.replace(/[,.\s]+$/, '');
        
        return name;
    }

    // Clean extracted location
    cleanLocation(location) {
        if (!location) return null;
        
        location = location.trim();
        
        // Extract city from full address
        const mnCities = [
            'Minneapolis', 'St. Paul', 'Saint Paul', 'Bloomington', 'Edina',
            'Minnetonka', 'Eden Prairie', 'Plymouth', 'Brooklyn Park',
            'Maple Grove', 'Woodbury', 'Burnsville', 'Eagan', 'Apple Valley',
            'Lakeville', 'Shakopee', 'Chanhassen', 'Richfield', 'Roseville'
        ];
        
        for (const city of mnCities) {
            if (location.includes(city)) {
                return city.replace('Saint Paul', 'St. Paul');
            }
        }
        
        return location;
    }

    // Parse date from various formats
    parseDate(dateStr) {
        if (!dateStr) return null;
        
        // Try standard date parse
        let date = new Date(dateStr);
        if (!isNaN(date)) {
            return date.toISOString().split('T')[0];
        }
        
        // Handle MM/DD/YYYY or MM-DD-YYYY
        const usFormat = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
        if (usFormat) {
            const year = usFormat[3].length === 2 ? '20' + usFormat[3] : usFormat[3];
            return `${year}-${usFormat[1].padStart(2, '0')}-${usFormat[2].padStart(2, '0')}`;
        }
        
        // Handle Month DD, YYYY
        const textFormat = dateStr.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
        if (textFormat) {
            const months = {
                'january': '01', 'february': '02', 'march': '03', 'april': '04',
                'may': '05', 'june': '06', 'july': '07', 'august': '08',
                'september': '09', 'october': '10', 'november': '11', 'december': '12',
                'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
                'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09',
                'oct': '10', 'nov': '11', 'dec': '12'
            };
            const month = months[textFormat[1].toLowerCase()];
            if (month) {
                return `${textFormat[3]}-${month}-${textFormat[2].padStart(2, '0')}`;
            }
        }
        
        return dateStr; // Return as-is if can't parse
    }

    // Validate and enrich extracted data
    async validateAndEnrich(prospects) {
        const validated = [];
        
        for (const prospect of prospects) {
            // Skip if missing critical data
            if (!prospect.company) continue;
            
            // Calculate days until expiration
            if (prospect.leaseExpiration) {
                const expiry = new Date(prospect.leaseExpiration);
                const now = new Date();
                prospect.daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
                
                // Skip if already expired or too far out
                if (prospect.daysUntilExpiry < 0 || prospect.daysUntilExpiry > 1095) {
                    continue; // Skip expired or 3+ years out
                }
            }
            
            // Assign priority
            prospect.priority = this.calculatePriority(prospect);
            
            // Estimate market rent if not provided
            if (!prospect.marketRent && prospect.rent) {
                prospect.marketRent = this.estimateMarketRent(prospect);
            }
            
            // Calculate savings opportunity
            if (prospect.rent && prospect.marketRent && prospect.sqft) {
                prospect.annualSavings = (prospect.rent - prospect.marketRent) * prospect.sqft * 12;
            }
            
            validated.push(prospect);
        }
        
        return validated;
    }

    // Calculate priority score
    calculatePriority(prospect) {
        let score = 0;
        
        // Size factor
        if (prospect.sqft) {
            if (prospect.sqft > 50000) score += 30;
            else if (prospect.sqft > 25000) score += 20;
            else if (prospect.sqft > 10000) score += 10;
        }
        
        // Timing factor
        if (prospect.daysUntilExpiry) {
            if (prospect.daysUntilExpiry < 180) score += 30;
            else if (prospect.daysUntilExpiry < 365) score += 20;
            else if (prospect.daysUntilExpiry < 540) score += 10;
        }
        
        // Savings factor
        if (prospect.annualSavings) {
            if (prospect.annualSavings > 500000) score += 30;
            else if (prospect.annualSavings > 250000) score += 20;
            else if (prospect.annualSavings > 100000) score += 10;
        }
        
        if (score >= 60) return 'HIGH';
        if (score >= 40) return 'MEDIUM';
        return 'LOW';
    }

    // Estimate market rent based on location and type
    estimateMarketRent(prospect) {
        const marketRates = {
            Office: {
                'Minneapolis': { classA: 28.50, classB: 22.00, average: 25.00 },
                'St. Paul': { classA: 24.00, classB: 19.50, average: 21.50 },
                'Bloomington': { classA: 24.00, classB: 20.00, average: 22.00 },
                'Edina': { classA: 26.00, classB: 22.00, average: 24.00 },
                'Eden Prairie': { classA: 25.00, classB: 21.00, average: 23.00 },
                'default': { average: 22.00 }
            },
            Industrial: {
                'Minneapolis': { average: 7.50 },
                'St. Paul': { average: 7.00 },
                'Brooklyn Park': { average: 6.75 },
                'Plymouth': { average: 7.25 },
                'default': { average: 7.00 }
            },
            Flex: {
                'default': { average: 10.50 }
            }
        };
        
        const type = prospect.propertyType || 'Office';
        const location = prospect.location || 'default';
        
        const rates = marketRates[type] || marketRates.Office;
        const locationRates = rates[location] || rates.default;
        
        // Return 10% below current rent as estimated market (conservative)
        if (prospect.rent) {
            return prospect.rent * 0.9;
        }
        
        return locationRates.average;
    }

    // Save to database
    async saveToDatabase(prospects) {
        try {
            // Load existing database
            let existingData = [];
            try {
                const dbContent = await fs.readFile(this.dbPath, 'utf8');
                existingData = JSON.parse(dbContent);
            } catch (error) {
                // Database doesn't exist yet
            }
            
            // Merge new prospects (avoid duplicates)
            for (const prospect of prospects) {
                const exists = existingData.find(p => 
                    p.company === prospect.company && 
                    p.location === prospect.location &&
                    p.sqft === prospect.sqft
                );
                
                if (!exists) {
                    existingData.push({
                        ...prospect,
                        id: Date.now() + Math.random(),
                        createdAt: new Date().toISOString()
                    });
                }
            }
            
            // Save updated database
            await fs.writeFile(this.dbPath, JSON.stringify(existingData, null, 2));
            
            console.log(`✅ Saved ${prospects.length} new prospects to database`);
            console.log(`📊 Total prospects in database: ${existingData.length}`);
            
        } catch (error) {
            console.error('Error saving to database:', error.message);
        }
    }

    // Search and filter database
    async searchDatabase(filters = {}) {
        try {
            const dbContent = await fs.readFile(this.dbPath, 'utf8');
            let data = JSON.parse(dbContent);
            
            // Apply filters
            if (filters.company) {
                data = data.filter(p => p.company.toLowerCase().includes(filters.company.toLowerCase()));
            }
            
            if (filters.location) {
                data = data.filter(p => p.location === filters.location);
            }
            
            if (filters.propertyType) {
                data = data.filter(p => p.propertyType === filters.propertyType);
            }
            
            if (filters.minSqft) {
                data = data.filter(p => p.sqft >= filters.minSqft);
            }
            
            if (filters.maxSqft) {
                data = data.filter(p => p.sqft <= filters.maxSqft);
            }
            
            if (filters.maxDaysUntilExpiry) {
                data = data.filter(p => p.daysUntilExpiry <= filters.maxDaysUntilExpiry);
            }
            
            if (filters.priority) {
                data = data.filter(p => p.priority === filters.priority);
            }
            
            return data;
            
        } catch (error) {
            console.error('Error searching database:', error.message);
            return [];
        }
    }

    // Generate analytics
    async generateAnalytics() {
        try {
            const dbContent = await fs.readFile(this.dbPath, 'utf8');
            const data = JSON.parse(dbContent);
            
            const analytics = {
                totalProspects: data.length,
                byPropertyType: {},
                byLocation: {},
                byPriority: {},
                avgSqft: 0,
                avgDaysUntilExpiry: 0,
                totalPotentialSavings: 0,
                upcomingExpirations: {
                    next90Days: 0,
                    next180Days: 0,
                    next365Days: 0
                }
            };
            
            // Calculate metrics
            let totalSqft = 0;
            let totalDays = 0;
            let countWithExpiry = 0;
            
            for (const prospect of data) {
                // By property type
                analytics.byPropertyType[prospect.propertyType] = 
                    (analytics.byPropertyType[prospect.propertyType] || 0) + 1;
                
                // By location
                analytics.byLocation[prospect.location] = 
                    (analytics.byLocation[prospect.location] || 0) + 1;
                
                // By priority
                analytics.byPriority[prospect.priority] = 
                    (analytics.byPriority[prospect.priority] || 0) + 1;
                
                // Square footage
                if (prospect.sqft) {
                    totalSqft += prospect.sqft;
                }
                
                // Days until expiry
                if (prospect.daysUntilExpiry) {
                    totalDays += prospect.daysUntilExpiry;
                    countWithExpiry++;
                    
                    if (prospect.daysUntilExpiry <= 90) analytics.upcomingExpirations.next90Days++;
                    else if (prospect.daysUntilExpiry <= 180) analytics.upcomingExpirations.next180Days++;
                    else if (prospect.daysUntilExpiry <= 365) analytics.upcomingExpirations.next365Days++;
                }
                
                // Savings
                if (prospect.annualSavings) {
                    analytics.totalPotentialSavings += prospect.annualSavings;
                }
            }
            
            analytics.avgSqft = data.length > 0 ? Math.round(totalSqft / data.length) : 0;
            analytics.avgDaysUntilExpiry = countWithExpiry > 0 ? Math.round(totalDays / countWithExpiry) : 0;
            
            return analytics;
            
        } catch (error) {
            console.error('Error generating analytics:', error.message);
            return null;
        }
    }
}

// Automated extraction runner
async function runAutomatedExtraction() {
    const extractor = new IntelligentDataExtractor();
    
    console.log('🤖 Intelligent Data Extractor - Office & Industrial Only\n');
    console.log('=' .repeat(50));
    
    // Example: Extract from a sample OM text
    const sampleOM = `
    OFFERING MEMORANDUM
    
    Normandale Lake Office Park
    8300 Norman Center Drive, Bloomington, MN 55437
    
    Property Type: Class A Office Building
    Total Building Size: 450,000 SF
    
    RENT ROLL
    
    Tech Solutions Inc
    Suite 100
    25,000 SF
    Lease Expiration: March 31, 2027
    Current Rent: $28.50/SF
    
    Financial Services Group LLC
    Suite 200
    45,000 SF
    Lease Expiration: December 31, 2026
    Current Rent: $32.00/SF
    
    Healthcare Management Corp
    Suite 300
    30,000 SF
    Lease Expiration: June 30, 2027
    Current Rent: $29.00/SF
    
    Note: This is a premier office property, not retail or residential.
    `;
    
    // Extract data
    const prospects = await extractor.extractFromSource(sampleOM, 'text');
    
    console.log('\n📊 EXTRACTION RESULTS');
    console.log('=' .repeat(50));
    
    if (prospects && prospects.length > 0) {
        console.log(`✅ Extracted ${prospects.length} office/industrial prospects\n`);
        
        prospects.forEach((p, i) => {
            console.log(`${i + 1}. ${p.company}`);
            console.log(`   Location: ${p.location}`);
            console.log(`   Size: ${p.sqft ? p.sqft.toLocaleString() + ' SF' : 'Unknown'}`);
            console.log(`   Rent: ${p.rent ? '$' + p.rent + '/SF' : 'Unknown'}`);
            console.log(`   Expires: ${p.leaseExpiration || 'Unknown'}`);
            console.log(`   Type: ${p.propertyType}`);
            console.log(`   Priority: ${p.priority}\n`);
        });
    } else {
        console.log('❌ No office/industrial prospects found (retail/apartments filtered out)');
    }
    
    // Generate analytics
    const analytics = await extractor.generateAnalytics();
    if (analytics) {
        console.log('\n📈 DATABASE ANALYTICS');
        console.log('=' .repeat(50));
        console.log(`Total Prospects: ${analytics.totalProspects}`);
        console.log(`Average Size: ${analytics.avgSqft.toLocaleString()} SF`);
        console.log(`Expiring < 6 Months: ${analytics.upcomingExpirations.next180Days}`);
        console.log(`Total Potential Savings: $${(analytics.totalPotentialSavings / 1000000).toFixed(1)}M`);
    }
}

module.exports = { IntelligentDataExtractor, runAutomatedExtraction };

// Run if called directly
if (require.main === module) {
    runAutomatedExtraction().catch(console.error);
}