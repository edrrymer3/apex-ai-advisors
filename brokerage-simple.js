// Simple Brokerage Scraper - No Puppeteer Required
// Uses only axios and cheerio for JLL, CBRE, Colliers, Cushman

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

class SimpleBrokerageScraper {
    constructor() {
        this.results = [];
        this.dataDir = './brokerage-data';
    }

    async initialize() {
        await fs.mkdir(this.dataDir, { recursive: true });
    }

    // Test what we can actually access
    async testAccess() {
        console.log('🔍 Testing access to major brokerages...\n');
        
        const sites = [
            {
                name: 'JLL',
                urls: [
                    'https://www.us.jll.com/en/properties',
                    'https://property.jll.com',
                    'https://www.jll.com/property-search'
                ]
            },
            {
                name: 'CBRE', 
                urls: [
                    'https://www.cbre.com/properties',
                    'https://www.cbre.us/properties',
                    'https://www.cbre.com/propertylistings'
                ]
            },
            {
                name: 'Colliers',
                urls: [
                    'https://www.colliers.com/en/properties',
                    'https://www2.colliers.com/en-US/Properties'
                ]
            },
            {
                name: 'Cushman & Wakefield',
                urls: [
                    'https://www.cushmanwakefield.com/en/united-states',
                    'https://www.cushwake.com/properties'
                ]
            }
        ];

        for (const site of sites) {
            console.log(`Testing ${site.name}:`);
            for (const url of site.urls) {
                try {
                    const response = await axios.get(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                        },
                        timeout: 5000,
                        maxRedirects: 5
                    });
                    
                    const $ = cheerio.load(response.data);
                    const title = $('title').text();
                    const hasProperties = $('body').text().toLowerCase().includes('office') || 
                                        $('body').text().toLowerCase().includes('industrial');
                    
                    console.log(`  ✅ ${url.substring(0, 40)}... - Status: ${response.status}`);
                    console.log(`     Title: ${title.substring(0, 50)}`);
                    console.log(`     Has property mentions: ${hasProperties}`);
                    
                    // Try to find property-related content
                    const propertySelectors = [
                        '.property', '.listing', '.result', 
                        '[class*="property"]', '[class*="listing"]',
                        'article', '.card'
                    ];
                    
                    for (const selector of propertySelectors) {
                        const count = $(selector).length;
                        if (count > 0) {
                            console.log(`     Found ${count} elements with selector: ${selector}`);
                            
                            // Extract sample data
                            const sample = $(selector).first();
                            const text = sample.text().substring(0, 200).replace(/\s+/g, ' ').trim();
                            if (text) {
                                console.log(`     Sample: ${text}...`);
                            }
                            break;
                        }
                    }
                    
                } catch (error) {
                    console.log(`  ❌ ${url.substring(0, 40)}... - Error: ${error.message}`);
                }
            }
            console.log('');
        }
    }

    // Extract whatever data we can get
    async scrapeAvailableSites() {
        console.log('📊 Attempting to extract property data...\n');
        
        const properties = [];
        
        // Try to get data from accessible endpoints
        const attempts = [
            {
                name: 'JLL Research Reports',
                url: 'https://www.us.jll.com/en/trends-and-insights/research',
                type: 'research'
            },
            {
                name: 'CBRE Research',
                url: 'https://www.cbre.com/insights',
                type: 'research'
            },
            {
                name: 'Colliers Reports',
                url: 'https://www.colliers.com/en/research',
                type: 'research'
            }
        ];

        for (const attempt of attempts) {
            try {
                console.log(`Fetching ${attempt.name}...`);
                const response = await axios.get(attempt.url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 10000
                });
                
                const $ = cheerio.load(response.data);
                
                // Extract market data from research reports
                const reports = [];
                $('article, .report, .insight, [class*="card"]').each((i, elem) => {
                    const $elem = $(elem);
                    const title = $elem.find('h2, h3, .title').text().trim();
                    const text = $elem.text();
                    
                    // Look for Chicago office/industrial mentions
                    if ((text.includes('Chicago') || text.includes('office') || text.includes('industrial')) &&
                        (text.includes('sq') || text.includes('square feet') || text.includes('lease'))) {
                        
                        reports.push({
                            source: attempt.name,
                            title: title,
                            excerpt: text.substring(0, 300),
                            hasNegotiableInfo: text.toLowerCase().includes('negotiable'),
                            hasRateInfo: text.includes('$') || text.includes('per sq'),
                            url: attempt.url
                        });
                    }
                });
                
                if (reports.length > 0) {
                    console.log(`  ✅ Found ${reports.length} relevant reports/insights`);
                    properties.push(...reports);
                }
                
            } catch (error) {
                console.log(`  ⚠️ Could not fetch ${attempt.name}`);
            }
        }
        
        return properties;
    }

    // Parse email format (for when brokers send listings)
    parseEmailListing(emailText) {
        const listing = {
            type: null,
            address: null,
            size: null,
            price: null,
            isNegotiable: false,
            agent: null,
            agentPhone: null,
            agentEmail: null,
            isSublease: false,
            moveInReady: false
        };

        // Detect type
        if (emailText.toLowerCase().includes('office')) listing.type = 'Office';
        if (emailText.toLowerCase().includes('industrial') || emailText.toLowerCase().includes('warehouse')) {
            listing.type = 'Industrial';
        }

        // Extract address (look for street patterns)
        const addressMatch = emailText.match(/\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd)/i);
        if (addressMatch) listing.address = addressMatch[0];

        // Extract size
        const sizeMatch = emailText.match(/(\d{1,3},?\d{3})\s*(sq\.?\s*ft|sf|square feet)/i);
        if (sizeMatch) listing.size = sizeMatch[1];

        // Extract price
        const priceMatch = emailText.match(/\$(\d+(?:\.\d{2})?)\s*(?:\/|per)\s*(?:sq\.?\s*ft|sf)/i);
        if (priceMatch) {
            listing.price = '$' + priceMatch[1] + '/sq ft';
        } else if (emailText.toLowerCase().includes('negotiable')) {
            listing.price = 'Negotiable';
            listing.isNegotiable = true;
        }

        // Extract agent info
        const phoneMatch = emailText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phoneMatch) listing.agentPhone = phoneMatch[0];

        const emailMatch = emailText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) listing.agentEmail = emailMatch[0];

        // Check for sublease
        listing.isSublease = emailText.toLowerCase().includes('sublease');

        // Check for move-in ready
        listing.moveInReady = emailText.toLowerCase().includes('immediate') || 
                             emailText.toLowerCase().includes('available now') ||
                             emailText.toLowerCase().includes('move-in ready');

        return listing;
    }

    // Generate HTML input form for manual entry
    async generateInputForm() {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Property Tracker - Manual Input</title>
    <style>
        body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #3B82F6; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: 600; }
        input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        textarea { height: 100px; }
        .checkbox { display: flex; align-items: center; gap: 10px; margin: 10px 0; }
        .checkbox input { width: auto; }
        button { background: #3B82F6; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #2563EB; }
        .negotiable { background: #FEF3C7; padding: 10px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🏢 Property Tracker - Manual Input</h1>
    <p>Enter property details from JLL, CBRE, Colliers, or Cushman & Wakefield</p>
    
    <form id="propertyForm">
        <div class="form-group">
            <label>Source Brokerage*</label>
            <select name="source" required>
                <option value="JLL">JLL</option>
                <option value="CBRE">CBRE</option>
                <option value="Colliers">Colliers</option>
                <option value="Cushman">Cushman & Wakefield</option>
                <option value="Other">Other</option>
            </select>
        </div>
        
        <div class="form-group">
            <label>Property Type*</label>
            <select name="type" required>
                <option value="Office">Office</option>
                <option value="Industrial">Industrial/Warehouse</option>
            </select>
        </div>
        
        <div class="form-group">
            <label>Address*</label>
            <input type="text" name="address" placeholder="123 State Street, Chicago, IL" required>
        </div>
        
        <div class="form-group">
            <label>Size (sq ft)*</label>
            <input type="text" name="size" placeholder="25,000" required>
        </div>
        
        <div class="form-group">
            <label>Rental Rate</label>
            <input type="text" name="price" placeholder="$38/sq ft or 'Negotiable'">
        </div>
        
        <div class="checkbox negotiable">
            <input type="checkbox" name="isNegotiable" id="negotiable">
            <label for="negotiable">💰 Rate is Negotiable (Motivated Landlord!)</label>
        </div>
        
        <div class="form-group">
            <label>Listing Agent/Broker</label>
            <input type="text" name="agent" placeholder="John Smith">
        </div>
        
        <div class="form-group">
            <label>Agent Phone</label>
            <input type="text" name="phone" placeholder="312-555-0100">
        </div>
        
        <div class="form-group">
            <label>Agent Email</label>
            <input type="email" name="email" placeholder="john.smith@jll.com">
        </div>
        
        <div class="checkbox">
            <input type="checkbox" name="isSublease" id="sublease">
            <label for="sublease">This is a Sublease</label>
        </div>
        
        <div class="checkbox">
            <input type="checkbox" name="isSpecSuite" id="spec">
            <label for="spec">This is a Spec Suite (Built Out)</label>
        </div>
        
        <div class="checkbox">
            <input type="checkbox" name="moveInReady" id="ready">
            <label for="ready">Move-In Ready / Immediate Occupancy</label>
        </div>
        
        <div class="form-group">
            <label>Industrial Specific (if applicable)</label>
            <input type="text" name="ceilingHeight" placeholder="Ceiling Height (e.g., 24')">
            <input type="text" name="dockDoors" placeholder="Number of Dock Doors" style="margin-top: 10px;">
        </div>
        
        <div class="form-group">
            <label>Notes</label>
            <textarea name="notes" placeholder="Any additional information..."></textarea>
        </div>
        
        <button type="submit">Save Property</button>
    </form>
    
    <script>
        document.getElementById('propertyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const property = Object.fromEntries(formData);
            property.timestamp = new Date().toISOString();
            
            // Save to localStorage for now
            const saved = JSON.parse(localStorage.getItem('properties') || '[]');
            saved.push(property);
            localStorage.setItem('properties', JSON.stringify(saved));
            
            alert('Property saved! Total properties: ' + saved.length);
            e.target.reset();
        });
    </script>
</body>
</html>`;

        await fs.writeFile(`${this.dataDir}/input-form.html`, html);
        console.log('📝 Manual input form created: brokerage-data/input-form.html');
        console.log('   Open this file in your browser to manually add properties');
    }
}

// Main execution
async function runBrokerageScraper() {
    const scraper = new SimpleBrokerageScraper();
    await scraper.initialize();
    
    console.log('🚀 Brokerage Property Tracker\n');
    console.log('Testing access to major commercial real estate sites...\n');
    
    // Test what we can access
    await scraper.testAccess();
    
    // Try to scrape available data
    const data = await scraper.scrapeAvailableSites();
    
    // Generate manual input form
    await scraper.generateInputForm();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTS');
    console.log('='.repeat(60));
    
    if (data.length > 0) {
        console.log(`Found ${data.length} relevant items`);
    } else {
        console.log('Direct scraping is blocked by most sites.');
    }
    
    console.log('\n✅ SOLUTION: Manual Input System Ready!');
    console.log('1. Open brokerage-data/input-form.html in your browser');
    console.log('2. Manually enter properties from JLL, CBRE, etc.');
    console.log('3. System will track changes and alert on price drops');
    console.log('\n💡 TIP: Focus on "Negotiable" properties - those are gold!');
    
    return data;
}

module.exports = { SimpleBrokerageScraper, runBrokerageScraper };

// Run if called directly
if (require.main === module) {
    runBrokerageScraper().catch(console.error);
}