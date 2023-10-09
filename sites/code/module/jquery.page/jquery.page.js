;$.fn.page=function(obj){
    $.fn.page.currentalertopts=obj;
    if(!$.fn.page.alertzindex) $.fn.page.alertzindex=500;
    if(!$.fn.page.storedmodal) $.fn.page.storedmodal=[];
    $.fn.page.alertzindex++;
    var def={
        id:'mobilepage',//Math.uuid(),
        uid:'mobilepage',
        animatedmodal:true,
        pageType:'slideshow',
        animation:'slideup',
        pages:1,
        minimizable:false,//true,
        closerColor:'#555',
        zIndex:$.fn.page.alertzindex,
        animate:true,
        wait:10,//ms before animate showing
        closer:true,
        asyncShow:false,
        autowidth:false,
        autoheight:false,
        textsize:11,
        iconsize:70,
        spacing:45,
        maxwidth:900,
        minSplashDelay:2000,
        maxHeight:false,
        escClose:true,
        animateShow:true,
        onPageSelect:function(page){},
        triggerModal:function(){
            if($.fn.page.storedmodal.length){
                var c=$.extend(true,{},$.fn.page.storedmodal[0]);
                $.fn.page.storedmodal.splice(0,1);
                if(c) c.ele.page(c.obj);
            }
        },
        onExit:function(obj){
            obj.onClose();
            $.fn.page.pagecount--;
        },
        onClose:function(){

        },
        beforeClose:false,
        close:function(cb){
            var ele=$.fn.page.getPage();//get topmost page
            if(!ele.length){
                console.warn();
                return false;
            }
            ele.addClass('closing')
            var obj=ele.data('data');
            //get page's current top value and animate to 100
            if(obj.beforeClose){
                obj.beforeClose(ele,function(){
                    obj.closeIt(ele,cb);
                })
            }else{
                obj.closeIt(ele,cb);
            }
        },
        destroy:function(){
            var ele=$.fn.page.getPage();//get topmost page
            var obj=ele.data('data');
            //get page's current top value and animate to 100
            if(obj.beforeClose){
                obj.beforeClose(ele,function(){
                    ele.remove();
                })
            }else{
                ele.remove();//just straight up remove...
            }
            obj.onExit(obj);
        },
        hideSplash:function(){
            var ele=$.fn.page.getSplashPage();//get topmost page
            var ct=new Date().getTime();
            var diff=ct-ele.data('data').shown;
            var time=ele.data('data').minSplashDelay;
            if(diff<time){
                setTimeout(function(){
                    TweenLite.to(ele.find('.splashimg'), .5, {opacity:0,onComplete:function(){
                        ele.find('.splashimg').hide();
                    }})
                },time-diff);
            }else{
                TweenLite.to(ele.find('.splashimg'), .5, {opacity:0,onComplete:function(){
                    ele.find('.splashimg').hide(); 
                }})
            }
        },
        showSplash:function(){
            var ele=$.fn.page.getSplashPage();//get topmost page
            ele.find('.splashimg').show(); 
            TweenLite.set(ele.find('.splashimg'), {opacity:1});
        },
        closeApp:function(showsplash,cb){
            var ele=$.fn.page.getSplashPage();//get topmost page
            var obj=ele.data('data');
            ele.find('.splashimg').show(); 
            if(showsplash) TweenLite.set(ele.find('.splashimg'), {opacity:1});
            setTimeout(function(){
                if($('body').width()<900){
                    var center={x:$('body').width()/2,y:$('body').height()/2};
                    var offset={x:(obj.splash.start.x-center.x),y:(obj.splash.start.y-center.y)+80};
                }else{
                    var offset={x:0,y:0};
                }
                TweenLite.to(ele, .3, {scale:0,x:offset.x,y:offset.y,onComplete:function(){
                    ele.remove();
                    obj.onExit(obj);
                    if(cb) cb();//any housekeeping
                }})
            },(showsplash)?200:1);
        },
        closeIt:function(ele,cb){
            var obj=ele.data('data');
            if(!obj) return false;
            if(obj.animation=='fade'){
                ele.find('.mobilepagemain').fadeOut(500,function(){
                    obj.onExit(obj);
                    if(cb) cb()
                })
            }else if(obj.animation=='splash'){
                obj.closeApp(false,cb);
            }else if(obj.animation=='slideup'){
                var ct=ele.css('top');
                TweenLite.to(ele.find('.mobilepagemain'), .3, {y:"100%",onComplete:function(){
                    ele.remove();
                    $.fn.page.destroySwipe();
                    obj.onExit(obj);
                    if(cb) cb()
                }})
            }else if(obj.pageType=='static'){
                obj.onExit(obj);
                if(cb) cb()
            }else{
                obj.onExit(obj);
                if(cb) cb()
            }
            TweenLite.set(ele.find('.mobilepagesplash'),{opacity:.4});//iphonex fix
            TweenLite.to(ele.find('.mobilepagesplash'),.3,{opacity:0});
        },
        show:function(ele,data,obj){
            if(obj.animation=='slideup'||!obj.animation){
                TweenLite.set(ele.find('.mobilepagemain'), {y:"100%"})
                setTimeout(function(){
                    TweenLite.to(ele.find('.mobilepagemain'), .3, {y:"0%",z:1,onComplete:function(){
                        //return false;
                        obj.onShow(ele,data);
                    }})
                },obj.wait)
            }else if(obj.animation=='fade'){
                setTimeout(function(){
                    ele.find('.mobilepagemain').fadeIn(300,function(){
                        obj.onShow(ele,data);
                    })
                    // TweenLite.to(ele, .3, {top:"0px",onComplete:function(){
                    //     obj.onShow(ele,data);
                    // }})
                },obj.wait)
            }else if(obj.animation=='splash'){
                //wait for splash image to preload! before animating!
                if($('body').width()<900){
                    var center={x:$('body').width()/2,y:$('body').height()/2};
                    //minus app header
                    center.y=-obj.headerheight;
                    var offset={x:(data.splash.start.x-center.x),y:(data.splash.start.y-center.y)+80};
                }else{
                    var center={x:$('body').width()*(3/4),y:$('body').height()/2};
                    var offset={x:0,y:0};
                }
                TweenLite.set(ele.find('.mobilepagemain'), {scale:0,x:offset.x,y:offset.y});
                var url=data.splash.url;
                if(data.splash.urls){
                    var i=Math.floor(Math.random()*data.splash.urls.length);
                    url=data.splash.urls[i];
                }
                ele.find('.splashimg').preload(url,true,function(){
                    ele.show();
                    setTimeout(function(){
                        TweenLite.to(ele.find('.mobilepagemain'), .3, {scale:1,x:0,y:0,z:1,onComplete:function(){
                            ele.data('data').shown=new Date().getTime();
                            obj.onShow(ele,data);
                        }})
                    },obj.wait)
                });
            }
             TweenLite.to(ele.find('.mobilepagesplash'),.3,{opacity:.4,onComplete:function(){
                setTimeout(function(){
                    if(isPhoneGap()) TweenLite.set(ele.find('.mobilepagesplash'),{opacity:0});//iphonex fix
                },100)
             }});
        },
        onShow:function(ele,data){}
    }
    var obj=$.extend(true,{},def,obj);
    //if(!obj.uid) obj.uid
    if(!obj.content&&obj.template){
        if(!obj.data) obj.data={};
        obj.content=$.fn.render.getTemplate(obj.template).render($.extend(true,{},{template:obj.template,uid:obj.uid,_tid:obj.uid},obj.data));
    }
    if(obj.template) delete obj.template;
    if(!obj.content) obj.content='';
    obj.headerheight=$('#appheader').outerHeight()+4;//cache?!
    var opts={
        uid:obj.uid,
        template:'mobilepage',
        data:obj,
        inAlert:1,
        bindings:[
            {
                type:'fn',
                binding:function(ele,data){ //center content
                    if(obj.animation=='slideup'||!obj.animation){
                        TweenLite.set(ele.find('.mobilepagemain'), {y:"100%"})
                    }
                    ele.data('data',data);
                    ele.find('.x_closer').stap(function(){
                        obj.closeIt(ele);
                    },'tapactive',1)
                    switch(data.pageType){
                        case 'profile':
                            //$.fn.page.bindProfileSwipe(ele,data);
                        break;
                        case 'static':
                        break;
                        case 'slideshow':
                            $.fn.page.bindPageSwipe(ele,data);
                        break;
                        case 'leftright':
                            $.fn.page.bindLRSwipe(ele,data);
                        break;
                        default:
                            $.fn.page.bindLRSwipe(ele,data);
                        break;
                    }
                    if(obj.onPageRendered){
                        if(!obj.asyncShow){
                            obj.onPageRendered(ele);
                            obj.show(ele,data,obj);
                        }else{
                            obj.onPageRendered(ele,function(){
                                obj.show(ele,data,obj);
                            });
                        }
                    }else{
                        obj.show(ele,data,obj);
                    }
                }
            }
        ]
    };
    if(obj.bindings) $.each(obj.bindings,function(i,v){
        opts.bindings.push(v);
    });
    $(this).render(opts);
    $.fn.page.close=obj.close;
    $.fn.page.destroy=obj.destroy;
    $.fn.page.pagecount++;
};
$.fn.page.destroySwipe=function(){
    if($.fn.page.dragbody&&$.fn.page.dragbody[0]){
        $.fn.page.dragbody[0].kill();
        $.fn.page.dragbody=false;
    }
}
$.fn.page.bindPageSwipe=function(ele,opts){
    $.fn.page.onpage=1;
    $.fn.page.destroySwipe();
    function getBounds(){
        var bounds={};
        if($.fn.page.onpage>1) bounds.maxX=300;
        else bounds.maxX=0;
        if($.fn.page.onpage<opts.pages) bounds.minX=-300;
        else bounds.minX=0;
        bounds.minY=0;//never swipe up...
        bounds.maxY=300;//always swipe to close
        return bounds;
    }
    $.fn.page.dragbody=Draggable.create(ele, {
        type:"x,y",
        bounds:getBounds(),
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
                    $.fn.page.dragbody[0].disable();
                    TweenLite.to(ele,.3,{x:0,z:1,onComplete:function(){
                        $.fn.page.dragbody[0].enable();
                    }});
                    //return
                }else if(this.x>=80){//right
                    $.fn.page.dragbody[0].disable();
                    $.fn.page.onpage--;
                    var toPercentage=-($.fn.page.onpage-1)*100;
                    TweenLite.to(ele,.3,{x:toPercentage+'%',z:1,onComplete:function(){
                        $.fn.page.dragbody[0].enable();
                        $.fn.page.dragbody[0].applyBounds(getBounds());
                        opts.onPageSelect($.fn.page.onpage)
                    }});
                }else if(this.x<=-80){//left
                    $.fn.page.dragbody[0].disable();
                    $.fn.page.onpage++;
                    var toPercentage=-($.fn.page.onpage-1)*100;
                    TweenLite.to(ele,.3,{x:toPercentage+'%',z:1,onComplete:function(){
                        $.fn.page.dragbody[0].enable();
                        $.fn.page.dragbody[0].applyBounds(getBounds())
                        opts.onPageSelect($.fn.page.onpage)
                    }});
                }
            }else{
                if(opts.close){
                    if(this.y<60&&this.y>-60){
                        $.fn.page.dragbody[0].disable();
                        TweenLite.to(ele,.3,{y:0,z:1,onComplete:function(){
                            $.fn.page.dragbody[0].enable();
                        }});
                    }else if(this.y>=60){//down, could be overwritten...
                        opts.close();
                    }
                }
            }
        }
    });
};
$.fn.page.bindLRSwipe=function(ele,opts){
    //create bounds
    var bounds={};
    if(opts.pages.left) bounds.minX=-300;
    else bounds.minX=0;
    if(opts.pages.right) bounds.maxX=300;
    else bounds.maxX=0;
    if(opts.pages.up) bounds.minY=-300;
    else bounds.minY=0;
    bounds.maxY=300;//always swipe to close
    $.fn.page.pageView='main';
    $.fn.page.destroySwipe();
    $.fn.page.dragbody=Draggable.create(ele, {
        type:"x,y",
        bounds:bounds,
        lockAxis:true,
        throwProps:true,
        force3D:true,
        cursor:'defualt',
        edgeResistance:1,
        // onDrag:function(){
        //     console.log(this)
        //     console.log(this.endY)
        //     //animate scale

        // },
        onDragStart:function(e){
        },
        onDragEnd:function(e) {
            //let momentum take for a second
            if(this.x!=0){
                if(this.x<80&&this.x>-80){
                    $.fn.page.dragbody[0].disable();
                    TweenLite.to(ele,.3,{x:0,onComplete:function(){
                        $.fn.page.dragbody[0].enable();
                    }});
                    //return
                }else if(this.x>=80){//left
                    if($.fn.page.pageView=='main'){
                        $.fn.page.dragbody[0].disable();
                        TweenLite.to(ele,.3,{x:'100%',onComplete:function(){
                            $.fn.page.dragbody[0].enable();
                            $.fn.page.dragbody[0].applyBounds({minX:-300,maxX:0,minY:0,maxY:0})
                            $.fn.page.pageView='left';
                        }});
                    }
                    if($.fn.page.pageView=='right'){
                        $.fn.page.dragbody[0].disable();
                        TweenLite.to(ele,.3,{x:'0%',onComplete:function(){
                            $.fn.page.dragbody[0].enable();
                            $.fn.page.dragbody[0].applyBounds(bounds)
                            $.fn.page.pageView='main';
                        }});
                    }
                }else if(this.x<=-80){//left
                    if($.fn.page.pageView=='main'){
                        $.fn.page.dragbody[0].disable();
                        TweenLite.to(ele,.3,{x:'-100%',onComplete:function(){
                            $.fn.page.dragbody[0].enable();
                            $.fn.page.dragbody[0].applyBounds({minX:0,maxX:300,minY:0,maxY:0})
                            $.fn.page.pageView='right';
                        }});
                    }
                    if($.fn.page.pageView=='left'){
                        $.fn.page.dragbody[0].disable();
                        TweenLite.to(ele,.3,{x:'0%',onComplete:function(){
                            $.fn.page.dragbody[0].enable();
                            $.fn.page.dragbody[0].applyBounds(bounds)
                            $.fn.page.pageView='main';
                        }});
                    }
                }
            }else{
                if(this.y<60&&this.y>-60){
                    $.fn.page.dragbody[0].disable();
                    TweenLite.to(ele,.3,{y:0,onComplete:function(){
                        $.fn.page.dragbody[0].enable();
                    }});
                }else if(this.y>=60){//down, could be overwritten...
                    opts.close();
                }else if(this.y<=-60){//up
                    //assume there is a down page to view.
                    $.fn.page.dragbody[0].disable();
                    TweenLite.to(ele,.3,{y:'-100%',onComplete:function(){
                        $.fn.page.dragbody[0].enable();
                    }});
                }
            }
        }
    });
};
$.fn.page.getPage=function(){
    var eles=$('body').find('.mobilepagemaincontainer');
    var mz=0;
    var ele=false;
    $.each(eles,function(i,v){
        if(!$(v).hasClass('closing')){
            var zi=parseInt(v.style.zIndex ,10);
            if(zi>mz){
                ele=$(v);
                mz=zi;
            }
        }
    });
    return ele;
};
$.fn.page.getSplashPage=function(){
    var eles=$('body').find('.splashpagemain');
    var mz=0;
    var ele=false;
    $.each(eles,function(i,v){
        var zi=parseInt($(v).css('zIndex'),10);
        if(zi>mz){
            ele=$(v);
            mz=zi;
        }
    });
    return ele;
};
;$.fn.subpage=function(obj){
    var ele=$(this);
    if(!ele.parent().hasClass('subpagewrapper')){//if the wrap happens, it causes  issue with scroller!
        //wrap it for now...but signal in dev
        if(app.isdev){
            console.warn('nowrapper! will cause issue with scrollers!');
            ele.css({width:'100%',height:'100%',bottom:'',right:''});//make sure its a "pane" and doesnt extend past boundaries
            ele.wrap('<div class="subpagewrapper" style="height:100%;position:relative"></div>');
            //return false;
        }else{
            ele.css({width:'100%',height:'100%',bottom:'',right:''});//make sure its a "pane" and doesnt extend past boundaries
            ele.wrap('<div class="subpagewrapper" style="height:100%;position:relative"></div>');
        }
    }
    var oele=ele;
    var pele=ele.parent();
    //depending on number of pages show so far, set subpagewrapper width
    var childcount=pele.children(':not(.coverpage)').length;
    if(obj.replace){
        childcount--;//dont include own page
    }
    //pele.css('width',(childcount*100)+'%');
    //set up next page
    if(!obj.data) obj.data={};
    //obj.data.left=(childcount*100);
    obj.data.left=0;
    var lp=pele.children(':not(.coverpage):nth-child('+childcount+')');
    lp.css({zIndex:childcount});
    pele.render({
        uid:(obj.uid)?obj.uid:Math.uuid(12),
        replace:(obj.replace)?1:0,
        force:1,
        template:(obj.loadtemplate)?obj.loadtemplate:'subpage_loading',
        appendTemplate:'subpage_cover',
        appendTemplateData:{left:(childcount*100-100),child:childcount},
        data:obj.data,
        binding:function(ele){
            //animate it!
            //swipeable!
            TweenLite.set(ele,{zIndex:childcount*2+1,x:((childcount)*100+'%')});
            if(obj.onPageRendered) obj.onPageRendered(ele);
            if(!obj.replace){
                var delay=.3;
                if(_.isWebLayout()) delay=0;
                TweenLite.to(pele.find('[data-childpage='+childcount+']'),delay/3,{opacity:1});
                TweenLite.to(pele,delay,{x:-((childcount)*100)+'%',z:1,onComplete:function(cb){
                    if(obj.onPageReady) obj.onPageReady(ele,function(cb){
                        var childcount=pele.children(':not(.coverpage)').length-1;//mightchange
                        TweenLite.to(pele.find('[data-childpage='+childcount+']'),delay,{opacity:0});
                        TweenLite.to(pele,delay,{x:-((childcount-1)*100)+'%',z:1,onComplete:function(){
                            //delete the page that was just showing
                            ele.remove();
                            pele.find('[data-childpage='+childcount+']').remove();
                            //remove page wrapper! (never!)
                            //if(childcount==1) oele.unwrap();
                            if(obj.onPageReturn) obj.onPageReturn();
                            if(cb) cb();
                        }})
                    });
                }})
            }else{//if replacing, the location should already be ok
                if(obj.onPageReady) obj.onPageReady(ele,function(cb){
                    var childcount=pele.children().length-1;//mightchange
                    var delay=.3;
                    if(_.isWebLayout()) delay=0;
                    TweenLite.to(pele.find('[data-childpage='+childcount+']'),delay,{opacity:0});
                    TweenLite.to(pele,delay,{x:-((childcount-1)*100)+'%',z:1,onComplete:function(){
                        //delete the page that was just showing
                        ele.remove();
                        pele.find('[data-childpage='+childcount+']').remove();
                        //remove page wrapper! (never!)
                        //if(childcount==1) oele.unwrap();
                        if(obj.onPageReturn) obj.onPageReturn();
                        if(cb) cb();
                    }})
                });
            }
            if(obj.binding) obj.binding(ele);
        }
    })
};
$.fn.subpage.maxOpacity=1;
$.fn.page.pagecount=0;