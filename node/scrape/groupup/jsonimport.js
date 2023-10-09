//urlt=http://www.ic.org/wp-json/v1/directory/entries/?page=X
var tools=require('groupup.js');
var mongojs = require('mongojs');
var datadb = mongojs('data');
var markerdb = mongojs('groupup');
var markercoll=markerdb.collection('map_marker');//only get collection once.
//initialize
tools.init();
var via=process.argv[2];
if(!via){
	console.log('invalid via')
	process.exit(0);
}
var filename=process.argv[3];
if(!filename){
	console.log('invalid filename')
	process.exit(0);
}
var sub_layer=process.argv[4];
if(!sub_layer){
	console.log('invalid sub_layer')
	process.exit(0);
}
var tc=0;
var module={
	debug:1,
	saveMarker:function(obj,fin){
		obj.sub_layer=sub_layer;
		markercoll.save(obj,function(){
			fin();
		})
	},
	update:function(){
		var file='/var/www/root/node/tempdata/'+filename+'.json';
		var async=require('async');
		var queue = async.queue(function (opts, fin) {
		    module.saveMarker(opts,fin);
		}, 10);
		queue.drain = function(){
		    tools.log('Done updating ['+tc+'] markers',module.debug);
		    process.exit(0);
		}
		markercoll.remove({via:via},function(){
			var d=tools.getFile(file,1);
			if(d){
				for (var i = 0; i < d.length; i++) {
					var td=d[i];
					tc++;
					queue.push(td);
				};
			}else{
				console.log('Invalid File ['+file+']');
				process.exit(0)
			}
		})
	}
}
module.update();