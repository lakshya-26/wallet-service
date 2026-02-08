const sendResponse = (req, res) => {
  const { statusCode, data, message = "Success" } = req;

  res.status(statusCode).json({
    statusCode,
    data,
    message,
  });

  return res.end();
};

module.exports = {
  sendResponse,
};
