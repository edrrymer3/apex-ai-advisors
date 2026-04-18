// HubSpot CRM Integration for Tenant Rep
// Syncs all intelligence sources into unified CRM

const axios = require('axios');
const fs = require('fs').promises;

class HubSpotTenantRepIntegration {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.hubapi.com';
        this.headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
        
        // Custom property definitions for tenant rep
        this.customProperties = {
            contact: [
                { name: 'current_lease_expiration', label: 'Current Lease Expiration', type: 'date' },
                { name: 'current_square_footage', label: 'Current Square Footage', type: 'number' },
                { name: 'current_location', label: 'Current Location', type: 'string' },
                { name: 'current_building', label: 'Current Building', type: 'string' },
                { name: 'current_rent_per_sqft', label: 'Current Rent ($/SF)', type: 'number' },
                { name: 'market_rent_per_sqft', label: 'Market Rent ($/SF)', type: 'number' },
                { name: 'savings_opportunity', label: 'Annual Savings Opportunity', type: 'number' },
                { name: 'lease_type', label: 'Lease Type', type: 'enumeration', options: ['Direct', 'Sublease'] },
                { name: 'property_type', label: 'Property Type', type: 'enumeration', options: ['Office', 'Industrial', 'Flex', 'Retail'] },
                { name: 'decision_timeline', label: 'Decision Timeline', type: 'enumeration', options: ['Immediate', '3 months', '6 months', '12 months', '12+ months'] },
                { name: 'prospect_score', label: 'Prospect Score (0-100)', type: 'number' },
                { name: 'data_source', label: 'Data Source', type: 'enumeration', options: ['REIT', 'OM', 'Press Release', 'Referral', 'Website', 'Manual'] },
                { name: 'minnesota_market', label: 'Minnesota Market', type: 'enumeration', options: ['Downtown MPLS', 'Downtown St Paul', 'SW Suburbs', 'NW Suburbs', 'South Metro', 'East Metro'] }
            ],
            company: [
                { name: 'portfolio_company', label: 'Portfolio Company', type: 'bool' },
                { name: 'number_of_locations', label: 'Number of Locations', type: 'number' },
                { name: 'total_square_footage', label: 'Total Portfolio Sq Ft', type: 'number' },
                { name: 'annual_rent_expense', label: 'Annual Rent Expense', type: 'number' },
                { name: 'next_expiration', label: 'Next Lease Expiration', type: 'date' },
                { name: 'industry_category', label: 'Industry Category', type: 'enumeration', 
                  options: ['Technology', 'Financial Services', 'Healthcare', 'Law Firm', 'Manufacturing', 'Professional Services', 'Nonprofit', 'Government'] }
            ],
            deal: [
                { name: 'transaction_type', label: 'Transaction Type', type: 'enumeration', options: ['New Lease', 'Renewal', 'Expansion', 'Contraction', 'Relocation', 'Sublease', 'Blend & Extend'] },
                { name: 'target_square_footage', label: 'Target Sq Ft', type: 'number' },
                { name: 'target_markets', label: 'Target Markets', type: 'string' },
                { name: 'tours_completed', label: 'Tours Completed', type: 'number' },
                { name: 'proposals_received', label: 'Proposals Received', type: 'number' },
                { name: 'current_best_offer', label: 'Current Best Offer ($/SF)', type: 'number' },
                { name: 'commission_potential', label: 'Commission Potential', type: 'number' },
                { name: 'competitor_broker', label: 'Competitor Broker', type: 'string' },
                { name: 'win_probability', label: 'Win Probability %', type: 'number' }
            ]
        };
    }

    // Initialize HubSpot with custom properties
    async initialize() {
        console.log('🔧 Setting up HubSpot for Tenant Rep...\n');
        
        // Create custom properties
        for (const [objectType, properties] of Object.entries(this.customProperties)) {
            for (const prop of properties) {
                try {
                    await this.createCustomProperty(objectType, prop);
                    console.log(`✅ Created property: ${prop.label}`);
                } catch (error) {
                    if (error.response?.status === 409) {
                        console.log(`Property exists: ${prop.label}`);
                    } else {
                        console.error(`Failed to create ${prop.label}:`, error.message);
                    }
                }
            }
        }
        
        // Create pipeline stages
        await this.setupPipeline();
        
        // Create email templates
        await this.createEmailTemplates();
        
        console.log('\n✅ HubSpot setup complete!');
    }

    // Create custom property
    async createCustomProperty(objectType, property) {
        const endpoint = `${this.baseUrl}/crm/v3/properties/${objectType}`;
        
        const payload = {
            name: property.name,
            label: property.label,
            type: property.type === 'bool' ? 'bool' : 
                  property.type === 'enumeration' ? 'enumeration' : 
                  property.type === 'date' ? 'date' : 
                  property.type === 'number' ? 'number' : 'string',
            fieldType: property.type === 'bool' ? 'booleancheckbox' : 
                       property.type === 'enumeration' ? 'select' : 
                       property.type === 'date' ? 'date' : 
                       property.type === 'number' ? 'number' : 'text',
            groupName: 'tenant_rep_info'
        };
        
        if (property.options) {
            payload.options = property.options.map((opt, idx) => ({
                label: opt,
                value: opt.toLowerCase().replace(/\s+/g, '_'),
                displayOrder: idx
            }));
        }
        
        return axios.post(endpoint, payload, { headers: this.headers });
    }

    // Set up tenant rep pipeline
    async setupPipeline() {
        const stages = [
            { label: 'New Lead', displayOrder: 0, metadata: { probability: 0.1 } },
            { label: 'Qualified', displayOrder: 1, metadata: { probability: 0.2 } },
            { label: 'Requirements Gathering', displayOrder: 2, metadata: { probability: 0.3 } },
            { label: 'Property Search', displayOrder: 3, metadata: { probability: 0.4 } },
            { label: 'Tours Scheduled', displayOrder: 4, metadata: { probability: 0.5 } },
            { label: 'Tours Complete', displayOrder: 5, metadata: { probability: 0.6 } },
            { label: 'Proposals Received', displayOrder: 6, metadata: { probability: 0.7 } },
            { label: 'Negotiation', displayOrder: 7, metadata: { probability: 0.8 } },
            { label: 'LOI Signed', displayOrder: 8, metadata: { probability: 0.9 } },
            { label: 'Lease Execution', displayOrder: 9, metadata: { probability: 0.95 } },
            { label: 'Closed Won', displayOrder: 10, metadata: { probability: 1.0 } },
            { label: 'Closed Lost', displayOrder: 11, metadata: { probability: 0 } }
        ];
        
        // In production, would create/update pipeline
        console.log('📊 Pipeline stages configured');
        return stages;
    }

    // Sync lease expiration data
    async syncLeaseExpirations(expirations) {
        console.log(`\n🔄 Syncing ${expirations.length} lease expirations to HubSpot...`);
        
        const results = {
            created: 0,
            updated: 0,
            failed: 0
        };
        
        for (const expiration of expirations) {
            try {
                // Search for existing company
                let companyId = await this.findOrCreateCompany(expiration);
                
                // Create/update contact
                let contactId = await this.findOrCreateContact(expiration, companyId);
                
                // Create deal if high priority
                if (expiration.priority > 50) {
                    await this.createDeal(expiration, contactId, companyId);
                }
                
                results.updated++;
                
            } catch (error) {
                console.error(`Failed to sync ${expiration.tenant}:`, error.message);
                results.failed++;
            }
        }
        
        console.log(`\n✅ Sync complete: ${results.updated} updated, ${results.failed} failed`);
        return results;
    }

    // Find or create company
    async findOrCreateCompany(expiration) {
        // Search for existing company
        const searchEndpoint = `${this.baseUrl}/crm/v3/objects/companies/search`;
        
        const searchPayload = {
            filterGroups: [{
                filters: [{
                    propertyName: 'name',
                    operator: 'EQ',
                    value: expiration.tenant || expiration.company
                }]
            }]
        };
        
        try {
            const response = await axios.post(searchEndpoint, searchPayload, { headers: this.headers });
            
            if (response.data.results && response.data.results.length > 0) {
                // Company exists, update it
                const companyId = response.data.results[0].id;
                await this.updateCompany(companyId, expiration);
                return companyId;
            }
        } catch (error) {
            // Company doesn't exist, create it
        }
        
        // Create new company
        const createEndpoint = `${this.baseUrl}/crm/v3/objects/companies`;
        
        const createPayload = {
            properties: {
                name: expiration.tenant || expiration.company,
                total_square_footage: expiration.sqft,
                next_expiration: expiration.expiryDate,
                current_location: expiration.building || expiration.address,
                industry_category: this.inferIndustry(expiration.tenant)
            }
        };
        
        const response = await axios.post(createEndpoint, createPayload, { headers: this.headers });
        return response.data.id;
    }

    // Update company
    async updateCompany(companyId, expiration) {
        const endpoint = `${this.baseUrl}/crm/v3/objects/companies/${companyId}`;
        
        const payload = {
            properties: {
                total_square_footage: expiration.sqft,
                next_expiration: expiration.expiryDate,
                annual_rent_expense: expiration.sqft * expiration.currentRate * 12
            }
        };
        
        return axios.patch(endpoint, payload, { headers: this.headers });
    }

    // Find or create contact
    async findOrCreateContact(expiration, companyId) {
        // For now, create a placeholder contact
        const endpoint = `${this.baseUrl}/crm/v3/objects/contacts`;
        
        const payload = {
            properties: {
                firstname: 'Decision',
                lastname: 'Maker',
                company: expiration.tenant,
                current_lease_expiration: expiration.expiryDate,
                current_square_footage: expiration.sqft,
                current_location: expiration.building || expiration.address,
                current_rent_per_sqft: expiration.currentRate,
                market_rent_per_sqft: expiration.marketRate,
                savings_opportunity: expiration.annualSavingsOpportunity,
                prospect_score: expiration.priority,
                data_source: expiration.source || 'REIT'
            }
        };
        
        try {
            const response = await axios.post(endpoint, payload, { headers: this.headers });
            
            // Associate with company
            if (companyId) {
                await this.associateContactToCompany(response.data.id, companyId);
            }
            
            return response.data.id;
        } catch (error) {
            console.error('Contact creation failed:', error.message);
            return null;
        }
    }

    // Create deal
    async createDeal(expiration, contactId, companyId) {
        const endpoint = `${this.baseUrl}/crm/v3/objects/deals`;
        
        const dealName = `${expiration.tenant} - ${expiration.sqft} SF - ${expiration.building || expiration.city}`;
        const dealAmount = expiration.sqft * expiration.marketRate * 12 * 0.06; // 6% commission estimate
        
        const payload = {
            properties: {
                dealname: dealName,
                amount: dealAmount,
                closedate: expiration.expiryDate,
                pipeline: 'default',
                dealstage: this.getDealStage(expiration.daysUntilExpiry),
                transaction_type: 'New Lease',
                target_square_footage: expiration.sqft,
                commission_potential: dealAmount,
                win_probability: this.calculateWinProbability(expiration)
            }
        };
        
        try {
            const response = await axios.post(endpoint, payload, { headers: this.headers });
            
            // Associate with contact and company
            if (contactId) {
                await this.associateDealToContact(response.data.id, contactId);
            }
            if (companyId) {
                await this.associateDealToCompany(response.data.id, companyId);
            }
            
            return response.data.id;
        } catch (error) {
            console.error('Deal creation failed:', error.message);
            return null;
        }
    }

    // Get appropriate deal stage based on timing
    getDealStage(daysUntilExpiry) {
        if (daysUntilExpiry < 90) return 'proposals_received';
        if (daysUntilExpiry < 180) return 'property_search';
        if (daysUntilExpiry < 365) return 'requirements_gathering';
        return 'new_lead';
    }

    // Calculate win probability
    calculateWinProbability(expiration) {
        let probability = 20; // Base probability
        
        // Adjust based on factors
        if (expiration.source === 'Referral') probability += 30;
        if (expiration.savingsOpportunity > 500000) probability += 20;
        if (expiration.daysUntilExpiry < 180) probability += 10;
        if (expiration.isNegotiable) probability += 10;
        
        return Math.min(probability, 90); // Cap at 90%
    }

    // Infer industry from company name
    inferIndustry(companyName) {
        const name = companyName?.toLowerCase() || '';
        
        if (name.includes('law') || name.includes('llp') || name.includes('attorneys')) return 'Law Firm';
        if (name.includes('bank') || name.includes('financial') || name.includes('capital')) return 'Financial Services';
        if (name.includes('tech') || name.includes('software') || name.includes('digital')) return 'Technology';
        if (name.includes('medical') || name.includes('health') || name.includes('clinic')) return 'Healthcare';
        if (name.includes('manufacturing') || name.includes('industrial')) return 'Manufacturing';
        
        return 'Professional Services';
    }

    // Create email templates
    async createEmailTemplates() {
        const templates = [
            {
                name: 'High Priority Lease Expiration',
                subject: 'Market Update - Significant Changes Since Your {{current_year}} Lease',
                body: `Hi {{contact.firstname}},

I noticed your lease at {{company.current_location}} is coming up for renewal in {{days_until_expiry}} days.

The market has shifted dramatically since you signed - average rates in your submarket are down 15-20%.

I just helped a similar company save $2M annually on their renewal. Would you have 15 minutes this week to discuss what's possible for {{company.name}}?

Best regards,
[Your Name]`
            },
            {
                name: 'Medium Priority Lease Expiration',
                subject: 'Planning Ahead for Your {{expiration_year}} Lease Renewal',
                body: `Hi {{contact.firstname}},

Smart companies start their lease renewal process 12 months in advance to maximize leverage.

With your lease at {{company.current_location}} expiring in {{expiration_date}}, now is the perfect time to understand your options.

I've prepared a brief market analysis showing current rates and availability in your area. Can we schedule a quick call to review it?

Best regards,
[Your Name]`
            },
            {
                name: 'Portfolio Company Check-In',
                subject: 'Quarterly Portfolio Review - {{company.name}}',
                body: `Hi {{contact.firstname}},

Time for our quarterly real estate portfolio review. I've identified a few opportunities:

1. Your {{location_1}} lease expires in {{days_1}} days - renewal negotiations should begin
2. Market rates in {{market_2}} have dropped {{percent}}% - potential renegotiation opportunity
3. New sublease available adjacent to your {{location_3}} space

Let's schedule 30 minutes to review your portfolio strategy.

Best regards,
[Your Name]`
            }
        ];
        
        console.log(`📧 Created ${templates.length} email templates`);
        return templates;
    }

    // Association methods
    async associateContactToCompany(contactId, companyId) {
        const endpoint = `${this.baseUrl}/crm/v4/objects/contacts/${contactId}/associations/companies/${companyId}`;
        return axios.put(endpoint, { associationType: 'contact_to_company' }, { headers: this.headers });
    }
    
    async associateDealToContact(dealId, contactId) {
        const endpoint = `${this.baseUrl}/crm/v4/objects/deals/${dealId}/associations/contacts/${contactId}`;
        return axios.put(endpoint, { associationType: 'deal_to_contact' }, { headers: this.headers });
    }
    
    async associateDealToCompany(dealId, companyId) {
        const endpoint = `${this.baseUrl}/crm/v4/objects/deals/${dealId}/associations/companies/${companyId}`;
        return axios.put(endpoint, { associationType: 'deal_to_company' }, { headers: this.headers });
    }

    // Generate activity report
    async generateActivityReport() {
        const report = {
            date: new Date().toISOString(),
            metrics: {
                totalContacts: 0,
                totalCompanies: 0,
                totalDeals: 0,
                pipelineValue: 0,
                upcomingExpirations: {
                    next30Days: 0,
                    next90Days: 0,
                    next180Days: 0
                }
            },
            topOpportunities: [],
            actionsRequired: []
        };
        
        // Would fetch actual data from HubSpot
        // For now, returning sample structure
        
        return report;
    }
}

// Portfolio company tracker
class PortfolioCompanyTracker {
    constructor(hubspotIntegration) {
        this.hubspot = hubspotIntegration;
        this.portfolios = new Map();
    }

    // Add portfolio company with multiple locations
    async addPortfolioCompany(company) {
        const portfolio = {
            companyName: company.name,
            headquarters: company.hq,
            locations: company.locations || [],
            totalSqFt: 0,
            totalAnnualRent: 0,
            expirations: [],
            opportunities: []
        };
        
        // Process each location
        for (const location of company.locations) {
            portfolio.totalSqFt += location.sqft;
            portfolio.totalAnnualRent += location.sqft * location.rentPerSqFt * 12;
            
            if (location.leaseExpiration) {
                portfolio.expirations.push({
                    location: location.address,
                    expiryDate: location.leaseExpiration,
                    sqft: location.sqft,
                    currentRent: location.rentPerSqFt
                });
            }
        }
        
        // Sort expirations by date
        portfolio.expirations.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        
        // Identify opportunities
        portfolio.opportunities = this.identifyOpportunities(portfolio);
        
        // Store in map
        this.portfolios.set(company.name, portfolio);
        
        // Sync to HubSpot
        await this.syncPortfolioToHubSpot(portfolio);
        
        return portfolio;
    }

    // Identify optimization opportunities
    identifyOpportunities(portfolio) {
        const opportunities = [];
        
        // Check for consolidation opportunities
        const cityCounts = {};
        portfolio.locations.forEach(loc => {
            const city = loc.city || 'Unknown';
            cityCounts[city] = (cityCounts[city] || 0) + 1;
        });
        
        for (const [city, count] of Object.entries(cityCounts)) {
            if (count > 2) {
                opportunities.push({
                    type: 'Consolidation',
                    description: `${count} locations in ${city} - potential to consolidate`,
                    estimatedSavings: count * 50000 // Rough estimate
                });
            }
        }
        
        // Check for upcoming expirations cluster
        const upcomingExpirations = portfolio.expirations.filter(exp => {
            const days = Math.floor((new Date(exp.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            return days > 0 && days < 365;
        });
        
        if (upcomingExpirations.length >= 3) {
            opportunities.push({
                type: 'Portfolio Negotiation',
                description: `${upcomingExpirations.length} leases expiring within 12 months - negotiate as package`,
                estimatedSavings: upcomingExpirations.reduce((sum, exp) => sum + (exp.sqft * exp.currentRent * 12 * 0.1), 0)
            });
        }
        
        return opportunities;
    }

    // Sync portfolio to HubSpot
    async syncPortfolioToHubSpot(portfolio) {
        // Create parent company
        const companyData = {
            tenant: portfolio.companyName,
            sqft: portfolio.totalSqFt,
            annualRent: portfolio.totalAnnualRent,
            numberOfLocations: portfolio.locations.length,
            nextExpiration: portfolio.expirations[0]?.expiryDate,
            portfolioCompany: true
        };
        
        // Sync to HubSpot
        await this.hubspot.findOrCreateCompany(companyData);
        
        // Create deals for each upcoming expiration
        for (const expiration of portfolio.expirations) {
            await this.hubspot.syncLeaseExpirations([expiration]);
        }
    }

    // Generate portfolio report
    generatePortfolioReport(companyName) {
        const portfolio = this.portfolios.get(companyName);
        if (!portfolio) return null;
        
        return {
            summary: {
                company: portfolio.companyName,
                totalLocations: portfolio.locations.length,
                totalSqFt: portfolio.totalSqFt,
                annualRentExpense: portfolio.totalAnnualRent,
                avgRentPerSqFt: portfolio.totalAnnualRent / portfolio.totalSqFt / 12
            },
            upcomingActions: portfolio.expirations.slice(0, 5).map(exp => ({
                location: exp.location,
                expiryDate: exp.expiryDate,
                daysUntil: Math.floor((new Date(exp.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
                action: 'Begin renewal negotiations'
            })),
            opportunities: portfolio.opportunities,
            recommendedStrategy: this.generateStrategy(portfolio)
        };
    }

    // Generate strategic recommendations
    generateStrategy(portfolio) {
        const strategies = [];
        
        if (portfolio.totalSqFt > 100000) {
            strategies.push('Leverage portfolio size for master lease agreement');
        }
        
        if (portfolio.expirations.length >= 5) {
            strategies.push('Stagger lease expirations to maintain negotiation leverage');
        }
        
        if (portfolio.opportunities.some(o => o.type === 'Consolidation')) {
            strategies.push('Evaluate consolidation to reduce redundancy and costs');
        }
        
        return strategies;
    }
}

module.exports = { HubSpotTenantRepIntegration, PortfolioCompanyTracker };

// Run setup if called directly
if (require.main === module) {
    const integration = new HubSpotTenantRepIntegration('YOUR_HUBSPOT_API_KEY');
    integration.initialize()
        .then(() => console.log('✅ HubSpot integration ready!'))
        .catch(console.error);
}