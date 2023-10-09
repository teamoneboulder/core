module.exports=function(path,r,db){
	var api={
		onboardstatus:function(r,db,returnFn){
			var jobs={};
			var async=require('async');
			//facebook
			//tags
			//connection post
			//contact card
			//intro video
			//partial page
			//superpowers
			//first stream post
			db.user.findOne({id:r.auth.uid},function(err,user){
			db.user_profiles.findOne({id:r.auth.uid},function(err,user_profile){
				if(!user){
					if(returnFn) return false;
					else return r.write(r,{error:'invalid_user'});
				}
				// jobs['dietary']=async.apply(function(tobj,cb){
				// 	methods.checkDietary(tobj,cb);
				// },{
				// 	uid:r.auth.uid,
				// 	user:user
				// });
				// jobs['user_bg']=async.apply(function(tobj,cb){
				// 	methods.checkUserBg(tobj,cb);
				// },{
				// 	uid:r.auth.uid,
				// 	user:user
				// });
				jobs['skills']=async.apply(function(tobj,cb){
					methods.checkSkills(tobj,cb);
				},{
					uid:r.auth.uid,
					user:user
				});
				jobs['waivers']=async.apply(function(tobj,cb){
					methods.checkWaivers(tobj,cb);
				},{
					uid:r.auth.uid,
					user:user
				});
				jobs['notifications']=async.apply(function(tobj,cb){
					methods.checkNotifications(tobj,cb);
				},{
					uid:r.auth.uid,
					user:user
				});
				jobs['questions']=async.apply(function(tobj,cb){
					methods.checkQuestions(tobj,cb);
				},{
					uid:r.auth.uid,
					user:user
				});
				jobs['contact_card']=async.apply(function(tobj,cb){
					methods.checkContactCard(tobj,cb);
				},{
					uid:r.auth.uid,
					user:user
				});
				jobs['location']=async.apply(function(tobj,cb){
					methods.checkLocation(tobj,cb);
				},{
					uid:r.auth.uid,
					user:user
				});
				jobs['humandesign']=async.apply(function(tobj,cb){
					methods.checkHumanDesign(tobj,cb);
				},{
					uid:r.auth.uid,
					user:user,
					user_profile:user_profile
				});
				jobs['genekeys']=async.apply(function(tobj,cb){
					methods.checkGeneKeys(tobj,cb);
				},{
					uid:r.auth.uid,
					user:user,
					user_profile:user_profile
				});
				jobs['games']=async.apply(function(tobj,cb){
					methods.loadGames(tobj,cb);
				},{
					uid:r.auth.uid,
					user:user,
					user_profile:user_profile
				});
				// jobs['natalchart']=async.apply(function(tobj,cb){
				// 	methods.checkNatalChat(tobj,cb);
				// },{
				// 	uid:r.auth.uid,
				// 	user:user
				// });
				if(Object.keys(jobs).length){
					r.tools.parallel(jobs,5,function(err,rdata){
						rdata.progress={
							count:0,
							total:0,
							totalPoints:0,
							pointsAttained:0,
							pointPercent:0,
							percent:0
						}
						//profile pic
						rdata.progress.total++;
						rdata.progress.totalPoints+=rdata.games.list.profile_pic.points;
						if(user.pic&&user.pic.path&&user.pic.path!='/static/blank_user'){
							rdata.progress.pointsAttained+=rdata.games.list.profile_pic.points;
							rdata.progress.count++;
						}
						//skills
						rdata.progress.total++;
						rdata.progress.totalPoints+=rdata.games.list.profile_skills.points;
						if(rdata.skills){
							rdata.progress.pointsAttained+=rdata.games.list.profile_skills.points;
							rdata.progress.count++;
						}
						//birthday
						rdata.progress.total++;
						rdata.progress.totalPoints+=rdata.games.list.profile_birthday.points;
						if(rdata.contact_card.list&&rdata.contact_card.list.birthday){
							rdata.progress.pointsAttained+=rdata.games.list.profile_birthday.points;
							rdata.progress.count++;
						}
						//humandesign
						rdata.progress.total++;
						rdata.progress.totalPoints+=rdata.games.list.profile_humandesign.points;
						if(rdata.humandesign){
							rdata.progress.pointsAttained+=rdata.games.list.profile_humandesign.points;
							rdata.progress.count++;
						}
						//genekeys
						rdata.progress.total++;
						rdata.progress.totalPoints+=rdata.games.list.profile_genekey.points;
						if(rdata.genekeys){
							rdata.progress.pointsAttained+=rdata.games.list.profile_genekey.points;
							rdata.progress.count++;
						}
						//questions
						rdata.progress.total++;
						rdata.progress.totalPoints+=rdata.games.list.profile_questions.points;
						if(rdata.questions.completed==rdata.questions.total){
							rdata.progress.pointsAttained+=rdata.games.list.profile_questions.points;
							rdata.progress.count++;
						}
						//location
						rdata.progress.total++;
						rdata.progress.totalPoints+=rdata.games.list.profile_city.points;
						if(rdata.location){
							rdata.progress.pointsAttained+=rdata.games.list.profile_city.points;
							rdata.progress.count++;
						}
						//phone
						if(rdata.contact_card.list&&rdata.contact_card.list.phone) rdata.progress.count++;
						rdata.progress.total++;
						if(rdata.contact_card.phone) rdata.progress.count++;
						rdata.progress.percent=parseFloat(((rdata.progress.count/rdata.progress.total)*100).toFixed(0));
						rdata.progress.pointPercent=parseFloat(((rdata.progress.pointsAttained/rdata.progress.totalPoints)*100).toFixed(0));
						if(returnFn) returnFn(rdata);
						else r.write(r,{success:true,data:rdata});
					});
				}else{
					if(returnFn) returnFn(false);
					else r.write(r,{error:'invalid home view'})
				}
			})
			})
		},
		feed:function(){
			//aggregate responses from api!
			var jobs={};
			var async=require('async');
			if(!r.qs.filter) r.qs.filter='everything';
			if(!r.qs.last&&r.qs.filter=='everything'){
				jobs['directory']=async.apply(function(tobj,cb){
					methods.get(tobj,cb);
				},{
					type:'directory',
					uid:r.auth.uid,
					qs:{appid:r.qs.appid,token:r.qs.token,last:r.qs.last,type:r.qs.directorytype},
					url:'https://'+r.tools.settings.api+'/one_core/user/directory'
				});
			}
			if(!r.qs.last&&r.qs.filter=='everything'){
				var qs={appid:r.qs.appid,token:r.qs.token,last:r.qs.last};
				if(r.qs.forceTesting) qs.force=1;
				jobs['shortcuts']=async.apply(function(tobj,cb){
					methods.get(tobj,cb);
				},{
					type:'shortcuts',
					uid:r.auth.uid,
					qs:qs,
					url:'https://'+r.tools.settings.api+'/one_core/user/shortcuts'
				});
			}
			// jobs['events_item']=async.apply(function(tobj,cb){
			// 	methods.get(tobj,cb);
			// },{
			// 	type:'events_item',
			// 	uid:r.auth.uid,
			// 	aggregate:1,
			// 	qs:{schema:'event',appid:r.qs.appid,token:r.qs.token,last:r.qs.last},
			// 	_listTemplate:'events_item',
			// 	_pageTemplate:'event',
			// 	url:'https://'+r.tools.settings.api+'/one_core/module/formbuilder/feed'
			// });
			if(['everything','requests'].indexOf(r.qs.filter)>=0){
				jobs['requests']=async.apply(function(tobj,cb){
					methods.get(tobj,cb);
				},{
					type:'requests',
					uid:r.auth.uid,
					aggregate:1,
					_listTemplate:'requests',
					_pageTemplate:'need',
					qs:{schema:'need',appid:r.qs.appid,token:r.qs.token,last:r.qs.last},
					url:'https://'+r.tools.settings.api+'/one_core/module/need/feed'
				});
			}
			// if(['everything','donations'].indexOf(r.qs.filter)>=0){
			// 	jobs['donations']=async.apply(function(tobj,cb){
			// 		methods.get(tobj,cb);
			// 	},{
			// 		type:'donation',
			// 		uid:r.auth.uid,
			// 		aggregate:1,
			// 		_listTemplate:'donations',
			// 		_pageTemplate:'donation',
			// 		qs:{schema:'donation',appid:r.qs.appid,token:r.qs.token,last:r.qs.last},
			// 		url:'https://'+r.tools.settings.api+'/one_core/module/formbuilder/feed'
			// 	});
			// }
			if(['everything','offers'].indexOf(r.qs.filter)>=0){
				jobs['offers']=async.apply(function(tobj,cb){
					methods.get(tobj,cb);
				},{
					type:'offers',
					uid:r.auth.uid,
					aggregate:1,
					_listTemplate:'offers',
					_pageTemplate:'offer',
					qs:{schema:'offer',appid:r.qs.appid,token:r.qs.token,last:r.qs.last},
					url:'https://'+r.tools.settings.api+'/one_core/module/offer/feed'
				});
			}
			if(['everything','music'].indexOf(r.qs.filter)>=0){
				jobs['music']=async.apply(function(tobj,cb){
					methods.get(tobj,cb);
				},{
					type:'music',
					uid:r.auth.uid,
					aggregate:1,
					_listTemplate:'musics',
					_pageTemplate:'music',
					qs:{schema:'music',appid:r.qs.appid,token:r.qs.token,last:r.qs.last},
					url:'https://'+r.tools.settings.api+'/one_core/module/formbuilder/feed'
				});
			}
			if(['everything','service'].indexOf(r.qs.filter)>=0){
				jobs['service']=async.apply(function(tobj,cb){
					methods.get(tobj,cb);
				},{
					type:'service',
					uid:r.auth.uid,
					aggregate:1,
					_listTemplate:'services_item',
					_pageTemplate:'service',
					qs:{schema:'service',appid:r.qs.appid,token:r.qs.token,last:r.qs.last},
					url:'https://'+r.tools.settings.api+'/one_core/module/formbuilder/feed'
				});
			}
			if(['everything','podcast'].indexOf(r.qs.filter)>=0){
				jobs['podcast']=async.apply(function(tobj,cb){
					methods.get(tobj,cb);
				},{
					type:'podcast',
					uid:r.auth.uid,
					aggregate:1,
					_listTemplate:'podcasts',
					_pageTemplate:'podcast',
					qs:{schema:'podcast',appid:r.qs.appid,token:r.qs.token,last:r.qs.last},
					url:'https://'+r.tools.settings.api+'/one_core/module/formbuilder/feed'
				});
			}
			if(['everything','gifts'].indexOf(r.qs.filter)>=0){
				jobs['gifts']=async.apply(function(tobj,cb){
					methods.get(tobj,cb);
				},{
					type:'gifts',
					uid:r.auth.uid,
					aggregate:1,
					debug:1,
					_listTemplate:'gifts',
					_pageTemplate:'exchange',
					qs:{schema:'exchange',appid:r.qs.appid,token:r.qs.token,last:r.qs.last},
					url:'https://'+r.tools.settings.api+'/one_core/module/formbuilder/feed'
				});
			}
			if(['everything','updates'].indexOf(r.qs.filter)>=0){
				jobs['updates']=async.apply(function(tobj,cb){
					methods.get(tobj,cb);
				},{
					type:'updates',
					uid:r.auth.uid,
					aggregate:1,
					_listTemplate:'updates',
					_pageTemplate:'update',
					qs:{schema:'update',appid:r.qs.appid,token:r.qs.token,last:r.qs.last},
					url:'https://'+r.tools.settings.api+'/one_core/updates'
				});
			}
			//https://api.phijs.earth/one_core/module/events/feed?callback=jcb_Dp0U&max=10&appid=2366d44c84409765d9a00619aea4c1234&token=fce30231ee8f65e81960ae329611c4b4&_=1649878866809
			// if(['everything','events'].indexOf(r.qs.filter)>=0){
			// 	jobs['events']=async.apply(function(tobj,cb){
			// 		methods.get(tobj,cb);
			// 	},{
			// 		type:'events',
			// 		uid:r.auth.uid,
			// 		aggregate:1,
			// 		debug:1,
			// 		_listTemplate:'events_item',
			// 		_pageTemplate:'event',
			// 		qs:{filter:'added',schema:'event',appid:r.qs.appid,token:r.qs.token,last:r.qs.last},
			// 		url:'https://'+r.tools.settings.api+'/one_core/module/events/feed'
			// 	});
			// }
			if(['everything','stories'].indexOf(r.qs.filter)>=0){
				jobs['stories']=async.apply(function(tobj,cb){
					methods.get(tobj,cb);
				},{
					type:'stories',
					uid:r.auth.uid,
					aggregate:1,
					_listTemplate:'story_item',
					_pageTemplate:'story',
					qs:{schema:'story',appid:r.qs.appid,token:r.qs.token,last:r.qs.last},
					url:'https://'+r.tools.settings.api+'/one_core/module/formbuilder/feed'
				});
			}
			// if(['everything','stats'].indexOf(r.qs.filter)>=0){
			// 	jobs['stats']=async.apply(function(tobj,cb){
			// 		methods.stats(tobj,cb);
			// 	},{
			// 		type:'stats',
			// 		uid:r.auth.uid
			// 	});
			// }
			if(['everything','feedback'].indexOf(r.qs.filter)>=0){
				jobs['feedback']=async.apply(function(tobj,cb){
					methods.get(tobj,cb);
				},{
					type:'feedback',
					uid:r.auth.uid,
					aggregate:1,
					_listTemplate:'feedbacks',
					_pageTemplate:'feedback',
					qs:{schema:'feedback',appid:r.qs.appid,token:r.qs.token,last:r.qs.last},
					url:'https://'+r.tools.settings.api+'/one_core/module/formbuilder/feed'
				});
			}
			//console.log(jobs)
			if(Object.keys(jobs).length){
				r.tools.parallel(jobs,5,function(err,rdata){
					//aggregate timeline
					var keys=Object.keys(rdata);
					var aggregate=[]
					var extraData={};
					for (var i = 0; i < keys.length; i++) {
						if(rdata[keys[i]].options.aggregate) aggregate.push(keys[i]);
						else{
							delete rdata[keys[i]].options;
							extraData[keys[i]]=rdata[keys[i]];
						}
					}
					var list={};
					for (var i = 0; i < aggregate.length; i++) {
						var key=aggregate[i];
						if(rdata[key].data&&rdata[key].data.list){
							for (var dk in rdata[key].data.list) {
								var item=rdata[key].data.list[dk];
								item._listTemplate=rdata[key].options._listTemplate;
								item._pageTemplate=rdata[key].options._pageTemplate;
								list[item._id]=item;
							}
						}
					}
					var order=[];
					var order=Object.keys(list).sort().reverse().slice(0,10);
					var data={}
					for (var i = 0; i < order.length; i++) {
						var id=order[i];
						data[id]=list[id];
					}
					api.onboardstatus(r,db,function(onboardData){
						extraData.onboard=onboardData;
						db.user.countDocuments(function(err,count){
							extraData.userCount=count;
							r.write(r,{success:true,data:{
								order:order,
								list:data,
								extra:extraData,
								last:order[order.length-1]
							}});	
						})
					});
					//r.write(r,{success:true,data:rdata});
				});
			}else{
				r.write(r,{error:'invalid home view'})
			}
		}
	}
	var methods={
		get:function(obj,cb,debug){
			var data=Object.assign({},{
				max:10,
			},obj.qs);
			if(obj.debug) console.log(obj.url+'?'+new URLSearchParams(data).toString())
			r.tools.post(obj.url,data,false,1,function(resp){
				resp.options=obj;
				//if(debug) return cb(resp);
				cb(false,resp);
			})
		},
		stats:function(obj,cb){
			db.user.countDocuments(function(err,count){
				cb(false,{
					users:count
				})
			})
		},
		checkWaivers:function(obj,cb){
			db.user_waiver.findOne({id:obj.uid},function(err,data){
				if(data){
					cb(null,1);
				}
				else cb(null,0);
			})
		},
		loadGames:function(obj,cb){
			db.games.find({category:'profile'},function(err,data){
				if(data){
					r.tools.db.toOrderedList(data,'id',function(d){
						cb(null,d)
					});
				}
				else cb(null,0);
			})
		},
		checkNotifications:function(obj,cb){
			db.user_settings.findOne({id:obj.uid},function(err,data){
				if(data){
					cb(null,1);
				}
				else cb(null,0);
			})
		},
		checkDietary:function(obj,cb){
			if(r.tools.settings.prod){
				return cb(null,1);
			}
			db.user_diet.findOne({id:obj.uid},function(err,data){
				if(data){
					cb(null,1);
				}
				else cb(null,0);
			})
		},
		checkFacebook:function(obj,cb){
			if(obj.user.nofb) return cb(null,2);
			db.creds.findOne({id:obj.uid+'_facebook'},function(err,data){
				if(data){
					var d={
						posts:(data.scopes.indexOf('user_posts')>=0)?1:0,
						friends:(data.scopes.indexOf('user_friends')>=0)?1:0
					}
					cb(null,d);
				}
				else cb(null,0);
			})
		},
		checkQuestions:function(obj,cb){
			var schema=r.tools.getSchema('user_questions');
			db.user_questions.findOne({id:obj.uid},function(err,data){
				if(data){
					var count=0;
					var total=schema.order.length-1;
					for (var i = schema.order.length - 1; i >= 0; i--) {
						var item=schema.order[i];
						if(item=='id') continue;
						if(data[item]) count++;
					}
					cb(null,{
						completed:count,
						total:total
					});
				}else {
					var count=0;
					var total=schema.order.length-1;
					cb(null,{
						completed:count,
						total:total
					});
				}
			})
		},
		checkPartialPage:function(obj,cb){
			db.page.findOne({_partial:1,uid:obj.uid},function(err,data){
				if(data){
					data.admin_info={};
					data.admin_info[obj.uid]={
						id:obj.user.id,
						name:obj.user.name,
						pic:obj.user.pic
					}
					cb(null,data);
				}else cb(null,0);
			})
		},
		checkContactCard:function(obj,cb){
			var added=0;
			var check=['birthday','gender','address','phone'];
			var list={};
			for (var i = 0; i < check.length; i++) {
				var item=check[i];
				if(obj.user[item]){
					added++;
					list[item]=1;
				}else{
					list[item]=0
				}
			}
			cb(null,{
				total:check.length,
				completed:added,
				list:list
			});
		},
		checkConnectionPost:function(obj,cb){
			db.connection.findOne({uid:obj.uid},function(err,data){
				if(data) cb(null,1);
				else cb(null,0);
			})
		},
		checkSkills:function(obj,cb){
			if(obj.user.skills&&obj.user.skills.length) cb(null,1);
			else cb(null,0);
		},
		checkUserBg:function(obj,cb){
			if(obj.user.bg) cb(null,1);
			else cb(null,0);
		},
		checkPollinator:function(obj,cb){
			db.plan.findOne({'id':obj.uid},function(err,data){
				if(data&&data.pollinator) cb(null,1);	
				else cb(null,0);	
			});
		},
		checkRealName:function(obj,cb){
			if(obj.user.real_name) cb(null,1);
			else cb(null,0);
		},
		checkStreamPost:function(obj,cb){
			db.post.findOne({'by.id':obj.uid,tags:{$nin:['intro_video']}},function(err,data){
				if(data) cb(null,1);
				else cb(null,0);
			})
		},
		checkIntroVideo:function(obj,cb){
			if(obj.user.intro_video) cb(null,1);
			else cb(null,0);
		},
		checkLocation:function(obj,cb){
			if(obj.user.location) cb(null,1);
			else cb(null,0);
		},
		checkHumanDesign:function(obj,cb){
			if(obj.user_profile&&obj.user_profile.humandesign) cb(null,1);
			else cb(null,0);
		},
		checkGeneKeys:function(obj,cb){
			if(obj.user_profile&&obj.user_profile.genekeys) cb(null,1);
			else cb(null,0);
		}
	}
	if(api[path]&&path[0]!='_'){
		api[path](r,db);
	}else{
		r.write(r,{error:'invalid_method'})
	}
}