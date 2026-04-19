document.addEventListener("DOMContentLoaded", () => {

    // 1. Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
        lerp: 0.1
    });

    gsap.registerPlugin(ScrollTrigger);

    // FIX: Single tick — optimized for smoothness
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(1000, 16); // Standard smoothing for better jitter handling
    lenis.on('scroll', ScrollTrigger.update);

    // 2. Custom Cursor
    const isPointerFine = window.matchMedia('(pointer: fine)').matches;
    if (isPointerFine) {
        const cursorDot  = document.getElementById('cursor-dot');
        const cursorRing = document.getElementById('cursor-ring');
        let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
        let smokeActive = false;
        let smokeTimer = null; // FIX: separate timer variable

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX; mouseY = e.clientY;
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top  = `${mouseY}px`;
            smokeActive = true;
            clearTimeout(smokeTimer);
            smokeTimer = setTimeout(() => { smokeActive = false; }, 200);
        });

        gsap.ticker.add(() => {
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;
            cursorRing.style.left = `${ringX}px`;
            cursorRing.style.top  = `${ringY}px`;
            drawSmoke();
        });

        const magneticEls = document.querySelectorAll('.magnetic');
        magneticEls.forEach((el) => {
            el.addEventListener('mousemove', function(e) {
                const bound = el.getBoundingClientRect();
                const strength = el.dataset.strength || 20;
                const px = (e.clientX - bound.left - (bound.width / 2)) / (bound.width / 2);
                const py = (e.clientY - bound.top  - (bound.height / 2)) / (bound.height / 2);
                gsap.to(el, { x: px * strength, y: py * strength, duration: 0.5, ease: "power2.out" });
                document.body.classList.add('cursor-hover');
            });
            el.addEventListener('mouseleave', function() {
                gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "power2.out" });
                document.body.classList.remove('cursor-hover');
            });
        });

        const hoverEls = document.querySelectorAll('a, button, .bento-item');
        hoverEls.forEach(el => {
            if (!el.classList.contains('magnetic')) {
                el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
                el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
            }
        });

        const canvas = document.getElementById('smoke-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        let particles = [];
        window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; particles = []; });

        function createParticle() {
            if (Math.random() > 0.4) {
                particles.push({ x: mouseX, y: mouseY, size: Math.random() * 8 + 2,
                    vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5 - 0.5, opacity: 0.15 });
            }
        }
        function drawSmoke() {
            if (!smokeActive && particles.length === 0) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (smokeActive) createParticle();
            for (let i = 0; i < particles.length; i++) {
                let p = particles[i];
                p.x += p.vx; p.y += p.vy; p.size += 0.1; p.opacity -= 0.003;
                if (p.opacity <= 0) { particles.splice(i, 1); i--; continue; }
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(150, 150, 150, ${p.opacity})`; ctx.fill();
            }
        }
    }

    // 3. Intro loader
    const loader = document.getElementById('intro-loader');
    if (loader) {
        gsap.to(loader, { opacity: 0, duration: 0.8, delay: 1.6, ease: "power2.inOut",
            onComplete: () => { loader.style.display = 'none'; } });
    }

    // 4. Hero Animations
    const heroTl = gsap.timeline({ delay: loader ? 1.8 : 0.4 });
    heroTl
        .to(".hero-title",    { y: 0, opacity: 1, duration: 1.2, ease: "power4.out" })
        .to(".hero-subtitle", { y: 0, opacity: 1, duration: 1,   ease: "power3.out" }, "-=0.8")
        .to(".hero-desc",     { opacity: 1, duration: 1, y: -10, ease: "power2.out" }, "-=0.6")
        .fromTo(".btn-primary", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.4")
        .to(".scroll-indicator", { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, "-=0.2");

    // 5. Horizontal Scroll — Services
    const servicesSection   = document.querySelector('.services');
    const servicesContainer = document.querySelector('.services-container');
    const serviceCards      = gsap.utils.toArray('.service-card');
    const isMobile = window.innerWidth < 768;

    if (!isMobile && servicesContainer) {
        gsap.to(servicesContainer, {
            x: () => -(servicesContainer.scrollWidth - window.innerWidth) - 100,
            ease: "none",
            scrollTrigger: {
                trigger: servicesSection, pin: true, scrub: 1, start: "top top",
                end: () => `+=${servicesContainer.scrollWidth - window.innerWidth + window.innerWidth}`,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    const activeIndex = Math.min(Math.floor(self.progress * serviceCards.length * 1.5), serviceCards.length - 1);
                    serviceCards.forEach((card, i) => {
                        if (i === activeIndex && !card.classList.contains('active')) {
                            const priceEl = card.querySelector('.card-price');
                            if (priceEl && !priceEl.dataset.animated) {
                                let match = priceEl.innerText.match(/\$(\d+)/);
                                if (match) {
                                    let target = parseInt(match[1]);
                                    let obj = { val: 0 };
                                    gsap.to(obj, { val: target, duration: 1.5, ease: "power2.out", onUpdate: () => {
                                        priceEl.innerText = priceEl.innerText.replace(/\$\d+/, '$' + Math.floor(obj.val));
                                    }});
                                    priceEl.dataset.animated = "true";
                                }
                            }
                        }
                        card.classList.toggle('active', i === activeIndex);
                    });
                }
            }
        });
        setTimeout(() => { 
            serviceCards[0].classList.add('active'); 
            const priceEl = serviceCards[0].querySelector('.card-price');
            if (priceEl && !priceEl.dataset.animated) {
                let match = priceEl.innerText.match(/\$(\d+)/);
                if (match) {
                    let target = parseInt(match[1]);
                    let obj = { val: 0 };
                    gsap.to(obj, { val: target, duration: 1.5, ease: "power2.out", onUpdate: () => {
                        priceEl.innerText = priceEl.innerText.replace(/\$\d+/, '$' + Math.floor(obj.val));
                    }});
                    priceEl.dataset.animated = "true";
                }
            }
        }, 500);
    } else {
        serviceCards.forEach(card => card.classList.add('active'));
    }

    // Gallery Header Fade-in
    gsap.fromTo(".section-header h2", { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: ".section-header", start: "top 85%" }
    });

    // 6. Gallery Parallax
    const bentoItems = gsap.utils.toArray('.img-parallax img, .img-parallax video');
    bentoItems.forEach(item => {
        gsap.to(item, { y: "10%", ease: "none",
            scrollTrigger: { trigger: item.parentNode, start: "top bottom", end: "bottom top", scrub: true }
        });
    });

    // 7. Footer Logo Scale
    const footerLogo = document.querySelector('.logo-scale');
    if (footerLogo) {
        gsap.fromTo(footerLogo, { scale: 0.5, opacity: 0.02 }, {
            scale: 1.15, opacity: 0.06, ease: "none",
            scrollTrigger: { trigger: ".mega-footer", start: "top bottom", end: "bottom bottom", scrub: true }
        });
    }

    // 8. Footer fade-in
    gsap.fromTo(".footer-top", { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: ".footer-top", start: "top 85%" }
    });

    // 9. Newsletter
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = newsletterForm.querySelector('button');
            btn.textContent = 'SUBSCRIBED ✓';
            btn.style.background = 'var(--gold)';
            btn.style.color = '#000';
            btn.disabled = true;
        });
    }

    // 10. Mobile nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
            navToggle.classList.toggle('open');
        });
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                navToggle.classList.remove('open');
            });
        });
    }

    // 11. Performance Optimization for Videos
    const videos = document.querySelectorAll('video');
    if ('IntersectionObserver' in window) {
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    video.play().catch(e => console.log('Video autoplay prevented', e));
                } else {
                    video.pause();
                }
            });
        }, { rootMargin: '200px' });
        
        videos.forEach(video => {
            videoObserver.observe(video);
        });
    }

});
