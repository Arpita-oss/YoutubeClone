const multer = require('multer');
const path = require('path')
const crypto = require('crypto')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/video')
    },
    filename: function (req, file, cb) {
        const fs = crypto.randomBytes(20).toString('hex') + path.extname(file.originalname)
        cb(null, fs)
    } 
})

const upload = multer({ storage: storage })

module.exports = upload