if(!window.modules) window.modules={};
modules.admin_invite=function(options){
	this.options=options;
	var self=this;
	this.show=function(){
		async.parallel([self.showLoading,self.loadData],function(){
			self.onViewReady();
		})
	}
	this.loadData=function(cb){
		return cb();
		app.api({
			url:app.sapiurl+'/module/affiliate/load',
			data:{},
            timeout:5000,
			callback:function(resp){
				self.resp=resp;
                cb();
			}
		});
	}
	this.onViewReady=function(){
		self.ele.find('.content').render({
			template:'admin_invite_content',
			append:false,
			binding:function(ele){
				// ele.find('.x_invite').stap(function(){
				// 	var url=app.domain+'?referal='+app.user.profile.id;
				// 	app.share({
				// 		url:url
				// 	});
				// },1,'tapactive')
				self.infinitescroller=new modules.infinitescroll({
                    ele:ele.find('.list'),
                    endpoint:app.sapiurl+'/module/admin_invite/feed',
                    loaderClass:'lds-ellipsis-black',
                    offset:'200%',
                    opts:{
                    },
                    max:10,
                    template:'admin_invite_item',
                    nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>Nothing here yet.</div></div>',
                    onPageReady:function(ele){
                    	//bind
                    	ele.find('.x_share').stap(function(){
                    		var p=self.infinitescroller.getById($(this).attr('data-id'));
                    		var url=app.domain+'?code='+p.id;
                    		console.log(url)
                    		app.share({
								url:url
							});
                    	},1,'tapactive')
                    	ele.find('.x_showprofile').stap(function(){
                    		var p=self.infinitescroller.getById($(this).attr('data-id'));
                    		app.showProfile(p.user);
                    	},1,'tapactive')
                    },
                    scrollBindings:{
                        scrollStart:function(){
                        },
                        scroll:function(obj){
                        }
                    }
                });
			}
		})
	}
	this.saveInvite=function(data){
		if(self.sending) return false;
		self.sending=true;
		self.pele.find('.x_share').find('i').removeClass('icon-send').addClass('icon-refresh animate-spin');
		app.api({
			url:app.sapiurl+'/module/admin_invite/add',
			data:{
				data:data
			},
            timeout:5000,
			callback:function(resp){
				self.sending=false;
				self.pele.find('.x_share').find('i').addClass('icon-send').removeClass('icon-refresh animate-spin');
				if(resp.success){
					$.fn.page.close();
					self.infinitescroller.reload();
				}else{
					modules.toast({
						content:'Error: '+resp.error,
						icon:'icon-warning-sign'
					})
				}
			}
		});
	}
	this.add=function(){
		self.cinvite={};
		$('#wrapper').page({
            template:'admin_invite_add',
            uid:'add',
            beforeClose:function(ele,cb){//eliminate all animation/timing/etc
                setTimeout(function(){
                    cb();
                },50)
            },
            overlay:true,
            onClose:function(){
               
            },
            pageType:'static',
            data:{
            },
            onPageRendered:function(ele,cb){
            	self.pele=ele;
            	ele.find('.x_close').stap(function(){
            		$.fn.page.close();
            	},1,'tapactive');
            	ele.find('.x_add').stap(function(){
            		self.saveInvite(self.cinvite);
            	},1,'tapactive');
            	ele.find('.x_name').on('keyup',function(){
            		self.cinvite.name=$(this).val();
            	})
            	self.curinstance=ele.find('.numpad').mobiscroll().numpad({ 
		            theme: mobiscroll.settings.theme,
		            preset: 'decimal',
		            min: 1,
		            scale:0,
		            onSet:function(ev){
		            	self.cinvite.trial=parseInt(ev.valueText,10);
		            },
		            max: (12*5),
		            headerText:'Trial Period (months)'
		        });
            	window._ui.register('add_invite',{
                    onClick:function(state,id){
                        if(state) self.cinvite.tester=state;
                        else if(self.cinvite.tester) delete self.cinvite.tester;
                    }
                })
                window._ui.register('skip_cc',{
                    onClick:function(state,id){
                        if(state) self.cinvite.skip_cc=state;
                        else if(self.cinvite.skip_cc) delete self.cinvite.skip_cc;
                    }
                })
            },
            onShow:function(ele){

            }
        });
	}
	this.showLoading=function(cb){
		options.ele.subpage({
			loadtemplate:'admin_invite_page',
			beforeClose:function(ele,cb){//eliminate all animation/timing/etc
				setTimeout(function(){
					cb();
				},50)
			},
			onClose:function(){
                self.destroy();
			},
			pageType:'static',
			data:options.data,
			onPageReady:function(ele,onback){
				self.ele=ele;
				self.onBack=onback;
				ele.find('.x_add').stap(function(){
					self.add();
				},1,'tapactive');
                ele.find('.backbtn').stap(function(){
                	self.goBack();
                },1,'tapactive');
                cb();
			}
		})
	}
	this.goBack=function(){
		self.onBack(function(){
			modules.viewdelegate.onBack();
		});
	}
	this.destroy=function(){
		if(self.infinitescroller) self.infinitescroller.destroy();
		delete self;
	}
}