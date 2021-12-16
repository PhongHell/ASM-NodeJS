const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const checkinSchema = new Schema({
  start: {
    type: Date,
    // required: true
  },
  workplace: {
    type: String,
    // required: true
  },
  end: {
    type: Date,
    // required: true
  },
  date: {
    type: Date
  },
  hour: {
    type: Number,
  },
  overTime: {
    type: Number,
  },
  staffId: {
    type: Schema.Types.ObjectId,
    refer: 'Staff'
  },
  confirm: {
    type: Boolean
  }
});

module.exports = mongoose.model('Checkin', checkinSchema);

