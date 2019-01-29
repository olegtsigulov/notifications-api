const Client = require('lightrpc');
const bluebird = require('bluebird');
const client = new Client('https://api.steemit.com');
const steem = require('steem');
bluebird.promisifyAll(client);
bluebird.promisifyAll(steem.api);
steem.api.setOptions({url: 'https://api.steemit.com'});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const getBlock = async blockNum => steem.api.getBlockAsync(blockNum);

const getOpsInBlock = async (blockNum, onlyVirtual = false) => {
  const block = await getBlock(blockNum);
  let operations = [];
  if (block && block.transactions) {
    block.transactions.forEach(transaction => {
      transaction.operations.forEach(operation => {
        operations.push({
          timestamp: block.timestamp,
          block: transaction.block_num,
          op: operation
        })
      })
    })
  }
  return operations;
};

const getGlobalProps = () =>
  client.sendAsync({method: 'get_dynamic_global_properties', params: []}, null);

const mutliOpsInBlock = (start, limit, onlyVirtual = false) => {
  const request = [];
  for (let i = start; i < start + limit; i++) {
    request.push({method: 'get_ops_in_block', params: [i, onlyVirtual]});
  }
  return client.sendBatchAsync(request, {timeout: 20000});
};

const getBlockOps = block => {
  const operations = [];
  block.transactions.forEach(transaction => {
    operations.push(...transaction.operations);
  });
  return operations;
};

module.exports = {
  sleep,
  getBlock,
  getOpsInBlock,
  getGlobalProps,
  mutliOpsInBlock,
  getBlockOps,
};
