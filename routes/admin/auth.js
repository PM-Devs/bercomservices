const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const User = require('../../models/User');
const { redirectIfAuthed } = require('../../middleware/auth');

router.use((req, res, next) => {
    res.locals.layout = 'admin/layout';
    next();
});

router.get('/login', redirectIfAuthed, (req, res) => {
    res.render('admin/login', { title: 'Admin Login' });
});

router.post('/login', redirectIfAuthed, async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });

    if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/admin/login');
    }

    req.session.userId = user._id.toString();
    req.session.userEmail = user.email;
    user.lastLoginAt = new Date();
    await user.save();

    const returnTo = req.session.returnTo || '/admin';
    delete req.session.returnTo;
    res.redirect(returnTo);
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/admin/login'));
});

module.exports = router;
