const _ = require('lodash');
const { LIMIT, NOTIFICATION_EXPIRY } = require('./constants');

const getNotificationsFromCustomJSON = (operation, params) => {
  const notifications = [];
  let json = {};
  try {
    json = JSON.parse(params.json);
  } catch (err) {
    console.log('Wrong json format on custom_json', err);
  }
  if (params.id === 'follow') {
    /** Find follow */
    if (
      json[0] === 'follow'
      && json[1].follower
      && json[1].following
      && _.has(json, '[1].what[0]')
      && json[1].what[0] === 'blog'
    ) {
      const notification = {
        type: 'follow',
        follower: json[1].follower,
        timestamp: Date.parse(operation.timestamp) / 1000,
        block: operation.block,
      };
      notifications.push([json[1].following, notification]);
    }
    /** Find reblog */
    if (json[0] === 'reblog' && json[1].account && json[1].author && json[1].permlink) {
      const notification = {
        type: 'reblog',
        account: json[1].account,
        permlink: json[1].permlink,
        timestamp: Math.round(Date.parse(operation.timestamp) / 1000),
        block: operation.block,
      };
      notifications.push([json[1].author, notification]);
    }
  }
  return notifications;
};


const getNotificationsFromComment = (operation, params) => {
  const notifications = [];
  const isRootPost = !params.parent_author;

  /** Find replies */
  if (!isRootPost) {
    const notification = {
      type: 'reply',
      parent_permlink: params.parent_permlink,
      author: params.author,
      permlink: params.permlink,
      timestamp: Date.parse(operation.timestamp) / 1000,
      block: operation.block,
    };
    notifications.push([params.parent_author, notification]);
  }

  /** Find mentions */
  const pattern = /(@[a-z][-.a-z\d]+[a-z\d])/gi;
  const content = `${params.title} ${params.body}`;
  const mentions = _
    .without(
      _
        .uniq(
          (content.match(pattern) || [])
            .join('@')
            .toLowerCase()
            .split('@'),
        )
        .filter((n) => n),
      params.author,
    )
    .slice(0, 9); // Handle maximum 10 mentions per post
  if (mentions.length) {
    mentions.forEach((mention) => {
      const notification = {
        type: 'mention',
        is_root_post: isRootPost,
        author: params.author,
        permlink: params.permlink,
        timestamp: Date.parse(operation.timestamp) / 1000,
        block: operation.block,
      };
      notifications.push([mention, notification]);
    });
  }
  return notifications;
};


const getNotifications = (operation) => {
  let notifications = [];
  const type = operation.op[0];
  const params = operation.op[1];
  switch (type) {
    case 'comment': {
      notifications = _.concat(notifications, getNotificationsFromComment(operation, params));
      break;
    }
    case 'custom_json': {
      notifications =  _.concat(notifications, getNotificationsFromCustomJSON(operation, params));
      break;
    }
    case 'account_witness_vote': {
      /** Find witness vote */
      const notification = {
        type: 'witness_vote',
        account: params.account,
        approve: params.approve,
        timestamp: Date.parse(operation.timestamp) / 1000,
        block: operation.block,
      };
      notifications.push([params.witness, notification]);
      break;
    }
    case 'transfer': {
      /** Find transfer */
      const notification = {
        type: 'transfer',
        from: params.from,
        amount: params.amount,
        memo: params.memo,
        timestamp: Date.parse(operation.timestamp) / 1000,
        block: operation.block,
      };
      notifications.push([params.to, notification]);
      break;
    }
  }
  return notifications;
};


const prepareDataForRedis = (notifications) => {
  const redisOps = [];
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
  return redisOps;
};

module.exports = { getNotifications, prepareDataForRedis };
