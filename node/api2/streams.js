module.exports=function(path,r,db){
	var api={
		favorites:function(r,db){
			db.content_filter.findOne({id:r.auth.uid},function(err,data){
				if(data&&data.filters&&data.filters.order&&data.filters.order.length){
					//internal api call
					var jobs={}
					var async=require('async');
					for (var key in data.filters.list) {
						var filter=data.filters.list[key].filter;
						if(filter.location&&filter.location.gps){//use up-to-date location
							filter.location.coords=[r.qs.coords.lng,r.qs.coords.lat];
						}
						jobs[key]=async.apply(function(tfilter,cb){
							var url='https://'+r.tools.settings.api+'/one_core/module/stream_subview/feed/'
							var data={
								filter:tfilter,
								max:5,
								appid:r.qs.appid,
								token:r.qs.token
							}
							r.tools.post(url,data,false,1,function(data){
								cb(null,data);
							})
						},filter)
					}
					r.tools.parallel(jobs,5,function(err,rdata){
						r.write(r,{success:true,data:{
							list:rdata,
							order:data.filters.order,
							rows:data.filters.list
						}});
					});
				}else{
					r.write(r,{error:'no_saved_favorites'});
				}
			});
		},
		_aggregate:function(r,db,friends,cb){
			var filter=r.qs.filter;
			var max=(r.qs.max)?parseInt(r.qs.max,10):10;
			if(r.qs.last){
				var next=parseInt(r.qs.last)+max;
			}else{
				var next=max;
			}
			var pipeline=[];
			var q={};
			// if(filter.tags){
			// 	q.tags={$in:filter.tags}
			// }
			if(filter.categories){
				q.tags={$in:filter.categories};
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
			if(filter&&filter.location&&filter.location.coords){//ok to not have coords here!
				var dist=(parseInt(filter.distance)*1.60934)*1000;
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
			}else{
				pipeline.push({
					$match:api._buildAndQuery(q)
				})
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
			//r.write(r,{pipeline:pipeline})
			var coll=db.post;
			if(!r.tools.conf.prod){
				coll=db.test_post;
			}
			r.write(r,{pipeline});
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
		},
		_buildAndQuery:function(data){
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
	}
	if(api[path]&&path[0]!='_'){
		api[path](r,db);
	}else{
		r.write(r,{error:'invalid_method'})
	}
}