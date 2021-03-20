const mongoose = require('mongoose');
const User = require('../models/User')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Post = require('../models/Post')
const nodemailer = require('nodemailer')
const crypto = require('crypto')


const transporter = nodemailer.createTransport({
    host:'smtp.gmail.com',
    port:465,
    secure:true,
    debug:'development',
    auth:{
        user:process.env.GMAIL_EMAIL,
        pass:process.env.PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
}) 

const dotenv = require('dotenv');

dotenv.config();



exports.register_user = (req,res) => {
    const {name ,email ,password } = req.body
    if(!name || !email || !password){
     return  res.status(422).json({error:"please Fill all fields"})
    }
    //make sure that user not exist already in database
    User.find({email:email}).exec().then(user => {
        if(user.length >= 1){
            return res.status(409).json({message:"user already exist can't register"});
        } else {
            bcrypt.hash(password,10,(err,hash) => {
                if(err) {
                    return res.status(500).json({error:err});
                } else {
                   //send confirmation mail
                   const token = jwt.sign({user:email},process.env.secretKey,{expiresIn:"5m"})
                    const url = `${process.env.WEB_LINK}/confirmation/${token}`;
                    const mailOption ={
                        from:process.env.GMAIL_EMAIL,
                        to:email,
                        subject:'Verify your email',
                        text:`welcome to ${process.env.WEB_LINK}`,
                        html:  `hi "${email}"You started a Registration process on ChitChat.com,This email is valid for next 5 minute, Please click link to confirm your email: <a href="${url}">ClickMe !</a>`
                                         
                     }
                    
                    let newUser = new User({
                        name:name,
                        email:email,
                        password: hash
                        
                    });
                   
                    newUser.save().then(response => {
                        console.log(response);
                        transporter.sendMail(mailOption,(error,info) => {
                            if(error){
                                console.log(error)
                            }else{
                                res.status(201).json({message:"verification link sent to Your email address",User:response})
                                }
                               })
                        }).catch(err => {
                            console.log(err);
                            res.status(500).json({error:err});
                        });   
                }
            })
        }
    }).catch();   
}

exports.confirmation = (req,res,next) => {
    try {
        const confirmToken = req.params.token
        const { user } = jwt.verify(confirmToken, process.env.secretKey);
        //console.log(user);
        User.findOneAndUpdate({email:user},{isConfirmed:true}, {new: true}, (err, doc) => {
            if (err) {
                console.log("Something wrong when updating data!");
            }
            return res.status(200).json({message:"email verification Successfull now u can access your account "})  
        })
  
      } catch (e) {
        console.log(e.message);
        return res.status(400).json({error:e.message});
      }
      
}

exports.login_user = (req,res,next) => {
    
    const {email ,password } = req.body

    if(!email || !password){
     return  res.status(422).json({error:"please Fill all fields"})
    }
    
    User.find({email:email}).exec().then(user => {
        if(user.length < 1){
            return res.status(401).json({error:"User Doesn't Exist"});
        }
        bcrypt.compare(password, user[0].password,(err,isMatch) => {
            if(err) {
               return res.status(401).json({error:"Authentication Failed"});
            } 
            //check email verified or not
            if(!user[0].isConfirmed){ 
                return res.status(401).json({error:"You need to verify email"});
            }   
            //if password are matched
            if(isMatch){
                const {_id, name, email,following,followers} = user[0]
                const token = jwt.sign({email: user[0].email, userId: user[0]._id},process.env.secretKey,{expiresIn:500000});
                return res.status(200).json({message:"Authentication successful",Token : token,user:{_id,name,email,followers,following} })
            }
            //if the accound is beign verified  
            res.status(401).json({error:"Authentication Failed"});
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error:err});
    });
}

// exports.profile = (req,res) => {
//     console.log(req.user[0]._id)
//     User.findOne({_id:req.user[0]._id})
//     .select("-password")
//     .then(user => {
//         Post.find({ postedBy:req.user[0]._id})
//         .populate("postedBy", "_id name")
//         .exec((err,posts) => {
//             if(err) {
//                 return res.status(422).json({error:err})
//             }
//             res.json({ user,posts})
//         })
//     }).catch(err => {
//         return res.status(404).json({error:"User not found"})
//     })
// }


// exports.update_profile_pic = (req,res) => {
//     console.log(req)
//     User.findByIdAndUpdate(req.user[0]._id,
//         {$set:{pic:req.body.pic}},{new: true}, 
//         (err, result) => {
//             if(err) {
//                 return res.status(422).json({err:"Image can't update"})
//             }
//                 res.json(result)
//     })
// }



// //This route is to see the profile of the other user
exports.get_a_user_profile =(req,res) => {
    
    User.findOne({_id:req.params.id})
    .select("-password") //making sure that we dont get the password among al fields
    .then(user=>{
        console.log(user)
        Post.find({postedBy:req.params.id})
        .populate("postedBy","_id name")
        .exec((err,posts)=>{
            if(err){
                return res.status(422).json({error:err})
            }
            res.json({user,posts})
        })
    }).catch(err=>{
        return res.status(404).json({error:"User not Found"})
    })
}




//WhenEver any user follow another user,then we have to update both user ,like first user following and another user followers 

//follow user//step2
exports.follow_user = (req, res) => {
    User.findByIdAndUpdate(req.body.followId, {
        $push: { followers: req.user[0]._id }
    }, {
        new: true
    }, (err, result) => {
        if (err) {
            return res.status(422).json({ error: err })
        }
        //updating the logged In user here
        User.findByIdAndUpdate(req.user[0]._id, {
            $push: { following: req.body.followId }
        }, 
        { new: true }).select("-password").then(result => {
            res.json(result)
        }).catch(err => {
            return res.status(422).json({ error: err })
        })

    })
}


//unfollow user//step3 update in both user data
exports.unfollow_user = (req, res) => {
    User.findByIdAndUpdate(req.body.unfollowId, {
        $pull: { followers: req.user[0]._id }
    }, {
        new: true
    }, (err, result) => {
        if (err) {
            return res.status(422).json({ error: err })
        }
        User.findByIdAndUpdate(req.user[0]._id, {
            $pull: { following: req.body.unfollowId }
        }, 
        { new: true }).select("-password").then(result => {
            res.json(result)
        }).catch(err => {
            return res.status(422).json({ error: err })
        })
    })
}



