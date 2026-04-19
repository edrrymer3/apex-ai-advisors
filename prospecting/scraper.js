/**
 * Apex AI Advisors — Tenant Prospect Scraper
 * 
 * Sources:
 * 1. SEC EDGAR — REIT 10-K filings with MN tenant rosters
 * 2. Google-indexed OMs / rent rolls (Crexi, M&M, CBRE Investment Sales)
 * 3. Crexi investment sales listings (MN office + industrial)
 * 
 * Runs weekly via cron. Output: data/prospects.json
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const DATA_DIR = path.join(__dirname, 'data');
const PROSPECTS_FILE = path.join(DATA_DIR, 'prospects.json');
const LOG_FILE = path.join(DATA_DIR, 'scrape-log.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ─── REIT CIKs with known MN office/industrial exposure ───────────────────
const REIT_TARGETS = [
  { name: 'Prologis',           cik: '1045609', type: 'Industrial' },
  { name: 'Duke Realty',        cik: '783280',  type: 'Industrial' },
  { name: 'First Industrial',   cik: '921825',  type: 'Industrial' },
  { name: 'Highwoods Properties',cik: '921082', type: 'Office' },
  { name: 'Piedmont Office',    cik: '1042776', type: 'Office' },
  { name: 'Cousins Properties', cik: '25232',   type: 'Office' },
  { name: 'EastGroup Properties',cik: '49600',  type: 'Industrial' },
  { name: 'STAG Industrial',    cik: '1538827', type: 'Industrial' },
  { name: 'Brandywine Realty',  cik: '790816',  type: 'Office' },
];

// MN keywords to filter relevant properties
const MN_KEYWORDS = [
  'minneapolis', 'saint paul', 'st. paul', 'bloomington', 'eden prairie',
  'plymouth', 'minnetonka', 'edina', 'maple grove', 'rogers', 'brooklyn park',
  'richfield', 'burnsville', 'eagan', 'woodbury', 'twin cities', 'minnesota', ' mn '
];

const EXCLUDE_TYPES = ['retail', 'multifamily', 'residential', 'hotel', 'lodging', 'self-storage', 'land'];

// ─── Utility ────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function isMN(text) {
  const lower = text.toLowerCase();
  return MN_KEYWORDS.some(kw => lower.includes(kw));
}

function isExcludedType(text) {
  const lower = text.toLowerCase();
  return EXCLUDE_TYPES.some(t => lower.includes(t));
}

function loadProspects() {
  if (fs.existsSync(PROSPECTS_FILE)) {
    try { return JSON.parse(fs.readFileSync(PROSPECTS_FILE, 'utf8')); } catch(e) { return []; }
  }
  return [];
}

function saveProspects(prospects) {
  fs.writeFileSync(PROSPECTS_FILE, JSON.stringify(prospects, null, 2));
  console.log(`✅ Saved ${prospects.length} prospects to ${PROSPECTS_FILE}`);
}

function mergeProspects(existing, newOnes) {
  const map = new Map();
  // Existing first
  existing.forEach(p => map.set(p.id || `${p.company}-${p.address}`, p));
  // New ones overwrite/add
  newOnes.forEach(p => {
    const key = `${p.company.toLowerCase().trim()}-${(p.address||'').toLowerCase().trim()}`;
    if (!map.has(key)) {
      p.id = key;
      p.addedDate = new Date().toISOString().split('T')[0];
      p.status = 'new';
      map.set(key, p);
    }
  });
  return Array.from(map.values());
}

function log(message, data = {}) {
  const entry = { ts: new Date().toISOString(), message, ...data };
  console.log(`[${entry.ts}] ${message}`);
  let logs = [];
  if (fs.existsSync(LOG_FILE)) { try { logs = JSON.parse(fs.readFileSync(LOG_FILE)); } catch(e) {} }
  logs.unshift(entry);
  if (logs.length > 100) logs = logs.slice(0, 100);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// ─── SEC EDGAR Scraper ───────────────────────────────────────────────────────
async function scrapeEDGAR(reit) {
  const prospects = [];
  try {
    log(`Fetching EDGAR filings for ${reit.name} (CIK: ${reit.cik})`);
    
    // Get recent 10-K filings
    const searchUrl = `https://efts.sec.gov/LATEST/search-index?q=%22tenant%22+%22minnesota%22&dateRange=custom&startdt=2024-01-01&forms=10-K&entity=${encodeURIComponent(reit.name)}`;
    const filingUrl = `https://data.sec.gov/submissions/CIK${reit.cik.padStart(10,'0')}.json`;
    
    const res = await axios.get(filingUrl, { 
      timeout: 15000,
      headers: { 'User-Agent': 'ApexAIAdvisors research@apexaiadvisors.com' }
    });
    
    const filings = res.data;
    const recentForms = filings.filings?.recent;
    if (!recentForms) return prospects;

    // Find most recent 10-K
    const idx = recentForms.form?.findIndex(f => f === '10-K');
    if (idx === -1 || idx === undefined) return prospects;

    const accNo = recentForms.accessionNumber?.[idx]?.replace(/-/g, '');
    const primaryDoc = recentForms.primaryDocument?.[idx];
    if (!accNo || !primaryDoc) return prospects;

    const docUrl = `https://www.sec.gov/Archives/edgar/data/${reit.cik}/${accNo}/${primaryDoc}`;
    log(`  Fetching 10-K: ${docUrl}`);

    await sleep(1000); // Be polite to SEC
    const docRes = await axios.get(docUrl, { 
      timeout: 20000,
      headers: { 'User-Agent': 'ApexAIAdvisors research@apexaiadvisors.com' }
    });

    const $ = cheerio.load(docRes.data);
    const text = $('body').text();

    // Parse tenant roster tables — look for MN mentions near lease data
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!isMN(line)) continue;
      if (isExcludedType(line)) continue;

      // Try to extract structured data from surrounding lines
      const context = lines.slice(Math.max(0, i-3), Math.min(lines.length, i+5)).join(' ');
      
      // Look for SF patterns: "123,456 sq ft" or "123,456 square feet"
      const sfMatch = context.match(/(\d{1,3}(?:,\d{3})+|\d{4,6})\s*(?:sq\.?\s*ft|square feet|rsf|sf)/i);
      // Look for expiration: "2026", "2027", "2028", "2029"
      const expMatch = context.match(/202[5-9]|203[0-5]/);
      // Look for rent: dollar amount per square foot
      const rentPattern = new RegExp('[\\$](\\d{1,3}(?:\\.\\d{2})?)\\s*(?:per sq|\/sq|psf|per rsf)', 'i');
      const rentMatch = context.match(rentPattern);

      if (sfMatch) {
        const sf = parseInt(sfMatch[1].replace(/,/g, ''));
        if (sf < 5000) continue; // Skip tiny spaces
        
        // Try to extract company name from context
        const companyMatch = context.match(/([A-Z][A-Za-z\s&,\.]+(?:Inc|LLC|Corp|Co|LP|LLP|Group|Company|Technologies|Solutions|Services|Bank|Health|Medical|Financial)?)/);
        
        prospects.push({
          company: companyMatch ? companyMatch[1].trim().substring(0, 60) : `${reit.name} Tenant`,
          address: extractAddress(context) || 'Minneapolis/St. Paul Metro',
          productType: reit.type,
          sf,
          baseRentAnnual: rentMatch ? parseFloat(rentMatch[1]) : null,
          leaseExpiration: expMatch ? expMatch[0] : null,
          source: `SEC EDGAR — ${reit.name} 10-K`,
          sourceUrl: docUrl,
          landlord: reit.name,
          scrapedAt: new Date().toISOString(),
        });
      }
    }

    log(`  Found ${prospects.length} MN prospects in ${reit.name} 10-K`);
  } catch (err) {
    log(`  Error scraping ${reit.name}: ${err.message}`);
  }
  return prospects;
}

function extractAddress(text) {
  // Try to find a street address
  const match = text.match(/\d{1,5}\s+[A-Z][a-zA-Z\s]+(Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Road|Rd|Way|Lane|Ln|Parkway|Pkwy)[,\s]/i);
  return match ? match[0].trim() : null;
}

// ─── Crexi Investment Sales (OMs with rent rolls) ────────────────────────────
async function scrapeCrexiInvestmentSales() {
  const prospects = [];
  try {
    log('Searching Crexi for MN office/industrial investment sales with rent rolls...');

    // Search for MN investment sales — these OMs contain tenant rosters
    const searchUrl = 'https://www.crexi.com/properties?types=office,industrial&states=MN&listingTypes=for-sale&hasTenants=true';
    
    const res = await axios.get('https://api.crexi.com/assets?propertyTypes=Office,Industrial&stateCode=MN&listingType=ForSale&limit=50', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    if (res.data?.results) {
      for (const listing of res.data.results) {
        if (!listing.tenants?.length) continue;
        for (const tenant of listing.tenants) {
          if (isExcludedType(listing.propertyType || '')) continue;
          prospects.push({
            company: tenant.name || 'Unknown Tenant',
            address: listing.address || listing.city + ', MN',
            productType: listing.propertyType || 'Office',
            sf: tenant.leasedSqFt || listing.buildingSqFt,
            baseRentAnnual: tenant.annualRent || null,
            leaseExpiration: tenant.leaseExpiration ? tenant.leaseExpiration.substring(0, 7) : null,
            source: 'Crexi Investment Sale',
            sourceUrl: `https://www.crexi.com/properties/${listing.id}`,
            landlord: listing.ownerName || null,
            scrapedAt: new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    log(`Crexi API error: ${err.message} — falling back to web scrape`);
    // Fallback: scrape Crexi search results page
    try {
      const res = await axios.get('https://www.crexi.com/properties?propertyTypes=Office,Industrial&stateCode=MN&listingType=ForSale', {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
      });
      const $ = cheerio.load(res.data);
      // Extract any structured data from page
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const data = JSON.parse($(el).html());
          if (data['@type'] === 'RealEstateListing' && isMN(JSON.stringify(data))) {
            prospects.push({
              company: 'Tenant (see OM)',
              address: data.address?.streetAddress || data.name,
              productType: 'Office/Industrial',
              sf: null,
              baseRentAnnual: null,
              leaseExpiration: null,
              source: 'Crexi Listing',
              sourceUrl: data.url,
              scrapedAt: new Date().toISOString(),
            });
          }
        } catch(e) {}
      });
    } catch(e) {
      log(`Crexi fallback also failed: ${e.message}`);
    }
  }
  log(`Crexi: found ${prospects.length} prospects`);
  return prospects;
}

// ─── Google Search for indexed OMs / Rent Rolls ──────────────────────────────
async function searchForOMs() {
  const prospects = [];
  const queries = [
    'Minneapolis office "rent roll" "lease expiration" filetype:pdf site:crexi.com OR site:loopnet.com OR site:mmcre.com',
    'Minnesota industrial "tenant roster" "square feet" "expiration" 2026 2027 filetype:pdf',
    '"Twin Cities" "offering memorandum" office industrial "rent roll" 2026',
    'Minnesota REIT "10-K" tenant "lease expires" "square feet" 2026 2027',
  ];

  for (const query of queries) {
    try {
      log(`Searching: ${query.substring(0, 60)}...`);
      // Use DuckDuckGo HTML (no API key needed)
      const res = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
      });
      
      const $ = cheerio.load(res.data);
      const results = [];
      
      $('.result__title a, .result__url').each((i, el) => {
        const href = $(el).attr('href') || $(el).text();
        const title = $(el).text().trim();
        if (href && (href.includes('.pdf') || title.toLowerCase().includes('rent roll') || title.toLowerCase().includes('offering memo'))) {
          if (isMN(title) || isMN(href)) {
            results.push({ title, href });
          }
        }
      });

      // For each PDF found, try to fetch and parse
      for (const result of results.slice(0, 3)) {
        try {
          prospects.push({
            company: 'Multiple Tenants (see OM)',
            address: result.title.substring(0, 80),
            productType: result.title.toLowerCase().includes('industrial') ? 'Industrial' : 'Office',
            sf: null,
            baseRentAnnual: null,
            leaseExpiration: null,
            source: 'Public OM / Rent Roll',
            sourceUrl: result.href,
            notes: result.title,
            scrapedAt: new Date().toISOString(),
          });
        } catch(e) {}
      }

      await sleep(2000); // Polite delay between searches
    } catch(err) {
      log(`Search error: ${err.message}`);
    }
  }

  log(`OM search: found ${prospects.length} documents`);
  return prospects;
}

// ─── Main Run ────────────────────────────────────────────────────────────────
async function runScrape() {
  log('=== Apex AI Advisors — Prospect Scrape Starting ===');
  const startTime = Date.now();
  let allNew = [];

  // 1. SEC EDGAR — REIT 10-Ks
  log('--- Phase 1: SEC EDGAR REIT Filings ---');
  for (const reit of REIT_TARGETS) {
    const results = await scrapeEDGAR(reit);
    allNew = allNew.concat(results);
    await sleep(2000); // Polite to SEC
  }

  // 2. Crexi Investment Sales
  log('--- Phase 2: Crexi Investment Sales ---');
  const crexiResults = await scrapeCrexiInvestmentSales();
  allNew = allNew.concat(crexiResults);
  await sleep(1000);

  // 3. Public OM Search
  log('--- Phase 3: Public OM / Rent Roll Search ---');
  const omResults = await searchForOMs();
  allNew = allNew.concat(omResults);

  // Merge with existing
  const existing = loadProspects();
  const merged = mergeProspects(existing, allNew);
  saveProspects(merged);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`=== Scrape Complete: ${allNew.length} new records found, ${merged.length} total. ${elapsed}s ===`);
  
  return { newCount: allNew.length, totalCount: merged.length, elapsed };
}

// ─── Cron Schedule (Weekly — Sunday 6am) ────────────────────────────────────
if (require.main === module) {
  // Run immediately on start
  runScrape().then(result => {
    console.log('\n📊 Results:', result);
    
    // Schedule weekly runs
    cron.schedule('0 6 * * 0', () => {
      console.log('\n⏰ Weekly scrape triggered by cron...');
      runScrape();
    });
    
    console.log('\n⏰ Weekly scrape scheduled (Sundays at 6am)');
    console.log('💾 Data saved to: data/prospects.json');
    console.log('🌐 Run "node server.js" to view the dashboard\n');
  });
}

module.exports = { runScrape };
