const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const confirmSchema = new Schema({
  staffId: {
    type: Schema.Types.ObjectId,
    refer: "Staff",
  },
  month: {
    type: Number,
    required: true,
  },
  checkins: [
    {
      _id: {
        type: Schema.Types.ObjectId,
        refer: "Checkin",
      }
    },
  ],
});

module.exports = mongoose.model("Confirm", confirmSchema);
