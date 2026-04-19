// Modern App JavaScript

// Animate stats on scroll
function animateStats() {
    // Only animate elements that have a data-target attribute
    const stats = document.querySelectorAll('.stat-value[data-target]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseFloat(entry.target.getAttribute('data-target'));
                let current = 0;
                const increment = target / 50;
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    
                    if (target % 1 === 0) {
                        entry.target.textContent = Math.floor(current);
                    } else {
                        entry.target.textContent = current.toFixed(1);
                    }
                    
                    // Add unit back
                    if (entry.target.getAttribute('data-target') === '500') {
                        entry.target.textContent = entry.target.textContent + 'M+';
                    } else if (entry.target.getAttribute('data-target') === '1.2') {
                        entry.target.textContent = '$' + entry.target.textContent + 'B+';
                    } else if (entry.target.getAttribute('data-target') === '99') {
                        entry.target.textContent = entry.target.textContent + '%';
                    }
                }, 30);
                
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    stats.forEach(stat => observer.observe(stat));
}

// Initialize charts
function initCharts() {
    // Price Chart
    const priceCtx = document.getElementById('priceChart');
    if (priceCtx) {
        new Chart(priceCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Average $/sq ft',
                    data: [42, 44, 43, 45, 47, 46],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { display: false }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }
    
    // Vacancy Chart
    const vacancyCtx = document.getElementById('vacancyChart');
    if (vacancyCtx) {
        new Chart(vacancyCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                datasets: [{
                    label: 'Vacancy Rate %',
                    data: [12, 14, 13, 11],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(16, 185, 129, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { display: false }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }
    
    // Heat Map (simplified)
    const heatmapCtx = document.getElementById('heatmapChart');
    if (heatmapCtx) {
        new Chart(heatmapCtx.getContext('2d'), {
            type: 'bubble',
            data: {
                datasets: [{
                    label: 'Downtown',
                    data: [{x: 10, y: 20, r: 15}],
                    backgroundColor: 'rgba(239, 68, 68, 0.6)'
                }, {
                    label: 'Midtown',
                    data: [{x: 20, y: 30, r: 10}],
                    backgroundColor: 'rgba(245, 158, 11, 0.6)'
                }, {
                    label: 'Suburbs',
                    data: [{x: 30, y: 10, r: 20}],
                    backgroundColor: 'rgba(16, 185, 129, 0.6)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        display: false
                    }
                }
            }
        });
    }
}

// Smooth scroll
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

// Mobile menu toggle
const mobileToggle = document.querySelector('.nav-mobile-toggle');
const navMenu = document.querySelector('.nav-menu');

function closeMobileMenu() {
    if (navMenu) navMenu.classList.remove('active');
    if (mobileToggle) mobileToggle.classList.remove('active');
    document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
}

if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = navMenu.classList.toggle('active');
        mobileToggle.classList.toggle('active', isOpen);
    });

    // Accordion dropdowns inside mobile menu
    navMenu.querySelectorAll('.nav-dropdown-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            if (!navMenu.classList.contains('active')) return;
            e.preventDefault();
            e.stopPropagation();
            const dropdown = trigger.closest('.nav-dropdown');
            const wasOpen = dropdown.classList.contains('open');
            // Close all others
            navMenu.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
            if (!wasOpen) dropdown.classList.add('open');
        });
    });

    // Close on outside click / tap
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
            closeMobileMenu();
        }
    });

    // Close when a nav link is tapped
    navMenu.querySelectorAll('a:not(.nav-dropdown-trigger)').forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });
}

// Tool card interactions
document.querySelectorAll('.tool-try-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const tool = this.closest('.ai-tool-card').dataset.tool;
        alert(`Opening ${tool} tool... (This would open the actual AI tool in production)`);
    });
});

// Demo upload interaction
const demoUpload = document.querySelector('.demo-upload-area');
if (demoUpload) {
    demoUpload.addEventListener('click', () => {
        alert('Upload functionality would be implemented here with backend integration');
    });
}

// Form submission
const ctaForm = document.querySelector('.cta-form');
if (ctaForm) {
    ctaForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = ctaForm.querySelector('.cta-input').value;
        if (email) {
            alert(`Thank you! We'll send your free analysis to ${email}`);
            ctaForm.querySelector('.cta-input').value = '';
        }
    });
}

// Interactive functions for buttons
function openDemo() {
    alert('Demo would open here - showing full AI capabilities');
}

function watchVideo() {
    alert('Video demo would play here');
}

// Parallax effect on scroll
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.hero-bg-animation');
    if (parallax) {
        parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    animateStats();
    initCharts();
    
    // Add fade-in animation to sections
    const sections = document.querySelectorAll('section');
    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s, transform 0.6s';
        fadeInObserver.observe(section);
    });
});

// Add some console branding
console.log('%c🤖 Apex AI Advisors', 'font-size: 24px; font-weight: bold; color: #3B82F6;');
console.log('%cNext-Generation Tenant Representation', 'font-size: 14px; color: #6B7280;');

// Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
const modeIcon = document.getElementById('modeIcon');
const root = document.documentElement;

// Check for saved dark mode preference
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