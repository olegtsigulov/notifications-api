const redis = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const redisNotifyClient = redis.createClient(process.env.REDISCLOUD_URL);

module.exports = {
  redisNotifyClient,
};
