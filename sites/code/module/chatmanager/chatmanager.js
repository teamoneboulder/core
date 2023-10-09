modules.chatmanager=function(options){
	var self=this;
	self.options=options
	this.init=function(){
		options.renderTo.render({
			template:'chatmanager_wrapper',
			binding:function(ele){
				self.ele=ele;
				var oldchats=modules.prefs.get('chatmanager')
				if(oldchats&&oldchats.order&&oldchats.order.length){
					$.each(oldchats.order,function(i,v){
						var chat=oldchats.data[v];
						if(chat) self.add(chat);
					})
				}
			}
		})
	}
	this.hasChat=function(id){
		if(self.chats.list[id]) return true;
		return false;
	}
	this.isActive=function(id){
		if(self.chats.list[id]&&self.chats.list[id].isActive()) return true;
		return false;
	}
	this.clear=function(){
		modules.prefs.set('chatmanager',{});
	}
	this.destroy=function(){
		$.each(self.chats.list,function(i,v){
			if(v.destroy) v.destroy();
			if(self.chatseles[i]) self.chatseles[i].remove();
		})
		//animate hide
		self.ele.remove();
	}
	this.remove=function(chat){
		//cache!
		TweenLite.set(self.chatseles[chat.id],{scale:1,z:1,transformOrigin:'100% 100%'});
		TweenLite.to(self.chatseles[chat.id],.15,{scale:0,onComplete:function(){
			self.chatseles[chat.id].remove();
			self.chats.list[chat.id].destroy();
			self.chats.order.splice(self.chats.order.indexOf(chat.id),1);
			delete self.chats.list[chat.id];
			self.cache();
		}})
	}
	this.cache=function(){
		//return false;//wait
		var data={
			order:$.extend(true,[],self.chats.order),
			data:$.extend(true,{},self.chats.data)
		}
		modules.prefs.set('chatmanager',data);
	}
	this.chatseles={}
	this.chats={
		list:{},
		order:[],
		data:{}
	}
	this.load=function(id){
		modules.api({
	        url:app.sapiurl+'/module/chat/data',
	        data:{
	            id:id
	        },
	        timeout:5000,
	        callback:function(resp){
	            if(resp.success){
	            	self.add(resp.data);
	            }else{
	            	modules.toast({
	            		icon:'icon-warning-sign',
	            		content:resp.error
	            	})
	            }
	        }
	    });
	}
	this.add=function(chat){
		if(!chat.people_list[chat.people[0]]){
			modules.chat_global.onDeletedChat(self.options.identity.data,chat);
            return false;
		}
		//create container!
		if(self.chats.order.indexOf(chat.id)>=0){
			console.warn('Chat window already up!');
			return false;
		}
		if(chat.people.indexOf(app.user.getId())>=0){
			chat.people.splice(chat.people.indexOf(app.user.getId()),1);
		}
		self.ele.find('#chatcontainer').render({
			template:'chatmanager_container',
			binding:function(ele){
				self.chatseles[chat.id]=ele;
				self.chats.order.push(chat.id);
				self.chats.data[chat.id]=chat;
				self.chats.list[chat.id]=new modules.chat($.extend(true,{},{
		            identity:self.options.identity.data,
		            getContainerWidth:function(){
		            	return ele.width();
		            },
		            onClose:function(){
		            	self.remove(chat);
		            }
		        },chat),ele)
		        self.chats.list[chat.id].show();
		        setTimeout(function(){
		        	self.chats.list[chat.id].focus();
		        },20)
		        self.cache()
			}
		})
	}
}