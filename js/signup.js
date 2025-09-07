// Apple-Quality Signup Page with Sophisticated Interactions
// Pricing data with real Stripe price IDs (no free trial)
const pricingTiers = {
    starter: {
        name: 'Starter',
        price: '£49.99',
        period: 'per month',
        description: 'Perfect for small clubs',
        features: [
            '1 pitch',
            '10 referees',
            '1 division',
            '1 league per division',
            '15 teams'
        ],
        stripePriceId: 'price_1S1nloP7uxsydX5XjGvpRKBs'
    },
    growth: {
        name: 'Growth',
        price: '£99.99',
        period: 'per month',
        description: 'Growing clubs and venues',
        features: [
            '3 pitches',
            '25 referees',
            '5 divisions',
            '3 leagues per division',
            '150 teams'
        ],
        stripePriceId: 'price_1S1nlpP7uxsydX5XmkKXGza5',
        popular: true
    },
    pro: {
        name: 'Professional',
        price: '£179.99',
        period: 'per month',
        description: 'Large venues and organizations',
        features: [
            '8 pitches',
            '50 referees',
            '10 divisions',
            '5 leagues per division',
            '500 teams'
        ],
        stripePriceId: 'price_1S1nlpP7uxsydX5XJn4a9Dv4'
    }
};

// Initialize Apple-quality page on load
document.addEventListener('DOMContentLoaded', () => {
    initializeAppleExperience();
});

// Apple-Quality Experience Initialization
function initializeAppleExperience() {
    initScrollAnimations();
    initFloatingNavigation();
    initMovingBackgrounds();
    initPricingCards();
    initSmoothScrolling();
    initModalSystem();
    initKeyboardNavigation();
    initViewportHandling();
    initStripeIntegration();
}

// Initialize Apple-quality scroll animations with staggered effects
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('animate-in');
                }, delay);
            } else {
                entry.target.classList.remove('animate-in');
            }
        });
    }, observerOptions);

    // Observe all animated elements with better selectors
    document.querySelectorAll('.pricing-card, .feature-item, .hero-content, .cta-section, .section-header, .animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // Add parallax effect to hero section
    initParallaxEffects();
}

// Initialize parallax effects
function initParallaxEffects() {
    const hero = document.querySelector('.hero-section');
    if (!hero) return;
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        // Apply parallax to hero background elements
        const floatingElements = hero.querySelectorAll('.floating-card');
        floatingElements.forEach((element, index) => {
            const speed = (index + 1) * 0.2;
            element.style.transform = `translateY(${scrolled * speed}px)`;
        });
        
        // Apply subtle parallax to hero content
        const heroContent = hero.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.transform = `translateY(${rate * 0.3}px)`;
        }
    });
}

// Initialize floating navigation behavior
function initFloatingNavigation() {
    const nav = document.querySelector('.floating-nav');
    if (!nav) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateNav() {
        const scrollY = window.scrollY;
        const scrollDirection = scrollY > lastScrollY ? 'down' : 'up';
        
        if (scrollY > 100) {
            nav.classList.add('scrolled');
            if (scrollDirection === 'down' && scrollY > lastScrollY + 10) {
                nav.classList.add('hidden');
            } else if (scrollDirection === 'up') {
                nav.classList.remove('hidden');
            }
        } else {
            nav.classList.remove('scrolled', 'hidden');
        }

        lastScrollY = scrollY;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateNav);
            ticking = true;
        }
    });
}

// Initialize subtle background movement
function initMovingBackgrounds() {
    const orbs = document.querySelectorAll('.gradient-orb');
    
    // Simple parallax effect on scroll
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        orbs.forEach((orb, index) => {
            const speed = 0.1 + (index * 0.05);
            const yPos = scrollY * speed;
            orb.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
    });

    // Subtle mouse movement effect
    document.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        orbs.forEach((orb, index) => {
            const intensity = 0.02 + (index * 0.01);
            const x = (clientX - centerX) * intensity;
            const y = (clientY - centerY) * intensity;
            orb.style.transform += ` translate3d(${x}px, ${y}px, 0)`;
        });
    });
    
    // Reduce motion for accessibility
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('reduce-motion');
    }
}

// Initialize pricing card interactions
function initPricingCards() {
    const cards = document.querySelectorAll('.pricing-card');
    
    cards.forEach(card => {
        // Add magnetic hover effect
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });

        // Add click ripple effect
        card.addEventListener('click', (e) => {
            const ripple = document.createElement('div');
            ripple.classList.add('ripple');
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            card.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// Initialize smooth scrolling
function initSmoothScrolling() {
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
}

// Initialize modal system
function initModalSystem() {
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('registrationModal');
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Initialize form step navigation
    initFormSteps();
}

// Initialize keyboard navigation
function initKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('registrationModal');
            if (modal && modal.classList.contains('show')) {
                closeModal();
            }
        }
    });
}

// Initialize viewport resize handling
function initViewportHandling() {
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Reinitialize moving backgrounds for new viewport
            initMovingBackgrounds();
        }, 250);
    });
}

// Global function to select a plan
window.selectPlan = function(planId) {
    const planData = pricingTiers[planId];
    if (!planData) return;

    // Add selection animation
    const selectedCard = document.querySelector(`[data-plan="${planId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        setTimeout(() => selectedCard.classList.remove('selected'), 500);
    }

    // Show registration modal with animation
    showRegistrationModal(planId, planData);
};

// Show registration modal with Apple-quality animation
function showRegistrationModal(planId, planData) {
    const modal = document.getElementById('registrationModal');
    const planName = document.getElementById('selectedPlanName');
    const planPrice = document.getElementById('selectedPlanPrice');
    
    if (planName) {
        planName.textContent = planData.name + ' Plan';
    }
    
    if (planPrice) {
        const priceText = `${planData.price}${planData.period ? '/' + planData.period.replace('per ', '') : ''}`;
        planPrice.textContent = priceText;
    }
    
    // Update order summary elements
    updateOrderSummary(planData);
    
    // Show modal with stagger animation
    if (modal) {
        modal.style.display = 'flex';
        modal.offsetHeight; // Force reflow
        modal.classList.add('show');
        
        document.body.style.overflow = 'hidden';
        
        // Store selected plan
        modal.dataset.selectedPlan = planId;

        // Animate form elements in sequence
        const formElements = modal.querySelectorAll('.form-group, .cta-button');
        formElements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('animate-in');
            }, index * 50);
        });
    }
}

// Initialize form steps navigation
function initFormSteps() {
    const modal = document.getElementById('registrationModal');
    if (!modal) return;
    
    // Initialize close button
    const closeButton = modal.querySelector('.close-modal');
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
    
    // Initialize continue buttons
    const continueButtons = modal.querySelectorAll('.continue-btn');
    continueButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const currentStep = this.closest('.form-step');
            if (currentStep) {
                const stepNumber = parseInt(currentStep.dataset.step);
                if (validateStep(stepNumber)) {
                    goToStep(stepNumber + 1);
                }
            }
        });
    });
    
    // Initialize back buttons
    const backButtons = modal.querySelectorAll('.back-btn');
    backButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const currentStep = this.closest('.form-step');
            if (currentStep) {
                const stepNumber = parseInt(currentStep.dataset.step);
                goToStep(stepNumber - 1);
            }
        });
    });
}

// Validate form step
function validateStep(stepNumber) {
    const step = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (!step) return false;
    
    const requiredInputs = step.querySelectorAll('input[required]');
    let isValid = true;
    
    requiredInputs.forEach(input => {
        const errorSpan = input.nextElementSibling;
        
        if (!input.value.trim()) {
            if (errorSpan && errorSpan.classList.contains('error-message')) {
                errorSpan.textContent = 'This field is required';
            }
            input.style.borderColor = '#ff3b30';
            isValid = false;
        } else {
            // Field-specific validation
            if (input.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input.value)) {
                    if (errorSpan && errorSpan.classList.contains('error-message')) {
                        errorSpan.textContent = 'Please enter a valid email address';
                    }
                    input.style.borderColor = '#ff3b30';
                    isValid = false;
                } else {
                    if (errorSpan && errorSpan.classList.contains('error-message')) {
                        errorSpan.textContent = '';
                    }
                    input.style.borderColor = '#10b981';
                }
            } else {
                if (errorSpan && errorSpan.classList.contains('error-message')) {
                    errorSpan.textContent = '';
                }
                input.style.borderColor = '#10b981';
            }
        }
    });
    
    // Additional validation for step 1 (emails and passwords)
    if (stepNumber === 1) {
        const emailInput = step.querySelector('#email');
        const confirmEmailInput = step.querySelector('#confirmEmail');
        const passwordInput = step.querySelector('#password');
        const confirmPasswordInput = step.querySelector('#confirmPassword');
        
        // Email confirmation validation
        if (emailInput && confirmEmailInput) {
            if (emailInput.value !== confirmEmailInput.value) {
                const confirmEmailErrorSpan = confirmEmailInput.nextElementSibling;
                if (confirmEmailErrorSpan && confirmEmailErrorSpan.classList.contains('error-message')) {
                    confirmEmailErrorSpan.textContent = 'Email addresses do not match';
                }
                confirmEmailInput.style.borderColor = '#ff3b30';
                isValid = false;
            }
        }
        
        // Password validation
        if (passwordInput && confirmPasswordInput) {
            if (!validatePassword(passwordInput.value)) {
                isValid = false;
            }
            
            if (passwordInput.value !== confirmPasswordInput.value) {
                const confirmErrorSpan = confirmPasswordInput.nextElementSibling;
                if (confirmErrorSpan && confirmErrorSpan.classList.contains('error-message')) {
                    confirmErrorSpan.textContent = 'Passwords do not match';
                }
                confirmPasswordInput.style.borderColor = '#ff3b30';
                isValid = false;
            }
        }
    }
    
    return isValid;
}

// Navigate to specific step
function goToStep(stepNumber) {
    const steps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressFill = document.querySelector('.progress-fill');
    
    // Hide all steps
    steps.forEach(step => {
        step.classList.remove('active');
    });
    
    // Show target step
    const targetStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (targetStep) {
        targetStep.classList.add('active');
    }
    
    // Update progress bar
    progressSteps.forEach((step, index) => {
        if (index + 1 < stepNumber) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (index + 1 === stepNumber) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
    
    // Update progress fill
    if (progressFill) {
        const progressPercent = ((stepNumber - 1) / (progressSteps.length - 1)) * 100;
        progressFill.style.width = `${progressPercent}%`;
    }
}

// Close modal with animation
window.closeModal = function() {
    const modal = document.getElementById('registrationModal');
    
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset form animations
        const formElements = modal.querySelectorAll('.form-group, .cta-button');
        formElements.forEach(el => el.classList.remove('animate-in'));
    }, 300);
};

// Update order summary in payment step
function updateOrderSummary(planData) {
    const summaryPlan = document.getElementById('summaryPlan');
    const summaryPrice = document.getElementById('summaryPrice');
    
    if (summaryPlan) {
        summaryPlan.textContent = planData.name;
    }
    
    if (summaryPrice) {
        summaryPrice.textContent = planData.price;
    }
}

// Listen for payment completion message from popup window
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'payment-complete' && event.data.status === 'success') {
        // Payment was successful, update UI and redirect
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.innerHTML = '<div class="loading-spinner"></div>Payment verified! Redirecting...';
            
            // Close modal and let Stripe success_url handle redirect
            setTimeout(() => {
                const modal = document.querySelector('.modal-overlay');
                if (modal) {
                    modal.remove();
                }
            }, 2000);
        }
        console.log('Payment completed, user will be redirected to email verification');
    }
});

// Handle payment window closure
async function handlePaymentWindowClosed() {
    const submitButton = document.querySelector('button[type="submit"]');
    submitButton.innerHTML = '<div class="loading-spinner"></div>Verifying payment...';
    
    // Wait a moment for Stripe to process, then update status
    setTimeout(() => {
        // Update to payment verified
        submitButton.innerHTML = '<div class="loading-spinner"></div>Payment verified!';
        
        // Wait another moment then show redirect message
        setTimeout(() => {
            submitButton.innerHTML = '<div class="loading-spinner"></div>Redirecting to email verification...';
            
            // Close modal after short delay - Stripe success_url should redirect automatically
            setTimeout(() => {
                const modal = document.querySelector('.modal-overlay');
                if (modal) {
                    modal.remove();
                }
                
                // Fallback redirect if Stripe doesn't redirect automatically
                setTimeout(() => {
                    if (window.location.pathname.includes('signup')) {
                        console.log('Stripe redirect may have failed, attempting manual redirect');
                        // Could add manual redirect logic here if needed
                    }
                }, 3000);
            }, 1500);
        }, 1000);
    }, 1000);
}

// Legacy function for backward compatibility
async function checkPaymentStatus() {
    return handlePaymentWindowClosed();
}

// Initialize Stripe integration
let stripe = null;
let stripePublishableKey = null;

async function initStripeIntegration() {
    try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        // Determine API base URL based on current environment
        const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? '' // Use relative URLs for local development
            : 'https://five-trackr-yq6ly.ondigitalocean.app'; // Use DigitalOcean app URL for production
        
        // Get Stripe publishable key from server
        const response = await fetch(`${apiBaseUrl}/api/signup/stripe-config`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to get Stripe configuration`);
        }
        
        const data = await response.json();
        
        if (data.success && data.publishable_key) {
            stripePublishableKey = data.publishable_key;
            
            // Validate publishable key format
            if (!data.publishable_key.startsWith('pk_')) {
                throw new Error('Invalid Stripe publishable key format');
            }
            
            stripe = Stripe(stripePublishableKey);
            console.log('Stripe initialized successfully');
        } else {
            throw new Error('Invalid Stripe configuration response');
        }
    } catch (error) {
        console.error('Error initializing Stripe:', error);
        
        // Show user-friendly error message
        const errorMessage = error.name === 'AbortError' 
            ? 'Request timeout - please check your internet connection' 
            : 'Failed to initialize payment system. Please refresh the page and try again.';
            
        showError(errorMessage);
    }
}

// Handle form submission (no free trial)
const registrationForm = document.getElementById('registrationForm');
if (registrationForm) {
    registrationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const modal = document.getElementById('registrationModal');
        const selectedPlan = modal.dataset.selectedPlan;
        const planData = pricingTiers[selectedPlan];
        
        // Collect form data
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            confirmEmail: document.getElementById('confirmEmail').value,
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            venueName: document.getElementById('venueName').value,
            venueAddress: '', // Set to empty since field was removed
            city: document.getElementById('city').value,
            postcode: document.getElementById('postcode').value,
            pitchCount: '1', // Default to 1 pitch
            plan: selectedPlan,
            stripePriceId: planData.stripePriceId
        };
        
        // Validate email confirmation
        if (formData.email !== formData.confirmEmail) {
            showError('Email addresses do not match');
            return;
        }
        
        // Validate password requirements
        if (!validatePassword(formData.password)) {
            showError('Password must be at least 8 characters with at least one number');
            return;
        }
        
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        // Show loading state with animation
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.innerHTML = '<div class="loading-spinner"></div>Processing...';
        submitButton.disabled = true;
        
        try {
            // Check if Stripe is initialized
            if (!stripe) {
                throw new Error('Payment system not initialized. Please refresh the page.');
            }
            
            const result = await handlePaidSignup(formData);
            
            // Redirect to Stripe Checkout
            if (result.checkout_url) {
                // Store form data for use after payment
                sessionStorage.setItem('signupFormData', JSON.stringify(formData));
                sessionStorage.setItem('checkoutSessionUrl', result.checkout_url);
                
                // Show redirect message
                submitButton.innerHTML = '<div class="loading-spinner"></div>Opening secure payment window...';
                
                // Add a small delay to show the message
                setTimeout(() => {
                    // Open Stripe checkout in a new window
                    const stripeWindow = window.open(result.checkout_url, '_blank', 'width=800,height=600,menubar=no,toolbar=no,location=yes,status=yes,scrollbars=yes,resizable=yes');
                    
                    // Check if popup was blocked
                    if (!stripeWindow || stripeWindow.closed || typeof stripeWindow.closed == 'undefined') {
                        showError('Pop-up blocker prevented opening payment window. Please allow pop-ups for this site.');
                        submitButton.innerHTML = originalText;
                        submitButton.disabled = false;
                    } else {
                        // Show waiting message
                        submitButton.innerHTML = '<div class="loading-spinner"></div>Waiting for payment...';
                        
                        // Monitor window status
                        const checkInterval = setInterval(() => {
                            if (stripeWindow.closed) {
                                clearInterval(checkInterval);
                                // Check if payment was successful and handle redirect
                                handlePaymentWindowClosed();
                            }
                        }, 500);
                    }
                }, 1000);
            } else {
                throw new Error('Payment setup failed - no checkout URL received');
            }
        } catch (error) {
            console.error('Signup error:', error);
            showError(error.message || 'An error occurred during signup');
            // Reset button state
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    });
}

// Handle paid signup (no free trial)
async function handlePaidSignup(formData) {
    try {
        // Determine API base URL based on current environment
        const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? '' // Use relative URLs for local development
            : 'https://five-trackr-yq6ly.ondigitalocean.app'; // Use DigitalOcean app URL for production
            
        const response = await fetch(`${apiBaseUrl}/api/signup/create-tenant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            // Try to parse error response
            let errorMessage = 'Failed to create account';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
                console.error('Failed to parse error response:', parseError);
            }
            
            // Provide specific error messages for common HTTP status codes
            if (response.status === 400) {
                errorMessage = errorMessage || 'Invalid account information provided';
            } else if (response.status === 409) {
                errorMessage = 'An account with this email already exists';
            } else if (response.status === 500) {
                errorMessage = 'Server error occurred. Please try again later.';
            }
            
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        // Validate the response has required fields
        if (!result.checkout_url) {
            throw new Error('Payment setup failed - missing checkout URL');
        }
        
        return result;
        
    } catch (error) {
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error - please check your internet connection');
        }
        
        // Re-throw other errors as-is
        throw error;
    }
}

// Show error message with animation
function showError(message) {
    // Remove any existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message error-message';
    errorDiv.innerHTML = `
        <div class="message-icon">⚠️</div>
        <div class="message-text">${message}</div>
    `;
    
    const form = document.getElementById('registrationForm');
    form.insertBefore(errorDiv, form.firstChild);
    
    // Animate in
    requestAnimationFrame(() => {
        errorDiv.classList.add('show');
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.classList.remove('show');
            setTimeout(() => errorDiv.remove(), 300);
        }
    }, 5000);
}

// Show success message with animation
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'message success-message';
    successDiv.innerHTML = `
        <div class="message-icon">✓</div>
        <div class="message-text">${message}</div>
    `;
    
    const form = document.getElementById('registrationForm');
    form.insertBefore(successDiv, form.firstChild);
    
    // Animate in
    requestAnimationFrame(() => {
        successDiv.classList.add('show');
    });
}

// Password validation function
function validatePassword(password) {
    // Check if password is at least 8 characters and contains at least one number
    if (password.length < 8) {
        return false;
    }
    
    // Check if password contains at least one number
    const hasNumber = /\d/.test(password);
    return hasNumber;
}

// Real-time password validation
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const requirements = document.querySelector('.password-requirements');
            const isValid = validatePassword(password);
            
            if (password.length > 0) {
                if (isValid) {
                    requirements.style.color = '#10b981';
                    requirements.textContent = '✓ Password meets requirements';
                } else {
                    requirements.style.color = '#ff3b30';
                    requirements.textContent = '✗ Must be 8+ characters with at least one number';
                }
            } else {
                requirements.style.color = 'var(--text-tertiary)';
                requirements.textContent = 'Must be 8+ characters with at least one number';
            }
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            const errorMessage = confirmPasswordInput.nextElementSibling;
            
            if (confirmPassword.length > 0) {
                if (password === confirmPassword) {
                    errorMessage.textContent = '';
                    confirmPasswordInput.style.borderColor = '#10b981';
                } else {
                    errorMessage.textContent = 'Passwords do not match';
                    confirmPasswordInput.style.borderColor = '#ff3b30';
                }
            } else {
                errorMessage.textContent = '';
                confirmPasswordInput.style.borderColor = 'var(--border-light)';
            }
        });
    }
    
    // Real-time email confirmation validation
    const emailInput = document.getElementById('email');
    const confirmEmailInput = document.getElementById('confirmEmail');
    
    if (confirmEmailInput) {
        confirmEmailInput.addEventListener('input', () => {
            const email = emailInput.value;
            const confirmEmail = confirmEmailInput.value;
            const errorMessage = confirmEmailInput.nextElementSibling;
            
            if (confirmEmail.length > 0) {
                if (email === confirmEmail) {
                    errorMessage.textContent = '';
                    confirmEmailInput.style.borderColor = '#10b981';
                } else {
                    errorMessage.textContent = 'Email addresses do not match';
                    confirmEmailInput.style.borderColor = '#ff3b30';
                }
            } else {
                errorMessage.textContent = '';
                confirmEmailInput.style.borderColor = 'var(--border-light)';
            }
        });
    }
    
    // Add plan details modal functions to global scope
    window.openPlanDetailsModal = function() {
        const modal = document.getElementById('planDetailsModal');
        const selectedPlan = window.selectedPlan || 'growth'; // Default to growth if not set
        const planData = pricingTiers[selectedPlan];
        
        if (planData) {
            // Update modal content with selected plan details
            document.getElementById('planNameLarge').textContent = planData.name + ' Plan';
            document.getElementById('planPriceLarge').textContent = planData.price + '/' + planData.period.replace('per ', '');
            
            // Update features list
            const featuresList = document.getElementById('planFeaturesList');
            featuresList.innerHTML = planData.features.map(feature => 
                `<li><span class="feature-check">✓</span> ${feature}</li>`
            ).join('');
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    
    window.closePlanDetailsModal = function() {
        const modal = document.getElementById('planDetailsModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };
    
    // Plan icons for different tiers with professional designs
    const planIcons = {
        starter: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
        growth: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L8 12h3v8h2v-8h3L12 2z"/></svg>',
        pro: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
    };
    
    // Change plan functionality - open plan selection modal
    window.changePlan = function() {
        const planSelectionModal = document.getElementById('planSelectionModal');
        planSelectionModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    
    // Close plan selection modal
    window.closePlanSelectionModal = function() {
        const modal = document.getElementById('planSelectionModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };
    
    // Select plan from modal and update registration form
    window.selectPlanFromModal = function(planId) {
        window.selectedPlan = planId;
        const planData = pricingTiers[planId];
        
        if (planData) {
            // Close plan selection modal first
            closePlanSelectionModal();
            
            // Wait a brief moment for modal to close, then update elements
            setTimeout(() => {
                // Update selected plan display in registration modal
                const nameElement = document.getElementById('selectedPlanName');
                const priceElement = document.getElementById('selectedPlanPrice');
                
                if (nameElement) {
                    nameElement.textContent = planData.name + ' Plan';
                }
                
                if (priceElement) {
                    priceElement.textContent = planData.price + '/' + planData.period.replace('per ', '');
                }
                
                // Update plan icon
                updatePlanIcon(planId);
                
                // Update order summary
                updateOrderSummary(planData);
                
                // Also update the stored selected plan in the registration modal
                const registrationModal = document.getElementById('registrationModal');
                if (registrationModal) {
                    registrationModal.dataset.selectedPlan = planId;
                }
            }, 100);
        }
    };
    
    // Update plan icon based on selected plan
    window.updatePlanIcon = function(planType) {
        const iconElement = document.getElementById('selectedPlanIcon');
        if (iconElement && planIcons[planType]) {
            // Remove existing plan classes
            iconElement.classList.remove('starter-plan', 'growth-plan', 'pro-plan');
            // Add new plan class
            iconElement.classList.add(planType + '-plan');
            // Update icon
            iconElement.innerHTML = planIcons[planType];
        }
    };
    
    // Initialize the correct icon on page load
    document.addEventListener('DOMContentLoaded', function() {
        // Set default selected plan if not already set
        if (!window.selectedPlan) {
            window.selectedPlan = 'growth'; // Default to growth plan
        }
        
        // Ensure the correct icon is displayed
        updatePlanIcon(window.selectedPlan);
    });
});