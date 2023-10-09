if(!window.modules) window.modules={};
modules.inlinemenu=function(options){
	var self=this;
	if(!options.render_template) options.render_template='modules_inlinemenu_item';
	self.options=options;
	this.loadMenu=function(){
		if(self.loading) return false;
		self.loading=true;
		app.api({
            url:self.options.endpoint,
            data:{
            },
            timeout:5000,
            callback:function(resp){
            	self.loading=false;
            	if(self.hidden){
            		console.log('hidden before api response, dont render!')
            		return false;
            	}
                if(resp.success){
                	self.loadResponse(resp.data);
                }else{
                    _alert('show retry');
                }
            }
        });
	}
	this.loadResponse=function(data){
		self.ele.find('.content').render({
			template:'modules_inlinemenu_apilist',
			data:{
				data:data,
				render_template:options.render_template
			},
			append:false,
			binding:function(ele){
				ele.find('.inlinemenunavitem').stap(function(){
					var id=$(this).attr('data-id');
					if(self.options.onSelect) self.options.onSelect(id,data.list[id]);
					self.hide();
				},1,'tapactive')
			}
		})
	}
	this.show=function(){
		if(self.options.endpoint){
			var rele=(options.ele)?options.ele:$('body');
			//get position of clickedele relative to renderele
			var poffset=rele.offset();
			var boffset=options.button.offset();
			var top=boffset.top-poffset.top+options.button.outerHeight()+5;//for arrow
			var left=boffset.left+(options.button.width()-5)/2-10;
			if(!options.zIndex) options.zIndex=10000;
			rele.render({
				template:'modules_inlinemenu_api',
				data:$.extend(true,{},{menuTop:top,left:left},options),
				binding:function(ele){
					self.ele=ele;
					TweenLite.to(ele,.2,{background:'rgba(55,55,55,.3)'});
					TweenLite.set(ele.find('.inlinemenu'),{scale:.5,opacity:.8,y:-40,transformOrigin:'50% 0%'});
					TweenLite.to(ele.find('.inlinemenu'),.2,{scale:1,opacity:1,y:0,onComplete:function(){
						ele.find('.clickclose').stap(function(){
							self.hide();
						},1,'tapactive')
					}});
					self.loadMenu();	
				}
			})
		}else{
			var rele=(options.ele)?options.ele:$('body');
			//get position of clickedele relative to renderele
			var poffset=rele.offset();
			var boffset=options.button.offset();
			var top=boffset.top-poffset.top+options.button.outerHeight()+5;//for arrow
			var left=boffset.left+(options.button.width()-5)/2-10;
			if(!options.zIndex) options.zIndex=10000;
			var height=rele.height()-top-50;
			rele.render({
				template:'modules_inlinemenu',
				data:$.extend(true,{},{menuTop:top,left:left,maxHeight:height},options),
				binding:function(ele){
					self.ele=ele;
					TweenLite.to(ele,.2,{background:'rgba(55,55,55,.3)'});
					TweenLite.set(ele.find('.inlinemenu'),{scale:.5,opacity:.8,y:-40,transformOrigin:'50% 0%'});
					TweenLite.to(ele.find('.inlinemenu'),.2,{scale:1,opacity:1,y:0,onComplete:function(){
						ele.find('.clickclose').stap(function(){
							self.hide();
						},1,'tapactive')
					}});
					ele.find('.inlinemenunavitem').stap(function(){
						var id=$(this).attr('data-id');
						self.hide(function(){
							if(self.options.onSelect) self.options.onSelect(id,_.getByKey(options.menu,id,'id'));
						});
					},1,'tapactive')
				}
			})
		}
	}
	this.hide=function(cb){
		self.hidden=true;
		TweenLite.to(self.ele,.2,{background:'rgba(55,55,55,0)'});
		TweenLite.to(self.ele.find('.inlinemenu'),.2,{scale:.5,opacity:0,y:-40,onComplete:function(){
			if(cb) cb();
			self.destroy();
		}})
	}
	this.destroy=function(){
		self.ele.remove();
		delete self;
	}
}