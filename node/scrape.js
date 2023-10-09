const metascraper = require('metascraper').load([
  require('metascraper-author')(),
  require('metascraper-amazon')(),
  require('metascraper-youtube')(),
  require('metascraper-date')(),
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-logo')(),
  require('metascraper-publisher')(),
  require('metascraper-title')(),
  require('metascraper-url')()
]);
const extractor = require('unfluff');
const got = require('got')
const targetUrl=decodeURIComponent(process.argv[2]);
//const targetUrl = 'http://www.bloomberg.com/news/articles/2016-05-24/as-zenefits-stumbles-gusto-goes-head-on-by-selling-insurance'
async function get(){
  const {body: html, url} = await got(targetUrl)
  const metadata = await metascraper({html, url})
  //if(int) clearInterval(int);
  //return 'here';
  //console.log('ok2');
  //console.log(JSON.stringify(metadata))
  return {metadata:metadata,html:html};
};
get().then(function(res){
  data = extractor(res.html);
  delete res.html;//dont return full html
  res.full_text=data.text;
	console.log(JSON.stringify(res));
	process.exit(0);
}).catch(function(e){
	console.log(e);
});
setTimeout(function(){
  process.exit();
},8000);