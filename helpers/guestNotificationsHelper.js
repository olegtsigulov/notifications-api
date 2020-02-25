const { getgNotifications } = require('./notificationsHelper');
const { redisNotifyClient } = require('../helpers/redis');
const { clientSend } = require('./wssHelper');

const NOTIFICATION_EXPIRY = 5 * 24 * 3600;
const LIMIT = 25;

const setNotificationInRedis = async (data) => {
  const redisOps = [];
  const operation = {
    timestamp: new Date().toISOString(),
    block: +data.block,
    op: [
      data.id,
      data.operation,
    ],
  };
  const notifications = getgNotifications(operation);
  notifications.forEach((notification) => {
    const key = `notifications:${notification[0]}`;
    redisOps.push([
      'lpush',
      key,
      JSON.stringify(notification[1]),
    ]);
    redisOps.push(['expire', key, NOTIFICATION_EXPIRY]);
    redisOps.push(['ltrim', key, 0, LIMIT - 1]);
  });
  await redisNotifyClient.multi(redisOps).execAsync();
  clientSend(notifications);
};

module.exports = { setNotificationInRedis };
