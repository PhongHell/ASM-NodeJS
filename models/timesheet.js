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
            refer: "Checkin",
          },
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
            type: Date,
          },
          hour: {
            type: Number,
          },
          confirm: {
            type: Boolean,
          }
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
