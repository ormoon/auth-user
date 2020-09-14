const router = require("express").Router();
const userSchema = require("../db/models/user");
const multer = require("multer");
const path = require("path");
const auth = require('../middlewares/authentication');



//for file storing
const storage_file = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "public/files"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});


const upload = multer({
  storage: storage_file,
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    const type = file.mimetype;
    if (type.split("/")[1] === "pdf") {
      return cb(null, true);
    }
    return cb(new Error("Please insert pdf file"))
  }
});

//for image don't use storage or dest otherwise it will add to public file
const upload_img = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    const type = file.mimetype;
    if (type.split("/")[0] === "image") {
      return cb(null, true);
    }
    return cb(new Error("Please insert image"))
  }
})

//for gallary

const storage_gallery = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "public/images"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});


const upload_gallery = multer({
  storage: storage_gallery,
  fileFilter(req, file, cb) {
    const type = file.mimetype;
    if (type.split("/")[0] === "image") {
      return cb(null, true);
    }
    return cb(new Error("Please insert images"))
  }
});



router.route("/files").post(upload.single("file"), (req, res) => {
  res.send("File uploaded successfully");
});


//image need to be stored on specific person's data in database thus 
router.route("/profile").post(auth, upload_img.single("img"), async (req, res, next) => {
  req.user.image = req.file.buffer;
  try {
    await req.user.save();
    res.status(200).send("Profile picture has been updated successfully");
  } catch (e) {
    res.json({ error: e.message })
  }
});


router.route("/gallery").post(auth, upload_gallery.array('img'), async (req, res, next) => {
  res.status(200).send("Images has been added to gallery successfully");
});



//if a user is signed in then he/she could see other user profile

router.route("/viewAll")
  .get(auth, async (req, res) => {
    const users = await userSchema.find({});
    res.status(200).send(users)
  });


//let's update user profile

router.route('/profile/edit')
  .patch(auth, async function (req, res) {
    var user = req.user;
    console.log(user)
    const allowedUpdate = ['name', 'password', 'email', 'image'];
    const updateReq = Object.keys(req.body);
    const isVallidation = updateReq.every(key =>
      allowedUpdate.includes(key)
    )
    if (!isVallidation) {
      return res.status(400).send({ error: 'Invalid updates!' })
    }

    if (req.body.name) {
      user.name = req.body.name
    }
    else if (req.body.image) {
      user.image = req.body.image
    }
    //if email or password changed we need to delete all tokens from all devices and need to re-login
    else if (req.body.email || req.body.password) {
      if (req.body.email) {
        user.email = req.body.email

      }
      if (req.body.password) {
        user.password = req.body.password
      }
      user.tokens = [];
    }
    try {
      await user.save();
      res.status(200).json({ msg: "Data has been updated successfully", user })
    } catch (e) {
      res.status(400).send("Eror dusing updating data")
    }
  })

module.exports = router;
