const userRoute = require('../controller/user_control');

const router = require('express').Router();
const auth = require('../middlewares/authentication');

//no_auth i.e. no authentication required for these routes
const { signup } = require('../controller/no_auth');
const { activateAccount } = require('../controller/no_auth');
const { forgotPassword } = require('../controller/no_auth');
const { resetPassword } = require('../controller/no_auth');
const { login } = require('../controller/no_auth');




router.post('/signup', signup);
router.post('/activateAccount', activateAccount);
router.put('/forgotPassword', forgotPassword);
router.put('/resetPassword', resetPassword);
router.post('/login', login);



router.use('/user', auth, userRoute);


module.exports = router;
