
module.exports = {
  apps : [{
    name: 'notifications-api',
    script: './app.js',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    instances: 1,
    watch: false,
    max_memory_restart: '1G',
    env: {
      PORT: '8084',
          STEEMD_WS_URL: 'wss://anyx.io',
          API_KEY: '5456u56y4grt45g4g45g3yh5ghr56g'
    },
  }]
};





