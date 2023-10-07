const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../../src/app');
const { addBlogPost, getBlogPosts, generateImageToken, getImageByTokenController } = require('../../Controllers/blogController');
const blogService = require('../../Services/blogService'); 


jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
}));


jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));


jest.mock('../../Services/blogService', () => ({
  validateBlogPost: jest.fn(),
  saveBlogPost: jest.fn(),
  getAllBlogPosts: jest.fn(),
  generateImageToken: jest.fn(),
  validateToken: jest.fn(),
  getImageByToken: jest.fn(),
}));

describe('Controller Tests', () => {

  const validBlogPost = {
    title: 'Sample Title',
    description: 'Sample Description',
    date_time: Math.floor(Date.now() / 1000),
    main_image: {
      mimetype: 'image/jpeg',
      size: 500000, // Less than 1MB
    },
  };

  it('should add a valid blog post with all fields', async () => {
    jwt.sign.mockReturnValue('sample-token');
    blogService.validateBlogPost.mockReturnValue(null); 
    blogService.saveBlogPost.mockReturnValue(validBlogPost); 

    const response = await request(app)
      .post('/api/blog/add')
      .send(validBlogPost);

    expect(response.status).toBe(201);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(3); // Assuming 3 images are saved

  });

  it('should add partial blog post fields and return an error', async () => {
    const partialBlogPost = {
      title: 'Sample Title',
    };

    // Mock validation error
    blogService.validateBlogPost.mockReturnValue('Invalid description');

    const response = await request(app)
      .post('/api/blog/add')
      .send(partialBlogPost);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid description');
  });

  it('should add blog post with main_image that exceeds 1MB and return an error', async () => {
    const largeImageBlogPost = {
      title: 'Sample Title',
      description: 'Sample Description',
      date_time: Math.floor(Date.now() / 1000),
      main_image: {
        mimetype: 'image/jpeg',
        size: 1024 * 1024 * 2, // 2MB, exceeds the limit
      },
    };

    blogService.validateBlogPost.mockReturnValue('Main image size exceeds 1MB limit');

    const response = await request(app)
      .post('/api/blog/add')
      .send(largeImageBlogPost);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Main image size exceeds 1MB limit');
  });

  it('should add blog post with title that has special characters and return an error', async () => {
    const specialCharTitleBlogPost = {
      title: 'Sample Title @!',
      description: 'Sample Description',
      date_time: Math.floor(Date.now() / 1000),
      main_image: {
        mimetype: 'image/jpeg',
        size: 500000,
      },
    };

    // Mock validation error
    blogService.validateBlogPost.mockReturnValue('Title has special characters');

    const response = await request(app)
      .post('/api/blog/add')
      .send(specialCharTitleBlogPost);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Title has special characters');
  });

  it('should add blog post with ISO date_time and return an error', async () => {
    const isoDateTimeBlogPost = {
      title: 'Sample Title',
      description: 'Sample Description',
      date_time: new Date().toISOString(), // ISO date_time
      main_image: {
        mimetype: 'image/jpeg',
        size: 500000,
      },
    };

    
    blogService.validateBlogPost.mockReturnValue('Date_time is not unix time');

    const response = await request(app)
      .post('/api/blog/add')
      .send(isoDateTimeBlogPost);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Date_time is not unix time');
  });

  it('should get all blog posts successfully', async () => {
    const mockBlogPosts = [
      {
        title: 'Sample Title 1',
        description: 'Sample Description 1',
        date_time: Math.floor(Date.now() / 1000),
        main_image: 'images/main_image_123456.jpg',
      },
      {
        title: 'Sample Title 2',
        description: 'Sample Description 2',
        date_time: Math.floor(Date.now() / 1000),
        main_image: 'images/main_image_789012.jpg',
      },
    ];

    blogService.getAllBlogPosts.mockReturnValue(mockBlogPosts);

    const response = await request(app).get('/api/blog/posts');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockBlogPosts);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
