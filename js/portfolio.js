// Portfolio Tracker JavaScript

// Initialize all charts when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    initPortfolioCharts();
    setupEventListeners();
    loadDarkMode();
});

// Dark Mode Setup
function loadDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const modeIcon = document.getElementById('modeIcon');
    const root = document.documentElement;
    
    // Check saved preference
    const currentMode = localStorage.getItem('darkMode');
    if (currentMode === 'enabled') {
        root.classList.add('dark-mode');
        modeIcon.textContent = '☀️';
    }
    
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            root.classList.toggle('dark-mode');
            
            if (root.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
                modeIcon.textContent = '☀️';
            } else {
                localStorage.setItem('darkMode', 'disabled');
                modeIcon.textContent = '🌙';
            }
        });
    }
}

// Initialize Portfolio Charts
function initPortfolioCharts() {
    // Cost Trend Chart
    const costCtx = document.getElementById('portfolioCostChart');
    if (costCtx) {
        new Chart(costCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Total Monthly Cost',
                    data: [1520000, 1545000, 1530000, 1560000, 1540000, 1550000],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Optimized Cost',
                    data: [1520000, 1480000, 1450000, 1420000, 1400000, 1380000],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                label += '$' + (context.parsed.y / 1000000).toFixed(2) + 'M';
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
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
    
    // Geographic Distribution Chart
    const mapCtx = document.getElementById('portfolioMapChart');
    if (mapCtx) {
        new Chart(mapCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Chicago', 'San Francisco', 'New York', 'Dallas', 'Miami'],
                datasets: [{
                    data: [35, 25, 20, 12, 8],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
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
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '% of portfolio';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Lease Timeline Chart
    const timelineCtx = document.getElementById('portfolioTimelineChart');
    if (timelineCtx) {
        new Chart(timelineCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Q3 2026', 'Q4 2026', 'Q1 2027', 'Q2 2027', 'Q3 2027', 'Q4 2027'],
                datasets: [{
                    label: 'Expiring Leases',
                    data: [1, 0, 2, 1, 0, 3],
                    backgroundColor: function(context) {
                        const value = context.parsed.y;
                        if (value >= 3) return 'rgba(239, 68, 68, 0.8)';
                        if (value >= 2) return 'rgba(245, 158, 11, 0.8)';
                        return 'rgba(16, 185, 129, 0.8)';
                    },
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
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Add Property Button
    const addBtn = document.querySelector('.add-property-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            showAddPropertyModal();
        });
    }
    
    // Property Action Buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.textContent;
            const property = this.closest('.property-card').querySelector('h3').textContent;
            
            if (this.classList.contains('urgent')) {
                showNotification(`Initiating renewal process for ${property}`, 'warning');
            } else {
                showNotification(`Opening ${action} for ${property}`, 'info');
            }
        });
    });
    
    // Quick Action Cards
    document.querySelectorAll('.quick-action-card').forEach(card => {
        card.addEventListener('click', function() {
            const action = this.querySelector('.action-title').textContent;
            handleQuickAction(action);
        });
    });
}

// Show Add Property Modal (simplified)
function showAddPropertyModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            padding: 2rem;
            border-radius: 15px;
            max-width: 500px;
            width: 90%;
        ">
            <h2 style="margin-bottom: 1.5rem;">Add New Property</h2>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <input type="text" placeholder="Property Name" style="padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 8px;">
                <input type="text" placeholder="Address" style="padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 8px;">
                <input type="number" placeholder="Square Footage" style="padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 8px;">
                <input type="number" placeholder="Monthly Cost" style="padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 8px;">
                <input type="date" placeholder="Lease Expiration" style="padding: 0.75rem; border: 1px solid #E5E7EB; border-radius: 8px;">
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                <button onclick="this.closest('.modal').remove()" style="
                    flex: 1;
                    padding: 0.75rem;
                    border: 1px solid #E5E7EB;
                    background: white;
                    border-radius: 8px;
                    cursor: pointer;
                ">Cancel</button>
                <button onclick="addProperty()" style="
                    flex: 1;
                    padding: 0.75rem;
                    background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">Add Property</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Add Property Function
function addProperty() {
    showNotification('Property added successfully!', 'success');
    document.querySelector('.modal').remove();
}

// Handle Quick Actions
function handleQuickAction(action) {
    switch(action) {
        case 'Generate Report':
            showNotification('Generating comprehensive portfolio report...', 'info');
            setTimeout(() => {
                showNotification('Report downloaded: Portfolio_Analysis_2026.pdf', 'success');
            }, 2000);
            break;
        case 'Sync Properties':
            showNotification('Syncing with property management system...', 'info');
            setTimeout(() => {
                showNotification('All properties synced successfully', 'success');
            }, 1500);
            break;
        case 'Alert Settings':
            showNotification('Opening alert configuration...', 'info');
            break;
        case 'Export Data':
            showNotification('Exporting portfolio data to Excel...', 'info');
            setTimeout(() => {
                showNotification('Data exported: Portfolio_Export_2026.xlsx', 'success');
            }, 1000);
            break;
    }
}

// Notification System
function showNotification(message, type = 'success') {
    const colors = {
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${colors[type] || colors.info};
        color: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Mobile menu toggle
const mobileToggle = document.querySelector('.nav-mobile-toggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileToggle.classList.toggle('active');
    });
}

// Auto-save portfolio data to localStorage
function savePortfolioData() {
    const portfolioData = {
        properties: 12,
        totalSqFt: 485000,
        annualCost: 18500000,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('portfolioData', JSON.stringify(portfolioData));
}

// Load portfolio data on startup
function loadPortfolioData() {
    const saved = localStorage.getItem('portfolioData');
    if (saved) {
        const data = JSON.parse(saved);
        console.log('Portfolio data loaded:', data);
    }
}

// Initialize
loadPortfolioData();
savePortfolioData();

// Auto-refresh data every 30 seconds
setInterval(() => {
    console.log('Auto-refreshing portfolio data...');
    savePortfolioData();
}, 30000);