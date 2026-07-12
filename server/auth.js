import jwt from 'jsonwebtoken';

export function signToken(payload, secret) {
  return jwt.sign(payload, secret, { expiresIn: '8h', issuer: 'anti-kuddus-protocol' });
}

export function requireAuth(secret, roles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) return res.status(401).json({ message: 'Please log in first.' });

    try {
      const user = jwt.verify(token, secret, { issuer: 'anti-kuddus-protocol' });
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ message: 'You do not have permission for this action.' });
      }
      req.user = user;
      next();
    } catch {
      return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
    }
  };
}
