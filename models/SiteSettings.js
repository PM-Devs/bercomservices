const mongoose = require('mongoose');

// The Services item's dropdown is generated live from the Service collection at render
// time (see partials/nav.ejs) — not stored here, so there's only ever one source of truth.
const navItemSchema = new mongoose.Schema({
    label: { type: String, required: true },
    href: { type: String, default: '' },
    targetSlug: { type: String, default: '' },
    anchorId: { type: String, default: '' }
}, { _id: false });

const footerLinkSchema = new mongoose.Schema({
    label: { type: String, required: true },
    href: { type: String, required: true }
}, { _id: false });

const siteSettingsSchema = new mongoose.Schema({
    companyName: { type: String, default: 'BerCom' },
    companySub: { type: String, default: 'Services' },
    tagline: { type: String, default: '' },
    foundingYear: { type: Number, default: 2018 },
    address: { type: String, default: 'Edificio Davinchi Malabo II, Malabo, Equatorial Guinea' },
    mapQuery: { type: String, default: 'Malabo Equatorial Guinea' },
    mapHeading: { type: String, default: 'Our Office Location' },
    mapIntro: { type: String, default: 'Visit our team in Malabo or open the location in Google Maps for directions.' },
    email: { type: String, default: 'contactus@bercomservices.com' },
    phone: { type: String, default: '+240 222 196 144' },
    website: { type: String, default: 'www.bercomserviceintegrations.com' },
    socialLinks: {
        linkedin: { type: String, default: '' },
        facebook: { type: String, default: '' },
        twitter: { type: String, default: '' }
    },
    nav: [navItemSchema],
    footer: {
        blurb: { type: String, default: '' },
        quickLinks: [footerLinkSchema],
        copyrightText: { type: String, default: '' },
        developerCredit: { type: String, default: '' }
    },
    pageHeroBackgroundImage: { type: String, default: '/img/banner-img.jpg' },
    research: {
        queries: [{ type: String }],
        autoRunEnabled: { type: Boolean, default: true },
        cronSchedule: { type: String, default: '0 6 * * *' },
        confidenceThreshold: { type: Number, default: 0.55 }
    }
}, { timestamps: true });

// Singleton accessor — the site only ever has one settings document.
siteSettingsSchema.statics.getSingleton = async function () {
    let doc = await this.findOne();
    if (!doc) {
        doc = await this.create({});
    }
    return doc;
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
