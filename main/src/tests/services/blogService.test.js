const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const jwt = require('jsonwebtoken'); 
const slugify = require('slugify');
const blogService = require('../../Services/blogService'); 
const { validateBlogPost, compressImages, getNextReferenceNumber, getAllBlogPosts, validateToken, getImageByToken } = blogService;


jest.mock('fs', () => ({
  ...jest.requireActual('fs'), 
  readFileSync: jest.fn(),
  readFile: jest.fn(),
}));


jest.mock('sharp', () => ({
  jpeg: jest.fn().mockReturnThis(),
  toBuffer: jest.fn(),
}));


jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));


const mockBlogsData = [
  {
    reference: '00001',
    title: 'Sample Title',
    description: 'Sample Description',
    main_image: 'images/main_image_123456.jpg',
    date_time: Math.floor(Date.now() / 1000),
  },
  {
    reference: '00002',
    title: 'Sample Title 2',
    description: 'Sample Description 2',
    main_image: 'images/main_image_789012.jpg',
    date_time: Math.floor(Date.now() / 1000),
  },
];

describe('Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate a valid blog post', () => {
    const validBlogPost = {
      title: 'Sample Title',
      description: 'Sample Description',
      mainImage: {
        mimetype: 'image/jpeg',
        size: 500000,
      },
      date_time: Math.floor(Date.now() / 1000),
    };

    const validationError = validateBlogPost(
      validBlogPost.title,
      validBlogPost.description,
      validBlogPost.mainImage,
      null, // No additional images
      validBlogPost.date_time
    );

    expect(validationError).toBeNull();
  });

  it('should validate an invalid blog post with missing title', () => {
    const invalidBlogPost = {
      title: '', // Missing title
      description: 'Sample Description',
      mainImage: {
        mimetype: 'image/jpeg',
        size: 500000,
      },
      date_time: Math.floor(Date.now() / 1000),
    };

    const validationError = validateBlogPost(
      invalidBlogPost.title,
      invalidBlogPost.description,
      invalidBlogPost.mainImage,
      null, // No additional images
      invalidBlogPost.date_time
    );

    expect(validationError).toBe('Invalid title');
  });

  

  it('should compress an image buffer', async () => {
    const imageBuffer = Buffer.from('sample-image-buffer');
    const compressionFactor = 0.25;

    sharp.mockReturnValue({
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest.fn().mockResolvedValue('compressed-image-buffer'),
    });

    const compressedImage = await compressImages(imageBuffer, compressionFactor);

    expect(sharp).toHaveBeenCalledWith(imageBuffer);
    expect(compressedImage).toBe('compressed-image-buffer');
  });

  it('should get the next reference number when data is empty', () => {
    fs.readFileSync.mockReturnValueOnce('[]'); // Empty data

    const nextReferenceNumber = getNextReferenceNumber();

    expect(nextReferenceNumber).toBe('00001');
  });

  it('should get the next reference number when data is not empty', () => {
    fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBlogsData));

    const nextReferenceNumber = getNextReferenceNumber();

    expect(nextReferenceNumber).toBe('00003'); 
  });

  it('should format blog posts correctly', async () => {
    fs.readFile.mockResolvedValue(JSON.stringify(mockBlogsData));

    const formattedBlogs = await getAllBlogPosts();

    expect(formattedBlogs).toEqual([
      {
        reference: '00001',
        title: 'Sample Title',
        description: 'Sample Description',
        main_image: 'images/main_image_123456.jpg',
        date_time: expect.any(String),
        title_slug: 'sample-title',
      },
      {
        reference: '00002',
        title: 'Sample Title 2',
        description: 'Sample Description 2',
        main_image: 'images/main_image_789012.jpg',
        date_time: expect.any(String),
        title_slug: 'sample-title-2',
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});

