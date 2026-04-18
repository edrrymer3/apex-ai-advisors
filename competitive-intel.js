// Competitive Intelligence System
// Track competitor brokers, their deals, and market positioning

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

class CompetitiveIntelligence {
    constructor() {
        this.competitors = {
            // Major national firms
            national: {
                'CBRE': {
                    website: 'https://www.cbre.us',
                    tenantRepBrokers: ['Top producers would be listed here'],
                    marketShare: 0.28,
                    strengths: ['Global reach', 'Research capabilities', 'Technology platform'],
                    weaknesses: ['High fees', 'Less personalized service', 'Slow decision making']
                },
                'JLL': {
                    website: 'https://www.us.jll.com',
                    marketShare: 0.22,
                    strengths: ['Fortune 500 relationships', 'Workplace strategy'],
                    weaknesses: ['Expensive', 'Corporate bureaucracy']
                },
                'Cushman & Wakefield': {
                    website: 'https://www.cushmanwakefield.com',
                    marketShare: 0.18,
                    strengths: ['Valuation expertise', 'Global platform'],
                    weaknesses: ['Less tech-forward', 'Traditional approach']
                },
                'Colliers': {
                    website: 'https://www.colliers.com',
                    marketShare: 0.12,
                    strengths: ['Entrepreneurial culture', 'Investment focus'],
                    weaknesses: ['Smaller platform', 'Less market data']
                }
            },
            
            // Minnesota regional players
            regional: {
                'Transwestern': {
                    strengths: ['Local relationships', 'Responsive service'],
                    weaknesses: ['Limited national reach', 'Smaller research team'],
                    notableBrokers: [],
                    recentDeals: []
                },
                'Ryan Companies': {
                    strengths: ['Development expertise', 'Design-build capability'],
                    weaknesses: ['Potential conflicts with development side'],
                    notableBrokers: []
                },
                'Colliers Minneapolis-St. Paul': {
                    strengths: ['Strong local team', 'Industrial expertise'],
                    weaknesses: ['Less office focus'],
                    notableBrokers: []
                },
                'Newmark': {
                    strengths: ['Growing presence', 'Aggressive pricing'],
                    weaknesses: ['Newer to market', 'Building reputation'],
                    notableBrokers: []
                }
            },
            
            // Boutique firms
            boutique: {
                'Welsh Companies': {
                    focus: 'Medical/Healthcare',
                    strengths: ['Specialized expertise', 'Healthcare relationships'],
                    weaknesses: ['Limited to healthcare']
                },
                'Parkway Commercial': {
                    focus: 'Small-mid market',
                    strengths: ['Personalized service', 'Flexible fees'],
                    weaknesses: ['Limited resources']
                },
                'Midway Group': {
                    focus: 'Creative/Tech',
                    strengths: ['Startup relationships', 'Creative spaces'],
                    weaknesses: ['Niche market only']
                }
            }
        };
        
        this.intelligenceSources = {
            pressReleases: [
                'https://www.cbre.us/about/media-center',
                'https://www.us.jll.com/en/newsroom',
                'https://www.cushmanwakefield.com/en/news',
                'https://www.colliers.com/news'
            ],
            industryNews: [
                'https://www.bisnow.com/minneapolis-st-paul',
                'https://www.finance-commerce.com',
                'https://www.bizjournals.com/twincities/news/commercial-real-estate'
            ],
            socialMedia: {
                linkedin: {
                    searchQueries: [
                        'tenant representation Minneapolis',
                        'commercial real estate broker Minnesota',
                        'office leasing Twin Cities'
                    ]
                },
                twitter: ['@CBRE', '@JLLNews', '@CushWake', '@ColliersUS']
            }
        };
        
        this.dealTracking = new Map();
        this.brokerProfiles = new Map();
    }

    // Scrape competitor deal announcements
    async scrapeCompetitorDeals() {
        console.log('🕵️ Gathering Competitive Intelligence...\n');
        
        const deals = [];
        
        // In production, would actually scrape these sites
        // For demo, showing what we'd find
        const sampleDeals = [
            {
                broker: 'CBRE',
                client: 'Tech Company ABC',
                size: 45000,
                location: 'Downtown Minneapolis',
                type: 'New Lease',
                date: '2024-01-15',
                brokerName: 'John Smith',
                intelligence: 'Client downsizing from 60k SF - cost cutting'
            },
            {
                broker: 'JLL',
                client: 'Finance Corp XYZ',
                size: 30000,
                location: 'Edina',
                type: 'Renewal',
                date: '2024-01-10',
                brokerName: 'Jane Doe',
                intelligence: 'Renewed early with 20% rent reduction'
            },
            {
                broker: 'Cushman & Wakefield',
                client: 'Healthcare Group',
                size: 75000,
                location: 'Bloomington',
                type: 'Relocation',
                date: '2024-01-08',
                brokerName: 'Bob Johnson',
                intelligence: 'Moving from Minneapolis - seeking parking'
            },
            {
                broker: 'Colliers',
                client: 'Manufacturing Co',
                size: 150000,
                location: 'Brooklyn Park',
                type: 'Expansion',
                date: '2024-01-05',
                brokerName: 'Sarah Williams',
                intelligence: 'Adding distribution facility'
            }
        ];
        
        // Process and enrich deals
        for (const deal of sampleDeals) {
            const enriched = await this.enrichDealIntelligence(deal);
            deals.push(enriched);
            this.dealTracking.set(`${deal.client}-${deal.date}`, enriched);
        }
        
        return deals;
    }

    // Enrich deal with additional intelligence
    async enrichDealIntelligence(deal) {
        // Calculate metrics
        deal.estimatedCommission = deal.size * 25 * 0.06; // Assume $25/SF avg, 6% commission
        deal.dealValue = deal.size * 25 * 5; // 5-year lease value
        
        // Analyze competitive implications
        deal.implications = this.analyzeImplications(deal);
        
        // Identify opportunities
        deal.opportunities = this.identifyOpportunities(deal);
        
        return deal;
    }

    // Analyze what competitor deals mean for us
    analyzeImplications(deal) {
        const implications = [];
        
        if (deal.type === 'Renewal' && deal.intelligence.includes('reduction')) {
            implications.push('Market softening - opportunity for aggressive proposals');
        }
        
        if (deal.type === 'Relocation') {
            implications.push(`Vacancy created at previous location - potential sublease opportunity`);
        }
        
        if (deal.size > 50000) {
            implications.push('Large tenant movement - check for related company moves');
        }
        
        if (deal.broker === 'CBRE' || deal.broker === 'JLL') {
            implications.push('Big firm involved - emphasize personalized service in competing');
        }
        
        return implications;
    }

    // Identify opportunities from competitor activity
    identifyOpportunities(deal) {
        const opportunities = [];
        
        // Related companies
        opportunities.push({
            type: 'Related Company',
            action: `Research ${deal.client}'s subsidiaries/partners for similar needs`
        });
        
        // Vacated space
        if (deal.type === 'Relocation') {
            opportunities.push({
                type: 'Backfill Opportunity',
                action: 'Contact landlord about repping vacated space'
            });
        }
        
        // Competitive displacement
        opportunities.push({
            type: 'Competitive Approach',
            action: `Identify similar companies not using ${deal.broker}`
        });
        
        return opportunities;
    }

    // Track individual broker competitors
    async trackCompetitorBrokers(market = 'Minneapolis') {
        console.log('👥 Profiling Competitor Brokers...\n');
        
        const profiles = [
            {
                name: 'John Smith',
                firm: 'CBRE',
                specialization: 'Office - Fortune 500',
                years: 15,
                estimatedDeals: 25,
                avgDealSize: 50000,
                strengths: ['C-suite relationships', 'Financial analysis'],
                weaknesses: ['Slow response time', 'High commission expectations'],
                clients: ['Target Corp', '3M', 'US Bank'],
                strategy: 'Relationship-based, long sales cycle'
            },
            {
                name: 'Sarah Johnson',
                firm: 'JLL',
                specialization: 'Tech Companies',
                years: 8,
                estimatedDeals: 40,
                avgDealSize: 25000,
                strengths: ['Tech sector knowledge', 'Creative solutions'],
                weaknesses: ['Limited industrial experience'],
                clients: ['Tech startups', 'Software companies'],
                strategy: 'Workplace strategy focus'
            },
            {
                name: 'Mike Williams',
                firm: 'Colliers',
                specialization: 'Industrial',
                years: 20,
                estimatedDeals: 30,
                avgDealSize: 100000,
                strengths: ['Industrial expertise', 'Logistics knowledge'],
                weaknesses: ['Less office experience'],
                clients: ['Amazon vendors', 'Distribution companies'],
                strategy: 'Supply chain optimization'
            },
            {
                name: 'Lisa Chen',
                firm: 'Transwestern',
                specialization: 'Healthcare',
                years: 12,
                estimatedDeals: 20,
                avgDealSize: 35000,
                strengths: ['Healthcare regulations', 'Medical buildouts'],
                weaknesses: ['Narrow focus'],
                clients: ['HealthPartners', 'Allina', 'Clinics'],
                strategy: 'Compliance and specialized buildout'
            }
        ];
        
        // Store profiles
        profiles.forEach(profile => {
            this.brokerProfiles.set(profile.name, profile);
        });
        
        return profiles;
    }

    // Generate win strategy against specific competitor
    generateWinStrategy(competitorName, clientType, dealSize) {
        const competitor = this.findCompetitor(competitorName);
        if (!competitor) return null;
        
        const strategy = {
            competitor: competitorName,
            ourAdvantages: [],
            tactics: [],
            messaging: [],
            pricing: null
        };
        
        // Identify our advantages
        if (competitor.weaknesses) {
            competitor.weaknesses.forEach(weakness => {
                if (weakness.includes('High fees') || weakness.includes('Expensive')) {
                    strategy.ourAdvantages.push('More competitive fee structure');
                    strategy.tactics.push('Propose performance-based fees');
                }
                if (weakness.includes('Slow') || weakness.includes('bureaucracy')) {
                    strategy.ourAdvantages.push('Faster decision making');
                    strategy.tactics.push('Guarantee 24-hour response time');
                }
                if (weakness.includes('Less personalized')) {
                    strategy.ourAdvantages.push('Dedicated personal attention');
                    strategy.tactics.push('Offer weekly updates and direct cell access');
                }
            });
        }
        
        // Develop messaging
        if (dealSize < 25000) {
            strategy.messaging.push('You\'re not just another deal to us - you\'re our priority');
        }
        if (clientType === 'Tech') {
            strategy.messaging.push('We understand agile companies need agile brokers');
        }
        if (clientType === 'Local') {
            strategy.messaging.push('Local expertise beats national bureaucracy');
        }
        
        // Pricing strategy
        if (competitorName === 'CBRE' || competitorName === 'JLL') {
            strategy.pricing = 'Offer 4.5% vs their standard 6% commission';
        } else {
            strategy.pricing = 'Match pricing but emphasize value-adds';
        }
        
        return strategy;
    }

    // Find competitor by name
    findCompetitor(name) {
        for (const category of Object.values(this.competitors)) {
            if (category[name]) return category[name];
        }
        return null;
    }

    // Monitor competitor marketing campaigns
    async monitorCompetitorMarketing() {
        console.log('📢 Monitoring Competitor Marketing...\n');
        
        const campaigns = [
            {
                competitor: 'CBRE',
                campaign: 'Future of Work 2024',
                message: 'Hybrid workplace solutions',
                target: 'Large corporations',
                ourCounter: 'Personalized workplace strategies for YOUR company, not cookie-cutter'
            },
            {
                competitor: 'JLL',
                campaign: 'Sustainability Focus',
                message: 'Green building certifications',
                target: 'ESG-conscious companies',
                ourCounter: 'Find savings AND sustainability - we do both'
            },
            {
                competitor: 'Cushman & Wakefield',
                campaign: 'Experience per Square Foot',
                message: 'Workplace experience',
                target: 'Tech and creative companies',
                ourCounter: 'Real savings per square foot - experience AND economics'
            }
        ];
        
        return campaigns;
    }

    // Generate competitive intelligence report
    async generateCompetitiveReport() {
        const deals = await this.scrapeCompetitorDeals();
        const brokers = await this.trackCompetitorBrokers();
        const campaigns = await this.monitorCompetitorMarketing();
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Competitive Intelligence Report</title>
    <style>
        body { 
            font-family: -apple-system, sans-serif; 
            margin: 20px; 
            background: #0a0a0a; 
            color: #fff; 
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            padding: 2rem; 
            border-radius: 12px; 
            margin-bottom: 2rem;
        }
        .section { 
            background: rgba(255,255,255,0.05); 
            padding: 1.5rem; 
            margin: 1rem 0; 
            border-radius: 12px; 
            border: 1px solid rgba(255,255,255,0.1);
        }
        .deal-card { 
            background: rgba(255,255,255,0.03); 
            padding: 1rem; 
            margin: 0.5rem 0; 
            border-radius: 8px;
            border-left: 3px solid #667eea;
        }
        .broker-profile { 
            background: rgba(255,255,255,0.03); 
            padding: 1rem; 
            margin: 0.5rem 0; 
            border-radius: 8px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }
        .opportunity { 
            background: rgba(16, 185, 129, 0.1); 
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 0.75rem; 
            margin: 0.5rem 0; 
            border-radius: 6px;
        }
        .metric { 
            display: inline-block; 
            padding: 0.25rem 0.75rem; 
            background: rgba(255,255,255,0.1); 
            border-radius: 4px; 
            margin-right: 0.5rem;
            font-size: 0.875rem;
        }
        h2 { color: #667eea; }
        h3 { color: #fff; margin-top: 1.5rem; }
        .implications { color: #fbbf24; }
        .action { color: #10b981; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🕵️ Competitive Intelligence Report</h1>
        <p>Real-time competitor analysis and opportunity identification</p>
    </div>
    
    <div class="section">
        <h2>Recent Competitor Deals</h2>
        ${deals.map(deal => `
            <div class="deal-card">
                <h3>${deal.broker} - ${deal.client}</h3>
                <div>
                    <span class="metric">${deal.size.toLocaleString()} SF</span>
                    <span class="metric">${deal.type}</span>
                    <span class="metric">${deal.location}</span>
                    <span class="metric">Est. Commission: $${(deal.estimatedCommission/1000).toFixed(0)}k</span>
                </div>
                <p style="margin-top: 0.5rem; color: #9ca3af;">${deal.intelligence}</p>
                <div class="implications">Implications: ${deal.implications.join('; ')}</div>
                ${deal.opportunities.map(opp => `
                    <div class="opportunity">
                        <span class="action">ACTION:</span> ${opp.action}
                    </div>
                `).join('')}
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <h2>Competitor Broker Profiles</h2>
        ${brokers.map(broker => `
            <div class="broker-profile">
                <div>
                    <h3>${broker.name} - ${broker.firm}</h3>
                    <p>Specialization: ${broker.specialization}</p>
                    <p>Experience: ${broker.years} years</p>
                    <p>Avg Deal: ${(broker.avgDealSize/1000).toFixed(0)}k SF</p>
                </div>
                <div>
                    <p><strong>Strengths:</strong> ${broker.strengths.join(', ')}</p>
                    <p><strong>Weaknesses:</strong> ${broker.weaknesses.join(', ')}</p>
                    <p><strong>Key Clients:</strong> ${broker.clients.join(', ')}</p>
                </div>
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <h2>Competitor Marketing Campaigns</h2>
        ${campaigns.map(camp => `
            <div class="deal-card">
                <h3>${camp.competitor}: "${camp.campaign}"</h3>
                <p>Message: ${camp.message}</p>
                <p>Target: ${camp.target}</p>
                <div class="opportunity">
                    <span class="action">OUR COUNTER:</span> ${camp.ourCounter}
                </div>
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <h2>Market Share Analysis</h2>
        <ul>
            <li>CBRE: 28% - Vulnerable on price and personalization</li>
            <li>JLL: 22% - Slow decision making is their weakness</li>
            <li>Cushman & Wakefield: 18% - Less tech-forward</li>
            <li>Colliers: 12% - Growing but still building</li>
            <li><strong>Opportunity: 20% of market uses smaller firms - prime for conversion</strong></li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Win Strategies</h2>
        <div class="opportunity">
            <h3>Against CBRE/JLL:</h3>
            <ul>
                <li>Emphasize speed and personal attention</li>
                <li>Offer 4.5% commission vs their 6%</li>
                <li>Guarantee 24-hour response time</li>
                <li>Provide direct cell phone access</li>
            </ul>
        </div>
        <div class="opportunity">
            <h3>Against Regional Players:</h3>
            <ul>
                <li>Highlight technology advantages</li>
                <li>Show portfolio company capabilities</li>
                <li>Demonstrate market intelligence</li>
                <li>Offer more comprehensive services</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
        
        await fs.mkdir('./competitive-intel', { recursive: true });
        await fs.writeFile('./competitive-intel/report.html', html);
        
        return {
            deals,
            brokers,
            campaigns
        };
    }

    // Monitor win/loss ratios
    trackWinLoss(opportunity, competitor, result, reason) {
        const record = {
            date: new Date(),
            client: opportunity.client,
            size: opportunity.size,
            competitor,
            result,
            reason,
            lessons: this.extractLessons(result, reason)
        };
        
        // Store for analysis
        const key = `${competitor}-${result}`;
        if (!this.winLossRecords) this.winLossRecords = new Map();
        
        if (!this.winLossRecords.has(key)) {
            this.winLossRecords.set(key, []);
        }
        this.winLossRecords.get(key).push(record);
        
        return record;
    }

    // Extract lessons from wins and losses
    extractLessons(result, reason) {
        const lessons = [];
        
        if (result === 'WIN') {
            if (reason.includes('price')) {
                lessons.push('Price competitiveness remains key differentiator');
            }
            if (reason.includes('service') || reason.includes('attention')) {
                lessons.push('Personal service beats big firm bureaucracy');
            }
            if (reason.includes('speed') || reason.includes('quick')) {
                lessons.push('Fast response time critical for winning');
            }
        } else if (result === 'LOSS') {
            if (reason.includes('relationship')) {
                lessons.push('Need to build relationships earlier in process');
            }
            if (reason.includes('resources') || reason.includes('team')) {
                lessons.push('Consider partnering for larger opportunities');
            }
            if (reason.includes('experience')) {
                lessons.push('Build more case studies in this sector');
            }
        }
        
        return lessons;
    }
}

// Run competitive intelligence gathering
async function runCompetitiveIntel() {
    const intel = new CompetitiveIntelligence();
    
    console.log('🕵️ COMPETITIVE INTELLIGENCE SYSTEM\n');
    console.log('=' .repeat(50));
    
    // Generate comprehensive report
    const report = await intel.generateCompetitiveReport();
    
    console.log('\n📊 INTELLIGENCE SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Recent Competitor Deals: ${report.deals.length}`);
    console.log(`Competitor Brokers Tracked: ${report.brokers.length}`);
    console.log(`Marketing Campaigns Monitored: ${report.campaigns.length}`);
    
    console.log('\n🎯 KEY OPPORTUNITIES:');
    report.deals.slice(0, 3).forEach((deal, i) => {
        console.log(`${i+1}. ${deal.client} space available after ${deal.broker} relocation`);
    });
    
    console.log('\n💡 COMPETITIVE ADVANTAGES:');
    console.log('• 25-40% lower fees than CBRE/JLL');
    console.log('• 24-hour response guarantee');
    console.log('• AI-powered market intelligence');
    console.log('• Portfolio optimization capabilities');
    
    console.log('\n✅ Report saved to: competitive-intel/report.html');
    
    return report;
}

module.exports = { CompetitiveIntelligence, runCompetitiveIntel };

// Run if called directly
if (require.main === module) {
    runCompetitiveIntel().catch(console.error);
}