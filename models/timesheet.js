const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const timesheetSchema = new Schema({
  staffId: {
    type: Schema.Types.ObjectId,
    refer: "Staff",
  },
  timesheet: [
    {
      _id: {
        type: String,
      },
      checkin: [
        {
          _id: {
            type: Schema.Types.ObjectId,
          },
          start: {
            type: Date,
          },
          workplace: {
            type: String,
          },
          end: {
            type: Date,
          },
          date: {
            type: Date,
          },
          hour: {
            type: Number,
          },
        },
      ],
      totalHours: {
        type: Number,
      },
      overTime: {
        type: Number,
      },
      hours: {
        type: Number,
      },
    },
  ],
});

module.exports = mongoose.model("Timesheet", timesheetSchema);
