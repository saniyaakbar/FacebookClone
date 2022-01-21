const mongoose = require('mongoose');



const postSchema = mongoose.Schema({
    content: String,
    image: String,
    postingUser: String,
    comments: [{
        comment: String,
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
        likes: [{type: mongoose.Schema.Types.ObjectId, ref: 'user'}],
        replies: [{
            reply: String,
            Ruser: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
            Rlikes: [{type: mongoose.Schema.Types.ObjectId, ref: 'user'}]
            }]
    }],
    likes: [{type: mongoose.Schema.Types.ObjectId, ref: 'user'}]
   
})

// [{type: mongoose.Schema.Types.ObjectId, ref: 'user'}]

module.exports = mongoose.model("post", postSchema);