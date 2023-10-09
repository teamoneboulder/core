modules.browser_cache={};
modules.browser_inline=function(options){
	var self=this;
	self.options=options;
	this.init=function(){
		options.ele.render({
			template:'browser_inline',
			data:{
				data:options.data,
				inline:(options.headerele)?0:1
			},
			binding:function(ele){
				ele.find('.x_navitem').stap(function(){
					var id=$(this).attr('data-id');
					var tag=options.data.data.parents.list[id];
					if(options.onSelect) options.onSelect(id,tag);
				},1,'tapactive');
				ele.find('.x_item').stap(function(){
					var id=$(this).attr('data-id');
					var tag=options.data.data.children.list[id];
					if(options.onSelect) options.onSelect(id,tag)
				},1,'tapactive');
				//fit text
				var avail=ele.find('.x_item').first().find('.contentparent').width();
				ele.find('.content').attr('data-width',avail-5);
				ele.find('.content').fitContentBounds();
			}
		});
		if(options.headerele){
			if(options.data.data.parents&&options.data.data.parents.order.length){
				options.headerele.render({
					template:'browser_header_inline',
					append:false,
					data:{
						data:options.data
					},
					binding:function(ele){
						ele.find('.x_navitem').stap(function(){
							var id=$(this).attr('data-id');
							var tag=options.data.data.parents.list[id];
							if(options.onSelect) options.onSelect(id,tag);
						},1,'tapactive');
						if(options.scrollele){
							options.scrollele.css('top',ele.height()+1);
						}else{
							console.warn('no scroll ele');
						}
					}
				})
			}else{
				options.headerele.html('')
				if(options.scrollele){
					options.scrollele.css('top',0);
				}else{
					console.warn('no scroll ele');
				}
			}
		}
	}
	self.init();
}
modules.browser=function(options){
	var self=this;
	self.options=options;
	self.options.start=options.page;
	self.init=function(){
		options.container.css('overflow','hidden');
		if(options.ele){
			options.ele.stap(function(){
				if(!self.ele){
					options.container.render({
						template:'browser',
						data:{
							webview:(options.webview)?1:0
						},
						binding:function(ele){
							self.ele=ele;
							TweenLite.set(ele.find('.content'),{y:'-100%'});
							async.parallel([self.animate,self.load],function(){
								self.render();
							});
						}
					})
				}else{
					self.hide();
				}
			},1,'tapactive')
		}else{
			if(!self.ele){
				options.container.render({
					template:'browser',
					data:{
						webview:(options.webview)?1:0
					},
					binding:function(ele){
						self.ele=ele;
						if(options.animate) TweenLite.set(ele.find('.content'),{y:'-100%'});
						async.parallel([self.animate,self.load],function(){
							self.render();
						});
					}
				})
			}else{
				self.hide();
			}
		}
	}
	self.hide=function(){
		if(!self.ele) return false;
		if(options.animate){
			TweenLite.to(self.ele.find('.bg'),.3,{opacity:0})
			TweenLite.to(self.ele.find('.content'),.3,{y:'-100%',onComplete:function(){
				self.ele.remove();
				self.ele=false;
			}})
		}else{
			self.ele.remove();
			self.ele=false;
		}
	}
	self.animate=function(cb){
		if(options.animate){
			setTimeout(function(){
				TweenLite.to(self.ele.find('.bg'),.3,{opacity:1})
				TweenLite.to(self.ele.find('.content'),.3,{y:'0%',onComplete:function(){
					if(cb) cb();
				}})
			},10);
		}else{
			if(cb) cb();
		}
	}
	self.getHeader=function(){
		//look at parents!
		var header=[];
		if(self.resp.data){
			if(self.resp.data.parents){
				$.each(self.resp.data.parents.order,function(i,v){
					var item=self.resp.data.parents.list[v];
					header.push({
						id:item.id,
						name:item.name
					})
				})	
			}
		}
		return header;
	}
	self.setPage=function(page,add){
		if(self.options.page==page){
			self.returnPage(self.infinitescroller.getById(page));
			return false;
		}
		if(add){//re-render!
			var h=self.getHeader();
			var rebuild=true;
			var addto=false;
			if(h.length){
				$.each(h,function(i,v){
					if(add.id==v.id){//in path already
						rebuild=false;
					}
					if(add[self.options.type+'_parent']==v.id){//in path already
						addto=true;
					}
				});
			}
			if(rebuild){
				if(!addto){
					self.resp.data.tag=false;//new pathing!
					//check if parent is in list!
					self.resp.data.parents={
						order:[],
						list:{}
					}
				}
				if(!self.resp.data.parents){
					self.resp.data.parents={
						order:[],
						list:{}
					}
				}
				self.resp.data.parents.order.push(add.id);
				self.resp.data.parents.list[add.id]=add;
				var h=self.getHeader();
				//re-render!!!
				self.ele.find('.header').render({
					template:'browser_header',
					append:false,
					data:{
						header:h
					},
					binding:function(ele){
						ele.find('.navname').fitContentBounds();
						ele.find('.navname').stap(function(){
							var id=$(this).attr('data-page');
							self.setPage(id);
						},1,'tapactive');
					}
				})
			}
		}
		self.options.page=page;
		self.ensureVisibility();
		self.ele.find('.navname').removeClass('selected');
		self.ele.find('[data-page='+page+']').addClass('selected');
		//render header
		self.renderPage();
	}
	self.ensureVisibility=function(){
		if(options.hideNavOnRoot){
			if(self.options.page=='root'){
				self.ele.find('.header').hide();
				self.ele.find('.scroller').css('top','0px')
			}else{
				self.ele.find('.header').show();
				self.ele.find('.scroller').css('top','30px')
			}
		}
	}
	self.destroy=function(){

	}
	self.renderPage=function(data){
		//start infinitscroller!
		if(self.infinitescroller) self.infinitescroller.destroy();
		self.infinitescroller=new modules.infinitescroll({
            ele:self.ele.find('.pagecontent'),
            scroller:self.ele.find('.scroller'),
            endpoint:app.sapiurl+'/module/browser/feed',
            loaderClass:'lds-ellipsis-black',
            offset:'200%',
            loadData:data,
            swipeContainer:(self.options.swipeContainer)?self.options.swipeContainer:false,
            opts:{
            	page:self.options.page,//use the current category
            	type:self.options.type,
            	showAll:(self.options.dontShowAll)?'':1
            },
            disableNextPage:true,
            template:(self.options.page=='qotd')?'browser_item_qotd':'browser_item',
            endOfList:' ',
            nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>You havent bookmarked anything yet.</div></div>',
            onPageReady:function(ele){
            	ele.find('.browsernav').stap(function(){
            		if($(this).hasClass('comingsoon')){
            			app.comingSoon();
            			return false;
            		}
            		var id=$(this).attr('data-id');
            		//var item=self.infinitescroller.getById(id);
            		//console.log(item)
            		var p=self.infinitescroller.getById(id);
            		if(self.options.page=='qotd'){
            			self.returnPage({
            				id:p.tag_id,
            				name:p.tag_name,
            				content_parent:'qotd'
            			});
            		}else{
						if(p[self.options.type+'_children']&&p[self.options.type+'_children'].length){
							self.setPage(id,p);
						}else{
							self.returnPage(p);
						}
					}
            	},1,'tapactive');
                //pself.bindNotifications(ele);//bind all posts in that page!
            },
            scrollBindings:{
                scrollStart:function(){
                },
                scroll:function(obj){
                }
            }
        });
	}
	self.returnPage=function(page){
		if(self.options.onPageSelect) self.options.onPageSelect(page);
		if(self.options.hideOnReturn) self.hide();
	}
	self.render=function(){
		if(self.resp.success){
			self.ele.find('.content').render({
				template:'browser_page',
				append:false,
				data:{
					header:self.getHeader(self.resp)
				},
				binding:function(ele){
					//self.ele=ele;
					ele.find('.navname').fitContentBounds();
					ele.find('.navname').stap(function(){
						var id=$(this).attr('data-page');
						self.setPage(id);
					},1,'tapactive');
					if(self.resp.data.tag) self.options.page=self.resp.data.tag.id;
					self.ensureVisibility();
					self.renderPage({
		            	success:true,
		            	data:self.resp.data.children,
		            });
				}
			})
		}else{
			self.ele.find('.content').render({
				template:'browser_reload',
				append:false,
				data:{
					resp:self.resp
				},
				binding:function(ele){
					ele.find('.x_retry').stap(function(){
						ele.find('.x_retry').find('i').addClass('animate-spin')
						self.load(function(){
							self.render();
						})
					},1,'tapactive')
				}
			})
		}
	}
	self.load=function(cb){
		//clear out/show loader!
		 app.api({
            url: app.sapiurl+'/module/browser/load',
            data:{
            	type:self.options.type,
            	page:self.options.start,
            	sort:self.options.sort
            },
            timeout:5000,
            append:false,
            callback:function(data){
            	self.resp=data;
            	console.log(self.resp)
                if(cb) cb();
            }
        });
	}
	self.init()
}