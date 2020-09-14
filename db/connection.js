const { Mongoose } = require("mongoose");
const mongoose = require("mongoose");
require("./models/user");

const connect = async () => {
  try {
    await mongoose.connect("mongodb://localhost/my_database", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });
    console.log("-------- Database connection is success --------");
  } catch (e) {
    console.log("-------- Error while connecting to database -------");
  }
};

connect();
