const express = require('express')
const bodyParser = require('body-parser')
const dotenv = require('dotenv')
const http = require('http')
var cors = require('cors')
const app = express();
dotenv.config();
require("./db")

app.use(cors())

const port = process.env.PORT || 4400

const userRoutes = require('./routes/userRoutes')
const postRoutes = require('./routes/postRoutes')

//body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

//all chat code run inside this fucntion because we r managing specific socket 

const User = require('./models/User')
const Post = require("./models/Post")

app.use(userRoutes);
app.use(postRoutes);


if(process.env.NODE_ENV=="production"){
    app.use(express.static('client/build'))
    const path = require('path')
    app.get("*",(req,res)=>{
        res.sendFile(path.resolve(__dirname,'client','build','index.html'))
    })
}


app.listen(port,()=>
    console.log(`server is running on port no : ${port}`)
)

