// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
        });
    });
    
    // Form submission handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            
            // Here you would normally send the data to a server
            // For demo purposes, we'll just show an alert
            alert('Thank you for your inquiry! We will contact you within 24 hours to discuss your commercial real estate needs.');
            
            // Reset the form
            this.reset();
        });
    }
    
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all sections for animations
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(section);
    });
    
    // Add scroll effect to navigation
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            navbar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
        }
        
        lastScroll = currentScroll;
    });
    
    // Counter animation for stats
    function animateCounter(element, target) {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = element.getAttribute('data-format');
                clearInterval(timer);
            } else {
                if (element.getAttribute('data-format').includes('M')) {
                    element.textContent = Math.floor(current) + 'M';
                } else if (element.getAttribute('data-format').includes('+')) {
                    element.textContent = '$' + Math.floor(current) + 'M+';
                } else {
                    element.textContent = Math.floor(current) + '+';
                }
            }
        }, 30);
    }
    
    // Trigger counter animation when hero stats are visible
    const statNumbers = document.querySelectorAll('.stat-number');
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const text = element.textContent;
                element.setAttribute('data-format', text);
                
                let target;
                if (text.includes('250M')) {
                    target = 250;
                } else if (text.includes('500')) {
                    target = 500;
                } else if (text.includes('15M')) {
                    target = 15;
                }
                
                if (target) {
                    animateCounter(element, target);
                    statsObserver.unobserve(element);
                }
            }
        });
    }, { threshold: 1.0 });
    
    statNumbers.forEach(stat => {
        statsObserver.observe(stat);
    });
});

// Add mobile menu styles dynamically
const style = document.createElement('style');
style.innerHTML = `
    @media (max-width: 768px) {
        .nav-menu.active {
            display: flex;
            position: fixed;
            flex-direction: column;
            background: white;
            top: 70px;
            left: 0;
            right: 0;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .hamburger.active span:nth-child(1) {
            transform: rotate(-45deg) translate(-5px, 6px);
        }
        
        .hamburger.active span:nth-child(2) {
            opacity: 0;
        }
        
        .hamburger.active span:nth-child(3) {
            transform: rotate(45deg) translate(-5px, -6px);
        }
    }
`;
document.head.appendChild(style);