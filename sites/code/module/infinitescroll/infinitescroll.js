if(!window.modules) window.modules={};
modules.infinitescroll=function(options){
	var self=this;
	//console.log(options)
	if(!options.scrollBindings) options.scrollBindings={};
	if(!options.endOfList&&options.endOfList!==false) options.endOfList='End of List';
	if(!options.noResults) options.noResults='No Results';
	if(!options.endOfListColor) options.endOfListColor='Black';
	if(!options.max) options.max=15;
	self.options=options;
	//self.debug=true;
	if(options.debug) self.debug=true;
	this.log=function(msg,debug){
		if(self.debug||debug){
			if(typeof msg=='object') console.log('INFINITESCROLL',msg);
			else console.log('INFINITESCROLL: '+msg);
		}
	}
	this.initScroller=function(){
		if(self.options.swipeToClose&&!self.options.scrollBindings.scroll){
			self.options.scrollBindings.scroll=function(){
				var y=self.scroller.scrollTop();
            	if(isPhoneGap()){
                    var ct=new Date().getTime();
                    var y=self.scroller.scrollTop();
                    if(Keyboard.isVisible){
                        var last=self.scroller.last;
                        if(last&&last.y){
                            var diffy=y-last.y;
                            if(diffy<0){
	                            var difft=ct-last.ts;
	                            var speed=diffy/difft;
	                            if(speed<-2){
	                                modules.keyboard_global.hide();
	                            }
	                        }
                        }
                    }
                    self.scroller.last={
                    	y:y,
                    	ts:ct
                    }
                }
            }
		}
		//add storing scroll position, done in scroller now
		// if(options.context&&options.context.store){
		// 	self.scrollCustom=self.options.scrollBindings.scroll;
		// 	self.options.scrollBindings.scroll=function(){
		// 		if(self.scrollCustom) self.scrollCustom();
		// 		options.context.store.scrollY=self.scroller.scrollTop();
		// 	}
		// }
		if(self.options.horizontal){
			var opts={eventPassthrough: true, scrollX: true, scrollY: false, preventDefault: true,probeType:3};//type:'iscroll'
			//opts.type='iscroll'
			self.options.scrollBindings={
				scroll:function(obj){
					var offset=(self.options.offset)?self.options.offset:'200%';
					if(self.withinView(false,offset,obj)&&!self.loading&&self.lastCount!=0){//ensure if its at end of list it doesnt load again
						self.nextPage(self.cwele);
						self.loading=1;
					}
				}
			}
			if(self.options.snapTo){
				opts.snap=self.options.snapTo;
				opts.snapTo=self.options.snapTo;
			}
		}else{
			var opts={forceNative:1};
		}
		if(options.swipeContainer) opts.swipeContainer=options.swipeContainer;
		if(options.context&&!self.options.horizontal) opts.context=options.context;
		if(options.noSwipe) opts.noSwipe=true;
		self.scroller=new modules.scroller(self.getScroller(),opts,self.options.scrollBindings);
		if(df(self.options,'context.store.scrollY')){
			self.scroller.scrollTop(df(self.options,'context.store.scrollY'))
		}
	}
	this.init=function(){
		if(options.search){
			self.bindSearch()
		}
		self.start();
		self.initScroller();
		if(self.options.loadData){
			self.onLoadData(false,self.options.loadData,(self.options.opts)?$.extend(true,{},self.options.opts):{});
		}else{
			options.ele.css('minHeight','50vh');
			_ui.pageloader.render({theme:false,themeClass:(options.loaderClass)?options.loaderClass:'',feed:self.isFeed()},options.ele,1);
			if(!options.waitForReload&&!options.filter2){
				self.load();
			}
		}
		if(self.options.viewselect){
			var opts=$.extend(true,{},self.options.viewselect);
			opts.onUpdate=function(id,view){
				if(view.responsive){
					self.options.inline=true;
				}else{
					self.options.inline=false;
				}
				self.reload();
				if(self.filter) self.filter.hide()
				if(options.onViewChange) options.onViewChange(id);
			}
			opts.onInit=function(view){
				if(options.onViewChange) options.onViewChange(view);
			}
			opts.list=options.ele;
			self.viewselect=new modules.viewselect(opts);
		}
		if(self.options.filter){
			self.loadFilter();
		}
		if(self.options.filter2){
			self.loadFilter2();
		}
	}
	this.setFilterItem=function(id,val){
		if(self.filter){
			self.filter.setFilter(id,val,1);
		}
	}
	this.loadFilter=function(){
		var opts=$.extend(true,{},self.options.filter);
		opts.noHeightChange=true;
		opts.onFilterChange=function(filter,preview){
			self.options.opts.filter=filter;
			self.reload();
		}
		opts.list=options.ele;
		self.filter=new modules.filter(opts);
	}
	this.loadFilter2=function(){
		var opts=$.extend(true,{},self.options.filter2);
		opts.noHeightChange=true;
		opts.onFilterChange=function(filter,preview){
			self.options.opts.filter=filter;
			self.reload();
		}
		opts.onFilterStart=function(filter){
			if(!self.options.opts) self.options.opts={}
			self.options.opts.filter=filter;//initial load filter!
			self.load();
		}
		opts.list=options.ele;
		phi.register('filter2',opts,function(instance,reload){
			self.filter=instance;
		});
	}
	this.getTemplate=function(){
		var template=self.options.template;
		if(self.options.viewselect){
			template=self.viewselect.getTemplate();
		}
		if(self.options.getTemplate) return self.options.getTemplate();
		return template;
	}
	this.clearSearch=function(){
		if(self.csearch){
			self.csearch='';
			self.options.search.input.val('');
			self.options.opts.search='';
			self.reload();
		}
		self.options.search.closer.hide();
		if(options.search.onClear) options.search.onClear();
	}
	this.bindSearch=function(){
		options.search.input.on('input',function(){
			self.csearch=$(this).val();
			self.options.opts.search=self.csearch;
			self.reload();
			if(!self.csearch&&!options.search.allowBlank){
				if(options.search.closer) options.search.closer.hide();
			}
		}).on('focus',function(){
			if(options.search.closer) options.search.closer.show();
		});
		if(options.search.closer){
			options.search.closer.stap(function(){
				self.clearSearch()
			},1,'tapactive')
		}
	}
	this.start=function(){
		self.running=1;
		if(options.channel) app.user.startSocket(options.channel, self.onUpdate);
		if(self.onStart) self.onStart();
		self.checkUpdate();
		self.setInterval();
	}
	this.clear=function(){
		options.ele.html('');
		if(options.horizontal){
			self.options.ele.css('width','');
			self.options.ele.attr('data-width','');
		}
		_ui.pageloader.render({theme:false,themeClass:(options.loaderClass)?options.loaderClass:'',feed:self.isFeed()},options.ele);
	}
	this.isFeed=function(){
		if(options.isFeed&&options.isFeed(self)) return 1;
		return 0;
	}
	this.stop=function(){
		if(options.channel) app.user.stopSocket(options.channel, self.onUpdate);
		self.running=0;
		self.stopInterval();
	}
	this.setInterval=function(){
		if(self.options.onInterval){
			self.interval=setInterval(function(){
				self.options.onInterval.callback();
			},self.options.onInterval.time)	
		}
	}
	this.stopInterval=function(){
		if(self.options.onInterval&&self.interval){
			clearInterval(self.interval);
		}
	}
	this.onUpdate=function(msg){
		if(msg&&msg.type){
			var data=(msg.data)?msg.data:{};
			switch(msg.type){
				case 'onUpdate':
					self.add(data,1);//auto udpate if exists
				break;
				case 'onCreate':
					if(msg.data){
						self.add(data);//
					}else{
						self.reload();
					}
				break;
				case 'onDelete':
					self.remove(data);//
				break;
				default:
					console.warn('Invalid method ['+msg.type+']')
				break;
			}
		}else{
			if(self.loaded){
				self.reload();
			}
		}
		if(options.onUpdate) options.onUpdate(msg.data[self.getDataKey()]);
	}
	this.onResume=function(cb){
		if(self.options.clearOnResume){
			self.reload();
		}else if(!self.options.disableResume){//try to add new onese
			self.load(function(success){
				if(success){
					if(cb) cb(self.mostRecent);
				}
			},1);
		}else{
			self.log('Resume Disabled')
		}
	}
	this.getDataKey=function(){
		return (self.options.datakey)?self.options.datakey:'id';
	}
	this.onMessage=function(msg){
		if(msg._type){
			self.log(msg);
		}else{
			if(!self.data) self.data={};
			self.data[msg[self.getDataKey()]]=msg;//register it!
			self.setMostRecent(msg);
		}
	}
	this.setMostRecent=function(item){
		if(self.options.recentKey){
			self.mostRecent=df(item,self.options.recentKey);
		}else{
			self.mostRecent=item._id;
		}
		self.log('set most recent to ['+self.mostRecent+']');
	}
	this.retry=function(){//if bad network, heres a retry!
		self.load();
	}
	this.load=function(cb,newest,dontRender){
		var data=(self.options.opts)?$.extend(true,{},self.options.opts):{};
		if(newest){
			data.after=self.mostRecent;
			data.max=100;//just do em all
		}else{
			if(self.last||self.last===0) data.last=self.last;
			if(options.max) data.max=options.max;
		}
		if(!self.last){
			var loadId=Math.uuid(16);
			self.loadId=loadId;
		}else{
			var loadId=self.loadId;
		}
		if(self.options.endpoint){
			self.log('====LOAD=====');
			self.log(data);
			var api=(app.api)?app.api:modules.api;
			api({
				url:(self.csearch&&self.options.search&&self.options.search.endpoint)?self.options.search.endpoint:self.options.endpoint,
				dataType:(self.options.dataType)?self.options.dataType:'jsonp',
				data:data,
	            timeout:5000,
				callback:function(resp){
					if(self.options.processResponse) resp=self.options.processResponse(resp);
					if(loadId==self.loadId){
						self.onLoadData(cb,resp,data,newest,dontRender);
					}else{
						console.warn('Another page was loading, but a new set of data started loading')
					}
				}
			});
		}else if(self.options.data||self.options.data===false){
			//get subset of data!
			var resp=self.getData();
			self.onLoadData(cb,resp,data,newest,dontRender);
		}else{
			console.warn('Invalid Data Source!');
		}
	}
	this.setData=function(data){
		self.options.data=data;
		self.reload();
	}
	this.getData=function(){
		if(!self.last) self.last=0;
		if(!self.options.data){
			return {
				success:true,
				data:false
			}
		}
		var order=self.options.data.order.slice(self.last,self.options.max);
		var list={};
		$.each(order,function(i,v){
			list[v]=self.options.data.list[v];
		})
		var resp={
			success:true,
			data:{
				order:order,
				list:list,
				last:(self.last+self.options.max)
			}
		}
		return resp;
	}
	this.getScroller=function(){
		return (self.options.scroller)?self.options.scroller:self.options.ele.parent();
	}
	this.onLoadData=function(cb,resp,data,newest,dontRender){
		var loaded=0;
		if(options.search&&data.search&&data.search!=self.csearch){
			console.warn('another search is in progress...wait');
			return false;
		}
		if(newest&&resp.data&&resp.data.order&&resp.data.order.length){
			//self.mostRecent=resp.data.order[0];
			self.setMostRecent(resp.data.list[resp.data.order[0]]);
		}
		if(dontRender){
			return cb(true);//just check to see if there is anything more recent
		}
       	if(resp.success){
       		if(!self.loaded){
				self.options.ele.children().remove()//clear out loading
				if(self.options.onLoad) self.options.onLoad(resp);
				if(resp.data&&resp.data.order&&resp.data.order.length){
					//self.mostRecent=resp.data.order[0];
					if(!self.loaded) self.setMostRecent(resp.data.list[resp.data.order[0]]);
				}
				loaded=1;
				self.loaded=1;
				//if(resp.data&&resp.data.extra&&self.options.onExtraData) self.options.onExtraData(resp.data.extra);
				//internally handle!
			}
       		self.lastUpdate=new Date().getTime();
       		if(resp.data){
       			if(newest){//dont set last on newest request
       				self.options.ele.find('.no_data').remove();
       			}else{
       				self.last=resp.data.last;
       				self.log('setting last to ['+self.last+']');
       			}
           		if(!self.data) self.data=resp.data.list;
           		else self.data=$.extend({},self.data,resp.data.list);
           	}
       		//render list
       		if(self.options.asyncLoad&&!self.options.asyncLoaded){
       			self.onAsyncReady=resp;
       		}else{
       			self.renderList(resp.data,loaded,newest,false);
				if(cb) cb(true);
       		}
       		if(loaded&&self.options.onAsyncReady&&!self.theFirstLoad) self.options.onAsyncReady();//will fire in any case
       		if(self.options.onFirstLoad&&!self.firstLoad) self.options.onFirstLoad(resp);
       		self.firstLoad=true;
       		self.theFirstLoad=true;//this caches and doesnt clear on reload or anything else, this is because onasyncready should *only* fire once, ever
       	}else{
       		if(self.data){//replace waypoint with retry option

       		}else{//show load error!
       			if(self.options.onLoadError) self.options.onLoadError(resp);
       			else{//internal show error
       				self.showLoadError(resp,cb);
       			}
       			if(self.options.onAsyncReady) self.options.onAsyncReady();//will fire in any case
       		}
       		if(cb) cb(false);
       		//append an error
       	}
	}
	this.showLoadError=function(resp,cb){
		var retry=true;
		if(self.options.noRetry&&self.options.noRetry.indexOf(resp.error)>=0){
			retry=false;
		}
		if(resp.disableRetry){
			retry=false;
		}
		if(!self.options.handleError||(self.options.handleError&&!self.options.handleError(self.options.ele,resp))){
	        self.options.ele.render({
	            append:(self.loaded)?true:false,
	            template:'infinitescroll_load_error',
	            data:{
	                icon:(resp.type=='internet')?'icon-tower':'icon-info-circled-alt',
	                message:modules.tools.loc(resp.error),
	                themeclass:'',
	                retry:retry
	            },
	            binding:function(ele){
	            	if(self.options.retryBindings) self.options.retryBindings(ele);
	                ele.find('.x_retry').stap(function(){
	                    $(this).find('i').addClass('animate-spin');
	                    self.load(cb);
	                },1,'tapactive')
	            }
	        })
	    }
    }
	this.onPageReady=function(){
		self.options.asyncLoaded=1;
		if(self.loaded&&self.onAsyncReady) self.renderList(self.onAsyncReady.data,1);//will always be first load!
	}
	this.scrollTop=function(){
		self.scroller.scrollToTop(300);
	}
	this.reload=function(cb){
		self.log('RELOAD');
		//clear out data and reload
		if(self.last) delete self.last;
		if(self.waypoint) self.waypoint.destroy();
		if(self.options.onClear) self.options.onClear();
		if(self.scroller) self.scroller.scrollTop(0);
		self.clearStickys()
		self.loaded=0;
		self.firstLoad=0;
		self.mostRecent=false;
		self.order=[];
		self.lastHeader='';
		self.data=false;
		//show loading!!!
		self.clear();
		self.load(cb);
	}
	this.checkUpdate=function(){
		self.log('Check update');
		if(self.options.disableUpdateOnStart) return false
		if(self.loaded){
			if(self.options.reloadele){//dont go by time, but
				var mr=self.mostRecent;
				self.load(function(success){
					if(success){
						if(mr&&self.mostRecent!=mr){//theres new posts!
							self.options.reloadele.show();
						}
					}
				},1,1);
			}else{
				//show loader!?!
				if(self.options.clearOnResume){
					self.clear();
					self.reload();
				}else{
					self.load(function(success){
						
					},1);
				}
			}
		}
	}
	this.getLastUpdate=function(){
		return self.lastUpdate;
	}
	this.ensure=function(){
		self.scroller.ensure();
	}
	this.order=[];
	this.remove=function(data){
		if(self.options.ele.find('[data-id='+data[self.getDataKey()]+']').length){//re-render!
			self.options.ele.find('[data-id='+data[self.getDataKey()]+']').fadeOut(500,function(){
				$(this).remove();
			});
		}
		if(!self.data){
            self.data={};
        }
        if(self.data[data[self.getDataKey()]]) delete self.data[data[self.getDataKey()]];
        if(self.order.indexOf(data[self.getDataKey()])>=0){
        	self.order.splice(self.order.indexOf(data[self.getDataKey()]),1);
        }
	}
	this.add=function(data,update){
		if(self.options.ele.find('[data-id='+data[self.getDataKey()]+']').length){//re-render!
			phi.render(self.options.ele.find('[data-id='+data[self.getDataKey()]+']'),{
				contextElement:false,
	            template:self.getTemplate(),
	            context:self.options.context,
	            id:data[self.getDataKey()],
	            replace:true,
	            data:{
	            	opts:self.options.opts,
	                data:data,
	                renderData:self.options.renderData
	            },
	            //debug:true,
	            binding:function(ele){
	            	if(!options.inline){
	            		if(!ele.parent().hasClass('updated')){
	            			ele.wrap('<div class="updated">');
	            		}
	            		ele=ele.parent();
	            	}
	            	if(self.options.onPageReady) self.options.onPageReady(ele);//do bindings
	            	self.options.ele.find('.no_data').remove();
	            }
	        });
		}else if(!update){
			if(self.options.horizontal){//because we 
				var list={
					order:[],
					list:{}
				}
				list.order.push(data[self.getDataKey()]);
				list.list[data[self.getDataKey()]]=data;
				self.renderList(list,false,false,false,1);
			}else{
				phi.render(self.options.ele,{
					id:data[self.getDataKey()],
					context:self.options.context,
					contextElement:false,
		            template:'infinitescroll_single',
		            prepend:true,
		            data:{
		            	opts:self.options.opts,
		            	render_template:self.getTemplate(),
		                data:data,
		                renderData:self.options.renderData
		            },
		            binding:function(ele){
		            	if(self.options.onPageReady) self.options.onPageReady(ele);//do bindings
		            	self.options.ele.find('.no_data').remove();

		            }
		        });
			}
		}
        if(!self.data){
            self.data={};
        }
        self.data[data[self.getDataKey()]]=data;
        if(self.options.lastKey){
        	self.last=data[self.options.lastKey];
        }
	}
	this.getById=function(id){
		return (self.data&&self.data[id])?self.data[id]:false;
	}
	this.getByIndex=function(index){
		if(self.data){
			var id=self.order[index];
			return (self.data&&self.data[id])?self.data[id]:false;
		}else return false;
	}
	this.getByKeyId=function(match,value,returnField){
		var d=false;
		$.each(self.data,function(i,v){
			if(v[match]==value){
				d=v[returnField];
			}
		})
		return d;
	}
	this.getList=function(){
		return $.extend(true,{},{
			list:self.data,
			order:self.order
		})
	}
	this.getIndexById=function(id){
		var index=self.order.indexOf(id);
		if(index>=0) return index;
		return false;
	}
	this.setById=function(id,data){
		if(self.data&&self.data[id]){
			self.data[id]=data;
		}
	}
	this.clearStickys=function(){
		if(self.stickys){
			$.each(self.stickys,function(i,v){
				v.destroy();
			})
		}
		self.stickys=[];
		self.stickyCount=0;
		if(self.stickyele) self.stickyele.html('');
	}
	this.destroy=function(){
		if(self.options.onClear) self.options.onClear();
		if(self.filter) self.filter.destroy();
		self.clearStickys()
		self.stop()
		delete self;	
	}
	this.enable=function(){
		self.scroller.enable();
	}
	this.disable=function(){
		self.scroller.disable();
	}
	this.getHeight=function(){
		return self.scroller.getHeight();
	}
	this.nextPage=function(ele){
		if(self.options.disableNextPage) return false;
		if((self.options.checkNextPage&&self.lastCount!=0)||self.lastCount==self.options.max){//last page was a full page..see if there are more!...might not be full page because permissions!
			self.log('nextpage!')
			if(self.options.buttonLoad&&!self.smoothReverseScroll()){
				ele.find('.waypoint').render({
		        	template:'module_infinitescroll_buttonload',
		        	binding:function(tele){
		        		tele.stap(function(e){
		        			phi.stop(e);
		        			ele.find('.waypoint').render({
		        				append:false,
		        				data:{
		        					horizontal:(self.options.horizontal)?1:0
		        				},
					        	template:'module_infinitescroll_loading'
					        })
					        self.load();
		        		},1,'tapactive');
		        	}
		        })
			}else{
				ele.find('.waypoint').render({
		        	template:'module_infinitescroll_loading',
		        	data:{
		        		horizontal:(self.options.horizontal)?1:0,
		        		snapTo:(self.options.snapTo)?self.options.snapTo:false
		        	}
		        });
		        if(self.options.horizontal){//add width of new element
		        	var cw=parseFloat(ele.attr('data-width'));
		        	var pw=parseFloat(ele.parent().attr('data-width'));
		        	var wpw=ele.find('.waypoint').width();
		        	cw+=wpw;
		        	pw+=wpw;
		        	ele.width(cw);
					ele.parent().width(pw);
		        }
		        self.load();
		    }
	    }else{
	    	self.renderList(false);//its the end of the list...
	    }
	}
	this.withinView=function(ele,offset,obj){
		if(self.options.horizontal){
			if(!obj) obj={x:0};
			if(ele){
				var totalwidth=ele.offset().left;
				self.lastTotalWidth=totalwidth
			}else{
				var totalwidth=self.lastTotalWidth;
			}
			var width=$('body').width();
			var curleft=Math.abs(obj.x);
			var diffp=((totalwidth-(curleft))/width)*100;
			var setpoint=parseInt(offset,10);
			if(setpoint>0){//below view, from top of view
				if(diffp<setpoint) return true;
			}else{
				if(diffp>setpoint) return true;
			}
			// return false;
			return false;
		}else{
			var p=ele.offset();
			var scrollerOffset=self.scroller.getOffset();
			var height=self.scroller.getContainerHeight();
			var diffp=((p.top-scrollerOffset.top)/height)*100;
			var setpoint=parseInt(offset,10);
			if(setpoint>0){//below view, from top of view
				if(diffp<setpoint) return true;
			}else{
				if(diffp>setpoint) return true;
			}
			return false;
		}
	}
	this.getScrollOffset=function(){
		var ch=self.getHeight();
		var diff=ch-self.currentHeight;
		var total=diff+self.currentOffset;
		return total;
	}
	this.stickys=[];
	this.stickyCount=0;
	this.getStickyOffset=function(){
		var total=55
		if(isPhoneGap()){
			if(phone.hasNotch()){
				total=85
			}else{
				total=75
			}
		}
		if(options.stickeyOffset) total+=options.stickeyOffset;
		return total+'px';
	}
	this.bindWaypoint=function(ele,offset){
		self.cwele=ele;
		if(!ele.is(':visible')) return false;
		if(options.sticky){
			ele.find(options.sticky).each(function(i,v){
				self.stickys.push(new Waypoint({
				  element: v,
				  offset: self.getStickyOffset(),
				  context: self.scroller.getContainer()[0],
				  handler: function(dir) {
				  	if(dir=='down'){//this will trigger a down on initalization
				  		self.stickyCount++;
				  		self.stickyele.html($(self.options.ele.find(options.sticky)[self.stickyCount-1]).clone());
				  	}else{//use previous one!
				  		self.stickyCount--;
				  		self.stickyele.html($(self.options.ele.find(options.sticky)[self.stickyCount-1]).clone());
				  	}
				  }
				}))
			})
		}
		if(self.withinView(ele.find('.waypoint'),offset)){
			self.log('inview')
			self.nextPage(ele);
		}else{//bind waypoint
			//refresh first! (container size changed, need to fix)
			if(!self.options.horizontal){
				self.waypoint=new Waypoint({
	                element:ele.find('.waypoint')[0],
	                context: self.scroller.getContainer()[0],
	                offset: offset,
	                triggerOnce:true,
	                enabled: (self.running)?true:false, //here is the modified line
	                handler: function(dir) {
	                	//return false;
	                	if(self.options.reverse){
	                    	if(dir=='up'){//this will trigger a down on initalization
	                    		self.log('nextpage')
	                    		//self.log(self.scroller.scrollTop(),this.triggerPoint);
		                        this.disable();
		                        self.nextPage(ele);
		                    }
		                }else{
		                	this.disable();
		                    self.nextPage(ele);
		                }
	                }
	            });
			}
		}
	}
	this.checkHeader=function(keydata,obj,header){
		var returndata='';
		if(keydata&&keydata.$date) keydata=keydata.$date;//TSU
		switch(header.rule){
			case 'samedate':
				var check=false;
				if(self.lastHeader){
					var d1=modules.moment.format(keydata,'lastdate',false,1);
					var d2=modules.moment.format(self.lastHeader,'lastdate',false,1);
					//var sameday=moment(keydata.$date).isSame(self.lastHeader, 'date');
					if(d1!=d2){
						self.lastHeader=keydata;
						var check=true;
					}
				}else{
					self.lastHeader=keydata;
					var check=true;
				}
				if(check){
					var returndata=$.fn.render({
						template:header.template,
						data:{
							data:obj
						},
						returntemplate:true
					})
				}
			break;
			default:
				var check=false;
				if(typeof keydata!='undefined'){
					if(self.lastHeader){
						if(keydata!=self.lastHeader){
							self.lastHeader=keydata;
							var check=true;
						}
					}else{
						self.lastHeader=keydata;
						var check=true;
					}
					if(check){
						var returndata=$.fn.render({
							template:header.template,
							data:{
								data:obj
							},
							returntemplate:true
						})
					}
				}
			break;
		}
		self.lastHeader=keydata;
		return returndata;
	}
	this.lastHeader='';
	this.smoothReverseScroll=function(){
		if(!isPhoneGap()&&!isMobile){
			return true;
		}else{
			return false;
		}
	}
	this.updateHeight=function(){
		Waypoint.refreshAll();
	}
	this.onEmitData=function(data){
		//allow patching
		if(self.getById(data[self.getDataKey()])){
			if(data.remove) self.remove(data);
			else self.add($.extend(true,{},self.getById(data[self.getDataKey()]),data),1);
		}else{
			self.add($.extend(true,{},self.getById(data[self.getDataKey()]),data));
		}
	}
	this.renderList=function(data,firstLoad,newest,force,prepend){
		if(!firstLoad&&!force&&window.debugscroller){//manual
			self.log('pageready')
			app.onReady=function(){
				self.renderList(data,0,0,1);
			}
			return false;
		}
		if(firstLoad&&(options.sticky||options.mainStickyElements)){
			phi.render(self.getScroller(),{
				template:'infinitescroll_sticky',
				append:true,
				contextElement:'stickyele',
				context:self
			});
		}
		var extra=(data)?data.extra:false;
		self.log('pageready')
		if(data&&data.order){
			$.each(data.order,function(i,v){
				if(prepend){
					self.order.unshift(v);
				}else{
					self.order.push(v);
				}
			})
			if(!newest) self.lastCount=data.order.length;
		}else{
			if(!newest) self.lastCount=0;
		}
		if(!self.options.horizontal){
			self.currentHeight=self.getHeight();
			self.currentOffset=self.scroller.scrollTop();
		}
		if(self.options.horizontal&&self.options.ele.find('.waypoint').length){
			var p=self.options.ele.find('.waypoint').parent()
			var lw=parseFloat(p.attr('data-width'));
			self.options.ele.find('.waypoint').remove();
			p.width(lw);
		}else{
			self.options.ele.find('.waypoint').remove();
		}
		//get current height
		//self.currentTop=self.scroller.scrollTop();
		var prepend=(self.options.reverse||prepend)?1:0;
		if(newest){
			if(self.options.reverse){
				prepend=0;
			}else{
				prepend=1;
			}
			if(self.options.mode=='time_list'){
				//remove any previous instance
				if(data&&data.list) $.each(data.list,function(i,v){
					self.options.ele.find('[data-id='+v.id+']').remove();
					self.log('removing [data-id='+v.id+']');
				});
			}
		}
		//freeze scroller to prevent jank
		var scroller=self.getScroller();
		//scroller.addClass('scroller_rendering');
		// console.trace()
		phi.render(self.options.ele,{
			contextElement:(self.options.contextElement)?self.options.contextElement:'scrollele',
			context:options.context,
			template:(self.options.inline)?'infinitescroll_inline':'module_infinitescroll_page',
			prepend:prepend,
			append:(!prepend)?1:0,
			data:{
				firstLoad:(firstLoad)?1:0,
				snapTo:(self.options.snapTo)?self.options.snapTo:false,
				height:(self.options.height)?self.options.height:false,
				horizontal:self.options.horizontal,
				header:(self.options.header)?self.options.header:false,
				extraData:(self.options.extraData)?self.options.extraData:false,
				checkHeader:self.checkHeader,
				newest:(newest)?1:0,
				render_template:self.getTemplate(),
				data:data,
				addListData:(self.options.addListData)?1:0,
				endOfList:self.options.endOfList,
				noResults:self.options.noResults,
				search:self.csearch,
				endOfListColor:self.options.endOfListColor,
				loaded:(self.loaded&&!firstLoad)?1:0,
				reverse:self.options.reverse,
				showNoData:(self.options.showNoData)?self.options.showNoData(self):1,
				nodata:(self.options.nodata)?self.options.nodata:'No Data',
				opts:(self.options.opts)?self.options.opts:{},
				renderData:self.options.renderData
			},
			binding:function(ele){
				if(self.options.inline){
					ele=self.options.ele;
				}
				if(self.options.horizontal){
					if(phi.stopit) return false;
					var w=0;
					if(!ele.parent().attr('data-width')){
						var pw=0;
					}else{
						var pw=parseFloat(ele.parent().attr('data-width'));
					}
					ele.find('.infinitescroll_elements').children().each(function(i,v){
						w+=$(v).outerWidth();
						pw+=$(v).outerWidth();
					});
					w+=ele.find('.no_data').outerWidth();
					pw+=ele.find('.no_data').outerWidth();
					ele.width(w);
					ele.parent().height(self.options.height);
					ele.parent().css('width',pw);
					ele.parent().attr('data-width',pw);
					ele.attr('data-width',w);
				}
				if(extra&&self.options.onExtraData){
					self.options.onExtraData(ele,extra);
					if(options.mainStickyElements){
						$.each(self.getScroller().find(options.mainStickyElements),function(i,v){
							var content=self.getScroller().find(options.mainStickyElements).clone();
							setTimeout(function(){
								self.stickys.push(new Waypoint({
								  element: v,
								  offset: self.getStickyOffset(),
								  context: self.scroller.getContainer()[0],
								  handler: function(dir) {
								  	if(dir=='down'){//this will trigger a down on initalization
								  		self.stickyCount++;
								  		//self.stickyele.html(content);
								  		//bind
								  		phi.render(self.stickyele,{
								  			content:content[0].outerHTML,
								  			context:self.options.context
								  		})
								  	}else{//use previous one!
								  		self.stickyCount--;
								  		self.stickyele.html('');
								  	}
								  }
								}))
							},500);
						});
					}
				}
				//scroller.removeClass('scroller_rendering');
               	self.scroller.refresh();
	            //setTimeout(function(){
	            	if(self.options.reverse){
		                if(firstLoad){
		                	//self.scroller.scrollToBottom(self.scroller,0);
		                }else{
	                		self.log('set:'+self.getScrollOffset())
	                		self.scroller.scrollTo({
	                			y:self.getScrollOffset()
	                		});
		                }
		            }
		            if(!self.options.disabled&&!newest){//dont do waypoint here
		            	if(ele.find('.waypoint').length){
							var offset=(self.options.offset)?self.options.offset:'400%';
							if(self.options.reverse) offset=(parseInt(offset,10)*-1)+'%';
							// Waypoint.refreshAll();
							if(!self.options.reverse||true){
								//if within view, trigger next load!
								if(self.running){
									self.bindWaypoint(ele,offset);
								}else{
									self.onStart=function(){
										self.bindWaypoint(ele,offset);
										self.onStart=function(){};//clear it!
									}
									self.log('page hidden, bind on load!');
								}
							}
						}
					}
					if(self.options.onPageReady) self.options.onPageReady(ele);//do bindings
				//},5);
					if(self.options.listen&&self.options.context&&data.order&&data.order.length){
						$.each(data.order,function(i,v){
							phi.listen(self.options.context,v,self.onEmitData.bind(this));
						})
					}
			}
		})
		self.loading=0;
	}
	self.init();
	return self;
}