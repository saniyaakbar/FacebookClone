const mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

mongoose.connect('mongodb://localhost/orion');


var storySchema = mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "user"},
    currentStory: {
      type: String,
      default: "def.jpg"
    },
    content: String,
    
  
  }, {timestamps: true})

storySchema.plugin(passportLocalMongoose);
storySchema.index({createdAt: 1},{expireAfterSeconds: 0});

// db.storySchema.createIndex({"expire_at": 1 }, { expireAfterSeconds: 5 } );

module.exports = mongoose.model("story", storySchema);