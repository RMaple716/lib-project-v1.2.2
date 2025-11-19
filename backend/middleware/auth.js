const { verifyToken } = require('../utils/jwt');

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        errorCode: 'UNAUTHORIZED',
        message: '请提供有效的Token'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      errorCode: 'TOKEN_INVALID',
      message: 'Token无效或已过期'
    });
  }
}

module.exports = {
  authenticate
};