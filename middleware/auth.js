function requireAdmin(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    req.session.returnTo = req.originalUrl;
    return res.redirect('/admin/login');
}

function redirectIfAuthed(req, res, next) {
    if (req.session && req.session.userId) {
        return res.redirect('/admin');
    }
    return next();
}

module.exports = { requireAdmin, redirectIfAuthed };
