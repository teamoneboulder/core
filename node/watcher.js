var fs=require('fs');
var tools=require('./tools.js');
const shellExec = require('shell-exec')
var watch = require('node-watch');
tools.init();
var VERSION='1.2';
var files={
	'api2.js':'/var/www/'+tools.conf.project+'/node/api2.js',
	'api2':'/var/www/'+tools.conf.project+'/node/api2',
	'tools':'/var/www/'+tools.conf.project+'/node/tools.js',
	'schema':'/var/www/'+tools.conf.project+'/_manage/schema.json'
}
console.log('Starting the Night Watch Version ['+VERSION+']');
tools.service.start('watcher.js');
for (var prop in files) {
	var file=files[prop];
	watch(file, function(event, filename){
		console.log(event+ ' '+filename);
		//restart forever!
		if(filename=='/var/www/'+tools.conf.project+'/_manage/schema.json'){
			var ep=['_manage','schema.json'];
			//send to bridge!
			tools.sendPush('','dev_channel',{
				type:'fileupdate',
				data:ep
			});
		}
		shellExec('forever restart /var/www/'+tools.conf.project+'/node/api2.js').then(function(){
		}).catch(function(err){
			console.log(err)
		})
		shellExec('forever restart /var/www/'+tools.conf.project+'/sites/chatter/chat.io.js').then(function(){
		}).catch(function(err){
			console.log(err)
		})
	});
}
var files2={
	'chat.io.js':'/var/www/'+tools.conf.project+'/sites/chatter/chat.io.js',
	'watcher':'/var/www/'+tools.conf.project+'/node/watcher.js',
	//'broadcast':'/var/www/'+tools.conf.project+'/node/broadcast.js',
	'notifier':'/var/www/'+tools.conf.project+'/node/notifier.js',
	//'fbimporter':'/var/www/'+tools.conf.project+'/node/fbimporter.js',
	'jobs':'/var/www/'+tools.conf.project+'/node/jobs.js',
	'cron':'/var/www/'+tools.conf.project+'/node/cron.js',
	//'fbscrape':'/var/www/'+tools.conf.project+'/node/node_modules/fbscrape.js'
}
if(tools.settings.isdev){
	console.log('Running with Dev hooks!');
	files2['components']='/var/www/'+tools.conf.project+'/sites/code';//for dev!
	//files2['docs']='/var/www/'+tools.conf.project+'-docs';//for dev!
}
for (var prop in files2) {
	var file=files2[prop];
	watch(file, { recursive: true },function(event, filename){
		console.log(event+ ' '+filename);
		if(filename.indexOf('/var/www/'+tools.conf.project+'/sites/code')===0){
			var fp=filename.split('/var/www/'+tools.conf.project+'/sites/code/');
			var ep=fp[1].split('/');
			//send to bridge!
			tools.sendPush('','dev_channel',{
				type:'fileupdate',
				data:ep
			});
		}else if(filename.indexOf('/var/www/'+tools.conf.project+'-docs')===0){
			var fp=filename.split('/var/www/'+tools.conf.project+'-docs/');
			var ep=fp[1].split('/');
			//send to bridge!
			tools.sendPush('',tools.conf.env+'_docs',{
				type:'fileupdate',
				data:ep
			});
		}else{
			if(filename =='/var/www/'+tools.conf.project+'/node/node_modules/fbscrape.js'){
				filename='/var/www/'+tools.conf.project+'/node/fbimporter.js';//uses fbscrpe
			}
			shellExec('forever restart '+filename).then(function(){
			}).catch(function(err){
				console.log(err)
			})
		}
	});
}