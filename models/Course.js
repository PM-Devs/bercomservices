const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true, trim: true },
    category: { type: String, enum: ['iso-lead-auditor', 'hse-safety'], required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    photo: { type: String, default: '' },
    bullets: [{ type: String }],
    durationLabel: { type: String, default: '' },
    gradientKey: { type: String, default: 'iso-9001' },
    icon: { type: String, default: 'school' },
    priceLabel: { type: String, default: 'Price' },
    priceValue: { type: String, default: 'Contact Us' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
