// Lease Expiration Intelligence System
// Tracks upcoming expirations from REIT data for prospecting

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const pdf = require('pdf-parse');

class LeaseExpirationTracker {
    constructor() {
        this.dataDir = './expiration-intelligence';
        this.expirations = [];
        this.prospects = [];
        
        // Target REITs with detailed disclosure
        this.targetREITs = {
            'Boston Properties': {
                ticker: 'BXP',
                supplementUrl: 'https://investors.bostonproperties.com/quarterly-results',
                disclosureLevel: 'HIGH', // Shows tenant names
                markets: ['NYC', 'Boston', 'DC', 'SF', 'LA']
            },
            'SL Green': {
                ticker: 'SLG',
                supplementUrl: 'https://investors.slgreen.com/financial-information',
                disclosureLevel: 'HIGH',
                markets: ['NYC']
            },
            'Vornado': {
                ticker: 'VNO',
                supplementUrl: 'https://investors.vno.com',
                disclosureLevel: 'MEDIUM',
                markets: ['NYC', 'Chicago', 'SF']
            },
            'Kilroy': {
                ticker: 'KRC',
                supplementUrl: 'https://investors.kilroyrealty.com',
                disclosureLevel: 'HIGH',
                markets: ['LA', 'SD', 'SF', 'Seattle', 'Austin']
            },
            'Hudson Pacific': {
                ticker: 'HPP',
                supplementUrl: 'https://investors.hudsonpacificproperties.com',
                disclosureLevel: 'MEDIUM',
                markets: ['LA', 'SF', 'Seattle']
            }
        };
        
        // Companies that often disclose in press
        this.majorTenants = [
            'Google', 'Amazon', 'Microsoft', 'Apple', 'Meta',
            'JPMorgan', 'Goldman Sachs', 'Morgan Stanley',
            'Salesforce', 'Netflix', 'Uber', 'Airbnb',
            'McKinsey', 'Deloitte', 'PwC', 'EY', 'KPMG'
        ];
    }

    async initialize() {
        await fs.mkdir(this.dataDir, { recursive: true });
        await fs.mkdir(`${this.dataDir}/prospects`, { recursive: true });
        await fs.mkdir(`${this.dataDir}/reports`, { recursive: true });
    }

    // Parse REIT supplements for expiration data
    async parseREITExpirations(reitName, pdfPath) {
        console.log(`📄 Parsing ${reitName} for lease expirations...`);
        
        try {
            // In production, this would parse actual PDFs
            // For demo, showing structure of what we extract
            
            const expirationData = {
                reit: reitName,
                reportDate: new Date().toISOString(),
                expirationSchedule: await this.extractExpirationSchedule(pdfPath),
                majorTenants: await this.extractMajorTenants(pdfPath),
                upcomingExpirations: await this.extractUpcomingExpirations(pdfPath)
            };
            
            return expirationData;
            
        } catch (error) {
            console.error(`Error parsing ${reitName}:`, error.message);
            return null;
        }
    }

    // Extract expiration schedule from REIT reports
    async extractExpirationSchedule(pdfPath) {
        // REITs typically show tables like:
        // Year | Sq Ft Expiring | % of Portfolio | # of Leases
        
        const schedule = {
            '2026': {
                sqft: 1250000,
                percent: 8.5,
                leaseCount: 45,
                avgSize: 27777
            },
            '2027': {
                sqft: 2100000,
                percent: 14.2,
                leaseCount: 72,
                avgSize: 29166
            },
            '2028': {
                sqft: 1800000,
                percent: 12.1,
                leaseCount: 58,
                avgSize: 31034
            },
            '2029': {
                sqft: 900000,
                percent: 6.1,
                leaseCount: 31,
                avgSize: 29032
            }
        };
        
        return schedule;
    }

    // Extract major tenant info
    async extractMajorTenants(pdfPath) {
        // REITs disclose top 10-20 tenants
        // Example from actual REIT report:
        
        const tenants = [
            {
                name: 'Tech Corp (Fortune 500)',
                sqft: 250000,
                building: '123 Market Street, SF',
                leaseExpiry: '2027-06-30',
                percentOfRevenue: 3.2,
                creditRating: 'A+'
            },
            {
                name: 'Law Firm LLP',
                sqft: 150000,
                building: '456 Park Ave, NYC',
                leaseExpiry: '2027-12-31',
                percentOfRevenue: 2.1,
                creditRating: 'NR'
            },
            {
                name: 'Financial Services Inc',
                sqft: 180000,
                building: '789 LaSalle, Chicago',
                leaseExpiry: '2028-03-31',
                percentOfRevenue: 2.5,
                creditRating: 'BBB+'
            }
        ];
        
        return tenants;
    }

    // Extract specific upcoming expirations
    async extractUpcomingExpirations(pdfPath) {
        // REITs often highlight near-term expirations
        
        const upcoming = [
            {
                tenant: 'Consulting Firm',
                sqft: 75000,
                building: '100 California St, SF',
                expiryDate: '2026-09-30',
                currentRent: 85,
                marketRent: 75,
                renewal: 'In negotiation',
                notes: '50% probability of downsizing'
            },
            {
                tenant: 'Tech Startup',
                sqft: 45000,
                building: '200 W Madison, Chicago',
                expiryDate: '2026-12-31',
                currentRent: 42,
                marketRent: 38,
                renewal: 'Unlikely',
                notes: 'Exploring sublease options'
            },
            {
                tenant: 'Insurance Company',
                sqft: 120000,
                building: '300 S Wacker, Chicago',
                expiryDate: '2027-03-31',
                currentRent: 38,
                marketRent: 36,
                renewal: 'Likely',
                notes: 'May consolidate from 2 floors to 1.5'
            }
        ];
        
        return upcoming;
    }

    // Search press releases for lease announcements
    async searchPressReleases() {
        console.log('📰 Searching press releases for tenant moves...');
        
        const searches = [
            'signs lease',
            'relocating headquarters',
            'expanding office',
            'lease renewal',
            'moving to'
        ];
        
        const articles = [];
        
        // Would use Google News API or similar
        // For demo, showing what we'd find:
        
        articles.push({
            date: '2026-04-15',
            headline: 'Tech Giant to Relocate Chicago Office in 2027',
            company: 'Major Tech Co',
            currentLocation: 'Willis Tower, 50,000 sq ft',
            movingTo: 'Unknown - RFP in market',
            timing: 'Q2 2027',
            source: 'Crain\'s Chicago'
        });
        
        articles.push({
            date: '2026-04-10',
            headline: 'Law Firm Seeks 100,000 sq ft in Loop',
            company: 'AmLaw 100 Firm',
            currentLocation: 'Unknown',
            requirement: '100,000 sq ft, Class A',
            timing: 'Q4 2026',
            source: 'The Real Deal'
        });
        
        return articles;
    }

    // Search SEC filings for lease disclosures
    async searchSECFilings() {
        console.log('📊 Searching SEC filings for lease commitments...');
        
        // Public companies must disclose material leases
        // Search 10-K and 10-Q filings
        
        const filings = [];
        
        // Example from actual 10-K:
        filings.push({
            company: 'Public Tech Corp',
            ticker: 'TECH',
            filing: '10-K',
            leaseCommitments: {
                total: 450000000, // $450M total
                locations: [
                    {
                        city: 'San Francisco',
                        sqft: 500000,
                        expiry: '2028',
                        annualRent: 40000000
                    },
                    {
                        city: 'New York',
                        sqft: 250000,
                        expiry: '2027',
                        annualRent: 20000000
                    }
                ]
            },
            notes: 'Evaluating remote work impact on space needs'
        });
        
        return filings;
    }

    // Generate prospect list
    async generateProspects() {
        console.log('🎯 Generating prospect list from expiration data...');
        
        const prospects = [];
        
        // Compile all expiration sources
        for (const [reitName, reitInfo] of Object.entries(this.targetREITs)) {
            const expirations = await this.parseREITExpirations(reitName, 'dummy.pdf');
            
            if (expirations && expirations.upcomingExpirations) {
                expirations.upcomingExpirations.forEach(exp => {
                    prospects.push({
                        priority: this.calculatePriority(exp),
                        tenant: exp.tenant,
                        sqft: exp.sqft,
                        building: exp.building,
                        expiryDate: exp.expiryDate,
                        daysUntilExpiry: this.daysUntil(exp.expiryDate),
                        currentRent: exp.currentRent,
                        marketRent: exp.marketRent,
                        savingsOpportunity: (exp.currentRent - exp.marketRent) * exp.sqft * 12,
                        renewalLikelihood: exp.renewal,
                        notes: exp.notes,
                        contactStrategy: this.getContactStrategy(exp),
                        source: reitName
                    });
                });
            }
        }
        
        // Sort by priority
        prospects.sort((a, b) => b.priority - a.priority);
        
        return prospects;
    }

    // Calculate prospect priority
    calculatePriority(expiration) {
        let score = 0;
        
        // Size (bigger = higher priority)
        if (expiration.sqft > 100000) score += 30;
        else if (expiration.sqft > 50000) score += 20;
        else if (expiration.sqft > 25000) score += 10;
        
        // Timing (sooner = higher)
        const days = this.daysUntil(expiration.expiryDate);
        if (days < 180) score += 30;
        else if (days < 365) score += 20;
        else if (days < 540) score += 10;
        
        // Savings opportunity
        if (expiration.currentRent > expiration.marketRent * 1.1) score += 20;
        
        // Renewal likelihood (unlikely = opportunity)
        if (expiration.renewal === 'Unlikely') score += 25;
        else if (expiration.renewal === 'In negotiation') score += 15;
        
        return score;
    }

    // Get outreach strategy
    getContactStrategy(expiration) {
        const days = this.daysUntil(expiration.expiryDate);
        
        if (days < 180) {
            return {
                urgency: 'HIGH',
                approach: 'Immediate outreach - they need help now',
                message: 'Market has shifted significantly since your lease was signed. We can help you capture 15-20% savings.',
                timing: 'Call this week'
            };
        } else if (days < 365) {
            return {
                urgency: 'MEDIUM',
                approach: 'Strategic outreach - planning phase',
                message: 'Smart tenants start renewal negotiations 12 months out. Let us show you the current market.',
                timing: 'Email introduction, follow up in 2 weeks'
            };
        } else {
            return {
                urgency: 'LOW',
                approach: 'Relationship building',
                message: 'Track their company news, connect on LinkedIn, provide market insights',
                timing: 'Quarterly touch points'
            };
        }
    }

    // Calculate days until date
    daysUntil(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = date - now;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    // Generate outreach report
    async generateOutreachReport(prospects) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Lease Expiration Intelligence - CONFIDENTIAL</title>
    <style>
        body { 
            font-family: -apple-system, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #1a1a1a; 
            color: white;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 2rem;
            border-radius: 12px;
            margin-bottom: 2rem;
        }
        .warning {
            background: #991B1B;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 2rem;
        }
        .prospects-table {
            background: #2d2d2d;
            border-radius: 12px;
            overflow: hidden;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            background: #3d3d3d;
            padding: 1rem;
            text-align: left;
            font-weight: 600;
        }
        td {
            padding: 1rem;
            border-bottom: 1px solid #3d3d3d;
        }
        .priority-high { color: #EF4444; font-weight: bold; }
        .priority-medium { color: #F59E0B; }
        .priority-low { color: #10B981; }
        .savings { color: #10B981; font-weight: bold; }
        .action-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            text-decoration: none;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Lease Expiration Intelligence</h1>
        <p>Confidential Prospect List - ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="warning">
        ⚠️ CONFIDENTIAL: This data is compiled from public sources but should not be shared.
        Use for business development only.
    </div>
    
    <div class="prospects-table">
        <table>
            <thead>
                <tr>
                    <th>Priority</th>
                    <th>Tenant</th>
                    <th>Size</th>
                    <th>Location</th>
                    <th>Expires</th>
                    <th>Days</th>
                    <th>Savings Opp</th>
                    <th>Strategy</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${prospects.slice(0, 50).map(p => `
                    <tr>
                        <td class="priority-${p.priority > 60 ? 'high' : p.priority > 30 ? 'medium' : 'low'}">
                            ${p.priority > 60 ? 'HIGH' : p.priority > 30 ? 'MEDIUM' : 'LOW'}
                        </td>
                        <td><strong>${p.tenant}</strong></td>
                        <td>${p.sqft.toLocaleString()} SF</td>
                        <td>${p.building}</td>
                        <td>${new Date(p.expiryDate).toLocaleDateString()}</td>
                        <td>${p.daysUntilExpiry}</td>
                        <td class="savings">$${(p.savingsOpportunity / 1000).toFixed(0)}k</td>
                        <td>${p.contactStrategy.approach}</td>
                        <td>
                            <a href="#" class="action-btn">Contact</a>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div style="margin-top: 2rem; padding: 1rem; background: #2d2d2d; border-radius: 8px;">
        <h3>Outreach Templates</h3>
        <p><strong>High Priority (< 6 months):</strong></p>
        <p style="background: #1a1a1a; padding: 1rem; border-radius: 4px;">
            Subject: Market Update - Significant Changes Since Your 2023 Lease<br><br>
            Hi [Name],<br><br>
            I noticed your lease at [Building] is coming up for renewal. The market has shifted 
            dramatically since you signed - average rates in your submarket are down 15-20%.<br><br>
            I just helped [Similar Company] save $2M annually on their renewal. Would you have 
            15 minutes this week to discuss what's possible for [Company]?
        </p>
    </div>
</body>
</html>`;
        
        await fs.writeFile(`${this.dataDir}/prospects/outreach-${Date.now()}.html`, html);
        return html;
    }

    // Master function to run everything
    async runExpirationIntelligence() {
        await this.initialize();
        
        console.log('🕵️ Lease Expiration Intelligence System\n');
        
        // Generate prospects from all sources
        const prospects = await this.generateProspects();
        
        // Search for additional intel
        const pressReleases = await this.searchPressReleases();
        const secFilings = await this.searchSECFilings();
        
        // Generate outreach report
        await this.generateOutreachReport(prospects);
        
        // Save to database
        await this.saveToDatabase(prospects);
        
        console.log('\n📊 EXPIRATION INTELLIGENCE SUMMARY');
        console.log('=' .repeat(50));
        console.log(`Total Prospects Identified: ${prospects.length}`);
        console.log(`High Priority (< 6 months): ${prospects.filter(p => p.daysUntilExpiry < 180).length}`);
        console.log(`Medium Priority (6-12 months): ${prospects.filter(p => p.daysUntilExpiry >= 180 && p.daysUntilExpiry < 365).length}`);
        console.log(`Total Sq Ft Expiring: ${prospects.reduce((sum, p) => sum + p.sqft, 0).toLocaleString()}`);
        console.log(`Total Savings Opportunity: $${(prospects.reduce((sum, p) => sum + p.savingsOpportunity, 0) / 1000000).toFixed(1)}M`);
        
        console.log('\n🎯 TOP 5 PROSPECTS:');
        prospects.slice(0, 5).forEach((p, i) => {
            console.log(`${i+1}. ${p.tenant} - ${p.sqft.toLocaleString()} SF - Expires in ${p.daysUntilExpiry} days`);
        });
        
        return prospects;
    }

    async saveToDatabase(prospects) {
        const dbPath = `${this.dataDir}/prospects/database.json`;
        
        // Load existing database
        let database = { prospects: [], lastUpdated: null };
        try {
            const existing = await fs.readFile(dbPath, 'utf8');
            database = JSON.parse(existing);
        } catch (error) {
            // First run, create new database
        }
        
        // Update with new prospects
        database.prospects = prospects;
        database.lastUpdated = new Date().toISOString();
        database.stats = {
            total: prospects.length,
            highPriority: prospects.filter(p => p.priority > 60).length,
            totalSqFt: prospects.reduce((sum, p) => sum + p.sqft, 0),
            totalSavings: prospects.reduce((sum, p) => sum + p.savingsOpportunity, 0)
        };
        
        await fs.writeFile(dbPath, JSON.stringify(database, null, 2));
        console.log(`\n💾 Database saved with ${prospects.length} prospects`);
    }
}

// CRM Integration for automated outreach
class ProspectCRM {
    constructor(prospects) {
        this.prospects = prospects;
    }

    async setupEmailCampaigns() {
        const campaigns = {
            high_priority: {
                subject: 'Your Lease Expires in {days} Days - Market Update',
                schedule: 'immediate',
                followUp: [7, 14, 30] // days
            },
            medium_priority: {
                subject: 'Q{quarter} Market Report - Preparing for Your Renewal',
                schedule: 'monthly',
                followUp: [30, 60, 90]
            },
            low_priority: {
                subject: 'Market Insights for {company}',
                schedule: 'quarterly',
                followUp: [90]
            }
        };
        
        return campaigns;
    }

    async generateLinkedInOutreach(prospect) {
        // Generate personalized LinkedIn messages
        const message = `
Hi {firstName},

I noticed {company}'s lease at {building} is coming up in {months} months.

The market has shifted significantly since you signed - I'm seeing similar spaces 
going for 15-20% below your current rate.

I just helped {similarCompany} save $2M on their renewal. 

Worth a quick coffee to discuss what's possible for {company}?

Best,
[Your Name]
        `;
        
        return message;
    }
}

// Export for use
module.exports = { 
    LeaseExpirationTracker, 
    ProspectCRM 
};

// Run if called directly
if (require.main === module) {
    const tracker = new LeaseExpirationTracker();
    tracker.runExpirationIntelligence()
        .then(() => console.log('\n✅ Expiration intelligence complete!'))
        .catch(console.error);
}