import logger from '../utils/logger.js';

const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  logger.info({
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.body,
    headers: req.headers,
    ip: req.ip
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
};

export default requestLogger;

