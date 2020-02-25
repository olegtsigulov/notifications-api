const express = require('express');
const bodyParser = require('body-parser');

const port = process.env.PORT || 4000;
const app = express();
app.use(bodyParser.json());
exports.server = app.listen(port, () => console.log(`Listening on ${port}`));

const router = require('./routes');

app.use('/', router);
require('./blockchainStream');
