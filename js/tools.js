// Apex AI Advisors — Tools Page JavaScript
// Twin Cities Market Data (Q1 2026)

// Set Chart.js global defaults for dark theme
if (typeof Chart !== 'undefined') {
    Chart.defaults.color = 'rgba(255,255,255,0.6)';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.08)';
    Chart.defaults.plugins.legend.labels.color = 'rgba(255,255,255,0.6)';
}

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

    const location = locationEl?.value || 'Minneapolis Downtown';
    const type = typeEl?.value || 'Office';

    // Find best matching market
    let market = MN_MARKET_DATA['Minneapolis Downtown'];
    if (type === 'Industrial' || type === 'Flex Space') {
        market = MN_MARKET_DATA['Twin Cities Industrial'];
    } else {
        const locLower = location.toLowerCase();
        if (locLower.includes('suburban') || locLower.includes('eden') || locLower.includes('plymouth') || locLower.includes('minnetonka') || locLower.includes('edina') || locLower.includes('bloomington')) {
            market = MN_MARKET_DATA['Minneapolis Suburban'];
        } else if (locLower.includes('st. paul') || locLower.includes('saint paul')) {
            market = MN_MARKET_DATA['St. Paul CBD'];
        } else if (locLower.includes('bloomington') || locLower.includes('airport')) {
            market = MN_MARKET_DATA['Bloomington/Airport'];
        }
    }

    const resultsDiv = document.getElementById('survey-results');
    if (!resultsDiv) return;
    resultsDiv.style.opacity = '0.5';

    setTimeout(() => {
        const propCount = market.properties.length + Math.floor(Math.random() * 6) + 4;
        const trendIcon = market.direction === 'up' ? '↑' : market.direction === 'down' ? '↓' : '→';
        const trendColor = market.direction === 'up' ? '#059669' : market.direction === 'down' ? '#dc2626' : '#d97706';

        // Update summary cards — scope to survey-results container
        const cards = resultsDiv.querySelectorAll('.summary-value');
        if (cards[0]) cards[0].textContent = propCount;
        if (cards[1]) cards[1].textContent = `$${market.avgRate.toFixed(2)}/SF`;
        if (cards[2]) cards[2].textContent = `${market.vacancy}%`;
        if (cards[3]) {
            cards[3].textContent = `${trendIcon} ${market.trend}`;
            cards[3].style.color = trendColor;
        }

        // Update property list
        const propList = resultsDiv.querySelector('.property-list');
        if (propList) {
            propList.innerHTML =
                `<h4 style="margin-bottom:0.5rem; font-size:0.9rem; color:#374151;">Top Available Properties — ${location}</h4>` +
                market.properties.map(p => `
                    <div class="property-item" style="display:flex; justify-content:space-between; align-items:flex-start; padding:0.75rem 0; border-bottom:1px solid rgba(0,0,0,0.06);">
                        <div>
                            <strong style="font-size:0.9rem;">${p.name}</strong>
                            <div style="font-size:0.8rem; color:#6b7280; margin-top:0.15rem;">${p.sf} &nbsp;·&nbsp; Class ${p.class} &nbsp;·&nbsp; ${p.notes}</div>
                        </div>
                        <div style="font-weight:700; color:#1d4ed8; font-size:0.95rem; white-space:nowrap; margin-left:1rem;">$${p.rate.toFixed(2)}/SF</div>
                    </div>`).join('') +
                `<div style="margin-top:0.75rem; padding:0.75rem 1rem; background:#f0fdf4; border-radius:8px; font-size:0.83rem; color:#166534;">
                    💡 <strong>Market Insight:</strong> Avg TI $${market.avgTI}/SF · ${market.freeRent} free rent standard · ${market.direction === 'up' ? 'Strong tenant leverage.' : market.direction === 'down' ? 'Move quickly — limited options.' : 'Balanced market conditions.'}
                </div>`;
        }

        // Update export button
        const exportBtn = resultsDiv.querySelector('.export-btn');
        if (exportBtn) {
            exportBtn.onclick = () => {
                const text = `Apex AI Advisors — Market Survey\n${location} ${type}\n\nVacancy: ${market.vacancy}%\nAvg Rate: $${market.avgRate}/SF\nAvg TI: ${market.avgTI}/SF\nFree Rent: ${market.freeRent}\n\nProperties:\n` +
                    market.properties.map(p => `${p.name} — ${p.sf} — $${p.rate}/SF`).join('\n');
                const blob = new Blob([text], {type:'text/plain'});
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                a.download = `market-survey-${location.replace(/[^a-z0-9]/gi,'-')}.txt`; a.click();
            };
        }

        resultsDiv.style.opacity = '1';
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        showNotification(`Survey generated — ${propCount} properties found in ${location}`, 'success');
    }, 900);
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
    // Update metric displays with IDs
    const upd = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    upd('metric-recommended', recommendedSF.toLocaleString() + ' SF');
    upd('metric-current', currentSF.toLocaleString() + ' SF');
    upd('metric-future', futureSF.toLocaleString() + ' SF');
    upd('metric-per-person', sfPerPerson + ' SF/person');

    // Update chart if it exists
    if (typeof spaceChart !== 'undefined' && spaceChart) {
        spaceChart.data.datasets[0].data = [
            Math.round(employees * sfPerPerson),
            amenityAdder,
            Math.round(currentSF * (growth / 100) / 2)
        ];
        spaceChart.update();
    }

    // Update floor plan visual
    const wsSF = Math.round(employees * sfPerPerson * 0.52);
    const mtSF = Math.round(currentSF * 0.18);
    const cmSF = Math.round(currentSF * 0.18);
    const spSF = currentSF - wsSF - mtSF - cmSF;
    const upd2 = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val.toLocaleString() + ' SF'; };
    upd2('fp-ws-size', wsSF); upd2('fp-mt-size', mtSF); upd2('fp-cm-size', cmSF); upd2('fp-sp-size', Math.max(0, spSF));

    showNotification(`Recommended: ${recommendedSF.toLocaleString()} SF for ${employees} employees`, 'success');
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
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.6)', padding: 15 } } },
            cutout: '65%'
        }
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
                backgroundColor: ['rgba(59,130,246,0.8)', 'rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)'],
                borderRadius: 6, borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { ticks: { color: 'rgba(255,255,255,0.5)', callback: v => '$' + (v/1000).toFixed(0) + 'K' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                x: { ticks: { color: 'rgba(255,255,255,0.5)' }, grid: { display: false } }
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
