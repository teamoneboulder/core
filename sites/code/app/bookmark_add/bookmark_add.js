if(!window.modules) window.modules={};
modules.bookmark_add=function(options){
	var self=this;
	if(!options.current) options.current=[];
	self.options=options;
	this.save=function(){
		app.api({
            url:app.sapiurl+'/module/bookmark_add/bookmark',
            data:{
                context:options.context,
                post_id:options.post.id
            },
            timeout:5000,
            callback:function(resp){
                if(resp.success){
                	self.resp=resp;
                	if(resp.current&&resp.current.folders){
                		self.options.current=resp.current.folders;
                	}
                	self.showPicker(1);
                }else{
                	modules.toast({
						content:resp.error,
                        remove:2500,
                        icon:'icon-warning-sign',
                        retry:1,
                        onRetry:function(){
                        	self.save(name);
                        }
					});
                }
            }
        });
	}
	this.addAnother=function(){
		if(self.hiding){
			self.onHide=function(){
				self.addAnother();
			}
		}else{
			$('body').render({
				template:'bookmark_add_another',
				data:{
				},
				binding:function(ele){
					self.aele=ele;
					self.hasAnother=1;
					TweenLite.set(ele.find('.moveitem'),{y:ele.find('.moveitem').outerHeight()});
					TweenLite.to(ele.find('.moveitem'),.3,{y:0});
					ele.find('.x_add').stap(function(){
						self.closeAnother(self.showPicker);
					},1,'tapactive');
					setTimeout(function(){
						self.closeAnother();
					},3000);
				}
			})
		}
	}
	this.closeAnother=function(cb){
		if(self.hasAnother){
			TweenLite.to(self.aele.find('.moveitem'),.3,{y:self.aele.find('.moveitem').outerHeight(),onComplete:function(){
				setTimeout(function(){
					self.aele.remove();
				},50)
				if(cb) cb();
			}});
			self.hasAnother=false;
		}
	}
	this.setPostCollection=function(id){
		if(self.options.onSetFolder) self.options.onSetFolder(id);
		self.options.current.push(id);
		app.api({
            url:app.sapiurl+'/module/bookmark_add/addtocollection',
            data:{
                context:options.context,
                post_id:options.post.id,
                collection_id:id
            },
            timeout:5000,
            callback:function(resp){
                if(resp.success){//alls good
                	self.addAnother();
                }else{
                	modules.toast({
						content:resp.error,
                        remove:2500,
                        icon:'icon-warning-sign',
                        retry:1,
                        onRetry:function(){
                        	self.setPostCollection(id);
                        }
					});
                }
            }
        });
	}
	this.showPicker=function(saved){
		$('body').render({
			template:'bookmark_add_picker',
			data:{
				saved:saved,
				resp:self.resp
			},
			binding:function(ele){
				self.ele=ele;
				//render infifinitescroller!
				//console.log(self.options.current)
				self.infinitescroller=new modules.infinitescroll({
                    ele:ele.find('.content'),
                    scroller:ele.find('.scroller'),
                    inline:true,
                    loadData:self.resp,//will also handle errors
                    search:{
                        input:ele.find('input'),
                        //closer:ele.find('.x_cancel')
                    },
                    endpoint:app.sapiurl+'/module/feed/folderfeed',
                    loaderClass:'lds-ellipsis-black',
                    offset:'200%',
                    onInterval:{
                        time:3000,
                        callback:function(){
                            //pself.updateTimes();
                        }
                    },
                    opts:{
                    },
                    renderData:{
                    	current:self.options.current
                    },
                    max:10,
                    template:'bookmark_add_folder',
                    endOfList:' ',
                    nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>You dont have any folders yet.</div></div>',
                    onPageReady:function(ele){
                        ele.find('.x_set').stap(function(){
                        	var coll=self.infinitescroller.getById($(this).attr('data-id')).id;
                        	if(self.options.current.indexOf(coll)>=0){
                        		self.hidePicker();
                        	}else{
								self.setPostCollection(coll);
								self.hidePicker();
							}
						},1,'tapactive');
                    },
                    scrollBindings:{
                        scrollStart:function(){
                        	modules.keyboard_global.hide();
                        },
                        scroll:function(obj){
                        }
                    }
                });
				TweenLite.set(self.ele.find('.pane'),{y:self.ele.find('.pane').height()});
				ele.find('.x_close').stap(function(){
					self.hidePicker()
				},1,'tapactive');
				self.ele.find('.bg').stap(function(){
					self.hidePicker();
				},1,'tapactive')
				ele.find('.x_addit').stap(function(){
					self.getName({name:ele.find('input').val().capitalize()},function(obj){
						self.saveCollection(obj);
					},function(){
						//go back!
						self.goBack();
						//self.showPicker();
					})
					// self.hidePicker(function(){
					// 	self.getName({name:ele.find('input').val().capitalize()},function(obj){
					// 		self.saveCollection(obj);
					// 	},function(){
					// 		self.showPicker();
					// 	})
					// });
				},1,'tapactive');
				setTimeout(function(){
					if(!app.isWebLayout()) TweenLite.to(self.ele.find('.bg'),.3,{opacity:.3})
					TweenLite.to(self.ele.find('.pane'),.3,{y:0});
				},100);
			}
		})
	}
	this.goBack=function(){

	}
	this.saveCollection=function(obj,cb){
		app.api({
            url:app.sapiurl+'/module/bookmark_add/addcollection',
            data:{
                context:options.context,
                post_id:(options.post)?options.post.id:'',
                name:obj.name,
                perms:obj.perms,
                parent:(obj.parent)?obj.parent:'',
                id:(options.folder)?options.folder.id:''
            },
            retry:5,
            timeout:5000,
            callback:function(resp){
                if(resp.success){//alls good
                	if(resp.data){
                		if(self.options.onSetFolder) self.options.onSetFolder(resp.data.id);
                		self.options.current.push(resp.data.id);
                	}
                	if(cb){
                		cb(obj);
                	}else{
                		self.addAnother();
                	}
                }else{
                	modules.toast({
						content:resp.error,
                        remove:2500,
                        icon:'icon-warning-sign',
                        retry:1,
                        onRetry:function(){
                        	self.saveCollection(obj);
                        }
					});
                }
            }
        });
	}
	this.editFolder=function(){
		if(self.options.folder.parent){
			self.hasFolder=self.options.folder.parent;
			self.options.current=(self.options.folder.children)?self.options.folder.children:[];
		}
		self.getName({
			name:self.options.folder.name,
			editing:true,
		},function(saved){
			self.saveCollection(saved,function(){
				if(self.options.onFolderNameUpdate) self.options.onFolderNameUpdate(saved);
			})
		},function(){
			if(self.options.onFolderNameUpdateFail)mself.options.onFolderNameUpdateFail();
		})
	}
	this.bindPage=function(ele){
		self.nele=ele;
		self.permissions=new modules.inlinepermissions({
            ele:ele.find('.permissions'),
            container:ele.find('.mainpage'),
            bgclass:(app.isWebLayout())?'l-corner-all':'',
            button:true,
            cache:'bookmark_folder',
            nodata:'Visibility',
            data:{
                includePrivate:true,
                identity:{
                	id:app.user.profile.id,
                	name:app.user.profile.name,
                	pic:app.user.profile.pic
                },
                permission:(self.options.folder)?self.options.folder.perms:''
            }
        });
		ele.on('touchstart',function(){
			modules.keyboard_global.hide();
		})
		ele.on('touchmove',function(e){
        	phi.stop(e);
        })
		ele.on('scroll',function(e){
			phi.stop(e);
		})
		//render infifinitescroller!
		//console.log(self.options.current)
		self.renderInFolder();
	}
	this.saveFolder=function(cb){
		var save={
			name:self.nele.find('.response').val()
		}
		save.perms=self.permissions.getPermissions('bookmark_folder');
		if(!save.name){
			modules.toast({
				content:'Please enter a name for the folder.',
                remove:2500,
                icon:'icon-warning-sign'
			});
			return false;
		}
		if(!save.perms){
			modules.toast({
				content:'Please select a privacy for this folder.',
                remove:2500,
                icon:'icon-warning-sign'
			});
			return false;
		}
		if(self.hasFolder){
			save.parent=self.hasFolder.id;
		}
		cb(save);
		self.hasFolder=false;
	}
	this.getName=function(obj,cb,fcb){
        if(obj.editing){
        	$('body').render({
				template:'bookmark_add_newfolder',
				data:{
					text:obj.name,
					editing:(obj.editing)?true:false
				},
				binding:function(ele){
					self.nele=ele;
					TweenLite.set(self.nele.find('.pane'),{y:self.nele.find('.pane').height()});
					self.bindPage(ele,1);
					ele.find('.x_close').stap(function(){
						self.hidePicker2(function(){
							fcb()
						})
					},1,'tapactive');
					ele.find('.x_save').stap(function(){
						self.saveFolder(cb);
						self.hidePicker2();
					},1,'tapactive');	
					setTimeout(function(){
						TweenLite.to(self.nele.find('.bg'),.3,{opacity:.3})
						TweenLite.to(self.nele.find('.pane'),.3,{y:0});
					},100);
				}
			});
        }else{
			self.ele.find('.subpage').subpage({
				loadtemplate:'bookmark_add_newfolder',
				data:{
					text:obj.name,
					editing:(obj.editing)?true:false,
					subview:true
				},
				onPageRendered:function(ele){
	            	self.bindPage(ele);
	            },
	            onPageReady:function(ele,onback){
	            	self.onBack=onback;
	            	ele.find('.x_close').stap(function(){
	            		onback();
	            		//fcb();
	            	},1,'tapactive');
	            	ele.find('.x_save').stap(function(){
						self.saveFolder(cb);
						self.hidePicker3(function(){
							if(self.infinitescroller) self.infinitescroller.destroy();
							self.ele.remove();
						});
						console.log('HIDE!')
					},1,'tapactive');	
	            }
			})
		}
	}
	this.renderInFolder=function(){
		if(!self.hasFolder){
			self.nele.find('.selectedbar').hide();
			self.nele.find('.searchbar').show();
			self.nele.find('.scroller').css('top','130px');
			self.infinitescroller2=new modules.infinitescroll({
	            ele:self.nele.find('.content'),
	            scroller:self.nele.find('.scroller'),
	            loadData:self.resp,//will also handle errors
	            search:{
	                input:self.nele.find('.taginput'),
	                //closer:ele.find('.x_cancel')
	            },
	            endpoint:app.sapiurl+'/module/feed/folderfeed',
	            loaderClass:'lds-ellipsis-black',
	            offset:'200%',
	            onInterval:{
	                time:3000,
	                callback:function(){
	                    //pself.updateTimes();
	                }
	            },
	            opts:{
	            	current:(self.options.folder)?self.options.folder.id:''
	            },
	            renderData:{
	            	current:self.options.current
	            },
	            max:10,
	            template:'bookmark_add_folder',
	            endOfList:' ',
	            nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>You dont have and folders yet.</div></div>',
	            onPageReady:function(ele){
	                ele.find('.x_set').stap(function(){
	                	var coll=self.infinitescroller2.getById($(this).attr('data-id'));
	                	self.hasFolder=coll;
	                	self.infinitescroller2.destroy();
	                	self.renderInFolder();
					},1,'tapactive');
	            },
	            scrollBindings:{
	                scrollStart:function(){
	                	modules.keyboard_global.hide();
	                },
	                scroll:function(obj){
	                }
	            }
	        });
		}else{
			self.nele.find('.selectedbar').show();
			self.nele.find('.searchbar').hide();
			self.nele.find('.content').render({
				template:'bookmark_add_infolder',
				data:{
					data:self.hasFolder
				},
				append:false,
				binding:function(ele){
					self.nele.find('.scroller').css('top','115px');
					ele.find('.x_cancel').stap(function(){
						self.hasFolder=false;
						self.renderInFolder();
					},1,'tapactive');
				}
			})
		}
	}
	this.getName2=function(obj,cb,fcb){
    	 $('body').alert({
            template:'bookmark_add_newfolder',
            tempdata:{
            	title:'Name for Collection',
            	text:obj.name
            },
            closer:false,
            buttons:[{
        		btext:'Cancel',
        		bclass:'mbtn x_cancel'
        	},{
        		btext:'Save',
        		bclass:'mbtn x_save'
        	}],
            binding:function(ele){
                ele.find('.x_save').stap(function(){
                	$.fn.alert.closeAlert();
                    cb(ele.find('input').val());
                },1,'tapactive');
                ele.find('.x_cancel').stap(function(){
                	$.fn.alert.closeAlert();
                	fcb();
                },1,'tapactive')
                setTimeout(function(){
                    ele.find('.response').focus();
                    //move curstor to end
                    ele.find('.response').caret(ele.find('.response').val().length);
                },100);
            }
        })
    }
	this.hidePicker=function(cb){
		self.hiding=true;
		TweenLite.to(self.ele.find('.bg'),.3,{opacity:0})
		TweenLite.to(self.ele.find('.pane'),.3,{y:self.ele.find('.pane').height(),onComplete:function(){
			if(self.infinitescroller) self.infinitescroller.destroy();
			self.ele.remove();
			self.hiding=false;
			if(self.onHide) self.onHide();
			self.onHide=false;
			if(cb) cb();
		}})
	}
	this.hidePicker3=function(cb){
		self.hiding=true;
		TweenLite.to(self.nele.find('.bg'),.3,{opacity:0})
		TweenLite.to(self.nele.find('.pane'),.3,{y:self.nele.find('.pane').height(),onComplete:function(){
			if(self.infinitescroller2) self.infinitescroller2.destroy();
			self.nele.remove();
			self.hiding=false;
			if(self.onHide) self.onHide();
			self.onHide=false;
			if(cb) cb();
		}})
	}
	this.hidePicker2=function(cb){
		self.hiding=true;
		TweenLite.to(self.nele.find('.bg'),.3,{opacity:0})
		TweenLite.to(self.nele.find('.pane'),.3,{y:self.nele.find('.pane').height(),onComplete:function(){
			if(self.infinitescroller2) self.infinitescroller2.destroy();
			self.nele.remove();
			self.hiding=false;
			if(self.onHide) self.onHide();
			self.onHide=false;
			if(cb) cb();
		}})
	}
}