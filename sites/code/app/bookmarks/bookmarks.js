if(!window.modules) window.modules={};
modules.bookmarks=function(options){
	var self=this;
	this.show=function(){
		// async.parallel([self.showLoading,self.loadData],function(){
		// 	self.onViewReady();
		// })
		self.showLoading(function(){
			self.onViewReady();
		})
	}
    this.getContainer=function(){
        return $('#homeswiper');
    }
	this.pages={
		stream:{
			show:function(){
				var pself=this;
				self.ele.find('[data-page=stream]').show();
				if(!pself.infintitescroller){
					pself.infinitescroller=new modules.infinitescroll({
                        ele:self.ele.find('.stream'),
                        endpoint:app.sapiurl+'/module/bookmarks/feed',
                        loaderClass:'lds-ellipsis-black',
                        offset:'200%',
                        swipeContainer:self.getContainer(),
                        onInterval:{
                        	time:3000,
                        	callback:function(){
                        	}
                        },
                        opts:{
                        },
                        max:10,
                        template:'bookmarks_item',
                        nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>You dont have any notifications yet.</div></div>',
                        onPageReady:function(ele){
                            //pself.bindNotifications(ele);//bind all posts in that page!
                             modules.feed_global.bindPosts(ele,{
                                group:options.id,
                                self:pself,
                                scroller:pself.infinitescroller.scroller,
                                infinitescroller:pself.infinitescroller,
                                getPost:function(id){
                                    if(!id) return false;
                                    return pself.infinitescroller.getByKeyId('post_id',id,'post');
                                },
                                setPost:function(id,current){
                                	var c=pself.infinitescroller.getById(id);
                                	c.post=current;
                                    pself.infinitescroller.setById(id,c);
                                }
                            });//bind all posts in that page!
                        },
                        scrollBindings:{
                            scrollStart:function(){
                            },
                            scroll:function(obj){
                            }
                        }
                    });
				}else{
					pself.infinitescroller.start();
				}
			},
			hide:function(){
				var pself=this;
				if(pself.infinitescroller) pself.infinitescroller.stop();
				self.ele.find('[data-page=stream]').hide();
			}
		},
		collections:{
			show:function(){
				var pself=this;
				self.ele.find('[data-page=collections]').show();
				if(!pself.infintitescroller){
					pself.infinitescroller=new modules.infinitescroll({
                        ele:self.ele.find('.collections'),
                        endpoint:app.sapiurl+'/module/bookmarks/collections',
                        loaderClass:'lds-ellipsis-black',
                        offset:'200%',
                        onInterval:{
                        	time:3000,
                        	callback:function(){
                        	}
                        },
                        opts:{
                        },
                        max:10,
                        template:'bookmarks_collection',
                        nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>You dont have any notifications yet.</div></div>',
                        onPageReady:function(ele){
                            //pself.bindNotifications(ele);//bind all posts in that page!
                            //console.log()
                        },
                        scrollBindings:{
                            scrollStart:function(){
                            },
                            scroll:function(obj){
                            }
                        }
                    });
				}else{
					pself.infinitescroller.start();
				}
			},
			hide:function(){
				var pself=this;
				if(pself.infinitescroller) pself.infinitescroller.stop();
				self.ele.find('[data-page=collections]').hide();
			}
		}
	}
	this.onViewReady=function(){
		console.log(self.resp)
		self.ele.find('.content').render({
			template:'bookmarks_page',
			append:false,
			data:{
				nav:[{
    				_id:'stream',
    				name:'Stream',
    				selected:true
    			},{
    				_id:'collections',
    				name:'Collections'
    			}]
			},
			binding:function(ele){
				window._ui.register('bookmarksnav',{
                    onNavSelect:function(cur){
                        self.setPage(cur);
                    }
                })
				self.setPage('stream');
			}
		})
	}
	this.setPage=function(page){
		if(page!=self.cpage){
			if(self.cpage&&self.pages[self.cpage].hide) self.pages[self.cpage].hide();
			self.pages[page].show();
			self.cpage=page;
		}
	}
	this.showLoading=function(cb){
		options.ele.subpage({
            loadtemplate:'bookmarks_loading',
            data:{},
            onPageRendered:function(ele){
            	self.ele=ele;
            	ele.find('.backbtn').stap(function(){
            		self.back();
            	},1,'tapactive')
            },
            onPageReady:function(ele,onback){
                self.onBack=onback;
                cb();
            },
            onPageReturn:function(){
                self.destroy();
            }
        });
	}
	this.destroy=function(){
        modules.feed_global.clearGroup(options.id);
	}
	this.back=function(){
		self.onBack();
		modules.viewdelegate.onBack();
	}
	this.loadData=function(cb){
		app.api({
			url:app.sapiurl+'/module/bookmarks/load',
			data:{},
            timeout:5000,
			callback:function(resp){
				self.resp=resp;
				cb();
			}
		});
	}
}