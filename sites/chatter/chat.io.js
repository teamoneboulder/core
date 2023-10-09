var VERSION='1.1';
var fs = require( 'fs' );
var app = require('express')();
var bodyParser = require('body-parser')
var https        = require('https');
var tools=require('../../node/tools.js');
var url = require('url');
var os = require('os');
//const RTCMultiConnectionServer = require('rtcmulticonnection-server');
var ifaces = os.networkInterfaces();
var ipaddress='';
Object.keys(ifaces).forEach(function (ifname) {
  ifaces[ifname].forEach(function (iface) {
    if(ifname=='eth0'){
    	ipaddress=iface.address;
    }
  });
});
console.log('Starting Chat.io.js version '+VERSION);
tools.init();
tools.service.start('chat.io.js');
var server = https.createServer({
    key: fs.readFileSync('/var/www/priv/api.'+tools.settings.domain+'/fullchain.pem'),
    cert: fs.readFileSync('/var/www/priv/api.'+tools.settings.domain+'/comb.pem'),
    ca: '',
    requestCert: false,
    rejectUnauthorized: false
},app);
//for now, local but eventually stwitch to redis
var data={};
var sockets={};
var io = require('socket.io')(server);
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
// parse application/json
app.use(bodyParser.json());
tools.db.init(tools.conf.dbname,['user_devices','chat','user','chat_flag','media','test','token','blocked_list'],function(db){
	function auth(req,cb){
		if(req.token==tools.settings.admin_token){
			cb({uid:'admin'});
		}else if(req.token){
			db.token.findOne({id:req.token},function(err,data){
				if(data){
					//if(data.appid==req.appid){
						cb(data);
					// }else{
					// 	cb({error:'invalid_auth_appid'});
					// }
				}else{
					cb({error:'invalid_auth'});
				}
			})
		}else{
			cb({error:'invalid_auth'});
		}
	}
	function saveMessage(msg){
		console.log('===> save message');
		var temp={
    		from:msg.from,
    		user:msg.user,
    		reply:msg.reply,
    		module:msg.module,
    		endpoint:msg.endpoint,
    		endpoint_module:msg.endpoint_module,
    		special:msg.special,
    		tempid:msg.tempid,
    		attachment:msg.attachment,
    		token:msg.token,
    		appid:msg.appid,
    		attachment_data:(msg.attachment&&msg.attachment.data)?msg.attachment.data:false
    	}
    	if(msg.room.indexOf('_')>=0){
    		var parts=msg.room.split('_');
    		if(parts[0]==msg.by){
    			temp.to=parts[1];
    		}else{
    			temp.to=parts[0];
    		}
    	}
    	if(msg.media){
    		temp.media=JSON.parse(JSON.stringify(msg.media));
    	}
    	// var from=msg.from;
    	// var user=msg.user;
    	// var tempid=msg.tempid;
    	// var tmodule=msg.module;
    	// var special=msg.special;
    	delete msg.from;
    	delete msg.user;
    	if(msg.attachment&&msg.attachment.data) delete msg.attachment.data;
    	if(msg.special) delete msg.special;
    	if(msg.module) delete msg.module;
    	if(msg.endpoint) delete msg.endpoint;
    	if(msg.endpoint_module) delete msg.endpoint_module;
    	if(msg.tempid) delete msg.tempid;
    	ensureNotBlocked(db,msg,temp,function(msg){
    		if(msg){
		    	processMedia(msg,function(msg){
		    		processTransaction(msg,function(success){
		    			if(success){
			    			if(msg.token) delete msg.token;
				    		if(msg.appid) delete msg.appid;
				    		msg.tsu=new Date();
				    		if(msg._id){
								var id=msg._id;
								delete msg._id;
								db.chat.updateOne({_id:tools.db.toId(id)},{$set:msg},function(err,resp){
									msg._id=id;
									processMessage(msg,temp,err,resp,1);
								});
							}else{
								db.chat.insertOne(msg,function(err,resp){
									if(err) console.log(err);
									processMessage(msg,temp,err,resp);
								});
							}
						}else{//handle response in chat!

						}
			    	})
		    	})
		    }else{

		    }
	    });
	}
	function ensureNotBlocked(db,msg,temp,cb){
		//check the to
		db.blocked_list.findOne({id:temp.to},function(err,data){
			if(data&&data.blocked&&data.blocked.length&&data.blocked.indexOf(msg.by)>=0){
				tools.dblog('CHAT: user ['+temp.to+'] blocked ['+msg.by+']!!!');
				cb(false);
			}else{
				cb(msg);
			}
		})
	}
	function processTransaction(msg,cb){
		if(msg.amount){
			var url='https://'+tools.settings.api+'/one_core/user/bank/transaction/send';
	    	var send={
	    		id:msg.room,
	    		from:msg.by,
	    		to:msg.to,
	    		amount:msg.amount,
	    		token:msg.token,
	    		appid:msg.appid
	    	}
	    	tools.post(url,send,false,true,function(resp,err){//callback!
	    		console.log(resp);
	    		if(resp.error){
	    			tools.dblog('!!!!error bridging payment!!!!! to ['+url+'] '+JSON.stringify(resp)+' '+err);
	    			cb(false);
	    		}else{
	    			cb(true);
	    		}
	    	});
		}else{
			cb(true);
		}
	}
	function processMedia(msg,cb){
		if(msg.reply&&msg.reply.user){
			msg.reply={
				id:msg.reply.user.id
			}
			if(msg.reply.id[0]=='U') msg.reply.type='user';
			else msg.reply.type='page';
		}
		if(msg.media&&msg.media.type){
			if(msg.media.type=='images'){
				var data=msg.media.data;
				var updates=[];
				var ids=[];
				for (var i = 0; i < data.order.length; i++) {
					var item=data.list[data.order[i]];
					var id=tools.db.getId(item,'images');
					var update={updateOne:{filter:{id:id},update:{$set:{id:id,type:'images',room:msg.room,data:item}},upsert:true}};
					updates.push(update);
					ids.push(id);
				}
				db.media.bulkWrite(updates,function(err,resp){
					msg.media.data=ids;
					cb(msg);//no need to do anything
				})
				//bulk update!
			}else if(msg.media.type=='link'){
				msg.media.data=tools.db.getId(msg.media.data,'link');
				cb(msg);//no need to do anything
			}else{
				tools.dblog('Invaid media type ['+msg.media.type+'] in chat message');
				cb(msg);//no need to do anything
			}
		}else{
			cb(msg);//no need to do anything
		}
	}
	function finish(msg,temp,comment_id,st){
		msg._id=comment_id;
		msg.from=temp.from;
		msg.user=temp.user;
		msg.tempid=temp.tempid;
		if(temp.reply) msg.reply=temp.reply;
		if(temp.media) msg.media=temp.media;
		if(temp.attachment) msg.attachment=temp.attachment;
		if(temp.attachment_data) msg.attachment.data=temp.attachment_data;
		msg.type='message';
		var endtime=new Date().getTime();
		var diff=(endtime-st)/1000;
		if(diff>.5){//taking too long!
			tools.dblog('Message Processing ['+diff.toFixed(4)+'] seconds');
		}
		io.emit(msg.room, msg);//only send message to that room after notification counts are updated!
	}
	function processMessage(msg,temp,err,resp,edited){
		if(!err){
			if(msg.parent){//update TSU of parent!
				db.chat.updateOne({_id:tools.db.toId(msg.parent)},{
					$set:{
						tsu:new Date()
					},
					$addToSet:{
						notify:msg.by
					}
				});
			}
			db.chat_flag.insertOne({id:temp.tempid});
			var st=new Date().getTime();
			var comment_id=(edited)?msg._id:resp.ops[0]._id.toString();
			if(temp.module){
				if(!edited){
					var modulename=(temp.endpoint_module)?temp.endpoint_module:'comment';
					if(!temp.endpoint){
						var url='https://'+tools.settings.api+'/one_core/module/'+modulename+'/newcomment';
			    	}else{
			    		var url='https://'+tools.settings.api+'/one_core/module/'+modulename+'/'+temp.endpoint;
			    	}
			    	var send={
			    		id:msg.room,
			    		comment_id:comment_id,
			    		from:msg.by,
			    		module:temp.module,
			    		token:temp.token,
			    		appid:temp.appid
			    	}
			    	//console.log(temp)
			    	if(temp.special) send.special=temp.special;
			    	tools.post(url,send,false,true,function(resp,err){//callback!
			    		finish(msg,temp,comment_id,st);
			    		if(resp.error) tools.dblog('error bridging newcomment to ['+url+'] '+JSON.stringify(resp)+' '+err);
			    	});
			    }else{
			    	finish(msg,temp,comment_id,st);
			    }
		    }else{
		    	finish(msg,temp,comment_id,st);
		    }
		 //    msg._id=comment_id;
			// msg.from=temp.from;
			// msg.user=temp.user;
			// msg.tempid=temp.tempid;
			// msg.type='message';
			// io.emit(msg.room, msg);//only send message to that room!
		}else{
			console.log('error saving '+JSON.stringify(msg)+' '+JSON.stringify(err))
			tools.dblog('error saving '+JSON.stringify(msg));
		}
	}
	app.get('/', function(req, res){
		res.sendFile(__dirname + '/chat.html');
	});
	app.post('/bridge', function(req, res){
		if(req.body.user&&(req.body.channel=='relay'||req.body.channel=='relay_web'||req.body.channel=='badge')&&req.body.data){//relay specific
			db.user_devices.findOne({'id':req.body.user},function(err,data){//need to hanlde multiple devices...
				if(data){
					for(var device_id in data.devices){
						//assume its this server for now
						var device=data.devices[device_id];
						if(device.ip==ipaddress){//same server!
							var socket=sockets[device_id];
							console.log('emit message to ['+req.body.user+'] ['+req.body.channel+'] ['+device_id+']')
							if(socket){
								socket.emit(req.body.channel,req.body.data);
							}else{
								//auto close socket!
								console.log('invalid Socket! Auto closing!');
								tools.dblog('invalid Socket! Auto closing!!! chat.io.js')
								var unset={}
								unset['$unset']={};
								unset['$unset']['devices.'+device_id]=1;
								db.user_devices.updateOne({'id':req.body.user},unset);
							}
						}else{
							console.log('forward to proper server!');
							tools.dblog('forward to proper server!!!! chat.io.js')
						}
					}
				}else{
					console.log('socket not found!');
				}
			})
			res.send(JSON.stringify({success:true}));
		}else if(req.body.channel&&req.body.data){
			io.emit(req.body.channel,req.body.data);
			res.send(JSON.stringify({success:true}));
		}else{
			console.log(req.body);//invalid, show whats up
			console.log(req.body.channel)
			console.log(req.body.data)
			res.send(JSON.stringify({error:'invalid_data'}));
		}
	});
	app.get('/healthcheck', function(req, res){
		res.send(JSON.stringify({success:true}));
	});
	io.on('connection', function(socket){
		// RTCMultiConnectionServer.addSocket(socket,{ config: {
		// 	"socketURL": "/",
		//   "dirPath": "",
		//   "homePage": "/demos/index.html",
		//   "socketMessageEvent": "RTCMultiConnection-Message",
		//   "socketCustomEvent": "RTCMultiConnection-Custom-Message",
		//   "port": "9001",
		//   "enableLogs": "false",
		//   "autoRebootServerOnFailure": "false",
		//   "isUseHTTPs": "false",
		//   "sslKey": "/var/www/priv/api.phijs.earth/fullchain.pem",
		//   "sslCert": "/var/www/priv/api.phijs.earth/comb.pem",
		//   "sslCabundle": "",
		//   "enableAdmin": "false"
		// }});
		var user=socket.handshake.query.user;
		var device=socket.handshake.query.device;
		sockets[device]=socket;
	  console.log('['+user+'] connected');
	  var key='devices.'+device;
	  var deviceobj={ip:ipaddress};
	  var update={};
	  update['$set']={};
	  update['$set'][key]=deviceobj;
	  db.user_devices.updateOne({id:user},update,{upsert:true});
	  socket.on('typestart',function(msg){
	  	if(msg.room){
	  		io.emit(msg.room, msg);//only send message to that room!
	  	}
	  })
	  socket.on('typestop',function(msg){
	  	if(msg.room){
	  		io.emit(msg.room, msg);//only send message to that room!
	  	}
	  })
	  socket.on('message', function(msg){
	    if(msg.room){
	    	//save it and "emit" a complete chat item...
	    	//only allow save once!
	    	db.chat_flag.count({id:msg.tempid},function(err,count){
		  	//console.log('message',count)
	    		if(!count){
	    			//auth
	    			auth(msg,function(auth){
	    				//console.log(auth);
	    				if(auth.error){
	    					//emit back to this socket that there was an error
	    					//io.emit(msg.room, msg);
	    					tools.dblog('Invalid Auth saving chat ['+JSON.stringify(msg)+']',function(){

	    					});
	    				}else{
	    					saveMessage(msg);
	    				}
	    			});
	    			// db.chat.save(msg,function(err,resp){
			    	// 	//add in user info!
			    		
			    	// })
	    		}else{
	    			tools.dblog('already saved! '+JSON.stringify(msg));
	    		}
	    	})
	    }
	  });
	  socket.on('disconnect', function(){
	    console.log('['+user+'] disconnected');
	    var key='devices.'+device;
	    var update={};
	  	update['$unset']={};
	  	update['$unset'][key]=1
	    db.user_devices.updateOne({id:user},update);
	  });
	  socket.on('end', function (){
		    socket.disconnect(0);
		});
	});
	server.listen(3334, function(){
	  console.log('listening on *:3334');
	});
})