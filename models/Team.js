const { number } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TeamSchema = new Schema(
  {
    teamName: { required: true, type: String, minlength: 3, maxlength: 14 },
    helmetStyle: { required: true, type: String, default: "classic" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", TeamSchema);
