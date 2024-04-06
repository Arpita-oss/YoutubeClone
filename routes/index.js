var express = require('express');

const axios = require("axios")
var router = express.Router();

const userModel = require('./users')
const videoModel = require('./video')
const upload = require('./multer')

var passport = require('passport')
var localStrategy = require('passport-local')
passport.use(new localStrategy(userModel.authenticate()))
const fs = require("fs")


router.get('/', isloggedIn, async function (req, res, next) {
  const videos = await videoModel.find()
  res.render('index', { title: 'Express', videos });
});

router.get('/login', (req, res, next) => {
  res.render('login')
})

router.get('/register', (req, res, next) => {
  res.render('register')

})
const HOSTNAME = process.env.HOST_NAME;
const STORAGE_ZONE_NAME = process.env.STORAGE_ZONE;
const ACCESS_KEY = process.env.UPLOAD_KEY;
const STREAMING_KEY = process.env.STREAM_KEY

router.get('/currentVideo/:videoId', isloggedIn, async function (req, res, next) {
  const currentVideo = await videoModel.findOne({
    _id: req.params.videoId
  })

  const videoUrl = `https:// ${HOSTNAME} /  ${STORAGE_ZONE_NAME} /${currentVideo.media}?accessKey=${STREAMING_KEY}`
  res.render('currentVideo', { videoUrl })
})

router.get('/upload', isloggedIn, (req, res, next) => {
  res.render('upload')
})


/* *****************  user authentication routes and function ***************** */

router.post('/register', function (req, res) {
  var userData = new userModel({
    username: req.body.username
  })
  userModel
    .register(userData, req.body.password)
    .then(function (registeredUser) {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/');
      })
    })
});

router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
  }),
  (req, res, next) => { }
);

function isloggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  else res.redirect('/login');
}

router.get('/logout', (req, res, next) => {
  if (req.isAuthenticated())
    req.logout((err) => {
      if (err) res.send(err);
      else res.redirect('/');
    });
  else {
    res.redirect('/');
  }
});

/* *****************  user authentication routes and function ***************** */

/* *****************   routes for video uploading  ***************** */



const uploadFileToBunnyCDN = (filePath, fileName) => {
  return new Promise(async (resolve, reject) => {
    const readStream = fs.createReadStream(filePath);

    try {
      const response = await axios.put(`https://${HOSTNAME}/${STORAGE_ZONE_NAME}/${fileName}`, fs.createReadStream(filePath), {
        headers: {
          AccessKey: ACCESS_KEY,
          'Content-Type': 'application/octet-stream',
        },
      });
      resolve(response.data);
    } catch (error) {
      reject(error);
    }
  });
};




router.post('/upload', isloggedIn, upload.single('video_file'), async (req, res, next) => {

  const newVideo = await videoModel.create({
    media: req.file.filename,
    user: req.user._id,
    title: req.body.title,
    description: req.body.description
  })

  const response = await uploadFileToBunnyCDN(`./public/video/${req.file.filename}`, req.file.filename);


  res.send(response)

})

/* *****************   routes for STREAMING  ***************** */

// router.get("/stream/:fileName", isloggedIn, function(req,res,next){

//   const range = req.headers.range;
//   const parts = range.replace('bytes=',"").split("-");
//   const start = parseInt(parts[0],10);
//   let chunkSize = 1024*1024*4;
//   let end = start+chunkSize -1;
//   const file = fs.statSync(`./public/video/${req.params.fileName}`);
//   const filesize = file.size

//   if(end>=filesize){
//     end = filesize - 1;
//     chunkSize = start-end+1;
//   }

//   const head= {
//     "Content-Range":`bytes ${start}-${end}/${filesize}`,
//     "Accept-Ranges":"bytes",
//     "Content-Length":chunkSize-1,
//     "Content-Type":"video/mp4"
//   }

//   res.writeHead(206,head);


//   fs.createReadStream(`./public/video/${req.params.fileName}`,{start,end}).pipe(res);
//   //ye line video read ka data read krne ke liye hai, pipe us video ko share krne ke liye hai jha require hai
// })

console.log(process.env.HOST_NAME)

/* *****************   routes for STREAMING  ***************** */




module.exports = router;
