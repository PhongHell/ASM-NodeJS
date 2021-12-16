const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const dayoffSchema = new Schema({
  staffId: {
    type: Schema.Types.ObjectId,
    refer: "Staff",
  },
  date: {
    type: Date,
  },
  reason: {
    type: String,
  },
  month: {
    type: Number,
  },
  totalHoursOff: {
    type: Number,
  },
});

module.exports = mongoose.model("Dayoff", dayoffSchema);
