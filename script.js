/**
 * HIATO — Creative Technology Studio
 * Interactive functionality
 */

// Project data for lightbox
const projectData = {
    rimal: {
        title: 'RIMAL — Exterior',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=90'
    },
    lumina: {
        title: 'LUMINA — Interactive',
        image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1600&q=90'
    },
    flux: {
        title: 'FLUX — Event',
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&q=90'
    },
    oasis: {
        title: 'OASIS — Immersive Room',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=90'
    },
    pulse: {
        title: 'PULSE — Generative',
        image: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1600&q=90'
    },
    meridian: {
        title: 'MERIDIAN — Mapping',
        image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1600&q=90'
    }
};

// DOM Elements
const nav = document.querySelector('.nav');
const navToggle = document.querySelector('.nav-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileMenuLinks = document.querySelectorAll('.mobile-menu a');
const workItems = document.querySelectorAll('.work-item');
const lightbox = document.getElementById('lightbox');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxImage = document.querySelector('.lightbox-image img');
const animatedElements = document.querySelectorAll('[data-animate]');
const contactForm = document.querySelector('.contact-form');

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    setupMobileMenu();
    setupLightbox();
    setupScrollAnimations();
    setupSmoothScroll();
    setupContactForm();
    setupNavScroll();
}

// Mobile Menu
function setupMobileMenu() {
    navToggle.addEventListener('click', toggleMobileMenu);
    
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });
}

function toggleMobileMenu() {
    navToggle.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
}

function closeMobileMenu() {
    navToggle.classList.remove('active');
    mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
}

// Lightbox
function setupLightbox() {
    workItems.forEach(item => {
        item.addEventListener('click', () => {
            const projectId = item.dataset.project;
            const project = projectData[projectId];
            
            if (project) {
                openLightbox(project);
            }
        });
    });
    
    lightboxClose.addEventListener('click', closeLightbox);
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
}

function openLightbox(project) {
    lightboxImage.src = project.image;
    lightboxImage.alt = project.title;
    
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

// Scroll Animations
function setupScrollAnimations() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        }
    );
    
    animatedElements.forEach(el => observer.observe(el));
}

// Smooth Scroll for anchor links
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Contact Form
function setupContactForm() {
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message')
        };
        
        // Simulate form submission
        const submitBtn = contactForm.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            submitBtn.textContent = 'Message Sent!';
            contactForm.reset();
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        }, 1500);
        
        // In production, you would send the data to a server
        console.log('Form submitted:', data);
    });
}

// Navigation scroll effect
function setupNavScroll() {
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add background after scrolling past hero
        if (currentScroll > window.innerHeight * 0.5) {
            nav.style.background = 'rgba(10, 10, 10, 0.9)';
            nav.style.backdropFilter = 'blur(10px)';
            nav.style.mixBlendMode = 'normal';
        } else {
            nav.style.background = 'transparent';
            nav.style.backdropFilter = 'none';
            nav.style.mixBlendMode = 'difference';
        }
        
        lastScroll = currentScroll;
    });
}

// Parallax effect for hero (subtle)
function setupParallax() {
    const hero = document.querySelector('.hero-content');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.3;
        
        if (hero && scrolled < window.innerHeight) {
            hero.style.transform = `translateY(${rate}px)`;
            hero.style.opacity = 1 - (scrolled / window.innerHeight);
        }
    });
}

// Call parallax setup
setupParallax();

