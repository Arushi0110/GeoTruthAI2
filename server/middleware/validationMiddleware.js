import { validationResult } from 'express-validator';

/**
 * Handle validation errors from express-validator
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    const errorMessages = errors.array().map((err) => err.msg).join(', ');
    return next(new Error(errorMessages));
  }
  next();
};

