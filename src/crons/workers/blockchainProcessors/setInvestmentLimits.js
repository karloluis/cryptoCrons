import _ from 'lodash';
import moment from 'moment-timezone';
import request from 'request-promise';

import coinbase from '../../../lib/coinbase';

// Instantiates a week margin
// Including the budget to invest
// TODO: Make budget remotely editable

async function setInvestmentLimits(date) {

  startDate = Date.now()
  endDate = moment(date).endOfDay();
  // endDate.setHours(7*24)

  const params = {
    budget: process.env.RECURRENT_BUDGET;
  }

};

export default setInvestmentLimits;
