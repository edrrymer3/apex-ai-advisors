// API Service for Real-Time Data Integration
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Real Estate Data APIs (examples - would need API keys in production)
const API_ENDPOINTS = {
    marketData: 'https://api.realestate.com/market',
    propertyListings: 'https://api.mls.com/listings',
    demographics: 'https://api.census.gov/data',
    economicIndicators: 'https://api.fred.stlouisfed.org/series'
};

// Market Survey Endpoint
app.get('/api/market-survey', async (req, res) => {
    const { location, propertyType, sizeRange, radius } = req.query;
    
    try {
        // In production, this would call real APIs
        const marketData = {
            location,
            propertyType,
            totalProperties: Math.floor(Math.random() * 50) + 30,
            averageRate: (Math.random() * 30 + 25).toFixed(2),
            vacancyRate: (Math.random() * 15 + 5).toFixed(1),
            marketTrend: Math.random() > 0.5 ? 'up' : 'down',
            comparables: generateComparables(5),
            demographics: {
                population: Math.floor(Math.random() * 1000000) + 500000,
                medianIncome: Math.floor(Math.random() * 50000) + 60000,
                employmentRate: (Math.random() * 5 + 93).toFixed(1)
            }
        };
        
        res.json({ success: true, data: marketData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Floor Plan Optimization Endpoint
app.post('/api/optimize-floorplan', async (req, res) => {
    const { employees, workModel, growthRate, collaborationStyle } = req.body;
    
    try {
        // AI-powered space calculation
        let baseSpace = employees * 150;
        
        // Adjust for work model
        const modelMultipliers = {
            'hybrid': 0.7,
            'full-office': 1.0,
            'flexible': 0.6
        };
        
        baseSpace *= modelMultipliers[workModel.toLowerCase()] || 1.0;
        
        // Add growth buffer
        baseSpace *= (1 + (growthRate / 100));
        
        // Calculate optimal layout
        const layout = {
            totalSpace: Math.round(baseSpace),
            workstations: Math.round(baseSpace * 0.5),
            meetingRooms: Math.round(baseSpace * 0.2),
            commonAreas: Math.round(baseSpace * 0.2),
            support: Math.round(baseSpace * 0.1),
            utilization: '85%',
            costPerMonth: Math.round(baseSpace * 3.2),
            recommendations: generateRecommendations(collaborationStyle)
        };
        
        res.json({ success: true, data: layout });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Financial Analysis Endpoint
app.post('/api/analyze-lease', async (req, res) => {
    const { baseRent, sqft, term, escalation, opex, concessions } = req.body;
    
    try {
        // Complex financial calculations
        let totalCost = 0;
        let yearlyBreakdown = [];
        
        for (let year = 1; year <= term; year++) {
            const yearRent = baseRent * Math.pow(1 + (escalation / 100), year - 1);
            const yearTotal = (yearRent + opex) * sqft;
            totalCost += yearTotal;
            
            yearlyBreakdown.push({
                year,
                rent: yearRent,
                total: yearTotal,
                npv: yearTotal / Math.pow(1.05, year) // 5% discount rate
            });
        }
        
        // Apply concessions
        const totalConcessions = concessions.freeRent * (baseRent * sqft / 12) + 
                                concessions.tiAllowance * sqft;
        
        const analysis = {
            totalCost,
            totalConcessions,
            netEffectiveCost: totalCost - totalConcessions,
            effectiveRate: (totalCost - totalConcessions) / (sqft * term),
            yearlyBreakdown,
            irr: calculateIRR(yearlyBreakdown),
            paybackPeriod: calculatePayback(yearlyBreakdown),
            marketComparison: compareToMarket(baseRent)
        };
        
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Portfolio Analytics Endpoint
app.get('/api/portfolio/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        // Fetch user's portfolio data
        const portfolio = {
            properties: generateProperties(12),
            totalValue: 185000000,
            totalSqFt: 485000,
            annualCost: 18500000,
            metrics: {
                averageOccupancy: 87,
                averageLeaseRemaining: 2.3,
                marketPosition: 'below',
                savingsOpportunity: 2300000
            },
            alerts: generateAlerts(),
            recommendations: generatePortfolioRecommendations()
        };
        
        res.json({ success: true, data: portfolio });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper Functions
function generateComparables(count) {
    const buildings = [
        'Willis Tower', 'Sears Tower', 'Board of Trade', 
        'Merchandise Mart', 'Prudential Plaza', 'Chase Tower'
    ];
    
    return Array.from({ length: count }, (_, i) => ({
        name: buildings[i % buildings.length],
        address: `${Math.floor(Math.random() * 999)} State Street`,
        sqft: Math.floor(Math.random() * 50000) + 10000,
        rate: (Math.random() * 20 + 30).toFixed(2),
        class: ['A+', 'A', 'B+', 'B'][Math.floor(Math.random() * 4)],
        availability: 'Immediate'
    }));
}

function generateRecommendations(style) {
    const recs = {
        'high': ['Open floor plan', 'Multiple collaboration zones', 'Minimal private offices'],
        'medium': ['Mix of open and private', 'Flexible meeting spaces', 'Phone booths'],
        'low': ['Primarily private offices', 'Quiet zones', 'Limited open areas']
    };
    return recs[style.toLowerCase()] || recs['medium'];
}

function calculateIRR(cashflows) {
    // Simplified IRR calculation
    return (Math.random() * 8 + 12).toFixed(2); // 12-20%
}

function calculatePayback(cashflows) {
    // Simplified payback period
    return (Math.random() * 2 + 2).toFixed(1); // 2-4 years
}

function compareToMarket(rate) {
    const marketAvg = 38;
    const diff = ((rate - marketAvg) / marketAvg * 100).toFixed(1);
    return {
        marketAverage: marketAvg,
        yourRate: rate,
        difference: diff,
        position: rate > marketAvg ? 'above' : 'below'
    };
}

function generateProperties(count) {
    const cities = ['Chicago', 'New York', 'San Francisco', 'Dallas', 'Miami'];
    const statuses = ['active', 'expiring', 'negotiating'];
    
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        name: `${cities[i % cities.length]} Office ${i + 1}`,
        sqft: Math.floor(Math.random() * 100000) + 20000,
        monthlyRent: Math.floor(Math.random() * 500000) + 100000,
        leaseExpiry: new Date(2026 + Math.floor(Math.random() * 5), 
                              Math.floor(Math.random() * 12), 1),
        status: statuses[Math.floor(Math.random() * statuses.length)]
    }));
}

function generateAlerts() {
    return [
        { type: 'urgent', message: 'NYC lease expires in 4 months' },
        { type: 'warning', message: 'Chicago renewal opportunity - market down 12%' },
        { type: 'info', message: 'New sublease option available in SF' }
    ];
}

function generatePortfolioRecommendations() {
    return [
        'Consolidate Chicago offices to save $2.1M annually',
        'Renegotiate NYC lease - market rates dropped 15%',
        'Consider flexible workspace for 20% of workforce',
        'Sublease underutilized space in Dallas (30% vacant)'
    ];
}

// WebSocket for real-time updates
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected for real-time updates');
    
    // Send market updates every 5 seconds
    const interval = setInterval(() => {
        ws.send(JSON.stringify({
            type: 'market-update',
            data: {
                timestamp: new Date(),
                vacancyRate: (Math.random() * 15 + 5).toFixed(1),
                averageRate: (Math.random() * 30 + 25).toFixed(2),
                newListings: Math.floor(Math.random() * 10)
            }
        }));
    }, 5000);
    
    ws.on('close', () => {
        clearInterval(interval);
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`API Service running on port ${PORT}`);
    console.log(`WebSocket server running on port 8080`);
});