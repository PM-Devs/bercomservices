// BerCom — motion/Lottie enhancements layered on top of main.js.
(function () {
    "use strict";

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.add('bc-motion-enabled');

    // ---------- Shared editorial reveal system ----------
    // Automatically covers CMS-added sections without requiring animation fields.
    var revealSelector = [
        '.home-hero-copy', '.home-request', '.home-trust > span',
        '.home-section-head > *', '.home-about-copy', '.home-about > p',
        '.home-duo', '.home-about-features > article', '.home-mission > article',
        '.home-image-grid > figure', '.home-service-feature', '.home-specialist-image',
        '.home-specialist-copy', '.home-iso-grid > article', '.home-quotes > article',
        '.home-client-row > span', '.home-cta > div',
        '.home-duo figure', '.home-service-photo', '.home-specialist-image',
        '.home-location-copy', '.home-map-frame', '.home-location-details > span',
        '.home-footer-main > *', '.home-footer-bottom',
        '.site-shell .bc-section > .container > *', '.site-shell .bc-page-hero-content',
        '.site-shell .bc-gallery-item', '.site-shell .bc-service-photo',
        '.site-shell .bc-team-img-wrap', '.site-shell .bc-value-card-photo-wrap',
        '.site-shell .bc-duo-photo', '.site-shell .bc-fbws-photo'
        , '.site-shell .bc-contact-map-embed'
    ].join(',');
    var revealItems = Array.prototype.slice.call(document.querySelectorAll(revealSelector));

    revealItems.forEach(function (item, index) {
        item.classList.add('bc-motion-reveal');
        if (item.matches('figure, .bc-gallery-item, .bc-service-photo, .bc-team-img-wrap, .bc-value-card-photo-wrap, .bc-duo-photo, .bc-fbws-photo, .home-service-photo, .home-specialist-image')) {
            item.classList.add('bc-motion-image');
        }
        var parent = item.parentElement;
        var siblingIndex = parent ? Array.prototype.indexOf.call(parent.children, item) : index;
        item.style.setProperty('--bc-reveal-delay', Math.min(siblingIndex, 5) * 70 + 'ms');
    });

    if (!reduceMotion && 'IntersectionObserver' in window) {
        var revealObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('bc-motion-visible');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
        revealItems.forEach(function (item) { revealObserver.observe(item); });
    } else {
        revealItems.forEach(function (item) { item.classList.add('bc-motion-visible'); });
    }

    // ---------- Header compression + reading progress ----------
    var siteHeader = document.querySelector('.home-nav, .site-nav');
    var progress = document.createElement('span');
    progress.className = 'bc-reading-progress';
    document.body.appendChild(progress);
    var ticking = false;
    function updateScrollMotion() {
        var scrollY = window.scrollY || window.pageYOffset;
        if (siteHeader) siteHeader.classList.toggle('bc-nav-scrolled', scrollY > 24);
        var scrollable = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = 'scaleX(' + (scrollable > 0 ? Math.min(scrollY / scrollable, 1) : 0) + ')';
        ticking = false;
    }
    window.addEventListener('scroll', function () {
        if (!ticking) { window.requestAnimationFrame(updateScrollMotion); ticking = true; }
    }, { passive: true });
    updateScrollMotion();

    // ---------- Gentle pointer depth for cards ----------
    if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.querySelectorAll('.bc-service-card, .bc-course-card, .bc-team-card, .home-quotes article, .home-iso-grid article').forEach(function (card) {
            card.classList.add('bc-motion-card');
            card.addEventListener('pointermove', function (event) {
                var rect = card.getBoundingClientRect();
                var rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 3;
                var rotateX = -((event.clientY - rect.top) / rect.height - 0.5) * 3;
                card.style.setProperty('--bc-tilt-x', rotateX.toFixed(2) + 'deg');
                card.style.setProperty('--bc-tilt-y', rotateY.toFixed(2) + 'deg');
            });
            card.addEventListener('pointerleave', function () {
                card.style.setProperty('--bc-tilt-x', '0deg');
                card.style.setProperty('--bc-tilt-y', '0deg');
            });
        });

        document.querySelectorAll('.home-white-btn, .home-call, .site-contact, .bc-btn-primary, .bc-btn-outline-primary').forEach(function (button) {
            button.classList.add('bc-motion-button');
            button.addEventListener('pointermove', function (event) {
                var rect = button.getBoundingClientRect();
                button.style.setProperty('--bc-move-x', ((event.clientX - rect.left - rect.width / 2) * 0.08) + 'px');
                button.style.setProperty('--bc-move-y', ((event.clientY - rect.top - rect.height / 2) * 0.12) + 'px');
            });
            button.addEventListener('pointerleave', function () {
                button.style.setProperty('--bc-move-x', '0px');
                button.style.setProperty('--bc-move-y', '0px');
            });
        });
    }

    // ---------- Numeric counter reveals ----------
    function animateCounter(element) {
        var raw = element.textContent.trim();
        var match = raw.match(/^([+-]?)(\d+(?:\.\d+)?)(.*)$/);
        if (!match || Number(match[2]) > 9999) return;
        var target = Number(match[2]);
        var prefix = match[1];
        var suffix = match[3];
        var decimals = (match[2].split('.')[1] || '').length;
        var start = performance.now();
        function frame(now) {
            var progressValue = Math.min((now - start) / 950, 1);
            var eased = 1 - Math.pow(1 - progressValue, 3);
            element.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
            if (progressValue < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }
    var counters = document.querySelectorAll('.home-trust b, .home-facts b, .bc-stat-value');
    if (!reduceMotion && 'IntersectionObserver' in window) {
        var counterObserver = new IntersectionObserver(function (entries, observer) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                animateCounter(entry.target); observer.unobserve(entry.target);
            });
        }, { threshold: 0.7 });
        counters.forEach(function (counter) { counterObserver.observe(counter); });
    }

    // ---------- Compact long-form content with accessible expansion ----------
    document.querySelectorAll('[data-read-more]').forEach(function (content, index) {
        if ((content.textContent || '').trim().length < 170) return;
        content.classList.add('bc-collapsible-text');
        content.style.setProperty('--bc-clamp-lines', content.dataset.lines || '4');
        var control = document.createElement('button');
        control.type = 'button';
        control.className = 'bc-read-more-control';
        control.textContent = 'Read more';
        control.setAttribute('aria-expanded', 'false');
        if (!content.id) content.id = 'bc-readable-' + index;
        control.setAttribute('aria-controls', content.id);
        content.insertAdjacentElement('afterend', control);
        control.addEventListener('click', function () {
            var expanded = content.classList.toggle('is-expanded');
            control.textContent = expanded ? 'Show less' : 'Read more';
            control.setAttribute('aria-expanded', String(expanded));
        });
    });

    document.querySelectorAll('.bc-capability-accordion').forEach(function (accordion) {
        accordion.querySelectorAll('.bc-capability-panel').forEach(function (panel) {
            panel.addEventListener('toggle', function () {
                if (!panel.open) return;
                accordion.querySelectorAll('.bc-capability-panel[open]').forEach(function (openPanel) {
                    if (openPanel !== panel) openPanel.removeAttribute('open');
                });
            });
        });
    });

    // ---------- Smooth internal page exit ----------
    if (!reduceMotion) {
        document.addEventListener('click', function (event) {
            var link = event.target.closest('a[href]');
            if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || link.target === '_blank') return;
            var url;
            try { url = new URL(link.href, window.location.href); } catch (e) { return; }
            if (url.origin !== window.location.origin || url.hash || link.href.startsWith('mailto:') || link.href.startsWith('tel:')) return;
            event.preventDefault();
            document.body.classList.add('bc-page-leaving');
            setTimeout(function () { window.location.href = url.href; }, 180);
        });
    }

    // ---------- Lottie: hero floating stat card pulse ring ----------
    document.querySelectorAll('.bc-hero-float-lottie').forEach(function (el) {
        if (window.lottie) {
            window.lottie.loadAnimation({
                container: el,
                path: '/img/lottie/pulse-ring.json',
                renderer: 'svg',
                loop: true,
                autoplay: true
            });
        }
    });

    // ---------- Scroll-reveal stagger for card grids (progressive
    // enhancement on top of WOW.js — works even on admin-added content
    // that has no hand-placed data-wow-delay attributes) ----------
    var staggerRoots = document.querySelectorAll('.row.g-4, .row.g-3');
    if ('IntersectionObserver' in window) {
        staggerRoots.forEach(function (row) {
            var items = row.querySelectorAll(':scope > [class*="col-"]');
            if (items.length < 2) return;

            items.forEach(function (item) { item.classList.add('bc-stagger-item'); });

            var observer = new IntersectionObserver(function (entries, obs) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    var siblings = Array.prototype.slice.call(items);
                    var index = siblings.indexOf(entry.target);
                    var delay = Math.min(index, 6) * 80;
                    setTimeout(function () { entry.target.classList.add('bc-in-view'); }, delay);
                    obs.unobserve(entry.target);
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

            items.forEach(function (item) { observer.observe(item); });
        });
    } else {
        staggerRoots.forEach(function (row) {
            row.querySelectorAll(':scope > [class*="col-"]').forEach(function (item) {
                item.classList.add('bc-in-view');
            });
        });
    }

    // ---------- Client card marquee (References sections) ----------
    // Wraps any row of 3+ .bc-client-card items in an auto-scrolling marquee,
    // duplicating the content once for a seamless loop. Pure progressive
    // enhancement — the CMS-driven markup underneath is untouched.
    document.querySelectorAll('.bc-client-card').forEach(function (card) {
        var col = card.closest('[class*="col-"]');
        var row = col ? col.parentElement : null;
        if (!row || row.dataset.bcMarqueeDone) return;
        row.dataset.bcMarqueeDone = 'true';

        var cards = Array.prototype.slice.call(row.querySelectorAll(':scope > [class*="col-"] > .bc-client-card'));
        if (cards.length < 3) return;

        var wrap = document.createElement('div');
        wrap.className = 'bc-marquee';
        var track = document.createElement('div');
        track.className = 'bc-marquee-track';

        cards.concat(cards).forEach(function (card) {
            track.appendChild(card.cloneNode(true));
        });
        wrap.appendChild(track);

        row.parentNode.replaceChild(wrap, row);
    });

    // ---------- Image Gallery: sliding carousel init ----------
    if (window.jQuery && window.jQuery.fn.owlCarousel) {
        window.jQuery('.bc-gallery-carousel').owlCarousel({
            items: 1,
            loop: true,
            autoplay: true,
            autoplayTimeout: 4500,
            smartSpeed: 700,
            dots: true,
            nav: true,
            navText: [
                '<i class="material-icons-round">chevron_left</i>',
                '<i class="material-icons-round">chevron_right</i>'
            ]
        });
    }

    // ---------- Image Gallery: click-to-enlarge lightbox ----------
    (function () {
        var lightbox = document.getElementById('bc-lightbox');
        if (!lightbox) return;
        var lightboxImg = document.getElementById('bcLightboxImg');
        var lightboxCaption = document.getElementById('bcLightboxCaption');

        document.addEventListener('click', function (e) {
            var item = e.target.closest('.bc-gallery-item');
            if (!item) return;
            lightboxImg.src = item.dataset.img;
            lightboxImg.alt = item.dataset.caption || '';
            lightboxCaption.textContent = item.dataset.caption || '';
            lightbox.classList.add('is-open');
        });

        function closeLightbox() { lightbox.classList.remove('is-open'); }

        document.getElementById('bcLightboxClose')?.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) closeLightbox();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeLightbox();
        });
    })();

    // ---------- Admin: Lottie loading indicator on "Run Research Now" ----------
    document.querySelectorAll('.bc-run-btn').forEach(function (btn) {
        var lottieContainer = btn.querySelector('.bc-run-btn-lottie');
        if (lottieContainer && window.lottie) {
            window.lottie.loadAnimation({
                container: lottieContainer,
                path: '/img/lottie/loading-dots.json',
                renderer: 'svg',
                loop: true,
                autoplay: false
            });
        }
        btn.closest('form')?.addEventListener('submit', function () {
            btn.classList.add('is-loading');
            if (lottieContainer && window.lottie) {
                var anim = window.lottie.getRegisteredAnimations().find(function (a) {
                    return a.wrapper === lottieContainer;
                });
                if (anim) anim.play();
            }
        });
    });
})();

// ---------- Pre-select the contact form's service dropdown from ?service=slug
// (used by "Request This Service" buttons on the Services page) ----------
(function () {
    "use strict";
    var params = new URLSearchParams(window.location.search);
    var wantedService = params.get('service');
    if (!wantedService) return;

    var select = document.querySelector('#contact-form select[name="service"], select#service');
    if (!select) return;

    var matched = Array.prototype.some.call(select.options, function (opt) {
        if (opt.value === wantedService) { select.value = wantedService; return true; }
        return false;
    });
    if (matched) {
        select.classList.add('bc-field-highlighted');
        setTimeout(function () { select.classList.remove('bc-field-highlighted'); }, 2500);
    }
})();
