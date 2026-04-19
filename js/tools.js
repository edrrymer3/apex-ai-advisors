// Apex AI Advisors — Tools Page JavaScript
// Twin Cities Market Data (Q1 2026)

const MN_MARKET_DATA = {
    'Minneapolis Downtown': {
        type: 'Office', vacancy: 18.5, avgRate: 19.40, avgTI: 52, freeRent: '4–6 months',
        trend: 'Tenant Favorable', direction: 'up',
        properties: [
            { name: '50 S 6th St', sf: '5,000–40,000 SF', class: 'A', rate: 18.50, notes: 'Move-in ready suites available' },
            { name: '225 S 6th St (US Bancorp)', sf: '5,000–25,000 SF', class: 'A', rate: 21.00, notes: 'Premium amenities, skyway access' },
            { name: '333 S 7th St', sf: '3,000–18,000 SF', class: 'A', rate: 19.00, notes: 'Negotiable — 180+ days on market' },
            { name: '80 S 8th St', sf: '8,000–20,000 SF', class: 'A', rate: 20.50, notes: 'Rate flagged negotiable' },
            { name: '121 S 8th St (8th Street Tower)', sf: '4,000–15,000 SF', class: 'B+', rate: 16.50, notes: 'Great value, skyway connected' },
        ]
    },
    'Minneapolis Suburban': {
        type: 'Office', vacancy: 14.5, avgRate: 17.20, avgTI: 40, freeRent: '2–4 months',
        trend: 'Balanced', direction: 'neutral',
        properties: [
            { name: 'Colonnade, Eden Prairie', sf: '3,000–20,000 SF', class: 'A', rate: 17.50, notes: 'Campus setting, ample parking' },
            { name: 'Northland Center, Eden Prairie', sf: '5,000–15,000 SF', class: 'A', rate: 16.80, notes: 'Spec suites available' },
            { name: 'Opus Park, Minnetonka', sf: '4,000–18,000 SF', class: 'A', rate: 16.00, notes: 'Move-in ready' },
            { name: '7700 France Ave, Edina', sf: '2,000–10,000 SF', class: 'B+', rate: 15.50, notes: 'Strong amenity package' },
            { name: 'Plymouth Corporate Center', sf: '5,000–25,000 SF', class: 'A', rate: 17.00, notes: 'New spec suites' },
        ]
    },
    'St. Paul CBD': {
        type: 'Office', vacancy: 16.2, avgRate: 16.80, avgTI: 38, freeRent: '3–5 months',
        trend: 'Tenant Favorable', direction: 'up',
        properties: [
            { name: '400 Robert St N', sf: '5,000–30,000 SF', class: 'A', rate: 17.00, notes: 'Government anchor building' },
            { name: 'Wells Fargo Place', sf: '3,000–20,000 SF', class: 'A', rate: 18.00, notes: 'Skyway connected, Class A' },
            { name: 'Alliance Bank Center', sf: '2,000–12,000 SF', class: 'B', rate: 14.50, notes: 'Value option downtown' },
        ]
    },
    'Twin Cities Industrial': {
        type: 'Industrial', vacancy: 4.2, avgRate: 7.80, avgTI: 12, freeRent: '1–2 months',
        trend: 'Landlord Favorable', direction: 'down',
        properties: [
            { name: 'NW Corridor (Rogers/Maple Grove)', sf: '10,000–500,000 SF', class: 'A', rate: 8.20, notes: 'Extremely tight — move fast' },
            { name: 'I-94 West (Plymouth/Brooklyn Park)', sf: '5,000–100,000 SF', class: 'A/B', rate: 7.50, notes: 'Limited availability' },
            { name: 'Eagan Distribution Hub', sf: '20,000–200,000 SF', class: 'A', rate: 8.00, notes: 'Airport proximity, strong I-494 access' },
            { name: 'Fridley/Arden Hills', sf: '10,000–80,000 SF', class: 'B', rate: 6.80, notes: 'More availability than west side' },
        ]
    },
    'Bloomington/Airport': {
        type: 'Office', vacancy: 15.8, avgRate: 17.80, avgTI: 42, freeRent: '3–4 months',
        trend: 'Balanced', direction: 'neutral',
        properties: [
            { name: 'Normandale Lake Office Park', sf: '3,000–20,000 SF', class: 'A', rate: 18.00, notes: 'MOA proximity, strong amenities' },
            { name: 'Wells Fargo Bloomington', sf: '5,000–30,000 SF', class: 'A', rate: 17.50, notes: 'Freeway visible' },
            { name: 'Airport area flex', sf: '2,000–15,000 SF', class: 'B', rate: 16.00, notes: 'Good airport access' },
        ]
    }
};

// ─── MARKET SURVEY ───────────────────────────────────────────────────────────
function generateSurvey() {
    const locationEl = document.getElementById('survey-location');
    const typeEl = document.getElementById('survey-type');
    const sizeEl = document.getElementById('survey-size');

    const location = locationEl?.value || 'Minneapolis Downtown';
    const type = typeEl?.value || 'Office';

    // Find best matching market
    let market = MN_MARKET_DATA['Minneapolis Downtown'];
    for (const [key, data] of Object.entries(MN_MARKET_DATA)) {
        if (location.toLowerCase().includes(key.toLowerCase().split(' ')[0]) ||
            key.toLowerCase().includes(location.toLowerCase().split(' ')[0]) ||
            (type === 'Industrial' && data.type === 'Industrial')) {
            market = data;
            break;
        }
    }
    if (type === 'Industrial') market = MN_MARKET_DATA['Twin Cities Industrial'];

    const resultsDiv = document.getElementById('survey-results');
    if (!resultsDiv) return;

    resultsDiv.style.opacity = '0.5';

    setTimeout(() => {
        const propCount = market.properties.length + Math.floor(Math.random() * 8) + 5;
        const trendIcon = market.direction === 'up' ? '↑' : market.direction === 'down' ? '↓' : '→';

        // Update summary cards
        const cards = document.querySelectorAll('.summary-value');
        if (cards[0]) cards[0].textContent = propCount;
        if (cards[1]) cards[1].textContent = `$${market.avgRate.toFixed(2)}`;
        if (cards[2]) cards[2].textContent = `${market.vacancy}%`;
        if (cards[3]) { cards[3].textContent = `${trendIcon} ${market.trend}`; cards[3].style.color = market.direction === 'up' ? '#10b981' : market.direction === 'down' ? '#ef4444' : '#f59e0b'; }

        // Update property list
        const propList = document.querySelector('.property-list');
        if (propList) {
            propList.innerHTML = `<h4>Top Available Properties — ${location}</h4>` +
                market.properties.map(p => `
                    <div class="property-item" style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem 0; border-bottom:1px solid rgba(0,0,0,0.06);">
                        <div class="property-info">
                            <strong>${p.name}</strong>
                            <span style="display:block; font-size:0.82rem; color:#6b7280; margin-top:0.1rem;">${p.sf} · Class ${p.class} · ${p.notes}</span>
                        </div>
                        <div class="property-price" style="font-weight:700; color:#1d4ed8; font-size:1rem; white-space:nowrap; margin-left:1rem;">$${p.rate.toFixed(2)}/SF</div>
                    </div>`).join('') +
                `<div style="margin-top:1rem; padding:0.75rem; background:#f0fdf4; border-radius:8px; font-size:0.85rem; color:#166534;">
                    💡 <strong>Market Insight:</strong> Average TI allowance is $${market.avgTI}/SF with ${market.freeRent} free rent on 5-year deals. 
                    ${market.direction === 'up' ? 'Strong tenant leverage — now is an excellent time to negotiate.' : market.direction === 'down' ? 'Tight market — start search early and be prepared to move quickly.' : 'Balanced market — standard terms prevailing.'}
                </div>`;
        }

        resultsDiv.style.opacity = '1';
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        showNotification(`Market survey generated for ${location}!`, 'success');
    }, 1200);
}

// ─── FLOOR PLAN / SPACE CALCULATOR ───────────────────────────────────────────
function generateFloorPlan() {
    const employees = parseInt(document.getElementById('fp-employees')?.value) || 50;
    const model = document.getElementById('fp-model')?.value || 'Hybrid (3 days)';
    const growth = parseInt(document.getElementById('fp-growth')?.value) || 20;
    const collab = document.getElementById('fp-collab')?.value || 'Medium (Mixed)';

    // Base SF per person by work model
    let sfPerPerson = 175; // Full office
    if (model.includes('Hybrid')) sfPerPerson = 120;
    if (model.includes('Flexible')) sfPerPerson = 95;

    // Collaboration adjustment
    if (collab.includes('High')) sfPerPerson += 15;
    if (collab.includes('Low')) sfPerPerson += 20; // More private offices

    // Checked amenities
    const checkboxes = document.querySelectorAll('.space-requirements input[type="checkbox"]');
    let amenityAdder = 0;
    checkboxes.forEach(cb => {
        if (cb.checked) {
            const label = cb.parentElement?.textContent?.trim() || '';
            if (label.includes('Conference')) amenityAdder += Math.ceil(employees / 10) * 250;
            if (label.includes('Kitchen')) amenityAdder += Math.max(300, employees * 5);
            if (label.includes('Reception')) amenityAdder += 300;
            if (label.includes('Wellness')) amenityAdder += 200;
            if (label.includes('Server')) amenityAdder += 400;
            if (label.includes('Phone')) amenityAdder += Math.ceil(employees / 8) * 40;
        }
    });

    const currentSF = Math.round((employees * sfPerPerson) + amenityAdder);
    const futureSF = Math.round(currentSF * (1 + (growth / 100)));
    const recommendedSF = Math.round((currentSF + futureSF) / 2 / 100) * 100; // Midpoint, rounded

    // Update chart + display
    const sfDisplay = document.getElementById('recommended-sf') || document.querySelector('.sf-recommendation');
    if (sfDisplay) sfDisplay.textContent = `${recommendedSF.toLocaleString()} SF`;

    // Update any metric displays
    const metrics = document.querySelectorAll('.space-metric-value');
    if (metrics[0]) metrics[0].textContent = `${currentSF.toLocaleString()} SF`;
    if (metrics[1]) metrics[1].textContent = `${futureSF.toLocaleString()} SF`;
    if (metrics[2]) metrics[2].textContent = `${sfPerPerson} SF`;

    // Update chart if it exists
    if (typeof spaceChart !== 'undefined' && spaceChart) {
        spaceChart.data.datasets[0].data = [
            Math.round(employees * sfPerPerson),
            amenityAdder,
            Math.round(currentSF * (growth / 100) / 2)
        ];
        spaceChart.update();
    }

    showNotification(`Recommended space: ${recommendedSF.toLocaleString()} SF for ${employees} employees`, 'success');
}

// ─── FINANCIAL CALCULATOR ─────────────────────────────────────────────────────
function calculateFinancials() {
    const sfEl = document.getElementById('fin-sf') || document.getElementById('financial-sf');
    const rateEl = document.getElementById('fin-rate') || document.getElementById('financial-rate');
    const termEl = document.getElementById('fin-term') || document.getElementById('financial-term');
    const tiEl = document.getElementById('fin-ti') || document.getElementById('financial-ti');
    const freeRentEl = document.getElementById('fin-fr') || document.getElementById('financial-fr');
    const escalationEl = document.getElementById('fin-esc') || document.getElementById('financial-esc');

    const sf = parseInt(sfEl?.value) || 10000;
    const rate = parseFloat(rateEl?.value) || 19.40;
    const term = parseInt(termEl?.value) || 5;
    const ti = parseFloat(tiEl?.value) || 52;
    const freeRent = parseInt(freeRentEl?.value) || 4;
    const escalation = parseFloat(escalationEl?.value) || 3;

    const annualRent = sf * rate;
    const totalRent = annualRent * term;
    const freeRentValue = annualRent * (freeRent / 12);
    const tiValue = sf * ti;
    const totalConcessions = freeRentValue + tiValue;
    const netEffective = (totalRent - totalConcessions) / (sf * term);
    const monthlyRent = annualRent / 12;
    const firstYearCash = annualRent - freeRentValue;

    // Update displays
    const update = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    update('calc-annual', `$${annualRent.toLocaleString()}`);
    update('calc-total', `$${Math.round(totalRent).toLocaleString()}`);
    update('calc-ti', `$${Math.round(tiValue).toLocaleString()}`);
    update('calc-free-rent', `$${Math.round(freeRentValue).toLocaleString()}`);
    update('calc-net-effective', `$${netEffective.toFixed(2)}/SF`);
    update('calc-monthly', `$${Math.round(monthlyRent).toLocaleString()}`);
    update('calc-first-year', `$${Math.round(firstYearCash).toLocaleString()}`);
    update('calc-concessions', `$${Math.round(totalConcessions).toLocaleString()}`);

    // Update chart
    if (typeof costChart !== 'undefined' && costChart) {
        costChart.data.datasets[0].data = [
            Math.round(totalRent),
            Math.round(tiValue),
            Math.round(freeRentValue)
        ];
        costChart.update();
    }

    showNotification('Financial analysis complete!', 'success');
}

// ─── CHARTS ───────────────────────────────────────────────────────────────────
let spaceChart, costChart;

function initSpaceChart() {
    const ctx = document.getElementById('heatmapChart') || document.getElementById('spaceChart');
    if (!ctx) return;
    spaceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Workstations', 'Meeting & Amenities', 'Growth Buffer'],
            datasets: [{ data: [5250, 2250, 2500], backgroundColor: ['#3B82F6', '#10b981', '#f59e0b'], borderWidth: 0 }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#6b7280', padding: 15 } } }, cutout: '65%' }
    });
}

function initCostChart() {
    const ctx = document.getElementById('priceChart') || document.getElementById('costChart');
    if (!ctx) return;
    costChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total Rent', 'TI Allowance', 'Free Rent Value'],
            datasets: [{
                data: [970000, 520000, 64667],
                backgroundColor: ['rgba(59,130,246,0.7)', 'rgba(16,185,129,0.7)', 'rgba(245,158,11,0.7)'],
                borderRadius: 6, borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { ticks: { color: '#9ca3af', callback: v => '$' + (v/1000).toFixed(0) + 'K' }, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { ticks: { color: '#6b7280' }, grid: { display: false } }
            }
        }
    });
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function showNotification(message, type = 'success') {
    const existing = document.querySelector('.apex-notification');
    if (existing) existing.remove();

    const n = document.createElement('div');
    n.className = 'apex-notification';
    n.style.cssText = `position:fixed; bottom:2rem; right:2rem; background:${type === 'success' ? '#10b981' : '#ef4444'}; color:#fff; padding:0.8rem 1.4rem; border-radius:10px; font-weight:600; font-size:0.88rem; z-index:9999; box-shadow:0 8px 25px rgba(0,0,0,0.15); animation:slideIn 0.3s ease; font-family:'Inter',sans-serif;`;
    n.textContent = type === 'success' ? '✓ ' + message : '✗ ' + message;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3500);

    if (!document.getElementById('apexNotifStyle')) {
        const s = document.createElement('style');
        s.id = 'apexNotifStyle';
        s.textContent = '@keyframes slideIn { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }';
        document.head.appendChild(s);
    }
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
    initSpaceChart();
    initCostChart();

    // Pre-fill location with Minneapolis
    const locEl = document.getElementById('survey-location');
    if (locEl) locEl.value = 'Minneapolis Downtown';

    // Wire financial calc inputs to live update
    ['fin-sf','fin-rate','fin-term','fin-ti','fin-fr','fin-esc',
     'financial-sf','financial-rate','financial-term','financial-ti','financial-fr','financial-esc']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', calculateFinancials);
        });

    // Run initial calculations
    setTimeout(calculateFinancials, 200);
});
