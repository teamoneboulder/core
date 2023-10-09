//urlt=http://www.ic.org/wp-json/v1/directory/entries/?page=X
var tools=require('groupup.js');
var mongojs = require('mongojs');
var datadb = mongojs('data');
var datacoll=datadb.collection('intentional_communities');//only get collection once.
var markerdb = mongojs('groupup');
var markercoll=markerdb.collection('map_marker');//only get collection once.
//initialize
tools.init();
var tc=0;
var module={
	debug:1,
	saveMarker:function(obj,fin){
		var lat=parseFloat(obj.lat);
		var lng=parseFloat(obj.lon);
		var marker={
			_id:'retreat_'+tools.getId(obj.name),
			loc:{
				lat:lat,
				lng:lng
			},
			coords:[lng,lat],
			name:obj.name,
			via:'rf',
			sub_layer:'retreat'
		}
		markercoll.save(marker,function(){
			fin();
		})
	},
	update:function(){
		var file='/var/www/root/node/tempdata/retreats.json';
		var async=require('async');
		var queue = async.queue(function (opts, fin) {
		    module.saveMarker(opts,fin);
		}, 10);
		queue.drain = function(){
		    tools.log('Done updating ['+tc+'] markers',module.debug);
		    process.exit(0);
		}
		markercoll.remove({via:'rf'},function(){
			var d=tools.getFile(file,1);
			for (var i = 0; i < d.length; i++) {
				var td=d[i];
				if(td.lat&&td.lon){
					tc++;
					queue.push(td);
				}
			};
		})
		// datacoll.find().forEach(function(err,doc){
		// 	//console.log(doc)
		// 	if(doc&&doc.loc){

		// 		var marker={
		// 			_id:'intentional_communities_'+doc._id,
		// 			loc:doc.loc,
		// 			type:'intentional_communities',
		// 			name:doc.name,
		// 			via:'rf',
		// 			links:[{
		// 				name:'FIC Profile',
		// 				url:'http://www.ic.org/directory/'+doc.slug+'/'
		// 			}]
		// 		}
		// 		//add links
		// 		if(doc.website){
		// 			marker.links.push({
		// 				name:'Website',
		// 				url:doc.website
		// 			})
		// 		}
		// 		markercoll.save(marker)
		// 	}
		// })

	}
}
module.update();