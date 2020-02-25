const express = require('express');
const validators = require('../validators');
const guestNotifications = require('../helpers/guestNotificationsHelper');

const router = express.Router();

router.post('/set', async (req, res, next) => {
  const { params, validationError } = validators.validate(
    req.body, validators.guests.operationsSchema,
  );
  if (validationError) return res.status(422).json(validationError);
  await guestNotifications.setNotificationInRedis(params);
  res.status(200).send({ result: 'success' });
});

module.exports = router;
