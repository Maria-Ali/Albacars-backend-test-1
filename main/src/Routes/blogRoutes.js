const express = require('express');
const router = express.Router();
const multer = require('multer');
const { addBlogPost, generateImageToken, getBlogPosts, getImageByTokenController } = require('../controllers/blogController');


const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024, // 1MB limit for each file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG images are allowed'), false);
    }
  },
});

router.post(
  '/add',
  upload.single('main_image'), // Allow only one main image
  upload.array('additional_images', 5), // Allow up to 5 additional images
  addBlogPost
);

router.get('/posts', getBlogPosts);

router.post('/token', generateImageToken);

router.get('/bytoken', getImageByTokenController);


module.exports = router;
