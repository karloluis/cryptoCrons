const Client = require('coinbase').Client;

const coinbaseClient = new Client({
  'apiKey': process.env.COINBASE_API_KEY,
  'apiSecret': process.env.COINBASE_API_SECRET,
  'version':'YYYY-MM-DD'
});

export default coinbaseClient;
