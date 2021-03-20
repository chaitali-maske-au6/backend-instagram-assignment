const User = require("./models/User")
const mongoose = require("mongoose");
mongoose.connect(process.env.DB_CONNECT,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    },
    ()=> console.log("db connected successfully")
    );
