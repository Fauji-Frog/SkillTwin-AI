const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        const details = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: details[0]?.message || 'Validation failed',
            details
          }
        });
      }

      req[source] = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { validate };
