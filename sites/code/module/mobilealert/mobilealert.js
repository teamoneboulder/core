if(!window.modules) window.modules={};
modules.mobilealert_global={
	events:{
		onBeforeShow:function(){},
		onAfterHide:function(){}
	},
	onBeforeShow:function(){
		if(modules.mobilealert_global.events.onBeforeShow) modules.mobilealert_global.events.onBeforeShow()
	},
	onAfterHide:function(){
		if(modules.mobilealert_global.events.onAfterHide) modules.mobilealert_global.events.onAfterHide()
	}
}
modules.mobilealert=function(options){
	if(modules.tools.isWebLayout()) return new modules.webcontext(options);
	var self=this;
	if(!options.render_template) options.render_template='modules_mobilealert_item';
	self.options=options;
	if(app.footerBar) var currentColor=app.footerBar.getCurrent();
	this.show=function(){
		if(modules.keyboard_global) modules.keyboard_global.hide()
		if(options.body){
			rele=$('body');
		}else{
			var rele=(options.ele)?options.ele:$('#wrapper');
		}
		if(!options.title) options.title='Options';
		if(!options.closer) options.closer=true;
		modules.mobilealert_global.onBeforeShow();
		rele.render({
			template:(options.template)?options.template:'modules_mobilealert',
			data:options,
			binding:function(ele){
				self.ele=ele;
				if(options.disableScroll){
					ele.on('touchmove',function(e){
	                	phi.stop(e);
	                })
				}
				ele.on('scroll',function(e){
					stopEvent(e);
				})
				if(!options.disableTouch&&window.Draggable) self.dragger=Draggable.create(ele.find('.swiper'), {
			        type:"y",
			        bounds:{minX:0,maxX:0,minY:0,maxY:300},
			        lockAxis:true,
			        throwProps:true,
			        force3D:true,
			        cursor:'defualt',
			        edgeResistance:1,
			        onDrag:function(){
			        	TweenLite.set(ele.find('.swiper'),{y:0});
			        	TweenLite.set(ele.find('.pane'),{y:this.y});
			        },
			        onDragStart:function(e){
			        },
			        onDragEnd:function(e) {
			        	if(this.endY>80){
			        		if(options.onExit) options.onExit(false,1)
			        		self.hide();
			        	}else{
			        		TweenLite.to(ele.find('.pane'),.3,{y:0});
			        	}
			        }
			    });
			 //    if(!options.disableTouch){
				//     ele.find('.x_closer').stap(function(){
				//     	self.hide();
				//     },1,'tapactive')
				// }
				ele.find('.x_closer').stap(function(){
					if(options.onExit) options.onExit(false,1)
			    	self.hide();
			    },1,'tapactive')
			    TweenLite.set(ele.find('.pane'),{y:'100%'});
				setTimeout(function(){
				    if(app.footerBar) app.footerBar.setColor('white');
					TweenLite.to(ele,.3,{background:'rgba(55,55,55,.3)'})
					TweenLite.to(ele.find('.pane'),.3,{y:'0%'})
				},50)
				if(options.binding){
					options.binding(ele);
				}else if(options.renderFunction){
					options.renderFunction(ele);
				}else if(options.steps){
					//render

            		self.cstep=0;
					self.ensurePage();
					ele.find('.x_next').stap(function(){
						self.nextStep()
					},1,'tapactive')
					ele.find('.x_back').stap(function(){
						self.prevStep()
					},1,'tapactive')
				}else if(!options.menu||!options.menu.endpoint){
					ele.find('.navitem').stap(function(){
						self.selected=$(this).attr('data-id');
						if(self.options.onSelect){
							self.options.onSelect(self.selected,self.getData(self.selected));
						}
						setTimeout(function(){
							self.hide();
						},20)
					},1)
					self.bindTogglers(ele.find('.toggleitem'))
					ele.find('.subnavitem').stap(function(e){
						phi.stop(e);//prvent parent click
						self.subselected={
							type:$(this).attr('data-id'),
							parent:$(this).parents('.navitem').first().attr('data-id')
						}
						setTimeout(function(){
							self.hide();
						},20)
					},1,'tapactive')
				}else{
					self.load();
				}
			}
		})
	}
	this.ensurePage=function(){
		if(!self.cele){
			self.ele.find('.stepscontent').render({
				template:options.display.alert.template,
				data:options.display.alert.tempdata,
				binding:function(ele){
					self.cele=ele;
				}
			})
		}
		var step=options.steps[self.cstep];
		options.renderStep(self.cele,step);
		//
		TweenLite.to(self.cele.find('.tpane'),.3,{x:(self.cstep*100)+'%',onComplete:function(){

		}});
		self.cele.find('.currentstep').html(self.cstep+1);
		self.cele.find('.steptotal').html(options.steps.length);
		self.cele.find('.stepdescription').html(step.description);
		if(self.cstep==0){
			self.cele.find('.x_back').hide();
		}else{
			self.cele.find('.x_back').show();
		}
		if(self.cstep==options.steps.length-1){
			//turn next into finish
			self.cele.find('.x_next').html('Finish');
		}else{
			self.cele.find('.x_next').html('Next');
		}
	}
	this.nextStep=function(){
		if(options.steps[self.cstep+1]){
			self.cstep++;
			self.ensurePage();
		}else{//finish!
			if(options.onSubmit){
				var cv=self.cele.find('.x_next').html()
				self.cele.find('.x_next').html('<i class="icon-refresh animate-spin"></i>');
				options.onSubmit(function(success){
					self.cele.find('.x_next').html(cv);
					if(success){
						self.hide()
					}
				})
			}else{
				self.hide();
			}
		}
	}
	this.prevStep=function(){
		if(self.cstep>0){
			self.cstep--;
			self.ensurePage();
		}
	}
	this.bindTogglers=function(ele){
		ele.stap(function(e){
			//phi.stop(e);
			var item=app.getByKey(options.menu,$(this).attr('data-id'),'id');
			if(item.onClick){
				item.state=item.onClick();
				//re-render
				$(this).render({
					template:options.render_template,
					replace:true,
					data:{
						item:item
					},
					binding:function(tele){
						self.bindTogglers(tele)
					}
				})
			}
		},1)
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
                endOfList:' ',
                max:12,//ensures grid
                template:options.menu.template,
                nodata:(options.menu.nodata)?options.menu.nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>Nothing here yet.</div></div>',
                onPageReady:function(ele){
                	ele.find('.rowitem').stap(function(){
                		var id=$(this).attr('data-id');
                		var data=self.inf.getById(id);
                		if(data){
                			if(self.options.onSelect) self.options.onSelect(id,data);
                			else console.warn('no onSelect');
                			self.hide();
                		}else{
                			console.warn('invalid ID or data');
                		}
                	},1,'tapactive')
                    if(options.menu.binding){
                    	options.menu.binding(ele);
                    }else{
                    	console.warn('no binding for infinitescroll');
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
	            					if(options.onExit) options.onExit(false,1)
							    	self.hide();
							    },1,'tapactive')
	            				if(options.binding) options.binding(ele,resp);
	            				if(options.menu.binding) options.menu.binding(ele,resp);
	            			}
	            		})
	            	}else{
	            		_alert('error loading, try again.')
	            	}
	            }
	        });
		}
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
	this.hide=function(){
		//console.trace();
		setTimeout(function(){
			TweenLite.to(self.ele,.5,{background:'rgba(55,55,55,0)'})
			TweenLite.to(self.ele.find('.pane'),.5,{y:'100%',onComplete:function(){
				setTimeout(function(){
					if(self.options.onEndAnimationSelect){
						if(self.selected){
							self.options.onEndAnimationSelect(self.selected,self.getData(self.selected));
						}
					}
					if(self.options.onEndAnimationSubSelect){
						if(self.subselected){
							self.options.onEndAnimationSubSelect(self.subselected,self.getData(self.subselected.parent));
						}
					}
					if(app.footerBar) app.footerBar.setColor(currentColor);
					modules.mobilealert_global.onAfterHide();
					self.destroy();
				},50);
			}})
		},50)
	}
	this.destroy=function(){
		self.ele.remove();
		delete self;
	}
}