const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: { required: true, type: String, minlength: 3, maxlength: 14 },
    email: { required: true, type: String, minlength: 6, maxlength: 200 },
    password: { required: true, type: String, minlength: 6, maxlength: 200 },
    isAdmin: { type: Boolean, default: false },
    theme: { required: true, type: String, default: "dark" },
    accent: { required: true, type: String, default: "Green" },
    helmetStyle: { required: true, type: String, default: "classic" },
    helmetView: { required: true, type: String, default: "custom" },
    highlightUser: { type: Boolean, default: true },
    expandSidebar: { required: true, type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
