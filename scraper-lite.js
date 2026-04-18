// Lightweight Office & Industrial Scraper - No Puppeteer needed
// Uses fetch/axios for simpler implementation

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

class LightweightScraper {
    constructor() {
        this.results = [];
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
    }

    // Scrape LoopNet (easier to parse, no heavy JS)
    async scrapeLoopNet(city = 'Chicago', state = 'IL') {
        const properties = [];
        
        // Office spaces
        const officeUrl = `https://www.loopnet.com/for-lease/${city}-${state}/office/`;
        try {
            const response = await axios.get(officeUrl, { headers: this.headers });
            const $ = cheerio.load(response.data);
            
            $('.placard').each((i, elem) => {
                const $elem = $(elem);
                properties.push({
                    type: 'Office',
                    source: 'LoopNet',
                    address: $elem.find('.placard-address').text().trim(),
                    size: $elem.find('.placard-size').text().trim(),
                    price: $elem.find('.placard-price').text().trim(),
                    availability: $elem.find('.availability').text().trim(),
                    isSublease: $elem.text().toLowerCase().includes('sublease'),
                    isSpecSuite: $elem.text().toLowerCase().includes('spec'),
                    moveInReady: $elem.text().toLowerCase().includes('immediate') ||
                                $elem.text().toLowerCase().includes('move-in ready'),
                    url: 'https://www.loopnet.com' + $elem.find('a').attr('href'),
                    scrapedAt: new Date().toISOString()
                });
            });
        } catch (error) {
            console.error('Error scraping LoopNet office:', error.message);
        }

        // Industrial spaces
        const industrialUrl = `https://www.loopnet.com/for-lease/${city}-${state}/industrial/`;
        try {
            const response = await axios.get(industrialUrl, { headers: this.headers });
            const $ = cheerio.load(response.data);
            
            $('.placard').each((i, elem) => {
                const $elem = $(elem);
                properties.push({
                    type: 'Industrial',
                    source: 'LoopNet',
                    address: $elem.find('.placard-address').text().trim(),
                    size: $elem.find('.placard-size').text().trim(),
                    price: $elem.find('.placard-price').text().trim(),
                    ceilingHeight: $elem.find('.ceiling-height').text().trim(),
                    docks: $elem.find('.dock-doors').text().trim(),
                    isSublease: $elem.text().toLowerCase().includes('sublease'),
                    moveInReady: $elem.text().toLowerCase().includes('immediate') ||
                                $elem.text().toLowerCase().includes('vacant'),
                    url: 'https://www.loopnet.com' + $elem.find('a').attr('href'),
                    scrapedAt: new Date().toISOString()
                });
            });
        } catch (error) {
            console.error('Error scraping LoopNet industrial:', error.message);
        }

        return properties;
    }

    // Save to JSON and CSV
    async saveResults(properties) {
        const timestamp = Date.now();
        
        // Group by type and readiness
        const organized = {
            summary: {
                total: properties.length,
                office: properties.filter(p => p.type === 'Office').length,
                industrial: properties.filter(p => p.type === 'Industrial').length,
                moveInReady: properties.filter(p => p.moveInReady).length,
                subleases: properties.filter(p => p.isSublease).length,
                specSuites: properties.filter(p => p.isSpecSuite).length
            },
            office: {
                moveInReady: properties.filter(p => p.type === 'Office' && p.moveInReady),
                standard: properties.filter(p => p.type === 'Office' && !p.moveInReady)
            },
            industrial: {
                moveInReady: properties.filter(p => p.type === 'Industrial' && p.moveInReady),
                standard: properties.filter(p => p.type === 'Industrial' && !p.moveInReady)
            }
        };

        // Save JSON
        await fs.writeFile(
            `properties-${timestamp}.json`,
            JSON.stringify(organized, null, 2)
        );

        console.log(`\n📊 Scraping Results:`);
        console.log(`Total Properties: ${organized.summary.total}`);
        console.log(`Office: ${organized.summary.office}`);
        console.log(`Industrial: ${organized.summary.industrial}`);
        console.log(`Move-in Ready: ${organized.summary.moveInReady}`);
        console.log(`Subleases: ${organized.summary.subleases}`);
        console.log(`\n✅ Saved to properties-${timestamp}.json`);

        return organized;
    }
}

// Manual extraction guide for sites requiring login
const manualExtractionGuide = `
# Manual Data Extraction Guide for Premium Sites

## JLL (property.jll.com)
1. Go to property.jll.com
2. Filter: Property Type = Office OR Industrial
3. Filter: Availability = Immediate
4. Export results (if available) or copy table

## CBRE (cbre.com/properties)
1. Search for city
2. Filter: Office/Industrial only
3. Look for "Sublease" tag
4. Look for "Spec Suite" or "Built Out" tags

## Key Data Points to Capture:
- Address
- Building Name
- Size (sq ft)
- Asking Rent ($/sq ft)
- Available Date
- Is it a sublease? (Y/N)
- Is it spec/built-out? (Y/N)
- Ceiling Height (for industrial)
- Number of Dock Doors (for industrial)
- Broker Contact

## Move-In Ready Indicators:
✅ "Sublease" = Usually furnished/ready
✅ "Spec Suite" = Pre-built
✅ "Immediate Occupancy"
✅ "Plug & Play"
✅ "Turnkey"
✅ "Furnished"
✅ "Built Out"

## Price Negotiation Indicators:
🎯 On market > 90 days = Very negotiable
🎯 Sublease = 20-30% below market typical
🎯 Multiple similar listings = Tenant's market
🎯 "Negotiable" or "Flexible" in description
`;

// Quick run function
async function quickScrape() {
    console.log('🚀 Starting lightweight scraper...');
    const scraper = new LightweightScraper();
    
    try {
        const properties = await scraper.scrapeLoopNet('Chicago', 'IL');
        await scraper.saveResults(properties);
    } catch (error) {
        console.error('Scraping error:', error);
    }

    // Save the manual guide
    await fs.writeFile('manual-extraction-guide.md', manualExtractionGuide);
    console.log('\n📝 Manual extraction guide saved to manual-extraction-guide.md');
}

module.exports = { LightweightScraper, quickScrape };

// Run if called directly
if (require.main === module) {
    quickScrape();
}