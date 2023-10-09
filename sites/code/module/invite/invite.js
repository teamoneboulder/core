modules.invite=function(options){
	var self=this;
	self.options=options;
	this.show=function(){
		self.to=[];
        $('body').render({
        	template:'invite_page',
        	data:{
        		title:'Invite Friends',
        		nav:[{
			        _id:'suggested',
			        name:'Suggested'
			    },{
			        _id:'selected',
			        name:'<div class="pcount"></div> Selected'
			    }]
        	},
        	binding:function(ele){
        		self.ele=ele;
        		window._ui.register('invitenav',{
                    onNavSelect:function(cur){
                        self.setPage(cur);
                    }
                });
                ele.find('.x_share').stap(function(){
                    self.share();
                },1,'tapactive')
                ele.find('.x_closer').stap(function(){
					self.hide();
				},1,'tapactive')
				self.dragger=Draggable.create(ele.find('.swiper'), {
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
			        		self.hide();
			        	}else{
			        		TweenLite.to(ele.find('.pane'),.3,{y:0});
			        	}
			        }
			    });
                self.searchbar=new modules.search({
                    input:ele.find('.taginput'),
                    allowAdd:false,
                    renderTemplate:'modules_search_user_event',
                    exclude:$.extend(true,[],self.to),
                    dontShow:[app.user.profile.id],
                    endpoint:app.apiurl2+'/search/aggregate',
                    endpointData:{
                        event:options.id,
                        filters:['people']
                    },
                    searchEle:ele.find('.searchele'),
                    cancelEle:ele.find('.tagcancel'),
                    onKeyUp:function(val){
                    },
                    scrollStart:function(){
                    	modules.keyboard_global.hide()
                    },
                    onSelect:function(id,item){//might want or need full item.
                    	self.setPage('selected');//
                        self.addPerson(item);
                    }
                });
                self.renderPeople();
                self.setPage('suggested');
                TweenLite.set(ele.find('.pane'),{y:'100%'});
                self.setSuggested();
                self.setCount();
                setTimeout(function(){
					TweenLite.to(ele,.3,{background:'rgba(55,55,55,.3)'})
					TweenLite.to(ele.find('.pane'),.3,{y:'0%',onComplete:function(){
						self.suggested.onPageReady();
					}})
				},50)
        	}
        })
    }
    this.removePerson=function(user,norerender){
    	self.to.splice(self.to.indexOf(user.id),1);
        if(self.to_info[user.id]) delete self.to_info[user.id];
        if(!norerender||self.to.length===0) self.renderPeople();
        //update count!
        self.setCount(self.to.length);
        //ensure suggested
		self.suggested.scroller.getScroller().find('[data-id='+user.id+']').removeClass('invited');
    }
    this.addPerson=function(user){
    	self.to.push(user.id);
        if(!self.to_info) self.to_info={};
        self.to_info[user.id]=user;
        self.renderPeople();
        //update count!
        self.setCount(self.to.length);
         //ensure suggested
		self.suggested.scroller.getScroller().find('[data-id='+user.id+']').addClass('invited');
    }
    this.setCount=function(count){
    	if(count){
    		self.ele.find('.pcount').html(count);
    		self.ele.find('.pcount').show();
    	}else{
    		self.ele.find('.pcount').hide();
    	}
    }
    this.setSuggested=function(){
    	self.suggested=new modules.infinitescroll({
            ele:self.ele.find('.suggestedlist'),
            endpoint:app.sapiurl+'/module/invite/suggested',
            loaderClass:'lds-ellipsis-black',
            offset:'200%',
            asyncLoad:true,
            // onInterval:{
            // 	time:3000,
            // 	callback:function(){
            // 		pself.updateTimes();
            // 	}
            // },
            opts:{
            	event:options.id
            },
            max:10,
            template:'invite_item',
            nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>We dont have any suggestions for you, add some friends!</div></div>',
            onPageReady:function(ele){
            	ele.find('.x_invite').stap(function(){
            		var p=$(this).parents('.inviterow').first();
        			var id=$(this).attr('data-id');
            		var user=self.suggested.getById(id);
            		if(!p.hasClass('invited')){
            			p.addClass('invited');
	            		self.addPerson(user);
            		}else{
            			p.removeClass('invited');
	            		self.removePerson(user);
            		}
            	},1,'tapactive')
                //pself.bindNotifications(ele);//bind all posts in that page!
            },
            onUpdate:function(){
                //pself.clearNotificationCount();
            },
            scrollBindings:{
                scrollStart:function(){
                },
                scroll:function(obj){
                }
            }
        });
    }
    this.setPage=function(page){
    	self.ele.find('.x_swipenavitem').removeClass('selected');
    	self.ele.find('[data-nav='+page+']').addClass('selected');
    	self.ele.find('.pages').hide();
    	self.ele.find('[data-page='+page+']').show();
    	self.cpage=page;
    }
    this.hide=function(){
		modules.keyboard_global.hide();
		setTimeout(function(){
			TweenLite.to(self.ele,.3,{background:'rgba(55,55,55,0)'})
			TweenLite.to(self.ele.find('.pane'),.3,{y:'100%',onComplete:function(){
				setTimeout(function(){
					self.destroy();
				},50);
			}})
		},50)
	}
    this.renderPeople=function(){
    	if(self.to.length){
    		var data=$.extend(true,{},{
            	order:self.to,
            	list:self.to_info
            });
            data.order.reverse();//put most recent invite at top!
    		if(self.rscroller){
    			self.rscroller.setData(data)
    		}else{
	    		self.rscroller=new modules.infinitescroll({
		            ele:self.ele.find('.searchresults'),
		            data:data,
		            loaderClass:'lds-ellipsis-black',
		            offset:'200%',
		            opts:{
		            	invited:true
		            },
		            max:10,
		            template:'invite_item',
		            endOfList:' ',
		            nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>We dont have any suggestions for you, add some friends!</div></div>',
		            onPageReady:function(ele){
		            	ele.find('.x_invite').stap(function(){//remove only, will re-render?
		            		var id=$(this).attr('data-id');
		            		var user=self.suggested.getById(id);
		            		$(this).parents('.inviterow').fadeOut(500,function(){
		            			$(this).remove();
		            		})
		            		self.removePerson(user,1);
		            	},1,'tapactive')
		                //pself.bindNotifications(ele);//bind all posts in that page!
		            },
		            onUpdate:function(){
		                //pself.clearNotificationCount();
		            },
		            scrollBindings:{
		                scrollStart:function(){
		                },
		                scroll:function(obj){
		                }
		            }
		        });
	    	}
    	}else{
    		self.ele.find('.searchresults').render({
    			append:false,
    			template:'invite_no_results'
    		})
    	}
    }
    this.destroy=function(){
    	if(self.searchbar) self.searchbar.destroy();
    	if(self.rscroller) self.rscroller.destroy();
    	if(self.dragger) self.dragger[0].kill();
    	self.ele.remove();
    }
    this.share=function(){
        if(self.sending) return false;
        if(!self.to.length){
            modules.toast({
                content:'You must select at least one person to share with.',
                remove:2500,
                icon:'icon-warning-sign'
            })
            return false;
        }
        self.sending=true;
        self.ele.find('.x_share').find('i').removeClass('icon-send').addClass('icon-refresh animate-spin');
        app.api({
            url:app.sapiurl+'/module/invite/send',
            data:{
                to:self.to,
                type:options.type,
                id:options.id
            },
            timeout:5000,
            callback:function(resp){
                self.sending=false;
                self.ele.find('.x_share').find('i').addClass('icon-send').removeClass('icon-refresh animate-spin')
                if(resp.success){
                	modules.toast({
                        content:'Sent invites to '+self.to.length+' people!',
                        remove:2500,
                        icon:'icon-thumbs-up'
                    })
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
}