var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var InvestmentMargin = new Schema({
  startDate: Date,
  endDate: Date,
  investment: {
    budget: Number,
    aquired: Number,
    sold: Number,
    net: Number,
  },
});
