// Validate those with a req.body
const validateRequest = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errorMessage = result.error.issues.map((err) => err.message);
      const error = errorMessage.join(", ");
      return res.status(400).json({ error: error });
    }

    next();
  };
};

module.exports = validateRequest;
