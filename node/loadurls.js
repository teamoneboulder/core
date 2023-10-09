var request = require('request')
  , async = require('async'),fs = require('fs');
var debug=0;
//var urls=['http://api.groupupdev.me/groupup/ping?1','http://api.groupupdev.me/groupup/ping?2','http://api.groupupdev.me/groupup/ping?3','http://api.groupupdev.me/groupup/ping?4','http://api.groupupdev.me/groupup/ping?5'];
//var urls=JSON.parse(process.argv[2]);
var file=process.argv[2];
var starttime=new Date().getTime();
var size=0;
var total=0;
function logs(msg,force){
	//var debug=0;
	if(debug||force) console.log(msg);
}
var pagedata={};
function getInfo(opts,fin){
	console.log(opts)
	
}
var queue=[];
fs.readFile(file,'utf8', function (err, data) {
	//console.log(data);
	urls=JSON.parse(data);
	size=urls.length;
	for (var i = 0; i < urls.length; i++) {
		var url=urls[i];
		(function(url){
			queue.push(function(callback){
				request(url, function (err, response, body) {
				    if (err) throw err;
				    // pagedata[url]=body;
				    total++;
				    console.log('loaded: '+total+'/'+size);
				    callback();
				});
			});
		}(url))
	};
	async.parallel(queue,function() {
		var finishtime=new Date().getTime();
		//console.log(pagedata)
		console.log('Time: '+((finishtime-starttime)/1000)+'s');
		process.exit(0);
	});
});