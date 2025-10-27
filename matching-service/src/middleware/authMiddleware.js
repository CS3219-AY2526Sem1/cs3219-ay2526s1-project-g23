const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No valid authorization token provided'
      });
    }
    
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    
    const verifyResponse = await fetch(`${userServiceUrl}/auth/verify-token`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    
    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json().catch(() => ({}));
      return res.status(verifyResponse.status).json({
        error: errorData.error || 'Authentication failed',
        message: errorData.message || 'Token verification failed'
      });
    }
    
    const verifyResult = await verifyResponse.json();
    
    // Add user info to request from user-service response
    req.user = {
      userId: verifyResult.user.id,
      username: verifyResult.user.username,
      email: verifyResult.user.email,
      isAdmin: verifyResult.user.isAdmin || false,
      preferences: verifyResult.user.preferences,
      stats: verifyResult.user.stats
    };
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    
    if (err.code === 'ECONNREFUSED' || err.name === 'FetchError') {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'User authentication service is temporarily unavailable'
      });
    }
    
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Unable to verify authentication'
    });
  }
};

export default authMiddleware;