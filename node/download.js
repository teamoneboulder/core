var scrape = require('website-scraper');
var options = {
  urls: ['http://core.network/'],
  directory: '/var/www/root/sites/wayback/core.network',
};

// with callback
scrape(options, function (error, result) {
    /* some code here */
    console.log('done')
    process.exit(0)
});