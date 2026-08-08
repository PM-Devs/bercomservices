const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
    prospectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prospect', required: true },
    type: { type: String, enum: ['email', 'proposal'], default: 'email' },
    subject: { type: String, default: '' },
    body: { type: String, default: '' },
    status: {
        type: String,
        enum: ['pending_review', 'approved', 'rejected', 'sent'],
        default: 'pending_review'
    },
    reviewedBy: { type: String, default: '' },
    reviewedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Draft', draftSchema);
