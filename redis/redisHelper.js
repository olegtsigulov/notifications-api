const { redisNotifyClient } = require('./redis');

exports.getUserNotifications = async (name) => {
  let result;
  try {
    result = await redisNotifyClient.lrangeAsync(`notifications:${name}`, 0, -1);
  } catch (error) {
    return { error };
  }
  const notifications = result.map((notification) => JSON.parse(notification));
  return { result: notifications };
};
