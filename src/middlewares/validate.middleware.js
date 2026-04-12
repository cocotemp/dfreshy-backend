const { ValidationError } = require('../utils/errors');

/**
 * Validation middleware stub
 * TODO: Integrate with Joi or similar validation library
 */
const validate = (schema) => {
    return (req, res, next) => {
        // TODO: Implement validation logic
        // Example: const { error } = schema.validate(req.body);
        // if (error) throw new ValidationError(error.details[0].message);

        next();
    };
};

module.exports = validate;
