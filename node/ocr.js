const tesseract = require("node-tesseract-ocr")
const sharp = require('sharp');
var request = require('request')
  , fs = require('fs')
var base='/tmp/hd_'+new Date().getTime();
var ext='.png';
const config = {
  lang: "eng",
  oem: 1,
  psm: 10,
}
var save=base+'_full'+ext;
if(process.argv[2]){
  var url=process.argv[2];
}else{//debug
  var url='https://s3.amazonaws.com/one-light/img/0d70358192b92d/full.png';//tom (pluto not working!)
  // var url='https://s3.amazonaws.com/one-light/img/363752c34e9b6d/full.png';//schuyler
  // var url='https://s3.amazonaws.com/one-light/img/54ad743ee1a78b/full.png';//argon
  // var url='https://s3.amazonaws.com/one-light/img/3a55f8f37473a4/full.png';//aurora
}
var app={
  debug:false,
  init:function(){
    app.data={personality:{},design:{},gates:[]}
    app.download(url, save,function(){
      if(app.debug) console.log(save)
      app.processImages(0);
    })
  },
  download:function(uri, filename, callback){
    request.head(uri, function(err, res, body){
      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
  },
  images:{
    sun_personality:{
      type:"personality",
      key:'sun',
      crop:{ left: 180, top: 50, width: 61, height: 48 }
    },
    earth_personality:{
      type:"personality",
      key:'earth',
      crop:{ left: 180, top: (50+48*1), width: 61, height: 48 }
    },
    north_node_personality:{
      type:"personality",
      key:'north_node',
      crop:{ left: 180, top: (50+48*2), width: 61, height: 48 }
    },
    south_node_personality:{
      type:"personality",
      key:'south_node',
      crop:{ left: 180, top: (50+48*3), width: 61, height: 48 }
    },
    moon_personality:{
      type:"personality",
      key:'moon',
      crop:{ left: 180, top: (50+48*4), width: 61, height: 48 }
    },
    mercury_personality:{
      type:"personality",
      key:'mercury',
      crop:{ left: 180, top: (50+48*5), width: 61, height: 48 }
    },
    venus_personality:{
      type:"personality",
      key:'venus',
      crop:{ left: 180, top: (50+48*6), width: 61, height: 48 }
    },
    mars_personality:{
      type:"personality",
      key:'mars',
      crop:{ left: 180, top: (50+48*7), width: 61, height: 48 }
    },
    jupiter_personality:{
      type:"personality",
      key:'jupiter',
      crop:{ left: 180, top: (50+48*8), width: 61, height: 48 }
    },
    saturn_personality:{
      type:"personality",
      key:'saturn',
      crop:{ left: 180, top: (50+48*9), width: 61, height: 48 }
    },
    uranus_personality:{
      type:"personality",
      key:'uranus',
      crop:{ left: 180, top: (50+48*10), width: 61, height: 48 }
    },
    neptune_personality:{
      type:"personality",
      key:'neptune',
      crop:{ left: 180, top: (50+48*11), width: 61, height: 48 }
    },
    pluto_personality:{
      type:"personality",
      key:'pluto',
      crop:{ left: 180, top: (50+48*12), width: 61, height: 48 }
    },
    sun_design:{
      type:"design",
      key:'sun',
      crop:{ left: 930, top: 50, width: 61, height: 48 }
    },
    earth_design:{
      type:"design",
      key:'earth',
      crop:{ left: 930, top: (50+48*1), width: 61, height: 48 }
    },
    north_node_design:{
      type:"design",
      key:'north_node',
      crop:{ left: 930, top: (50+48*2), width: 61, height: 48 }
    },
    south_node_design:{
      type:"design",
      key:'south_node',
      crop:{ left: 930, top: (50+48*3), width: 61, height: 48 }
    },
    moon_design:{
      type:"design",
      key:'moon',
      crop:{ left: 930, top: (50+48*4), width: 61, height: 48 }
    },
    mercury_design:{
      type:"design",
      key:'mercury',
      crop:{ left: 930, top: (50+48*5), width: 61, height: 48 }
    },
    venus_design:{
      type:"design",
      key:'venus',
      crop:{ left: 930, top: (50+48*6), width: 61, height: 48 }
    },
    mars_design:{
      type:"design",
      key:'mars',
      crop:{ left: 930, top: (50+48*7), width: 61, height: 48 }
    },
    jupiter_design:{
      type:"design",
      key:'jupiter',
      crop:{ left: 930, top: (50+48*8), width: 61, height: 48 }
    },
    saturn_design:{
      type:"design",
      key:'saturn',
      crop:{ left: 930, top: (50+48*9), width: 61, height: 48 }
    },
    uranus_design:{
      type:"design",
      key:'uranus',
      crop:{ left: 930, top: (50+48*10), width: 61, height: 48 }
    },
    neptune_design:{
      type:"design",
      key:'neptune',
      crop:{ left: 930, top: (50+48*11), width: 61, height: 48 }
    },
    pluto_design:{
      type:"design",
      key:'pluto',
      crop:{ left: 930, top: (50+48*12), width: 61, height: 48 }
    }
  },
  processImages:function(index){
    var keys=Object.keys(app.images);
    var item=app.images[keys[index]];
    item.index=index;
    app.processImage(item,function(rdata){
      index++;
      var n=rdata.split('.');
      var gate=parseInt(n[0],10);
      app.data[item.type][item.key]={
        gate:gate,
        line:parseInt(n[1],10)
      }
      if(gate&&app.data.gates.indexOf(gate)==-1) app.data.gates.push(gate);
      if(keys[index]){
        app.processImages(index);
      }else{
        console.log(JSON.stringify(app.data));
        //clean
        fs.unlinkSync(save)
        fs.unlinkSync(base+ext)
        process.exit()
      }
    })
  },
  processImage:function(img,cb){
    var debug=(app.debug)?'_'+img.index:'';
    var saveAs=base+debug+ext;
    sharp(save).extract(img.crop)
      .toFile(saveAs, function(err) {
          tesseract
          .recognize(base+debug+ext, config)
          .then((text) => {
            text=text.trim()
            if(app.debug) console.log("Result:", text)

            if(!text){
              fs.copyFileSync(saveAs, '/tmp/hd_error_'+new Date().getTime()+ext)
              if(app.debug) console.log('saved error image')
            }
            cb(text)
          })
          .catch((error) => {
            console.log(error.message)
          })
        // Extract a region of the input image, saving in the same format.
      });
  },
  debugProcessImage:function(src,cb){
    tesseract.recognize(src, config).then((text) => {
      text=text.trim()
       console.log("Result:", text)
    })
    .catch((error) => {
      console.log(error.message)
    })
  }
}
//app.debugProcessImage(url);
app.init()