require('dotenv').config();
const express = require('express');
const shortid = require('shortid');
const dns = require('dns');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies

app.use('/public', express.static(`${process.cwd()}/public`));
const urlStore = {};

// Function to validate URL
function validateUrl(url) {
  try {
    const { hostname } = new URL(url);
    return new Promise((resolve, reject) => {
      dns.lookup(hostname, (err, address, family) => {
        if (err) {
          reject(err);
        } else {
          resolve(true); // URL is valid if DNS lookup succeeds
        }
      });
    });
  } catch (error) {
    return Promise.resolve(false); // URL is invalid if parsing fails
  }
}

// Serve HTML file
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Example API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// Endpoint to shorten URL
app.post('/api/shorturl', async (req, res) => {
  const { url: originalUrl } = req.body; // Access the 'url' field from the request body

  // Validate URL
  try {
    const isValidUrl = await validateUrl(originalUrl);
    if (isValidUrl) {
      const shortUrl = shortid.generate();
      urlStore[shortUrl] = originalUrl;
      res.json({ originalUrl: originalUrl, shortUrl: shortUrl });
    } else {
      res.json({ error: 'invalid url' });
    }
  } catch (error) {
    res.json({ error: 'invalid url' });
  }
});

// Route to handle redirection
app.get('/api/shorturl/:shortUrl', (req, res) => {
  const { shortUrl } = req.params;

  if (urlStore[shortUrl]) {
    return res.redirect(urlStore[shortUrl]);
  } else {
    return res.status(404).json({ error: 'invalid url' });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
