require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const url = require('url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve the index.html file at the root
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Data store for URLs (in-memory for simplicity)
let urls = [];
let idCounter = 1;

// Function to validate URLs
const isValidUrl = (urlString) => {
  try {
    const myUrl = new URL(urlString);
    return myUrl.protocol === "http:" || myUrl.protocol === "https:";
  } catch (error) {
    return false;
  }
};

// Function to check DNS validity
const dnsCheck = (hostname, callback) => {
  dns.lookup(hostname, (err, addresses) => {
    if (err || !addresses) {
      callback(false);
    } else {
      callback(true);
    }
  });
};

// POST route for creating short URLs
app.post('/api/shorturl', (req, res) => {
  const { original_url } = req.body;

  // Validate URL format
  if (!isValidUrl(original_url)) {
    return res.json({ error: 'invalid url' });
  }

  const parsedUrl = new URL(original_url);

  // Validate DNS
  dnsCheck(parsedUrl.hostname, (isValid) => {
    if (!isValid) {
      return res.json({ error: 'invalid url' });
    }

    // Generate short URL
    const short_url = idCounter++;
    urls.push({ id: short_url, original_url });

    // Return JSON response with original_url and short_url
    res.json({ original_url, short_url });
  });
});

// GET route for redirection based on short_url
app.get('/api/shorturl/:short_url', (req, res) => {
  const { short_url } = req.params;

  // Find the original URL associated with short_url
  const urlObject = urls.find(url => url.id == short_url);

  // If URL not found, return 404
  if (!urlObject) {
    return res.status(404).json({ error: 'short URL not found' });
  }

  // Redirect to the original URL
  res.redirect(urlObject.original_url);
});

// Start the server
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

