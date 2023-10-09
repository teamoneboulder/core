var tools = require('./tools.js');
var async = require('async');
var ses=tools.getAWS('ses');
var sns=tools.getAWS('sns');
 
//settings
var MAX_BROADCAST=1;//limit is size of broadcast......
tools.init();
if(tools.settings.prod){
	var MAX_MESSAGE=10;//limit is mongo...also lets not crush our own servers...
}else{
	var MAX_MESSAGE=10;
}
tools.db.init(tools.conf.project,['page','page_members','device','notice','broadcast','user','push_follow','page_follow'],function(db){
	var broadcast={
		version:'1.2',
		delay:1000,//check every second
		init:function(){
			var self=this;
			tools.log('Initializing Broadcast Version ['+self.version+']',1);
			self.initQueues();
			self.loadNotices();
			tools.service.start('broadcast.js');
		},
		makeLinkUid:function(prefix,url){
			var self=this;
			if(!self.md5) self.md5=require('md5');
			return prefix+self.md5(url).substr(0,10);
		},
		mqc:0,
		initQueues:function(){
			var self=this;
			self.broadcastqueue = async.queue(function (item, fin) {
				self.processBroadcast(item,fin);
			},MAX_BROADCAST);
			self.broadcastqueue.drain = function() {
				tools.log('Done Processing Broadcast Queue',1);
				self.queueNext();
			}
			self.messagequeue = async.queue(function (item, fin) {
				self.processMessage(item,fin);
			},MAX_MESSAGE);
			self.messagequeue.drain = function() {
				tools.log('Done Processing Message Queue',1);
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
			db.broadcast.find({status:{$exists:false}},{},function(err,broadcasts){
				var c=0;
				broadcasts.count(function(err,count){
					if(count){
						broadcasts.forEach(function(broadcast,index){
							self.broadcastqueue.push(broadcast);
						})
					}else{
						self.queueNext();
					}
				})
			})
		},
		updateBroadcast:function(id,update,onDone){
			var self=this;
			console.log('update ['+id+']')
			//tools.log('update ['+id+']',1);
			db.broadcast.update({_id:id},update,function(){
				self.onDone(onDone);
			})
		},
		onDone:function(onDone){
			for (var i = onDone.length - 1; i >= 0; i--) {//clear in reverse!
				onDone[i]();
			};
		},
		processMessage:function(item,done){
			var self=this;
			//process and save the message!
			//tools.dblog(item,done);
			if(item.broadcast.type=='group_broadcast'){
				var uidp=item.member.id.split('_');
				var uid=uidp[1];
				if(!uid) return done();//catch
				db.device.find({uid:uid},function(err,devices){
					if(!err){
						devices.count(function(err,count){
							if(count){
								var cur=0;
								devices.forEach(function(device,index){
									var notice={
										"type" : "push",
										"opts" : {
											"message" : item.page.name+": "+item.broadcast.message,
											"title" : "Nectar",
											"intent" : "",
											"sound" : "",
											"count" : 1,
											"device" : {
												"arn" : tools.getArn(device),
												"type" : (device.a)?"android":"ios"
											}
										}
									}
									if(!tools.conf.prod){
										notice.opts.message='('+tools.conf.env+') '+notice.opts.message;
									}
									//save it!
									db.notice.insertOne(notice,function(err,resp){
										if(!err){
											cur++;
											if(cur==count){
												done();
											}
										}else{
											tools.dblog('Error Saving a push broadcast for ['+uid+']',function(){
												cur++;
												if(cur==count){
													done();
												}
											})
										}
									})
								})
							}else{
								//console.log('no devices for ['+uid+']');//done
								done();
							}
						});
					}else{
						//console.log('couldnt get user devices ['+uid+']');//done
						done();
					}
				})
			}else if(item.broadcast.type=='app_broadcast'){
				var uid=item.user.id;
				if(!uid) return done();//catch
				db.device.find({uid:uid},function(err,devices){
					if(!err){
						devices.count(function(err,count){
							if(count){
								var cur=0;
								devices.forEach(function(device,index){
									var notice={
										"type" : "push",
										"opts" : {
											"message" : item.broadcast.message,
											"title" : "Nectar",
											"intent" : "",
											"sound" : "",
											"count" : 1,
											"device" : {
												"arn" : tools.getArn(device),
												"type" : (device.a)?"android":"ios"
											}
										}
									}
									if(!tools.conf.prod){
										notice.opts.message='('+tools.conf.env+') '+notice.opts.message;
									}
									//save it!
									db.notice.insertOne(notice,function(err,resp){
										if(!err){
											cur++;
											if(cur==count){
												done();
											}
										}else{
											tools.dblog('Error Saving a push broadcast for ['+uid+']',function(){
												cur++;
												if(cur==count){
													done();
												}
											})
										}
									})
								})
							}else{
								done();
							}
						});
					}else{
						done();
					}
				})
			}else if(item.mirror){
				//post to a URL that will build/save notification
				var url='https://'+tools.settings.api+'/nectar/buildnotice';
				tools.post(url,{
					from:item.broadcast.from,
					to:item.user,
					type:item.broadcast.type,
					data:item.broadcast.data,
					from_data:item.broadcast.from_data,
					progress:item.progress,
					token:tools.settings.admin_token
				},{},1,function(resp){
					done();
				})
			}else if(item.broadcast.type=='post_added'){
				//post to a URL that will build/save notification
				var url='https://'+tools.settings.api+'/nectar/buildnotice';
				tools.post(url,{
					from:item.broadcast.from,
					to:item.user,
					type:item.broadcast.type,
					data:item.broadcast.data,
					from_data:item.broadcast.from_data,
					progress:item.progress,
					token:tools.settings.admin_token
				},{},1,function(resp){
					done();
				})
			}else if(item.broadcast.type=='event_invite'){
				//post to a URL that will build/save notification
				var url='https://'+tools.settings.api+'/nectar/buildnotice';
				tools.post(url,{
					from:item.broadcast.from,
					to:item.user,
					type:item.broadcast.type,
					data:item.broadcast.data,
					from_data:item.broadcast.from_data,
					progress:item.progress,
					token:tools.settings.admin_token
				},{},1,function(resp){
					done();
				})
			}else{
				console.log('invalid type of push message');
				done();
			}
		},
		processBroadcast:function(item,done){
			var self=this;
			//get all page members!
			//console.log(JSON.stringify(item));
			if(item.type=='group_broadcast'){
				db.page_members.find({'id':new RegExp('^'+item.app, 'i')},{},function(err,members){
					members.count(function(err,count){
						if(count){
							db.page.findOne({id:item.app},function(err,page){
								if(!err){
									members.forEach(function(member,index){
										self.messagequeue.push({member:member,broadcast:item,page:page});
									})
									self.updateBroadcast(item._id,{$set:{status:1,resp:{message:'Sent to ['+count+'] people'}}},[done]);
								}else{
									self.updateBroadcast(item._id,{$set:{status:-1,resp:{err:'Invalid Page ['+item._id+']'}}},[done]);
								}
							});
						}else{
							self.updateBroadcast(item._id,{$set:{status:-1,resp:{err:'Invalid: No members for ['+item.id+']'}}},[done]);
							self.queueNext();
						}
					})
				})
			}else if(item.type=='app_broadcast'){
				db.user.find({},{},function(err,users){
					users.count(function(err,count){
						users.forEach(function(user,index){
							self.messagequeue.push({user:user,broadcast:item});
						})
						self.updateBroadcast(item._id,{$set:{status:1,resp:{message:'Sent to ['+count+'] people'}}},[done]);
					});
				})
			}else if(item.mode=='mirror'){
				if(!item.to){//mirror to everyone
					db.user.find({},{},function(err,users){
						users.count(function(err,count){
							if(tools.settings.prod||true){
								var sent=0;
								var skip=(item.skip)?item.skip:[];
								if(!skip) skip=[];
								users.forEach(function(user,index){
									if(skip.indexOf(user.id)==-1&&user.id!=item.uid){//dont send to person who posted!
										self.messagequeue.push({mirror:1,user:user.id,broadcast:item,progress:(sent/count).toFixed(2)});
										sent++;
									}
								})
							}else{//dev testing...
								self.messagequeue.push({user:'UC9QP6XFW',broadcast:item});
							}
							self.updateBroadcast(item._id,{$set:{status:1,resp:{message:'Sent to ['+count+'] people'}}},[done]);
						});
					})
				}else{//mirror to select group
					var count=item.to.length;
					var sent=0;
					var skip=(item.skip)?item.skip:[];
					for (var i = 0; i < item.to.length; i++) {
						var uid=item.to[i];
						if(skip.indexOf(uid)==-1) self.messagequeue.push({mirror:1,user:uid,broadcast:item,progress:(sent/count).toFixed(2)});
						sent++;
					}
					self.updateBroadcast(item._id,{$set:{status:1,resp:{message:'Sent to ['+count+'] people'}}},[done]);
				}
			}else if(item.type=='post_added'){//all users!, will limit to user's close friends in time
				if(item.broadcast){//from admin, notify all users!
					db.user.find({},{},function(err,users){
						users.count(function(err,count){
							if(tools.settings.prod||true){
								var sent=0;
								var skip=(item.skip)?item.skip:[];
								if(!skip) skip=[];
								users.forEach(function(user,index){
									if(skip.indexOf(user.id)==-1&&user.id!=item.uid){//dont send to person who posted!
										self.messagequeue.push({user:user.id,broadcast:item,progress:(sent/count).toFixed(2)});
										sent++;
									}
								})
							}else{//dev testing...
								self.messagequeue.push({user:'UC9QP6XFW',broadcast:item});
							}
							self.updateBroadcast(item._id,{$set:{status:1,resp:{message:'Sent to ['+count+'] people'}}},[done]);
						});
					})
				}else{
					//get list
					if(item.list){//lookup by list and notify those in both lists

					}else{
						if(!item.page){
							//personal!
							db.push_follow.findOne({id:item.from},function(err,data){
								if(!err&&data&&data.push_follow&&data.push_follow.length){
									db.user.find({id:{$in:data.push_follow}},{},function(err,users){
										users.count(function(err,count){
											if(count){
												if(tools.settings.prod||true){
													var sent=0;
													var skip=(item.skip)?item.skip:[];
													if(!skip) skip=[];
													users.forEach(function(user,index){
														if(skip.indexOf(user.id)==-1){
															self.messagequeue.push({user:user.id,broadcast:item,progress:(sent/count).toFixed(2)});
															sent++;
														}
													})
												}else{//dev testing...
													self.messagequeue.push({user:'UC9QP6XFW',broadcast:item});
												}
												self.updateBroadcast(item._id,{$set:{status:1,resp:{message:'Sent to ['+count+'] people'}}},[done]);
											}else{
												self.updateBroadcast(item._id,{$set:{status:1,resp:{message:'Sent to 0 people'}}},[done]);
											}
										});
									})
									// console.log('send to:');
									// console.log(data.push_follow)
									// self.updateBroadcast(item._id,{$set:{status:1,resp:{message:'Sent to 0 people'}}},[done]);
								}else{
									self.updateBroadcast(item._id,{$set:{status:1,resp:{message:'Sent to 0 people'}}},[done]);
								}
							});
						}else{
							//to a page or group
							//eventually use more refined methods, but for now select everyone in group
							//find all members of page
							db.page_follow.find({page:item.page},function(err,data){
								tools.db.toOrderedList(data,'uid',function(data){
									if(data&&data.order&&data.order.length){
										db.user.find({id:{$in:data.order}},{},function(err,users){
											tools.db.toOrderedList(users,'id',function(users){
												if(users&&users.order&&users.order.length){
													var skip=(item.skip)?item.skip:[];
													var count=users.order.length;
													for (var i = 0; i < users.order.length; i++) {
														var tu=users.order[i];
														var user=users.list[tu];
														if(skip.indexOf(user.id)==-1){
															self.messagequeue.push({user:user.id,broadcast:item,progress:(sent/count).toFixed(2)});
															sent++;
														}
													}
													self.updateBroadcast(item._id,{$set:{status:1,resp:{message:'Sent to ['+count+'] people'}}},[done]);
												}else{
													self.updateBroadcast(item._id,{$set:{status:1,resp:{message:'Sent to 0 people'}}},[done]);
												}
											});
										})
									}else{
										self.updateBroadcast(item._id,{$set:{status:1,resp:{message:'Sent to 0 people'}}},[done]);
									}
								})
							})
						}
					}
				}
			}else if(item.type=='event_invite'){//all users!, will limit to user's close friends in time
				if(item.broadcast){//from admin, notify all users!
					db.user.find({},{},function(err,users){
						users.count(function(err,count){
							if(tools.settings.prod||true){
								var sent=0;
								var skip=(item.skip)?item.skip:[];
								if(!skip) skip=[];
								users.forEach(function(user,index){
									if(skip.indexOf(user.id)==-1&&user.id!=item.uid){//dont send to person who posted!
										self.messagequeue.push({user:user.id,broadcast:item,progress:(sent/count).toFixed(2)});
										sent++;
									}
								})
							}else{//dev testing...
								self.messagequeue.push({user:'UC9QP6XFW',broadcast:item});
							}
							self.updateBroadcast(item._id,{$set:{status:1,resp:{message:'Sent to ['+count+'] people'}}},[done]);
						});
					})
				}else{
					var users=item.to;
					var sent=0;
					var count=users.length;
					for (var i = 0; i < users.length; i++) {
						var u=users[i];
						self.messagequeue.push({user:u,broadcast:item,progress:(sent/count).toFixed(2)});
					}
					self.updateBroadcast(item._id,{$set:{status:1,resp:{message:'Sent to ['+count+'] people'}}},[done]);
				}
			}else{
				self.updateBroadcast(item._id,{$set:{status:-1,resp:{err:'Invalid Broadcast Type!'}}},[done]);
			}
		}
	}
	broadcast.init();//initalize!
})