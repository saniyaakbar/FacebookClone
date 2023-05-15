const mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

mongoose.connect('mongodb://127.0.0.1/orion');

const userSchema = mongoose.Schema({
  
  name: String,
  email: String,
  branch: String,
  username: String,
  password: String,
  confirmPassword: String,
  secret: String,
  expire: Date,
  profilePic: {
    type: Array,
    default: ['def.jpg']
  },
  posts: [{type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  sharedPosts:[{type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  following: [{type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  followers: [{type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  story:{type: mongoose.Schema.Types.ObjectId, ref: "story" , default: null}
})

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("user", userSchema);