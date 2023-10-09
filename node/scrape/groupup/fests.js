var tools=require('groupup.js');
tools.init();
var mongojs = require('mongojs');
var datadb = mongojs('data');
var cheerio=require('cheerio');
var markerdb = mongojs('groupup');
var markercoll=markerdb.collection('map_marker');//only get collection once
var async=require('async');
var queue = async.queue(function (marker, fin) {
    geocode(marker,fin);
}, 1);
var geocoder = require('geocoder');
var count=0;
queue.drain = function() {
    console.log('successfully loaded ['+count+'] items');
    process.exit(0)
}
var queue2 = async.queue(function (marker, fin) {
    saveItem(marker,fin);
}, 10);
var count=0;
queue2.drain = function() {
    console.log('successfully loaded ['+count+'] items');
    process.exit(0)
}
function saveItem(marker,fin){
    count++;
    markercoll.save(marker,function(){
        fin();
    });
}
function tgeocoder(address,cb){
	tools.get('https://maps.googleapis.com/maps/api/geocode/json?address='+encodeURIComponent(address)+'&key=AIzaSyC4eFhCuaXMgkF1MCopODiwlcOey9mv7_4',function(data){
		try{
			var d=JSON.parse(data);
			cb(d)
		}catch(e){
			cb(false)
		}
	})
}
var lc=0;
function geocode(opts,fin){
	opts.timeout=setTimeout(function(){
		opts.cleared=true;
		tools.log('cleared from timeout',1);
		fin();
	},15000);
	// tgeocoder(opts.location,function(data){
	// 	if(opts.cleared) return false; 
	// 	if(opts.timeout) clearTimeout(opts.timeout);
	// 	if(data&&data.results[0]){
	// 		count++;
	// 	}else{
	// 		console.log('nodata')
	// 	}
	// 	fin();
	// })
	geocoder.geocode(opts.location.replace(',',''), function ( err, data ) {
		if(opts.cleared) return false; 
		if(opts.timeout) clearTimeout(opts.timeout);
		if(!data.results[0]){
			console.log('no data for ['+opts.location+']')
			console.log(data.results)
		}
	  	if(err||!data.results||!data.results[0]){
	  		return fin();
	  	}
	  	lc++;
	  	console.log('successfully loaded '+lc+'/'+total)
	  	var marker={
			_id:'ef_'+opts._id,
			loc:data.results[0].geometry.location,
			name:opts.name,
			description:'',
			layer:'crown',
			sub_layer:'festivals',
			via:'ef',
			image:opts.image,
			links:[{
				url:opts.link,
				name:'Everfest Profile'
			}]
		};
	  	saveItem(marker,function(){
	  		setTimeout(function(){//throttle!
	  			fin()
	  		},1000)
	  	});
	});
}
var url='https://www.everfest.com/fest300';
var total=0;
tools.get(url,function(data){
	$=cheerio.load(data);
	var td=[]
	var c=0;
	$('.festival-card').each(function(i,v){
		var e=$(v);
		var id=e.find('.festival-card__title').attr('href').replace('/e/','');
		var d={
			_id:id,
			name:e.find('.festival-card__title').text(),
			link:'https://www.everfest.com'+e.find('.festival-card__title').attr('href'),
			image:e.find('.festival-card__img').attr('data-original'),
			location:e.find('.festival-card__location').text()
		}
		queue.push(d)
		c++;
	})
	total=c;
})



