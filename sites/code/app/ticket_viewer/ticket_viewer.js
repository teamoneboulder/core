modules.ticket_viewer=function(options){
	var self=this;
	self.options=options;
	this.show=function(){
		self.qrqueue = async.queue(function (item, fin) {
			self.loadQr(item,fin);
		},1);
		self.qrqueue.drain = function() {
			self.renderQrPages();
		}
		async.parallel([self.showLoading,self.loadTickets],function(){
			self.onViewReady();
		});
	}
	this.loadQr=function(item,fin){
		var tdata='action~'+btoa(JSON.stringify({
			action:'event_ticket_checkin',
			event:self.resp.data.event.id,
			ticket:item.ticket.id
		}));
		modules.qrcode.getBase64(tdata,function(data){
			self.resp.data.tickets.list[item.ticket.id].src=data;
			//if(item.ele) item.ele.find('.coverimg').css('background','').css('backgroundImage','url('+data+')');
			setTimeout(function(){//give it a sec
				fin();
			},2)
		});
	}
	this.renderQrPages=function(){
		self.currentIndex=0;
		self.ele.find('.qrpane').render({
			template:'ticket_viewer_qr',
			append:false,
			data:{
				tickets:self.resp.data.tickets
			},
			binding:function(ele){
				ele.find('.x_left').stap(function(){
					 self.currentIndex--;
                     self.ensurePage();
				},1,'tapactive')
				ele.find('.x_right').stap(function(){
					 self.currentIndex++;
                     self.ensurePage();
				},1,'tapactive')
				self.bindSwiper();
				self.ensurePage();
				ele.find('.x_options').stap(function(){
					app.comingSoon();
				},1,'tapactive')
			}
		})
	}
	this.getLeft=function(index){
        var left=index*100;
        return left;
    }
	this.getBounds=function(){
        var bounds={};
        if(self.currentIndex>0) bounds.maxX=300;
        else bounds.maxX=0;
        if(self.currentIndex<self.resp.data.tickets.order.length-1) bounds.minX=-300;
        else bounds.minX=0;
        bounds.minY=0;//never swipe up...
        bounds.maxY=0;//always swipe to close
        return bounds;
    }
	this.ensurePage=function(passive){
		self.ele.find('.currentpage').html(self.currentIndex+1);
		self.ele.find('.total').html(self.resp.data.tickets.order.length);
		if(self.resp.data.tickets.order.length<=(self.currentIndex+1)){
			self.ele.find('.x_right').hide()
		}else{
			self.ele.find('.x_right').show()
		}
		if(self.currentIndex==0){
			self.ele.find('.x_left').hide()
		}else{
			self.ele.find('.x_left').show()
		}
		if(!passive) TweenLite.to(self.ele.find('.page'),.3,{left:(-self.currentIndex*100)+'%'})
	}
	this.bindSwiper=function(){
		self.swiper=Draggable.create(self.ele.find('.page'), {
            type:"x",
            bounds:self.getBounds(),
            lockAxis:true,
            throwProps:true,
            force3D:true,
            cursor:'defualt',
            edgeResistance:1,
            onDragStart:function(e){
            },
            onDragEnd:function(e) {
                //let momentum take for a second
                if(this.x!=0){
                    if(this.x<80&&this.x>-80){
                        self.swiper[0].disable();
                        TweenLite.to(self.ele.find('.page'),.3,{x:0,onComplete:function(){
                            self.swiper[0].enable();
                        }});
                        //return
                    }else if(this.x>=80){//right
                        self.swiper[0].disable();
                        self.currentIndex--;
                        TweenLite.to(self.ele.find('.page'),.3,{x:-self.getLeft(self.currentIndex)+'%',onComplete:function(){
                            self.swiper[0].enable();
                            self.ensurePage(1);
                            self.swiper[0].applyBounds(self.getBounds());
                        }});
                    }else if(this.x<=-80){//left
                        self.swiper[0].disable();
                        self.currentIndex++
                        TweenLite.to(self.ele.find('.page'),.3,{x:-self.getLeft(self.currentIndex)+'%',onComplete:function(){
                            self.swiper[0].enable();
                            self.ensurePage(1);
                            self.swiper[0].applyBounds(self.getBounds())
                        }});
                    }
                }
            }
        });
	}
	this.showLoading=function(cb){
		var rele=(options.renderTo)?options.renderTo:$('body');
		rele.render({
			template:(options.template)?options.template:'ticket_viewer_page',
			data:options,
			binding:function(ele){
				self.ele=ele;
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
			    TweenLite.set(ele.find('.pane'),{y:'100%'})
			    //render
				setTimeout(function(){
					TweenLite.to(ele,.3,{background:'rgba(55,55,55,.3)'})
					TweenLite.to(ele.find('.pane'),.3,{y:'0%',onComplete:function(){
						cb()
					}})
				},50)
			}
		})
	}
	this.tryOfflineCache=function(){

	}
	this.loadTickets=function(cb){
		if(self.loading) return false;
		if(self.ele) _ui.pageloader.render({theme:false,themeClass:'lds-ellipsis-black'},self.ele.find('.pagepane'),1);
		self.loading=true;
		//_alert(app.sapiurl+'/module/ticket_viewer/load'+' '+JSON.stringify(options))
		modules.api({
			url:app.sapiurl+'/module/ticket_viewer/load',
			data:{
				event:options.event
			},
    		callback:function(resp){
    			self.resp=resp;
    			cb();
    		}
    	});
	}
	this.onViewReady=function(){
		if(self.resp.error){
			modules.loadError({
                ele:self.ele.find('.pagepane'),
                error:self.resp.error,
                onRetry:function(){
                    self.loadTickets(function(){
                    	self.onViewReady();
                    });
                }
            })
            return false;
		}
		self.ele.find('.pagepane').render({
			template:'ticket_viewer_pageview',
			data:{
				resp:self.resp
			},
			append:false,
			binding:function(ele){
				// self.infinitescroller=new modules.infinitescroll({
    //                 ele:self.ele.find('.ticketlist'),
    //                 scroller:self.ele.find('.scroller'),
    //                 loaderClass:'lds-ellipsis-black',
    //                 loadData:{
    //                 	success:true,
    //                 	data:self.resp.data.tickets
    //                 },
    //                 offset:'200%',
    //                 opts:{
    //                 },
    //                 max:10,
    //                 template:'ticket_viewer_ticket',
    //                 endOfList:' ',
    //                 nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>You dont have any tickets.</div></div>',
    //                 onPageReady:function(ele){
    //                 	setTimeout(function(){//or inf will be undefined
    //                 		self.loadQrCodes(ele);
    //                 	},10)
    //                 },
    //                 scrollBindings:{
    //                     scrollStart:function(){
    //                     },
    //                     scroll:function(obj){
    //                     }
    //                 }
    //             });
    			self.loadQrCodes();
			}
		})
	}
	this.loadQrCodes=function(){
		//show loading
		_ui.pageloader.render({theme:false,themeClass:'lds-ellipsis-black'},self.ele.find('.qrpane'),1);
		$.each(self.resp.data.tickets.list,function(i,v){
			self.qrqueue.push({
				ticket:v
			})
		});
	}
	this.hide=function(){
		modules.keyboard_global.hide();
		setTimeout(function(){
			TweenLite.to(self.ele,.5,{background:'rgba(55,55,55,0)'})
			TweenLite.to(self.ele.find('.pane'),.5,{y:'100%',onComplete:function(){
				setTimeout(function(){
					self.destroy();
				},50);
			}})
		},50)
	}
	this.destroy=function(){
		modules.keyboard_global.overrides=false;
		if(self.dragger) self.dragger[0].kill();
		self.ele.remove();
		delete self;
	}
}