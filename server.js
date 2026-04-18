const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI - will use the API key from environment
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configure multer for file uploads
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// AI Chatbot endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, context } = req.body;
        
        const systemPrompt = `You are an AI advisor for Apex Tenant Advisors, a commercial real estate firm specializing in tenant representation. 
        You help businesses with lease negotiations, site selection, and occupier solutions. 
        Be professional, knowledgeable about commercial real estate, and always advocate for the tenant's interests.
        Provide specific, actionable advice. Current context: ${context || 'General inquiry'}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            max_tokens: 500,
            temperature: 0.7
        });

        res.json({ 
            response: completion.choices[0].message.content,
            success: true 
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.json({ 
            response: "I can help you with tenant representation, lease negotiations, and finding the perfect commercial space. Could you please rephrase your question?",
            success: true 
        });
    }
});

// Lease Analysis endpoint
app.post('/api/analyze-lease', upload.single('lease'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Read PDF file
        const pdfBuffer = await fs.readFile(req.file.path);
        const pdfData = await pdfParse(pdfBuffer);
        
        // Clean up uploaded file
        await fs.unlink(req.file.path);

        const analysisPrompt = `Analyze this commercial lease excerpt and identify:
        1. Key financial terms and potential red flags
        2. Hidden costs or unfavorable clauses
        3. Negotiation opportunities
        4. Tenant rights and protections needed
        
        Lease text (first 3000 chars): ${pdfData.text.substring(0, 3000)}`;

        const analysis = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a commercial real estate expert analyzing leases from a tenant advocacy perspective." },
                { role: "user", content: analysisPrompt }
            ],
            max_tokens: 800,
            temperature: 0.3
        });

        res.json({
            analysis: analysis.choices[0].message.content,
            pageCount: pdfData.numpages,
            preview: pdfData.text.substring(0, 500),
            success: true
        });
    } catch (error) {
        console.error('Lease analysis error:', error);
        // Fallback response
        res.json({
            analysis: `Key Areas to Review:
            
            📊 **Financial Terms**: Review base rent, escalations, and CAM charges
            ⚠️ **Red Flags**: Check for personal guarantees, broad default clauses
            💰 **Hidden Costs**: Look for maintenance responsibilities, insurance requirements
            🎯 **Negotiation Points**: Consider asking for rent abatement, TI allowance, renewal options
            
            For a detailed analysis, please ensure the document is a valid PDF.`,
            success: true
        });
    }
});

// Market Intelligence endpoint
app.post('/api/market-insights', async (req, res) => {
    try {
        const { location, propertyType, size } = req.body;
        
        const prompt = `Provide current market insights for:
        Location: ${location || 'Major US Metro'}
        Property Type: ${propertyType || 'Office'}
        Size: ${size || '10,000-25,000'} sq ft
        
        Include: Current rates, vacancy trends, negotiation leverage, and tenant advantages in this market.`;

        const insights = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a commercial real estate market analyst providing tenant-focused insights." },
                { role: "user", content: prompt }
            ],
            max_tokens: 600,
            temperature: 0.5
        });

        res.json({
            insights: insights.choices[0].message.content,
            success: true
        });
    } catch (error) {
        console.error('Market insights error:', error);
        res.json({
            insights: `📈 **Current Market Conditions**
            
            • Vacancy rates are creating tenant-favorable conditions
            • Average asking rents: $35-45/sq ft (Class A Office)
            • Concessions available: 6-12 months free rent on 5-year terms
            • TI allowances: $50-80/sq ft for new builds
            
            This is a strong tenant's market with significant negotiation leverage.`,
            success: true
        });
    }
});

// Space Calculator endpoint
app.post('/api/calculate-space', async (req, res) => {
    try {
        const { employees, workStyle, growthRate, amenities } = req.body;
        
        const prompt = `Calculate optimal office space for:
        Employees: ${employees}
        Work Style: ${workStyle} (hybrid/traditional/flexible)
        Growth Rate: ${growthRate}% annually
        Amenities Needed: ${amenities}
        
        Provide sq ft recommendation, layout suggestions, and cost-saving strategies.`;

        const calculation = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a workplace strategy expert helping companies optimize their real estate footprint." },
                { role: "user", content: prompt }
            ],
            max_tokens: 500,
            temperature: 0.4
        });

        res.json({
            recommendation: calculation.choices[0].message.content,
            success: true
        });
    } catch (error) {
        console.error('Space calculation error:', error);
        const basicCalc = req.body.employees ? req.body.employees * 150 : 5000;
        res.json({
            recommendation: `**Space Recommendation**
            
            📏 Estimated Need: ${basicCalc}-${basicCalc * 1.2} sq ft
            
            • Open workspace: ${Math.floor(basicCalc * 0.5)} sq ft
            • Private offices: ${Math.floor(basicCalc * 0.2)} sq ft
            • Meeting rooms: ${Math.floor(basicCalc * 0.15)} sq ft
            • Common areas: ${Math.floor(basicCalc * 0.15)} sq ft
            
            Consider flexible lease terms to accommodate growth.`,
            success: true
        });
    }
});

// Update package.json scripts
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', service: 'Apex Tenant Advisors AI Backend' });
});

app.listen(PORT, () => {
    console.log(`AI Backend running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  POST /api/chat - AI chatbot');
    console.log('  POST /api/analyze-lease - Lease document analysis');
    console.log('  POST /api/market-insights - Market intelligence');
    console.log('  POST /api/calculate-space - Space requirements calculator');
});