const userSchema = require("../db/models/user");
const mailgun = require("mailgun-js");
const DOMAIN = "sandboxcc5953f763114aeba0d083c942575515.mailgun.org";
const mg = mailgun({ apiKey: process.env.Mailgun_ApiKey, domain: DOMAIN });
const jwt = require("jsonwebtoken");
// const _ = require('lodash');



//signup

exports.signup = async (req, res, next) => {

    //
    var { name, email, password } = req.body;

    var token = jwt.sign({ name, email, password }, process.env.SecretKey, { expiresIn: '20m' });

    //<p> must be in ancher tab and token need to be extracted by front-end app, here we send token directluy from body during signup
    const data = {
        from: 'noreply@hello.com',
        to: email,
        subject: 'Account activation link',
        html: `
      <h2> Please click on given link to activate your account </h2>
      <p>${process.env.Client_Url}/authentication/activate/${token}</p>
      `
    };
    mg.messages().send(data, function (error, body) {
        if (error) {
            return res.json({
                error: error.message
            })
        }
        return res.json({
            message: "Please checkout your mail and activate your account"
        })
    });

    // 


};


//check whether email activated or not

exports.activateAccount = (req, res) => {
    const { token } = req.body;
    if (token) {
        jwt.verify(token, process.env.SecretKey, async (err, decodedToken) => {
            if (err) {
                return res.status(400).json({
                    error: "Incorrect or expired link"
                })
            }
            const { name, email, password } = decodedToken;

            const newuser = new userSchema({ name, email, password });
            try {
                await newuser.save();
                //token need to be created and stored so that we can log in directly when signed up
                var token = await newuser.generateAuthToken();
                res.status(200).json({
                    msg: "Signup Successfully",
                    user: newuser,
                    token: token
                });
            } catch (e) {
                res.status(401).send(e.message);
            }

        })
    } else {
        return res.json({
            message: "Something went wrong!"
        })
    }
}



// forgrt password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    var user = await userSchema.findOne({ email });
    if (!user) {
        return res.status(400).json({
            message: "User with given email doesn;t exists"
        })
    }
    // 
    //here we are creating new token since tokens will empty when user logout from all devices 
    var token = jwt.sign({ _id: user._id }, process.env.ResetKey, { expiresIn: '20m' });

    const data = {
        from: 'noreply@hello.com',
        to: email,
        subject: 'Account activation link',
        html: `
      <h2> Please click on given link to reset your password </h2>
      <p>${process.env.Client_Url}/resetpassword/${token}</p>
      `
    };

    //let's put token value for reset( look in schema) which is required for reseting password in future 
    return user.updateOne({ resetLink: token }, (err, success) => {
        if (err) {
            return res.status(400).json({
                error: "Incorrect or expired link"
            })
        }
        mg.messages().send(data, function (error, body) {
            if (error) {
                return res.json({
                    error: error.message
                })
            }
            return res.json({
                message: "Please checkout your mail for reseting password"
            })
        });
    });

    // 
}



//Reset password\

exports.resetPassword = (req, res) => {
    const { resetLink, newPass } = req.body;
    if (resetLink) {
        jwt.verify(resetLink, process.env.ResetKey, async (err, decoded) => { //decoded will contain id since we pass user id for creating token
            try {
                var user = await userSchema.findOne({ resetLink });
                const obj = {
                    password: newPass
                }
                // var user = _.extend(user, obj);
                user.password = newPass;
                await user.save();
                res.status(200).json({
                    message: "Your password has been changed"
                })

            } catch (e) {
                res.status(401).json({
                    error: e.message
                })
            }

        })
    } else {
        return res.status(401).json({
            error: "Authentication error!"
        })
    }
}


//login 

exports.login = async (req, res) => {
    var user = await userSchema.findByCredentials(req.body.email, req.body.password);
    res.send(user)
}

