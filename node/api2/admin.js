module.exports=function(path,r,db){
	var api={
		stats:function(r,db){
			r.write(r,{success:true})
		}
	}
	r.write(r,{success:true});
	if(api[path]&&path[0]!='_'){
		api[path](r,db);
	}else{
		r.write(r,{error:'invalid_method'})
	}
}