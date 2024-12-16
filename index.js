require('dotenv').config();
const express = require('express');
const shortid = require('shortid');
const cors = require('cors');
const dns = require('dns');
const app = express();

//basic configuration
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json()); //middlware to pass JSON BODIES
app.use(express.urlencoded({ extended: true })); //middlware to pass URL ENCODED BODY
app.use('/public', express.static(`${process.cwd()}/public`));
const urlStore = {};
//function to validate the url
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

//serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

//example end point
app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

//end point to shorten the url
app.post('/api/shorturl', async (req, res) => {
  const { url: originalUrl } = req.body; // Access the 'url' field from the request body

  // Validate URL
  try {
    const isValidUrl = await validateUrl(originalUrl);
    if (isValidUrl) {
      const shortUrl = shortid.generate();
      urlStore[shortUrl] = originalUrl;
      res.json({ original_url: originalUrl, short_url: shortUrl }); // Match the required response format
    } else {
      res.json({ error: 'invalid url' });
    }
  } catch (error) {
    res.json({ error: 'invalid url' });
  }
});

//route to handle the redirect
app.get('/api/shorturl/:shortUrl', (req, res) => {
  const { shortUrl } = req.params;
  if (urlStore[shortUrl]) {
    return res.redirect(urlStore[shortUrl]);
  } else {
    return res.json({ error: 'No short url found for the given input' });
  }
});


app.listen(port, () => {
  console.log(`Listening on port ${port}`);
})
