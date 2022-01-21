var express = require('express');
var router = express.Router();
const userModel = require('./users')
const storyModel = require('./story')
const postModel = require('./post')
const passport = require('passport')
var Jimp = require('jimp');
const localStrategy = require('passport-local');
// var currentUser = "no one";
const multer  = require('multer');
const sendMail = require('./nodemailer');
const { v4: uuidv4 } = require('uuid');

var page = 0;


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname )
  }
})

const upload = multer({ storage: storage })



passport.use(new localStrategy(userModel.authenticate()));

// router.get('/profilePic/:id', function(req, res){
//   userModel.findOne({username: req.session.passport.user})
//   .then(function(foundUser){
//     console.log(foundUser)
//     res.redirect('/welPge')
//   })
// })



router.post('/profilePic',isLoggedIn, upload.single('picture'), function (req, res) {
   userModel.findOne({username: req.session.passport.user})
   .then(function(foundUser){
    Jimp.read(`./public/images/uploads/${req.file.filename}`, (err, lenna) => {
      if (err) throw err;
      lenna

        .resize(lenna.bitmap.width*0.5, lenna.bitmap.height*0.5) // resize
        .quality(60) // set JPEG quality
       
        .write(`./public/images/uploads/${req.file.filename}`); // save
        console.log(lenna.bitmap.width)
        foundUser.profilePic.push(req.file.filename)
        foundUser.save().then(function(){
          res.redirect('/welPge')
    });
    
     })
   })
});


router.get("/seeAllProfilePics",isLoggedIn, function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
    res.render('profilePictures', {foundUser, loggedin: true})
  })
})

router.get("/comment/:id",isLoggedIn, function(req, res){
  postModel.findOne({_id: req.params.id})
 .populate({
      path: 'comments',
      populate: { path: 'user' }
 })
  .then(function (foundPost) {
    
    res.render("commentPage", {foundPost, loggedin: true})
  });
 
})



router.post("/comment/:id",isLoggedIn, function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
    postModel.findOne({_id: req.params.id})
    .then(function(foundPost){
      
      foundPost.comments.push({comment: req.body.comment, user: foundUser})
      foundPost.save()
      console.log(foundPost)
      res.redirect(`/comment/${req.params.id}`)
    })
  })
  
})

router.get('/story',isLoggedIn, function(req, res){
  res.render('story', {loggedin: true})
})

router.post('/storyNow',upload.single('picture'),  function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
    storyModel.create({
      user: foundUser,
      content: req.body.story,
      currentStory: req.file.filename,
    })
    .then(function(createdStory){
      console.log(req.file)
      foundUser.story = createdStory
      foundUser.save()
      res.redirect('/welPge')
    })
  })
})


router.get('/likes/:postId/:index', function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
    postModel.findOne({_id: req.params.postId})
    .then(function(foundPost){
      if(foundPost.comments[req.params.index].likes.indexOf(foundUser._id) === -1){
        console.log('Liked')
        foundPost.comments[req.params.index].likes.push(foundUser)
       
      }
      else{
        console.log('DisLiked')
        var index2 = foundPost.likes.indexOf(foundUser._id)
        foundPost.comments[req.params.index].likes.splice(index2, 1)
      }
      console.log()
      foundPost.save()
      res.redirect(req.headers.referer)
    })
  })
  
})

router.post('/reply/:postId/:commentIndex', function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
    postModel.findOne({_id: req.params.postId})
    .then(function(foundPost){
      foundPost.comments[req.params.commentIndex].replies.push({reply: req.body.reply, Ruser: foundUser})
      foundPost.save()
     res.redirect(`/reply/${foundPost._id}/${req.params.commentIndex}`)
    })
  })
})

router.get("/reply/:id/:Index",isLoggedIn, function(req, res){
  postModel.findOne({_id: req.params.id})
 .populate({
      path: 'comments',
      populate: { path: 'replies',
      populate:{path: 'Ruser'} }
 })
 .populate({
  path: 'comments',
  populate: { path: 'user'}
})
  .then(function (foundPost) {
    console.log(foundPost.comments[req.params.Index].replies)
    res.render("reply", {foundPost, loggedin: true,  commentIndex: req.params.Index})
  });
 
})


router.get('/share/:id', function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
    postModel.findOne({_id: req.params.id})
    .then(function(foundPost){
      foundUser.sharedPosts.push(foundPost)
      foundUser.save()
      res.redirect("/welPge")
    })
  })
})

router.get("/setProfilePic/:id",isLoggedIn, function(req, res){
  
  userModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
    var index = foundUser.profilePic.indexOf(req.params.id)
    foundUser.profilePic.splice(index, 1);
    foundUser.profilePic.push(req.params.id)
    foundUser.save()
      res.redirect('/welPge')
    
  })
  .catch(function(err){
    res.send(err)
  })
})

router.get('/reset', function(req, res){
  res.render('resetPassword', {loggedin: false})
})

router.post('/reset', function(req, res){
 
    userModel.findOne({email: req.body.email})
    .then(function(foundUser){
      if(foundUser !== null){
      var secret = uuidv4();
      foundUser.secret = secret,
      foundUser.expire = Date.now() + 24*60*60*1000
      foundUser.save()
      .then(function(updatedUser){
        sendMail(req.body.email,`http://localhost:3000/reset/${updatedUser._id}/${secret}`)
        res.send("Mail sent! Check your email")
      })
      }
      else{
        res.send("User does not exist!")
      }
    })
  
  
})

router.get('/reset/:id/:secret', function(req, res){
  userModel.findOne({_id: req.params.id})
  .then(function(foundUser){
    if(foundUser.expire > Date.now()){
      res.render('resetPasswordForm', {loggedin: false, foundUser, secret: req.params.secret})
    }
    else{
      res.send("Link Expired!")
    }
  })
})

router.post('/reset/:id/:secret', function(req, res){
  userModel.findOne({_id: req.params.id})
  .then(function(foundUser){
    if(req.body.password1 === req.body.password2){
      // foundUser.password = req.body.password1
      foundUser.setPassword(req.body.password1, function(){
        foundUser.save()
        .then(function(updatedUser){
          req.logIn(updatedUser, function(err){
            if (err) return next(err);
            return res.redirect('/welPge')
          })
        })
      })
     
    }
    else{
      res.send("passwords do not match!")
    }
  })
})


/* GET home page. */
router.get('/', checkLogin, function(req, res, next) {
  res.render('index' , {loggedin: false});
});


router.get('/loginPaage',function(req, res){
  res.render('loginPage',)
})

router.get('/check/:username', function(req, res){
userModel.findOne({username:req.params.username})
.then(function(user){
  if(user === null){
    res.json({user:false})
  }
  else{
    res.json({user:true})
  }
})
// console.log(req.params.username);
})

router.get('/user/:username', function(req, res){
  
  var regex = new RegExp(`^${req.params.username}`)
  userModel.find({username: regex})
  .then(function(foundUser){
    res.send(foundUser)
  })
})


router.post('/login', passport.authenticate('local',
{
  successRedirect: '/welPge',
  failureRedirect: '/loginPaage'
}), function(req, res, next){});

router.get('/logout', function(req, res, next){
  req.logout();
  res.redirect('/');
});

router.get('/show',isLoggedIn, function(req, res){
  userModel.find()
  .then(function(allUsers){
    res.send(allUsers)
  })
})

router.post('/createPost',upload.single('picture') ,isLoggedIn, function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
    postModel.create({
      image: req.file.filename,
      content: req.body.post,
      postingUser: req.session.passport.user
    })
    .then(function(createdPost){
      foundUser.posts.push(createdPost)
      foundUser.save()
      res.redirect('/welpge')
    })
  })
  
})

router.get('/likes/:id',isLoggedIn, function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
      postModel.findOne({_id: req.params.id})
      .then(function(foundPost){
       
        if(foundPost.likes.indexOf(foundUser._id) === -1){
          console.log('Liked')
          foundPost.likes.push(foundUser)
        }
        else{
          console.log('DisLiked')
          var index = foundPost.likes.indexOf(foundUser._id)
          foundPost.likes.splice(index, 1)
        }

        foundPost.save()
        console.log(req.headers.referer)
        res.redirect(req.headers.referer)

      })
  })
})



router.get('/delete/:id',isLoggedIn, function(req, res){
  postModel.findOneAndDelete({_id: req.params.id})
  .then(function(deletedpost){
    userModel.findOne({username: req.session.passport.user})
  res.redirect('/welpge')
 
  })
})

router.get('/update/:id',isLoggedIn, function(req, res){
  postModel.findOne({_id: req.params.id})
  .then(function(foundpost){
    res.render('updatePost', {post: foundpost, loggedin: true})

 
  })
})

router.post('/updated/:id',isLoggedIn, function(req, res){
  data = {
    content: req.body.content
  }
  postModel.findOneAndUpdate({_id: req.params.id}, data)
  .then(function(updatedPost){
    res.redirect('/welPge')
  })
})



router.post('/register', function(req, res, next){
  var newUser = new userModel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
    branch: req.body.branch,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword
  })
  userModel.register(newUser, req.body.password)
  
  .then(function(u){
    u.save()
    passport.authenticate('local')(req, res, function(){
     
      res.redirect('/welPge')
    })
  })
  .catch(function(e){
    res.send(e);
  })
});

router.get('/welPge', isLoggedIn, function (req, res) {
  userModel.findOne({ username: req.session.passport.user })
    .populate("posts")
    .populate({
      path: 'posts',
      populate: { path: 'comments',
      populate: { path: 'user' } }
 })
    .populate("sharedPosts")
    .populate("story")
    
    .then(function (foundUser) {
     
      postModel.find()
      
      .then(function(foundPosts){
        // console.log(foundPosts)
        res.render('WelcomePage', { name: foundUser, post: foundPosts, loggedin: true });
      })
      
      // res.send('hey')
      // console.log(createdUser)
    })

})

router.get('/homePage/:page',isLoggedIn, function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .populate({
    path: 'following',
      populate: { path: 'posts' }
  })
  .then(function(currentUser){
    postModel.find()
    .skip(Number(3)*(req.params.page-1))
    .limit(3)
    .then(function(foundPosts){
      page = Number(req.params.page)
      console.log(foundPosts)
      res.render('Home', {posts: foundPosts, page: page+1, name: currentUser, loggedin: true, user: currentUser})
    })
  })
  
})

router.get("/view/:user", isLoggedIn, function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .populate('following')
  
  .then(function(currentUser){
    userModel.findOne({username: req.params.user})
    .populate({
      path: "posts",
      populate: {path:"comments",
      populate: {path: "user"}}
    })
    .populate('sharedPosts')
    .then(function(foundUser){
      res.render('searchUser', {name: foundUser, user: currentUser, loggedin: true} )
    })
    
  })
})

router.post('/searchUser', isLoggedIn, function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .populate('following')
  
  .then(function(currentUser){
    userModel.findOne({username: req.body.username})
    .populate({
      path: "posts",
      populate: {path:"comments",
      populate: {path: "user"}}
    })
    .populate('sharedPosts')
    .then(function(foundUser){
      res.render('searchUser', {name: foundUser, user: currentUser, loggedin: true} )
    })
    
  })
  .catch(function(err){
    res.send("No such User Exists! Please check the username once again.")
  })
})

router.get('/follow/:id',isLoggedIn, function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .then(function(currentUser){
    userModel.findOne({_id: req.params.id})
    .populate('posts')
    .then(function(foundUser){
      if(currentUser.following.indexOf(req.params.id) === -1){
        currentUser.following.push(req.params.id)
        foundUser.followers.push(currentUser._id)
      }
      else{
        var index = currentUser.following.indexOf(req.params.id)
        var index2 = foundUser.followers.indexOf(currentUser._id)
        currentUser.following.splice(index, 1)
        foundUser.followers.splice(index2, 1)
      }
      currentUser.save()
      foundUser.save()
      // console.log(foundUser)
      res.render('searchUser', {name: foundUser, user: currentUser, loggedin: true})
    })
  })
})

router.get('/following/:id',isLoggedIn, function(req, res){
  userModel.findOne({_id: req.params.id})
  .populate('following')
  .then(function(foundUser){
    res.render("following", {foundUser, loggedin: true})
  })
})

router.get('/followers/:id',isLoggedIn, function(req, res){
  userModel.findOne({_id: req.params.id})
  .populate('followers')
  .then(function(foundUser){
    console.log(foundUser)
    res.render("followers", {foundUser, loggedin: true})
  })
})

router.get('/following',isLoggedIn, function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .populate('following')
  .then(function(foundUser){
    res.render("following", {foundUser})
  })
})

router.get('/followers',isLoggedIn, function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .populate('followers')
  .then(function(foundUser){
    console.log(foundUser)
    res.render("followers", {foundUser})
  })
})

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()) {
    return next();
  }
  else{
    res.redirect('/');
  }
}

function checkLogin(req, res, next){
  if(!req.isAuthenticated()) {
   
    return next();
  }
  else{
  res.redirect('/welpge')
  }
}

router.get('/signup',checkLogin, function(req, res){
  res.render('createAccount', {loggedin: false})
})

router.get('/uploadImageCheck',upload.single('picture'), function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
    res.render('submitWithoutSubmit', {foundUser})
  })
  
})

router.post('/PicPic', function(req, res){
  userModel.findOne({username: req.session.passport.user})
  .then(function(foundUser){
    foundUser.profilePic.push(req.file.filename);
    foundUser.save()
    .then(function(updatedUser){
      res.redirect('/uploadImageCheck')
    })
  })
})


module.exports = router;
