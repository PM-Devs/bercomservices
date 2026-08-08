const SLUG_TO_PATH = {
    home: '/',
    about: '/about',
    services: '/services',
    courses: '/courses',
    team: '/team',
    testimonials: '/testimonials',
    contact: '/contact'
};

function pathForSlug(slug) {
    return SLUG_TO_PATH[slug] || `/${slug}`;
}

// Same-page anchors smooth-scroll (main.js intercepts a[href^="#"]); anchors on
// another page need a real navigation first, so only same-page links stay bare "#id".
function anchorHref(currentSlug, targetSlug, anchorId) {
    if (!anchorId) return pathForSlug(targetSlug);
    if (currentSlug === targetSlug) return `#${anchorId}`;
    return `${pathForSlug(targetSlug)}#${anchorId}`;
}

module.exports = { pathForSlug, anchorHref };
