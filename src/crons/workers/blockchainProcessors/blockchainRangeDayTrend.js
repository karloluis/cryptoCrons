import _ from 'lodash';
import moment from 'moment-timezone';
import request from 'request-promise';

import coinbaseClient from '../../../lib/coinbase';

async function blockchainRangeDayTrend(start = 3, end = 0) {

  const after = moment(Date.now()).tz('America/New_York')
  .subtract(start, 'days').startOf('day').format('x')/1000;

  const before = moment(Date.now()).tz('America/New_York')
  .subtract(end, 'days').startOf('day').format('x')/1000;

  const periods = 6 * 60 * 60;

  // 12 Hour intervals
  const options = {
    uri: 'https://api.cryptowat.ch/markets/gdax/btcusd/ohlc',
    qs: {
      after,
      before,
      periods,
    },
    headers: {
        'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
  };
  let evaluated = []; // Evaluated data of past three days.

  try {
    const {result, allowance} = await request(options);
    console.log(allowance);

    evaluated = result[periods.toString()].map((data) => {
      return {
        date: moment(data[0] * 1000).tz('America/New_York').toString(),
        prices: {
          open: data[1],
          high: data[2],
          low: data[3],
          close: data[4],
          average: {
            across: (data[1] + data[4]) / 2,
            margin: (data[2] + data[3]) / 2,
          },
        },
        trend: (1 - data[1]/data[4]) * 100,
        range: (data[2] - data[3]),
      }
    });

    const flattened = evaluated.reduce((cumulative, instance) => {
      if(cumulative.prices.high < instance.prices.high) {
        cumulative.prices.high = instance.prices.high;
      }
      if(cumulative.prices.low > instance.prices.low) {
        cumulative.prices.low = instance.prices.low;
      }


      cumulative.prices.average.across = Number(((cumulative.prices.average.across + instance.prices.average.across) / 2).toFixed(2));

      cumulative.prices.average.margin = Number(((cumulative.prices.average.margin + instance.prices.average.margin) / 2).toFixed(2));

      cumulative.trend += instance.trend;
      return cumulative;
    });

    flattened.date = {
      start: evaluated[0].date,
      end: evaluated[evaluated.length - 1].date,
    }

    flattened.prices.open = evaluated[0].prices.open;
    flattened.prices.close = evaluated[evaluated.length - 1].prices.close;

    flattened.range = Number((flattened.prices.high - flattened.prices.low).toFixed(2));

    console.log('Flattened', start, end, flattened);

    return {evaluated, flattened};

  } catch (error) {
    console.error(error);
    throw new Error(400);
  }

};

export default blockchainRangeDayTrend;
