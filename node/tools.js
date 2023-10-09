module.exports = {
	vars:{},
	dbs:{},
	aws_modules:{},
	version:function(){
		return 1;
	},
	init:function(){
		var self=this;
		this.http=require('http');
		this.https=require('https');
		this.request=require('request');
		this.qs=require('qs');
		this.cheerio = require('cheerio');
		this.url=require('url');
		this.extend=require('node.extend')
		this.json5=require('json5');
		self.crypto = require('crypto');
		this.ENV=this.parseEnv();
		self.loadSettings();
		self.aes.load();
		this.settings=this.parseSettings(this.ENV);
	},
	localIp:function(cb){
		var self=this;
		if(self.localip) return cb(self.localip);
		self.get('http://169.254.169.254/latest/meta-data/local-ipv4',function(data){
			self.localip=data;
			cb(data);
		})
	},
	getUniqueNumber:function(length){
		var c=0;
		var str='';
		while(c<length){
			var n=Math.floor(Math.random()*10);
			str+=n;
			c++;
		}
		return str;
	},
	service:{
		start:function(service){
			var self=this;
			self.healthCheck(service);
			setInterval(function(){
				self.healthCheck(service);
			},60000)
		},
		healthCheck:function(service,cb){
			module.exports.db.connect(module.exports.conf.dbname,'service_history',function(coll){
				module.exports.localIp(function(local_ip){
					var data={
						service:service,
						ip:local_ip
					}
					coll.insertOne(data,function(e){
						if(cb) cb();
					})
				})
			})
		}
	},
	opentok:{
		init:function(){
			var self=this;
			self.module=require('opentok');
			var conf=module.exports.conf.opentok;
			if(conf) self.opentok = new self.module(conf.key, conf.secret);
		},
		createSession:function(opts,cb){
			var self=this;
			self.opentok.createSession(opts,cb);
		},
		getToken:function(sessionId){
			var self=this;
			return self.opentok.generateToken(sessionId);
		}
	},
	aes:{
		algorithm:'AES-256-CBC',
		key_info:{},
		load:function(){
			var self=this;
			var content=module.exports.getFile('/var/www/priv/aes_key');
			if(!content){
				console.log('Warning, this environment does not have an AES key');
				return false;
			}
			var tp=content.split(/\r?\n/);
			for (var i = 0; i < tp.length; i++) {
				var item=tp[i];
				var ip=item.split('=');
				if(ip[0]) self.key_info[ip[0].trim()]=ip[1];
			}
		},
		encrypt:function(content){
			var self=this;
			var cipher = module.exports.crypto.createCipheriv(self.algorithm,self.key_info.iv,self.key_info.salt);
		  	var crypted = cipher.update(content,'utf8','hex')
		  	crypted += cipher.final('hex');
		  	return crypted;
		},
		decrypt:function(content){
			var self=this;
			var decipher = module.exports.crypto.createDecipheriv(self.algorithm,self.key_info.iv,self.key_info.salt);
			decipher.setAutoPadding(false);
			var dec = decipher.update(content,'hex', 'utf8')
			dec += decipher.final('utf8');
			return dec.replace(/\0[\s\S]*$/g,'');
		}
	},
	parseTemplate:function(tpl,data){
		for (var key in data) {
			var value=data[key];
			tpl=tpl.replace(new RegExp('{'+key+'}', 'g'),value);
		};
		return tpl;
	},
	isJson:function(str){
	    try {
	        JSON.parse(str.toString());
	    } catch (e) {
	        return false;
	    }
	    return true;
   	},
	getId:function(str){
		var self=this;
		if(typeof str=='object') str=JSON.stringify(str);
		var hash = self.crypto.createHash('md5').update(str).digest('hex');
		var id='L'+hash.substring(0,10);
		return id;
	},
	getId2:function(str,prefix,length){
		var self=this;
		str=JSON.stringify(str);
		var hash = self.crypto.createHash('md5').update(str).digest('hex');
		var id=prefix+hash.substring(0,length);
		return id;
	},
	logTime:function(){
		var now=Date.now();
		if(this.settings.tzoffset) now=now+this.settings.tzoffset;
		var d=new Date(now);
		var h=d.getHours();
		var m=d.getMinutes();
		var s=d.getMilliseconds();
		return h+':'+m+'.'+s;
	},
	ts:function(mts){
		if(mts){
			var ts= Date.now()+'';
			var mts=ts.substring(10,13);
			return parseInt(mts,10);
		}else return Math.floor(Date.now() / 1000);
	},
	parseSettings:function(env){
		var self=this;
		var settings={
			protocol:'https://',
			prod:self.conf.prod,
			isdev:(self.conf.prod)?0:1,
			prefix:env,
			api:'api.'+self.conf.domain,
			imgapi:'api.'+self.conf.domain+'/upload/image/submit',
			videoapi:'api.'+self.conf.domain+'/upload/video/submit',
			domain:self.conf.domain,
			admin_token:self.conf.admin_token,
			tzoffset:-(6*60*60*1000)//MDT
		}
		return settings;
	},
	getAWS:function(type){
		var self=this;
		if(!self.AWS){
			var AWS = require('aws-sdk');
			AWS.config.loadFromPath('/var/www/priv/aws.json');
			AWS.config.maxRetries=2;
			self.AWS=AWS;
		}
		if(type){
			if(!self.aws_modules[type]){
				switch(type){
					case 'ses':
						self.aws_modules[type]=new self.AWS.SES();
					break;
					case 'sns':
						self.aws_modules[type]=new self.AWS.SNS();
					break;
				}
			}
			return self.aws_modules[type];
		}else{
			return self.AWS;
		}
	},
	getSNSPlatform:function(app,type){
		var self=this;
		var ep=self.conf.aws.platform_endpoint;
		if(type=='ios') return ep+'APNS/'+app+'_'+type;
		if(type=='android') return ep+'GCM/'+app+'_'+type;
	},
	getArn:function(device){
		var self=this;
		if(device.app_identifier){
			if(device.arn){
				if(device.a){
					var platform=self.getSNSPlatform(device.app_identifier,'android');
				}else{
					var platform=self.getSNSPlatform(device.app_identifier,'ios');
				}
				return platform+'/'+device.arn;
			}else{
				self.dblog('Invalid ARN');
				return false;
			}
		}else{
			self.dblog('Invalid app_identifier');
			return false;
		}
		// if($device['app_identifier']){
		// 	if($device['arn']){
		// 		if(isset($device['a'])&&(int) $device['a']){
		// 			$platform=self::getSNSPlatform($device['app_identifier'],'android');
		// 		}else{
		// 			$platform=self::getSNSPlatform($device['app_identifier'],'ios');
		// 		}
		// 		$arn=$ep.$platform.'/'.$device['arn'];
		// 	}else{
		// 		$arn=false;
		// 		phi::log('no Arn');
		// 	}
		// }else{
		// 	phi::log('no Identifier');
		// }
	},
	getFriendId:function(id1,id2){
		var ids=[id1,id2];
		ids.sort();
		return ids.join('_');
	},
	random:function(max){
		var rn=Math.floor(Math.random(0)*max);
		var l=(max+'').length-1;
		return (rn+'').padStart(l,"0");
	},
	getTagId:function(tval){
	    var nval=tval.trim().replace(/ /g,'_').replace(/[^0-9a-z_ ]/gi, '').toLowerCase();
	    return nval;
	},
	db:{
		objectIdFromDate:function (date,norand) {
			if(norand) return Math.floor(date.getTime() / 1000).toString(16) + "0000000000000000";
			else return Math.floor(date.getTime() / 1000).toString(16) + module.exports.random(10000000000000000);
		},
		tsToTime:function(ts){
			var self=this;
			return self.mongo.Timestamp(ts);
		},
		idToTime:function(id){
			var self=this;
			return self.mongo.ObjectId(id).getTimestamp()
		},
		toId:function(str){
			var self=this;
			return self.mongo.ObjectId(str);
		},
		getId:function(data,type){
			if(type=='link'){
				return module.exports.getId(data.url);
			}else{
				return module.exports.getId2(data,'M',13);
			}
		},
		graph:function(db,data,conf,cb){
			var self=this;
			if(!data.order) return cb(false);
			var toget={};
			var confs={};
			for (var i = 0; i < data.order.length; i++) {
				var item=data.list[data.order[i]];
				for (var ti = 0; ti < conf.length; ti++) {
					var fieldconf=conf[ti];
					//console.log(fieldconf)
					if(typeof fieldconf.coll=='string'){
						var fd=module.exports.dotGet(fieldconf.field,item);
						if(!toget[fieldconf.coll]){
							toget[fieldconf.coll]={};
							toget[fieldconf.coll][fieldconf.match]={$in:[]}
						}
						toget[fieldconf.coll][fieldconf.match]['$in'].push(fd);
					}else{
						var coll=module.exports.dotGet(fieldconf.coll.type,item);
						console.log(coll)
						if(!toget[coll]){
							toget[coll]={};
							toget[coll]['id']={$in:[]}
						}
						toget[coll]['id']['$in'].push(module.exports.dotGet(fieldconf.coll.id,item));
						confs[coll]=fieldconf.opts[coll];
					}
				}
			}
			if(Object.keys(toget).length){
				var colls=Object.keys(toget);
				//make queue
				async = require('async');
				var resp={};
				var jobs={};
				for (var i = 0; i < colls.length; i++) {
					var coll=colls[i];
					var query=toget[coll]
					if(db[coll]){
						jobs[coll]=async.apply(function(tobj,fin){
							tobj.db[tobj.coll].find(tobj.query,function(err,data){
						    	if(!err){
							    	module.exports.db.toOrderedList(data,Object.keys(tobj.query)[0],function(td){
							    		if(td){
								    		if(tobj.conf&&tobj.conf.fields){
								    			for (var k in td.list) {
								    				td.list[k]=module.exports.keepFields(td.list[k],tobj.conf.fields);
								    			}
								    		}
								    	}
							    		fin(null,td);
							    	})
							    }else{
							    	fin(null,false);
							    }
						    })
						},{
							db:db,
							coll:coll,
							query:query,
							conf:confs[coll]
						})
					}else{
						module.exports.dblog('invalid collection in db graph ['+coll+']');
					}
				}
				module.exports.parallel(jobs,5,function(err,rdata){
					//return cb({rdata:rdata});
					for (var i = 0; i < data.order.length; i++) {
						var item=data.list[data.order[i]];
						for (var ti = 0; ti < conf.length; ti++) {
							var fieldconf=conf[ti];
							//console.log(fieldconf)
							if(typeof fieldconf.coll=='string'){
								var fd=module.exports.dotGet(fieldconf.field,item);
								if(!toget[fieldconf.coll]){
									toget[fieldconf.coll]={};
									toget[fieldconf.coll][fieldconf.match]={$in:[]}
								}
								if(rdata[fieldconf.coll]&&rdata[fieldconf.coll].list[fd]){
									module.exports.dotSet(fieldconf.to,rdata[fieldconf.coll].list[fd],data.list);	
								}
							}else{
								var coll=module.exports.dotGet(fieldconf.coll.type,item);
								var fd=module.exports.dotGet(fieldconf.coll.id,item);
								if(!toget[coll]){
									toget[coll]={};
									toget[coll]['id']={$in:[]}
								}
								if(rdata[coll]&&rdata[coll].list[fd]){
									module.exports.dotSet(fieldconf.to,rdata[coll].list[fd],item);	
								}
							}
						}
					}
					cb(data);
				});
			}else{
				cb(data);
			}
		},
		aggregate:function(coll,pipeline,cb){
			coll.aggregate(pipeline,cb);
		},
		connections:{},
		onReady:{},
		init:function(db,colls,cb){//initializes all connections to a database
			var self=this;
			self.mongo=require('mongodb');
			self.MongoClient = self.mongo.MongoClient;
			if(true){
				var uri = module.exports.conf.db[module.exports.conf.env].connection_string
			}else{//from mongo atlas
				var uri = "mongodb+srv://"+module.exports.conf.db[module.exports.conf.env].username+":"+module.exports.conf.db[module.exports.conf.env].password+"@"+module.exports.conf.db[module.exports.conf.env].connection_string.replace('mongodb+srv://','');
			}
			self.MongoClient.connect(uri,{useUnifiedTopology: true}, function(err, client){
				if(err) console.log(err);
				var con=client.db(db);
				var rdb={};
				for (var i = 0; i < colls.length; i++) {
					var coll=colls[i];
					rdb[coll]=con.collection(coll);
				}
				cb(rdb);
			});
		},
		toOrderedList:function(cdata,key,cb){
			cdata.count(function(err,count){
				//console.log('got ['+count+'] results');
				if(count){
					var i=0;
					var data={
						list:{},
						order:[]
					};
					cdata.forEach(function(item){
						if(item[key]){
							data.order.push(item[key]);
							data.list[item[key]]=item;
						}else{
							console.log('invalid key ['+key+']')
						}
						i++;
						if(i==count){
							cb(data);
						}
					});
				}else{
					cb(false);
				}
			});
		},
		toList:function(cdata,key,cb){
			cdata.count(function(err,count){
				if(count){
					var i=0;
					var data={};
					cdata.forEach(function(item){
						if(item[key]){
							data[item[key]]=item;
						}
						i++;
						if(i==count){
							cb(data);
						}
					});
				}else{
					cb(false);
				}
			});
		},
		atoOrderedList:function(data,keyon,filtermap){
			if(data&&data.length){
				var out={
					order:[],
					list:{}
				}
				for (var i = 0; i < data.length; i++) {
					var item=data[i];
					if(filtermap){
						for(var field in filtermap){
							if(item[field]){
								var keep=filtermap[field];
								if(keep==-1){
									delete item[field];
								}else{
									item[field]=module.exports.keepFields(item[field],keep);
								}
							}
						}
					}
					var tid='';;
					if(item[keyon]){
						if(keyon=='_id'){
							tid=item[keyon]+'';
						}else{
							tid=item[keyon];
						}
					}else{
						tid=item._id+'';
					}
					var last=tid;
					if(out.order.indexOf(tid)==-1) out.order.push(tid)
					out.list[tid]=item;
				}
				out.last=tid;
				return out;
			}else{
				return false;
			}
		},
		close:function(db){
			db.close();
		},
		connect:function(db,coll,cb){
			var self=this;
			self.mongo=require('mongodb');
			self.MongoClient = self.mongo.MongoClient;
			if(true){
				var uri = module.exports.conf.db[module.exports.conf.env].connection_string
			}else{
				var uri = "mongodb+srv://"+module.exports.conf.db[module.exports.conf.env].username+":"+module.exports.conf.db[module.exports.conf.env].password+"@"+module.exports.conf.db[module.exports.conf.env].connection_string.replace('mongodb+srv://','');
			}
			if(!self.connections[db+'_'+coll]){
				self.connections[db+'_'+coll]=1;
				self.MongoClient.connect(uri,{useUnifiedTopology: true}, function(err, client) {
					if(!err){
						var con=client.db(db);
						self.connections[db+'_'+coll]=con.collection(coll);
					   	cb(self.connections[db+'_'+coll]);
					   	if(self.onReady[db+'_'+coll]&&self.onReady[db+'_'+coll].length){
					   		for (var i = 0; i < self.onReady[db+'_'+coll].length; i++) {
					   			self.onReady[db+'_'+coll][i](self.connections[db+'_'+coll]);
					   		}
					   		self.onReady[db+'_'+coll]=[];//clear it out!
					   	}
				   }else{
				   		console.log('error connecting to ['+db+'] ['+coll+']...retrying');
				   		console.log(err);
				   		setTimeout(function(){
				   			return self.connect(db,coll,cb);
				   		},1000)
				   }
				});
			}else{
				if(self.connections[db+'_'+coll]===1){//waiting for connection!
					if(!self.onReady[db+'_'+coll]) self.onReady[db+'_'+coll]=[];
					self.onReady[db+'_'+coll].push(cb);
				}else{
					cb(self.connections[db+'_'+coll]);
				}
			}
		},
		batchRemove:function(db,coll,remove,cb){
			var batch = db[coll].initializeOrderedBulkOp();
		    for (var i = 0; i < remove.length; ++i) {
		    	var item=remove[i];
		      	batch.find(item).remove()
		    }
		    // Execute the operations
		    batch.execute(function(err, result) {
		      cb();
		    });
		},
		batchUpdate:function(db,coll,update,cb){
			var batch = db[coll].initializeOrderedBulkOp();
		    for (var i = 0; i < update.length; ++i) {
		    	var item=update[i];
		      	batch.find({id:item.id}).upsert().updateOne({$set:item});
		    }
		    // Execute the operations
		    batch.execute(function(err, result) {
		    	if(err){
		    		console.log(err);
		    	}
		      cb();
		    });
		},
		save:function(db,coll,item,cb){
			var self=this;
			self.connections[db+'_'+coll].insertOne(item,function(err){
				cb();
			})
		}
	},
	ksort:function(obj){
      var keys = Object.keys(obj).sort()
        , sortedObj = {};

      for(var i in keys) {
        sortedObj[keys[i]] = obj[keys[i]];
      }

      return sortedObj;
    },
	sendPush:function(uid,channel,data){
		var self=this;
		var send={
			user:uid,
			channel:channel,
			data:data
		}
		var url='https://api.'+self.settings.domain+':3334/bridge';
		self.post(url,send,false,1,function(resp){
			console.log('push response: '+JSON.stringify(resp))
		},1)
	},
	dotGet:function(key,obj){
        var keys=key.split('.');
        var last=obj;
        for (var i = 0; i < keys.length; i++) {
            var tkey=keys[i];
            if(last){
                if(last[tkey]){
                    last=last[tkey];
                }else{
                    last=false;
                }
            }
        }
        return last;
    },
    dotSet:function(key,set,obj){
    	var keys=key.split('.');
    	var last=obj;
    	for (var i = 0; i < keys.length; i++) {
    		var tkey=keys[i];
            if(last){
            	if(!keys[i+1]){
            		last[tkey]=set;
            	}else{
            		if(last[tkey]){
            			last=last[tkey];
            		}else{
            			last=false;
            		}
            	}
            }
    	}
    	return obj;
    },
	getAdmins:function(db,type,cb){
		cb({
			order:['UC9QP6XFW'],
			list:{
				"UC9QP6XFW":{}
			}
		})
	},
	emitHook:function(db,when,opts,cb){
		var self=this;
		opts.type='hook';
		opts.app=module.exports.conf.dbname;
		var save={
			id:self.getId(Math.random()+new Date().getTime()+''),
			opts:opts,
			ts:when
		}
		db.scheduled_jobs.insertOne(save,function(){
			if(cb) cb();
		});
	},
	flog:function(text,cb){
		var fs = require('fs');
		if(typeof text=='object') text=JSON.stringify(text);
		text+='\r\n';
		text='['+new Date().getTime()+'] '+text;
		var file='/var/log/groupup/node.log';
		fs.appendFile(file, text, function (err) {
			if(cb) cb();
		});
	},
	getTs:function(){
		return parseInt(Math.floor((new Date().getTime()/1000)),10);
	},
	getFile:function(path,json){
		var fs = require('fs');
		var isfile=fs.existsSync(path);
		if(!isfile) return false;
		var data=fs.readFileSync(path,'UTF8').toString();
		if(json) return JSON.parse(data);
		else return data;
	},
	getFileAsync:function(path,json,cb){
		// var data='';
		// var fs = require('fs');
		// var readStream = fs.createReadStream(path, 'utf8');
		// readStream.on('data', function(chunk) {
		// 	console.log('chunk!')
		//     data += chunk;
		// }).on('end', function(){
		// 	console.log('end!')
		// 	if(json){
		// 		data=JSON.parse(data);
		// 	}
		//     cb(data);
		// }).on('error',function(){
		// 	console.log('ERROR')
		// })
		var fs = require('fs');
		fs.readFile(path,{encoding: 'utf-8'},(err, data) => {
		  if (err) {
		    console.error(err)
		    return false;
		  }
		  console.log(data)
		  if(json){
		  	data=JSON.parse(data);
		  }
		  cb(data);
		})
	},
	loadSettings:function(){
		var self=this;
		var fs = require('fs');
		var path='/var/www/priv/config.json';
		self.conf=JSON.parse(fs.readFileSync(path).toString());
	},
	parseEnv:function(){
		var fs = require('fs');
		var path='/var/www/priv/config.json';
		var isfile=fs.existsSync(path);
		if(!isfile) return 'prod';
		var data = JSON.parse(fs.readFileSync(path).toString());
		return data.env;
	},
	dblog:function(msg,cb){
		var self=this;
		// if(!this.mongo) this.mongo=require('mongojs');
		// if(!this.dbs.prod) this.dbs.prod={db:this.mongo('prod'),colls:{}};
		// if(!this.dbs.prod.colls.log) this.dbs.prod.colls.log=this.dbs.prod.db.collection('log');
		self.db.connect(module.exports.conf.dbname,'log',function(coll){
			var obj={
				msg:msg,
				type:'node',
				ts:self.ts(),
				mts:self.ts(1)
			}
			coll.insertOne(obj,function(e){
				if(cb) cb();
			})
		})
	},
	alertAdmin:function(msg,cb){
		var self=this;
		var turl=this.settings.protocol+this.settings.api+'/one_core/alertadmin';
		turl+='?token='+self.settings.admin_token;
		turl+='&msg='+encodeURIComponent(msg);
		this.get(turl,function(data){
			try{
				var json=JSON.parse(data);
				if(cb) cb(json);
			}catch (err){
				self.log('ERROR');
				self.log(err)
				self.log(turl)
				if(cb) cb(false);
			}
		})//keepalive
	},
	log:function(msg,force){
		if(this.vars.debug||force) console.log('['+this.logTime()+'] '+msg);
	},
	setVar:function(key,value){
		this.vars[key]=value;
	},
	getVar:function(key){
		if(this.vars[key]) return this.vars[key];
		else return false;
	},
	ensureUrl:function(str){
		var str=this.decodeHTMLEntities(str);
		return str.replace(/\s/g,'-').replace(/--/g,'-').replace(/[^\w-]/gi, '').replace(/--/g,'-').toLowerCase();
	},
  	toUtf8: function(str){
  		var defaultDiacriticsRemovalap = [
		    {'base':'A', 'letters':'\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F'},
		    {'base':'AA','letters':'\uA732'},
		    {'base':'AE','letters':'\u00C6\u01FC\u01E2'},
		    {'base':'AO','letters':'\uA734'},
		    {'base':'AU','letters':'\uA736'},
		    {'base':'AV','letters':'\uA738\uA73A'},
		    {'base':'AY','letters':'\uA73C'},
		    {'base':'B', 'letters':'\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181'},
		    {'base':'C', 'letters':'\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E'},
		    {'base':'D', 'letters':'\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779'},
		    {'base':'DZ','letters':'\u01F1\u01C4'},
		    {'base':'Dz','letters':'\u01F2\u01C5'},
		    {'base':'E', 'letters':'\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E'},
		    {'base':'F', 'letters':'\u0046\u24BB\uFF26\u1E1E\u0191\uA77B'},
		    {'base':'G', 'letters':'\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E'},
		    {'base':'H', 'letters':'\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D'},
		    {'base':'I', 'letters':'\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197'},
		    {'base':'J', 'letters':'\u004A\u24BF\uFF2A\u0134\u0248'},
		    {'base':'K', 'letters':'\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2'},
		    {'base':'L', 'letters':'\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780'},
		    {'base':'LJ','letters':'\u01C7'},
		    {'base':'Lj','letters':'\u01C8'},
		    {'base':'M', 'letters':'\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C'},
		    {'base':'N', 'letters':'\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4'},
		    {'base':'NJ','letters':'\u01CA'},
		    {'base':'Nj','letters':'\u01CB'},
		    {'base':'O', 'letters':'\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C'},
		    {'base':'OI','letters':'\u01A2'},
		    {'base':'OO','letters':'\uA74E'},
		    {'base':'OU','letters':'\u0222'},
		    {'base':'OE','letters':'\u008C\u0152'},
		    {'base':'oe','letters':'\u009C\u0153'},
		    {'base':'P', 'letters':'\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754'},
		    {'base':'Q', 'letters':'\u0051\u24C6\uFF31\uA756\uA758\u024A'},
		    {'base':'R', 'letters':'\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782'},
		    {'base':'S', 'letters':'\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784'},
		    {'base':'T', 'letters':'\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786'},
		    {'base':'TZ','letters':'\uA728'},
		    {'base':'U', 'letters':'\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244'},
		    {'base':'V', 'letters':'\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245'},
		    {'base':'VY','letters':'\uA760'},
		    {'base':'W', 'letters':'\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72'},
		    {'base':'X', 'letters':'\u0058\u24CD\uFF38\u1E8A\u1E8C'},
		    {'base':'Y', 'letters':'\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE'},
		    {'base':'Z', 'letters':'\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762'},
		    {'base':'a', 'letters':'\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250'},
		    {'base':'aa','letters':'\uA733'},
		    {'base':'ae','letters':'\u00E6\u01FD\u01E3'},
		    {'base':'ao','letters':'\uA735'},
		    {'base':'au','letters':'\uA737'},
		    {'base':'av','letters':'\uA739\uA73B'},
		    {'base':'ay','letters':'\uA73D'},
		    {'base':'b', 'letters':'\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253'},
		    {'base':'c', 'letters':'\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184'},
		    {'base':'d', 'letters':'\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A'},
		    {'base':'dz','letters':'\u01F3\u01C6'},
		    {'base':'e', 'letters':'\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD'},
		    {'base':'f', 'letters':'\u0066\u24D5\uFF46\u1E1F\u0192\uA77C'},
		    {'base':'g', 'letters':'\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F'},
		    {'base':'h', 'letters':'\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265'},
		    {'base':'hv','letters':'\u0195'},
		    {'base':'i', 'letters':'\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131'},
		    {'base':'j', 'letters':'\u006A\u24D9\uFF4A\u0135\u01F0\u0249'},
		    {'base':'k', 'letters':'\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3'},
		    {'base':'l', 'letters':'\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747'},
		    {'base':'lj','letters':'\u01C9'},
		    {'base':'m', 'letters':'\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F'},
		    {'base':'n', 'letters':'\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5'},
		    {'base':'nj','letters':'\u01CC'},
		    {'base':'o', 'letters':'\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275'},
		    {'base':'oi','letters':'\u01A3'},
		    {'base':'ou','letters':'\u0223'},
		    {'base':'oo','letters':'\uA74F'},
		    {'base':'p','letters':'\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755'},
		    {'base':'q','letters':'\u0071\u24E0\uFF51\u024B\uA757\uA759'},
		    {'base':'r','letters':'\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783'},
		    {'base':'s','letters':'\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B'},
		    {'base':'t','letters':'\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787'},
		    {'base':'tz','letters':'\uA729'},
		    {'base':'u','letters': '\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289'},
		    {'base':'v','letters':'\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C'},
		    {'base':'vy','letters':'\uA761'},
		    {'base':'w','letters':'\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73'},
		    {'base':'x','letters':'\u0078\u24E7\uFF58\u1E8B\u1E8D'},
		    {'base':'y','letters':'\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF'},
		    {'base':'z','letters':'\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763'}
		];

		var diacriticsMap = {};
		for (var i=0; i < defaultDiacriticsRemovalap.length; i++){
		    var letters = defaultDiacriticsRemovalap[i].letters.split("");
		    for (var j=0; j < letters.length ; j++){
		        diacriticsMap[letters[j]] = defaultDiacriticsRemovalap[i].base;
		    }
		}
		return str.replace(/[^\u0000-\u007E]/g, function(a){ 
	       return diacriticsMap[a] || a; 
	    });
  	},
  	decodeHTMLEntities:function(text) {
	    var entities = [
	        ['apos', '\''],
	        ['amp', '&'],
	        ['lt', '<'],
	        ['gt', '>'],
	        ['quot', '"']
	    ];

	    for (var i = 0, max = entities.length; i < max; ++i) 
	        text = text.replace(new RegExp('&'+entities[i][0]+';', 'g'), entities[i][1]);

	    return text;
	},
	toURL:function(str){
		return this.ensureUrl(this.toUtf8(str));
	},
	isNumeric:function(n){
		return !isNaN(parseFloat(n)) && isFinite(n);
	},
	readFile:function(path,cb,returnfalse){
		var fs = require('fs')
		fs.readFile(path, 'utf8', function (err,data) {
		  if (err) {
		  	if(returnfalse) return false;
		  	else{
			    console.log(err);
			    process.exit(0);
			}
		  }
		  cb(data);
		});
	},
	saveFile:function(path,data,cb){
		var fs = require('fs');
		var self=this;
		fs.writeFile(path, data, function(err) {
		    if(err) {
		        self.log(err);
		    } else {
		        self.log("The file was saved!");
		    }
		    if(cb) cb();
		});
	},
	keepFields:function(obj,fields){
		if(!obj) return false;
		var out={};
		for (var i = 0; i < fields.length; i++) {
			var f=fields[i];
			if(obj[f]) out[f]=obj[f];
		}
		return out;
	},
	size:function(obj){
		if(typeof(obj) =='object'){
            if(Object.keys(obj).length) return Object.keys(obj).length;
            else return 0;
        }else if(typeof(obj) == 'array'){
            if(obj.length) return obj.length;
            else return 0;
        }else{
            //alert('invalid object!-'+typeof(obj));
            return 0;
        }
	},
	parseUrlToOptions:function(url,keepalive){
		var urlp=this.url.parse(url);
		var opts={
		  host: urlp.host,
		  port: urlp.port,
		  path: urlp.path
		}
		if(keepalive){
			if(!urlp.port||urlp.port==80){
				var Agent = require('agentkeepalive');
				var keepaliveAgent = new Agent({
				  maxSockets: 100,
				  maxFreeSockets: 10,
				  timeout: 30000,
				  keepAliveTimeout: 30000 // free socket keepalive for 30 seconds
				});
			}else{
				var HttpsAgent = require('agentkeepalive').HttpsAgent;
				var keepaliveAgent = new HttpsAgent({
				  maxSockets: 100,
				  maxFreeSockets: 10,
				  timeout: 30000,
				  keepAliveTimeout: 30000 // free socket keepalive for 30 seconds
				});
			}
			opts.agent=keepaliveAgent;
		}
		if(opts.host.indexOf(':')>=0){//remove port from host!
			var hp=opts.host.split(':')
			opts.host=hp[0];
		}
		return opts;
	},
	fixUrl:function(url,secure){
		if(url.indexOf('//')==0){
			url=url.replace('//',(secure)?'https://':'http://');
		}
		return url;
	},
	saveVideo:function(opts,fin){
		var self=this;
		var path='/video/';
		if(opts.id) path+=opts.id+'/';
		var turl=this.settings.protocol+this.settings.videoapi+'?url='+encodeURIComponent(opts.url)+'&path='+encodeURIComponent(path);
		if(opts.post) turl+='&post='+encodeURIComponent(JSON.stringify(opts.post));
		if(opts.force) turl+='&force=1';
		if(opts.preview) turl+='&preview=1';
		turl+='&token='+self.settings.admin_token;
		if(opts.force_uid) turl+='&force_uid='+opts.force_uid;
		console.log(turl);
		this.get(turl,function(data){
			try{
				var json=JSON.parse(data);
				fin(json);
			}catch (err){
				self.log('ERROR');
				self.log(err)
				self.log(turl)
				self.log(opts)
				self.log(data)
				if(!opts.retry) opts.retry=5;
				opts.retry--;
				if(opts.retry>1){
					self.log('Retrying');
					self.saveVideo(opts,fin);
				}else {
					fin(false);
					//self.log('failed too may times');
					//process.exit(0);
				}
			}
		})//keepalive
	},
	saveLink:function(opts,fin){
		var self=this;
		var turl=this.settings.protocol+this.settings.linkapi+'?url='+encodeURIComponent(opts.url);
		if(opts.force) turl+='&force=1';
		if(opts.preview) turl+='&preview=1';
		//console.log(turl);
		this.get(turl,function(data){
			try{
				var json=JSON.parse(data);
				fin(json);
			}catch (err){
				self.log('ERROR');
				self.log(err)
				self.log(turl)
				self.log(opts)
				self.log(data)
				if(!opts.retry) opts.retry=5;
				opts.retry--;
				if(opts.retry>1){
					self.log('Retrying');
					self.saveLink(opts,fin);
				}else {
					self.log('failed too may times');
					process.exit(0);
				}
			}
		})//keepalive
	},
	saveImage:function(opts,fin){
		var self=this;
		var path='/img/';
		if(opts.id) path+=opts.id+'/';
		var turl=this.settings.protocol+this.settings.imgapi+'?url='+encodeURIComponent(opts.img)+'&sizes='+encodeURIComponent(opts.sizes)+'&path='+encodeURIComponent(path);
		if(opts.force) turl+='&force=1';
		if(opts.preview) turl+='&preview=1';
		this.get(turl,function(data){
			try{
				var json=JSON.parse(data);
				fin(json);
			}catch (err){
				self.log('ERROR');
				self.log(err)
				self.log(turl)
				self.log(opts)
				self.log(data)
				if(!opts.retry) opts.retry=5;
				opts.retry--;
				if(opts.retry>1){
					self.log('Retrying');
					self.saveImage(opts,fin);
				}else {
					self.log('failed too may times');
					process.exit(0);
				}
			}
		})//keepalive
	},
	processImages:function(imgs,cb,ids){
		var replace={};
		var self=this;
		var topts=this.vars.imageopts;
		if(!self.imagedata) self.imagedata={};
		async = require('async');
		var c=0;
		var queue = async.queue(function (opts, fin) {
		    self.saveImage(opts,function(){
		    	c++;
		    	self.log('['+c+'/'+self.totalcount+'] Images Loaded');
		    	fin()
		    });
		}, 5);
		queue.drain = function() {
			//get relevant
			var map={};
			for (var i = 0; i < imgs.length; i++) {
				var img=imgs[i];
				var ti=self.fixUrl(img);
				if(self.imagedata[ti]){
					map[img]=self.imagedata[ti];
				}
			};
			cb(map);
		}
		var sizes=(topts.sizes)?topts.sizes:['small','full'];
		self.totalcount=0;
		for (var i = 0; i < imgs.length; i++) {
			var img=imgs[i];
			var ti=this.fixUrl(img);
			for (var mi = 0; mi < sizes.length; mi++) {
				var s=sizes[mi];
				self.totalcount++
				queue.push({
					id:(ids&&ids[c])?ids[c]:false,
					img:ti,
					size:s
				})
			};
		};
	},
	getBase64:function(data){
		return JSON.parse(new Buffer(data, 'base64').toString());
	},
	toBase64:function(obj){
		return new Buffer(JSON.stringify(obj)).toString('base64');
	},
	getJquery:function(content){
		var self=this;
		return self.cheerio.load(content);
	},
	fixContent:function(content,cb){
		var self=this;
	    var $ = self.cheerio.load(content);
	    var imgs=[];
	    $('img').each(function(){
	        var o=$(this);
	        imgs.push(o.attr('src'));
	    })
	    if(imgs.length){
	        self.processImages(imgs,function(map){
	            for(img in map){
	                var nimg=map[img];
	                img='src=\"'+img+'\"';
	                content=content.replace(img,'src="'+nimg+'"');
	            }
	            cb(content,map);
	        })
	    }else cb(content);
	},
	makeLinkUid:function(prefix,url){
		var self=this;
		if(!self.md5) self.md5=require('md5');
		return prefix+self.md5(url).substr(0,10);
	},
	scrape:function(url,cb,noimg){
		var self=this;
		var scrape_timeout=setTimeout(function(){
			delete scrape_timeout;
			self.flog('Timeout Error [25s] Processing ['+url+']',function(){
				cb(false);
			})
		},25000);//25 seconds to complete
	  	self.request({
	  		url:url,
	  		jar:true,
	  	}, function (err, response, body) {
	        if (err){
	        	//throw err;
	        	self.log('Skipping ['+url+']',1)
	        	cb(false);
	        	return false;
	        }
	        var $ = self.cheerio.load(body);
		 	var data={};
	        function getMetadata($){
	          var meta={};
	          $('meta').each(function(i,v){
	            var p=$(this).attr('property');
	            if(!p) p=$(this).attr('name');
	            var c=$(this).attr('content');
	            if(p&&c) meta[p]=c;
	          });
	          return meta;
	        }
	        function getTitle($,metadata){
	          //try fb first
	          var title=metadata['og:title'];
	          if(title) return title;
	          //then title tag
	          return $('title').text();
	          //then any other things that can be used
	        }
	        function getDescription($,metadata){
	          //try fb first
	          var description=metadata['og:description'];
	          if(description) return description;
	          //then title tag
	          var description=metadata['description'];
	          if(description) return description;
	          var description=metadata['keywords'];
	          if(description) return description;
	          return '';
	          //then any other things that can be used
	        }
	        function getImage($,metadata){
	          //try fb first
	          var image=metadata['og:image'];
	          if(image) return image;
	          //then any other things that can be used
	        }
	        function isValid(url){
	          if(!url) return false;
	          if(url.indexOf('https://')>=0||url.indexOf('http://')>=0||url.indexOf('//')===0) return 1;
	          else return 0;
	        }
	        function getImages($,metadata){
	          var images=[];
	          var max=20;
	          var c=0;
	          $('img').each(function(i,v){
	            var img=$(this).attr('src');
	            if(isValid(img)&&c<max){
	              if(images.indexOf(img)==-1) images.push(img);
	              c++;
	              }
	          })
	          return images;
	          //also try to get background images
	          //try fb first
	          //then title tag
	          //then any other things that can be used
	        }
	        var metadata=getMetadata($);
	        var title=getTitle($,metadata);
	        var images=getImages($,metadata);
	        var image=getImage($,metadata);
	        var description=getDescription($,metadata);
	        if(title) data.name=title;
	        if(description) data.caption=description;
	        if(images&&images.length) data.images=images;
	        //add in host
		    data.url=url;
		    if(noimg){//dont process images!
		    	if(data.images) delete data.images;
		    	cb(data);
			    return false;
		    }
	        if(image){
	        	data.img=image;
	        	//if this image passes size done need to look at the rest, would also be nice to trust their metadata
	        	self.ensureImages([image],function(images){
	        		if(images.length){//good!
	        			if(data.images) delete data.images;
	        			var opts={
	        				img:data.img,
	        				id:self.makeLinkUid('I',data.img),
	        				size:['thumb','display']
	        			}
	        			self.saveImage(opts,function(json){
	        				data.img=json;
        					if(scrape_timeout){
        						clearTimeout(scrape_timeout)
        						delete scrape_timeout;
        						cb(data)
        					}
	        			});
	        		}else{//check the rest!
	        			if(data.images){
					        if(data.images[0]&&!data.img) data.img=data.images[0];
					        if(data.images.length&&data.images.indexOf(data.img)==-1){
					          data.images.unshift(data.img);
					        }
					        if(data.images&&data.image&&data.images.indexOf(data.img)<0){
					          data.images.splice(data.images.indexOf(data.img),1);
					          data.images.unshift(data.img);
					        }
					    }
				        //check sizes of images
				        self.ensureImages(data.images,function(images){
				        	if(images){
						        data.images=images;
						        if(images.length) data.img=images[0]
						        else data.img='';
						    	delete data.images;
						    	if(data.img){
						    		var opts={
				        				img:data.img,
				        				id:self.makeLinkUid('I',data.img),
	        							size:['thumb','display']
				        			}
				        			self.saveImage(opts,function(json){
				        				data.img=json;
				        				if(scrape_timeout){
			        						clearTimeout(scrape_timeout)
			        						delete scrape_timeout;
			        						cb(data)
			        					}
				        			});
						    	}else{
						    		if(scrape_timeout){
		        						clearTimeout(scrape_timeout)
		        						delete scrape_timeout;
		        						cb(data)
		        					}
						    	}
							}else{
								if(scrape_timeout){
	        						clearTimeout(scrape_timeout)
	        						delete scrape_timeout;
	        						cb(data)
	        					}
							}
				        });
	        		}
	        	})
	        }else{
	        	if(data.images){
			        if(data.images[0]&&!data.img) data.img=data.images[0];
			        if(data.images.length&&data.images.indexOf(data.img)==-1){
			          data.images.unshift(data.img);
			        }
			        if(data.images&&data.image&&data.images.indexOf(data.img)<0){
			          data.images.splice(data.images.indexOf(data.img),1);
			          data.images.unshift(data.img);
			        }
			    }else{
			    	cb(data);
			    	return false;
			    }
		        //check sizes of images
		        self.ensureImages(data.images,function(images){
		        	if(images){
				        data.images=images;
				        if(images.length) data.img=images[0]
				        else data.img='';
				    	delete data.images;
				    	if(data.img){
				    		var opts={
		        				img:data.img,
		        				id:self.makeLinkUid('I',data.img),
    							size:['thumb','display']
		        			}
		        			self.saveImage(opts,function(json){
		        				data.img=json;
		        				if(scrape_timeout){
	        						clearTimeout(scrape_timeout)
	        						delete scrape_timeout;
	        						cb(data)
	        					}
		        			});
				    	}else{
				    		if(scrape_timeout){
        						clearTimeout(scrape_timeout)
        						delete scrape_timeout;
        						cb(data)
        					}
				    	}
					}else{
						if(scrape_timeout){
    						clearTimeout(scrape_timeout)
    						delete scrape_timeout;
    						cb(data)
    					}
					}
		        });
	        }
	 	});
	},
	getSchema:function(type){
		var self=this;
		if(!self.schema){
			self.schema=self.getFile('/var/www/one-core/_manage/schema.json',1);
		}
		if(self.schema[type]) return self.schema[type];
		return false;
	},
	parallel:function(tasks,limit,cb){
		var async= require('async');
		async.parallelLimit(tasks,limit,function(err,data){
			var toreturn={};
			if(tasks.length){//array
				for (var i = 0; i < data.length; i++) {
					var d=data[i];
					for(var key in d){
						toreturn[key]=d[key];
					}
				}
			}else{
				toreturn=data;
			}
			cb(err,toreturn);
		});
	},
	ensureImages:function(images,cb){
		var self=this;
		if(!images){
			cb(images);
			return false;
		}
		var async= require('async');
		//self.vars.debug=1;
		var MAX_QUEUE=2;//could compound as multiple scrapes are happening at the same time
		var valid_images=[];
		var imgqueue = async.queue(function (item, fin) {
			if(item.img.indexOf('.gif')>=0){
				self.flog('Skipping Gif ['+item.img+']',function(){
					fin();
				});
			}else{
				self.getImgSize(item.img,fin,valid_images);
			}
		},MAX_QUEUE);
		imgqueue.drain = function() {
			self.log('Done Processing Image Queue, ['+valid_images.length+'] valid images');
			cb(valid_images);
			//console.log(self.toBase64(valid_images));
		}
		self.flog('Checking Images ['+JSON.stringify(images)+']',function(){
			var data=images;
			for (var i = 0; i < data.length; i++) {
				imgqueue.push({
					img:data[i]
				})
			};
		})
	},
	getImgSize:function(img,fin,list){
		var self=this;
		if(!self.probe) self.probe=require('probe-image-size');
		var acceptedMimes=['image/png','image/jpg','image/jpeg','image/gif'];
		var MIN_SIZE={
			width:300,
			height:200
		}
		self.probe(img, function (err, result) {
			if(err){
				self.log('error loading image ['+img+']');
				fin()
			}else{
				if(acceptedMimes.indexOf(result.mime)>=0){
					if(result.width>=MIN_SIZE.width&&result.height>=MIN_SIZE.height){
						self.log('valid img ['+img+']');
						list.push(img);
						fin()
					}else{
						self.log('image too small ['+result.width+'x'+result.height+'] ['+img+']');
						fin();
					}
				}else{
					self.log('mime ['+result.mime+'] no accepted ['+img+']');
					fin();
				}
			}
		});
	},
	ensureLink:function(url){
		if(url.indexOf('http')>=0) return url;
		else return 'http://'+url;
	},
	updateCreds:function(db,id,cb){
		var self=this;
		db.creds.update({id:id},{$set:{tsu:self.getTs()}},function(err,data){
			if(err){
				self.dblog('Unable to update creds TSU');
				cb(false);
			}else{
				cb(true);
			}
		});
	},
	getCreds:function(db,id,cb){
		var self=this;
		db.creds.findOne({id:id},function(err,data){
			if(err){
				cb(false);
			}else{
				if(data&&data.e){
					data.access_token=self.aes.decrypt(data.access_token);
					if(data.refresh_token) data.refresh_token=self.aes.decrypt(data.refresh_token);
				}
				cb(data);
			}
		});
	},
	post:function(url,data,headers,json,cb,encode){
		var opts=this.parseUrlToOptions(url);
		opts.method='POST';
		if(!encode) var tdata=this.qs.stringify(data,{ encode: false });
		else var tdata=this.qs.stringify(data,{ encode: true });
		if(!headers) opts.headers={}
		else opts.headers=headers;
		if(!opts.headers['Content-Type']) opts.headers['Content-Type']='application/x-www-form-urlencoded';
	    opts.headers['Content-Length']=Buffer.byteLength(tdata);
		var tresp='';
		if(url.indexOf('https://')===0){
			var mod=this.https;
		}else{
			var mod=this.http;	
		}
		var req = mod.request(opts, function(res) {
		  	res.setEncoding('utf8');
			  res.on('data', function(chunk){
			    	tresp+=chunk;
			  	});
		  	res.on('error', function(e){
		  		self.log("Got error: " + e.message);
		  		process.exit(0);
			})
			res.on('end',function(){
				try{
					if(json){
						var rdata=module.exports.json5.parse(tresp);
						cb(rdata);
					}else{
						cb(tresp);	
					}
				}catch(e){
					cb({error:'malformed_json',stack:e,resp:tresp},tresp);
				}

			})
		});
		req.write(tdata);
		req.end();
	},
	get2:function(url,data,headers,json,cb,cbd,cbd2){
		var opts=this.parseUrlToOptions(url);
		opts.method='GET';
		var skipheader=false;
		if(headers==-1){
			skipheader=true;
			headers={};
		}else{
			if(!headers) opts.headers={}
			else opts.headers=headers;
			if(!opts.headers['Content-Type']) opts.headers['Content-Type']='application/x-www-form-urlencoded';
		}
		if(data&&Object.keys(data).length){
			var tdata=this.qs.stringify(data,{ encode: false });
		    if(!skipheader) opts.headers['Content-Length']=Buffer.byteLength(tdata);
		    if(opts.method=='GET'){
		    	opts.path+='?'+tdata;
		    }else{
		    	opts.qs=data;
		    }
		}else{
			//opts.headers['Content-Length']=Buffer.byteLength('{}');
		}
		var tresp='';
		if(url.indexOf('https://')===0){
			var mod=this.https;
		}else{
			var mod=this.http;	
		}
		var req = mod.request(opts, function(res) {
		  	res.setEncoding('utf8');
			  res.on('data', function(chunk){
			    	tresp+=chunk;
			  	});
		  	res.on('error', function(e){
		  		self.log("Got error: " + e.message);
		  		cb({error:'network_error',stack:e},cbd,cbd2);
			})
			res.on('end',function(){
				if(json){
					if(tresp){
						// console.log(tresp);
						// var rdata=JSON.parse(tresp);
						// console.log(rdata);
						// console.log(trep)
						try{
							var rdata=module.exports.json5.parse(tresp);
						}catch(e){
							console.log(tresp);
							cb({error:'malformed_json',stack:e,resp:tresp},cbd,cbd2);
						}
					}else{
						var rdata={error:'no_data'};
					}
					cb(rdata,cbd,cbd2);
				}else{
					cb(tresp,cbd,cbd2);	
				}
			})
		});
		req.end();
	},
	get:function(url,cb,keepalive,retries){
		var self=this;
		if(!retries) retries=3;
		function retry(e){
			retries--;
			self.log("Got error: " + e.message);
			self.log('retrying ['+retries+'] more times');
			self.get(url,cb,keepalive,retries);
		}
		var opts=this.parseUrlToOptions(url,keepalive);
		var tresp='';
		opts.headers={
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
		}
		if(url.indexOf('https://')===0){
			var req=this.https.get(opts, function(resp){
			  	resp.on('data', function(chunk){
			    	tresp+=chunk;
			  	});
			  	resp.on('error', function(e){
			  		self.log("Got error: " + e.message);
			  		process.exit(0);
				})
				resp.on('end',function(){
					cb(tresp);
				})
			}).on('error', retry);
			req.end();
		}else{
			var req=this.http.get(opts, function(resp){
			  	resp.on('data', function(chunk){
			    	tresp+=chunk;
			  	});
			  	resp.on('error', function(e){
			  		self.log("Got error: " + e.message);
			  		process.exit(0);
				})
				resp.on('end',function(){
					cb(tresp);
				})
			}).on('error', retry);
			req.end();
		}
	}
};