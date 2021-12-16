module.exports = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        req.session.returnTo = req.route.path; 
        return res.redirect('/login')
    }
    next();
}