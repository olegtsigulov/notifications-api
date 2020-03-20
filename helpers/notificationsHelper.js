const _ = require('lodash');
const { LIMIT, NOTIFICATION_EXPIRY } = require('./constants');
const { clientSend } = require('./wssHelper');
const { redisNotifyClient } = require('../redis/redis');

const fromCustomJSON = (operation, params) => {
  const notifications = [];
  if (params.id === 'follow') {
    const notification = {
      type: 'follow',
      follower: params.json.follower,
      timestamp: Math.round(new Date().valueOf() / 1000),
      block: operation.block,
    };
    notifications.push([params.json.following, notification]);
  }
  if (params.id === 'reblog') {
    const notification = {
      type: 'reblog',
      account: params.json.account,
      permlink: params.json.permlink,
      timestamp: Math.round(new Date().valueOf() / 1000),
      block: operation.block,
    };
    notifications.push([params.json.author, notification]);
  }
  return notifications;
};


const fromComment = (operation, params) => {
  const notifications = [];
  const isRootPost = !params.parent_author;
  /** Find replies */
  if (!isRootPost) {
    const notification = {
      type: 'reply',
      parent_permlink: params.parent_permlink,
      author: params.author,
      permlink: params.permlink,
      timestamp: Math.round(new Date().valueOf() / 1000),
      block: operation.block,
    };
    notifications.push([params.parent_author, notification]);
  }

  /** Find mentions */
  const pattern = /(@[a-z][\_\-.a-z\d]+[a-z\d])/gi;
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
        timestamp: Math.round(new Date().valueOf() / 1000),
        block: operation.block,
      };
      notifications.push([mention, notification]);
    });
  }
  return notifications;
};

const fromRestaurantStatus = (operation, params) => {
  const notifications = [];
  let status;
  try {
    status = JSON.parse(params.body);
  } catch (e) {
    console.error(e.message());
  }
  _.forEach(params.experts, (expert) => {
    const notification = {
      type: 'status-change',
      author: _.get(params, 'voter', params.creator),
      account: expert,
      object_name: params.object_name,
      author_permlink: params.author_permlink,
      status: _.get(params, 'voter') ? '' : status.title,
      timestamp: Math.round(new Date().valueOf() / 1000),
      block: operation.block,
    };
    notifications.push([expert, notification]);
  });
  return notifications;
};


const getNotifications = (operation) => {
  let notifications = [];
  const type = operation.id;
  const params = operation.data;
  switch (type) {
    case 'restaurantStatus':
      notifications = _.concat(notifications, fromRestaurantStatus(operation, params));
      break;
    case 'comment': {
      notifications = _.concat(notifications, fromComment(operation, params));
      break;
    }
    case 'custom_json': {
      notifications = _.concat(notifications, fromCustomJSON(operation, params));
      break;
    }
    case 'account_witness_vote': {
      /** Find witness vote */
      const notification = {
        type: 'witness_vote',
        account: params.account,
        approve: params.approve,
        timestamp: Math.round(new Date().valueOf() / 1000),
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
        timestamp: Math.round(new Date().valueOf() / 1000),
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


const setNotifications = async ({ params }) => {
  const notifications = getNotifications(params);
  const redisOps = prepareDataForRedis(notifications);
  await redisNotifyClient.multi(redisOps).execAsync();
  clientSend(notifications);
};

module.exports = { getNotifications, prepareDataForRedis, setNotifications };
