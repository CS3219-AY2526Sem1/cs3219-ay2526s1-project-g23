export const requireAdmin = (req, res, next) => {
    try {
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Administrator privileges required'
            });
        }
        next();
    } catch (err) {
        res.status(500).json({
            error: 'Authentication error',
            message: 'Unable to verify user privileges'
        });
    }
};