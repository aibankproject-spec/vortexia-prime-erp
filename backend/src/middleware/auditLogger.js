const AuditLog = require('../models/AuditLog');

const auditLog = (module, action) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      if (res.statusCode < 400 && req.user) {
        AuditLog.create({
          user: req.user._id,
          action,
          module,
          entityType: module,
          entityId: data?.data?._id || req.params.id,
          description: `${action} on ${module}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          status: 'success',
        }).catch(err => console.error('Audit log error:', err));
      }
      return originalJson(data);
    };

    next();
  };
};

module.exports = auditLog;
