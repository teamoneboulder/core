if(!window.modules) window.modules={};
modules.bookmark_folder=function(options){
	var self=this;
    self.options=options;
    self.original_id=options.id;
    self.state_manager=new modules.state_manager({
        id:self.original_id,
        app:'folder',
        getPages:function(){
            return [options.id]
        },
        getTabData:function(){
            if(self.resp&&self.resp.data){
                return {
                    name:self.resp.data.name,
                    icon:'icon-folder'
                }
            }else return false;
        },
        getPageName:function(){
            if(self.resp&&self.resp.data){
                return self.resp.data.name;
            }
        },
        getNavPath:function(){
            return options.id;
        },
        getData:function(){
            if(self.resp&&self.resp.data) return self.resp.data;
        },
        defaultPage:function(){
            return options.id;
        }
    })
	this.show=function(){
        if(!self.ele){
            if(options.subpage){
        		async.parallel([self.showLoading,self.loadData],function(){
        			self.onViewReady();
        		})
            }else{
                async.parallel([self.showLoading2,self.loadData],function(){
                    self.onViewReady();
                })
            }
        }else{

        }
	}
    this.goBack=function(){
        self.onBack(function(){
            if(options.subpage) app.home.manager.onBack();
            else modules.viewdelegate.onBack();
        });
    }
    this.onNavClick=function(){
        self.goBack();
    }
    this.getName=function(){
        return options.data.name;
    }
    this.setStatView=function(){
        modules.stats.setPage('streams','folder');
    }
    this.getContainer=function(){
        return $('#homeswiper');
    }
    this.reload=function(){
        self.resp=false;
        self.state_manager=new modules.state_manager({
            id:self.original_id,
            app:'folder',
            getPages:function(){
                return [self.options.id]
            },
            getTabData:function(){
                if(self.resp&&self.resp.data){
                    return {
                        name:self.resp.data.name,
                        icon:'icon-folder'
                    }
                }else return false;
            },
            getPageName:function(){
                if(self.resp&&self.resp.data){
                    return self.resp.data.name;
                }
            },
            getNavPath:function(){
                return self.options.id;
            },
            getData:function(){
                if(self.resp&&self.resp.data) return self.resp.data;
            },
            defaultPage:function(){
                return self.options.id;
            }
        })
        self.loadData(function(){
            self.onViewReady();
        });
    }
    this.renderWebNav=function(){
        self.ele.find('.websubmenu_responsive').render({
            template:'bookmark_folder_webnav',
            append:false,
            data:{
                resp:self.resp
            },
            binding:function(ele){
                ele.find('.x_folderitem').stap(function(){
                    //reload this page with the new ID
                    self.options.id=$(this).attr('data-id');
                    self.options.data={
                        id:$(this).attr('data-id')
                    }
                    self.reload();
                },1,'tapactive');
            }
        })
    }
	this.onViewReady=function(){
        if(self.resp.error){
            modules.loadError({
                ele:self.ele.find('.content'),
                error:self.resp.error,
                feed:1,
                onRetry:function(){
                    self.loadData(function(){
                        self.onViewReady();
                    });
                }
            })
            return false;
        }
        self.loaded=true;
        self.state_manager.setState();
		self.ele.find('.content').render({
			template:'bookmark_folder_page',
			append:false,
			data:{
                resp:self.resp
			},
			binding:function(ele){
                ele.find('.foldername').fitContentBounds();
                ele.find('.folderitem').stap(function(){
                    var id=$(this).attr('data-folder');
                    var d=self.resp.data.children_info.list[id];
                    modules.viewdelegate.register('bookmark_folder',{
                        id:id,
                        data:d,
                        onDelete:function(){
                           self.ele.find('[data-folder='+id+']').remove();
                        }
                    })
                },1,'tapactive');
                self.infinitescroller=new modules.infinitescroll({
                    ele:ele.find('.content'),
                    scroller:ele,
                    swipeContainer:self.getContainer(),
                    endpoint:app.sapiurl+'/module/feed/bookmarkfeed',
                    loaderClass:'lds-ellipsis-black',
                    offset:'200%',
                    onInterval:{
                        time:3000,
                        callback:function(){
                            //pself.updateTimes();
                        }
                    },
                    opts:{
                        uid:self.resp.data.uid,
                        folder:self.options.data.id
                    },
                    max:10,
                    template:'stream_bookmarkitem',
                    nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>Nothing here yet.</div></div>',
                    onPageReady:function(ele){
                        self.bindNotifications(ele);//bind all posts in that page!
                    },
                    scrollBindings:{
                        scrollStart:function(){
                        },
                        scroll:function(obj){
                        }
                    }
                });
                self.filter=new modules.contentFilter({
                    ele:ele.find('.x_filter'),
                    container:ele,
                    onChange:function(val){
                        self.filter_type=val;
                        self.infinitescroller.options.opts.filter=val;
                        self.infinitescroller.reload(false,1);
                    }
                })
                ele.find('.x_edit').stap(function(){
                    app.comingSoon();
                },1,'tapactive');
                self.renderWebNav();
			}
		});
	}
    this.bindNotifications=function(ele){
        ele.find('.x_media').stap(function(){
            var item=self.infinitescroller.getById($(this).attr('data-id'));
            var type=modules.feed_global.getPostType(item.post,1);
            if(type=='post'){
                modules.viewdelegate.register('post',{
                    id:item.post.id,
                    data:item.post,
                    load:true
                })
            }else if(type=='photos'){
                new modules.imageviewer({
                    index:0,
                    data:item.post.media.data,
                    onClose:function(){
                        
                    }
                })
            }else if(type=='video'){
                modules.video_view(item.post.media.data);
            }else if(type=='link'){
                app.openLink({
                    intent:item.post.media.data.url
                })
            }else{
                _alert('invalid type!')
            }
        },1,'tapactive')
        ele.find('.x_post').stap(function(){
            var item=self.infinitescroller.getById($(this).attr('data-id'));
            modules.viewdelegate.register('post',{
                id:item.post.id,
                data:item.post,
                load:true
            })
        },1,'tapactive');
        ele.find('.x_more').stap(function(){
            var item=self.infinitescroller.getById($(this).attr('data-id'));
            var post_id=item._id;
            var ele=$(this).parents('.bookmarkitem').first();
            var menu=[];
            menu.push({
                id:'remove',
                name:'Remove from bookmarks',
                icon:'icon-trash-empty'
            })
            if(item.post&&item.post.media&&item.post.media.data){
                menu.push({
                    id:'set',
                    name:'Set Cover Photo',
                    icon:'icon-images'
                })
            }
            var alert=new modules.mobilealert({
                display:{
                    ele:$(this),
                    container:self.infinitescroller.getScroller()
                },
                menu:menu,
                onSelect:function(id){
                    if(id=='remove'){
                        self.removeFromBookmarks(post_id,ele);
                    }
                    if(id=='set'){
                        var img=modules.feed_global.getPostPic(item.post);
                        self.setFolderImage(self.options.id,img);
                    }
                }
            });
            alert.show();
        },1,'tapactive');
    }
    this.setFolderImage=function(id,pic){
        app.api({
            url:app.sapiurl+'/module/bookmark_add/setfolderimage',
            data:{
                id:id,
                pic:pic
            },
            success:function(resp){
                if(resp.success){
                    self.updateHomeFolders();
                    self.ele.find('.mainimg').css('background','');
                    self.ele.find('.mainimg').css('backgroundImage','url('+modules.tools.getImg(pic,'small')+')');
                }else{
                    modules.toast({
                        content:'Error saving: '+resp.error,
                        remove:2500,
                        icon:'icon-warning-sign',
                        onRetry:function(){
                            self.setFolderImage(id,pic)
                        }
                    });
                }               
            }
        });
    }
    this.updateHomeFolders=function(){
        if(app.home.pages.streams){
            app.home.pages.streams.pages.bookmarks.updateFolders();
        }
    }
    this.removeFromBookmarks=function(id,ele){
        app.api({
            url:app.sapiurl+'/module/feed/removefrombookmarks',
            data:{
                id:id
            },
            success:function(resp){
                if(resp.success){
                    self.updateHomeFolders();
                    ele.fadeOut(500,function(){
                        $(this).remove();
                    })
                }else{
                    modules.toast({
                        content:'Error removing: '+resp.error,
                        remove:2500,
                        icon:'icon-warning-sign'
                    });
                }               
            }
        });
    }
	this.setPage=function(page){
		if(page!=self.cpage){
			if(self.cpage&&self.pages[self.cpage].hide) self.pages[self.cpage].hide();
			self.pages[page].show();
			self.cpage=page;
		}
	}
    this.deleteFolderApi=function(id,cb){
        app.api({
            url:app.sapiurl+'/module/bookmark_add/deletefolder',
            data:{
                id:id
            },
            timeout:5000,
            callback:function(resp){
                if(resp.success){
                    if(self.options.onDelete) self.options.onDelete();
                    if(cb) cb();
                }else{
                     modules.toast({
                        content:'Error saving: '+resp.error,
                        remove:2500,
                        icon:'icon-warning-sign'
                    });
                }
            }
        });
    }
    this.deleteFolder=function(id,cb){
        var menu=[];
        menu.push({
            id:'yes',
            name:'Yes, delete folder',
            icon:'icon-trash-empty'
        })
        menu.push({
            id:'no',
            name:'Nevermind',
            icon:'icon-cancel'
        })
        var alert=new modules.mobilealert({
            display:{
                content:'Are you sure you want to delete this folder?'
            },  
            menu:menu,
            onSelect:function(rid){
                if(rid=='yes'){
                    self.deleteFolderApi(id,cb);
                }
                if(rid=='no'){
                    
                }
            }
        });
        alert.show();
    }
    this.editFolder=function(){
        var bm=new modules.bookmark_add({
            folder:self.resp.data,
            onFolderNameUpdate:function(data){
                //set name!
                self.resp.data=$.extend(true,{},self.resp.data,data);
                self.ele.find('.foldername').html(data.name);
                self.updateHomeFolders();
            }
        });
        bm.editFolder();
    }
    this.viewHide=function(){
        self.ele.hide()
    }
    this.viewShow=function(){
        self.ele.show()
    }
    this.showLoading2=function(cb){
        if(options.inline){
            options.ele.render({
                template:'bookmark_folder_loading',
                data:{
                    data:options.data,
                    name:self.getName(),
                    inline:true,
                    left:0
                },
                binding:function(ele){
                    self.ele=ele;
                    ele.find('.x_more').stap(function(){
                        var menu=[];
                        menu.push({
                            id:'edit',
                            name:'Edit Folder',
                            icon:'icon-pencil'
                        })
                        menu.push({
                            id:'delete',
                            name:'Delete Folder',
                            icon:'icon-trash-empty'
                        })
                        var alert=new modules.mobilealert({
                            menu:menu,
                            onSelect:function(id){
                                if(id=='delete'){
                                    self.deleteFolder(self.resp.data.id,function(){
                                        self.updateHomeFolders();
                                        self.goBack();
                                    });
                                }
                                if(id=='edit'){
                                    self.editFolder();
                                }
                            }
                        });
                        alert.show();
                    },1,'tapactive');
                    cb();
                }
            });
        }else{
            options.ele.subpage({
                loadtemplate:'bookmark_folder_loading',
                data:{
                    data:options.data,
                    name:self.getName(),
                    inline:false
                },
                onPageRendered:function(ele){
                    self.ele=ele;
                    ele.find('.x_done').stap(function(){
                        self.goBack();
                    },1,'tapactive');
                    ele.find('.x_more').stap(function(){
                        var menu=[];
                        menu.push({
                            id:'edit',
                            name:'Edit Folder',
                            icon:'icon-pencil'
                        })
                        menu.push({
                            id:'delete',
                            name:'Delete Folder',
                            icon:'icon-trash-empty'
                        })
                        var alert=new modules.mobilealert({
                            menu:menu,
                            onSelect:function(id){
                                if(id=='delete'){
                                    self.deleteFolder(self.resp.data.id,function(){
                                        self.updateHomeFolders();
                                        self.goBack();
                                    });
                                }
                                if(id=='edit'){
                                    self.editFolder();
                                }
                            }
                        });
                        alert.show();
                    },1,'tapactive');
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
    }
	this.showLoading=function(cb){
		options.ele.subpage({
            loadtemplate:'bookmark_folder_loading',
            data:{
                data:options.data,
                name:self.getName(),
                inline:true
            },
            onPageRendered:function(ele){
            	self.ele=ele;
                ele.find('.x_more').stap(function(){
                    var menu=[];
                    menu.push({
                        id:'edit',
                        name:'Edit Folder',
                        icon:'icon-pencil'
                    })
                    menu.push({
                        id:'delete',
                        name:'Delete Folder',
                        icon:'icon-trash-empty'
                    })
                    var alert=new modules.mobilealert({
                        menu:menu,
                        onSelect:function(id){
                            if(id=='delete'){
                                self.deleteFolder(self.resp.data.id,function(){
                                    self.updateHomeFolders();
                                    self.goBack();
                                });
                            }
                            if(id=='edit'){
                                self.editFolder();
                            }
                        }
                    });
                    alert.show();
                },1,'tapactive');
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
        self.ele.remove();
	}
	this.loadData=function(cb){
		app.api({
			url:app.sapiurl+'/module/feed/folder',
			data:{
                id:options.data.id
            },
            timeout:5000,
			callback:function(resp){
				self.resp=resp;
				cb();
			}
		});
	}
}