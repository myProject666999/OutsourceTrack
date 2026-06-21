function success(res, data, message) {
  return res.json({ code: 0, message: message || 'success', data });
}

function paginate(res, list, total, page, pageSize) {
  return res.json({
    code: 0,
    message: 'success',
    data: { list, total, page: Number(page), pageSize: Number(pageSize) }
  });
}

function fail(res, message, statusCode) {
  return res.status(statusCode || 400).json({ code: -1, message: message || 'error', data: null });
}

module.exports = { success, paginate, fail };
