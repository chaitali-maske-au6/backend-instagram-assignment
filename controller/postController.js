const Post = require('../models/Post')
const { route } = require('../routes/postRoutes')
const post = require('../models/Post')

//TO SEE all POSTs
exports.allpost = (req,res) => {
    Post.find()
    .populate("postedBy", "_id name pic")
    .populate("comments.postedBy","_id name")
    .sort('-createdAt')
    .then(posts => {
        res.json({ posts})
    })
    .catch(err => {
        console.log(err)
    })
}


//For CREATE POST
exports.create_post = (req,res) => {
    const { title, body,photo} = req.body;
    //console.log(req.user)  just checking user available or not
    if(!title || !body) {
        return res.status(401).json({ error:"Please add all fields"})
    } 
    //for sequrity not send the user password with post
    req.user[0].password = undefined
    const post = new Post ({
        title,
        body,
        photo,
        postedBy:req.user[0]
    })
    post.save()
    .then(result =>{
        res.json({ post:result})
    })
    .catch(err => {
        console.log(err)
    })
}

//TO all POST OF current USER
exports.my_post = (req,res) => {
    Post.find({postedBy: req.user[0]._id})
    .populate("PostedBy","_id name")
    .then(mypost => {
        console.log(mypost)
        res.json({mypost}) 
    })
    .catch(err => {
        console.log(err)
    })
}





//deleteing the post we will get postid from user as PARAMs
exports.delete_post = (req,res) => {
    Post.findOne({_id:req.params.postId}).populate("postedBy","_id").exec((err,post)=>{
        console.log(post)
        if(err || !post){
            return res.status(422).json({error:err})
        }
        //these are objectId so we have to cconvert it into string
        //console.log(req.user[0]._id)
        //we are checking the user is same which created post and now logged in
        if(post.postedBy._id.toString() === req.user[0]._id.toString()){
            post.remove()
            .then(result=>{
                res.json(result)
            }).catch(err=>{
                console.log(err)
            })
        }
    })
}

