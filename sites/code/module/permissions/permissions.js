modules.permissions=function(options){
	var self=this;
	if(options.id!='fb_link'&&options.id.indexOf('_')>=0){
		var oid=options.id;
		var idp=options.id.split('_');
		if(idp[0]==app.user.profile.id) options.id=idp[1];
		if(idp[1]==app.user.profile.id) options.id=idp[0];
		onerror('Bad permissions ['+oid+']...trying auto fixing, set to ['+options.id+']');
	}
	self.options=options;
	this.show=function(){
		//build nav!
		if(phone.statusBar){
			self.currentStatusBar=phone.statusBar.getCurrent();
			self.currentFooter=phone.footerBar.getCurrent();
		}
		async.parallel([self.loadInfo,self.loadPage],function(){
			if(phone.statusBar) phone.statusBar.set('dark');
			if(phone.footerBar) phone.footerBar.setColor('white');
			//if(phone.teach) phone.teach('friendrequest');
			self.onViewReady();
		})
	}
	this.onViewReady=function(){
		//render friend list
		if(options.current){
			if(self.error){
				modules.loadError({
                    ele:self.ele.find('.contentscroller'),
                    error:self.error,
                    onRetry:function(){
                    	self.loadInfo(function(){
                    		self.onViewReady();
                    	})
                    }
                })
				return false;
			}
			self.options.current=self.data.current;
			self.ele.find('.contentscroller').render({
				template:'permissions_content',
				append:false,
				data:{
					data:self.options
				},
				binding:function(ele){
					self.bind(self.ele);
				}
			})
		}
		if(self.error){
			modules.loadError({
                ele:self.ele.find('.friendslist'),
                error:self.error,
                inline:true,
                icon:false,
                onRetry:function(){
                	self.loadInfo(function(){
                		self.onViewReady();
                	})
                }
            })
		}else{
			self.renderFriendList();
		}
	}
	this.renderFriendList=function(){
		//console.log(self.data)
		self.ele.find('.friendslist').render({
			template:'permissions_friendlist',
			data:{
				data:self.data,
				error:self.error
			},
			append:false,
			binding:function(ele){
				ele.find('.toggler').stap(function(e){
                	$(this).toggleClass('checked');
                	phi.stop(e);
                },1,'tapactive')
			}
		})
	}
	this.loadInfo=function(cb){
		var data={
			current:(options.current)?1:''
		}
		if(options.anon_uid){
			data.anon_uid=options.anon_uid;
		}
		modules.api({
            url:app.sapiurl+'/module/permissions/'+options.id+'/info',
            data:data,
            timeout:5000,
            callback:function(resp){
            	if(resp.success){
            		self.error=false;
            		self.data=resp.data;
            	}else{
            		self.error=resp.error;
            	}
            	cb();
            }
        });
	}
	this.loadPage=function(cb){
		if(options.alert){
			$('body').alert({
				icon:false,
				closer:false,
				image:false,
				template:'permissions_page_alert',
				tempdata:{
					data:options
				},
				buttons:false,
				width:600,
				overlay:true,
				uid:'permissions',
				zIndex:50000,
				binding:function(ele){
					self.ele=ele;
					if(!options.current){
	                	self.bind(ele);
	                }
	                self.waypoint = new Waypoint.Sticky({
					  element: ele.find('.stickywaypoint')[0],
					  context: ele.find('.relativealert')[0],
					})
					cb();
				}
			})
		}else if(options.inline){
			options.ele.render({
				template:'permissions_page_page',
				append:false,
				data:{
	            	data:options
	            },
	            binding:function(ele){
	            	self.ele=ele;
					if(!options.current){
	                	self.bind(ele);
	                }
	                cb();
	            }
			})
		}else{
			var rele=(options.ele)?options.ele:$('#wrapper');
			rele.page({
	            template:'permissions_page',
	            beforeClose:function(ele,cb){//eliminate all animation/timing/etc
	                //self.scroller.destroy();
	                if(phone.statusBar) phone.statusBar.set(self.currentStatusBar);
	                if(phone.footerBar) phone.footerBar.setColor(self.currentFooter);
	                setTimeout(function(){
	                    cb();
	                },50)
	            },
	            uid:'permissions',
	            overlay:true,
	            zIndex:1200,
	            onClose:function(){
	                self.destroy();
	            },
	            pageType:'static',
	            data:{
	            	data:options
	            },
	            onPageRendered:function(ele){
	            	var te=ele.find('.topname');
	            	var w=te.width();
	            	te.attr('data-width',w);
	            	te.fitContentBounds();
	            },
	            onShow:function(ele){
	                //bind it!
	                self.ele=ele;
	                if(!options.current){
	                	self.bind(ele);
	                }
					cb();
	            }
	        });
		}
	}
	this.unfriend=function(){
		if(self.sending) return false;
		self.sending=true;
		self.ele.find('.x_unfriend').find('i').removeClass('icon-minus-circled').addClass('icon-refresh animate-spin');
		modules.api({
            url:app.sapiurl+'/module/permissions/'+options.id+'/unfriend',
            data:{

            },
            timeout:5000,
            callback:function(resp){
            	self.sending=false;
            	if(resp.success){
            		if(self.options.onRemove) self.options.onRemove();
            		self.hide();
            	}else{
            		self.ele.find('.x_unfriend').find('i').addClass('icon-minus-circled').removeClass('icon-refresh animate-spin');
            		modules.toast({
				        content:resp.error,
				        remove:2500,
				        icon:'icon-warning-sign'
				    })
            	}
            }
        });
	}
	this.bind=function(ele){
		ele.find('.x_unfriend').stap(function(){
			var alert=new modules.alertdelegate({
				display:{
					ele:$(this),
					container:ele,
					locations:['topcenter']
				},
                menu:[{
                    id:'yes',
                    name:'Yes, Remove '+options.name,
                    icon:'icon-minus-circled'
                },{
                    id:'no',
                    name:'No, keep friend',
                    icon:'icon-down-open'
                }],
                onEndAnimationSelect:function(id){
                    if(id=='no'){
                        alert.hide();
                    }else{
                        self.unfriend();
                    }
                }
            });
            alert.show();
		},1,'tapactive')
		ele.find('.intromessage').maxlength();
        ele.find('textarea').autosize();
        ele.find('.x_close').stap(function(){
        	if(options.onClose) options.onClose();
        	self.hide();
        },1,'tapactive')
        ele.find('.togglerow').stap(function(){
        	$(this).toggleClass('showcontent');
        },1,'tapactive');
        ele.find('.x_createlist').stap(function(e){
        	self.addFriendList();
        	phi.stop(e);
        },1,'tapactive')
        ele.find('.toggler').stap(function(e){
        	$(this).toggleClass('checked');
        	self.ensureAll();
        	//handle grouping!
        	phi.stop(e);
        },1,'tapactive')
        ele.find('.x_send').stap(function(){
        	if(self.options.current){
        		self.update();
        	}else{
        		self.send();
        	}
        },1,'tapactive')
		self.scroller=new modules.scroller(ele.find('.contentscroller'),{
			hasInput:true,
            forceNative:true,
            followTyping:ele.find('.notes'),
            inputs:ele.find('.scrollinputs')
		})
		self.ensureAll();
	}
	this.hide=function(){
		if(options.alert){
			$.fn.alert.closeAlert();
    	}else{
    		$.fn.page.close();
    	}
	}
	this.addFriendList=function(){
		var id=app.user.profile.id+'_'+Math.uuid(8);
		if(!self.newlists) self.newlists={};
		self.newlists[id]={
			name:'',
			id:id
		}
		self.ele.find('.extralists').render({
			template:'permissions_addlist',
			data:{
				id:id
			},
			binding:function(ele){
				ele.find('input').on('input',function(){
					var v=$(this).val();
					self.newlists[id]={
						name:v,
						id:id
					}
				}).stap(function(e){
					phi.stop(e);
				},1,'tapactive');
				ele.find('.x_trash').stap(function(e){
					delete self.newlists[id];
					if(!modules.tools.size(self.newlist)) self.newlist=false;
					ele.fadeOut(500,function(){
						$(this).remove();
					})
					phi.stop(e)
				},1,'tapactive');
				//register the new input for the scroller!
				setTimeout(function(){
					ele.find('input').focus();
				},50)
			}
		})
	}
	this.ensureAll=function(){
		var request=self.getRequest();
		var status='';
		var total=4;
		if(modules.tools.size(request.contact)==total){
			status='all';
		}else if(modules.tools.size(request.contact)==0){
			status='none';
		}else{
			status='some';
		}
		self.ele.find('.contactstatus').html(status);
	}
	this.getRequest=function(){
		var request={};
		$.each(self.ele.find('.permdata'),function(i,v){
			var type=$(v).attr('data-type');
			var parent=$(v).attr('data-parent');
			var field=$(v).attr('data-field');
			if(parent){
				if(!request[parent]) request[parent]={};
				var ud=request[parent];//update object
			}else{
				var ud=request
			}
			switch(type){
				case 'text':
					ud[field]=$(this).val();
				break;
				case 'check':
					if($(this).hasClass('checked')){
						ud[field]=1;
					}
				break;
			}
		});
		//add in any friends list
		if(self.newlists) request.newlists=self.newlists;
		return request;
	}
	this.update=function(){
		var request=self.getRequest();
		if(self.sending) return false;
		self.ele.find('.x_send').find('i').removeClass('icon-floppy').addClass('icon-refresh animate-spin');
		self.sending=true;
		var data={
        	data:request
        }
		modules.api({
            url:app.sapiurl+'/module/permissions/'+options.id+'/update',
            data:data,
            timeout:5000,
            callback:function(resp){
            	self.sending=false;
            	if(resp.success){
            		if(self.options.onSuccess) self.options.onSuccess(request);
            		self.hide()
            	}else{
            		self.ele.find('.x_send').find('i').addClass('icon-floppy').removeClass('icon-refresh animate-spin');
            		modules.toast({
				        content:resp.error,
				        remove:2500,
				        icon:'icon-warning-sign'
				    })
            	}
            }
        });
	}
	this.send=function(){
		var request=self.getRequest();
		//ensure newlist
		if(request.newlists){
			var stop=false;
			$.each(request.newlists,function(i,v){
				if(!v.name) stop=true;
			})
			if(stop){
				modules.toast({
			        content:'Please enter a name for your new contact list.',
			        remove:2500,
			        icon:'icon-warning-sign'
			    })
				return false;
			}
		}
		if(self.options.id!='fb_link'){
			if(!request.message&&!self.options.request){
				modules.toast({
			        content:'This is the beginning of a beautiful connection.  Start it right with a conscious message!',
			        remove:2500,
			        icon:'icon-warning-sign'
			    })
				return false;
			}
		}
		if(self.sending) return false;
		if(options.inline){
			var se=self.ele.find('.x_send').find('.content');
		}else{
			var se=self.ele.find('.x_send')
		}
		var cv=se.html();
		se.html('<i class="icon-refresh animate-spin"></i>');
		self.sending=true;
		var data={
        	data:request
        }
		if(self.options.request){
			data.id=self.options.request.id;
		}
		if(options.anon_uid){
			data.anon_uid=options.anon_uid;
		}
		if(options.triggers){
			data.triggers=options.triggers;
		}
		modules.api({
            url:app.sapiurl+'/module/permissions/'+options.id+'/'+((self.options.request)?'confirm':'send'),
            data:data,
            timeout:5000,
            callback:function(resp){
            	self.sending=false;
            	se.html(cv);
            	if(resp.success){
            		if(self.options.onSuccess) self.options.onSuccess();
            		self.hide();
            	}else{
            		modules.toast({
				        content:resp.error,
				        remove:2500,
				        icon:'icon-warning-sign'
				    })
            	}
            }
        });
	}
	this.destroy=function(){
		self.ele.remove();
		delete self;
	}
}