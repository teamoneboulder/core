module.exports=function(path,r,db){
	var api={
		token:function(r,db){
			if(!r.tools.settings.prod&&r.qs.session=='most_recent'){
				db.opentok_session.find({},{sort:{_id:-1},limit:1},function(err,resp){
					if(resp){
						r.tools.db.toOrderedList(resp,'_id',function(tdata){
							var recent=tdata.list[tdata.order[0]]
							//return r.write(r,{success:true,resp:tdata});
							var token = r.tools.opentok.getToken(recent.id);
							r.write(r,{success:true,session:recent.id,token:token});
						})
					}else{
						r.write(r,{error:'invalid_session'});
					}
				})
			}else{
				db.opentok_session.findOne({id:r.qs.session},function(err,resp){
					if(resp){
						var token = r.tools.opentok.getToken(r.qs.session);
						r.write(r,{success:true,session:r.qs.session,token:token});
					}else{
						r.write(r,{error:'invalid_session'});
					}
				})
			}
		},
		createsession:function(r,db){
			//r.write(r,{error:'here'})
			var opts={};
			r.tools.opentok.createSession(opts,function(err,session){
				if(err){
					return r.write(r,{error:'Error: '+err});
				}
				 db.opentok_session.save({id:session.sessionId,uid:r.auth.uid}, function(err,resp){
				 	if(err) return r.write(r,{error:'Error: '+err});
				 	var token = r.tools.opentok.getToken(session.sessionId);
				 	r.write(r,{success:true,session:session.sessionId,token:token});
				 });
			});
		}
	}
	if(api[path]&&path[0]!='_'){
		api[path](r,db);
	}else{
		r.write(r,{error:'invalid_method'})
	}
}