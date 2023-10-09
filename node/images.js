var tools = require('./tools.js');
var probe = require('probe-image-size');
var async = require('async');
tools.init();
var debug=(process.argv[3])?1:0;
tools.setVar('debug',debug);//set debug mode
var MIN_SIZE={
	width:300,
	height:200
}

var MAX_QUEUE=5;
var valid_images=[];
var imgqueue = async.queue(function (item, fin) {
	getImgSize(item.img,fin);
},MAX_QUEUE);
imgqueue.drain = function() {
	tools.log('Done Processing Image Queue, ['+valid_images.length+'] valid images');
	console.log(tools.toBase64(valid_images));
}
var data=tools.getBase64(process.argv[2]);
for (var i = 0; i < data.length; i++) {
	imgqueue.push({
		img:data[i]
	})
};
var acceptedMimes=['image/png','image/jpg','image/jpeg','image/gif'];
function getImgSize(img,fin){
	probe(img, function (err, result) {
		if(err){
			tools.log('error loading image ['+img+']');
			fin()
		}else{
			if(acceptedMimes.indexOf(result.mime)>=0){
				if(result.width>=MIN_SIZE.width&&result.height>=MIN_SIZE.height){
					tools.log('valid img ['+img+']');
					valid_images.push(img);
					fin()
				}else{
					tools.log('image too small ['+result.width+'x'+result.height+'] ['+img+']');
					fin();
				}
			}else{
				tools.log('mime ['+result.mime+'] no accepted ['+img+']');
				fin();
			}
		}
	});
}