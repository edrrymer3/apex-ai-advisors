// Crexi.com Property Tracker - Office & Industrial Focus
// Better alternative to LoopNet - more modern, less blocking

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class CrexiTracker {
    constructor() {
        this.baseUrl = 'https://www.crexi.com';
        this.dataDir = './crexi-data';
        this.properties = {};
    }

    async initialize() {
        await fs.mkdir(this.dataDir, { recursive: true });
    }

    // Crexi has a more modern structure
    async searchCrexi(city = 'Chicago', state = 'IL', propertyType = 'office') {
        const searchUrl = `${this.baseUrl}/properties/search?location=${city},${state}&property_type=${propertyType}`;
        console.log(`🔍 Searching Crexi for ${propertyType} in ${city}, ${state}`);
        
        try {
            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            });
            
            const $ = cheerio.load(response.data);
            const properties = [];
            
            // Crexi uses React, so we might need to parse JSON from script tags
            $('script').each((i, elem) => {
                const content = $(elem).html();
                if (content && content.includes('window.__INITIAL_STATE__')) {
                    // Extract the JSON data
                    const jsonMatch = content.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
                    if (jsonMatch) {
                        try {
                            const data = JSON.parse(jsonMatch[1]);
                            // Parse properties from the state
                            if (data.search && data.search.results) {
                                data.search.results.forEach(listing => {
                                    properties.push(this.parseCrexiProperty(listing, propertyType));
                                });
                            }
                        } catch (e) {
                            console.log('Could not parse Crexi state data');
                        }
                    }
                }
            });
            
            // Fallback to HTML parsing if JSON didn't work
            if (properties.length === 0) {
                $('.property-card').each((i, elem) => {
                    const $elem = $(elem);
                    properties.push({
                        type: propertyType === 'office' ? 'Office' : 'Industrial',
                        source: 'Crexi',
                        address: $elem.find('.property-address').text().trim(),
                        city: city,
                        size: $elem.find('.property-size').text().trim(),
                        price: $elem.find('.property-price').text().trim(),
                        broker: $elem.find('.broker-name').text().trim(),
                        company: $elem.find('.broker-company').text().trim(),
                        isNegotiable: $elem.text().toLowerCase().includes('negotiable'),
                        url: this.baseUrl + $elem.find('a').attr('href')
                    });
                });
            }
            
            return properties;
            
        } catch (error) {
            console.error(`Error fetching Crexi ${propertyType}:`, error.message);
            return [];
        }
    }

    parseCrexiProperty(listing, type) {
        return {
            id: listing.id || `crexi-${Date.now()}`,
            type: type === 'office' ? 'Office' : 'Industrial',
            source: 'Crexi',
            address: listing.address || '',
            city: listing.city || '',
            state: listing.state || '',
            size: listing.size || listing.square_feet || '',
            price: listing.price || listing.asking_price || '',
            displayPrice: this.formatPrice(listing.price),
            isNegotiable: (listing.price_text || '').toLowerCase().includes('negotiable'),
            
            // Broker info
            listingAgent: listing.broker_name || listing.agent_name || '',
            listingCompany: listing.broker_company || listing.brokerage || '',
            agentPhone: listing.broker_phone || listing.contact_phone || '',
            agentEmail: listing.broker_email || listing.contact_email || '',
            
            // Property details
            propertySubtype: listing.property_subtype || '',
            availableDate: listing.available_date || '',
            leaseTerm: listing.lease_term || '',
            
            // Industrial specific
            ceilingHeight: listing.ceiling_height || '',
            dockDoors: listing.loading_docks || '',
            
            // Indicators
            isSublease: (listing.description || '').toLowerCase().includes('sublease'),
            isSpecSuite: (listing.description || '').toLowerCase().includes('spec'),
            moveInReady: (listing.availability || '').toLowerCase().includes('immediate'),
            
            listingUrl: listing.url || `${this.baseUrl}/property/${listing.id}`,
            images: listing.images || [],
            scrapedAt: new Date().toISOString()
        };
    }

    formatPrice(price) {
        if (!price) return 'Call for Pricing';
        if (typeof price === 'string' && price.toLowerCase().includes('negotiable')) {
            return '💰 Negotiable';
        }
        if (typeof price === 'number') {
            return `$${price.toLocaleString()}/sq ft`;
        }
        return price.toString();
    }
}

// Alternative: 42Floors Tracker
class FortyTwoFloorsTracker {
    constructor() {
        this.baseUrl = 'https://42floors.com';
        this.properties = [];
    }

    async searchOfficeSpace(city = 'chicago') {
        const url = `${this.baseUrl}/${city}/office-space`;
        console.log(`🏢 Searching 42Floors for office in ${city}`);
        
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            });
            
            const $ = cheerio.load(response.data);
            const properties = [];
            
            $('.listing-card').each((i, elem) => {
                const $elem = $(elem);
                
                const rateText = $elem.find('.price').text().trim();
                const isNegotiable = rateText.toLowerCase().includes('negotiable') || 
                                   rateText.toLowerCase().includes('call');
                
                properties.push({
                    type: 'Office',
                    source: '42Floors',
                    building: $elem.find('.building-name').text().trim(),
                    address: $elem.find('.address').text().trim(),
                    neighborhood: $elem.find('.neighborhood').text().trim(),
                    size: $elem.find('.size').text().trim(),
                    price: rateText,
                    isNegotiable: isNegotiable,
                    displayPrice: isNegotiable ? '💰 Negotiable' : rateText,
                    
                    // 42Floors specific
                    floor: $elem.find('.floor').text().trim(),
                    available: $elem.find('.availability').text().trim(),
                    
                    // Broker info (if available)
                    broker: $elem.find('.broker-name').text().trim(),
                    brokerCompany: $elem.find('.broker-firm').text().trim(),
                    
                    // Quick move-in indicators
                    isSublease: $elem.find('.sublease-tag').length > 0,
                    isBuiltOut: $elem.text().toLowerCase().includes('built out'),
                    moveInReady: $elem.find('.immediate-tag').length > 0,
                    
                    url: this.baseUrl + $elem.find('a').attr('href'),
                    image: $elem.find('img').attr('src'),
                    scrapedAt: new Date().toISOString()
                });
            });
            
            return properties;
            
        } catch (error) {
            console.error('Error fetching 42Floors:', error.message);
            return [];
        }
    }
}

// Alternative: Direct Broker Site Scraper
class BrokerSiteScraper {
    constructor() {
        this.brokerSites = [
            { name: 'Transwestern', url: 'https://www.transwestern.com/properties' },
            { name: 'NAI', url: 'https://www.naichicago.com/properties' },
            { name: 'Lee & Associates', url: 'https://www.lee-associates.com/properties' },
            { name: 'Newmark', url: 'https://www.nmrk.com/properties' }
        ];
    }

    async scrapeAllBrokers() {
        const allProperties = [];
        
        for (const broker of this.brokerSites) {
            console.log(`🏢 Checking ${broker.name}...`);
            try {
                const properties = await this.scrapeBrokerSite(broker);
                allProperties.push(...properties);
            } catch (error) {
                console.log(`  ⚠️ Could not scrape ${broker.name}: ${error.message}`);
            }
        }
        
        return allProperties;
    }

    async scrapeBrokerSite(broker) {
        // Generic broker site scraper
        // Each site would need custom parsing
        const response = await axios.get(broker.url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        const properties = [];
        
        // Generic selectors that might work
        $('[class*="property"], [class*="listing"]').each((i, elem) => {
            const $elem = $(elem);
            properties.push({
                source: broker.name,
                text: $elem.text(), // Raw text for now
                url: broker.url
            });
        });
        
        return properties;
    }
}

// Main unified tracker
async function trackAllSources(city = 'Chicago', state = 'IL') {
    console.log('🚀 Starting Multi-Source Property Tracker\n');
    
    const results = {
        crexi: { office: [], industrial: [] },
        fortyTwoFloors: [],
        brokers: [],
        summary: {
            total: 0,
            negotiable: 0,
            moveInReady: 0,
            timestamp: new Date().toISOString()
        }
    };
    
    // Try Crexi
    const crexi = new CrexiTracker();
    await crexi.initialize();
    results.crexi.office = await crexi.searchCrexi(city, state, 'office');
    results.crexi.industrial = await crexi.searchCrexi(city, state, 'industrial');
    
    // Try 42Floors
    const fortyTwo = new FortyTwoFloorsTracker();
    results.fortyTwoFloors = await fortyTwo.searchOfficeSpace(city.toLowerCase());
    
    // Try direct broker sites
    const brokers = new BrokerSiteScraper();
    results.brokers = await brokers.scrapeAllBrokers();
    
    // Calculate summary
    const allProperties = [
        ...results.crexi.office,
        ...results.crexi.industrial,
        ...results.fortyTwoFloors
    ];
    
    results.summary.total = allProperties.length;
    results.summary.negotiable = allProperties.filter(p => p.isNegotiable).length;
    results.summary.moveInReady = allProperties.filter(p => p.moveInReady).length;
    
    // Save results
    const timestamp = Date.now();
    await fs.mkdir('./property-data', { recursive: true });
    await fs.writeFile(
        `./property-data/multi-source-${timestamp}.json`,
        JSON.stringify(results, null, 2)
    );
    
    // Print summary
    console.log('\n📊 TRACKING COMPLETE');
    console.log('=' .repeat(50));
    console.log(`Total Properties Found: ${results.summary.total}`);
    console.log(`  Crexi: ${results.crexi.office.length + results.crexi.industrial.length}`);
    console.log(`  42Floors: ${results.fortyTwoFloors.length}`);
    console.log(`  Direct Brokers: ${results.brokers.length}`);
    console.log(`\nNegotiable Properties: ${results.summary.negotiable} 💰`);
    console.log(`Move-In Ready: ${results.summary.moveInReady} ⚡`);
    
    if (results.summary.negotiable > 0) {
        console.log('\n💰 NEGOTIABLE PROPERTIES (High Priority!):');
        allProperties
            .filter(p => p.isNegotiable)
            .slice(0, 3)
            .forEach(p => {
                console.log(`  ${p.address || p.building} - ${p.source}`);
                if (p.listingAgent) console.log(`    Agent: ${p.listingAgent}`);
            });
    }
    
    return results;
}

module.exports = { CrexiTracker, FortyTwoFloorsTracker, BrokerSiteScraper, trackAllSources };

// Run if called directly
if (require.main === module) {
    trackAllSources().catch(console.error);
}