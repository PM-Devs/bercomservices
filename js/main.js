(function ($) {
    "use strict";

    // Spinner
    setTimeout(function () {
        $('#spinner').removeClass('show');
    }, 1);

    // WOW.js animations
    new WOW().init();

    // Navbar — add 'scrolled' class on scroll
    $(window).on('scroll', function () {
        var scrollTop = $(this).scrollTop();

        if (scrollTop > 60) {
            $('#mainNav').addClass('scrolled');
        } else {
            $('#mainNav').removeClass('scrolled');
        }

        // Back to top visibility
        if (scrollTop > 300) {
            $('#backToTop').addClass('active');
        } else {
            $('#backToTop').removeClass('active');
        }
    });

    // Back to top click
    $('#backToTop').on('click', function (e) {
        e.preventDefault();
        $('html, body').animate({ scrollTop: 0 }, 600, 'easeInOutExpo');
    });

    // Smooth scroll for anchor links in navbar
    $('a[href^="#"]').not('#backToTop').on('click', function (e) {
        var target = $(this.getAttribute('href'));
        if (target.length) {
            e.preventDefault();
            var offset = target.offset().top - 76; // navbar height
            $('html, body').animate({ scrollTop: offset }, 500, 'easeInOutExpo');
            // Close mobile menu if open
            $('#navbarNav').collapse('hide');
        }
    });

    // Hero Carousel
    $(".bc-hero-carousel").owlCarousel({
        animateOut: 'fadeOut',
        animateIn: 'fadeIn',
        items: 1,
        margin: 0,
        stagePadding: 0,
        autoplay: true,
        autoplayTimeout: 5500,
        autoplayHoverPause: true,
        smartSpeed: 900,
        dots: true,
        loop: true,
        nav: true,
        navText: [
            '<i class="bi bi-chevron-left"></i>',
            '<i class="bi bi-chevron-right"></i>'
        ]
    });

    // Remove legacy carousel selectors (kept for any other pages using them)
    if ($(".header-carousel").length) {
        $(".header-carousel").owlCarousel({
            animateOut: 'fadeOut',
            items: 1,
            autoplay: true,
            smartSpeed: 900,
            dots: false,
            loop: true,
            nav: true,
            navText: [
                '<i class="bi bi-arrow-left"></i>',
                '<i class="bi bi-arrow-right"></i>'
            ]
        });
    }

    // Service carousel (other pages)
    if ($(".service-carousel").length) {
        $(".service-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 1800,
            dots: false,
            loop: true,
            margin: 24,
            nav: true,
            navText: [
                '<i class="bi bi-arrow-left"></i>',
                '<i class="bi bi-arrow-right"></i>'
            ],
            responsive: {
                0:    { items: 1 },
                768:  { items: 2 },
                1200: { items: 2 }
            }
        });
    }

    // Testimonial carousel (other pages)
    if ($(".testimonial-carousel").length) {
        $(".testimonial-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 1400,
            dots: true,
            loop: true,
            margin: 24,
            nav: false,
            responsive: {
                0:    { items: 1 },
                1200: { items: 2 }
            }
        });
    }

    // Active nav link on scroll (highlight current section)
    var sections = $('section[id], div[id]');
    $(window).on('scroll.spy', function () {
        var scrollPos = $(this).scrollTop() + 100;
        sections.each(function () {
            var top    = $(this).offset().top;
            var bottom = top + $(this).outerHeight();
            var id     = $(this).attr('id');
            if (scrollPos >= top && scrollPos < bottom) {
                $('.bc-nav-link').removeClass('active');
                $('.bc-nav-link[href="#' + id + '"]').addClass('active');
            }
        });
    });

    // Course multi-select dropdown
    var $dropBtn  = $('#courseDropBtn');
    var $dropMenu = $('#courseDropMenu');
    var $dropLabel = $('#courseDropLabel');

    $dropBtn.on('click', function () {
        var isOpen = $dropMenu.hasClass('open');
        $dropMenu.toggleClass('open');
        $dropBtn.toggleClass('open').attr('aria-expanded', !isOpen);
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('#courseDropdown').length) {
            $dropMenu.removeClass('open');
            $dropBtn.removeClass('open').attr('aria-expanded', false);
        }
    });

    $('#courseDropMenu input[type="checkbox"]').on('change', function () {
        var checked = $('#courseDropMenu input:checked');
        if (checked.length === 0) {
            $dropLabel.text('Select course(s)…').removeClass('has-selection');
        } else if (checked.length === 1) {
            $dropLabel.text($(checked[0]).closest('label').text().trim()).addClass('has-selection');
        } else {
            $dropLabel.text(checked.length + ' courses selected').addClass('has-selection');
        }
    });

    // Testimonial carousel
    if ($(".bc-testimonial-carousel").length) {
        $(".bc-testimonial-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 1400,
            dots: true,
            loop: true,
            margin: 24,
            nav: false,
            responsive: {
                0:   { items: 1 },
                992: { items: 2 }
            }
        });
    }

})(jQuery);
