const express = require('express');
const app = express();
const bodyParser = require('body-parser');
//const cors = require('cors');

// Middleware
app.use(bodyParser.json());
//app.use(cors());
app.use(express.static('public'));

const blogRouter = require('./Routes/blogRoutes');
app.use('/api/blog', blogRouter);

// simple route
// app.get('/', (req, res) => {
//     res.send('Hello World! Your Express.js server is working.');
// });

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});