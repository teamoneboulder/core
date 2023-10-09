var tools = require('./tools.js');
tools.init();
var async = require('async');
var request = require('request')
var progress = require('progress');
var total=1000;
var start=new Date().getTime()
var progressbar=new progress('Processed Links [:bar] :percent :etas', { cur:0,total: total,renderThrottle:10 });
var queue=[];
var urlPool=[
	//'https://api.'+tools.conf.domain+'/testdb',
	'https://api.'+tools.conf.domain+'/one_core/module/event/EUGWC6IHF54PN/load?token=f4c3deaa5ce624497035ae596695f2fa&_=1645743099127',
	'https://api.'+tools.conf.domain+'/one_core/module/event/E3KOY9IF60Q7B/load?token=f4c3deaa5ce624497035ae596695f2fa&_=1645743099138',
	'https://api.'+tools.conf.domain+'/one_core/module/profile/UCQ13TO59M6D/load?token=f4c3deaa5ce624497035ae596695f2fa&_=1645743099152',
	'https://api.'+tools.conf.domain+'/one_core/module/profile/UIAMPLAYER1/load?token=f4c3deaa5ce624497035ae596695f2fa&_=1645743099159',
	'https://api.'+tools.conf.domain+':3333/home/feed?max=10&appid=2366d44c84409765d9a00619aea4c1234&token=f4c3deaa5ce624497035ae596695f2fa&_=1645743099195'
	//'https://api.'+tools.conf.domain+'/testdb2'
];
var result={
	success:0,
	errors:0,
	errorMessages:[]
}
for (var i = 0; i < total; i++) {
	(function(i){
		queue.push(function(callback){
			var len=urlPool.length;
			var urlIndex=i%len;
			var url=urlPool[urlIndex];
			request(url, function (err, response, body) {
			    if (err) console.warn(err);
			    // pagedata[url]=body;
			    //console.log('processing ['+url+']: '+i+' of '+total);
			    progressbar.tick(1);
			    try{
			    	var res=JSON.parse(body);
			    	if(res.success){
			    		result.success++;
			    	}else if(res.error){
			    		result.errors++;
			    		result.errorMessages.push(res.error);
			    	}else{
			    		result.errors++;
			    		result.errorMessages.push('bad_response');
			    	}
			    	callback();
			    }catch(e){
			    	result.errors++;
			    	result.errorMessages.push('bad_json');
			    	callback();
			    }
			});	
		});
	}(i))
};
async.parallelLimit(queue,20,function() {
	var end=new Date().getTime()
	console.log('Requests Per Second: '+(total/((end-start)/1000)).toFixed(2));
	console.log(JSON.stringify(result,null,2));
	process.exit(0);
})