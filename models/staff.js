const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const staffSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  doB: {
    type: Date,
    required: true,
  },
  salaryScale: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  annualLeave: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  covid: {
    vaccine: [
      {
        shot: {
          type: String,
        },
        date: {
          type: Date,
        },
      },
    ],
    tem: {
      type: Number,
    },
    date: {
      type: Date,
    },
    result: {
      type: String,
    },
  },
});

module.exports = mongoose.model("Staff", staffSchema);
