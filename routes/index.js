const express = require('express');
const authMiddleware = require('../middlewares/steemConnectAuth');
const validationMiddleware = require('../middlewares/apiKeyValidation');
const notifications = require('./notifications');
const guestNotifications = require('./guest-notifications');

const router = express.Router();

router.use('/notifications', authMiddleware, notifications);
router.use('/guest-notifications', validationMiddleware, guestNotifications);

module.exports = router;
