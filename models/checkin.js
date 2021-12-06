const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const checkinSchema = new Schema({
  start: {
    type: Date,
  },
  end: {
    type: Date,
  },
  workplace: {
    type: String,
  },
  date: {
    type: String
  },
  hour: {
    type: Number,
  },
  staffId: {
    type: Schema.Types.ObjectId,
    ref: 'Staff'
  }
});

module.exports = mongoose.model('Checkin', checkinSchema);

