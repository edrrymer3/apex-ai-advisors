// Property Tracker with Price Monitoring & Agent Info
// Focused on Office & Industrial - Tracks changes and agents

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class PropertyTracker {
    constructor() {
        this.dataDir = './property-data';
        this.previousData = {};
        this.currentData = {};
        this.changes = {
            newListings: [],
            priceDrops: [],
            priceIncreases: [],
            removed: []
        };
    }

    async initialize() {
        // Create data directory if it doesn't exist
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            await this.loadPreviousData();
        } catch (error) {
            console.log('First run - no previous data');
        }
    }

    async loadPreviousData() {
        try {
            const files = await fs.readdir(this.dataDir);
            const latestFile = files
                .filter(f => f.startsWith('properties-'))
                .sort()
                .pop();
            
            if (latestFile) {
                const data = await fs.readFile(path.join(this.dataDir, latestFile), 'utf8');
                this.previousData = JSON.parse(data);
                console.log(`📂 Loaded previous data from ${latestFile}`);
            }
        } catch (error) {
            console.log('No previous data found');
        }
    }

    // Parse rental rate - handles "Negotiable", ranges, and per sq ft
    parseRentalRate(rateString) {
        if (!rateString) return { rate: null, isNegotiable: false, displayRate: 'Not Listed' };
        
        const cleaned = rateString.toLowerCase().trim();
        
        // Check for negotiable
        if (cleaned.includes('negotiable') || cleaned.includes('call')) {
            return {
                rate: null,
                isNegotiable: true,
                displayRate: 'Negotiable',
                rawText: rateString
            };
        }
        
        // Extract numeric rate
        const rateMatch = cleaned.match(/\$?([\d,]+\.?\d*)/);
        if (rateMatch) {
            const rate = parseFloat(rateMatch[1].replace(',', ''));
            return {
                rate: rate,
                isNegotiable: cleaned.includes('nego'),
                displayRate: rateString,
                rawText: rateString
            };
        }
        
        return { rate: null, isNegotiable: false, displayRate: rateString };
    }

    // Enhanced LoopNet scraper with agent info
    async scrapeLoopNet(city = 'Chicago', state = 'IL') {
        const properties = {};
        const timestamp = new Date().toISOString();
        
        console.log(`\n🔍 Scraping ${city}, ${state} - Office & Industrial`);
        
        // Office properties
        try {
            console.log('📊 Fetching Office listings...');
            const officeUrl = `https://www.loopnet.com/for-lease/${city.toLowerCase()}-${state}/office/`;
            const response = await axios.get(officeUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            
            const $ = cheerio.load(response.data);
            
            $('.placard-pseudo').each((i, elem) => {
                const $elem = $(elem);
                const propertyId = $elem.attr('data-id') || `office-${i}`;
                
                const rateInfo = this.parseRentalRate($elem.find('.placard-price').text());
                
                const property = {
                    id: propertyId,
                    type: 'Office',
                    address: $elem.find('.placard-address-main').text().trim(),
                    city: $elem.find('.placard-address-city').text().trim() || city,
                    size: $elem.find('.placard-info-value').first().text().trim(),
                    rentalRate: rateInfo.rate,
                    displayRate: rateInfo.displayRate,
                    isNegotiable: rateInfo.isNegotiable,
                    
                    // Agent/Broker Information
                    listingCompany: $elem.find('.contact-name').first().text().trim() || 
                                   $elem.find('.broker-name').text().trim(),
                    listingAgent: $elem.find('.contact-name').last().text().trim() ||
                                 $elem.find('.agent-name').text().trim(),
                    agentPhone: $elem.find('.contact-phone').text().trim(),
                    
                    // Property details
                    availableSpace: $elem.find('.available-space').text().trim(),
                    buildingClass: $elem.find('.building-class').text().trim(),
                    yearBuilt: $elem.find('.year-built').text().trim(),
                    
                    // Move-in ready indicators
                    isSublease: $elem.text().toLowerCase().includes('sublease'),
                    isSpecSuite: $elem.text().toLowerCase().includes('spec') || 
                                $elem.text().toLowerCase().includes('built-out'),
                    moveInReady: $elem.text().toLowerCase().includes('immediate') ||
                                $elem.text().toLowerCase().includes('available now'),
                    
                    listingUrl: $elem.find('a').first().attr('href') ? 
                               `https://www.loopnet.com${$elem.find('a').first().attr('href')}` : '',
                    imageUrl: $elem.find('img').first().attr('src') || '',
                    source: 'LoopNet',
                    scrapedAt: timestamp,
                    daysOnMarket: this.calculateDaysOnMarket($elem.find('.days-on-site').text())
                };
                
                properties[propertyId] = property;
            });
            
            console.log(`   ✅ Found ${Object.keys(properties).length} office properties`);
            
        } catch (error) {
            console.error('❌ Error scraping office:', error.message);
        }
        
        // Industrial properties
        try {
            console.log('🏭 Fetching Industrial listings...');
            const industrialUrl = `https://www.loopnet.com/for-lease/${city.toLowerCase()}-${state}/industrial/`;
            const response = await axios.get(industrialUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
            });
            
            const $ = cheerio.load(response.data);
            
            $('.placard-pseudo').each((i, elem) => {
                const $elem = $(elem);
                const propertyId = $elem.attr('data-id') || `industrial-${i}`;
                
                const rateInfo = this.parseRentalRate($elem.find('.placard-price').text());
                
                const property = {
                    id: propertyId,
                    type: 'Industrial',
                    address: $elem.find('.placard-address-main').text().trim(),
                    city: $elem.find('.placard-address-city').text().trim() || city,
                    size: $elem.find('.placard-info-value').first().text().trim(),
                    rentalRate: rateInfo.rate,
                    displayRate: rateInfo.displayRate,
                    isNegotiable: rateInfo.isNegotiable,
                    
                    // Agent/Broker Information
                    listingCompany: $elem.find('.contact-name').first().text().trim() ||
                                   $elem.find('.broker-name').text().trim(),
                    listingAgent: $elem.find('.contact-name').last().text().trim() ||
                                 $elem.find('.agent-name').text().trim(),
                    agentPhone: $elem.find('.contact-phone').text().trim(),
                    
                    // Industrial specific
                    ceilingHeight: $elem.find('.ceiling-height').text().trim() || 
                                  this.extractFromText($elem.text(), /(\d+)['\s]*clear/i),
                    dockDoors: $elem.find('.dock-doors').text().trim() ||
                              this.extractFromText($elem.text(), /(\d+)\s*dock/i),
                    driveInDoors: this.extractFromText($elem.text(), /(\d+)\s*drive.?in/i),
                    
                    // Categories
                    subtype: this.determineIndustrialType($elem.text()),
                    
                    // Move-in ready
                    isSublease: $elem.text().toLowerCase().includes('sublease'),
                    moveInReady: $elem.text().toLowerCase().includes('immediate') ||
                                $elem.text().toLowerCase().includes('vacant'),
                    
                    listingUrl: $elem.find('a').first().attr('href') ?
                               `https://www.loopnet.com${$elem.find('a').first().attr('href')}` : '',
                    imageUrl: $elem.find('img').first().attr('src') || '',
                    source: 'LoopNet',
                    scrapedAt: timestamp,
                    daysOnMarket: this.calculateDaysOnMarket($elem.find('.days-on-site').text())
                };
                
                properties[propertyId] = property;
            });
            
            console.log(`   ✅ Found ${Object.keys(properties).filter(k => properties[k].type === 'Industrial').length} industrial properties`);
            
        } catch (error) {
            console.error('❌ Error scraping industrial:', error.message);
        }
        
        this.currentData = properties;
        return properties;
    }

    // Detect changes from previous scrape
    async detectChanges() {
        const changes = {
            newListings: [],
            priceDrops: [],
            priceIncreases: [],
            removed: [],
            negotiableProperties: []
        };
        
        // Check for new listings and price changes
        for (const [id, property] of Object.entries(this.currentData)) {
            const previous = this.previousData.properties?.[id];
            
            if (!previous) {
                // New listing!
                changes.newListings.push(property);
            } else {
                // Check for price changes
                if (property.rentalRate && previous.rentalRate) {
                    if (property.rentalRate < previous.rentalRate) {
                        changes.priceDrops.push({
                            ...property,
                            previousRate: previous.rentalRate,
                            priceDrop: previous.rentalRate - property.rentalRate,
                            percentDrop: ((previous.rentalRate - property.rentalRate) / previous.rentalRate * 100).toFixed(1)
                        });
                    } else if (property.rentalRate > previous.rentalRate) {
                        changes.priceIncreases.push({
                            ...property,
                            previousRate: previous.rentalRate,
                            priceIncrease: property.rentalRate - previous.rentalRate
                        });
                    }
                }
            }
            
            // Track negotiable properties
            if (property.isNegotiable) {
                changes.negotiableProperties.push(property);
            }
        }
        
        // Check for removed listings
        if (this.previousData.properties) {
            for (const [id, property] of Object.entries(this.previousData.properties)) {
                if (!this.currentData[id]) {
                    changes.removed.push(property);
                }
            }
        }
        
        this.changes = changes;
        return changes;
    }

    // Generate alerts/notifications
    async generateAlerts() {
        const alerts = [];
        
        // New listings alert
        if (this.changes.newListings.length > 0) {
            const officeNew = this.changes.newListings.filter(p => p.type === 'Office');
            const industrialNew = this.changes.newListings.filter(p => p.type === 'Industrial');
            
            alerts.push({
                type: 'NEW_LISTINGS',
                priority: 'HIGH',
                title: `🆕 ${this.changes.newListings.length} New Properties Listed!`,
                summary: `${officeNew.length} Office, ${industrialNew.length} Industrial`,
                properties: this.changes.newListings.slice(0, 5) // Top 5
            });
        }
        
        // Price drops alert
        if (this.changes.priceDrops.length > 0) {
            alerts.push({
                type: 'PRICE_DROPS',
                priority: 'HIGH',
                title: `💰 ${this.changes.priceDrops.length} Price Reductions!`,
                summary: `Biggest drop: ${Math.max(...this.changes.priceDrops.map(p => p.percentDrop))}%`,
                properties: this.changes.priceDrops.slice(0, 5)
            });
        }
        
        // Negotiable properties
        if (this.changes.negotiableProperties.length > 0) {
            alerts.push({
                type: 'NEGOTIABLE',
                priority: 'MEDIUM',
                title: `🤝 ${this.changes.negotiableProperties.length} Negotiable Properties`,
                summary: 'These landlords are motivated!',
                properties: this.changes.negotiableProperties.slice(0, 5)
            });
        }
        
        // Move-in ready
        const moveInReady = Object.values(this.currentData).filter(p => p.moveInReady);
        if (moveInReady.length > 0) {
            alerts.push({
                type: 'MOVE_IN_READY',
                priority: 'MEDIUM',
                title: `⚡ ${moveInReady.length} Move-In Ready Spaces`,
                summary: 'Immediate occupancy available',
                properties: moveInReady.slice(0, 5)
            });
        }
        
        return alerts;
    }

    // Save all data with timestamp
    async saveData() {
        const timestamp = Date.now();
        const filename = `properties-${timestamp}.json`;
        
        const output = {
            metadata: {
                scrapedAt: new Date().toISOString(),
                totalProperties: Object.keys(this.currentData).length,
                office: Object.values(this.currentData).filter(p => p.type === 'Office').length,
                industrial: Object.values(this.currentData).filter(p => p.type === 'Industrial').length,
                negotiable: Object.values(this.currentData).filter(p => p.isNegotiable).length,
                moveInReady: Object.values(this.currentData).filter(p => p.moveInReady).length,
                subleases: Object.values(this.currentData).filter(p => p.isSublease).length
            },
            properties: this.currentData,
            changes: this.changes,
            alerts: await this.generateAlerts()
        };
        
        await fs.writeFile(
            path.join(this.dataDir, filename),
            JSON.stringify(output, null, 2)
        );
        
        // Also save a "latest" file for easy access
        await fs.writeFile(
            path.join(this.dataDir, 'latest.json'),
            JSON.stringify(output, null, 2)
        );
        
        console.log(`\n💾 Saved to ${filename}`);
        return output;
    }

    // Generate HTML report
    async generateHTMLReport(data) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Property Tracker Report - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; }
        .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 20px; border-radius: 10px; }
        .alert { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .alert.high { border-color: #EF4444; background: #FEE2E2; }
        .property { background: white; border: 1px solid #E5E7EB; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .negotiable { background: #DBEAFE; }
        .price-drop { background: #D1FAE5; }
        .new { background: #FEF3C7; }
        .agent-info { color: #6B7280; font-size: 0.9em; margin-top: 8px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-value { font-size: 2em; font-weight: bold; color: #3B82F6; }
        .stat-label { color: #6B7280; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏢 Property Tracker Report</h1>
        <p>${new Date().toLocaleString()}</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-value">${data.metadata.totalProperties}</div>
            <div class="stat-label">Total Properties</div>
        </div>
        <div class="stat">
            <div class="stat-value">${data.changes.newListings.length}</div>
            <div class="stat-label">New Listings</div>
        </div>
        <div class="stat">
            <div class="stat-value">${data.changes.priceDrops.length}</div>
            <div class="stat-label">Price Drops</div>
        </div>
        <div class="stat">
            <div class="stat-value">${data.metadata.negotiable}</div>
            <div class="stat-label">Negotiable</div>
        </div>
    </div>
    
    ${data.alerts.map(alert => `
        <div class="alert ${alert.priority.toLowerCase()}">
            <h3>${alert.title}</h3>
            <p>${alert.summary}</p>
        </div>
    `).join('')}
    
    <h2>📍 Top New Listings</h2>
    ${data.changes.newListings.slice(0, 5).map(p => `
        <div class="property new">
            <h3>${p.address}</h3>
            <p><strong>${p.type}</strong> • ${p.size} • ${p.displayRate}</p>
            ${p.isNegotiable ? '<span class="badge">NEGOTIABLE</span>' : ''}
            ${p.moveInReady ? '<span class="badge">MOVE-IN READY</span>' : ''}
            <div class="agent-info">
                Agent: ${p.listingAgent || 'Not listed'} • ${p.listingCompany || ''} • ${p.agentPhone || ''}
            </div>
        </div>
    `).join('')}
    
    <h2>💰 Price Drops</h2>
    ${data.changes.priceDrops.slice(0, 5).map(p => `
        <div class="property price-drop">
            <h3>${p.address}</h3>
            <p><strong>${p.type}</strong> • ${p.size}</p>
            <p>Was: $${p.previousRate}/sq ft → Now: ${p.displayRate} <strong>(-${p.percentDrop}%)</strong></p>
            <div class="agent-info">
                Agent: ${p.listingAgent || 'Not listed'} • ${p.listingCompany || ''} • ${p.agentPhone || ''}
            </div>
        </div>
    `).join('')}
</body>
</html>`;
        
        await fs.writeFile(path.join(this.dataDir, 'latest-report.html'), html);
        console.log('📄 HTML report generated: latest-report.html');
    }

    // Helper functions
    calculateDaysOnMarket(text) {
        if (!text) return 0;
        const match = text.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }
    
    extractFromText(text, regex) {
        const match = text.match(regex);
        return match ? match[1] : '';
    }
    
    determineIndustrialType(text) {
        const lower = text.toLowerCase();
        if (lower.includes('warehouse')) return 'Warehouse';
        if (lower.includes('flex')) return 'Flex Space';
        if (lower.includes('distribution')) return 'Distribution';
        if (lower.includes('manufacturing')) return 'Manufacturing';
        if (lower.includes('cold') || lower.includes('freezer')) return 'Cold Storage';
        return 'General Industrial';
    }
}

// Main execution
async function trackProperties(city = 'Chicago', state = 'IL') {
    const tracker = new PropertyTracker();
    
    console.log('🚀 Starting Property Tracker...');
    await tracker.initialize();
    
    // Scrape current data
    await tracker.scrapeLoopNet(city, state);
    
    // Detect changes
    const changes = await tracker.detectChanges();
    
    // Save everything
    const report = await tracker.saveData();
    
    // Generate HTML report
    await tracker.generateHTMLReport(report);
    
    // Print summary
    console.log('\n📊 TRACKING SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Total Properties: ${report.metadata.totalProperties}`);
    console.log(`  Office: ${report.metadata.office}`);
    console.log(`  Industrial: ${report.metadata.industrial}`);
    console.log(`\n🔔 CHANGES DETECTED:`);
    console.log(`  New Listings: ${changes.newListings.length}`);
    console.log(`  Price Drops: ${changes.priceDrops.length}`);
    console.log(`  Negotiable: ${changes.negotiableProperties.length}`);
    console.log(`  Move-In Ready: ${report.metadata.moveInReady}`);
    
    if (changes.priceDrops.length > 0) {
        console.log(`\n💰 BIGGEST PRICE DROPS:`);
        changes.priceDrops.slice(0, 3).forEach(p => {
            console.log(`  ${p.address}: -${p.percentDrop}% (Agent: ${p.listingAgent || 'N/A'})`);
        });
    }
    
    if (changes.newListings.length > 0) {
        console.log(`\n🆕 NEWEST LISTINGS:`);
        changes.newListings.slice(0, 3).forEach(p => {
            console.log(`  ${p.address}: ${p.size} @ ${p.displayRate} (Agent: ${p.listingAgent || 'N/A'})`);
        });
    }
    
    return report;
}

module.exports = { PropertyTracker, trackProperties };

// Run if called directly
if (require.main === module) {
    trackProperties().catch(console.error);
}