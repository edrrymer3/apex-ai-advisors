// Office & Industrial Property Scraper
// Focus: Office spaces, Industrial/Warehouse, Move-in ready (Subleases & Spec Suites)

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs').promises;

class CommercialPropertyScraper {
    constructor() {
        this.results = [];
        this.sources = {
            jll: 'https://property.jll.com',
            cbre: 'https://www.cbre.com/properties',
            cushman: 'https://www.cushmanwakefield.com/en/united-states/properties',
            colliers: 'https://www.colliers.com/properties',
            loopnet: 'https://www.loopnet.com'
        };
    }

    async initialize() {
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async scrapeJLLOffice(city = 'chicago', maxPages = 3) {
        const page = await this.browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        const properties = [];
        
        try {
            // JLL Office Listings
            await page.goto(`${this.sources.jll}/rent/office/${city}`, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            await this.randomDelay();
            
            // Extract office properties
            const offices = await page.evaluate(() => {
                const listings = [];
                document.querySelectorAll('.property-card').forEach(card => {
                    const property = {
                        type: 'Office',
                        source: 'JLL',
                        address: card.querySelector('.address')?.innerText || '',
                        building: card.querySelector('.building-name')?.innerText || '',
                        size: card.querySelector('.size')?.innerText || '',
                        availableSize: card.querySelector('.available')?.innerText || '',
                        askingRent: card.querySelector('.price')?.innerText || '',
                        availability: card.querySelector('.availability')?.innerText || '',
                        // Check for sublease indicator
                        isSublease: card.innerText.toLowerCase().includes('sublease'),
                        // Check for spec suite indicator
                        isSpecSuite: card.innerText.toLowerCase().includes('spec suite') || 
                                    card.innerText.toLowerCase().includes('built out'),
                        // Move-in ready indicators
                        moveInReady: card.innerText.toLowerCase().includes('immediate') ||
                                     card.innerText.toLowerCase().includes('move-in ready') ||
                                     card.innerText.toLowerCase().includes('furnished'),
                        amenities: [],
                        images: card.querySelector('img')?.src || '',
                        listingUrl: card.querySelector('a')?.href || '',
                        scrapedAt: new Date().toISOString()
                    };
                    
                    // Extract amenities if available
                    card.querySelectorAll('.amenity-tag').forEach(tag => {
                        property.amenities.push(tag.innerText);
                    });
                    
                    listings.push(property);
                });
                return listings;
            });
            
            properties.push(...offices);
            
        } catch (error) {
            console.error('Error scraping JLL:', error.message);
        }
        
        await page.close();
        return properties;
    }

    async scrapeJLLIndustrial(city = 'chicago', maxPages = 3) {
        const page = await this.browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
        
        const properties = [];
        
        try {
            // JLL Industrial/Warehouse Listings
            await page.goto(`${this.sources.jll}/rent/industrial/${city}`, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            await this.randomDelay();
            
            // Extract industrial properties
            const industrial = await page.evaluate(() => {
                const listings = [];
                document.querySelectorAll('.property-card').forEach(card => {
                    const property = {
                        type: 'Industrial',
                        subtype: '', // Will be populated below
                        source: 'JLL',
                        address: card.querySelector('.address')?.innerText || '',
                        size: card.querySelector('.size')?.innerText || '',
                        ceilingHeight: card.querySelector('.ceiling-height')?.innerText || '',
                        dockDoors: card.querySelector('.dock-doors')?.innerText || '',
                        askingRent: card.querySelector('.price')?.innerText || '',
                        availability: card.querySelector('.availability')?.innerText || '',
                        // Determine subtype
                        isWarehouse: card.innerText.toLowerCase().includes('warehouse'),
                        isFlex: card.innerText.toLowerCase().includes('flex'),
                        isDistribution: card.innerText.toLowerCase().includes('distribution'),
                        isManufacturing: card.innerText.toLowerCase().includes('manufacturing'),
                        // Sublease check
                        isSublease: card.innerText.toLowerCase().includes('sublease'),
                        // Ready to occupy
                        moveInReady: card.innerText.toLowerCase().includes('immediate') ||
                                    card.innerText.toLowerCase().includes('vacant'),
                        features: [],
                        listingUrl: card.querySelector('a')?.href || '',
                        scrapedAt: new Date().toISOString()
                    };
                    
                    // Set primary subtype
                    if (property.isWarehouse) property.subtype = 'Warehouse';
                    else if (property.isFlex) property.subtype = 'Flex Space';
                    else if (property.isDistribution) property.subtype = 'Distribution Center';
                    else if (property.isManufacturing) property.subtype = 'Manufacturing';
                    else property.subtype = 'General Industrial';
                    
                    listings.push(property);
                });
                return listings;
            });
            
            properties.push(...industrial);
            
        } catch (error) {
            console.error('Error scraping JLL Industrial:', error.message);
        }
        
        await page.close();
        return properties;
    }

    async scrapeCBRE(city = 'chicago', propertyTypes = ['office', 'industrial']) {
        const page = await this.browser.newPage();
        const properties = [];
        
        for (const propType of propertyTypes) {
            try {
                await page.goto(`https://www.cbre.com/properties/search?type=${propType}&location=${city}`, {
                    waitUntil: 'networkidle2'
                });
                
                await this.randomDelay();
                
                const cbresListings = await page.evaluate((type) => {
                    const listings = [];
                    document.querySelectorAll('.property-result').forEach(card => {
                        listings.push({
                            type: type.charAt(0).toUpperCase() + type.slice(1),
                            source: 'CBRE',
                            address: card.querySelector('.property-address')?.innerText || '',
                            building: card.querySelector('.property-name')?.innerText || '',
                            size: card.querySelector('.property-size')?.innerText || '',
                            askingRent: card.querySelector('.property-price')?.innerText || '',
                            availability: card.querySelector('.available-date')?.innerText || '',
                            isSublease: card.innerText.toLowerCase().includes('sublease'),
                            isSpecSuite: card.innerText.toLowerCase().includes('spec'),
                            broker: card.querySelector('.broker-name')?.innerText || '',
                            listingUrl: card.querySelector('a')?.href || '',
                            scrapedAt: new Date().toISOString()
                        });
                    });
                    return listings;
                }, propType);
                
                properties.push(...cbresListings);
                
            } catch (error) {
                console.error(`Error scraping CBRE ${propType}:`, error.message);
            }
        }
        
        await page.close();
        return properties;
    }

    async identifyMoveInReady(properties) {
        // Enhanced logic to identify move-in ready spaces
        return properties.map(property => {
            const moveInIndicators = {
                sublease: property.isSublease,
                specSuite: property.isSpecSuite,
                immediate: property.availability?.toLowerCase().includes('immediate'),
                now: property.availability?.toLowerCase().includes('now'),
                vacant: property.availability?.toLowerCase().includes('vacant'),
                furnished: property.amenities?.some(a => a.toLowerCase().includes('furnished')),
                builtOut: property.amenities?.some(a => a.toLowerCase().includes('built')),
                turnkey: property.description?.toLowerCase().includes('turnkey'),
                plugAndPlay: property.description?.toLowerCase().includes('plug and play')
            };
            
            // Calculate move-in readiness score
            const readinessScore = Object.values(moveInIndicators).filter(v => v).length;
            
            return {
                ...property,
                moveInReady: readinessScore >= 2,
                readinessScore,
                moveInIndicators
            };
        });
    }

    async saveResults(properties, filename = 'scraped-properties.json') {
        // Group by type and move-in readiness
        const organized = {
            office: {
                moveInReady: properties.filter(p => p.type === 'Office' && p.moveInReady),
                standard: properties.filter(p => p.type === 'Office' && !p.moveInReady)
            },
            industrial: {
                moveInReady: properties.filter(p => p.type === 'Industrial' && p.moveInReady),
                standard: properties.filter(p => p.type === 'Industrial' && !p.moveInReady)
            },
            stats: {
                totalProperties: properties.length,
                officeCount: properties.filter(p => p.type === 'Office').length,
                industrialCount: properties.filter(p => p.type === 'Industrial').length,
                subleaseCount: properties.filter(p => p.isSublease).length,
                specSuiteCount: properties.filter(p => p.isSpecSuite).length,
                moveInReadyCount: properties.filter(p => p.moveInReady).length,
                sources: [...new Set(properties.map(p => p.source))],
                scrapedAt: new Date().toISOString()
            }
        };
        
        await fs.writeFile(filename, JSON.stringify(organized, null, 2));
        console.log(`✅ Saved ${properties.length} properties to ${filename}`);
        
        // Also save CSV for easy viewing
        const csv = this.convertToCSV(properties);
        await fs.writeFile(filename.replace('.json', '.csv'), csv);
        
        return organized;
    }

    convertToCSV(properties) {
        const headers = [
            'Type', 'Source', 'Address', 'Building', 'Size', 
            'Asking Rent', 'Availability', 'Sublease', 'Spec Suite', 
            'Move-In Ready', 'URL'
        ];
        
        const rows = properties.map(p => [
            p.type,
            p.source,
            p.address,
            p.building || '',
            p.size,
            p.askingRent,
            p.availability,
            p.isSublease ? 'Yes' : 'No',
            p.isSpecSuite ? 'Yes' : 'No',
            p.moveInReady ? 'Yes' : 'No',
            p.listingUrl
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    async randomDelay() {
        const delay = Math.floor(Math.random() * 3000) + 2000; // 2-5 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    async close() {
        await this.browser.close();
    }

    async runFullScrape(city = 'chicago') {
        console.log(`🚀 Starting scrape for ${city} - Office & Industrial only`);
        
        await this.initialize();
        
        const allProperties = [];
        
        // Scrape JLL
        console.log('📊 Scraping JLL Office...');
        const jllOffice = await this.scrapeJLLOffice(city);
        allProperties.push(...jllOffice);
        
        console.log('🏭 Scraping JLL Industrial...');
        const jllIndustrial = await this.scrapeJLLIndustrial(city);
        allProperties.push(...jllIndustrial);
        
        // Scrape CBRE
        console.log('🏢 Scraping CBRE Office & Industrial...');
        const cbre = await this.scrapeCBRE(city);
        allProperties.push(...cbre);
        
        // Identify move-in ready properties
        console.log('🔍 Analyzing move-in readiness...');
        const analyzedProperties = await this.identifyMoveInReady(allProperties);
        
        // Save results
        await this.saveResults(analyzedProperties, `${city}-properties-${Date.now()}.json`);
        
        await this.close();
        
        console.log(`✅ Scraping complete! Found ${analyzedProperties.length} properties`);
        console.log(`   - Office: ${analyzedProperties.filter(p => p.type === 'Office').length}`);
        console.log(`   - Industrial: ${analyzedProperties.filter(p => p.type === 'Industrial').length}`);
        console.log(`   - Move-in Ready: ${analyzedProperties.filter(p => p.moveInReady).length}`);
        console.log(`   - Subleases: ${analyzedProperties.filter(p => p.isSublease).length}`);
        console.log(`   - Spec Suites: ${analyzedProperties.filter(p => p.isSpecSuite).length}`);
        
        return analyzedProperties;
    }
}

// Usage
async function main() {
    const scraper = new CommercialPropertyScraper();
    const properties = await scraper.runFullScrape('chicago');
    
    // Optional: Run for multiple cities
    // const cities = ['chicago', 'dallas', 'atlanta'];
    // for (const city of cities) {
    //     await scraper.runFullScrape(city);
    //     await scraper.randomDelay(); // Be nice to servers
    // }
}

// Export for use in other files
module.exports = CommercialPropertyScraper;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}