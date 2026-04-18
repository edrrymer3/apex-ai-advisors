// Major Commercial Real Estate Brokerage Scraper
// Targets: JLL, CBRE, Colliers, Cushman & Wakefield public listings

const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

class CommercialBrokerageScraper {
    constructor() {
        this.results = {
            jll: [],
            cbre: [],
            colliers: [],
            cushman: [],
            summary: {}
        };
        this.dataDir = './brokerage-data';
    }

    async initialize() {
        await fs.mkdir(this.dataDir, { recursive: true });
        // Only use puppeteer when absolutely necessary
        this.browser = null;
    }

    // JLL - Uses their property search portal
    async scrapeJLL(city = 'Chicago', state = 'IL') {
        console.log('🏢 Scraping JLL Properties...');
        const properties = [];
        
        try {
            // JLL's public property search
            const urls = [
                `https://property.jll.com/rent/office-space/${city}-${state}`,
                `https://property.jll.com/rent/industrial-space/${city}-${state}`
            ];
            
            for (const url of urls) {
                const type = url.includes('office') ? 'Office' : 'Industrial';
                console.log(`  Fetching ${type} properties...`);
                
                try {
                    const response = await axios.get(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'text/html,application/xhtml+xml',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Referer': 'https://www.jll.com'
                        },
                        timeout: 10000
                    });
                    
                    const $ = cheerio.load(response.data);
                    
                    // Try multiple possible selectors
                    const selectors = [
                        '.property-card',
                        '.listing-card', 
                        '.search-result-item',
                        '[data-property]',
                        '.property-item'
                    ];
                    
                    let foundProperties = false;
                    for (const selector of selectors) {
                        if ($(selector).length > 0) {
                            $(selector).each((i, elem) => {
                                const $elem = $(elem);
                                
                                const priceText = $elem.find('.price, .rate, .rent').text().trim();
                                const isNegotiable = priceText.toLowerCase().includes('negotiable') || 
                                                   priceText.toLowerCase().includes('call');
                                
                                const property = {
                                    source: 'JLL',
                                    type: type,
                                    
                                    // Location
                                    address: $elem.find('.address, .location').text().trim(),
                                    city: city,
                                    state: state,
                                    
                                    // Property details
                                    building: $elem.find('.building-name, .property-name').text().trim(),
                                    size: $elem.find('.size, .sf, .square-feet').text().trim(),
                                    availableSpace: $elem.find('.available').text().trim(),
                                    
                                    // Pricing
                                    price: priceText,
                                    isNegotiable: isNegotiable,
                                    displayPrice: isNegotiable ? '💰 NEGOTIABLE' : priceText,
                                    
                                    // Agent info - JLL specific
                                    listingAgent: $elem.find('.broker-name, .agent-name').text().trim(),
                                    agentPhone: $elem.find('.phone, .contact-phone').text().trim(),
                                    agentEmail: $elem.find('.email').text().trim(),
                                    
                                    // Move-in indicators
                                    isSublease: $elem.text().toLowerCase().includes('sublease'),
                                    isSpecSuite: $elem.text().toLowerCase().includes('spec suite'),
                                    moveInReady: $elem.text().toLowerCase().includes('immediate') ||
                                               $elem.text().toLowerCase().includes('available now'),
                                    
                                    // Industrial specific
                                    ceilingHeight: type === 'Industrial' ? 
                                        this.extractPattern($elem.text(), /(\d+)['\s]*(clear|ceiling)/i) : null,
                                    dockDoors: type === 'Industrial' ? 
                                        this.extractPattern($elem.text(), /(\d+)\s*dock/i) : null,
                                    
                                    url: 'https://property.jll.com' + $elem.find('a').first().attr('href'),
                                    scrapedAt: new Date().toISOString()
                                };
                                
                                // Only add if we got meaningful data
                                if (property.address || property.building) {
                                    properties.push(property);
                                }
                            });
                            foundProperties = true;
                            break;
                        }
                    }
                    
                    if (!foundProperties) {
                        console.log(`  ⚠️ No properties found with standard selectors`);
                    }
                    
                } catch (error) {
                    console.log(`  ⚠️ Error fetching ${type}: ${error.message}`);
                }
            }
            
        } catch (error) {
            console.error('JLL scraping error:', error.message);
        }
        
        console.log(`  ✅ Found ${properties.length} JLL properties`);
        this.results.jll = properties;
        return properties;
    }

    // CBRE - Their public listings
    async scrapeCBRE(city = 'Chicago', state = 'IL') {
        console.log('🏢 Scraping CBRE Properties...');
        const properties = [];
        
        try {
            // CBRE's public search URLs
            const searchUrls = [
                `https://www.cbre.com/properties/properties-for-lease`,
                `https://www.cbre.us/properties/properties-for-lease/${city.toLowerCase()}`,
                `https://www.cbre.com/search?q=${city}+office+for+lease`,
                `https://www.cbre.com/search?q=${city}+industrial+for+lease`
            ];
            
            for (const url of searchUrls) {
                try {
                    console.log(`  Trying ${url.substring(0, 50)}...`);
                    const response = await axios.get(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                            'Accept': '*/*'
                        },
                        timeout: 10000
                    });
                    
                    const $ = cheerio.load(response.data);
                    
                    // CBRE selectors
                    $('.property-listing, .listing-item, .property-card').each((i, elem) => {
                        const $elem = $(elem);
                        
                        const priceText = $elem.find('.price, .asking-rate').text().trim();
                        const isNegotiable = priceText.toLowerCase().includes('negotiable');
                        
                        properties.push({
                            source: 'CBRE',
                            type: $elem.text().toLowerCase().includes('industrial') ? 'Industrial' : 'Office',
                            
                            address: $elem.find('.address').text().trim(),
                            building: $elem.find('.property-title').text().trim(),
                            size: $elem.find('.size').text().trim(),
                            
                            price: priceText,
                            isNegotiable: isNegotiable,
                            displayPrice: isNegotiable ? '💰 NEGOTIABLE' : priceText,
                            
                            // CBRE usually shows team not individual
                            listingTeam: $elem.find('.team-name').text().trim() || 'CBRE Team',
                            contactPhone: $elem.find('.contact').text().trim(),
                            
                            isSublease: $elem.find('.sublease-badge').length > 0,
                            moveInReady: $elem.text().toLowerCase().includes('immediate'),
                            
                            url: 'https://www.cbre.com' + $elem.find('a').attr('href'),
                            scrapedAt: new Date().toISOString()
                        });
                    });
                    
                    if (properties.length > 0) break; // Found properties, stop trying URLs
                    
                } catch (error) {
                    console.log(`  ⚠️ Could not fetch from this URL`);
                }
            }
            
        } catch (error) {
            console.error('CBRE scraping error:', error.message);
        }
        
        console.log(`  ✅ Found ${properties.length} CBRE properties`);
        this.results.cbre = properties;
        return properties;
    }

    // Colliers
    async scrapeColliers(city = 'Chicago') {
        console.log('🏢 Scraping Colliers Properties...');
        const properties = [];
        
        try {
            // Colliers has different URL patterns by region
            const urls = [
                `https://www.colliers.com/en/properties/${city.toLowerCase()}`,
                `https://www2.colliers.com/en-US/Properties/${city}`,
                `https://www.colliers.com/en-us/cities/${city.toLowerCase()}/properties`
            ];
            
            for (const url of urls) {
                try {
                    const response = await axios.get(url, {
                        headers: { 'User-Agent': 'Mozilla/5.0' },
                        timeout: 10000
                    });
                    
                    const $ = cheerio.load(response.data);
                    
                    $('.property-tile, .listing-card, .property-item').each((i, elem) => {
                        const $elem = $(elem);
                        
                        const priceText = $elem.find('.price').text().trim();
                        const isNegotiable = priceText === '' || 
                                           priceText.toLowerCase().includes('call') ||
                                           priceText.toLowerCase().includes('negotiable');
                        
                        properties.push({
                            source: 'Colliers',
                            type: this.determinePropertyType($elem.text()),
                            
                            address: $elem.find('.address').text().trim(),
                            market: $elem.find('.market').text().trim(),
                            size: $elem.find('.size').text().trim(),
                            
                            price: priceText || 'Call for Pricing',
                            isNegotiable: isNegotiable,
                            displayPrice: isNegotiable ? '💰 NEGOTIABLE' : priceText,
                            
                            broker: $elem.find('.broker').text().trim() || 'Colliers Team',
                            
                            isSublease: $elem.hasClass('sublease') || 
                                       $elem.text().toLowerCase().includes('sublease'),
                            
                            url: url,
                            scrapedAt: new Date().toISOString()
                        });
                    });
                    
                    if (properties.length > 0) break;
                    
                } catch (error) {
                    // Try next URL
                }
            }
            
        } catch (error) {
            console.error('Colliers scraping error:', error.message);
        }
        
        console.log(`  ✅ Found ${properties.length} Colliers properties`);
        this.results.colliers = properties;
        return properties;
    }

    // Cushman & Wakefield
    async scrapeCushman(city = 'Chicago') {
        console.log('🏢 Scraping Cushman & Wakefield Properties...');
        const properties = [];
        
        try {
            const urls = [
                `https://www.cushmanwakefield.com/en/united-states/properties`,
                `https://www.cushwake.com/en/us/properties-for-lease/${city.toLowerCase()}`
            ];
            
            for (const url of urls) {
                try {
                    const response = await axios.get(url, {
                        headers: { 'User-Agent': 'Mozilla/5.0' },
                        timeout: 10000
                    });
                    
                    const $ = cheerio.load(response.data);
                    
                    $('[class*="property"], [class*="listing"]').each((i, elem) => {
                        const $elem = $(elem);
                        const text = $elem.text();
                        
                        // Basic extraction for Cushman
                        if (text && (text.includes('sq') || text.includes('SF'))) {
                            properties.push({
                                source: 'Cushman & Wakefield',
                                type: this.determinePropertyType(text),
                                rawText: text.substring(0, 500), // First 500 chars
                                isNegotiable: text.toLowerCase().includes('negotiable'),
                                isSublease: text.toLowerCase().includes('sublease'),
                                url: url,
                                scrapedAt: new Date().toISOString()
                            });
                        }
                    });
                    
                } catch (error) {
                    // Try next URL
                }
            }
            
        } catch (error) {
            console.error('Cushman scraping error:', error.message);
        }
        
        console.log(`  ✅ Found ${properties.length} Cushman properties`);
        this.results.cushman = properties;
        return properties;
    }

    // Try with Puppeteer as fallback (for JavaScript-heavy sites)
    async scrapeWithPuppeteer(url, source) {
        if (!this.browser) {
            this.browser = await puppeteer.launch({ 
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
        
        const page = await this.browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            await page.waitForTimeout(2000); // Let JavaScript load
            
            // Get page content after JavaScript execution
            const content = await page.content();
            const $ = cheerio.load(content);
            
            // Try to extract any property data
            const properties = [];
            const text = $('body').text();
            
            // Look for office/industrial mentions with sizes
            const matches = text.match(/\d{1,3},?\d{3}\s*(sq|sf|square)/gi);
            if (matches) {
                console.log(`  Found ${matches.length} potential properties in ${source}`);
            }
            
            await page.close();
            return properties;
            
        } catch (error) {
            console.error(`Puppeteer error for ${source}:`, error.message);
            await page.close();
            return [];
        }
    }

    // Helper functions
    determinePropertyType(text) {
        const lower = text.toLowerCase();
        if (lower.includes('industrial') || lower.includes('warehouse') || 
            lower.includes('distribution') || lower.includes('flex')) {
            return 'Industrial';
        }
        return 'Office';
    }

    extractPattern(text, pattern) {
        const match = text.match(pattern);
        return match ? match[1] : null;
    }

    parsePrice(priceText) {
        if (!priceText) return { isNegotiable: true, display: '💰 Call for Pricing' };
        
        const lower = priceText.toLowerCase();
        if (lower.includes('negotiable') || lower.includes('call')) {
            return { isNegotiable: true, display: '💰 NEGOTIABLE' };
        }
        
        return { isNegotiable: false, display: priceText };
    }

    // Generate summary report
    async generateReport() {
        const allProperties = [
            ...this.results.jll,
            ...this.results.cbre,
            ...this.results.colliers,
            ...this.results.cushman
        ];
        
        // Filter for high-value properties
        const negotiable = allProperties.filter(p => p.isNegotiable);
        const subleases = allProperties.filter(p => p.isSublease);
        const moveInReady = allProperties.filter(p => p.moveInReady);
        const office = allProperties.filter(p => p.type === 'Office');
        const industrial = allProperties.filter(p => p.type === 'Industrial');
        
        this.results.summary = {
            totalFound: allProperties.length,
            bySource: {
                JLL: this.results.jll.length,
                CBRE: this.results.cbre.length,
                Colliers: this.results.colliers.length,
                'Cushman & Wakefield': this.results.cushman.length
            },
            byType: {
                Office: office.length,
                Industrial: industrial.length
            },
            opportunities: {
                negotiable: negotiable.length,
                subleases: subleases.length,
                moveInReady: moveInReady.length
            },
            timestamp: new Date().toISOString()
        };
        
        // Save to file
        const timestamp = Date.now();
        const filename = `${this.dataDir}/brokerage-properties-${timestamp}.json`;
        await fs.writeFile(filename, JSON.stringify(this.results, null, 2));
        
        // Create alerts for high-priority properties
        if (negotiable.length > 0) {
            console.log('\n🔥 HIGH PRIORITY - NEGOTIABLE PROPERTIES:');
            negotiable.slice(0, 5).forEach(p => {
                console.log(`  📍 ${p.address || p.building || 'Property'} - ${p.source}`);
                if (p.listingAgent) console.log(`     Agent: ${p.listingAgent}`);
                if (p.size) console.log(`     Size: ${p.size}`);
            });
        }
        
        console.log(`\n💾 Full report saved to: ${filename}`);
        return this.results;
    }

    // Close browser if open
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Main execution
async function scrapeMajorBrokerages(city = 'Chicago', state = 'IL') {
    const scraper = new CommercialBrokerageScraper();
    
    console.log('🚀 Starting Major Brokerage Scraper');
    console.log(`📍 Location: ${city}, ${state}`);
    console.log('🎯 Focus: Office & Industrial Properties\n');
    
    await scraper.initialize();
    
    // Run all scrapers
    await scraper.scrapeJLL(city, state);
    await scraper.scrapeCBRE(city, state);
    await scraper.scrapeColliers(city);
    await scraper.scrapeCushman(city);
    
    // Generate report
    const report = await scraper.generateReport();
    
    // Print final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Properties Found: ${report.summary.totalFound}`);
    console.log('\nBy Source:');
    Object.entries(report.summary.bySource).forEach(([source, count]) => {
        console.log(`  ${source}: ${count}`);
    });
    console.log('\nBy Type:');
    console.log(`  Office: ${report.summary.byType.Office}`);
    console.log(`  Industrial: ${report.summary.byType.Industrial}`);
    console.log('\n🎯 High-Value Opportunities:');
    console.log(`  Negotiable: ${report.summary.opportunities.negotiable} properties`);
    console.log(`  Subleases: ${report.summary.opportunities.subleases} properties`);
    console.log(`  Move-in Ready: ${report.summary.opportunities.moveInReady} properties`);
    
    await scraper.cleanup();
    
    return report;
}

module.exports = { CommercialBrokerageScraper, scrapeMajorBrokerages };

// Run if called directly
if (require.main === module) {
    scrapeMajorBrokerages()
        .then(() => console.log('\n✅ Scraping complete!'))
        .catch(console.error);
}