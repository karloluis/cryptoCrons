import blockchainRangeDayTrend from '../blockchainProcessors/blockchainRangeDayTrend';

test('Run a RangeDayTrend analisys', () => {
  blockchainRangeDayTrend() //Default
  blockchainRangeDayTrend(2) //Default
  blockchainRangeDayTrend(1)
});
