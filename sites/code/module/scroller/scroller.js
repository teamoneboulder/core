modules.scroller=function(ele,options,bindings){
	var self=this;
	this.init=function(){
        if(!options) options={};
		var opts=options;
		if(!opts) opts={};
        if(!bindings) bindings={};
        if(window.forcemobile) opts.preventDefault=false;
        if(opts.hasInput||opts.hasCursor) opts.probeType=3;
        var id=Math.uuid(5);
        if(options.context&&options.context.store){
            self.scrollCustom=bindings.scroll;
            bindings.scroll=function(){
                if(self.scrollCustom) self.scrollCustom();
                options.context.store.scrollY=self.scroller.scrollTop();
            }
        }
        if(opts.type=='iscroll'){
            var scroller = new IScroll(ele[0],opts);
            //console.log(scroller)
            if(bindings) $.each(bindings,function(i,v){
                scroller.on(i,v);
            })
            if(opts.hasInput||opts.hasCursor){
                scroller.on('scroll',function(){
                    ele.toggleClass('force-redraw')
                    // app.throttle('scroller_'+id,20,function(){
                    //     ele.toggleClass('force-redraw')
                    // })
                })
                scroller.on('scrollEnd',function(){
                    ele.toggleClass('force-redraw')
                })
            }
            ele.css('overflow','hidden');
            if(!opts.scrollX){//only vertical
                new ResizeSensor(ele.children().first(), function() {
                    var h=ele.children().first().height();
                    if(scroller.lastH!=h){
                        scroller.lastH=h;
                        scroller.refresh();
                        if(bindings&&bindings.onResize) bindings.onResize()
                        if(opts.followTyping){
                            var pos=opts.followTyping.textareaHelper('caretPos');
                            var cp=opts.followTyping.position();
                            var pt=parseInt(opts.followTyping.css('paddingTop'),10);
                            var ctop=pos.top+cp.top+pt;
                            //determine if below keyboard!
                            //_alert(ele.height()+ ' '+app.keyboardheight)
                            var total=ele.height()-modules.keyboard_global.keyboardHeight-50;
                            //get scroller current pos
                            var cy=Math.abs(scroller.y);
                            cabscursor=ctop-cy;
                            //_alert(cabscursor+ ' '+total)
                            if(cabscursor>total){
                                var diff=cabscursor-total;
                                var ny=scroller.y-diff;
                                self.scrollTo({
                                    y:ny,
                                    x:0,
                                    time:100
                                })
                            }
                        }
                    }
                });
            }
            self.scroller=scroller;
        }else{//regular scroller
            if(opts.scrollX){
                ele.addClass('scrollX')
            }else{
                ele.addClass('scrollY')
            }
            if((opts.swipeContainer||opts.context)&&!opts.noSwipe){
                bindings.onSwipe=function(e){
                    if(e.dx>0){
                        opts.context.setX(e.dx);
                        // TweenLite.set(opts.swipeContainer,{x:e.dx})
                        // var c=opts.swipeContainer.children(':not(.coverpage)').length;
                        // var cover=opts.swipeContainer.find('[data-childpage='+(c-1)+']');
                        // if(cover.length){
                        //     var rate=$.fn.subpage.maxOpacity/$('body').width();
                        //     var copactity=$.fn.subpage.maxOpacity-rate*e.dx;
                        //     TweenLite.set(cover,{opacity:copactity})
                        // }else{
                        //     //_alert('nocover')
                        // }
                    }
                };
                bindings.onSwipeEnd=function(e){
                    if(e.dx>50){
                        //animate
                        //self.goBack();
                        if(opts.context&&opts.context.goBack){
                            opts.context.goBack();
                        }else{
                            if(app.isdev) _alert('No Back!');
                            //TweenLite.to(opts.swipeContainer,.2,{x:0})
                        }
                    }else{
                       opts.context.setX(0);
                    }
                };
            }
            var scrolling=0;
            var last=0;
            var startcoords='';
            var info='';
            var swiping=0;
            var last={};
            if(opts.followTyping){
                if(isPhoneGap()||isMobile) ele.stap(function(e){
                    modules.keyboard_global.hide();
                },1);
            }
            if(!opts.dontBindInputs){
                self.bindInputs(ele.find('textarea:not(.redactorcontent),input'));
            }
            //create ::psuedo events
            if(opts.scrollX){
                ele.data('max',ele.children().first().outerWidth()-ele.outerWidth());
                ele.data('horizontal',true);
            }else{
                ele.data('max',ele.children().first().outerHeight()-ele.outerHeight());
            }
            if(bindings.onSwipe){
                ele.on('touchstart',function(e){
                    //start coords
                    swiping=0;
                    scrolling=0;
                    startcoords=_.touchEvent.getCoords(e);
                })
                ele.on('touchmove',function(e){
                    if(phi.preventSwipe) return false;
                    //check distance until threshold met to determin direction!
                    //should this be throttle?
                    var currentcoords=_.touchEvent.getCoords(e);
                    info=_.touchEvent.getInfo(startcoords,currentcoords);
                    if(info.dist<5&&!swiping&&!scrolling) return false;//hasnt moved far enough to know!
                    if(!scrolling){
                        if(info.dir=='swipe'||swiping){//dont allow scroll to happen
                            if(app.preventSwipe){//can be set from a container
                                return true;
                            }
                            if(!swiping&&bindings.onSwipeStart){
                                bindings.onSwipeStart(info);
                            }
                            swiping=true;
                            bindings.onSwipe(info);
                            return false;
                        }else{//will be handled in regular touchend handler
                            // scrolling=1;
                            // if(bindings&&bindings.scrollStart) bindings.scrollStart(obj);
                            return true;
                        }
                    }
                });
                ele.on('touchend',function(e){
                    if(swiping){
                        if(bindings.onSwipeEnd) bindings.onSwipeEnd(info);
                    }
                })
            }
            if(opts.snapTo){
                ele.on('touchstart',function(){
                    ele.data('last',ele.scrollLeft());
                })
                ele.on('touchend',function(e){
                    if(bindings.onSnapStart) bindings.onSnapStart();
                    var last=ele.data('last');
                    var current=ele.scrollLeft();
                    if(current!=last){
                        var left=self.getNearest(opts,current);
                        ele.removeClass('scrollX').addClass('snappingscroll');
                        app.snapping=true;
                        TweenLite.to(ele,{duration:.2,scrollTo:{x:left},onComplete:function(){
                            app.snapping=false;
                            ele.addClass('scrollX').removeClass('snappingscroll')
                            if(bindings.onSnapEnd) bindings.onSnapEnd({x:left});
                        }})
                    }else{
                        //console.log('no movment')
                    }
                    // ele.animate({scrollLeft: left}, 200,function(){
                    //     ele.addClass('scrollX').removeClass('snappingscroll')
                    // });
                });
            }
            ele.on('inline_search',function(){
                if(modules.tools.isWebLayout()) return false;//dont do this in web!
                var aele=$(document.activeElement);
                //if textarea, add in the current cursor height
                if(aele.is("textarea")){
                    var caret=aele.textareaHelper('caretPos');
                    var ctop=-caret.top;
                    self.scrollToElement(aele,false,ctop);
                }else{
                    self.scrollToElement(aele);
                }
            });
            ele.on('scroll',function(e){    
                if(ele.data('disabled')){
                    phi.stop(e)
                    return false;
                }
                var last=ele.data('last');
                if(!opts.scrollX){
                    // var obj={
                    //     y:-ele.scrollTop(),
                    //     max:ele.data('max')
                    // }
                    // obj.currentY=obj.y;
                    // if(obj.y>0){
                    //     obj.y=0;
                    //     obj.bouncing=true;
                    // }
                    // if(obj.y<obj.max){
                    //     obj.y=obj.max;
                    //     obj.bouncing=true;
                    // }
                    // if(last){
                    //     if(obj.y<last){
                    //         obj.directionY=1
                    //     }else{
                    //         obj.directionY=-1
                    //     }
                    // }
                    var obj={
                        y:-ele.scrollTop(),
                        max:-ele.data('max')
                    }
                    obj.currentY=obj.y;
                    if(obj.y>0){
                        obj.y=0;
                        obj.bouncing=true;
                    }
                    if(obj.y<obj.max){
                        obj.y=obj.max;
                        obj.bouncing=true;
                    }
                    if(last){
                        if(obj.y<last){
                            obj.directionY=1
                        }else{
                            obj.directionY=-1
                        }
                    }
                }else{
                    var obj={
                        x:-ele.scrollLeft(),
                        max:-ele.data('max')
                    }
                    obj.currentX=obj.x;
                    if(obj.x>0){
                        obj.x=0;
                        obj.bouncing=true;
                    }
                    if(obj.x<obj.max){
                        obj.x=obj.max;
                        obj.bouncing=true;
                    }
                    if(last||last===0){
                        if(obj.currentX<last){
                            obj.directionX=1
                        }else{
                            obj.directionX=-1
                        }
                    }
                }
                //console.log(obj)
                if(isMobile){//only really matters for ios
                    modules.tools.throttle('scroller_'+id,70,function(){
                        //console.log('scrollend')
                        // ele.toggleClass('force-redraw')
                        // $('body').removeClass('scrolling');
                        if(bindings.scrollEnd) bindings.scrollEnd(obj);
                        ele.data('last',0);
                        if(opts.hasInput||opts.hasCursor){
                            ele.toggleClass('force-redraw');
                            ele.removeClass('disableCaret');
                            // if(!obj.bouncing){
                            //     ele.removeClass('disableCaret');
                            //     ele.data('caretDisabled',0);
                            // }
                        }
                        //ele.toggleClass('force-redraw')
                        //if(!bindings.onSwipe) scrolling=0;
                        scrolling=0;
                    });
                }
                if(bindings.scroll&&(last||obj.bouncing)) bindings.scroll(obj);
                if(opts.hideKeyboardOnScroll){
                    if(isPhoneGap()){
                        var ct=new Date().getTime();
                        var y=obj.y;
                        if(Keyboard.isVisible){
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
                        last={
                            y:y,
                            ts:ct
                        }
                    }
                }
                if(obj.bouncing&&bindings.bounce) bindings.bounce(obj);
                if(!scrolling){
                    //$('body').addClass('scrolling');
                    if(opts.hasInput||opts.hasCursor) ele.addClass('disableCaret');
                    if(bindings&&bindings.scrollStart) bindings.scrollStart(obj);
                    scrolling=1;
                    //trigger scroll start to get general direction
                }
                if(opts.scrollX) var last=obj.x;
                else var last=obj.y;
                if(opts.hasInput||opts.hasCursor){
                    ele.toggleClass('force-redraw')
                    // if(!obj.bouncing){
                    //     ele.toggleClass('force-redraw')
                    //     if(ele.data('caretDisabled')){
                    //         ele.removeClass('disableCaret');
                    //         ele.data('caretDisabled',0);
                    //     }
                    // }else{
                    //     ele.data('caretDisabled',1);
                    //     ele.addClass('disableCaret');
                    // }
                }
                ele.data('last',last);
                ele.data('current',obj);
            });
            self.scroller=ele;
            if(options.context&&options.context.store&&options.context.store.scrollY&&!options.resetScroll){
                self.scroller.scrollTop(options.context.store.scrollY)
            }
        }
	}
	this.getContainer=function(){
		return self.scroller;
	}
    this.getScroller=function(){
        return self.scroller;
    }
	this.getScrollContainer=function(){
		return self.scroller.children().first();
	}
	this.getOffset=function(){
		return self.scroller.offset();
	}
	this.getHeight=function(){
		return self.scroller.children().first().outerHeight();
	}
	this.getContainerHeight=function(){
		return self.scroller.outerHeight();
	}
	this.getNearest=function(opts,nearto){
		var offsets=[];
        var closest=1000;
        var ld=self.scroller.data('current');//used for direction
        if(ld){
            var dir=ld.directionX;
        }else{
            var dir=1;//assume..why not
        }
        //console.log(self.scroller.find(opts.snapTo));
        var width=self.scroller.find(opts.snapTo).first().width();
        var shiftNext=width*.40;//lean toward next item
        var shiftLast=width*.60;//lean toward prev item
        $.each(self.scroller.find(opts.snapTo),function(i,v){
            var left=$(v).offset().left;
            offsets.push([left-shiftLast,left+shiftNext,left+nearto]);
        })
        var left=0;
        for (var i = 0; i < offsets.length; i++) {
            if(offsets[i][0]<=0&&offsets[i][1]>0) left=offsets[i][2];
        }
        if(left==0) left=nearto;//dont do any snap!
        return left;
	}
	this.setPosition=function(tele,editableContainer){
		var debug=false;
        var cp=self.scroller.offset();//should use current cursor position
        //var bthresh=$('body').height()-modules.keyboard_global.keyboardHeight;
        var domele=tele[0];
        if(domele.tagName == "INPUT"){
            var ctop=0;
        }else if(domele.tagName == "TEXTAREA"){
            var caret=tele.textareaHelper('caretPos');
            var ctop=caret.top;
            //console.log(ctop);
        }else if(domele.contentEditable){
        	var x = 0;
		    var y = 0;
		    var sel = window.getSelection();
		    if(sel.rangeCount) {
		        var range = sel.getRangeAt(0).cloneRange();
		        if(range.getClientRects()) {
		        range.collapse(true);
		        var rect = range.getClientRects()[0];
		        if(rect) {
		            y = rect.top;
		            x = rect.left;
		        }
		        }
		    }
		   	var caret_offset={
		        left: x,
		        top: y
		    };
		    if(!caret_offset.top||!editableContainer){
		    	if(!editableContainer) console.warn('Missing Editable Div container');
		    	if(!caret_offset.top) console.warn('waiting for cursor position');
		    	return true;
		    }
		    var coff=editableContainer.offset();
		    var caret={
		    	left:caret_offset.left-coff.left,
		    	top:caret_offset.top-coff.top
		    }
		    var ctop=caret.top;
		    //console.log(caret)
        	//return false;
        }
        var post=tele.offset();
        var stop=self.scroller.children().first().offset();
        var tdiff=post.top-stop.top;
       // console.log('top'+cp.top)
        var visheight=($('body').height()-((modules.keyboard_global)?modules.keyboard_global.keyboardHeight:0)-60)-cp.top;
        var hasDone=(tele.attr('data-showdone'))?1:0;
        if(hasDone) visheight-=30;
        var toffset=tele.attr('data-offset');
        if(toffset){
            var of=parseInt(toffset,10);
            visheight-=of;
        }
        var relcursorposition=tdiff+ctop;
        if(debug) console.log('caret top: '+ctop)
        //console.log('textarea h: '+tele.height())
        var st=self.scroller.scrollTop();
        if(debug) console.log('scroll top: '+st)
        var range=[st,st+visheight];
        if(debug) console.log('initial relative: '+relcursorposition);
        if(debug) console.log(range)
        if(relcursorposition<range[0]){
            if(debug) console.log('scrolldown');
            var diff=relcursorposition-range[0]-15;
            self.scrollBy(-diff,50);
            if(debug) console.log(diff)
        }else if(relcursorposition>range[1]){
            if(debug) console.log('scrollup');
             var diff=(relcursorposition-range[1])+15;
             self.scrollBy(-diff,50);
             if(debug) console.log(diff)
        }else{
        }
        self.lastTop=st;
	}
	this.bindInputs=function(iele){
		iele.on('focus',function(){
            var tele=$(this);
            if(modules.keyboard_global) modules.keyboard_global.oneTimeKeyboardWillShow=function(height){
                self.setPosition(tele);
                var hasDone=(tele.attr('data-showdone'))?1:0;
                if(hasDone){
                    var inpage=(tele.attr('data-inpage'))?1:0;
                    if(inpage&&app.isIphoneX()) height+=20;
                    $('body').render({
                        template:'keyboard_done',
                        data:{
                            bottom:height
                        },
                        binding:function(ele){
                            ele.stap(function(){
                                modules.keyboard_global.hide();
                            },1,'tapactive')
                            modules.keyboard_global.oneTimeKeyboardWillHide=function(height){
                                ele.remove();
                            }
                        }
                    })
                }
            }
        }).on('input',function(e){
            self.setPosition($(this));
            //phi.stop(e)
        }).on('keyup',function(e){
            self.setPosition($(this));
            //phi.stop(e)
        });
        if(app.isdev&&!isPhoneGap()){
            iele.on('focus',function(){
                if(modules.keyboard_global) modules.keyboard_global.showWebKeyboard();
            }).on('blur',function(){
                if(modules.keyboard_global) modules.keyboard_global.hideWebKeyboard();
            })
        }
	}
	this.scrollTop=function(set){
		if(set||set===0){
			self.scroller.scrollTop(set);
		}else{
			return self.scroller.scrollTop();
		}
	}
	this.ensure=function(){
		var last=ele.data('last');
        self.scroller.scrollTop(-last);
	}
	this.refresh=function(){
        if(options.type=='iscroll'){
            self.scroller.refresh();
        }else{
    		if(!self.scroller) return false;
            if(self.scroller.length){
                if(self.scroller.data('horizontal')){
                    self.scroller.data('max',self.scroller.children().first().outerWidth()-self.scroller.outerWidth());
                }else{
                    self.scroller.data('max',self.scroller.children().first().outerHeight()-self.scroller.outerHeight());
                }
                //self.scroller.data('max',self.scroller.children().first().outerHeight()-self.scroller.outerHeight());
            }else{
                // if(self.scroller.options&&self.scroller.options.snapTo){
                //     self.scroller.options.snap=self.scroller.self.scroller.querySelectorAll(self.scroller.options.snapTo);
                // }
                self.scroller.refresh();
            }
        }
	}
	this.disable=function(){
		if(self.scroller.length&&!self.scroller.data('disabled')){
            self.scroller.data('disabled',1);
        }
	}
	this.enable=function(){
		if(self.scroller.length&&self.scroller.data('disabled')){
            self.scroller.data('disabled',0);
        }
	}
	this.destroy=function(){
		if(self.scroller&&self.scroller.destroy){
            self.scroller.destroy();
        }
	}
	this.scrollToBottom=function(delay){
		if(self.scroller){
            if(!self.scroller.length){
                self.scroller.refresh();
                self.scroller.scrollTo(0, self.scroller.maxScrollY, 100);
            }else{
                self.scroller.animate({ scrollTop: self.scroller[0].scrollHeight+"px" },delay);
            }
        }
	}
	this.scrollToElement=function(element,delay,yoffset){
		if(!self.scroller.length){
            
        }else{
            if(element.length){
                var offset=element.offset();
                var po=self.scroller.children().first().offset();
                var y=offset.top;
                y-=po.top;
                if(yoffset) y-=yoffset;
                if(!delay) delay=0;
                self.scrollTo({y:y,time:delay});
            }
        }
	}
	this.scrollToTop=function(delay){
		if(!delay) delay=0;
        if(!self.scroller.length){
            self.scroller.scrollTo(0, 0, delay);
        }else{
            self.scroller.animate({ scrollTop: "0px" },delay);
        }
	}
	this.scrollBy=function(dy,time,debug){
		if(!time) time=0;
        if(!self.scroller.length){
            self.scroller.scrollBy(0,dy,time)
        }else{
            var curY=self.scroller[0].scrollTop;
            var newY=curY+(dy*-1);//reverse for native scroller
            if(debug){
                console.log(curY,newY)
            }
            self.scroller.animate({ scrollTop: newY+"px" },time);
        }
	}
	this.scrollTo=function(opts){
		 if(!self.scroller.length){
            if(opts.ele){
                var position=opts.ele.position();
                if(-position.top>self.scroller.maxScrollY){//else will cause bounce
                    self.scroller.scrollTo(0,-position.top,opts.time);
                }else{
                    self.scroller.scrollTo(0,self.scroller.maxScrollY,opts.time);
                }
            }else{
                self.scroller.scrollTo(opts.x,opts.y,opts.time);
            }
        }else{
            if(opts.ele){
                if(opts.ele.length){
                    self.scroller.animate({ scrollTop: opts.ele.getRelativeOffset(self.scroller)+"px" },opts.time);
                }
            }else{
                if(opts.time){
                     self.scroller.animate({ scrollTop: opts.y+"px" },opts.time);
                }else{
                    self.scroller.scrollTop(opts.y);
                }
            }
        }
	}
	self.init();
	return self;
}