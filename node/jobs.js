var tools = require('./tools.js');
var async = require('async');
 
//settings
var MAX_NOTICE=10;//limit is mongo...
var MAX_EMAIL=10;//AWS
var MAX_PUSH=10;//AWS, seems ok for now

tools.init();
tools.db.init(tools.conf.dbname,['scheduled_jobs'],function(db){
	var notifier={
		version:'2.0',
		delay:5000,//check every 5 seconds, not as high priority of time
		init:function(){
			var self=this;
			tools.log('Initializing Job Notifier Version ['+self.version+']',1);
			self.initQueues();
			self.loadNotices();
			tools.service.start('jobs.js');
		},
		makeLinkUid:function(prefix,url){
			var self=this;
			if(!self.md5) self.md5=require('md5');
			return prefix+self.md5(url).substr(0,10);
		},
		initQueues:function(){
			var self=this;
			self.noticequeue = async.queue(function (item, fin) {
				self.processNotice(item,fin);
			},MAX_NOTICE);
			self.noticequeue.drain = function() {
				tools.log('Done Processing Notice Queue',1);
				self.queueNext();
			}
			self.asyncjobqueue = async.queue(function (obj, fin) {
				obj.onDone.push(fin);
				self.jobs.send(obj);
			},MAX_NOTICE);
			self.hookqueue = async.queue(function (obj, fin) {
				obj.onDone.push(fin);
				self.hooks.process(obj);
			},MAX_NOTICE);
			self.asyncjobqueue.drain = function() {
				tools.log('Done Processing Jobs',1);
			}
			self.broadcastqueue = async.queue(function (obj, fin) {
				obj.onDone.push(fin);
				self.broadcast.send(obj);
			},MAX_NOTICE);
			self.broadcastqueue.drain = function() {
				tools.log('Done Processing Jobs',1);
			}
			self.syncjobqueue = async.queue(function (obj, fin) {
				obj.onDone.push(fin);
				self.jobs.send(obj);
			},1);
			self.syncjobqueue.drain = function() {
				tools.log('Done Processing Jobs',1);
			}
		},
		queueNext:function(){
			var self=this;
			//tools.log('Queue Next ['+self.delay+']',1);
			setTimeout(function(){
				self.loadNotices();
			},self.delay);
		},
		loadNotices:function(){
			var self=this;
			//dont get notices set in future
			//console.log({status:{$exists:false},ts:{$lte:tools.ts()}});
			db.scheduled_jobs.find({status:{$exists:false},ts:{$lte:tools.ts()}},{},function(err,notices){
				notices.count(function(err,count){
					if(count){
						console.log('got ['+count+'] notices')
						notices.forEach(function(notice,index){
							self.noticequeue.push(notice);
						})
					}else{
						self.queueNext();
					}
				})
			})
		},
		updateNotice:function(id,update,onDone){
			var self=this;
			tools.log('update ['+id+']',1);
			db.scheduled_jobs.update({_id:id},update,function(){
				self.onDone(onDone);
			})
		},
		onDone:function(onDone){
			for (var i = onDone.length - 1; i >= 0; i--) {//clear in reverse!
				onDone[i]();
			};
		},
		processNotice:function(item,done){
			var self=this;
			switch(item.opts.type){//internal jobs
				case 'url':
					self.jobs.add({item:item,onDone:[done]});
				break;
				case 'hook':
					self.hooks.add({item:item,onDone:[done]});
				break;
				default:
					tools.log('Invalid Type ['+item.opts.type+']',1);
					tools.log(JSON.stringify(item),1);
					self.updateNotice(item._id,{$set:{status:-1,resp:{err:'invalid_type'}}},[done]);
					//done();
				break;
			}
		},
		broadcast:{
			add:function(obj){
				var self=notifier;
				tools.log('Adding '+((obj.item.syncronous)?'Syncronous':'Asyncronous')+' Job['+obj.item._id+']',1);
				self.broadcastqueue.push(obj);
			},
			send:function(obj){
				var self=notifier;
				tools.log('Processing '+((obj.item.syncronous)?'Syncronous':'Asyncronous')+' Job['+obj.item._id+']',1);
				var start=new Date().getTime();
				//self.updateNotice(obj.item._id,{$set:{status:1,resp:data}},obj.onDone);
			}
		},
		jobs:{
			add:function(obj){
				var self=notifier;
				if(obj.item.syncronous){
					tools.log('Adding '+((obj.item.syncronous)?'Syncronous':'Asyncronous')+' Job['+obj.item._id+']',1);
					self.syncjobqueue.push(obj);
				}else self.asyncjobqueue.push(obj);
			},
			send:function(obj){
				var self=notifier;
				//this will be url based with a URL callback
				tools.log('Processing '+((obj.item.syncronous)?'Syncronous':'Asyncronous')+' Job['+obj.item._id+']',1);
				if(!obj.item.opts.data) obj.item.opts.data={}; 
				if(obj.item.opts.data.internal){//use admin_token
					obj.item.opts.data.appid='2366d44c84409765d9a00619aea4c1234';
					obj.item.opts.data.token=tools.settings.admin_token;
					delete obj.item.opts.data.internal;
				}
				tools.get2(obj.item.opts.url,obj.item.opts.data,-1,1,function(resp){
					console.log(data);
					if(resp&&resp.success){
						var data=resp;
						if(data.success) self.updateNotice(obj.item._id,{$set:{status:1,resp:data}},obj.onDone);
						else{
							tools.log('Error With ['+obj.item._id+'] ['+obj.item.opts.url+'] ['+JSON.stringify(resp)+']',1);
							self.updateNotice(obj.item._id,{$set:{status:-1,resp:{err:data.error}}},obj.onDone);
						}
					}else{
						tools.log('Error With ['+obj.item._id+'] ['+JSON.stringify(resp)+']',1);
						self.updateNotice(obj.item._id,{$set:{status:-1,resp:{err:'invalid_response'}}},obj.onDone);
					}
				})	
			}
		},
		hooks:{
			add:function(obj){
				var self=notifier;
				self.hookqueue.push(obj);
			},
			process:function(obj){
				var self=notifier;
				//this will be url based with a URL callback
				tools.log('Processing Job Hook['+obj.item._id+']',1);
				var data={
					id:obj.item.id,
					appid:'2366d44c84409765d9a00619aea4c1234',
					token:tools.settings.admin_token
				}
				var url='https://'+tools.settings.api+'/one_core/processhook';
				//console.log(url+'?'+tools.qs.stringify(data,{ encode: false }));
				tools.get2(url,data,-1,1,function(resp){
					if(resp&&resp.success){
						var data=resp;
						if(data.success) self.updateNotice(obj.item._id,{$set:{status:1,resp:data}},obj.onDone);
						else{
							tools.log('Error With ['+obj.item._id+'] ['+obj.item.opts.url+'] ['+JSON.stringify(resp)+']',1);
							self.updateNotice(obj.item._id,{$set:{status:-1,resp:{err:data.error}}},obj.onDone);
						}
					}else{
						tools.log('Error With ['+obj.item._id+'] ['+JSON.stringify(resp)+']',1);
						self.updateNotice(obj.item._id,{$set:{status:-1,resp:resp}},obj.onDone);
					}
				})	
			}
		}
	}
	notifier.init();//initalize!
})