modules.webcontext_global={
	views:{},
	groups:{}
}
modules.webcontext=function(options){
	var self=this;
	self.padding=80;
	self.options=options;
	if(!options.render_template) options.render_template='webcontext_item';
	if(options.display&&options.display.template) options.render_template=options.display.template;
	if(options.menu) $.each(options.menu,function(i,v){
		if(v.selected) self.selected=v.id;
	})
	this.show=function(){
		if(!options.display||!options.display.ele){
			if(app.isdev) return _alert('No Ele passed!');
			else return window.onerror('No ele passed to webcontext')
		}
		if(!options.display||!options.display.container){
			if(app.isdev) return _alert('No Container passed!');
			else return window.onerror('No container passed to webcontext')
		}
		if(options.display.ele&&options.display.ele.hasClass('contextmenu')){
			self.id=options.display.ele.data('view');
			return console.log('Already showing')
			//return self.destroy();
		}
		//console.log(options)
		if(options.group&&modules.webcontext_global.groups[options.group]){
			modules.webcontext_global.groups[options.group].destroy();
		}
		self.id=Math.uuid(20);
		modules.webcontext_global.views[self.id]=self;
		if(options.group) modules.webcontext_global.groups[options.group]=self;
		if(options.display.ele){
			options.display.ele.addClass('contextmenu');
			options.display.ele.data('view',self.id);
		}
		if(!options.template||options.display.defaultMenu) options.template='webcontext_content'
		var corner=(options.display.corner)?options.display.corner:{tl:1,tr:1,bl:1,br:1};
		var td=(options.templateData)?options.templateData:{};
		options.display.container.render({
			template:options.template,
			data:$.extend(true,{},options,td,{corner:corner,display:false,padding:self.padding,clean:(options.clean)?1:0}),
			binding:function(ele){
				self.ele=ele;
				ele.find('.x_cancel').stap(function(){
					self.destroy();
				},1,'tapactive')
				self.placeMenu();
				ele.find('.navitemclick').stap(function(){
					self.selected=$(this).attr('data-id');
					self.onSelect();
				},1,'tapactive');
				if(!options.disableMouseOff){
					$('body').on('mousemove',self.checkMouseLocation)
				}
				if(options.renderFunction){
					options.renderFunction(ele.find('.rendercontent'),ele);
					self.updatePlacement();
				}else if(options.menu&&options.menu.endpoint){
					self.load();
				}else{
					if(options.display&&options.display.binding) options.display.binding(ele);
					if(options.binding) options.binding(ele);
				}
			}
		})
	}
	this.inBounds=function(e){
		var location=self.ele.offset();
		location.right=location.left+self.ele.outerWidth();
		location.bottom=location.top+self.ele.outerHeight();
		var cursor={
			x:e.clientX,
			y:e.clientY
		}
		if(cursor.x<location.right&&cursor.x>location.left&&cursor.y>location.top&&cursor.y<location.bottom){
			return true;
		}else{
			return false;
		}
	}
	this.enable=function(){
		self.enabled=true;
	}
	this.disable=function(){
		self.enabled=false;
	}
	this.getCurrent=function(){
		return self.selected;
	}
	this.getData=function(selected){
		var data={};
		if(self.options.menu){
			$.each(self.options.menu,function(i,v){
				if(v.id==selected) data=v;
			})
		}
		return data;
	}
	this.load=function(){
		if(options.menu.infinitescroller){
			if(!options.menu.template){
				return console.warn('no template passed!');
			}
			var opts=(options.menu.endpointOpts)?options.menu.endpointOpts:{};
			self.inf=new modules.infinitescroll({
                ele:self.ele.find('.endpointreults'),
                endpoint:options.menu.endpoint,
                loaderClass:'lds-ellipsis-black',
                offset:'200%',
                clearOnResume:true,
                opts:opts,
                max:12,//ensures grid
                template:options.menu.template,
                endOfList:' ',
                nodata:(options.menu.nodata)?options.menu.nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>Nothing here yet.</div></div>',
                onPageReady:function(ele){
                	ele.find('.rowitem').stap(function(){
                		var id=$(this).attr('data-id');
                		var data=self.inf.getById(id);
                		if(data){
                			if(self.options.onSelect) self.options.onSelect(id,data);
                			else console.warn('no onSelect');
                			self.destroy();
                		}else{
                			console.warn('invalid ID or data');
                		}
                	},1,'tapactive')
                    if(options.menu.binding){
                    	options.menu.binding(ele);
                    }
                },
                scrollBindings:{
                    scrollStart:function(){
                    },
                    scroll:function(obj){
                    }
                }
            });
		}else{
			self.apiLoad();
		}
	}
	this.apiLoad=function(){
		_ui.pageloader.render({theme:false,themeClass:'lds-ellipsis-black'},self.ele.find('.endpointreults'),1);
		app.api({
            url:options.menu.endpoint,
            data:{
            },
            timeout:5000,
            callback:function(resp){
            	if(resp.success){
            		self.ele.find('.endpointreults').render({
            			template:options.menu_template,
            			data:{
            				resp:resp
            			},
            			append:false,
            			binding:function(ele){
            				ele.find('.x_cancel').stap(function(){
								self.destroy();
							},1,'tapactive')
            				if(options.binding) options.binding(ele,resp);
            				if(options.menu.binding){
		                    	options.menu.binding(ele);
		                    }
            			}
            		})
            	}else{
            		modules.loadError({
		                ele:self.ele.find('.endpointreults'),
		                error:resp.error,
		                inline:true,
		                onRetry:function(){
		                    self.apiLoad();
		                }
		            })
            		//_alert('error loading, try again.')
            	}
            }
        });
	}
	this.hide=function(){
		self.destroy();
	}
	this.onSelect=function(){
		if(self.options.onEndAnimationSelect){
			if(self.selected){
				self.options.onEndAnimationSelect(self.selected,self.getData(self.selected));
			}else{
				console.warn('nothing selected?')
			}
		}
		if(self.options.onEndAnimationSubSelect){
			if(self.subselected){
				self.options.onEndAnimationSubSelect(self.subselected,self.getData(self.subselected.parent));
			}
		}
		if(self.options.onSelect){
			self.options.onSelect(self.selected,self.getData(self.selected));
		}
		self.destroy();
	}
	this.checkMouseLocation=function(e){
		if(self.inBounds(e)){
			//console.log('inbounds')
		}else{
			self.destroy();
		}
	}
	this.destroy=function(){
		if(modules.webcontext_global.views[self.id]){
			$('body').off('mousemove',self.checkMouseLocation)
			if(options.display.ele) options.display.ele.removeClass('contextmenu');
			modules.webcontext_global.views[self.id].ele.remove();
			delete modules.webcontext_global.views[self.id];
		}
		if(modules.webcontext_global.groups[options.group]) delete modules.webcontext_global.groups[options.group];
		if(options.onHide) options.onHide();
	}
	this.getViewData=function(type,force){
		var view={};
		var padding=self.padding;
		switch(type){
			case 'topright':
				view.top=self.button.top+self.button.height;
				view.top-=padding;
				var rightedge=self.button.left+self.button.width;
				view.left=rightedge-self.width;
				view.left+=padding;
				//arrow
				view.arrow={
					top:-10,
					left:self.ele.find('.webcontextbox').width()-(self.button.width/2),
					orient:'top'
				}
			break;
			case 'topcenter':
				view.top=self.button.top+self.button.height;
				var rightedge=self.button.left+self.button.width/2;
				view.left=rightedge-self.width/2;
				//arrow
				view.top-=padding;
				view.left+=padding/2;
				//arrow
				view.arrow={
					top:-10,
					left:self.ele.find('.webcontextbox').width()/2,
					orient:'top'
				}
			break;
			case 'topleft':
				view.top=self.button.top+self.button.height;
				view.left=self.button.left;
				view.top-=padding;
				view.left-=padding;
				//arrow
				view.arrow={
					top:-10,
					left:25,
					orient:'top'
				}
			break;
			case 'topleftmatch':
				view.top=self.button.top+self.button.height;
				view.left=self.button.left;
				view.top-=padding;
				view.left-=padding;
			break;
			case 'bottomleft':
				view.top=self.button.top-self.height-10;
				view.left=self.button.left;
				view.top-=padding;
				view.left-=padding;
			break;
			case 'bottomright':
				view.top=self.button.top-self.height-10;
				view.top-=padding;
				var rightedge=self.button.left+self.button.width;
				view.left=rightedge-self.width;
				view.left+=padding;
			break;
			default:
				console.warn('INvalid View type ['+type+']');
			break;
		}
		if(options.display.offset){
			if(options.display.offset.left) view.left+=options.display.offset.left;
			if(options.display.offset.top) view.top+=options.display.offset.top;
		}
		view.width=self.width;
		view.height=self.height;
		view.container={
			width:options.display.container.width(),
			height:options.display.container.height()
		}
		//console.log(view)
		if(!options.display.noCheck){
			if(!self.withinView(view)&&!force) return false;
		}
		return view;
	}
	this.withinView=function(view){
		var points=[];
		points.push({//top left
			y:view.top+self.padding,
			x:view.left+self.padding
		})
		points.push({//top right
			y:view.top+self.padding,
			x:view.left+view.width-self.padding
		})
		points.push({//bottom left
			y:view.top+view.height-self.padding,
			x:view.left+self.padding
		})
		points.push({//bottom right
			y:view.top+view.height-self.padding,
			x:view.left+view.width-self.padding
		})
		var within=0;
		$.each(points,function(i,v){
			if(v.x>0&&v.x<view.container.width&&v.y>0&&v.y<view.container.height) within++;
		})
		if(within==4) return true;
		return false;
	}
	this.setView=function(){
		self.button=options.display.ele.relativeOffset(options.display.container);
		if(options.display.ele[0].nodeName=='text'){
			var bounds=options.display.ele[0].getBoundingClientRect();
			self.button.width=bounds.width;
			self.button.height=bounds.height;
		}else{
			self.button.width=options.display.ele.outerWidth();
			self.button.height=options.display.ele.outerHeight();
		}
		self.width=self.ele.outerWidth();
		self.height=self.ele.height();
		self.scrollTop=options.display.container.scrollTop();
	}
	this.getViewInfo=function(){
		self.setView();
		var view='';
		$.each(options.display.locations,function(i,v){
			if(view) return true;//already have a fitting match!
			view=self.getViewData(v);
		});
		if(!view) view=self.getViewData(options.display.locations[0],1);//ensure something return
		return view;
	}
	this.updatePlacement=function(ele){
		if(ele) options.display.ele=ele;
		self.setView();
		self.placeMenu();
	}
	this.getArrowColor=function(border){
		if(border){
			return (options.arrowBorderColor)?options.arrowBorderColor:'#ccc';
		}else{
			return (options.arrowColor)?options.arrowColor:'white';
		}
	}
	this.getArrowCss=function(loc,border){
		var s=(border)?12:10;
		var d={};
		switch(loc.orient){
			case 'top':
				d.top=((border)?loc.top-2:loc.top),
				d.left=(border)?loc.left-1:loc.left,
				d.marginLeft=-s/2;
				d.display='block'
				d.borderBottom=s+'px solid '+self.getArrowColor(border)
				d.borderLeft=s+'px solid transparent';
				d.borderRight=s+'px solid transparent';
			break;
		}
		//console.log(d)
		return d;
	}
	this.placeMenu=function(ele){
		if(!options.display.locations){
			options.display.locations=['topright','bottomright','topleft','bottomleft']
		}
		var view=self.getViewInfo();
		self.ele.css({
			top:view.top,
			left:view.left
		});
		if(view.arrow){
			self.ele.find('.webcontextbox').css('marginTop','10px');
			self.ele.find('.contextarrow').css(self.getArrowCss(view.arrow))
			self.ele.find('.contextarrow_border').css(self.getArrowCss(view.arrow,1))
		}
		//console.log(view);
	}
}