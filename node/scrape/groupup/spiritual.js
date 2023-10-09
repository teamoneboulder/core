var parseString = require('xml2js').parseString;
var tools=require('groupup.js');
tools.init();
var mongojs = require('mongojs');
var datadb = mongojs('data');
var datacoll=datadb.collection('numundo');//only get collection once.
var markerdb = mongojs('groupup');
var markercoll=markerdb.collection('map_marker');//only get collection once
var async=require('async');
var queue = async.queue(function (marker, fin) {
    saveItem(marker,fin);
}, 10);
var count=0;
queue.drain = function() {
    console.log('successfully loaded ['+count+'] items');
    process.exit(0)
}
function saveItem(marker,fin){
    count++;
    markercoll.save(marker,function(){
        fin();
    });
}
var url='https://csl.thankyou4caring.org/file/google-maps-location-finder/CSL-Markers.xml';
markercoll.remove({via:'ss'},function(){
	tools.get(url,function(data){
		parseString(data, function (err, result) {
		    for (var i = 0; i < result.markers.marker.length; i++) {
		    	var item=result.markers.marker[i]['$'];
		    	if(parseFloat(item.lat)){
			    	var marker={
						_id:'ss_'+item.ID,
						loc:{
							lat:parseFloat(item.lat),
							lng:parseFloat(item.lng)
						},
						name:item.name,
						description:'',
						layer:'crown',
						sub_layer:'spiritualcenters',
						via:'ss',
						links:[]
					};
					if(item.web){
						marker.links.push({
							url:tools.ensureLink(item.web),
							name:'Website'
						})
					}
					queue.push(marker);
				}
		    };
		});
	})
});
