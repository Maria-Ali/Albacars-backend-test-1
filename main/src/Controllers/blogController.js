const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const secretKey = process.env.SECRET_KEY;


const { validateBlogPost, getAllBlogPosts, getImageByToken } = require('../services/blogService');


const blogsFilePath = path.join(__dirname, '..', '..', '..', 'Part_1', 'blogs.json');
const imagesFolderPath = path.join(__dirname, '..', '..', '..', 'Part_1','images');

async function addBlogPost(req, res) {
  try {
    const { title, description, date_time } = req.body;
    const mainImage = req.file;
    const additionalImages = req.files;

    // Validate the blog post data
    const validationError = validateBlogPost(title, description, mainImage, additionalImages, date_time);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    
    const addedBlogPost = await saveBlogPost(title, description, mainImage, additionalImages, date_time);

    return res.status(201).json(addedBlogPost);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


async function saveBlogPost(title, description, mainImage, additionalImages, date_time) {
  try {
    // Compress the images by 25%
    const compressedMainImage = await compressImages(mainImage.buffer, 0.25);
    const compressedAdditionalImages = await Promise.all(
      additionalImages.map(async (image) => await compressImages(image.buffer, 0.25))
    );

    // Save the images to the "images" folder
    const mainImageFileName = `main_image_${Date.now()}.jpg`;
    const additionalImageFileNames = compressedAdditionalImages.map(
      (_, index) => `additional_image_${index + 1}_${Date.now()}.jpg`
    );

    fs.writeFileSync(path.join(imagesFolderPath, mainImageFileName), compressedMainImage);
    additionalImageFileNames.forEach((fileName, index) =>
      fs.writeFileSync(path.join(imagesFolderPath, fileName), compressedAdditionalImages[index])
    );

    const referenceNumber = getNextReferenceNumber();

    const blogPost = {
      reference: referenceNumber,
      title: title,
      description: description,
      main_image: `images/${mainImageFileName}`,
      additional_images: additionalImageFileNames.map((fileName) => `images/${fileName}`),
      date_time: date_time,
    };

    const blogsData = JSON.parse(await fs.readFile(blogsFilePath, 'utf-8'));

    blogsData.push(blogPost);

    await fs.writeFile(blogsFilePath, JSON.stringify(blogsData, null, 2));

    return blogPost;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to save the blog post');
  }
}

async function getBlogPosts(req, res) {
  try {
    const blogPosts = await getAllBlogPosts();
    res.json(blogPosts);
  } catch (error) {
    res.status(500).json({ error: error });
  }
}

async function generateImageToken(req, res) {
  const { image_path } = req.body;

  try {
    const imagePath = path.join(__dirname, '..', '..', '..', 'Part_1', 'images', image_path);
    await fs.access(imagePath);

    const token = jwt.sign({ image_path }, secretKey, { expiresIn: '5m' });

    res.json({ token });
  } catch (error) {
    res.status(404).json({ error: 'Image not found' });
  }
}

async function getImageByTokenController(req, res) {
  const { image_path, token } = req.query;

  try {
    const imageBuffer = await getImageByToken(image_path, token);

    res.set('Content-Type', 'image/jpeg');
    res.send(imageBuffer);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}



module.exports = {
  addBlogPost,
  getBlogPosts,
  generateImageToken,
  getImageByTokenController
};
