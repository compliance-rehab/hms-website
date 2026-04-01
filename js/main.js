/* ═══════════════════════════════════════════════════
   HIPAA Made Simple — Scroll-Driven Animation + UI
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function init() {
        setupScrollCanvas();

        if (reducedMotion) return;

        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            setTimeout(init, 50);
            return;
        }

        gsap.registerPlugin(ScrollTrigger);
        setupSectionAnimations();
        setupNav();
    }

    /* ─── SCROLL-DRIVEN CANVAS ─── */
    function setupScrollCanvas() {
        var canvas = document.getElementById('scroll-canvas');
        if (!canvas) return;

        var ctx = canvas.getContext('2d');
        var frameCount = 121;
        var frames = [];
        var loadedCount = 0;
        var currentFrame = -1;
        var heroOverlay = document.getElementById('heroOverlay');
        var chaosOverlay = document.getElementById('chaosOverlay');

        // Set canvas size for retina
        function sizeCanvas() {
            var dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
            if (currentFrame >= 0) renderFrame(currentFrame);
        }

        sizeCanvas();
        window.addEventListener('resize', sizeCanvas);

        // Preload all frames
        for (var i = 1; i <= frameCount; i++) {
            var img = new Image();
            img.src = 'assets/frames/frame-' + String(i).padStart(3, '0') + '.jpg';
            frames.push(img);
            img.onload = function () {
                loadedCount++;
                if (loadedCount === 1) {
                    // Render first frame immediately
                    renderFrame(0);
                }
                if (loadedCount === frameCount) {
                    activateScrollAnimation();
                }
            };
        }

        var imageYOffset = 0; // scroll-driven offset to push image down

        function renderFrame(index) {
            if (!frames[index] || !frames[index].complete) return;
            currentFrame = index;

            var dpr = window.devicePixelRatio || 1;
            var cw = canvas.width;
            var ch = canvas.height;
            var iw = frames[index].naturalWidth;
            var ih = frames[index].naturalHeight;

            ctx.fillStyle = '#f9f9f9';
            ctx.fillRect(0, 0, cw, ch);

            // Responsive scaling strategy:
            // Landscape: size by width (50%). Portrait: size by height (45%)
            var aspect = cw / ch;
            var sw, sh, scale;
            if (aspect >= 1) {
                sw = cw * 0.5;
                scale = sw / iw;
                sh = ih * scale;
            } else {
                sh = ch * 0.45;
                scale = sh / ih;
                sw = iw * scale;
            }
            var sx = (cw - sw) / 2;
            var sy = (aspect >= 1 ? ch * 0.08 : ch * 0.03) + imageYOffset;

            ctx.drawImage(frames[index], sx, sy, sw, sh);
        }

        function activateScrollAnimation() {
            var track = document.querySelector('.hero-scroll-track');
            if (!track) return;

            window.addEventListener('scroll', function () {
                var rect = track.getBoundingClientRect();
                var trackHeight = track.offsetHeight - window.innerHeight;
                var scrolled = -rect.top;
                var progress = Math.max(0, Math.min(1, scrolled / trackHeight));

                // Push image down gradually as chaos text appears (30%-80%)
                var dpr = window.devicePixelRatio || 1;
                var pushProgress = Math.max(0, Math.min(1, (progress - 0.3) / 0.5));
                var pushEased = pushProgress * pushProgress * (3 - 2 * pushProgress);
                imageYOffset = pushEased * window.innerHeight * 0.15 * dpr;

                // Map progress to frame index
                var index = Math.min(
                    Math.floor(progress * (frameCount - 1)),
                    frameCount - 1
                );
                // Re-render if frame changed OR if image is being pushed
                if (index !== currentFrame || pushProgress > 0) {
                    renderFrame(index);
                }

                // Hero text: fade out + scale down over first 30% of scroll
                if (heroOverlay) {
                    var heroProgress = Math.min(1, progress / 0.3);
                    var heroOpacity = 1 - heroProgress;
                    var heroScale = 1 - (heroProgress * 0.15); // shrink to 0.85
                    var heroY = heroProgress * -40; // drift up slightly
                    heroOverlay.style.opacity = heroOpacity;
                    heroOverlay.style.transform = 'scale(' + heroScale + ') translateY(' + heroY + 'px)';
                    heroOverlay.style.pointerEvents = heroOpacity < 0.1 ? 'none' : 'auto';
                }

                // Slide up chaos text at 30% — right as hero fades, chaos unfolds beneath
                if (chaosOverlay) {
                    if (progress > 0.3) {
                        chaosOverlay.classList.add('visible');
                    } else {
                        chaosOverlay.classList.remove('visible');
                    }
                }
            }, { passive: true });
        }
    }

    /* ─── SECTION ANIMATIONS (GSAP) ─── */
    function setupSectionAnimations() {
        // Social proof bar
        gsap.from('.proof-text', {
            y: 20, opacity: 0, duration: 0.6,
            scrollTrigger: { trigger: '.proof-bar', start: 'top 85%' }
        });

        // Feature cards
        document.querySelectorAll('.feature-card').forEach(function (card, i) {
            gsap.from(card, {
                y: 40, opacity: 0, duration: 0.7, delay: i * 0.15,
                scrollTrigger: { trigger: card, start: 'top 85%' }
            });
        });

        // How it works steps
        document.querySelectorAll('.step').forEach(function (step, i) {
            gsap.from(step, {
                x: -30, opacity: 0, duration: 0.6, delay: i * 0.12,
                scrollTrigger: { trigger: step, start: 'top 85%' }
            });
        });

        // Step connectors
        document.querySelectorAll('.step-connector').forEach(function (conn) {
            gsap.from(conn, {
                scaleY: 0, transformOrigin: 'top', duration: 0.5,
                scrollTrigger: { trigger: conn, start: 'top 80%' }
            });
        });

        // Three tiers
        document.querySelectorAll('.tier').forEach(function (tier, i) {
            gsap.from(tier, {
                y: 40, opacity: 0, duration: 0.7, delay: i * 0.12,
                scrollTrigger: { trigger: tier, start: 'top 85%' }
            });
        });

        // Price card
        var priceCard = document.querySelector('.price-card');
        if (priceCard) {
            gsap.from(priceCard, {
                y: 40, opacity: 0, duration: 0.7,
                scrollTrigger: { trigger: priceCard, start: 'top 85%' }
            });
        }

        // Credibility paragraphs
        document.querySelectorAll('.cred-body').forEach(function (p, i) {
            gsap.from(p, {
                y: 20, opacity: 0, duration: 0.6, delay: i * 0.1,
                scrollTrigger: { trigger: p, start: 'top 85%' }
            });
        });

        // Section headers
        document.querySelectorAll('.section-head').forEach(function (head) {
            gsap.from(head, {
                y: 30, opacity: 0, duration: 0.6,
                scrollTrigger: { trigger: head, start: 'top 88%' }
            });
        });

        document.querySelectorAll('.section-sub').forEach(function (sub) {
            gsap.from(sub, {
                y: 20, opacity: 0, duration: 0.5, delay: 0.1,
                scrollTrigger: { trigger: sub, start: 'top 88%' }
            });
        });

        // Final CTA
        gsap.from('.final-cta .btn', {
            y: 20, opacity: 0, duration: 0.6,
            scrollTrigger: { trigger: '.final-cta', start: 'top 75%' }
        });
    }

    /* ─── NAV HIDE/SHOW ON SCROLL ─── */
    function setupNav() {
        var nav = document.getElementById('nav');
        if (!nav) return;
        var lastScroll = 0;
        nav.style.transition = 'transform 0.3s ease';

        window.addEventListener('scroll', function () {
            var scroll = window.scrollY;
            if (scroll > 300 && scroll > lastScroll) {
                nav.style.transform = 'translateY(-100%)';
            } else {
                nav.style.transform = 'translateY(0)';
            }
            lastScroll = scroll;
        }, { passive: true });
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
