const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const sendResponse = (res, statusCode, data, message = 'Success') => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendPaginatedResponse = (res, statusCode, data, total, pagination) => {
  res.status(statusCode).json({
    success: true,
    count: data.length,
    total,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      pages: Math.ceil(total / pagination.limit),
    },
    data,
  });
};

module.exports = { asyncHandler, sendResponse, sendPaginatedResponse };
