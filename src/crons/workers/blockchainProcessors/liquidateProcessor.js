import _ from 'lodash';
import moment from 'moment-timezone';
import request from 'request-promise';

import coinbaseClient from '../../../lib/coinbase';

import blockchainRangeDayTrend from './blockchainRangeDayTrend';

import aquisitionDecider from './';

const budgetQuery = `
  query {

  }
`;

const purchaseQuery = `
  mutation blockchainAquisition {

  }
`;

async function aquisitionProcessor() {
  // Verify conditions for invesment
  const currencies = ['BTC', 'ETH'];

  // Current market value
  // TODO which blockchain
  let currentValue = await coinbaseClient.getBuyPrice({currency: 'USD'});

  const toInvest = aquisitionDecider(currentValue);

  // Evaluate wallets.
  coinbaseClient.getPaymentMethods(function(err, paymentMethods) {
    console.log(paymentMethods);
  });

  // Choose wallet.


  // Make purchase
  if(toInvest.status) {
    const transactions = toInvest.coin.map(makePurchase);

  }

  // Add liquidation to DB (amountInvested, date, currentValue)
  // Update investmentBudget (budget - amountInvested)


};

async function makeSale({amount, currency}) {
  // These calls might need to be promisified.
  const {err, account} = await coinbaseClient.getAccount('primary');
  const {err, sold} = await account.sell({amount, currency});

  return sold;
}

async function recordPurchase() {
  // GraphQL params for purchases
  const params = {
    amountInvested
    currentValue
    date: new Date();
  };
}

export default aquisitionProcessor;
