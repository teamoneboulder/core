var request = require('request')
  , cheerio = require('cheerio')
  , async = require('async');
var http = require('https');
var link=decodeURIComponent(process.argv[2]);
var data={};

function getInfo(opts,fin){
    request(opts.link, function (err, response, body) {
      if (err) throw err;
      var $ = cheerio.load(body);
      function getMetadata($){
        var meta={};
        $('meta').each(function(i,v){
          var p=$(this).attr('property');
          if(!p) p=$(this).attr('name');
          var c=$(this).attr('content');
          if(p&&c) meta[p]=c;
        });
        return meta;
      }
      function getTitle($,metadata){
        //try fb first
        var title=metadata['og:title'];
        if(title) return title;
        //then title tag
        return $('title').text();
        //then any other things that can be used
      }
      function getDescription($,metadata){
        //try fb first
        var description=metadata['og:description'];
        if(description) return description;
        //then title tag
        var description=metadata['description'];
        if(description) return description;
        var description=metadata['keywords'];
        if(description) return description;
        return '';
        //then any other things that can be used
      }
      function getImage($,metadata){
        //try fb first
        var image=metadata['og:image'];
        if(image) return image;
        //then any other things that can be used
      }
      function isValid(url){
        if(!url) return false;
        if(url.indexOf('https://')>=0||url.indexOf('http://')>=0||url.indexOf('//')===0) return 1;
        else return 0;
      }
      function getImages($,metadata){
        var images=[];
        var max=20;
        var c=0;
        $('img').each(function(i,v){
          var img=$(this).attr('src');
          if(isValid(img)&&c<max){
            if(images.indexOf(img)==-1) images.push(img);
            c++;
            }
        })
        return images;
        //also try to get background images
        //try fb first
        //then title tag
        //then any other things that can be used
      }
      var metadata=getMetadata($);
      var title=getTitle($,metadata);
      var images=getImages($,metadata);
      var image=getImage($,metadata);
      var description=getDescription($,metadata);
      if(title) data.title=title;
      if(description) data.description=description;
      if(images&&images.length) data.images=images;
      if(image) data.image=image;
      fin();
  });
}
function makeCallbackFunc(data) {
    return function (callback) {
      getImgSize(data, callback);
    };
}
 var queue = async.queue(function (opts, fin) {
  getInfo(opts,fin);
}, 100);
 queue.drain = function() {
  //export data
  //then try first loaded image;
  if(data.images){
    if(data.images[0]&&!data.image) data.image=data.images[0];
    if(data.images.length&&data.images.indexOf(data.image)==-1){
      data.images.unshift(data.image);
    }
    if(data.image&&data.images.indexOf(data.image)<0){
      data.images.splice(data.images.indexOf(data.image),1);
      data.images.unshift(data.image);
    }
  }
  console.log(JSON.stringify(data));
  process.exit(0);
}
queue.push({
  link:link
});