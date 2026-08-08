const mongoose = require('mongoose');

const SECTION_KINDS = [
    'HeroCarousel', 'StatsStrip', 'TextWithImage', 'FeatureCardGrid', 'ServiceCardGrid',
    'FeatureBlocksWithStats', 'IsoCardGrid', 'TagChipList', 'ClientCardGrid', 'ContactSection',
    'CourseCardGrid', 'EnrollmentForm', 'TeamGrid', 'TestimonialGrid', 'CtaBanner', 'RichText',
    'ImageGallery', 'DuoPhotoShowcase', 'LogoStrip'
];

const sectionSchema = new mongoose.Schema({
    kind: { type: String, enum: SECTION_KINDS, required: true },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
    anchorId: { type: String, default: '' },
    data: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const pageSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: String, default: '' },
    navLabel: { type: String, default: '' },
    pageHero: {
        label: { type: String, default: '' },
        title: { type: String, default: '' },
        backgroundImage: { type: String, default: '' }
    },
    sections: [sectionSchema],
    published: { type: Boolean, default: true }
}, { timestamps: true });

pageSchema.statics.SECTION_KINDS = SECTION_KINDS;

module.exports = mongoose.model('Page', pageSchema);
