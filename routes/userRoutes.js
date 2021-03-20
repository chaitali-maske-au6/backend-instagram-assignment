const express = require('express');
const router = express.Router();
const UserController = require('../controller/userController');
const auth = require('../middleware/auth');

const dotenv = require('dotenv');
dotenv.config();


router.post('/register',UserController.register_user);

router.get("/confirmation/:token",UserController.confirmation);

router.post('/login',UserController.login_user);

//get another user profile
router.get('/user/:id',auth,UserController.get_a_user_profile)

//follow user
router.put('/follow',auth,UserController.follow_user)
//unfollow user
router.put('/unfollow',auth,UserController.unfollow_user)

module.exports = router;