const _ = require('lodash');
const { redisNotifyClient } = require('./helpers/redis');
const utils = require('./helpers/utils');
const notificationUtils = require('./helpers/expoNotifications');
const { getNotifications, prepareDataForRedis } = require('./helpers/notificationsHelper');
const { clientSend, heartbeat } = require('./helpers/wssHelper');

/** Stream the blockchain for notifications */
const loadBlock = (blockNum) => {
  utils
    .getOpsInBlock(blockNum, false)
    .then((ops) => {
      if (!ops.length) {
        console.error('Block does not exit?', blockNum);
        utils
          .getBlock(blockNum)
          .then((block) => {
            if (block && block.previous && block.transactions.length === 0) {
              console.log('Block exist and is empty, load next', blockNum);
              redisNotifyClient
                .setAsync('last_block_num', blockNum)
                .then(() => {
                  loadNextBlock();
                })
                .catch((err) => {
                  console.error('Redis set last_block_num failed', err);
                  loadBlock(blockNum);
                });
            } else {
              console.log('Sleep and retry', blockNum);
              utils.sleep(2000).then(() => {
                loadBlock(blockNum);
              });
            }
          })
          .catch((err) => {
            console.log(
              'Error lightrpc (getBlock), sleep and retry',
              blockNum,
              JSON.stringify(err),
            );
            utils.sleep(2000).then(() => {
              loadBlock(blockNum);
            });
          });
      } else {
        let notifications = [];
        ops.forEach(
          (operation) => notifications = _.concat(notifications, getNotifications(operation)),
        );
        /** Create redis notifications array */
        const redisOps = prepareDataForRedis(notifications);
        redisOps.push(['set', 'last_block_num', blockNum]);
        redisNotifyClient
          .multi(redisOps)
          .execAsync()
          .then(() => {
            console.log('Block loaded', blockNum, 'notification stored', notifications.length);
            clientSend(notifications);
            /** Send notifications to all devices */
            notificationUtils.sendAllNotifications(notifications);
            loadNextBlock();
          })
          .catch((err) => {
            console.error('Redis store notification multi failed', err);
            loadBlock(blockNum);
          });
      }
    })
    .catch((err) => {
      console.error('Call failed with lightrpc (getOpsInBlock)', err);
      console.log('Retry', blockNum);
      loadBlock(blockNum);
    });
};

const loadNextBlock = () => {
  redisNotifyClient
    .getAsync('last_block_num')
    .then((res) => {
      const nextBlockNum = res === null
        ? process.env.START_FROM_BLOCK || 29879430
        : parseInt(res, 10) + 1;
      utils
        .getGlobalProps()
        .then((globalProps) => {
          // const lastIrreversibleBlockNum = globalProps.last_irreversible_block_num;
          // if (lastIrreversibleBlockNum >= nextBlockNum) {
          const headBlockNumber = globalProps.head_block_number;
          if (headBlockNumber >= nextBlockNum) {
            loadBlock(nextBlockNum);
          } else {
            utils.sleep(2000).then(() => {
              loadNextBlock();
            });
          }
        })
        .catch((err) => {
          console.error('Call failed with lightrpc (getGlobalProps)', err);
          utils.sleep(2000).then(() => {
            console.log('Retry loadNextBlock', nextBlockNum);
            loadNextBlock();
          });
        });
    })
    .catch((err) => {
      console.error('Redis get last_block_num failed', err);
    });
};

const start = () => {
  console.info('Start streaming blockchain');
  loadNextBlock();
  /** Send heartbeat to peers */
  heartbeat();
};

start();
