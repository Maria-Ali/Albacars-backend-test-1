const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const slugify = require('slugify');
require('dotenv').config();

const secretKey = process.env.SECRET_KEY;


const blogsFilePath = path.join(__dirname, '..', '..', '..', 'Part_1', 'blogs.json');
const imagesFolderPath = path.join(__dirname, '..', '..', '..', 'Part_1','images');

function validateBlogPost(title, description, mainImage, additionalImages, date_time) {
  if (!title || title.length < 5 || title.length > 50 || !/^[a-zA-Z0-9\s]+$/.test(title)) {
    return 'Invalid title';
  }

  if (!description || description.length > 500) {
    return 'Invalid description';
  }

  if (!mainImage) {
    return 'Main image is required';
  }

  if (mainImage.mimetype !== 'image/jpeg') {
    return 'Main image must be in JPEG format';
  }

  if (mainImage.size > 1024 * 1024) {
    return 'Main image size exceeds 1MB limit';
  }

  if (!date_time || date_time < Date.now()) {
    return 'Invalid date_time';
  }

  if (additionalImages) {
    if (!Array.isArray(additionalImages) || additionalImages.length > 5) {
      return 'Invalid additional_images';
    }

    for (const image of additionalImages) {
      if (image.mimetype !== 'image/jpeg' || image.size > 1024 * 1024) {
        return 'Invalid additional image(s)';
      }
    }
  }

  return null;
}

async function compressImages(imageBuffer, compressionFactor) {
  try {
    const compressedImage = await sharp(imageBuffer)
      .jpeg({ quality: Math.round(compressionFactor * 100) })
      .toBuffer();

    return compressedImage;
  } catch (error) {
    throw new Error('Image compression failed');
  }
}

function getNextReferenceNumber() {
  try {
    const blogsData = fs.readFileSync(blogsFilePath, 'utf-8');

    const blogsArray = JSON.parse(blogsData);

    if (!Array.isArray(blogsArray) || blogsArray.length === 0) {
      // If the JSON data is empty or not an array, start with reference number "00001"
      return '00001';
    }

    const maxReferenceNumber = Math.max(...blogsArray.map((blog) => Number(blog.reference)));

    const nextReferenceNumber = (maxReferenceNumber + 1).toString().padStart(5, '0');

    return nextReferenceNumber;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to get the next reference number');
  }
}

async function getAllBlogPosts() {
  try {
    const blogsData = await fs.readFile(blogsFilePath, 'utf-8');

    const blogsArray = JSON.parse(blogsData);


    const formattedBlogs = blogsArray.map((blog) => ({
      ...blog,
      date_time: new Date(blog.date_time * 1000).toISOString(),
      title_slug: slugify(blog.title, { lower: true, remove: /[*+~.()'"!:@]/g }),
    }));


    return formattedBlogs;
  } catch (error) {
    throw error;
  }
}

async function validateToken(token, image_path) {
  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.image_path === image_path) {
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

async function getImageByToken(image_path, token) {
  if (!(await validateToken(token, image_path))) {
    throw new Error('Invalid or expired token for the specified image');
  }

  try {
    const imagePath = path.join(__dirname, '..', '..', '..', 'Part_1', 'images', image_path);
    const imageBuffer = await fs.readFile(imagePath);

    return imageBuffer;
  } catch (error) {
    throw new Error('Image not found');
  }
}



module.exports = {
  validateBlogPost,
  compressImages,
  getNextReferenceNumber,
  getAllBlogPosts,
  getImageByToken
};
