// Tools Page JavaScript

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', () => {
    initSpaceChart();
    initCostChart();
});

// Market Survey Generator
function generateSurvey() {
    const location = document.getElementById('survey-location').value;
    const type = document.getElementById('survey-type').value;
    const size = document.getElementById('survey-size').value;
    
    // Show loading state
    const resultsDiv = document.getElementById('survey-results');
    resultsDiv.style.opacity = '0.5';
    
    // Simulate AI processing
    setTimeout(() => {
        // Generate random but realistic data
        const properties = Math.floor(Math.random() * 30) + 30;
        const avgRate = (Math.random() * 20 + 30).toFixed(2);
        const vacancy = (Math.random() * 10 + 8).toFixed(1);
        
        // Update summary cards
        document.querySelector('.summary-value').textContent = properties;
        document.querySelectorAll('.summary-value')[1].textContent = `$${avgRate}`;
        document.querySelectorAll('.summary-value')[2].textContent = `${vacancy}%`;
        
        // Show results with animation
        resultsDiv.style.opacity = '1';
        resultsDiv.style.transform = 'translateY(0)';
        
        // Scroll to results
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
        
        // Show success message
        showNotification('Market survey generated successfully!', 'success');
    }, 1500);
}

// Floor Plan Generator
function generateFloorPlan() {
    const employees = document.getElementById('fp-employees').value;
    const model = document.getElementById('fp-model').value;
    const growth = document.getElementById('fp-growth').value;
    
    // Calculate space needs
    let baseSpace = employees * 150; // Base calculation
    
    // Adjust for work model
    if (model.includes('Hybrid')) {
        baseSpace *= 0.7; // 30% reduction for hybrid
    } else if (model === 'Flexible') {
        baseSpace *= 0.6; // 40% reduction for flexible
    }
    
    // Add growth buffer
    baseSpace *= (1 + (growth / 100));
    
    // Calculate components
    const workstations = Math.round(baseSpace * 0.5);
    const meeting = Math.round(baseSpace * 0.2);
    const common = Math.round(baseSpace * 0.2);
    const support = Math.round(baseSpace * 0.1);
    const total = workstations + meeting + common + support;
    
    // Update visual
    document.querySelector('.floor-area.workstations .area-size').textContent = `${workstations.toLocaleString()} sq ft`;
    document.querySelector('.floor-area.meeting .area-size').textContent = `${meeting.toLocaleString()} sq ft`;
    document.querySelector('.floor-area.common .area-size').textContent = `${common.toLocaleString()} sq ft`;
    document.querySelector('.floor-area.support .area-size').textContent = `${support.toLocaleString()} sq ft`;
    
    // Update metrics
    const metrics = document.querySelectorAll('.space-metrics .metric-item strong');
    metrics[0].textContent = `${total.toLocaleString()} sq ft`;
    metrics[1].textContent = `${Math.round(total / employees)} sq ft`;
    metrics[2].textContent = '85%';
    metrics[3].textContent = `$${(total * 38 / 12).toLocaleString()}`;
    
    // Update chart
    updateSpaceChart(workstations, meeting, common, support);
    
    // Show results
    const output = document.querySelector('.floorplan-output');
    output.scrollIntoView({ behavior: 'smooth' });
    
    showNotification('Floor plan optimized!', 'success');
}

// Financial Analyzer
function analyzeFinancials() {
    const baseRent = parseFloat(document.getElementById('fin-base').value);
    const sqft = parseFloat(document.getElementById('fin-sqft').value);
    const term = parseFloat(document.getElementById('fin-term').value);
    const escalation = parseFloat(document.getElementById('fin-escalation').value) / 100;
    const opex = parseFloat(document.getElementById('fin-opex').value);
    const utilities = parseFloat(document.getElementById('fin-utilities').value);
    const parkingRate = parseFloat(document.getElementById('fin-parking').value);
    const spaces = parseFloat(document.getElementById('fin-spaces').value);
    const freeRent = parseFloat(document.getElementById('fin-free').value);
    const tiAllowance = parseFloat(document.getElementById('fin-ti').value);
    
    // Calculate total costs
    let totalCost = 0;
    let yearlyData = [];
    
    for (let year = 1; year <= term; year++) {
        let yearRent = baseRent * Math.pow(1 + escalation, year - 1);
        let yearTotal = (yearRent + opex + utilities) * sqft;
        yearTotal += parkingRate * spaces * 12; // Annual parking
        
        // Apply free rent to first year
        if (year === 1 && freeRent > 0) {
            yearTotal -= (yearRent * sqft * (freeRent / 12));
        }
        
        totalCost += yearTotal;
        yearlyData.push(yearTotal);
    }
    
    // Calculate concessions value
    const concessions = (freeRent * baseRent * sqft / 12) + (tiAllowance * sqft);
    const netTotal = totalCost - concessions;
    const effectiveRate = totalCost / (sqft * term);
    const netEffective = netTotal / (sqft * term);
    
    // Update summary
    document.querySelector('.summary-row.total strong').textContent = `$${totalCost.toLocaleString()}`;
    document.querySelectorAll('.summary-row strong')[1].textContent = `$${effectiveRate.toFixed(2)}`;
    document.querySelectorAll('.summary-row.savings strong')[0].textContent = `-$${concessions.toLocaleString()}`;
    document.querySelectorAll('.summary-row strong')[3].textContent = `$${netEffective.toFixed(2)}`;
    
    // Update cost components
    const monthlyBase = (baseRent * sqft) / 12;
    const monthlyOpex = (opex * sqft) / 12;
    const monthlyUtils = (utilities * sqft) / 12;
    const monthlyParking = parkingRate * spaces;
    const monthlyTotal = monthlyBase + monthlyOpex + monthlyUtils + monthlyParking;
    
    const components = document.querySelectorAll('.component-item strong');
    components[0].textContent = `$${monthlyBase.toLocaleString()}`;
    components[1].textContent = `$${monthlyOpex.toLocaleString()}`;
    components[2].textContent = `$${monthlyUtils.toLocaleString()}`;
    components[3].textContent = `$${monthlyParking.toLocaleString()}`;
    
    // Update bar widths
    const bars = document.querySelectorAll('.component-bar');
    bars[0].style.width = `${(monthlyBase / monthlyTotal) * 100}%`;
    bars[1].style.width = `${(monthlyOpex / monthlyTotal) * 100}%`;
    bars[2].style.width = `${(monthlyUtils / monthlyTotal) * 100}%`;
    bars[3].style.width = `${(monthlyParking / monthlyTotal) * 100}%`;
    
    // Update chart
    updateCostChart(yearlyData);
    
    // Show results
    document.querySelector('.financial-output').scrollIntoView({ behavior: 'smooth' });
    
    showNotification('Financial analysis complete!', 'success');
}

// Initialize Space Chart
function initSpaceChart() {
    const ctx = document.getElementById('spaceChart');
    if (!ctx) return;
    
    window.spaceChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Workstations', 'Meeting', 'Common', 'Support'],
            datasets: [{
                data: [5000, 2000, 2000, 1000],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Update Space Chart
function updateSpaceChart(workstations, meeting, common, support) {
    if (window.spaceChart) {
        window.spaceChart.data.datasets[0].data = [workstations, meeting, common, support];
        window.spaceChart.update();
    }
}

// Initialize Cost Chart
function initCostChart() {
    const ctx = document.getElementById('costChart');
    if (!ctx) return;
    
    window.costChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
            datasets: [{
                label: 'Annual Cost',
                data: [1200000, 1236000, 1273080, 1311272, 1350610],
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000000).toFixed(1) + 'M';
                        }
                    }
                }
            }
        }
    });
}

// Update Cost Chart
function updateCostChart(yearlyData) {
    if (window.costChart) {
        window.costChart.data.datasets[0].data = yearlyData;
        window.costChart.update();
    }
}

// Notification System
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10B981' : '#EF4444'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Quick tool buttons
document.querySelectorAll('.quick-tool-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const card = this.closest('.quick-tool-card');
        const toolName = card.querySelector('h3').textContent;
        alert(`${toolName} will be available soon! This advanced AI tool is in development.`);
    });
});

// Export functionality
document.querySelectorAll('.export-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        showNotification('Generating PDF report...', 'success');
        setTimeout(() => {
            showNotification('Report downloaded successfully!', 'success');
        }, 2000);
    });
});

// Compare functionality
document.querySelectorAll('.compare-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        alert('Comparison tool will open here - compare up to 5 lease scenarios side by side');
    });
});

// Mobile menu toggle
const mobileToggle = document.querySelector('.nav-mobile-toggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileToggle.classList.toggle('active');
    });
}

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});