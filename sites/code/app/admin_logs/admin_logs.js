modules.admin_logs=function(options){
	var self=this;
	this.show=function(){
		if(!self.ele||app.isdev){//re-render every time
			options.ele.render({
				uid:'adminlogs',
				force:1,
				template:'admin_logs',
				binding:function(ele){
					self.ele=ele;
					ele.find('#refreshlogs').stap(function(){
		                self.refresh();
		            })
		            ele.find('.navselect').stap(function(){
		                if(!$(this).hasClass('selected')){
		                    ele.find('.navselect').removeClass('selected');
		                    $(this).addClass('selected');
		                    self.filter=$(this).attr('data-filter');
		                    self.last=false;
		                    self.listloaded=0;
		                    self.refresh();
		                }
		            })
		            ele.find('#logcontent').on('keyup input paste',function(){
	                    self.searchLogs($(this).val());
	                })
		            ele.find('#clearsearch').stap(function(){
		                self.clearLogSearch();
		            },1,'tapactive')
		            ele.find('[data-filter=all]').stap();
		            self.setScroller();
		            self.renderSearch();
				}
			})
		}else{
			self.ele.show();
			self.inf.start();
		}
	}
	this.setScroller=function(){
		self.inf=new modules.infinitescroll({
            ele:self.ele.find('.itemlist'),
            scroller:self.ele.find('.scroller'),
            endpoint:app.sapiurl+'/log/get',
            loaderClass:'lds-ellipsis-black',
            offset:'200%',
            checkNextPage:true,
            onInterval:{
            	time:3000,
            	callback:function(){
            		//pself.updateTimes();
            	}
            },
            opts:{
            },
            max:40,
            template:'admin_logitem',
            nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>You havent queued anything yet.</div></div>',
            onPageReady:function(ele){
               ele.find('.bookmarkicon').stap(function(){
               		var data=self.inf.getById($(this).attr('data-id'));
               		self.toggleBookmark($(this),data._id);
               },1,'tapactive');
               ele.find('.x_viewerror').stap(function(){
               		var url=app.siteurl.replace('app','admin')+'/viewlog.php?data='+encodeURIComponent($(this).attr('data-conf'));
                    window.open(url,'_blank');
               },1,'tapactive');
            },
            scrollBindings:{
                scrollStart:function(){
                },
                scroll:function(obj){
                }
            }
        });
	}
	this.toggleBookmark=function(ele,id){
        if(ele.hasClass('selected')){
            ele.removeClass('selected');
        }else{
            ele.addClass('selected');
        }
        modules.api({
            url: app.sapiurl+'/log/bookmark', 
            data:{
                logid:id
            },
            error:function(){
                growl({
                    icon:'icon-warning-sign',
                    content:'Error Bookmarking'
                })
            },
            callback: function(data){
                if(data.success){
                    if(data.removed){
                        growl({
                            icon:'icon-thumbs-up',
                            content:'Successfully Removed Bookmarked Log'
                        })
                        if(self.filter=='bookmark'){
                            ele.parents('.logitem').fadeOut(300,function(){
                                $(this).remove()
                            })
                        }
                    }else{
                        growl({
                            icon:'icon-thumbs-up',
                            content:'Successfully Bookmarked Log'
                        })
                    }
                }else{
                    growl({
                        icon:'icon-warning-sign',
                        content:'Error Bookmarking ['+data.error+']'
                    })
                }
            }
        })
    }
    this.clearUser=function(){
        if(self.search.user) delete self.search.user;
        self.currentUser=false
        //updat ui
        self.renderSearch();
        self.refresh(1);
    }
    this.search={};
    this.setUser=function(user){
        self.currentUser=user;
        self.search.user=user.id;
        self.refresh(1);
        //update ui
        self.clearUserSearch();
        self.renderSearch();
    }
    this.searchLogs=function(val){
        if(self.sto) clearTimeout(self.sto);
        if(val){
            self.ele.find('#clearsearch').show();
            self.sto=setTimeout(function(){
                self.search.content=val;
                self.refresh(1);
            },200)
        }else{
            self.ele.find('#clearsearch').show();
        }
    }
    this.clearLogSearch=function(){
        var self=this;
        self.ele.find('#clearsearch').hide();
        self.ele.find('#logcontent').val('');
        self.search.content='';
        self.refresh(1);
    }
    this.clearUserSearch=function(){
        var self=this;
        self.ele.find('.usersearchcontent').html('');
        self.ele.find('.usersearch').hide();
    }
    this.renderSearch=function(){
        self.ele.find('.usersearcharea').render({
            template:'admin_logs_usersearcharea',
            append:false,
            data:{
                user:(self.currentUser)?self.currentUser:false
            },
            binding:function(ele){
                ele.find('.x_user').on('keyup paste',function(){
                    var c=$(this).val();
                    self.searchUsers(c);
                });
                ele.find('.x_clear').stap(function(){
                    self.clearUser();
                },1,'tapactive')
            }
        });
    }
	this.refresh=function(){
		if(self.inf){
			self.inf.options.opts.search=self.search;
			self.inf.options.opts.filter=self.filter;
			self.inf.reload();
		}
	}	
	this.searchUsers=function(search){
        if(search.length){
            self.ele.find('.usersearchcontent').render({
                template:'admin_logs_searchloading',
                append:false
            })
            self.ele.find('.usersearch').show();
            modules.api({
                caller:'Action',
                url: app.sapiurl+'/search/user', 
                data:{
                    search:search
                },
                callback:function(data){
                    if(data.success){
                        self.ele.find('.usersearchcontent').render({
                            template:'admin_logs_searchusers',
                            append:false,
                            data:data,
                            binding:function(ele){
                                new modules.scroller(self.ele.find('.usersearch'));
                                ele.find('.item').stap(function(){
                                    var u=data.users.list[$(this).attr('data-id')];
                                    self.setUser(u);
                                },1,'tapactive')
                            }
                        })
                    }else{
                        _alert('error');
                    }
                }
            })
        }else{
            self.clearUserSearch()
        }
    }
    this.destroy=function(){
    	self.inf.destroy();
		self.ele.remove();
    }
	this.hide=function(){
		self.inf.stop();
		self.ele.hide();
	}
}