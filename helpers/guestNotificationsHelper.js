const { getNotifications, prepareDataForRedis } = require('./notificationsHelper');
const { redisNotifyClient } = require('../helpers/redis');
const { clientSend } = require('./wssHelper');

const setNotificationInRedis = async (data) => {
  const operation = {
    timestamp: new Date().toISOString(),
    block: +data.block,
    op: [
      data.id,
      data.operation,
    ],
  };
  const notifications = getNotifications(operation);
  const redisOps = prepareDataForRedis(notifications);
  await redisNotifyClient.multi(redisOps).execAsync();
  clientSend(notifications);
};

module.exports = { setNotificationInRedis };
