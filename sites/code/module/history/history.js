modules.history=function(options){
	var self=this;	
	self.options=options;
	//self.states=[];
	this.init=function(){
		self.session=Math.uuid(12);
		//History.Adapter.bind(window,'statechange',self.onStateChange);
		if(window.History&&History.Adapter){
			History.Adapter.bind(window,'statechange',self.onStateChange);
		}else{
			window.onpopstate = self.onStateChange
		}
	}
	this.onStateChange=function(e){
		if(!self.active) return console.log('History not active yet, dont process onStateChange','navigation')
		var hs=History.getState();
		var cs=window.history.state;
		//self.states.push(cs);
		var o=self.getStateData();
        self.lastState=self.currentState;
        self.currentState=o;
        self.currentHash='/'+self.currentState.join('/');
		if(hs.data){
			//console.log(hs.data.session,self.session)
			//if(hs.data.session==self.session){
				if(!modules.history.forward){
					//if(self.states.indexOf(cs)>=0){//already viewed page
						phi.log('view already looked at...try to load it','navigation');
						//self.loadPage();
						self.go(self.currentHash);
						return false;
					//}
				}
			// }else if(hs.data.session!=self.session){//page was not loaded within this session try to load
			// 	phi.log('view not loaded within this session, try to load???','navigation')
			// 	//self.loadPage();
			// 	//self.go(self.currentHash);
			// 	return false;
			// }
		}
		modules.history.forward=false;
        //app.prefs.set('lasthash',self.currentHash);
        // console.log(self.currentHash)
        // console.log('historychange');
	}
	this.setWeight=function(type,id,weight,weight_only){
		//console.log('SET WEIGHT ['+type+']['+id+']')
        if(!weight){
            console.warn('invalid Weight ['+weight_type+']!');
        }
        modules.api({
            url:app.sapiurl+'/user/sethistory',
            data:{
                type:type,
                id:id,
                weight:(weight)?weight:'',
                weight_only:(weight_only)?weight_only:''
            },
            success:function(resp){
                if(resp.success&&resp.data){//will also do websocket
                    app.user.profile.history=resp.data;
                }
            }
        }) 
    }
	this.getApp=function(){
		var o=self.getStateData();
        return o[0];
	}
	this.isAppPage=function(){
		var o=self.getStateData();
		var tapps=app.getApps();
		var extra=['directory','pollinator','facebook']
		if(tapps.order.indexOf(o[0])>=0||extra.indexOf(o[0])>=0) return true;
		return false;
	}
	this.getPage=function(){
		var o=self.getStateData();
        return o[1];
	}
	this.start=function(cb){
		self.active=1;
		var start=app.startpath.split('/');
		if(start) start.splice(0,1);
		if(start[0]=='') start=[];
		self.currentState=start;
        self.currentHash='/'+self.currentState.join('/');
		if(start&&start[0]){
			self.go(app.startpath,function(){
				if(cb) cb();
				else console.log('nothing to start with impliment app.history.start(cb) callback!')
			});
		}else{
			if(cb) cb();
			else console.log('nothing to start with impliment app.history.start(cb) callback!')
		}
	}
	this.go=function(route_path,nocb,data){
		phi.log('check: '+route_path);
		if(_.isWebLayout()&&route_path.indexOf('/chat/')===0){
			var spd=route_path.split('/chat/');
			if(app.chatmanager.hasChat(spd[1])){
				console.warn('already has chat!');
			}else{
				app.chatmanager.load(spd[1]);
			}
			return false;
		}
		//check registered routes!
		if(options.routes){
			var match=0;
			for (var i = 0; i < options.routes.length; i++) {
				var route=options.routes[i];
				if(route.path){
					if(route_path.indexOf(route.path)==0){
						if(route.action) route.action(route_path);
						match=1;
					}
				}
			}
			if(match) return false;
		}
		var path=route_path.split('/');
		if(path) path.splice(0,1);
		var route='';
		var route_id='';
		if(window.routes[app.flower_id]&&Object.keys(window.routes[app.flower_id]).length){
			for(var key in window.routes[app.flower_id]){
				if(!window.routes[app.flower_id][key].slug) window.routes[app.flower_id][key].slug=key;
				if(window.routes[app.flower_id][key].slug==path[0]){
					route=window.routes[app.flower_id][key];
					route_id=key;
				}
			}
		}
		if(route){
			//figure out if 
			if(route.register){
				route.register();
			}else{
				//see if we have any components already registered on this path!
				var current=false;
				$.each(phiStore.components,function(i,v){
					if(v.component.getRoute){
						console.log('compare ['+route_path+'] to '+v.component.getRoute(1))
						if(route_path.indexOf(v.component.getRoute(1))==0){
							current=v;
						}
					}
				});
				if(current&&false){//disable for now@
					//console.log(current)
					phi.log('Already has route register, just show it!','navigation');
					current.component.show();
					//put z-index on top!!!
				}else{
					var vdata={
						id:path[1],
						route:route_path,
						path:path
					};
					if(data){
						vdata=$.extend(true,{},vdata,data);
					}
					phi.registerView(route_id,{
						renderTo:(_.isWebLayout())?$('#pages')[0]:$('#wrapper')[0],
						data:vdata
					});
				}
			}
		}else{
			if(nocb) nocb();
			console.log('no component found to route to!')
		}
	}
	this.ensurePage=function(){
		var o=self.getStateData();
		switch(o[0]){
			case 'profile':
				modules.viewdelegate.register('profile',{
					id:o[1],
					data:{
						id:o[1]
					}
				})
			break;
			case 'page':
				modules.viewdelegate.register('page',{
					id:o[1],
					data:{
						id:o[1]
					}
				})
			break;
			case 'event':
				modules.viewdelegate.register('event',{
					id:o[1],
					data:{
						id:o[1]
					}
				})
			break;
			case 'fundraiser':
				modules.viewdelegate.register('fundraiser',{
					id:o[1],
					data:{
						id:o[1]
					}
				})
			break;
			case 'connection':
				modules.viewdelegate.register('connection',{
					id:o[1],
					data:{
						id:o[1]
					}
				})
			break;
			case 'post':
				modules.viewdelegate.register('post',{
					id:o[1],
					load:true,
					data:{
						id:o[1]
					}
				})
			break;
			case 'folder':
				modules.viewdelegate.register('bookmark_folder',{
					id:o[1],
					data:{
						id:o[1]
					}
				})
			break;
			default:
				modules.viewdelegate.load(o);
			break;
		}
		//console.log(o)
	}
	this.getViewState=function(base){
		var o=self.getStateData();
		var bd=base.split('/');
		if(!bd[0]) return o;
		var internal=[];
		var match=bd.length-1;
		var mc=0;
		$.each(o,function(i,v){
			if(v!=bd[i+1]) internal.push(v);
			else mc++;
		})
		if(match!=mc){
			return false
		}
		return internal;
	}
	this.getStateData=function(){
		var state = History.getState(); // Note: We are using History.getState() instead of event.state
        var h=state.hash.split('#');
        var o=h[0].split('/');
        o.splice("",1);
        var t=o[o.length-1].split('?');
        o[o.length-1]=t[0];
        return o;
	}
	this.loadPage=function(){
		//check protected names!
		phi.log('loadPage','navigation');
		alert('loadpage');
		// if(self.isAppPage()){
		// 	app.home.setApp(self.getApp(),self.getPage());
		// }else{
		// 	//console.warn('invalid page type!')
		// 	//see if there is a view registered at this path that just wants to be reshown
		// 	var internal=['user','page','event','connection','fundraiser'];
		// 	if(internal.indexOf(self.getApp())>=0){
		// 		var hash='/'+self.getApp()+'/'+self.getPage()//base url!
		// 	}else{
		// 		var hash='/'+self.getApp();
		// 	}
		// 	var view=modules.viewdelegate.getViewByHash(hash);
		// 	if(view){//setpage!
		// 		//ensure this page is overall showing
		// 		modules.viewdelegate.setPage(view.id,1);
		// 		//ensure this page internal nav is corrent
		// 		var o=self.getStateData();
		// 		if(view.view.setPage){
		// 			if(view.view.state_manager){
		// 				var state=view.view.state_manager.getPageState();
		// 				view.view.setPage(state[0],1);
		// 				phi.log('setPage ['+view.id+']:'+state[0],'navigation');
		// 			}else{
		// 				view.view.setPage(o[o.length-1],1);
		// 				phi.log('setPage ['+view.id+']:'+o[o.length-1],'navigation');
		// 			}
		// 		}else console.warn('no internal setPage for ['+view.id+']')
		// 		//internal!
		// 	}else{
		// 		self.ensurePage();
		// 	}
		// }
		//load from server!?
	}
	this.setPage=function(o){
		self.set(o);
		self.loadPage();
	}
	this.set=function(o){
		if(!o.data) o.data={};
		if(!o.title) o.title='App';
		if(!o.intent){
			return console.warn('No Intent Set');
		} 
		o.data.session=self.session;
		//dont push on load if location is same!
		var cs=History.getState();
		var check=window.location.origin+o.intent;
		if(check==cs.url){
			//console.log('State already correct!');
		}else{
			modules.history.forward=true;
			if(o.state){
				self.setWeight(o.state.type,o.state.id,1);
			}else{
				console.warn('no history state passed')
			}
			if(isPhoneGap()){
				//alert(o.intent);
				var o=o.intent.split('/');
				delete o[0];
				self.lastState=self.currentState;
		        self.currentState=o;
		        self.currentHash=self.currentState.join('/');
		        //alert(self.currentHash);
		        //self.onStateChange();
				//History.pushState(o.data, o.title,app.starturl);
			}else{
				History.pushState(o.data, o.title, o.intent);
			}
		}
	}
	self.init();
}