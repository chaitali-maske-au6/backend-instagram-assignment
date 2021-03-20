const jwt = require('jsonwebtoken');
const User = require('../models/User')

//For autheticate the user

module.exports = (req,res,next) => {
    const {authorization} = req.headers
    if(!authorization){
        res.status(401).send({message:"u must logged in"})
    }
    const token = authorization.replace("jwt ","")
    jwt.verify(token,process.env.secretKey,(err,payload)=> {
        if(err){
            res.status(401).send({message:"u must logged in"})  
        }
        const {email} = payload
        
        User.find({email}).exec().then(userdata => {
            req.user = userdata
             next()
        })
     })
}