const dsteem = require('@hivechain/dsteem');

const client = new dsteem.Client('https://anyx.io');

const getGlobalProperties = async () => {
  try {
    return { result: await client.database.call('get_dynamic_global_properties') };
  } catch (error) {
    return { error };
  }
};

module.exports = { getGlobalProperties };
