const redis = require('redis');
const bluebird = require('bluebird');
const redisConfig = require('../config/redis-config');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const redisNotifyClient = redis.createClient(process.env.REDISCLOUD_URL);
const redisForecastClient = redis.createClient(redisConfig.forecasts);

module.exports = {
  redisNotifyClient,
  redisForecastClient,
};
