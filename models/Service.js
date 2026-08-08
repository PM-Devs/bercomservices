const mongoose = require('mongoose');

const bulletGroupSchema = new mongoose.Schema({
    subheading: { type: String, default: '' },
    items: [{ type: String }]
}, { _id: false });

const serviceSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, required: true },
    iconSet: { type: String, enum: ['material', 'fontawesome'], default: 'material' },
    title: { type: String, required: true },
    photo: { type: String, default: '' },
    shortDescription: { type: String, default: '' },
    longDescription: { type: String, default: '' },
    bulletGroups: [bulletGroupSchema],
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
