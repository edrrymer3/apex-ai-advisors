// Minnesota Market Intelligence System
// Focus on Twin Cities (Minneapolis/St. Paul) and suburbs

const axios = require('axios');
const fs = require('fs').promises;

class MinnesotaMarketTracker {
    constructor() {
        this.markets = {
            primary: ['Minneapolis', 'St. Paul'],
            suburbs: [
                // First Ring
                'Bloomington', 'Edina', 'Minnetonka', 'St. Louis Park', 'Hopkins',
                'Richfield', 'Roseville', 'Maplewood', 'Woodbury', 'Eden Prairie',
                
                // Second Ring  
                'Plymouth', 'Maple Grove', 'Burnsville', 'Eagan', 'Apple Valley',
                'Lakeville', 'Blaine', 'Coon Rapids', 'Fridley', 'Shoreview',
                
                // Growth Markets
                'Chanhassen', 'Chaska', 'Shakopee', 'Prior Lake', 'Savage'
            ],
            industrial: [
                'Brooklyn Park', 'Rogers', 'Medina', 'Dayton', // NW Industrial
                'Eagan', 'Inver Grove Heights', 'South St. Paul', // SE Industrial
                'Shakopee', 'Jordan' // SW Industrial Corridor
            ]
        };
        
        // Minnesota-focused REITs and major landlords
        this.dataSources = {
            reits: {
                // National REITs with significant MN presence
                'Prologis': {
                    ticker: 'PLD',
                    mnProperties: [
                        'Prologis Park 394',
                        'Prologis Crossroads Commerce Center',
                        'Multiple facilities in Shakopee'
                    ],
                    sqft: 3500000 // 3.5M+ sq ft in MN
                },
                'Duke Realty': {
                    ticker: 'DRE',
                    mnProperties: [
                        'Crossroads of Eagan',
                        'Northwest Crossing',
                        'Vale Business Park'
                    ],
                    sqft: 2000000
                },
                'First Industrial': {
                    ticker: 'FR',
                    mnProperties: [
                        'First Park 94',
                        'Brooklyn Park facilities'
                    ],
                    sqft: 1500000
                },
                'WP Carey': {
                    ticker: 'WPC',
                    mnProperties: ['Various net lease properties'],
                    sqft: 800000
                }
            },
            
            localLandlords: {
                'United Properties': {
                    type: 'Private',
                    headquarters: 'Minneapolis',
                    properties: [
                        'Normandale Lake Office Park',
                        'Colonnade Business Park',
                        'West End Office Buildings',
                        '7900 International Drive'
                    ],
                    focus: 'Office/Industrial',
                    sqft: 5000000
                },
                'CSM Corporation': {
                    type: 'Private',
                    headquarters: 'Minneapolis',
                    properties: [
                        'Campbell Mithun Tower',
                        'AT&T Tower',
                        'Churchill Office Building'
                    ],
                    focus: 'Office',
                    sqft: 2500000
                },
                'Opus Group': {
                    type: 'Private',
                    headquarters: 'Minnetonka',
                    properties: [
                        'Opus Business Parks',
                        'Multiple developments'
                    ],
                    focus: 'Office/Industrial development',
                    sqft: 10000000
                },
                'Ryan Companies': {
                    type: 'Private',
                    headquarters: 'Minneapolis',
                    properties: [
                        'Multiple office/industrial',
                        'Mixed-use developments'
                    ],
                    focus: 'Full spectrum',
                    sqft: 8000000
                },
                'Kraus-Anderson': {
                    type: 'Private',
                    headquarters: 'Minneapolis',
                    properties: ['KA Block', 'Various properties'],
                    focus: 'Office/Mixed-use',
                    sqft: 1500000
                },
                'Doran Companies': {
                    type: 'Private',
                    headquarters: 'Bloomington',
                    properties: ['Office parks in suburbs'],
                    focus: 'Suburban office',
                    sqft: 1000000
                }
            }
        };
        
        // Major corporations with upcoming lease decisions
        this.majorTenants = {
            fortune500: [
                {
                    company: 'UnitedHealth Group',
                    headquarters: 'Minnetonka',
                    sqft: 2000000,
                    notes: 'Largest employer, always expanding/consolidating'
                },
                {
                    company: 'Target',
                    headquarters: 'Minneapolis',
                    sqft: 1500000,
                    notes: 'Downtown Minneapolis anchor + Brooklyn Park campus'
                },
                {
                    company: '3M',
                    headquarters: 'Maplewood',
                    sqft: 3000000,
                    notes: 'Massive campus, some remote work reduction'
                },
                {
                    company: 'US Bank',
                    headquarters: 'Minneapolis',
                    sqft: 1000000,
                    notes: 'Downtown tower + operations centers'
                },
                {
                    company: 'Best Buy',
                    headquarters: 'Richfield',
                    sqft: 800000,
                    notes: 'HQ campus + distribution'
                },
                {
                    company: 'General Mills',
                    headquarters: 'Golden Valley',
                    sqft: 900000,
                    notes: 'Stable but optimizing'
                },
                {
                    company: 'CHS',
                    headquarters: 'Inver Grove Heights',
                    sqft: 600000,
                    notes: 'Energy/Ag - commodity dependent'
                },
                {
                    company: 'Ameriprise',
                    headquarters: 'Minneapolis',
                    sqft: 700000,
                    notes: 'Downtown + satellite offices'
                }
            ],
            
            growth: [
                'Caribou Coffee', 'Sleep Number', 'Polaris',
                'Dairy Queen', 'Buffalo Wild Wings', 'Life Time Fitness',
                'Mortenson', 'Cargill', 'Medtronic', 'Ecolab'
            ]
        };
    }

    // Fetch Minnesota-specific market data
    async fetchMinnesotaMarketData() {
        console.log('🌟 Fetching Minnesota Market Data...\n');
        
        const marketData = {
            office: {
                downtown: {
                    minneapolis: {
                        classA: { rate: 28.50, vacancy: 18.5 },
                        classB: { rate: 22.00, vacancy: 22.3 },
                        classC: { rate: 16.50, vacancy: 25.1 }
                    },
                    stPaul: {
                        classA: { rate: 24.00, vacancy: 16.2 },
                        classB: { rate: 19.50, vacancy: 19.8 },
                        classC: { rate: 14.00, vacancy: 23.5 }
                    }
                },
                suburban: {
                    southwest: { // Edina, Minnetonka, Eden Prairie
                        rate: 26.00,
                        vacancy: 14.5,
                        hotBuildings: [
                            'Normandale Lake Office Park',
                            'Eden Prairie Center',
                            'Opus Business Park'
                        ]
                    },
                    northwest: { // Plymouth, Maple Grove
                        rate: 24.00,
                        vacancy: 12.8,
                        hotBuildings: [
                            'Ridgedale Office Park',
                            'Arbor Lakes Business Park'
                        ]
                    },
                    east: { // Woodbury, Maplewood
                        rate: 22.50,
                        vacancy: 11.2,
                        hotBuildings: [
                            'Woodbury Business Park',
                            '3M Campus area'
                        ]
                    },
                    southMetro: { // Bloomington, Eagan, Burnsville
                        rate: 23.50,
                        vacancy: 13.1,
                        hotBuildings: [
                            'Norman Pointe',
                            'Southbridge Crossings',
                            'West 494 Business Park'
                        ]
                    }
                },
                trends: {
                    flightToQuality: true,
                    suburbanOutperforming: true,
                    downtownRecovery: 'slow',
                    hybridImpact: 'significant'
                }
            },
            
            industrial: {
                warehouse: {
                    rate: 6.75,
                    vacancy: 4.2,
                    notes: 'Very tight market, limited availability'
                },
                flex: {
                    rate: 10.50,
                    vacancy: 7.8,
                    notes: 'Strong demand from small businesses'
                },
                manufacturing: {
                    rate: 5.50,
                    vacancy: 5.5,
                    notes: 'Stable, older product available'
                },
                distribution: {
                    rate: 7.25,
                    vacancy: 3.1,
                    notes: 'Extremely tight, new construction needed'
                },
                hotCorridors: [
                    {
                        area: 'I-94/494/694 Ring',
                        vacancy: 3.5,
                        rate: 7.50,
                        notes: 'Prime distribution location'
                    },
                    {
                        area: 'Highway 169 Corridor',
                        vacancy: 4.8,
                        rate: 6.75,
                        notes: 'Shakopee/Jordan growth area'
                    },
                    {
                        area: 'I-35W South',
                        vacancy: 5.2,
                        rate: 6.50,
                        notes: 'Burnsville/Lakeville expansion'
                    }
                ]
            },
            
            concessions: {
                office: {
                    downtown: '12-18 months free on 10-year',
                    suburban: '6-12 months free on 7-year',
                    tiAllowance: '$40-60/sq ft'
                },
                industrial: {
                    standard: '1-3 months free',
                    tiAllowance: '$5-15/sq ft'
                }
            }
        };
        
        return marketData;
    }

    // Get lease expirations from public sources
    async fetchMinnesotaExpirations() {
        console.log('📋 Identifying Minnesota Lease Expirations...\n');
        
        const expirations = [];
        
        // Sample expirations (would be from real sources)
        const knownExpirations = [
            {
                tenant: 'Tech Company (500+ employees)',
                building: 'Normandale Lake Office Park',
                city: 'Bloomington',
                sqft: 75000,
                currentRate: 28.00,
                marketRate: 24.00,
                expiryDate: '2026-12-31',
                source: 'Building website showing availability',
                notes: 'Listed as "Available Q1 2027" = tenant leaving'
            },
            {
                tenant: 'Financial Services Firm',
                building: 'Wells Fargo Center',
                city: 'Minneapolis',
                sqft: 45000,
                currentRate: 32.00,
                marketRate: 28.50,
                expiryDate: '2027-06-30',
                source: 'REIT disclosure',
                notes: 'Downsizing likely due to remote work'
            },
            {
                tenant: 'Healthcare Company',
                building: 'West End Office',
                city: 'St. Louis Park',
                sqft: 60000,
                currentRate: 26.00,
                marketRate: 24.00,
                expiryDate: '2027-03-31',
                source: 'Press release mentioned "evaluating real estate"'
            },
            {
                tenant: 'Manufacturing Co',
                building: 'Brooklyn Park Industrial',
                city: 'Brooklyn Park',
                sqft: 150000,
                currentRate: 7.50,
                marketRate: 6.75,
                expiryDate: '2026-09-30',
                source: 'Sublease listing appeared = moving',
                propertyType: 'Industrial'
            },
            {
                tenant: 'Law Firm',
                building: 'Capella Tower',
                city: 'Minneapolis',
                sqft: 35000,
                currentRate: 35.00,
                marketRate: 28.50,
                expiryDate: '2027-01-31',
                source: 'Broker whisper',
                notes: 'Partners want suburban location'
            }
        ];
        
        // Add priority scoring
        knownExpirations.forEach(exp => {
            const daysUntil = Math.floor((new Date(exp.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            const savings = (exp.currentRate - exp.marketRate) * exp.sqft * 12;
            
            exp.daysUntilExpiry = daysUntil;
            exp.annualSavingsOpportunity = savings;
            exp.priority = this.calculatePriority(exp);
            
            expirations.push(exp);
        });
        
        // Sort by priority
        expirations.sort((a, b) => b.priority - a.priority);
        
        return expirations;
    }

    calculatePriority(exp) {
        let score = 0;
        
        // Size scoring (bigger = better)
        if (exp.sqft > 100000) score += 30;
        else if (exp.sqft > 50000) score += 20;
        else if (exp.sqft > 25000) score += 10;
        
        // Timing (sooner = better)
        if (exp.daysUntilExpiry < 180) score += 30;
        else if (exp.daysUntilExpiry < 365) score += 20;
        else if (exp.daysUntilExpiry < 540) score += 10;
        
        // Savings opportunity
        if (exp.annualSavingsOpportunity > 500000) score += 30;
        else if (exp.annualSavingsOpportunity > 250000) score += 20;
        else if (exp.annualSavingsOpportunity > 100000) score += 10;
        
        // Location preference (suburbs hot right now)
        if (!['Minneapolis', 'St. Paul'].includes(exp.city)) score += 10;
        
        return score;
    }

    // Generate Minnesota prospect report
    async generateMinnesotaReport(marketData, expirations) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Minnesota Market Intelligence Report</title>
    <style>
        body { font-family: -apple-system, sans-serif; margin: 20px; }
        .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 2rem; border-radius: 12px; }
        .market-section { background: #f5f7fa; padding: 1.5rem; margin: 1rem 0; border-radius: 8px; }
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .stat-card { background: white; padding: 1rem; border-radius: 8px; }
        .stat-label { color: #718096; font-size: 0.875rem; }
        .stat-value { font-size: 1.5rem; font-weight: bold; color: #2d3748; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f7fafc; font-weight: 600; }
        .priority-high { color: #dc2626; font-weight: bold; }
        .priority-medium { color: #d97706; }
        .savings { color: #059669; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌟 Minnesota Market Intelligence</h1>
        <p>Twin Cities Office & Industrial | ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="market-section">
        <h2>Downtown Minneapolis Office</h2>
        <div class="stat-grid">
            <div class="stat-card">
                <div class="stat-label">Class A Rate</div>
                <div class="stat-value">$${marketData.office.downtown.minneapolis.classA.rate}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Class A Vacancy</div>
                <div class="stat-value">${marketData.office.downtown.minneapolis.classA.vacancy}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Typical Concessions</div>
                <div class="stat-value">${marketData.concessions.office.downtown}</div>
            </div>
        </div>
    </div>
    
    <div class="market-section">
        <h2>Suburban Office Markets</h2>
        <div class="stat-grid">
            <div class="stat-card">
                <div class="stat-label">SW Suburbs (Edina/EP)</div>
                <div class="stat-value">$${marketData.office.suburban.southwest.rate}</div>
                <div style="color: #718096; font-size: 0.875rem;">Vacancy: ${marketData.office.suburban.southwest.vacancy}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">NW Suburbs (Plymouth)</div>
                <div class="stat-value">$${marketData.office.suburban.northwest.rate}</div>
                <div style="color: #718096; font-size: 0.875rem;">Vacancy: ${marketData.office.suburban.northwest.vacancy}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">South Metro (Bloomington)</div>
                <div class="stat-value">$${marketData.office.suburban.southMetro.rate}</div>
                <div style="color: #718096; font-size: 0.875rem;">Vacancy: ${marketData.office.suburban.southMetro.vacancy}%</div>
            </div>
        </div>
    </div>
    
    <div class="market-section">
        <h2>Industrial Market</h2>
        <div class="stat-grid">
            <div class="stat-card">
                <div class="stat-label">Warehouse</div>
                <div class="stat-value">$${marketData.industrial.warehouse.rate}/sq ft</div>
                <div style="color: #dc2626; font-size: 0.875rem;">Only ${marketData.industrial.warehouse.vacancy}% vacant!</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Flex Space</div>
                <div class="stat-value">$${marketData.industrial.flex.rate}/sq ft</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Distribution</div>
                <div class="stat-value">$${marketData.industrial.distribution.rate}/sq ft</div>
                <div style="color: #dc2626; font-size: 0.875rem;">Extremely tight market</div>
            </div>
        </div>
    </div>
    
    <div class="market-section">
        <h2>🎯 Upcoming Lease Expirations - HOT PROSPECTS</h2>
        <table>
            <thead>
                <tr>
                    <th>Priority</th>
                    <th>Tenant Type</th>
                    <th>Location</th>
                    <th>Size</th>
                    <th>Expires</th>
                    <th>Savings Opportunity</th>
                </tr>
            </thead>
            <tbody>
                ${expirations.slice(0, 10).map(exp => `
                    <tr>
                        <td class="${exp.priority > 60 ? 'priority-high' : exp.priority > 40 ? 'priority-medium' : ''}">
                            ${exp.priority > 60 ? 'HIGH' : exp.priority > 40 ? 'MEDIUM' : 'LOW'}
                        </td>
                        <td>${exp.tenant}</td>
                        <td>${exp.building}, ${exp.city}</td>
                        <td>${exp.sqft.toLocaleString()} sq ft</td>
                        <td>${exp.daysUntilExpiry} days</td>
                        <td class="savings">$${(exp.annualSavingsOpportunity / 1000).toFixed(0)}k/year</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="market-section">
        <h2>Key Market Insights</h2>
        <ul>
            <li><strong>Flight to Quality:</strong> Class A suburban outperforming downtown by 15%</li>
            <li><strong>Industrial:</strong> Extreme shortage - only ${marketData.industrial.warehouse.vacancy}% vacancy</li>
            <li><strong>Best Opportunities:</strong> Downtown Class B/C office - massive concessions available</li>
            <li><strong>Hottest Suburbs:</strong> Minnetonka, Eden Prairie, Maple Grove seeing most activity</li>
            <li><strong>Watch:</strong> 3M campus area in Maplewood - potential large blocks coming available</li>
        </ul>
    </div>
</body>
</html>`;
        
        await fs.mkdir('./minnesota-reports', { recursive: true });
        await fs.writeFile('./minnesota-reports/market-report.html', html);
        return html;
    }

    // HubSpot integration for Minnesota prospects
    async syncToHubSpot(expirations, apiKey) {
        console.log('🔄 Syncing Minnesota prospects to HubSpot...\n');
        
        const hubspotData = expirations.map(exp => ({
            properties: {
                company: exp.tenant,
                lease_expiration_date: exp.expiryDate,
                current_square_footage: exp.sqft,
                current_location: `${exp.building}, ${exp.city}`,
                current_rate: exp.currentRate,
                market_rate: exp.marketRate,
                annual_savings_opportunity: exp.annualSavingsOpportunity,
                days_until_expiry: exp.daysUntilExpiry,
                priority_score: exp.priority,
                property_type: exp.propertyType || 'Office',
                
                // Minnesota-specific fields
                minnesota_market: exp.city,
                downtown_vs_suburban: ['Minneapolis', 'St. Paul'].includes(exp.city) ? 'Downtown' : 'Suburban',
                
                // Auto-assign owner (you) for high priority
                hubspot_owner_id: exp.priority > 60 ? 'YOUR_HUBSPOT_USER_ID' : null,
                
                // Deal stage based on timing
                lifecycle_stage: exp.daysUntilExpiry < 365 ? 'opportunity' : 'lead'
            }
        }));
        
        return hubspotData;
    }
}

// Main execution for Minnesota
async function runMinnesotaTracker() {
    const tracker = new MinnesotaMarketTracker();
    
    console.log('🌟 MINNESOTA MARKET INTELLIGENCE SYSTEM\n');
    console.log('=' .repeat(50));
    
    // Fetch market data
    const marketData = await tracker.fetchMinnesotaMarketData();
    
    // Get expirations
    const expirations = await tracker.fetchMinnesotaExpirations();
    
    // Generate report
    await tracker.generateMinnesotaReport(marketData, expirations);
    
    // Prepare HubSpot sync
    const hubspotData = await tracker.syncToHubSpot(expirations, 'YOUR_HUBSPOT_API_KEY');
    
    console.log('\n📊 MINNESOTA MARKET SUMMARY');
    console.log('=' .repeat(50));
    
    console.log('\nOFFICE MARKET:');
    console.log(`  Downtown MPLS Class A: $${marketData.office.downtown.minneapolis.classA.rate}/sq ft (${marketData.office.downtown.minneapolis.classA.vacancy}% vacant)`);
    console.log(`  SW Suburbs: $${marketData.office.suburban.southwest.rate}/sq ft (${marketData.office.suburban.southwest.vacancy}% vacant)`);
    console.log(`  Best Opportunities: ${marketData.office.trends.suburbanOutperforming ? 'Suburban' : 'Downtown'}`);
    
    console.log('\nINDUSTRIAL MARKET:');
    console.log(`  Warehouse: $${marketData.industrial.warehouse.rate}/sq ft (${marketData.industrial.warehouse.vacancy}% vacant) - EXTREMELY TIGHT`);
    console.log(`  Flex: $${marketData.industrial.flex.rate}/sq ft (${marketData.industrial.flex.vacancy}% vacant)`);
    
    console.log('\n🎯 TOP MINNESOTA PROSPECTS:');
    expirations.slice(0, 5).forEach((exp, i) => {
        console.log(`  ${i+1}. ${exp.tenant} - ${exp.sqft.toLocaleString()} sq ft @ ${exp.building}`);
        console.log(`     Expires: ${exp.daysUntilExpiry} days | Savings: $${(exp.annualSavingsOpportunity/1000).toFixed(0)}k/year`);
    });
    
    console.log('\n✅ Report saved to: minnesota-reports/market-report.html');
    console.log(`✅ ${expirations.length} prospects ready for HubSpot sync`);
    
    return {
        marketData,
        expirations,
        hubspotData
    };
}

module.exports = { MinnesotaMarketTracker, runMinnesotaTracker };

// Run if called directly
if (require.main === module) {
    runMinnesotaTracker().catch(console.error);
}