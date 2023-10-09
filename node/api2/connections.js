module.exports=function(path,r,db){
	var api={
		load:function(r,db){
			db.user_friends.findOne({id:r.auth.uid},{friends:1},function(err,data){
				var friends=[]
				if(data&&data.friends){
					friends=data.friends;
				}
				api._aggregate(r,db,data.friends,function(resp){
					r.write(r,{success:true,data:resp})
				});
			});
		},
		favorites:function(r,db){
			//get favorites for current user
			if(!r.qs.coords){
				return r.write(r,{error:'inavlid_coords'});
			}
			var jobs=[];
			jobs.push(function(cb){
				db.cache.findOne({id:'connection_tags'},function(err,data){
					cb(null,{cache:data});
				});
			})
			jobs.push(function(cb){
				db.user_friends.findOne({id:r.auth.uid},{friends:1},function(err,data){
					var friends=[]
					if(data&&data.friends){
						friends=data.friends;
					}
					cb(null,{friends:friends});
				});
			})
			jobs.push(function(cb){
				db.connect_filter.findOne({id:r.auth.uid},{filters:1},function(err,data){
					var filters={}
					if(data&&data.filters){
						filters=data.filters;
					}
					cb(null,{filters:filters});
				});
			})
			r.tools.parallel(jobs,5,function(err,data){
				if(data&&data.filters&&data.filters.order&&data.filters.order.length){
					var jobs2={};
					var async=require('async');
					for (var i = 0; i < data.filters.order.length; i++) {
						var row=data.filters.order[i];
						var filter=data.filters.list[row].filter;
						if(filter.location.gps){
							filter.location.coords=[r.qs.coords.lng,r.qs.coords.lat];
						}
						//replace category with tags!
						var cat=data.cache.data.list[filter.category];
						filter.categories=r.tools.extend(true,[],cat.connection_children);
						if(!filter.categories) filter.categories=[];
						filter.categories.push(cat.id);
						jobs2[row]=async.apply(function(filter,max,cb){
							r.qs.filter=filter;
							r.qs.max=max;
							api._aggregate(r,db,data.friends,function(resp){
								cb(null,resp);
							});
						},filter,5);
					}
					r.tools.parallel(jobs2,5,function(err,rdata){
						r.write(r,{success:true,data:{
							list:rdata,
							order:data.filters.order,
							rows:data.filters.list
						}});
					});
				}else{
					r.write(r,{error:'no_filters'});
				}
			});
		},
		aggregate:function(r,db){
			var jobs=[];
			jobs.push(function(cb){
				db.cache.findOne({id:'connection_tags'},function(err,data){
					cb(null,{cache:data});
				});
			})
			jobs.push(function(cb){
				db.user_friends.findOne({id:r.auth.uid},{friends:1},function(err,data){
					var friends=[]
					if(data&&data.friends){
						friends=data.friends;
					}
					cb(null,{friends:friends});
				});
			})
			r.tools.parallel(jobs,5,function(err,data){
				//make filters for the different category lists!
				var category=r.path[3];
				if(data.cache.data.order.indexOf(category)>=0){
					var categories=data.cache.data.list[category].connection_children;
					var filter=r.qs.filter;
					var jobs={};
					var catdata={};
					var async=require('async');
					for (var i = 0; i < categories.length; i++) {
						var cat=categories[i];
						var tcat=data.cache.data.list[cat];
						catdata[cat]=r.tools.keepFields(tcat,['name','id']);
						var f=r.tools.extend(true,{},filter);
						f.categories=tcat.connection_children;
						if(!f.categories) f.categories=[];
						f.categories.push(cat);//add parent cat
						jobs[cat]=async.apply(function(filter,max,cb){
							r.qs.filter=filter;
							r.qs.max=max;
							api._aggregate(r,db,data.friends,function(resp){
								cb(null,resp);
							});
						},f,5);
					}
					r.tools.parallel(jobs,5,function(err,data){
						r.write(r,{success:true,data:{
							list:data,
							order:categories,
							tag_list:catdata
						}});
					});
				}else{
					r.write(r,{error:'Invalid Category'});
				}
			})
		},
		_buildAndQuery2:function(data){
			var query={};
			query['$and']=[];
			for(var k in data){
				var v=data[k];
				var q={};
				q[k]=v;
				query['$and'].push(q);
			}
			return query;
		},
		_buildAndQuery:function(dot,tags){
			var query={
				$and:[]
			};
			for (var i = 0; i < tags.length; i++) {
				var v=tags[i];
				var set={};
				set[dot]={$in:[v]}
				query['$and'].push(set);
			}
			return query;
		},
		_aggregate:function(r,db,friends,cb){
			var filter=r.qs.filter;
			var max=(r.qs.max)?parseInt(r.qs.max,10):10;
			if(r.qs.last){
				var next=parseInt(r.qs.last)+max;
			}else{
				var next=max;
			}
			if(filter&&filter.location&&filter.location.coords){
				var pipeline=[];
				var dist=(parseInt(filter.distance)*1.60934)*1000;
				var q={};
				if(filter.tags){
					q.tags={$in:filter.tags}
				}
				if(filter.categories){
					q.tag={$in:filter.categories};
				}
				if(filter.friends){
					if(filter.friends=='friends'){
						q.uid={$in:friends}
					}
					if(filter.friends=='notfriends'){
						var notfriends=r.tools.extend(true,[],friends);
						notfriends.push(r.auth.uid);//dont include myself.
						q.uid={$nin:friends}
					}
				}
				pipeline.push({
					$geoNear:{
						near:{
							type:'Point',
							coordinates:[parseFloat(parseFloat(filter.location.coords[0]).toFixed(6)),parseFloat(parseFloat(filter.location.coords[1]).toFixed(6))]
						},
						query:q,
						distanceField:'dist.calculated',
						key:'loc',
						maxDistance:dist,
						spherical:true
					}
				});
				//r.write(r,{pipeline})

				var userfilters=['age','gender','dating'];
				var userfilter=false;
				for (var i = 0; i < userfilters.length; i++) {
				 	var v=userfilters[i]
				 	if(filter[v]){
						userfilter=true;
					}
				 }
				if(userfilter){
					pipeline.push({
						$lookup:{
							from:'user',
							localField:'uid',
							foreignField:'id',
							as:'user_info'
						}
					});
					pipeline.push({
						$unwind:'$user_info'
					})
					var match={
						$match:{}
					};
				}
				if(filter.age){
					var d = new Date();
					d.setYear(d.getFullYear() - parseInt(filter.age[0]));
					var higher=Math.floor(d.getTime()/1000);
					var d2 = new Date();
					d2.setYear(d2.getFullYear() - parseInt(filter.age[1]));
					var lower=Math.floor(d2.getTime()/1000);
					match['$match']['user_info.birthday_ts']={$gte:lower,$lte:higher};
				}
				if(filter.gender){
					match['$match']['user_info.gender']=filter.gender;
				}
				if(match){
					pipeline.push({
						$match:api._buildAndQuery2(match['$match'])
					});
					pipeline.push({
						$project:{
							user_info:0
						}
					});
				}
				pipeline.push({
					$lookup:{
						from:'user_friends',
						localField:'uid',
						foreignField:'id',
						as:'friendinfo'
					}
				})
				pipeline.push({
					$unwind:{
						path:'$friendinfo'
					}
				})
				// //always add mutual
				var project={
					mutual:{
						$size:{
							$setIntersection:['$friendinfo.friends',friends]
						}
					}
				};
				var schema=r.tools.getSchema('connection');
				for (var i = 0; i < schema.order.length; i++) {
					var item=schema.order[i];
					project[item]=1;
				}
				project.dist=1;
				project.friendinfo=1;
				pipeline.push({
					$project:project
				})
				if(filter.friends_mutual){//matching on friends
					var mutual=parseInt(filter.friends_mutual,10);
					pipeline.push({
						$match:{
							mutual:{$gte:mutual}
						}
					})
				}
				//remove friendinfo
				pipeline.push({
					$project:{
						friendinfo:0
					}
				})
				//user_tags matching!
				if(filter.tag_person){
					pipeline.push({
						$lookup:{
							from:'user_tags',
							localField:'uid',
							foreignField:'id',
							as:'taginfo'
						}
					});
					pipeline.push({
						$unwind:'$taginfo'
					})
					pipeline.push({
						$match:api._buildAndQuery('taginfo.tags',filter.tag_person)
					});
					pipeline.push({
						$project:{
							taginfo:0
						}
					})
					//r.write(r,{pipeline:pipeline});
				}
				//should have some sort...of sort here first
				if(filter.sort){
					switch(filter.sort){
						case 'tsu':
							pipeline.push({
								$sort:{tsu:-1}
							});
						break;
						case 'distance':
							pipeline.push({
								$sort:{'dist.calculated':-1}
							});
						break;
						case 'mutual':
							pipeline.push({
								$sort:{mutual:-1}
							});
						break;
					}
				}else{
					pipeline.push({
						$sort:{tsu:-1}
					});
				}
				if(r.qs.last){//essentially pagination, cant *really* gaurantee order here...
					pipeline.push({
						$skip:parseInt(r.qs.last,10)
					});
				}
				pipeline.push({
					$limit:max
				});

				//after all aggregation complete, graph data!
				pipeline.push({
					$lookup:{
						from:'user',
						localField:'uid',
						foreignField:'id',
						as:'user'
					}
				});
				pipeline.push({
					$unwind:'$user'
				})
				pipeline.push({
					$lookup:{
						from:'tags',
						localField:'tag',
						foreignField:'id',
						as:'tag_info'
					}
				});
				pipeline.push({
					$unwind:'$tag_info'
				})
				//r.write(r,{pipeline:pipeline})
				var coll=db.connection;
				if(!r.tools.conf.prod){
					coll=db.test;
				}
				coll.aggregate(pipeline,function(err,resp){
					if(err){
						cb({error:err})
					}else{
						resp=r.tools.db.toOrderedList(resp,'id',{
							user:['id','name','pic'],
							tag_info:['id','name']
						});
						resp.last=next;
						cb(resp)
				  	}
				})
			}else{
				cb({error:'location_required'});
			}
		}
	}
	if(api[path]&&path[0]!='_'){
		api[path](r,db);
	}else{
		r.write(r,{error:'invalid_method'})
	}
}