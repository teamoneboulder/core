if(!window.modules) window.modules={};
modules.emojistats=function(options){
	var self=this;
	self.options=options;
	this.show=function(){
		var rele=(options.ele)?options.ele:$('body');
		//build nav!
		var nav=[];
		nav.push({
			id:'all',
			name:'All',
			selected:true
		})
		self.selected='all';
		$.each(options.post.stats.reactions,function(i,v){
			var tnav={
                id:i,
                name:modules.feed_global.reactions.list[i].name,
                svg:modules.feed_global.reactions.list[i].svg
            };
            // if(nav.length==0){
            // 	self.selected=tnav.id;
            // 	tnav.selected=true;
            // }
			nav.push(tnav)
		})
		rele.render({
			template:'modules_emojistats',
			data:$.extend(true,{},{nav:nav,reactions:modules.feed_global.reactions},{title:options.title,stats:options.post.stats}),
			binding:function(ele){
				self.ele=ele;
				window._ui.register('emojistats',{
                    onNavSelect:function(cur,ele){
                    	self.selected=cur;
                    	self.loadFeed();
                    }
                })
                self.loadFeed();
				self.draggable=Draggable.create(ele.find('.pane2'), {
			        type:"y",
			        bounds:{minX:0,maxX:0,minY:0,maxY:300},
			        lockAxis:true,
			        throwProps:true,
			        force3D:true,
			        cursor:'defualt',
			        edgeResistance:1,
			        onDrag:function(e){
			        	//phi.stop(e)
			        	TweenLite.set(ele.find('.pane'),{y:this.y})
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
			    ele.find('.x_close').stap(function(){
			    	self.hide();
			    },1,'tapactive')
				setTimeout(function(){
					TweenLite.set(ele.find('.pane2').css('bottom',ele.find('.page').outerHeight()));
					TweenLite.to(ele,.3,{background:'rgba(55,55,55,.3)'})
					TweenLite.to(ele.find('.pane'),.3,{y:'-100%',onComplete:function(){
						console.log('canrender')
					}})
				},10)
				ele.find('.navitem').stap(function(){
					self.selected=$(this).attr('data-id');
					setTimeout(function(){
						self.hide();
					},20)
				},1)
			}
		})
	}
	this.loadFeed=function(){
		if(self.infinitescroller) self.infinitescroller.destroy();
		self.infinitescroller=new modules.infinitescroll({
            ele:self.ele.find('.results'),
            endpoint:self.options.endpoint,
            loaderClass:'lds-ellipsis-black',
            offset:'200%',
            opts:{
            	id:self.options.post.id,
               	type:self.selected 
            },
            max:10,
            template:'emojistats_item',
            endOfList:' ',
            nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>Nothing here.</div></div>',
            onPageReady:function(ele){
                //pself.bindNotifications(ele);//bind all posts in that page!
                ele.find('.x_viewprofile').stap(function(e){
					//phi.stop(e);
					var id=$(this).attr('data-id');
					self.viewProfile=id;
					self.hide();
				},1,'tapactive');
            },
            scrollBindings:{
                scrollStart:function(){
                },
                scroll:function(obj){
                }
            }
        });
		// self.ele.find('.results').render({
		// 	append:false,
		// 	template:'modules_emojistats_loading'
		// });
		// app.api({
  //           url:self.options.endpoint,
  //           data:{
  //              id:self.options.post.id,
  //              type:self.selected 
  //           },
  //           timeout:5000,
  //           callback:function(resp){
  //           	self.cdata=resp.data;
  //               self.renderFeed(resp);
  //           }
  //       });
	}
	this.renderFeed=function(resp){
		self.ele.find('.results').render({
			append:false,
			template:'modules_emojistats_feed',
			data:resp,
			binding:function(ele){
				ele.find('.x_viewprofile').stap(function(e){
					//phi.stop(e);
					var id=$(this).attr('data-id');
					self.viewProfile=id;
				},1,'tapactive');
				//set scroll!
				new modules.scroller(ele,{forceNative:true});
			}
		})
	}
	this.hide=function(){
		setTimeout(function(){
			TweenLite.to(self.ele,.5,{background:'rgba(55,55,55,0)'})
			TweenLite.to(self.ele.find('.pane'),.5,{y:'100%',onComplete:function(){
				if(self.options.onProfileSelect&&self.viewProfile) self.options.onProfileSelect(self.infinitescroller.getById(self.viewProfile).user);
				setTimeout(function(){
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