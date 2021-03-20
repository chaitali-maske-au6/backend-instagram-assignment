const express = require('express')
const router  = express.Router();
const auth = require('../middleware/auth');
const PostController =  require('../controller/postController')

router.get('/allpost',auth,PostController.allpost)

router.post('/createpost',auth,PostController.create_post)

router.get('/mypost',auth,PostController.my_post)

router.delete('/deletepost/:postId',auth,PostController.delete_post)




module.exports = router;