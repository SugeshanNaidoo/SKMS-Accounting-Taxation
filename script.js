// Universal JavaScript for SKMS Website

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initializeMobileMenu();
    initializeScrollEffects();
    initializeAnimations();
    initializeContactForm();
});

// Mobile Menu Toggle
function initializeMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const nav = document.querySelector('nav ul');
    
    if (!mobileMenu || !nav) return;

    mobileMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMobileMenu();
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('nav') && !e.target.closest('.mobile-menu')) {
            closeMobileMenu();
        }
    });

    // Close menu on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });

    // Close menu when clicking nav links
    const navLinks = nav.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });
}

function toggleMobileMenu() {
    const nav = document.querySelector('nav ul');
    const mobileMenu = document.querySelector('.mobile-menu');
    const icon = mobileMenu.querySelector('i');
    
    if (nav.style.display === 'flex') {
        closeMobileMenu();
    } else {
        nav.style.display = 'flex';
        nav.style.flexDirection = 'column';
        nav.style.position = 'absolute';
        nav.style.top = '80px';
        nav.style.left = '0';
        nav.style.right = '0';
        nav.style.background = 'rgba(255, 255, 255, 0.98)';
        nav.style.backdropFilter = 'blur(20px)';
        nav.style.padding = '30px 20px';
        nav.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.15)';
        nav.style.zIndex = '999';
        nav.style.animation = 'slideDown 0.3s ease';
        icon.className = 'fas fa-times';
        document.body.style.overflow = 'hidden';
    }
}

function closeMobileMenu() {
    const nav = document.querySelector('nav ul');
    const mobileMenu = document.querySelector('.mobile-menu');
    if (!nav || !mobileMenu) return;
    
    const icon = mobileMenu.querySelector('i');
    
    nav.style.display = '';
    icon.className = 'fas fa-bars';
    document.body.style.overflow = '';
}

// Scroll Effects
function initializeScrollEffects() {
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
            header.style.background = 'rgba(255, 255, 255, 1)';
        } else {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            header.style.background = 'rgba(255, 255, 255, 0.98)';
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            if (href && href !== '#' && href.length > 1) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

// Animations on Scroll
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Animate cards and sections
    const animateElements = document.querySelectorAll('.card, .service-card, .team-card, .mission-card, .contact-item');
    animateElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });

    // Animate stats
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length > 0) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateStatNumber(entry.target);
                    statsObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        statNumbers.forEach(stat => {
            statsObserver.observe(stat);
        });
    }
}

// Animate stat numbers
function animateStatNumber(element) {
    const text = element.textContent;
    const hasPlus = text.includes('+');
    const hasPercent = text.includes('%');
    const hasR = text.includes('R');
    const hasM = text.includes('M');
    
    let numberText = text.replace(/[^0-9.]/g, '');
    const targetNumber = parseFloat(numberText);
    
    if (isNaN(targetNumber)) return;
    
    const duration = 2000;
    const steps = 60;
    const increment = targetNumber / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
        current += increment;
        step++;
        
        let displayValue = Math.floor(current);
        let displayText = displayValue.toString();
        
        if (hasR) displayText = 'R' + displayText;
        if (hasM) displayText = displayText + 'M';
        if (hasPlus) displayText = displayText + '+';
        if (hasPercent) displayText = displayText + '%';
        
        element.textContent = displayText;
        
        if (step >= steps) {
            clearInterval(timer);
            element.textContent = text;
        }
    }, duration / steps);
}

// Contact Form Handler - UPDATED WITH API INTEGRATION
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) return;

    const formStatus = document.getElementById('form-status');
    
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone') || '',
            message: formData.get('message')
        };
        
        // Validate form
        if (!validateContactForm(data)) {
            showFormStatus('error', 'Please fill in all required fields correctly.');
            return;
        }
        
        // Show loading state
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitButton.disabled = true;
        showFormStatus('loading', 'Sending your message...');
        
        try {
            // Make API call to Vercel serverless function
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                showFormStatus('success', 'Thank you for your message! We will get back to you shortly.');
                contactForm.reset();
                clearAllFieldErrors();
                
                // Auto-hide success message after 5 seconds
                setTimeout(() => {
                    if (formStatus) {
                        formStatus.style.display = 'none';
                    }
                }, 5000);
            } else {
                // Handle error response from API
                const errorMessage = result.error || 'Failed to send message. Please try again.';
                showFormStatus('error', errorMessage);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showFormStatus('error', 'Sorry, there was an error sending your message. Please try again later or contact us directly at anaidoo.skms@gmail.com or +27 65 895 4832.');
        } finally {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    });

    // Real-time validation
    const inputs = contactForm.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

// Validate contact form
function validateContactForm(data) {
    if (!data.name || data.name.trim().length < 2) return false;
    if (!data.email || !isValidEmail(data.email)) return false;
    if (!data.message || data.message.trim().length < 10) return false;
    return true;
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Check if required field is empty
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required.';
    }

    // Email validation
    if (field.type === 'email' && value) {
        if (!isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address.';
        }
    }

    // Phone validation (optional field)
    if (field.type === 'tel' && value) {
        if (!isValidPhone(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number.';
        }
    }

    // Message length validation
    if (field.tagName === 'TEXTAREA' && value && value.length < 10) {
        isValid = false;
        errorMessage = 'Message must be at least 10 characters long.';
    }

    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }

    return isValid;
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Phone validation
function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

// Show field error
function showFieldError(field, message) {
    clearFieldError(field);
    
    field.style.borderColor = '#EF4444';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#EF4444';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '8px';
    errorDiv.style.display = 'flex';
    errorDiv.style.alignItems = 'center';
    errorDiv.style.gap = '5px';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    field.parentElement.appendChild(errorDiv);
}

// Clear field error
function clearFieldError(field) {
    field.style.borderColor = '';
    
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Clear all field errors
function clearAllFieldErrors() {
    const allErrors = document.querySelectorAll('.field-error');
    allErrors.forEach(error => error.remove());
    
    const allInputs = document.querySelectorAll('.form-input, .form-textarea');
    allInputs.forEach(input => {
        input.style.borderColor = '';
    });
}

// Show form status message
function showFormStatus(type, message) {
    const formStatus = document.getElementById('form-status');
    if (!formStatus) return;
    
    formStatus.textContent = message;
    formStatus.className = `form-status ${type}`;
    formStatus.style.display = 'block';
    
    // Scroll to message
    formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    // Escape key closes mobile menu
    if (e.key === 'Escape') {
        closeMobileMenu();
    }
});

// Add loading animation to page
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Console message
console.log('%cSKMS Accounting & Taxation', 'color: #1E40AF; font-size: 24px; font-weight: bold;');
console.log('%cWebsite designed by Alba Designs', 'color: #6B7280; font-size: 14px;');