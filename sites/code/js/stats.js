modules.stats={
	data:{
		pageinfo:{},
		countinfo:{},
		time:0
	},
	current:{},
	current_timer:'',
	user_timer:'',
	init:function(){
		var self=this;
		self.user_timer=new Date().getTime()
	},
	start:function(){
		var self=this;
		var ct=new Date().getTime();
		self.user_timer=ct//reset! timers
		self.current_timer=ct
	},
	setPage:function(view,page){
		var self=this;
		if(page){
			var curid=view+'_'+page;
		}else{
			var curid=view;
		}
		if(curid!=self.current.id){//start/clear timer!
			app.log('STATS PAGE: '+curid,'stats');
			var ct=new Date().getTime();
			if(self.current_timer){
				var diff=Math.floor((ct-self.current_timer)/1000);
				if(!self.data.pageinfo[self.current.id]) self.data.pageinfo[self.current.id]=0;
				self.data.pageinfo[self.current.id]+=diff;
			}
			self.current_timer=ct;
		}
		self.current={
			id:curid,
			view:view,
			page:page
		};
	},
	incCount:function(type){
		if(!this.data.countinfo[type]) this.data.countinfo[type]=0;
		this.data.countinfo[type]++;
	},
	submit:function(){
		var self=this;
		var ct=new Date().getTime();
		self.data.time=parseFloat(Math.floor((ct-self.user_timer)/1000).toFixed(0));
		if(self.current_timer){
			var diff=parseFloat(Math.floor((ct-self.current_timer)/1000).toFixed(0));
			if(!self.data.pageinfo[self.current.id]) self.data.pageinfo[self.current.id]=0;
			self.data.pageinfo[self.current.id]+=diff;
			self.current_timer=ct//reset timer
		}
		self.user_timer=ct//clear out
		var data=$.extend(true,{},self.data);
		self.clearData();
		var max=app.user.pingInterval()/1000;//need in non JS time
		$.each(data.pageinfo,function(i,v){
			if(v>max) data.pageinfo[i]=max;//really ensure it doesnt go over
		});
		if(data.time>max){
			data.time=max;
		}
		//if(app.isdev) console.log('====>'+data.time)
		return data;
	},
	clearData:function(){
		//self.current={};
		this.data={
			pageinfo:{},
			countinfo:{},
			time:0
		};
	}
}