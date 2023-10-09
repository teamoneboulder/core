var tools = require('./tools.js');
var async = require('async');
 
//settings
var MAX_BUILD=10;//limit is size of broadcast......
var MAX_BUILD=10;//limit is size of broadcast......

tools.init();
tools.db.init(tools.conf.project,['post','chat','user','device','notice','notice_queue','user_notice'],function(db){
	var noticebuilder={
		version:'1',
		delay:1000,//check every second
		init:function(){
			var self=this;
			tools.log('Initializing Build Notice Version ['+self.version+']',1);
			self.initQueues();
			self.loadNotices();
		},
		initQueues:function(){
			var self=this;
			self.buildqueue = async.queue(function (item, fin) {
				self.processNotice(item,fin);
			},MAX_BUILD);
			self.buildqueue.drain = function() {
				tools.log('Done Processing Build Queue',1);
				self.queueNext();
			}
			self.messagequeue = async.queue(function (item, fin) {
				self.processMessage(item,fin);
			},MAX_BUILD);
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
			db.notice_queue.find({status:{$exists:false}},{},function(err,notices){
				var c=0;
				notices.count(function(err,count){
					if(count){
						notices.forEach(function(notice,index){
							self.buildqueue.push(notice);
						})
					}else{
						self.queueNext();
					}
				})
			})
		},
		updateNotice:function(id,update,onDone){
			var self=this;
			//tools.log('update ['+id+']',1);
			db.notice_queue.update({_id:id},update,function(){
				self.onDone(onDone);
			})
		},
		onDone:function(onDone){
			for (var i = onDone.length - 1; i >= 0; i--) {//clear in reverse!
				onDone[i]();
			};
		},
		processMessage:function(item,done){
			switch(item.type){
				case 'comment_on_post':
					var message=item.data.from.name + ' commented on your post.';
					var sendopts={
						message:message,
						title:'Nectar',
						messagedata:
					}
					var save={
						to:,
						from:,
						data:
					}
					db.user_notice.save(save);
					db.device.find({uid:item.to},{},function(err,devices){
						if(err) return done();
						devices.count(function(err,count){
							if(count){
								devices.forEach(function(notice,index){
									
								})
							}else{
								done();
							}
						})
					});
				break;
				case 'comment_on_post_follow':
				break;
			}
			// $sendopts=array(
			// 			'message'=>$message,
			// 			'title'=>$title,
			// 			'messagedata'=>$data,
			// 			'intent'=>$intent,
			// 			'sound'=>$sound,
			// 			'count'=>$count,
			// 			'device'=>array(
			// 				'arn'=>$arn,
			// 				'type'=>(isset($device['a'])&&(int)$device['a'])?'android':'ios'
			// 			)
			// 		);
			// 		$tosave=array(
			// 			'type'=>'push',
			// 			'opts'=>$sendopts,
			// 			'ts'=>$ts
			// 		);
			// 		db2::save(phi::$conf['project'],'notice',$tosave);
		},
		processNotice:function(item,done){
			var self=this;
			//lets process some shit!
			switch(item.type){
				case 'comment_on_post':
					db.post.findOne({id:item.data.post_id},function(err,post){
						if(err){
							tools.dblog('couldnt find post ['+item.data.post_id+'] for buildnotice');
							self.updateNotice(item._id,{$set:{status:-1,resp:{err:'couldnt find post ['+item.data.post_id+']'}}},[done]);
						}else{
							//get from!
							db.user.findOne({id:item.from},function(err,from){
								if(err){
									tools.dblog('couldnt find from ['+item.from+'] for buildnotice');
									self.updateNotice(item._id,{$set:{status:-1,resp:{err:'couldnt find from ['+item.from+']'}}},[done]);
								}else{
									item.data.post=post;
									item.data.from=from;
									//build message for post creator!
									self.messagequeue.push(item);
									//build message post followers
									if(post.followers&&post.followers.length){
										item.type='comment_on_post_follow';
										self.messagequeue.push(item);
									}
									//include tags! ... eventually
									self.updateNotice(item._id,{$set:{status:1,resp:{message:'Processing!'}}},[done]);
								}
							});
						}
					})
				break;
				default:
					tools.dblog('invalid type ['+item.type+'] for buildnotice');
					self.updateNotice(item._id,{$set:{status:-1,resp:{err:'invalid type ['+item.type+']'}}},[done]);
				break;
			}
		}
	}
	noticebuilder.init();//initalize!
})