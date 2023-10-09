modules.viewselect=function(options){
	var self=this;
	self.options=options;
	this.init=function(){
		options.ele.render({
			template:'viewselect_button',
			data:{
				current:self.options.types.list[self.options.current],
				types:self.options.types
			},
			binding:function(ele){
				self.ele=ele;
				if(self.options.types.order.length==2){
					ele.find('.togglebtn').stap(function(){
						var type=$(this).attr('data-type');
						self.setView(type);
					},1,'tapactive')
				}else{
					ele.stap(function(){
						var menu=[];
						$.each(self.options.types.order,function(i,v){
							var item=self.options.types.list[v];
							menu.push({
								id:item.id,
								name:item.name,
								icon:item.icon,
								selected:(self.options.current==item.id)?1:0
							})
						})
						if(menu.length==2){//act as toggle
							var ind=self.options.types.order.indexOf(self.options.current);
							if(ind==0) ind=1;
							else if(ind==1) ind=0;
							self.setView(self.options.types.order[ind]);
						}else{
							var alert=new modules.alertdelegate({
								display:{
									ele:$(this),
									container:options.container,
									locations:['topright'],
									corner:{
										bl:1,
										br:1
									}
								},
			                    menu:menu,
			                    onSelect:function(id){
			                        self.setView(id);
			                    }
			                });
			                alert.show();
			            }
					},1,'tapactive')
				}
				if(options.onInit) options.onInit(self.getCurrent());
			}
		})
	}
	this.getCurrent=function(){
		return self.options.current;
	}
	this.setView=function(id){
		self.options.current=id;
		var item=self.getView(id);
		if(self.options.types.order.length==2){
			self.ele.find('.togglebtn').removeClass('selected');
			self.ele.find('[data-type='+id+']').addClass('selected')
		}else{
			self.ele.find('.current').html('<i class="'+item.icon+'"></i> '+item.name);
		}
		if(item.responsive){
			if(options.header) options.header.removeClass('feeditems');
			if(options.list) options.list.removeClass('feeditems');
		}else{
			if(options.header) options.header.addClass('feeditems');
			if(options.list) options.list.addClass('feeditems');
		}
		if(options.onUpdate) options.onUpdate(id,self.getView(id));
	}
	this.getView=function(id){
		return self.options.types.list[id];
	}
	this.getTemplate=function(){
		return self.getView(self.options.current).template;
	}
	this.getResponsive=function(){
		return (self.getView(self.options.current).responsive)?1:0;
	}
	self.init();
}