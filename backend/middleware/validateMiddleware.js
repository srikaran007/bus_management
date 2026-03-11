const validate =
  (schema) =>
  (req, _res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const message = error.details.map((d) => d.message).join(", ");
      return next(Object.assign(new Error(message), { statusCode: 400 }));
    }

    req.body = value;
    return next();
  };

module.exports = { validate };
