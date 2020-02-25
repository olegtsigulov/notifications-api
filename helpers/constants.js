const notificationTypes = {
  FOLLOW: 'follow',
  REPLY: 'reply',
  TRANSFER: 'transfer',
  VOTE: 'vote',
  REBLOG: 'reblog',
  MENTION: 'mention',
};

const NOTIFICATION_EXPIRY = 5 * 24 * 3600;
const LIMIT = 25;

module.exports = {
  notificationTypes,
  NOTIFICATION_EXPIRY,
  LIMIT,
};
