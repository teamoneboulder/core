module.exports=function(path,r,db){
	var api={
		aggregate:function(r,db){
			if(!r.qs.filters) r.qs.filters=['people','page','event','service','fundraiser'];
			//r.write(r,{success:true,qs:r.qs});
			methods.createSearchWeight(r,function(resp){
				var weighted=resp.weights;
				var friends=resp.friends;
				var pages=resp.pages;
				var scopes=resp.scopes;
				//search user!
				var search=r.qs.search.toLowerCase();
				//r.write(r,{auth:r.auth});//one more aggregation!
				// if(!search&&!r.qs.page_permission){
				// 	r.write(r,{error:'no_search_values'});//one more aggregation!
				// }
				var async=require('async');
				var jobs={};
				if(r.qs.filters.indexOf('me')>=0){
					jobs['me']=async.apply(function(tobj,cb){
						db.user.findOne({id:tobj.uid},{id:1,name:1,pic:1},function(err,data){
							if(data){
								data.weight=1000;//put at top
							}
							var resp={
								order:[data.id],
								list:{}
							}
							resp.list[data.id]=data;
							cb(null,resp);
						})
					},{
						weight:(weighted&&weighted.person)?weighted.person:false,
						friends:friends,
						search:search,
						excludeIds:[(r.auth.uid)?r.auth.uid:false],
						coll:'user',
						scopes:scopes,
						stats:(r.qs.stats)?1:0,
						event:(r.qs.event)?r.qs.event:0,
						mutual:(r.qs.mutual)?1:0,
						uid:(r.auth.uid)?r.auth.uid:false,
						qs:r.qs
					});
				}
				if(r.qs.filters.indexOf('people')>=0){
					jobs['people']=async.apply(function(tobj,cb){
						methods.search(tobj,cb);
					},{
						weight:(weighted&&weighted.person)?weighted.person:false,
						friends:friends,
						search:search,
						excludeIds:[(r.auth.uid&&!r.qs.allowMe)?r.auth.uid:false],
						coll:'user',
						scopes:scopes,
						stats:(r.qs.stats)?1:0,
						event:(r.qs.event)?r.qs.event:0,
						mutual:(r.qs.mutual)?1:0,
						uid:(r.auth.uid)?r.auth.uid:false,
						qs:r.qs,
						auth:r.auth
					});
				}
				if(r.qs.filters.indexOf('page')>=0){
					jobs['page']=async.apply(function(tobj,cb){
						methods.search(tobj,cb);
					},{
						weight:(weighted&&weighted.page)?weighted.page:false,
						search:search,
						pages:pages,
						coll:'page',
						qs:r.qs
					});
				}
				if(r.qs.filters.indexOf('map_layer')>=0){
					jobs['map_layer']=async.apply(function(tobj,cb){
						methods.search(tobj,cb);
					},{
						weight:false,
						search:search,
						pages:pages,
						coll:'map_layer',
						qs:r.qs
					});
				}
				if(r.qs.filters.indexOf('fundraiser')>=0){
					jobs['fundraiser']=async.apply(function(tobj,cb){
						methods.search(tobj,cb);
					},{
						weight:(weighted&&weighted.fundraiser)?weighted.fundraiser:false,
						search:search,
						coll:'fundraiser',
						qs:r.qs
					});
				}
				if(r.qs.filters.indexOf('event')>=0){
					jobs['event']=async.apply(function(tobj,cb){
						methods.search(tobj,cb);
					},{
						weight:(weighted&&weighted.event)?weighted.event:false,
						search:search,
						coll:'event',
						qs:r.qs
					});
				}
				// if(r.qs.filters.indexOf('music_artist')>=0){
				// 	jobs['music_artist']=async.apply(function(tobj,cb){
				// 		methods.search(tobj,cb);
				// 	},{
				// 		weight:false,
				// 		search:search,
				// 		coll:'music_artist',
				// 		qs:r.qs
				// 	});
				// }
				if(r.qs.filters.indexOf('podcast_artist')>=0){
					jobs['podcast_artist']=async.apply(function(tobj,cb){
						methods.search(tobj,cb);
					},{
						weight:false,
						search:search,
						coll:'podcast_artist',
						qs:r.qs
					});
				}
				if(r.qs.filters.indexOf('service')>=0){
					jobs['service']=async.apply(function(tobj,cb){
						methods.search(tobj,cb);
					},{
						weight:false,
						search:search,
						coll:'service',
						qs:r.qs
					});
				}
				if(r.qs.filters.indexOf('post')>=0){
					jobs['post']=async.apply(function(tobj,cb){
						methods.search(tobj,cb);
					},{
						weight:(weighted&&weighted.post)?weighted.post:false,
						search:search,
						friends:friends,
						pages:pages,
						coll:'post',
						qs:r.qs,
						graph:[{
							coll:{
								id:'page.id',
								type:'page.type'
							},
							to:'page.data',
							opts:{
								user:{
									coll:'user',
									match:'id',
									fields:['id','name','pic']
								},
								page:{
									coll:'page',
									match:'id',
									fields:['id','name','pic']
								}
							}
						},{
							coll:{
								id:'by.id',
								type:'by.type'
							},
							to:'by.data',
							opts:{
								user:{
									coll:'user',
									match:'id',
									fields:['id','name','pic']
								},
								page:{
									coll:'page',
									match:'id',
									fields:['id','name','pic']
								}
							}
						}]
					});
				}
				if(Object.keys(jobs).length){
					r.tools.parallel(jobs,5,function(err,rdata){
						//return r.write(r,{success:true,resp:rdata});
						r.write(r,{success:true,data:methods.aggregate(r,rdata,search)})
					});
				}else{
					r.write(r,{error:'invalid filters'})
				}
			})
		},
		chat:async function(r,db){
			// r.write(r,{success:true,data:methods.pipeline.searchChats({
			// 	uid:r.auth.uid,
			// 	search:r.qs.search
			// })});
			var cursor=db.chat_group.aggregate(methods.pipeline.searchChats({
				uid:r.auth.uid,
				search:r.qs.search.toLowerCase(),
				last:r.qs.last
			}))
			var data=await cursor.toArray();
			//r.write(r,{success:true,data:data})
			if(data){
				var data=r.tools.db.atoOrderedList(data,'_id');
				if(data&&data.order&&data.order.length){
					//r.write(r,{success:true,data:data.order})
					methods.getChats(r,data.order,function(resp){
						r.write(r,resp);
					})
				}else{
					r.write(r,{success:true,data:false})
				}
			}else{
				r.write(r,{success:true,data:false})
			}
		},
		users:function(r,db){
			r.qs.filters=['people'];
			methods.createSearchWeight(r,function(resp){
				var weighted=resp.weights;
				var friends=resp.friends;
				var jobs={};
				var async=require('async');
				jobs['people']=async.apply(function(tobj,cb){
					methods.searchUsers(tobj,cb);
				},{
					weight:weighted.person,
					friends:friends,
					excludeIds:[r.auth.uid],
					coll:'user',
					mutual:1,
					stats:1,
					uid:r.auth.uid,
					qs:r.qs
				});
				if(Object.keys(jobs).length){
					r.tools.parallel(jobs,5,function(err,rdata){
						var ag=methods.aggregate(r,rdata);
						if(ag){
							ag.last=0;
							if(r.qs.last){
								ag.last=parseInt(r.qs.last,10);
							}
							ag.last+=ag.order.length;
						}
						r.write(r,{success:true,data:ag})
					});
				}else{
					r.write(r,{error:'invalid filters'})
				}
			})
		}
	}
	var methods={
		aggregate:function(r,data,search){
			var items=[];
			for(var key in data){
				var td=data[key];
				if(td&&td.order&&td.order.length){
					for (var i = 0; td.order[i]; i++) {
						var item=td.list[td.order[i]];
						if(!item) continue;
						// if(item.name.toLowerCase().indexOf(search)===0){
						// 	item.weight+=10;//exact match at beginning of string, give some extra weight
						// }
						if(key=='me'){
							item._type='people';
						}else{
							item._type=key;
						}
						items.push(item);
					}
				}
			}
			if(!items.length){
				return false;
			}
			//sort!
			items.sort(function(a,b) {
			    return b.weight-a.weight;
			});
			var resp=r.tools.db.atoOrderedList(items,'id');
			return resp;
		},
		getChats:function(r,ids,cb){
			var url='https://'+r.tools.settings.api+'/one_core/module/chats/load';
	    	var send={
	    		ids:ids,
	    		appid:r.qs.appid,
	    		token:r.qs.token,
	    		identity:r.qs.identity
	    	}
			r.tools.post(url,send,false,1,function(resp){
				if(resp.error){
					console.log(JSON.stringify(resp));
					r.tools.dblog('Error getting Chats: '+JSON.stringify(resp));
				}
				cb(resp);
			},1)
		},
		search:async function(obj,cb){
			var coll=db[obj.coll];
			if(!coll){
				console.log('Collection ['+obj.coll+'] not initialized')
				return cb(null,false);
			}
			//console.log(methods.pipeline.get(obj))
			var cursor=coll.aggregate(methods.pipeline.get(obj));
			var data=await cursor.toArray();
			if(data){
				var data=r.tools.db.atoOrderedList(data,'id');
				if(obj.graph){
					r.tools.db.graph(db,data,obj.graph,function(graph){
						//return r.write(r,{graph:graph});
						cb(null,data);
					});
				}else{
					cb(null,data);
				}
			}else{
				cb(null,false);
			}
		},
		searchUsers:function(obj,cb){
			var coll=db[obj.coll];
			//r.write(r,{pipeline:methods.pipeline.userFind(obj)});
			coll.aggregate(methods.pipeline.userFind(obj),function(err,resp){
				cb(null,resp);
			});
		},
		addProjectData:function(r,stage,data){
			if(data&&r.auth&&r.auth.appid=='33ee6d44c844xx9765d9220619ae8c152f'){//only allow for admins!
				for (var k in data) {
					var item=data[k];
					stage['$project'][item]=1;
				}
				return stage;
			}else return stage;
		},
		pipeline:{
			get:function(obj){
				if(methods.pipeline[obj.coll]){
					var pipeline=methods.pipeline[obj.coll](obj);
				}else{
					var pipeline=methods.pipeline.default(obj);
				}
				return pipeline;
			},
			searchChats:function(obj){
				var pipeline=[];
				var m={
					$match:{
						people:{$in:[obj.uid]}
					}
				}
				if(obj.last){
					var m={
						$match:{
							$and:[{
								people:{$in:[obj.uid]}
							},{
								tsu:{
									$lt:new Date(parseInt(obj.last,10)*1000)
								}
							}]
						}
					}
					// m['$match']['tsu']={
					// 	$lt:new Date(parseInt(obj.last,10)*1000)
					// }
				}
				pipeline.push(m);
				//r.write(r,{data:pipeline});
				pipeline.push({
					$unwind:{
						path:'$people',
						preserveNullAndEmptyArrays:true
					}
				});
				//return pipeline;
				//add in all users/profile data
				pipeline.push({
					$lookup:{
						from:'user',
						localField:'people',
						foreignField:'id',
						as:'identity'
					}
				});
				// pipeline.push({//could be a page too!
				// 	$lookup:{
				// 		from:'user',
				// 		localField:'pepole',
				// 		foreignField:'id',
				// 		as:'identity'
				// 	}
				// });
				pipeline.push({
					$unwind:{
						path:'$identity',
						preserveNullAndEmptyArrays:true
					}
				});
				pipeline.push({
					$project:{
						name:1,
						identity:1,
						tsu:1,
						identity_name:'$identity.name',
						lower_identity_name: { $toLower: "$identity.name" },
						lower_chat_name: { $toLower: "$name" }
					}
				})
				//find users or chat names based on search
				pipeline.push({
					$project:{
						name:1,
						identity:1,
						tsu:1,
						identity_name:1,
						lower_identity_name:1,
						lower_chat_name:1,
						match_identity:{$indexOfBytes: ["$lower_identity_name", obj.search]},
						match_name:{$indexOfBytes: ["$lower_chat_name", obj.search]}
					}
				});
				//add in weighting
				pipeline.push({
					$project:{
						name:1,
						identity:1,
						weight_identity:{
							$cond:{ 
								if: { $eq: [ "$match_identity", 0 ]}, 
								then:5, 
								else: {
									$cond:{
										if:{
											$gt:[ "$match_identity", 1 ]
										},
										then:1,
										else:0
									}
								}
							} 
						},
						weight_name:{
							$cond:{ 
								if: { $eq: [ "$match_name", 0 ]}, 
								then:5, 
								else: {
									$cond:{
										if:{
											$gt:[ "$match_name", 1 ]
										},
										then:1,
										else:0
									}
								}
							} 
						}
					}
				})
				pipeline.push({
					$project:{
						name:1,
						identity:1,
						weight:{
							$sum:['$weight_name','$weight_identity']
						}
					}
				})
				pipeline.push({
					$match:{
						weight:{$gt:0}
					}
				})
				pipeline.push({
					$sort:{
						weight:-1,
						tsu:-1
					}
				})
				pipeline.push({
					$limit:10
				})
				//r.write(r,{pipeline:pipeline});
				return pipeline;
			},
			userFind:function(obj){
				var pipeline=[];
				var m={
					$match:{
						id:{$nin:obj.excludeIds}
					}
				}
				pipeline.push(m);
				//add in weighting!
				if(obj.weight){
					var pkeys=Object.keys(obj.weight);
					var pvalues=Object.values(obj.weight);
				}else{
					var pkeys=[];
					var pvalues=[];
				}
				var group={
					$project:{
						name:1,
						pic:1,
						id:1
					}
				}
				group['$project'].weight={
					$cond:{ 
						if: {$in:['$id', pkeys]}, 
						then:{
							$arrayElemAt: [ pvalues, { $indexOfArray: [ pkeys, '$id']}]
						}, 
						else: 1
					} 
				}
				if(obj.stats){
					group['$project'].pending={
						$cond:{ 
							if: {$eq:[{$cmp:["$id",obj.uid]},1]}, 
							then:{
								$concat:[obj.uid,'_',"$id"]
							}, 
							else:{
								$concat:["$id",'_',obj.uid]
							}
						} 
					}
				}
				pipeline.push(group);
				if(obj.stats){//add in friend pending info!
					pipeline.push({
						$lookup:{
							from:'friendrequest',
							localField:'pending',
							foreignField:'id',
							as:'pending'
						}
					});
					pipeline.push({
						$unwind:{
							path:'$pending',
							preserveNullAndEmptyArrays:true
						}
					});
				}
				if(obj.qs.filter&&obj.qs.filter.tags){
					pipeline.push({
						$lookup:{
							from:'user_tags',
							localField:'id',
							foreignField:'id',
							as:'tags'
						}
					});
					pipeline.push({
						$unwind:{
							path:'$tags',
							preserveNullAndEmptyArrays:true
						}
					});
					var project1=methods.addProjectData(r,{
						$project:{
							name:1,
							pic:1,
							id:1,
							tags:1,
							pending:1,
							mutual_tags:{
								$setIntersection:['$tags.tags',obj.qs.filter.tags]
							},
							weight:1
						}
					},(obj.qs.graphData&&obj.qs.graphData.pepole)?obj.qs.graphData.pepole:false);
					//r.write(r,{project:project1});
					pipeline.push(project1);
					var project2=methods.addProjectData(r,{
						$project:{
							name:1,
							pic:1,
							id:1,
							tags:1,
							pending:1,
							mutual_tags:{ $cond: { if: { $isArray: "$mutual_tags" }, then: { $size: "$mutual_tags" }, else:0} },
							weight:1
						}	
					},(obj.qs.graphData&&obj.qs.graphData.pepole)?obj.qs.graphData.pepole:false);
					pipeline.push(project2)
					pipeline.push({
						$match:{
							mutual_tags:obj.qs.filter.tags.length
						}
					})
				}
				if(obj.mutual){
					pipeline.push({
						$lookup:{
							from:'user_friends',
							localField:'id',
							foreignField:'id',
							as:'friendinfo'
						}
					})
					pipeline.push({
						$unwind:{
							path:'$friendinfo',
							preserveNullAndEmptyArrays:true
						}
					})
				}
				var group2=methods.addProjectData(r,{
					$project:{
						name:1,
						pic:1,
						id:1,
						pending:1,
						weight:1
					}
				},(obj.qs.graphData&&obj.qs.graphData.pepole)?obj.qs.graphData.pepole:false);
				if(obj.mutual&&obj.friends){
					group2['$project'].mutual={
						$size:{
							$setIntersection:['$friendinfo.friends',obj.friends]
						}
					}
				}
				pipeline.push(group2);
				//now combine!
				var group3={
					$project:{
						name:1,
						pic:1,
						id:1,
						pending:1,
						mutual:1,
						weight:1,
						mutual_tags:1
					}
				}
				if(obj.friends&&obj.stats){//add in friend info!
					group3['$project'].friends={
						$cond:{ 
							if: {$in:['$id', obj.friends]}, 
							then:1, 
							else: 0
						} 
					}
				}
				pipeline.push(group3);
				pipeline.push({
					$sort:{
						weight:-1,
						_id:1
					}
				})
				if(r.qs.last){
					pipeline.push({
						$skip:parseInt(r.qs.last)
					})
				}
				pipeline.push({
					$limit:10
				});
				return pipeline;
			},
			user:function(obj){
				var pipeline=[];
				var m={
					$match:{
						$and:[{
							$or:[{
								name:{
									$regex:obj.search,
									$options:'i'
								}//new RegExp(obj.search,'i')
							},{
								id:obj.search.toUpperCase()
							}]
						}]
					}
				}
				if(obj.auth&&obj.auth.appid=='33ee6d44c844xx9765d9220619ae8c152f'){//ability to search by email!
					m['$match']['$and'][0]['$or'].push({
						email:new RegExp(obj.search,'i')
					})
					m['$match']['$and'][0]['$or'].push({
						stripe_id:new RegExp(obj.search,'i')
					})
				}
				var mid=false;
				if(obj.excludeIds&&obj.excludeIds[0]){
					mid={id:{$nin:obj.excludeIds}};
				}
				if(obj.scopes){
					if(mid){
						mid.id['$in']=obj.scopes.id['$in'];
					}else{
						mid={id:obj.scopes.id};
					}
				}
				if(mid) m['$match']['$and'].push(mid);
				//r.write(r,{m:m});
				pipeline.push(m);
				//r.write(r,{pipeline:pipeline})
				//add in weighting!
				if(obj.weight){
					var pkeys=Object.keys(obj.weight);
					var pvalues=Object.values(obj.weight);
				}else{
					var pkeys=[];
					var pvalues=[];
				}
				var group=methods.addProjectData(r,{
					$project:{
						name:1,
						pic:1,
						id:1,
						lower_name: { $toLower: "$name" }
					}
				},(obj.qs.graphData&&obj.qs.graphData.people)?obj.qs.graphData.people:false,)
				group['$project'].weight={
					$cond:{ 
						if: {$in:['$id', pkeys]}, 
						then:{
							$arrayElemAt: [ pvalues, { $indexOfArray: [ pkeys, '$id']}]
						}, 
						else: 1
					} 
				}
				if(obj.stats){
					group['$project'].pending={
						$cond:{ 
							if: {$eq:[{$cmp:["$id",obj.uid]},1]}, 
							then:{
								$concat:[obj.uid,'_',"$id"]
							}, 
							else:{
								$concat:["$id",'_',obj.uid]
							}
						} 
					}
				}
				pipeline.push(group);
				if(obj.mutual){
					pipeline.push({
						$lookup:{
							from:'user_friends',
							localField:'id',
							foreignField:'id',
							as:'friendinfo'
						}
					})
					pipeline.push({
						$unwind:{
							path:'$friendinfo',
							preserveNullAndEmptyArrays:true
						}
					})
				}
				var group2=methods.addProjectData(r,{
					$project:{
						name:1,
						pic:1,
						id:1,
						pending:1,
						lower_name: 1,
						weight:1
					}
				},(obj.qs.graphData&&obj.qs.graphData.people)?obj.qs.graphData.people:false)
				if(obj.mutual&&obj.friends){
					group2['$project'].mutual={
						$cond:{
							if:{$isArray:"$friendinfo.friends"},
							then:{
								$size:{
									$setIntersection:['$friendinfo.friends',obj.friends]
								}
							},
							else:0
						}
					}
				}
				group2['$project'].match={$indexOfBytes: ["$lower_name", obj.search]};
				pipeline.push(group2);
				//now combine!
				var group3=methods.addProjectData(r,{
					$project:{
						name:1,
						pic:1,
						id:1,
						pending:1,
						mutual:1,
						weight:{
							$cond:{ 
								if: { $eq: [ "$match", 0 ]}, 
								then:{
									$add:["$weight",5]
								}, 
								else: "$weight"
							} 
						}
					}
				},(obj.qs.graphData&&obj.qs.graphData.people)?obj.qs.graphData.people:false)
				if(obj.event){
					group3['$project'].rsvp={
						$concat:[obj.event,'_',"$id"]
					}
					group3['$project'].invite={
						$concat:[obj.event,'_',"$id"]
					}
				}
				if(obj.friends&&obj.stats){//add in friend info!
					group3['$project'].friends={
						$cond:{ 
							if: {$in:['$id', obj.friends]}, 
							then:1, 
							else: 0
						} 
					}
				}
				pipeline.push(group3);
				pipeline.push({
					$sort:{
						weight:-1
					}
				})
				pipeline.push({
					$limit:10
				});
				if(obj.stats){//add in friend pending info after query is done, more efficient
					pipeline.push({
						$lookup:{
							from:'friendrequest',
							localField:'pending',
							foreignField:'id',
							as:'pending'
						}
					});
					pipeline.push({
						$unwind:{
							path:'$pending',
							preserveNullAndEmptyArrays:true
						}
					});
				}
				if(obj.event){//add in friend pending info!
					//add rsvp/invite status for this event!
					pipeline.push({
						$lookup:{
							from:'event_rsvp',
							localField:'rsvp',
							foreignField:'id',
							as:'rsvp'
						}
					})
					pipeline.push({
						$unwind:{
							path:'$rsvp',
							preserveNullAndEmptyArrays:true
						}
					})
					pipeline.push({
						$lookup:{
							from:'event_invite',
							localField:'invite',
							foreignField:'id',
							as:'invite'
						}
					})
					pipeline.push({
						$unwind:{
							path:'$invite',
							preserveNullAndEmptyArrays:true
						}
					})
				}
				//r.write(r,{pipeline:pipeline})
				//return [pipeline[0],pipeline[1],pipeline[2],pipeline[3],pipeline[4]];
				return pipeline;
			},
			page:function(obj){
				var pipeline=[];
				if(obj.qs.page_permission){
					var m={
						$match:{
							$and:[{
								name:new RegExp(obj.search,'i')
							},{
								id:{
									$in:obj.pages
								}
							},{
								hidden:{
									$exists:false
								}
							}]
						}
					}
				}else{
					// var m={
					// 	$match:{
					// 		$and:[{
					// 			name:new RegExp(obj.search,'i')
					// 		},{
					// 			$or:[]
					// 		}]
					// 	}
					// }
					var m={
						$match:{
							$and:[{
								name:new RegExp(obj.search,'i')
							},{
								hidden:{
									$exists:false
								}
							}]
						}
					}
					if(obj.qs.onepass){
						m['$match']['$and'].push({
							onepass:1
						});
						//look up based on user valid onepass locationss

					}
					//initial match needs to also include the permission settings!
					// if(obj.excludeIds){
					// 	m['$match']['$and'][0]['id']={$nin:obj.excludeIds};
					// }
					//or is for permissions
					// m['$match']['$and'][1]['$or'].push({
					// 	privacy:{$in:['public']}
					// });
					// if(obj.pages){
					// 	m['$match']['$and'][1]['$or'].push({
					// 		privacy:{$in:['closed','private']},
					// 		id:{$in:obj.pages}
					// 	});
					// }
				}
				//r.write(r,{success:true,q:m});
				//r.tools.dblog('page match: '+JSON.stringify(m));
				//r.tools.dblog('page search: '+JSON.stringify(obj));
				pipeline.push(m);

				//add in weighting!
				if(obj.weight){
					var pkeys=Object.keys(obj.weight);
					var pvalues=Object.values(obj.weight);
				}else{
					var pkeys=[];
					var pvalues=[];
				}
				var group={
					$project:{
						name:1,
						location:1,
						pic:1,
						callout:1,
						id:1,
						lower_name: { $toLower: "$name" }
					}
				}
				group['$project'].weight={
					$cond:{ 
						if: {$in:['$id', pkeys]}, 
						then:{
							$arrayElemAt: [ pvalues, { $indexOfArray: [ pkeys, '$id']}]
						}, 
						else: 1
					} 
				}
				pipeline.push(group);
				var group2={
					$project:{
						name:1,
						pic:1,
						location:1,
						id:1,
						callout:1,
						pending:1,
						lower_name: 1,
						weight:1
					}
				}
				group2['$project'].match={$indexOfBytes: ["$lower_name", obj.search]};
				pipeline.push(group2);
				//now combine!
				var group3={
					$project:{
						name:1,
						pic:1,
						location:1,
						callout:1,
						id:1,
						weight:{
							$cond:{
								if: { $eq: [ "$match", 0 ]}, 
								then:{
									$add:["$weight",10]
								}, 
								else: "$weight"
							} 
						}
					}
				}
				pipeline.push(group3);
				pipeline.push({
					$sort:{
						weight:-1
					}
				})
				pipeline.push({
					$limit:10
				});
				console.log(pipeline[0].$match);
				//now graph in place data!
				if(obj.qs.info){
					pipeline.push({
						$lookup:{
							from:'place',
							localField:'location.id',
							foreignField:'id',
							as:'location.info'
						}
					});
					pipeline.push({
						$unwind:{
							path:'$location.info',
							preserveNullAndEmptyArrays:true
						}
					});
				}
				return pipeline;
			},
			fundraiser:function(obj){
				var pipeline=[];
				var m={
					$match:{
						name:new RegExp(obj.search,'i')
					}
				}
				if(obj.excludeIds){
					m['$match'].id={$nin:obj.excludeIds};
				}
				pipeline.push(m);
				if(obj.weight){
					var pkeys=Object.keys(obj.weight);
					var pvalues=Object.values(obj.weight);
				}else{
					var pkeys=[];
					var pvalues=[];
				}
				var group={
					$project:{
						name:1,
						pic:1,
						id:1,
						lower_name: { $toLower: "$name" }
					}
				}
				group['$project'].weight={
					$cond:{ 
						if: {$in:['$id', pkeys]}, 
						then:{
							$arrayElemAt: [ pvalues, { $indexOfArray: [ pkeys, '$id']}]
						}, 
						else: 1
					} 
				}
				pipeline.push(group);
				var group2={
					$project:{
						name:1,
						pic:1,
						id:1,
						start:1,
						pending:1,
						lower_name: 1,
						weight:1
					}
				}
				group2['$project'].match={$indexOfBytes: ["$lower_name", obj.search]};
				pipeline.push(group2);
				//now combine!
				//var now=Math.floor(new Date().getTime()/1000);
				var group3={
					$project:{
						name:1,
						pic:1,
						id:1,
						weight:{
							$cond:{
								if: { $eq: [ "$match", 0 ]}, 
								then:{
									$add:["$weight",10]
								}, 
								else: "$weight"
							} 
						},
						// timeDiff:{
						// 	$subtract:["$start",now]
						// }
					}
				}
				pipeline.push(group3);
				//now add in weighting based on date of event
				// var group4={
				// 	name:1,
				// 	pic:1,
				// 	id:1,
				// 	weight:1,
				// 	timeWeight:{
				// 		$cond:{
				// 			if: { $lt: [ "$timeDiff", 0 ]}, 
				// 			then:{
				// 				$add:["$weight",10]
				// 			}, 
				// 			else: "$weight"
				// 		}
				// 	}
				// }
				// pipeline.push(group4);
				pipeline.push({
					$sort:{
						weight:-1
					}
				})
				pipeline.push({
					$limit:10
				})
				console.log(pipeline)
				return pipeline;
			},
			event:function(obj){
				var pipeline=[];
				var m={
					$match:{
						name:new RegExp(obj.search,'i'),
						archived:{$ne:1},
						schedule:{$ne:1}
					}
				}
				if(obj.excludeIds){
					m['$match'].id={$nin:obj.excludeIds};
				}
				pipeline.push(m);
				//add in weighting!
				if(obj.weight){
					var pkeys=Object.keys(obj.weight);
					var pvalues=Object.values(obj.weight);
				}else{
					var pkeys=[];
					var pvalues=[];
				}
				var group={
					$project:{
						name:1,
						pic:1,
						id:1,
						start:1,
						timezone:1,
						lower_name: { $toLower: "$name" }
					}
				}
				group['$project'].weight={
					$cond:{ 
						if: {$in:['$id', pkeys]}, 
						then:{
							$arrayElemAt: [ pvalues, { $indexOfArray: [ pkeys, '$id']}]
						}, 
						else: 1
					} 
				}
				pipeline.push(group);
				var group2={
					$project:{
						name:1,
						pic:1,
						id:1,
						start:1,
						pending:1,
						timezone:1,
						lower_name: 1,
						weight:1
					}
				}
				group2['$project'].match={$indexOfBytes: ["$lower_name", obj.search]};
				pipeline.push(group2);
				//now combine!
				var now=Math.floor(new Date().getTime()/1000);
				var group3={
					$project:{
						name:1,
						pic:1,
						id:1,
						start:1,
						timezone:1,
						weight:{
							$cond:{
								if: { $eq: [ "$match", 0 ]}, 
								then:{
									$add:["$weight",10]
								}, 
								else: "$weight"
							} 
						},
						timeDiff:{
							$abs:{
								$subtract:["$start",now]
							}
						}
					}
				}
				pipeline.push(group3);
				//now add in weighting based on date of event
				var group4={
					$project:{
						name:1,
						pic:1,
						id:1,
						weight:1,
						timezone:1,
						start:1,
						//timeDiff:1,
						weight:{
							$cond:{
								if: { $lt: [ "$timeDiff", (60*60*24*7) ]}, 
								then:{
									$add:["$weight",20]
								}, 
								else:{
									$cond:{
										if: { 
											$lt: [ "$timeDiff", (60*60*24*30) ]
										}, 
										then:{
											$add:["$weight",10]
										}, 
										else: "$weight"
									}
								}
							}
						}
					}
				}
				pipeline.push(group4);

				// pipeline.push({
				// 	$sort:{
				// 		weight:-1
				// 	}
				// })
				pipeline.push({
					$sort:{
						weight:-1,
						timeDiff:1
					}
				})
				pipeline.push({
					$limit:10
				})
				return pipeline;
			},
			post:function(obj){
				var pipeline=[];
				var pages=[];
				if(obj.friends) pages=obj.friends;
				if(obj.pages) pages=pages.concat(obj.pages);
				var narrowmatch={
					$match:{
						$or:[{
							'by.id':{
								$in:pages
							}
						},{
							'page.id':{
								$in:pages
							}
						}]
					}
				}
				//r.write(r,{obj:obj,narrowmatch:narrowmatch});
				if(pages.length) pipeline.push(narrowmatch)
				var m={
					$match:{
						message:new RegExp(obj.search,'i')
					}
				}
				pipeline.push(m);
				//add in weighting!
				if(obj.weight){
					var pkeys=Object.keys(obj.weight);
					var pvalues=Object.values(obj.weight);
				}else{
					var pkeys=[];
					var pvalues=[];
				}
				var schema=r.tools.getSchema('post');
				var order={}
				for (var i = 0; i < schema.order.length; i++) {
					order[schema.order[i]]=1;
				}
				var group={
					$project:order
				}
				group['$project'].weight={
					$cond:{ 
						if: {$in:['$id', pkeys]}, 
						then:{
							$arrayElemAt: [ pvalues, { $indexOfArray: [ pkeys, '$id']}]
						}, 
						else: 1
					} 
				}
				pipeline.push(group);
				// var group2={
				// 	$project:{
				// 		name:1,
				// 		pic:1,
				// 		id:1,
				// 		pending:1,
				// 		lower_name: 1,
				// 		weight:1
				// 	}
				// }
				// group2['$project'].match={$indexOfBytes: ["$lower_name", obj.search]};
				// pipeline.push(group2);
				//now combine!
				// var group3={
				// 	$project:{
				// 		name:1,
				// 		pic:1,
				// 		id:1,
				// 		weight:{
				// 			$cond:{
				// 				if: { $eq: [ "$match", 0 ]}, 
				// 				then:{
				// 					$add:["$weight",10]
				// 				}, 
				// 				else: "$weight"
				// 			} 
				// 		}
				// 	}
				// }
				// pipeline.push(group3);
				pipeline.push({
					$sort:{
						weight:-1
					}
				})
				pipeline.push({
					$limit:10
				})
				//r.write(r,{pipeline:pipeline})
				return pipeline;
			},
			default:function(obj){
				var pipeline=[];
				var m={
					$match:{
						name:new RegExp(obj.search,'i')
					}
				}
				if(obj.excludeIds){
					m['$match'].id={$nin:obj.excludeIds};
				}
				pipeline.push(m);
				//add in weighting!
				if(obj.weight){
					var pkeys=Object.keys(obj.weight);
					var pvalues=Object.values(obj.weight);
				}else{
					var pkeys=[];
					var pvalues=[];
				}
				var group={
					$project:{
						name:1,
						pic:1,
						id:1,
						lower_name: { $toLower: "$name" }
					}
				}
				group['$project'].weight={
					$cond:{ 
						if: {$in:['$id', pkeys]}, 
						then:{
							$arrayElemAt: [ pvalues, { $indexOfArray: [ pkeys, '$id']}]
						}, 
						else: 1
					} 
				}
				pipeline.push(group);
				var group2={
					$project:{
						name:1,
						pic:1,
						id:1,
						pending:1,
						lower_name: 1,
						weight:1
					}
				}
				group2['$project'].match={$indexOfBytes: ["$lower_name", obj.search]};
				pipeline.push(group2);
				//now combine!
				var group3={
					$project:{
						name:1,
						pic:1,
						id:1,
						weight:{
							$cond:{
								if: { $eq: [ "$match", 0 ]}, 
								then:{
									$add:["$weight",10]
								}, 
								else: "$weight"
							} 
						}
					}
				}
				pipeline.push(group3);
				pipeline.push({
					$sort:{
						weight:-1
					}
				})
				pipeline.push({
					$limit:10
				})
				return pipeline;
			}
		},
		ensureWeights:function(r,cb){
			db.search_weight_cache.findOne({id:r.auth.uid},function(data){
				if(data&&!methods.expired(data)){
					cb();
				}else{
					self.createWeight(r,function(){
						cb();
					});
				}
			})
		},
		expired:function(data){

		},
		weightRsvps:function(obj,cb){
			var past=(1000*60*60*24*10);//10 days in paste
			var future=(1000*60*60*24*60);//60 days in paste
			var q={
				uid:obj.r.auth.uid,
				start:{
					$gte:new Date(new Date().getTime()-past),
					$lte:new Date(new Date().getTime()+future)
				}
			}
			db.event_rsvp.find(q,function(err,data){
				obj.r.tools.db.toOrderedList(data,'id',function(data){
					if(data){
						var ct=new Date().getTime();
						var d={};
						for(var key in data.list){
							var item=data.list[key];
							var st=new Date(item.start).getTime();
							var diff=((ct-st)/1000)/(60*60);//hours
							var adiff=Math.abs(diff);
							var weight=1;
							switch(true){
								case adiff<12:
									weight=5;
								break;
								case adiff<(24*2):
									weight=3;
								break;
								case adiff<(24*7):
									weight=2;
								break;
							}
							d[item.eid]=weight;
						}
						cb(null,d);
					}else{
						cb(null,false);
					}
					//obj.r.write(obj.r,{success:true,data:data});
				})
			})
		},
		getPeopleScopes:function(obj,cb){
			var scopes=obj.r.qs.scopes;
			if(scopes.pages){
				var q={page:{$in:scopes.pages}};
				db.page_follow.find(q,function(err,data){
					obj.r.tools.db.toOrderedList(data,'uid',function(data){
						//obj.r.write(obj.r,{success:true,data:data});
						if(data){
							cb(null,{id:{$in:data.order}});
						}else{
							cb(null,false);
						}
					});
				})
			}else{
				cb(null,false);
			}
		},
		getOnepass:function(obj,cb){
			db.page.find({admin:{$in:[obj.r.auth.uid]}},function(err,data){
				obj.r.tools.db.toOrderedList(data,'id',function(data){
					//obj.r.write(obj.r,{success:true,data:data});
					if(data){
						cb(null,{pages:data.order});
					}else{
						cb(null,false);
					}
				});
			})
		},
		weightFriends:function(obj,cb){
			if(db.user_friends){
				db.user_friends.findOne({id:obj.r.auth.uid},{friends:1},function(err,data){
					var d={}
					if(data&&data.friends) for (var i = 0; i < data.friends.length; i++) {
						var f=data.friends[i];
						d[f]=5;
					}
					cb(null,d)
				})
			}else{
				console.log('user_friends not configured');
				cb(null,{})
			}
		},
		weightPages:function(obj,cb){
			//db.user_follow.findOne({id:obj.r.auth.uid},{following:1},function(err,data){
				// var d={}
				// if(data&&data.following.length){
				// 	for (var i = 0; i < data.following.length; i++) {
				// 		var f=data.following[i];
				// 		d[f]=5;
				// 	}
				// }
				//obj.r.write(obj.r,{success:true,qs:obj.r.qs});
				if(obj.r.qs.page_permission){//only return the pages that this user has access to
					//obj.r.write(obj.r,{success:true,qs:obj.r.qs});
					//find permisssions that satisfy
					// var q={
					// 	$or:[{
					// 		'page.id':{$in:Object.keys(d)},
					// 		identity:'members',
					// 		scopes:{
					// 			$in:obj.r.qs.page_permission
					// 		}
					// 	},{
					// 		'page.id':{$in:Object.keys(d)},
					// 		identity:'members',
					// 		scopes:["*"]
					// 	},{
					// 		'page.id':{$in:Object.keys(d)},
					// 		identity:obj.r.auth.uid,
					// 		scopes:{
					// 			$in:obj.r.qs.page_permission
					// 		}
					// 	},{
					// 		'page.id':{$in:Object.keys(d)},
					// 		identity:obj.r.auth.uid,
					// 		scopes:['*']
					// 	},{
					// 		'page.id':{$in:Object.keys(d)},
					// 		identity:'admins',
					// 		scopes:['*']
					// 	}]
					// }
					//get pages i am an admin for!
					db.page.find({admins:{$in:[obj.r.auth.uid]}},{id:1},function(err,adata){
						//obj.r.write(obj.r,{success:true});
						if(adata){
							obj.r.tools.db.toOrderedList(adata,'id',function(adata){
								var ret={};
								if(adata&&adata.order) for (var i = adata.order.length - 1; i >= 0; i--) {
									var key=adata.order[i];
									ret[key]=1;
								}
								//obj.r.write(obj.r,{success:true,ret:ret});
								cb(null,ret);//nothing
							})
						}else{
							cb(null,{});//nothing
						}
						// obj.r.tools.db.toOrderedList(adata,'id',function(adata){
						// 	if(adata){
						// 		q['$or'].push({
						// 			'page.id':{$in:adata.order},
						// 			identity:'admins',
						// 			scopes:{
						// 				$in:obj.r.qs.page_permission
						// 			}
						// 		})
						// 	}
						// 	//obj.r.write(obj.r,{success:true,q:q});
						// 	db.permission.find(q,function(err,pdata){
						// 		obj.r.tools.db.toOrderedList(pdata,'id',function(pdata){
						// 			//obj.r.write(obj.r,{success:true,data:pdata});
						// 			if(pdata){
						// 				var ret={}
						// 				for (var i = 0; i < pdata.order.length; i++) {
						// 					var it=pdata.list[pdata.order[i]];
						// 					ret[it.page.id]=1;
						// 				}
						// 				//obj.r.write(obj.r,{success:true,ret:ret});
						// 				cb(null,ret);//nothing
						// 			}else{
						// 				cb(null,{});//nothing
						// 			}
						// 		});
						// 	})
						// })
					});
				}else{
					cb(null,{})
				}
			//})
		},
		weightActivity:function(obj,cb){
			var limit=1000*60*60*24*30;//1 month in past
			var pipeline=[];
			pipeline.push({
				$match:{
					uid:obj.r.auth.uid,
					_id:{
						$gte:obj.r.tools.db.toId(obj.r.tools.db.objectIdFromDate(new Date(new Date().getTime()-(limit))))
					}
				}
			})
			pipeline.push({
				$group:{
					_id:{
						id:'$object.id',
						type:'$object.type'
					},
					weight:{
						$sum:'$weight'
					}
				}
			})
			db.search_weight.aggregate(pipeline,function(err,resp){
				//add friends pages that are being followed
				if(err){
					cb(null,{error:err})
				}else{
					var weighted={};
					for (var i = 0; i < resp.length; i++) {
						var item=resp[i];
						if(!weighted[item._id.type]) weighted[item._id.type]={};
						//limit here
						if(item.weight>10) item.weight=10;//otherwise it can get out of hand
						weighted[item._id.type][item._id.id]=item.weight;
					}
					cb(null,weighted);
			  	}
			})
		},
		combineWeights:function(data){
			var d={};
			for(var key in data){
				var rdata=data[key];
				if(rdata){
					if(key=='activity'){
						for(var tk in rdata){
							var tdata=rdata[tk];
							if(tdata){
								if(!d[tk]) d[tk]={};
								for(var ik in tdata){
									if(!d[tk][ik]) d[tk][ik]=0;
									d[tk][ik]+=tdata[ik];
								}
							}
						}
					}else{
						if(!d[key]) d[key]={};
						for(var tk in rdata){
							if(!d[key][tk]) d[key][tk]=0;
							d[key][tk]+=rdata[tk];
						}
					}
				}
			}
			return d;
		},
		createSearchWeight:function(r,cb){
			//take into account rsvps
			//take into account friends
			//aggregation
			if(!r.auth.uid){
				return cb({});
			}
			var async=require('async');
			var jobs={};
			jobs.activity=async.apply(function(tobj,cb){
				methods.weightActivity(tobj,cb);
			},{
				r:r
			});
			if(r.qs.scopes){//pages,friends,...
				jobs.scopes=async.apply(function(tobj,cb){
					methods.getPeopleScopes(tobj,cb);
				},{
					r:r
				});
			}
			if(r.qs.onepass){
				jobs.onepass=async.apply(function(tobj,cb){
					methods.getOnepass(tobj,cb);
				},{
					r:r
				});
			}
			if(r.qs.filters.indexOf('people')>=0||r.qs.filters.indexOf('post')>=0){
				jobs.person=async.apply(function(tobj,cb){
					methods.weightFriends(tobj,cb);
				},{
					r:r
				});
			}
			if(r.qs.filters.indexOf('event')>=0){
				jobs.event=async.apply(function(tobj,cb){
					methods.weightRsvps(tobj,cb);
				},{
					r:r
				});
			}
			if(r.qs.filters.indexOf('page')>=0||r.qs.filters.indexOf('post')>=0){
				jobs.page=async.apply(function(tobj,cb){
					methods.weightPages(tobj,cb);
				},{
					r:r
				});
			}
			r.tools.parallel(jobs,5,function(err,rdata){
				var friends=false;
				var pages=false;
				var scopes=false;
				if(rdata.person) friends=Object.keys(rdata.person);
				if(rdata.page) pages=Object.keys(rdata.page);
				if(rdata.scopes) scopes=rdata.scopes;
				var weights=methods.combineWeights(rdata);
				cb({weights:weights,friends:friends,pages:pages,scopes:scopes});
			});
			
		}
	}
	if(api[path]&&path[0]!='_'){
		api[path](r,db);
	}else{
		r.write(r,{error:'invalid_method'})
	}
}