if(!window.modules) window.modules={};
modules.votestats=function(options){
	var self=this;
	self.options=options;
	this.show=function(){
		var rele=(options.ele)?options.ele:$('body');
		//build nav!
		var nav=[];
		if(!options.post.stats.reactions){
			return console.warn('Invalid options.post.stats.reactions')
		}
		$.each(options.post.stats.reactions,function(i,v){
			var tnav={
                id:i,
                name:modules.feed_global.reactions.list[i].name,
                svg:modules.feed_global.reactions.list[i].svg
            };
            if(nav.length==0){
            	self.selected=tnav.id;
            	tnav.selected=true;
            }
			nav.push(tnav)
		})
		rele.render({
			template:'modules_votestats',
			data:{},
			binding:function(ele){
				self.ele=ele;
                self.loadFeed();
                ele.on('touchmove',function(e){
                	phi.stop(e);
                })
				ele.on('scroll',function(e){
					phi.stop(e);
				})
				ele.find('.results').on('touchstart',function(){
					self.draggable[0].disable();
				}).on('touchend',function(){
					self.draggable[0].enable();
				})
				self.draggable=Draggable.create(ele.find('.pane'), {
			        type:"y",
			        bounds:{minX:0,maxX:0,minY:0,maxY:300},
			        lockAxis:true,
			        throwProps:true,
			        force3D:true,
			        cursor:'defualt',
			        edgeResistance:1,
			        onDrag:function(e){
			        	phi.stop(e)
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
			    ele.find('.pane').stap(function(){
			    	self.hide();
			    },1,'tapactive')
				setTimeout(function(){
					TweenLite.to(ele,.3,{background:'rgba(55,55,55,.3)'})
					TweenLite.to(ele.find('.pane'),.3,{y:'-100%',onComplete:function(){
						console.log('canrender')
					}})
				},10)
			}
		})
	}
	this.loadFeed=function(){
		self.ele.find('.results').render({
			append:false,
			template:'modules_emojistats_loading'
		});
		app.api({
            url:app.sapiurl+'/module/feed/votestats',
            data:{
               id:self.options.post.id
            },
            timeout:5000,
            callback:function(resp){
            	self.cdata=self.parseData(resp.data);
                self.renderFeed();
            }
        });
	}
	this.parseData=function(data){
		if(data){
			var sortable = [];
			for (var key in data) {
			    sortable.push([key, data[key]]);
			}
			sortable.sort(function(a, b) {
			    return a[1] - b[1];
			});
			var out={
				list:{},
				order:[]
			}
			$.each(sortable,function(i,v){
				out.order.push(v[0]);
				out.list[v[0]]={
					tag:v[0],
					count:v[1]
				}
			})
			return out;
		}else{
			return false;
		}
	}
	this.renderFeed=function(){
		console.log(self.cdata)
		self.ele.find('.results').render({
			append:false,
			template:'modules_votestats_feed',
			data:self.cdata,
			binding:function(ele){
				//set scroll!
				app.scroller.set(ele,{forceNative:true});
				ele.find('.x_selecttag').stap(function(e){
					phi.stop(e);
					//show context menu
				},1)
			}
		})
	}
	this.hide=function(){
		setTimeout(function(){
			TweenLite.to(self.ele,.5,{background:'rgba(55,55,55,0)'})
			TweenLite.to(self.ele.find('.pane'),.5,{y:'100%',onComplete:function(){
				if(self.options.onProfileSelect&&self.viewProfile) self.options.onProfileSelect(self.cdata.list[self.viewProfile]);
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