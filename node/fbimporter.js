var tools = require('./tools.js');
var async = require('async');
var ses=tools.getAWS('ses');
var sns=tools.getAWS('sns');
var fbscrape=require('fbscrape.js');
 
//settings
var MAX_JOBS=10;//limit is ?...
var MAX_FB=2;//limit is FB...

tools.init();
tools.db.init(tools.conf.project,['user','jobs','post','fb_photos','fb_imports','creds','fb_friends','fb_info','media','fb_post','friend','fb_friend_default','token'],function(db){
	var notifier={
		//checkHashtag:'#XXX',
		skipTags:[],
		checkHashtag:false,
		version:'3.3',
		delay:1000,//check every second
		init:function(){
			var self=this;
			tools.log('Initializing FB IMPORT Version ['+self.version+'] at ['+new Date().toTimeString()+']',1);
			self.initQueues();
			self.loadJobs();
			tools.service.start('fbimporter.js');
		},
		makeLinkUid:function(prefix,url){
			var self=this;
			if(!self.md5) self.md5=require('md5');
			return prefix+self.md5(url).substr(0,10);
		},
		initQueues:function(){
			var self=this;
			self.jobqueue = async.queue(function (item, fin) {
				self.processJob(item,fin);
			},MAX_JOBS);
			self.jobqueue.drain = function() {
				self.queueNext();
				tools.log('Up To Date Processing Notice Queue',1);
			}
			self.fbqueue = async.queue(function (item, fin) {
				item.onDone.push(fin);
				self.fb.process(item);
			},MAX_FB);
			self.fbqueue.drain = function() {
				tools.log('Up To Date Processing FB',1);
			}
			self.projectqueue = async.queue(function (item, fin) {
				item.onDone.push(fin);
				self.project.process(item);
			},MAX_FB);
			self.projectqueue.drain = function() {
				tools.log('Up To Date Processing queue',1);
			}
			self.fbtokens = async.queue(function (item, fin) {
				item.onDone.push(fin);
				self.fb.debugToken(item);
			},MAX_FB);
			self.fbtokens.drain = function() {
				tools.log('Up To Date Processing FB Tokens',1);
			}
		},
		queueNext:function(){
			var self=this;
			//tools.log('Queue Next ['+self.delay+']',1);
			setTimeout(function(){
				self.loadJobs();
			},self.delay);
		},
		loadJobs:function(){
			var self=this;
			db.jobs.find({status:{$exists:false}},{},function(err,notices){
				var c=0;
				notices.count(function(err,count){
					if(count){
						notices.forEach(function(notice,index){
							self.jobqueue.push(notice);
						})
					}else{
						self.queueNext();
					}
				})
			})
		},
		updateJob:function(id,update,onDone){
			var self=this;
			//tools.log('update ['+id+']',1);
			db.jobs.update({_id:id},update,function(){
				self.onDone(onDone);
			})
		},
		onDone:function(onDone){
			for (var i = onDone.length - 1; i >= 0; i--) {//clear in reverse!
				onDone[i]();
			};
		},
		processJob:function(item,done){
			var self=this;
			switch(item.job){
				case 'fbimport':
					self.fb.add({item:item,onDone:[done]});
				break;
				case 'housekeeping':
					self.project.add({item:item,onDone:[done]});
				break;
				case 'ensuretokens':
					self.fb.checkTokens({item:item,onDone:[done]});
				break;
				default:
					tools.log('Invalid Type ['+item.type+'] id ['+item._id+']',1);
					done();
				break;
			}
		},
		project:{
			add:function(item){
				var self=notifier;
				self.projectqueue.push(item);
			},
			process:function(obj){
				var self=notifier;
				var item=obj.item;
				switch(item.type){
					case 'tokens':
						self.project.checkTokens(obj);
					break;
					default:
						self.updateJob(item._id,{$set:{status:1,response:'Invalid job type'}},obj.onDone);
					break;
				}
			},
			checkTokens:function(obj){
				console.log('checkTokens');
				var self=notifier;
				//get all fb_creds
				var item=obj.item;
				var days=(tools.settings.isdev)?10:60;//10 days in dev
				//console.log({tsu:{$lte:tools.db.tsToTime(new Date().getTime()-(60*60*24*days*1000))}});
				db.token.find({tsu:{$lte:new Date((new Date().getTime()-(60*60*24*days*1000)))}},function(err,cdata){
					if(!err){
						var c=0;
						cdata.count(function(err,count){
							console.log('got ['+count+'] items')
						})
						tools.db.toOrderedList(cdata,'id',function(data){
							if(data){
								var remove=[];
								for (var i = 0; i < data.order.length; i++) {
									var titem=data.list[data.order[i]];
									remove.push({
										id:titem.id
									})
								}
								tools.db.batchRemove(db,'token',remove,function(){
									self.updateJob(item._id,{$set:{status:1,response:'Successfully Cleared ['+data.order.length+'] tokens'}},obj.onDone);
								})
							}else{
								self.updateJob(item._id,{$set:{status:1,response:'No tokens to remove'}},obj.onDone);
							}
						})
					}
				})
			}
		},
		fb:{
			add:function(item){
				var self=notifier;
				self.fbqueue.push(item);
			},
			checkTokens:function(obj){
				var self=notifier;
				//get all fb_creds
				var item=obj.item;
				db.creds.find({app:'facebook'},function(err,cdata){
					if(!err){
						var c=0;
						cdata.count(function(err,count){
							if(count){
								cdata.forEach(function(item){
									//decrypt!
									if(item.e) item.access_token=tools.aes.decrypt(item.access_token);
									//compare last access time, no need to run on everyone!
									self.fbtokens.push({creds:item,onDone:[]});
								});
								self.updateJob(item._id,{$set:{status:1,response:'Successfully Queued ['+count+'] tokens'}},obj.onDone);
							}else{
								self.updateJob(item._id,{$set:{status:1,response:'No tokens'}},obj.onDone);
							}
						});
					}
				})
			},
			makeFriends:function(uid1,uid2,fin){
				//get default friend settings for both
				// db.fb_friend_default.find({id:{$in:[uid1,uid2]}},function(err,data){	
				// 	tools.db.toList(data,'id',function(data){
				// 		if(data&&data[uid1]&&data[uid2]){
				var url=tools.settings.protocol+tools.settings.api+'/one_core/module/permissions/fb_import/autofriend';
				var send={
					token:tools.settings.admin_token,
					uids:[uid1,uid2]
				}
				tools.post(url,send,false,1,function(resp){
					if(resp.error){
						console.log(JSON.stringify(resp));
						tools.dblog('Error Automaking Friends: '+JSON.stringify(resp),function(){
							fin();
						});
					}else{
						tools.dblog('Successfull Autofriend ['+uid1+'] and ['+uid2+']',function(){
							fin(1);
						});
					}
				},1)
				// 		}else{
				// 			var s=0;
				// 			var uid1c='';
				// 			var uid2c='';
				// 			if(data){
				// 				var s=Object.keys(data).length;
				// 				if(data[uid1]){
				// 					uid1c='*';
				// 				}
				// 				if(data[uid2]){
				// 					uid2c='*';
				// 				}
				// 			}
				// 			console.log(s+' of friends ['+uid1c+uid1+'] and ['+uid2c+uid2+'] have autofriending enabled');
				// 			tools.dblog(s+' of friends ['+uid1c+uid1+'] and ['+uid2c+uid2+'] have autofriending enabled',function(){
				// 				fin()
				// 			})
				// 		}
				// 	});
				// });
				//bulk add friend items
				//send notifications
			},
			processFriend:function(opts,fin){
				var self=this;
				var item=opts.item;
				var uid=opts.uid;
				var fid='';
				var set={
					id:tools.getFriendId(uid,item.id),
					ids:[uid,item.id]
				};
				db.friend.findOne({id:set.id},function(err,data){
					if(!data){
						opts.process({
							filter:{id:set.id},
							update:{$set:set},
							upsert:true
						});
						self.makeFriends(uid,item.id,function(success){
							if(success){
								opts.process2(item.id,data);
							}
							fin();
						});
					}else{
						console.log('user ['+uid+'] and ['+item.id+'] are already friends!');
						fin();
					}
				})
			},
			processFriends:function(uid,list,cb){
				var tosave=[];
				var addeddata=[];
				var self=this;
				if(list.length){
					var queue=[];
					var queue = async.queue(function (opts, fin) {
					    self.processFriend(opts,fin);
					}, 1);
					queue.drain = function() {
						function finish(){
							if(tosave.length){
								db.fb_friends.bulkWrite(tosave,{},function(){
									// tools.sendPush('','fb_import_friend_'+uid,{
									// 	update:true
									// })
									console.log('update ['+tosave.length+'] friends for ['+uid+']')
									cb();
								});
							}else{
								console.log('nothing to save');
								cb();
							}
						}
						if(addeddata.length){
							console.log(addeddata.length+' Friends were auto-added! Sending Notifications!');
							//send notification!
							var url=tools.settings.protocol+tools.settings.api+'/one_core/alertfriends';
							var send={
								token:tools.settings.admin_token,
								added:addeddata,
								uid:uid
							}
							tools.post(url,send,false,1,function(resp){
								if(resp.error){
									console.log(JSON.stringify(resp));
									tools.dblog('Error Notifying FB Friends: '+JSON.stringify(resp));
								}
								finish();
							},1)
						}else{
							finish();
						}
					}
					db.fb_info.find({fbid:{$in:list}},function(err,cdata){
						if(!err){
							cdata.count(function(err,count){
								if(count) cdata.forEach(function(item){
									queue.push({
										item:item,
										uid:uid,
										process:function(update){
											tosave.push({
												updateOne:update
											});
										},
										process2:function(id,data){
											addeddata.push(id);
										}
									})
								});
							});
						}						
					});
				}else{
					console.log('no updates to friends for ['+uid+']')
					cb();
				}
			},
			scrape:function(item,data,obj,latest){
				var self=notifier;
				var startTime=new Date().getTime();
				var response={};
				//console.log('SCRAPE - '+JSON.stringify(item));
				fbscrape.process({
					//simulateError:1,
					item:item,
					access_token:data.access_token,
					user_id:item.uid,
					data:(item.data)?item.data:{},
					type:item.type,//[posts,friends,birthday,photos,video]
					latest:latest,
					db:db,
					pageLimit:10000,//force to 1 for now!
					isValidPost:function(data){
						if(!data.message) return false;
						var smallmessage=data.message.toLowerCase();
						if(notifier.checkHashtag){
							if(smallmessage.indexOf(notifier.checkHashtag)==-1){//only continue if it has a #xxx hashtag
								console.log('Skipping post!  Doesnt have #xxx hashtag');
								return false;
							}
						}
						if(notifier.skipTags){
							for (var i = 0; i < notifier.skipTags.length; i++) {
								var tag=notifier.skipTags[i];
								if(smallmessage.indexOf(tag)>=0){//only continue if it has a #xxxx hashtag
									console.log('Skipping post! Has '+tag+' hashtag');
									return false;
								}
							}
						}
						return true;
					},
					onBadPost:function(data,cb){//on bad post, eg bad attachment, still record it!
						data.fb_ts=Math.floor(new Date(data.created_time).getTime()/1000);
						var set={
							id:data.id,
							uid:item.uid,
							created_ts:data.fb_ts
						}
						db.fb_post.update({id:data.id},{$set:set},{upsert:true},function(){
							cb();
						})
					},
					onFirstPost:function(data){//just cache TS
						data.by={
							id:item.uid,
							type:'user'
						}
						data.fb_ts=Math.floor(new Date(data.created_time).getTime()/1000);
						data.fbid=data.id;
						var set={
							id:data.fbid,
							uid:data.by.id,
							created_ts:data.fb_ts
						}
						response={
							start:set
						}
						db.fb_post.update({id:data.fbid},{$set:set},{upsert:true},function(){
							console.log('Successfully set first post for ['+data.by.id+']')
						});
					},
					getVideoPost:function(data,cb){
						data.by={
							id:item.uid,
							type:'user'
						}
						data.page={
							type:'user',
							id:item.uid
						}
						data._id=new tools.db.mongo.ObjectID(tools.db.objectIdFromDate(new Date(data.created_time)));
						data.fbid=data.id;
						if(data&&data.privacy&&data.privacy.value=='EVERYONE'){
							data.perms=['public'];
						}else if(data&&data.privacy&&data.privacy.value=='ALL_FRIENDS'){
							data.perms=['friends'];
						}else{
							data.perms=['private'];
						}
						data.fb_ts=Math.floor(new Date(data.created_time).getTime()/1000);
						if(data.id) delete data.id;
						if(data.index) delete data.index;
						var set={
							id:data.fbid,
							uid:data.by.id,
							created_ts:data.fb_ts
						}
						response.postCount++;
						if(!response.data) response.data={};
						response.data[data.fbid]='processing';
						db.fb_post.update({id:data.fbid},{$set:set},{upsert:true},function(){
							cb(data);
						});
					},
					onPost:function(data,cb){
						//console.log(JSON.stringify(data));
						//console.log(JSON.stringify(item));
						data.by={
							id:item.uid,
							type:'user'
						}
						data.page={
							type:'user',
							id:item.uid
						}
						data._id=new tools.db.mongo.ObjectID(tools.db.objectIdFromDate(new Date(data.created_time)));
						data.fbid=data.id;
						if(data&&data.privacy&&data.privacy.value=='EVERYONE'){
							data.perms=['public'];
						}else if(data&&data.privacy&&data.privacy.value=='ALL_FRIENDS'){
							data.perms=['friends'];
						}else{
							data.perms=['private'];
						}
						data.fb_ts=Math.floor(new Date(data.created_time).getTime()/1000);
						if(data.id) delete data.id;
						if(data.index) delete data.index;
						if(data.created_time) delete data.created_time;
						if(!response.postCount) response.postCount=0;
						if(!response.posts) response.data={};
						response.postCount++;
						response.data[data.fbid]=data.fb_ts
						//internal api call to 
						var url=tools.settings.protocol+tools.settings.api+'/one_core/module/feed/post';
						var send={
							post:data,
							token:tools.settings.admin_token,
							force_uid:item.uid
						}
						var set={
							id:data.fbid,
							uid:data.by.id,
							created_ts:data.fb_ts
						}
						db.fb_post.update({id:data.fbid},{$set:set},{upsert:true},function(){
							if(data.from&&item.fb_info&&item.fb_info.fbid&&item.fb_info.fbid!=data.from.id){
								tools.log('Skipping post from a tagged persons timeline!',1);
								tools.dblog('Skipping post from a tagged persons timeline!',function(){
									cb();
								});
							}else{
								tools.post(url,send,false,1,function(resp){
									if(resp.error){
										console.log(JSON.stringify(resp));
										tools.dblog('Error Saving FB Post ['+item.uid+']: '+JSON.stringify(resp));
										//tools.dblog('>>>>>: '+JSON.stringify(send));
									}
									//console.log('response: '+JSON.stringify(resp))
									cb();
								},1)
							}
						})
						// db.fb_imports.findOne({id:data.id},function(err,tdata){
						// 	if(tdata){
						// 		delete data._id;
						// 	}
						// 	db.fb_imports.update({id:data.id},{$set:data},{upsert:true},function(err){
						//     	console.log(err)
						//     	cb()
						//     });
						// })
					},
					onFriends:function(uid,data,cb,options){
						tools.log('got friends',1)
						//get current list of friends to compare...
						var currentlist=[];
						for (var i = 0; i < data.length; i++) {
							var item=data[i];
							currentlist.push(item.id);
						}
						if(options.item&&options.item.first){
							//hook!
							var url=tools.settings.protocol+tools.settings.api+'/one_core/module/fb_import/first_friends';
							var send={
								token:tools.settings.admin_token,
								force_uid:uid,
								total:currentlist.length
							}
							tools.post(url,send,false,1,function(resp,oresp){
								if(resp.error){
									if(resp.error=='malformed_json') console.log(oresp);
									tools.dblog('Error sending onFriends for ['+uid+']: '+JSON.stringify(resp),function(){
										//if(cb) cb();
									});
								}else{
									//if(cb) cb();
								}
							},1)
						}
						self.fb.processFriends(uid,currentlist,cb);
						response={
							friends:currentlist.length
						}
						// db.fb_friends.find({id:uid},{id:1,fbid:1},function(err,cdata){
						// 	cdata.count(function(err,count){
						// 		var list=[];
						// 		if(count){
						// 			var c=0;
						// 			cdata.forEach(function(item){
						// 				c++;
						// 				if(currentlist.indexOf(item.fbid)==-1){//only add if new!
						// 					list.push(item.fbid);
						// 				}
						// 				if(c==count){//last item, now we are done...
						// 					self.fb.processFriends(uid,list,cb);	
						// 				}
						// 			})
						// 		}else{
						// 			self.fb.processFriends(uid,currentlist,cb);
						// 		}
						// 	})
						// });
						//cb();
					},
					onBirthday:function(uid,day){
						db.user.update({id:uid},{$set:{birthday:day}},{upsert:true},function(){
					    	
					    })
					},
					onPhoto:function(uid,data){
						data._id=new tools.db.mongo.ObjectID(tools.db.objectIdFromDate(new Date(data.created_time),1));
						delete data.created_time;
						data.uid=uid;
						db.fb_photos.update({id:data.id},{$set:data},{upsert:true},function(){
					    	
					    })
					},
					onAttachment:function(id,data){
						db.fb_.update({id:id},{$set:{attachments:data}},{upsert:true},function(){
					    	
					    })
					},
					onError:function(msg,e){
						var self=notifier;
						console.log(msg);
						console.log(e);
						//tools.dblog(msg);
						if(typeof e=='object'){
							e.message=msg;
						}else{
							tools.dblog(msg);
						}
						//error codes
						//10 - doesnt have manage_pages permissions
						//error_subcode
						//463 - session expired
						//460 - user changed login password
						//458 - Person has de-authorized your app
						//480 - The user is enrolled in a blocking, logged-in checkpoint
						var invalidate=[463,460,458,490];
						var invalidate_codes=[10];
						if((e.error&&e.error.error_subcode&&invalidate.indexOf(e.error.error_subcode)>=0)||(e.error&&invalidate_codes.indexOf(e.error)>=0)){
							console.log('Clear Token for ['+item.uid+']')
							self.fb.clearToken(item.uid,function(){
								self.updateJob(item._id,{$set:{status:-1,msg:msg,error:e}},obj.onDone);
							})
						}else{
							tools.dblog(e);//unknown error, log so we know.
							tools.updateCreds(db,data.id,function(){
								self.updateJob(item._id,{$set:{status:-1,msg:msg,error:e}},obj.onDone);
							});
						}
					},
					onComplete:function(){
						//importedcoll.update({id:item.uid},{id:item.uid,processed:1},{upsert:true},function(){
						// console.log('======onComplete')
						// console.trace();
						tools.updateCreds(db,data.id,function(){
							//console.log('got here4');
							var diff=((new Date().getTime())-startTime)/1000;
							tools.log('Successfully Processed FB for ['+item._id+'] in ['+diff+' seconds]',1)
							self.updateJob(item._id,{$set:{status:1,_data:response,response:'Successfully Processedd in '+diff+' seconds'}},obj.onDone);
						});
						//broadcast message to user
						//});
					}
				});
			},
			process:function(obj){
				var self=notifier;
				var item=obj.item;
				tools.log('Processing FB for ['+item.uid+']',1);
				//write to db
				//tools.dblog('Processing FB for ['+item.uid+']');
				tools.getCreds(db,item.uid+'_facebook',function(creds){
					if(!creds){
						tools.log('invalid creds for ['+item.uid+']',1);
						//add flag to prevent this person
						self.updateJob(item._id,{$set:{status:-1,response:'invalid creds for ['+item.uid+']'}},obj.onDone);
					}else{
						if(creds&&creds.access_token){
							//also add in FB_info
							db.fb_info.findOne({id:item.uid},function(err,data){
								if(data){
									obj.item.fb_info=data;
								}
								self.fb.scrape(item,creds,obj,((item.latest)?item.latest:false));
							})
						}else{
							self.updateJob(item._id,{$set:{status:-1,response:'No Access Token'}},obj.onDone);
						}
					}
				})
			},
			clearToken:function(uid,cb){
				var url=tools.settings.protocol+tools.settings.api+'/one_core/module/fb_import/cleartoken';
				var send={
					token:tools.settings.admin_token,
					force_uid:uid
				}
				tools.post(url,send,false,1,function(resp,oresp){
					if(resp.error){
						if(resp.error=='malformed_json') console.log(oresp);
						tools.dblog('Error clearing token for ['+uid+']: '+JSON.stringify(resp),function(){
							if(cb) cb();
						});
					}else{
						tools.dblog('Successfully Cleared FB Token for ['+uid+']',function(){
							if(cb) cb();
						});
					}
				},1)
			},
			debugToken:function(obj){
				var self=notifier;
				var creds=obj.creds;
				var url=fbscrape.api+'/me';
				var uidp=creds.id.split('_');
				var uid=uidp[0];
				console.log('debugToken: '+creds.access_token)
				tools.get2(url,{},{
					'Authorization':'Bearer '+creds.access_token,
					'Content-Type':'application/json'
				},1,function(data,options){
					console.log(data);
					if(data.error){
						var invalidate=[463,460,458];
						if(data.error&&data.error.error_subcode&&invalidate.indexOf(data.error.error_subcode)>=0){
							console.log('Clear Token for ['+uid+']')
							self.fb.clearToken(uid,function(){
								notifier.onDone(obj.onDone);
							})
						}else{
							tools.dblog('FB debugToken error: '+JSON.stringify(data)+']',function(){
								notifier.onDone(obj.onDone);
							})
						}
					}else{
						console.log('Token valid for ['+uid+']');
						notifier.onDone(obj.onDone);
					}
				});
			}
		}
	}
	notifier.init();//initalize!
})