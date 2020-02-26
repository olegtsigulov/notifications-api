const Joi = require('@hapi/joi');

exports.operationsSchema = Joi.object().keys({
  id: Joi.string().valid('comment', 'custom_json', 'vote').required(),
  block: Joi.number().required(),
  operation: Joi.when('id', {
    is: 'comment',
    then: Joi.object().keys({
      author: Joi.string().required(),
      permlink: Joi.string().required(),
      parent_author: Joi.string().allow('').required(),
      parent_permlink: Joi.string().allow('').required(),
      title: Joi.string().allow('').required(),
      body: Joi.string().required(),
    }),
    otherwise: Joi.object().keys({
      id: Joi.string().default('follow'),
      json: Joi.string().required(),
    }),
  }),
});
