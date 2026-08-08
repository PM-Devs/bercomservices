const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    quoteText: { type: String, required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, default: '' },
    photo: { type: String, default: '' },
    avatarInitials: { type: String, default: '' },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    serviceIcon: { type: String, default: 'verified' },
    serviceLabel: { type: String, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
