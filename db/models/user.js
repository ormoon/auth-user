const mongoose = require("mongoose");
const validator = require("validator");
const pbkdf2 = require("pbkdf2");
const jwt = require("jsonwebtoken");

const user_Schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is Invalid");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (!validator.isLength(value, { min: 7, max: undefined })) {
          throw new Error(
            "Please ensure that your password must be strong and have length greater than 6"
          );
        }
      },
    },
    resetLink: {
      data: String,
      default: ''
    },
    image: {
      type: Buffer,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

user_Schema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password") || user.isNew) {
    const buff = pbkdf2.pbkdf2Sync(user.password, "salt", 1, 32, "sha512");
    user.password = buff.toString("hex");
  }
  next();
});

user_Schema.methods.generateAuthToken = async function () {
  var token = jwt.sign({ _id: this._id.toString() }, process.env.SecretKey);
  this.tokens = this.tokens.concat({ token });
  await this.save();
  return token;
};

//for login
user_Schema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) {
    return ("Invalid login credentials")
  }
  const buff = pbkdf2.pbkdf2Sync(password, "salt", 1, 32, "sha512");
  var password = buff.toString("hex");
  var isMatch = (user.password).localeCompare(password);
  if (isMatch === 0) {
    user.generateAuthToken();
    return user;
  }
  return ("Invalid login credentials")
}


user_Schema.methods.toJSON = function () {
  const user = this
  const userObject = user.toObject()
  delete userObject.password
  delete userObject.tokens
  delete userObject.resetLink
  return userObject
}

const userSchema = mongoose.model("user", user_Schema);

module.exports = userSchema;
