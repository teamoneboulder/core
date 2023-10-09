var tools = require('./tools.js');
var async = require('async');
var ses=tools.getAWS('ses');
var sns=tools.getAWS('sns');
 
//settings
var MAX_NOTICE=100;//limit is mongo...
var MAX_EMAIL=5;//AWS
var MAX_PUSH=10;//AWS, seems ok for now
var android_channel_name='one';
tools.init();
tools.db.init(tools.conf.dbname,['notice','email_campaign','system_log'],function(db){
	var notifier={
		version:'3.0',
		delay:1000,//check every second
		init:function(){
			var self=this;
			console.log('Initializing Notifier Version ['+self.version+']');
			tools.dblog('Initializing Notifier Version ['+self.version+']');
			//tools.alertAdmin('Initializing Notifier Version ['+self.version+']');
			self.initQueues();
			self.loadNotices();
			self.startHeartbeat();
			tools.service.start('notifier.js');
		},
		startHeartbeat:function(){
			tools.log('Staring Heartbeat',1);
			notifier.heartbeat();
			setInterval(function(){
				notifier.heartbeat();
			},60000);
		},
		heartbeat:function(){
			//tools.log('Heartbeat',1);
			tools.get('https://'+tools.settings.api+'/one_admin/heartbeat?token='+tools.settings.admin_token,function(resp){
				var resp=JSON.parse(resp);
				if(resp.success){
					// tools.db.connect(tools.conf.dbname,'heartbeat',function(heartbeatcoll){
					// 	var save={
					// 		a:resp.active,
					// 		created_on:new Date(),
					// 		a_24:resp.active_24,
					// 		a_week:resp.active_week,
					// 		a_month:resp.active_month,
					// 		page_activity_24:resp.page_activity_24
					// 	};
					// 	heartbeatcoll.insertOne(save);
					// });
				}else{
					tools.log('Heartbeat Error ['+JSON.stringify(resp)+']',1);
				}
			});
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
			self.emailqueue = async.queue(function (item, fin) {
				item.onDone.push(fin);
				self.email.send(item);
			},MAX_NOTICE);
			self.emailqueue.drain = function() {
				tools.log('Done Processing Emails',1);
			}
			// self.archivequeue = async.queue(function (item, fin) {
			// 	item.onDone.push(fin);
			// 	self.archive.process(item);
			// },MAX_NOTICE);
			// self.archivequeue.drain = function() {
			// 	tools.log('Done Processing Archives',1);
			// }
			self.pushqueue = async.queue(function (item, fin) {
				item.onDone.push(fin);
				if(item.item.to){
					self.push.send(item);
				}else{
					self.push.send(item,1);
				}
			},MAX_NOTICE);
			self.pushqueue.drain = function() {
				tools.log('Done Processing Push Messages',1);
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
			db.notice.find({status:{$exists:false}},{},function(err,notices){
				var c=0;
				notices.count(function(err,count){
					if(count){
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
			db.notice.updateOne({_id:id},update,function(){
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
			switch(item.type){
				case 'email':
					self.email.add({item:item,onDone:[done]});
				break;
				case 'push':
					self.push.add({item:item,onDone:[done]});
				break;
				// case 'archive':
				// 	self.archive.add({item:item,onDone:[done]});
				// break;
				default:
					tools.log('Invalid Type ['+item.type+'] id ['+item._id+']',1);
					done();
				break;
			}
		},
		push:{
			add:function(item){
				var self=notifier;
				self.pushqueue.push(item);
			},
			getOpts:function(item){
				if(item.device&&item.device.arn||item.topic){
					if(!item.message){
						return false;
					}
					if(item.message.length>200){
						item.message=item.message.substr(0,200)+'...';
						//tools.log('Trim Message: '+item.message,1);
					}
					//tools.log(JSON.stringify(item),1);
					if(item.title) title=item.title;
					if(!tools.settings.prod) title=title+' ('+tools.settings.prefix+')';
					if(item.topic){
						var topts={
			                Message:JSON.stringify({
			                    default:item.message,
			                    APNS:JSON.stringify({
			                      aps:{
			                        alert:item.message,
			                        sound:(item.sound)?'/www/dist/sounds/'+item.sound:'default',
			                        badge:item.count
			                      },
			                      messagedata:(item.messagedata)?item.messagedata:false,
			                      intent:item.intent
			                    }),
			                    APNS_SANDBOX:JSON.stringify({
			                      aps:{
			                        alert:item.message,
			                        sound:(item.sound)?'/www/dist/sounds/'+item.sound:'default',
			                        badge:item.count
			                      },
			                      messagedata:(item.messagedata)?item.messagedata:false,
			                      intent:item.intent
			                    }),
			                    GCM:JSON.stringify({
			                      data:{
			                        message:item.message,
			                        messagedata:(item.messagedata)?item.messagedata:false,
			                        title:title,
			                        intent:item.intent,
			                        android_channel_id: android_channel_name,
			                        soundname:(item.sound)?item.sound.replace('.mp3',''):'',
			                        notId:parseInt(Math.random()*50000,10)//unique identifier for android....
			                      }
			                    })
			                }),
			                MessageStructure:'json',
			                TopicArn:item.topic
			            };
			            tools.log(JSON.stringify(topts),1);
					}else{//individual
						switch(item.device.type){
							case 'ios':
							//console.log(JSON.stringify(item.device));
								if(item.device.version&&item.device.version==2){
									var messagedata=(item.messagedata)?item.messagedata:{};
									messagedata.title=item.title;
									messagedata.message=item.message;
									messagedata.badge=item.count;
									var topts={
						                Message:JSON.stringify({
						                    APNS_VOIP:JSON.stringify({
						                    	aps:{
						                        	alert:item.message,
						                        	badge:item.count,
						                        	'content-available': 1
						                      	},
						                      	category:(item.category)?item.category:'',
						                      	messagedata:messagedata
						                    })
						                }),
						                MessageStructure:'json',
						                TargetArn:item.device.arn
						            };
								}else if(item.device.sandbox){
									var topts={
						                Message:JSON.stringify({
						                    default:item.message,
						                    APNS_SANDBOX:JSON.stringify({
						                      aps:{
						                        alert:{
						                        	title:title,
						                        	body:item.message
						                        },
						                        category:(item.category)?item.category:'',
						                        // title:title,
						                        // body:item.message,
						                        sound:(item.sound)?'/www/dist/sounds/'+item.sound:'default',
						                        badge:item.count
						                      },
						                      notId:item.notId,
						                      messagedata:(item.messagedata)?item.messagedata:false,
						                      intent:item.intent
						                    }),
						                }),
						                MessageStructure:'json',
						                TargetArn:item.device.arn
						            };
						            console.log('====> Send sandbox notification!');
								}else{
									var topts={
						                Message:JSON.stringify({
						                    default:item.message,
						                    APNS:JSON.stringify({
						                      aps:{
						                        alert:{
						                        	title:title,
						                        	body:item.message
						                        },
						                        category:(item.category)?item.category:'',
						                        // title:title,
						                        // body:item.message,
						                        sound:(item.sound)?'/www/dist/sounds/'+item.sound:'default',
						                        badge:item.count
						                      },
						                      notId:item.notId,
						                      messagedata:(item.messagedata)?item.messagedata:false,
						                      intent:item.intent
						                    }),
						                }),
						                MessageStructure:'json',
						                TargetArn:item.device.arn
						            };
						            //console.log(JSON.stringify(topts));
						        }
							break;
							case 'android':
								if(item.device.version&&item.device.version==2){
									var messagedata=(item.messagedata)?item.messagedata:{};
									messagedata.title=item.title;
									messagedata.message=item.message;
									messagedata.badge=item.count;
									var topts={
						                Message:JSON.stringify({
						                    //default:item.message,
						                    GCM:JSON.stringify({
						                      data:{
						                      	android_channel_id: android_channel_name,
						                        //message:item.message,
						                        messagedata:messagedata,
						                        //title:title,
						                        //badge:item.count,
						                        intent:item.intent,
						                        "content-available": "1",
						                        "force-start":"1",
						                        soundname:(item.sound)?item.sound.replace('.mp3',''):'',
						                        notId:parseInt(Math.random()*50000,10)//unique identifier for android....
						                      }
						                    })
						                }),
						                MessageStructure:'json',
						                TargetArn:item.device.arn
						            };
								}else{
									var data={
				                      	android_channel_id: android_channel_name,
				                        message:item.message,
				                        messagedata:(item.messagedata)?item.messagedata:false,
				                        title:title,
				                        call:'',
				                        badge:item.count,
				                        intent:item.intent,
				                        soundname:(item.sound)?item.sound.replace('.mp3',''):'',
				                        notId:parseInt(Math.random()*50000,10)//unique identifier for android....
				                      }
				                      if(item.messagedata&&item.messagedata.action&&item.messagedata.action=='call'){
				                      	data["content-available"]="1";
				                      	data["force-start"]="1";
				                      	data['call']=1;
				                      	if(data.message) delete data.message;
				                      	if(data.title) delete data.title;
				                      	if(data.badge) delete data.badge;
				                      }
				                      // console.log(JSON.stringify(data));
				                      // console.log(JSON.stringify(item));
				                      var sd={
						                    default:item.message,
						                    GCM:JSON.stringify({
						                      data:data
						                    })
						                }
						                if(item.messagedata&&item.messagedata.action&&item.messagedata.action=='call'){
						                	delete sd.default
						                }
									var topts={
						                Message:JSON.stringify(sd),
						                MessageStructure:'json',
						                TargetArn:item.device.arn
						            };
						        }
							break;
						}
					}
					//console.log(JSON.stringify(topts));
		            return topts;
				}else{//invalid!
					return false;
				}
			},
			send:function(obj,badgeCount){
				var self=notifier;
				var item=obj.item;
				//check time
				var opts=self.push.getOpts(item.opts,badgeCount);
				if(!opts){
					tools.log('Invalid Push ['+JSON.stringify(item)+']',1);
					self.updateNotice(item._id,{$set:{status:-1,resp:{err:'Invalid Push'}}},obj.onDone);
				}else{
					sns.publish(opts,function(err,data){
						if(err){
							if(err.message=='EndpointDisabled: Endpoint is disabled'){
								tools.log('Resetting Endpoint for ['+opts.TargetArn+']',1);
								sns.setEndpointAttributes({
								  	Attributes: { /* required */
								    	'Enabled': 'true'
								  	},
								  	EndpointArn: opts.TargetArn /* required */
								}, function(err, data) {
								  	if(err){
								  		tools.log('Error Reseting Endpoint ['+err+']',1);
								  	}else{//retry
								  		tools.log('Successfully Reset Endpoint, retrying',1);
								  		sns.publish(opts,function(err,data){
								  			if(err){
								  				tools.log('Error sending after retry...',1);
								  				self.updateNotice(item._id,{$set:{status:-1,resp:{err:err}}},obj.onDone);
								  			}else{
								  				tools.log('Successfully Sent with Retry!',1);
								  				self.updateNotice(item._id,{$set:{status:1,resp:data}},obj.onDone);
								  			}
								  		});
								  	}
								});
							}else if(err.code=='PlatformApplicationDisabled'){
								tools.alertAdmin('ios Certificate is no longer valid!  Fix IMMEDEIATELY!!!!');
								self.updateNotice(item._id,{$set:{status:-1,resp:{err:err}}},obj.onDone);
							}else{
								tools.log('Error Push ['+err+']',1);
								self.updateNotice(item._id,{$set:{status:-1,resp:{err:err}}},obj.onDone);
							}
						}else{
							self.updateNotice(item._id,{$set:{status:1,resp:data}},obj.onDone);
						}
					});
				}
			}
		},
		email:{
			add:function(item){
				var self=notifier;
				self.emailqueue.push(item);
			},
			updateCampaign:function(item,cb){
				if(item.cid){
					db.email_campaign.updateOne({id:item.cid},{$inc:{sent:1}},function(){
						cb();
					});
				}else cb();
			},
			send:function(obj){
				var self=notifier;
				var item=obj.item;
				if(item.raw){
					tools.log('Sending RAW Email ['+item._id+']',1);
					ses.sendRawEmail(item.opts,function(err,data){
						if(err){
							console.log(err);
							self.updateNotice(item._id,{$set:{status:-1,resp:{err:err}}},obj.onDone);
						}else{
							self.email.updateCampaign(item,function(){
								self.updateNotice(item._id,{$set:{status:1,resp:data}},obj.onDone);
							})
						}
					})
				}else{
					tools.log('Sending Email ['+item._id+']',1);
					ses.sendEmail(item.opts,function(err,data){
						if(err){
							self.updateNotice(item._id,{$set:{status:-1,resp:{err:err}}},obj.onDone);
						}else{
							self.email.updateCampaign(item,function(){
								self.updateNotice(item._id,{$set:{status:1,resp:data}},obj.onDone);
							})
						}
					})
				}
			}
		},
	}
	notifier.init();//initalize!
});