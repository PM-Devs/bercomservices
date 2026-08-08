const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
    photo: { type: String, default: '' },
    name: { type: String, required: true },
    role: { type: String, default: '' },
    bio: { type: String, default: '' },
    linkedinHref: { type: String, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
