;$.fn.alert=function(obj){
    $.fn.alert.currentalertopts=obj;
    $.fn.alert.noblur=false;
    if(obj.rele){
        if(obj.tempdata) obj.data=obj.tempdata;
        if(!obj.data) obj.data={};
        obj.append=false;
        obj.data.groupselect=1;
        obj.rele.render(obj);
        return false;
    }
    if(!$.fn.alert.alertzindex) $.fn.alert.alertzindex=500;
    if(!$.fn.alert.storedmodal) $.fn.alert.storedmodal=[];
    $.fn.alert.alertzindex++;
    if($('body').find('.modalalert').length&&!obj.replace&&!obj.overlay){//modal already open, store and bring up when open one closes
        if(obj.dontstore) return false;
        obj.animate=false;
        $.fn.alert.storedmodal.push({
            obj:obj,
            ele:$(this)
        });
        return false;
    }
    var def={
        id:'alert',//Math.uuid(),
        uid:'alert',
        animatedmodal:true,
        minimizable:false,//true,
        icon:'',
        fixed:($.fn.alert.fixed)?true:false,
        iconcolor:'white',
        closerColor:'white',
        title:'',
        titleColor:'',
        timeout:1500,
        mobilize:false,
        rele:false,
        close_above:false,
        clearAnimation:false,
        hideonkeyboard:false,
        overflow:false,
        image:false,
        //image:'<img src="https://wearenectar.s3.amazonaws.com/static/nectar.png" style="max-height:80px;margin:10px;"/>',
        module:false,
        modalClass:'',
        background:'white',
        color:'white',
        width:400,
        zIndex:$.fn.alert.alertzindex,
        animate:true,
        closer:true,
        autowidth:false,
        autoheight:false,
        textsize:14,
        iconsize:60,
        spacing:45,
        maxwidth:900,
        maxHeight:false,
        escClose:false,
        buttons:[
            {
                btext:'OK',
                bclass:'x_closer'
            }
        ],
        triggerModal:function(){
            if($.fn.alert.storedmodal.length){
                var c=$.extend(true,{},$.fn.alert.storedmodal[0]);
                $.fn.alert.storedmodal.splice(0,1);
                if(c) c.ele.alert(c.obj);
            }
        },
        onResize:function(force,ele){
            if(!ele) ele=$.fn.alert.getAlert();
            if(ele.length){
                var data=ele.data('data');
                if(data.autowidth) data.setAutoWidth(ele);
                if(data.autoheight) data.setAutoHeight(ele,force);
            }
        },
        closeAlert:function(e,ele,force){
            if(e){
                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();
            }
            if(!ele) ele=$.fn.alert.getAlert();
            if(!ele) return false;
            var obj=ele.data('data');
            if(!obj) return false;
            if(obj.shouldClose){
                if(obj.shouldClose()===false) return false;//stop it!
            }
            if(!obj) return false;
            $.fn.alert.alertzindex--;//should keep at ~500
            $.fn.alert.centerModal=false;
            $.fn.alert.resizeModal=false;
            if(obj.onExit){
                obj.onExit(force,ele.data('closed',1));
            }
            obj.clearBlur();
            var animate=true;
            if(animate&&!$.fn.alert.storedmodal.length&&!force){
                ele.fadeOut(obj.closespeed,function(){
                    $(this).remove();
                    if(obj.onClose) obj.onClose();
                    obj.triggerModal();
                })
                ele.find('.normalfastanimated').addClass('hideanimation');
                setTimeout(function(){
                    ele.find('.normalfastanimated').addClass('zoomOut');
                },10)
            }else{
                ele.remove();
                if(obj.onClose) obj.onClose(force);
                obj.triggerModal();
            }
            $('body').removeClass('hidestatusbar');
            if(isMobile) window.scrollTo(0,0);
            $.fn.alert.currentalertopts=false;
        },
        setAutoWidth:function(ele){
            if(!ele) ele=$.fn.alert.getAlert();
            if(ele.length){
                var data=ele.data('data');
                var mw=data.maxwidth;
                var w=$('body').width()*.9;
                if(data.maxWidth){
                    ele.find('.alertcontent').css({width:w});
                }else{
                    if(w>mw) w=mw;
                    ele.find('.alertcontent').css({width:mw});
                }
            }
        },
        setAutoHeight:function(ele,force){
            if(!ele) ele=$.fn.alert.getAlert();
            if(!ele.length) return false;
            var data=ele.data('data');
            if(!data) return false;
            if(ele.find('.scrollingarea').length) ele.find('.scrollingarea').height('');//hopefully wont cause any issues.
            var availableheight=$('body').height()-(data.spacing*2);
            if(data.maxHeight){
                ele.find('.alertcontent').css({height:availableheight,overflow:'hidden'});
            }else{
                var h=0;
                ele.find('.alertcontent').find('.calcheight:visible').each(function(i,v){
                    h+=$(v).outerHeight();
                });
                if(h>availableheight){
                    ele.find('.alertcontent').css({height:availableheight,overflow:'hidden'});
                }else{
                    ele.find('.alertcontent').css({height:h,overflow:'hidden'});   
                }
            }
            data.onHeightUpdate(force);
        },
        onHeightUpdate:function(){},
        clearBlur:function(){
            if($.fn.alert.noblur) return false;
            if($('body').find('.modalalertmain').length<=1){
                $('body').find('.blurclass_go').removeClass('blurclass_go');
                setTimeout(function(){
                    $('body').find('.blurclass').removeClass('blurclass');
                },200)
            }
        },
        setBlur:function(){
            if($.fn.alert.noblur) return false;
            ele=$.fn.alert.getAlert();
            if(!ele) return false;
            var obj=ele.data('data');
            if(!obj.noblur){
                if(!obj.blurEle) obj.blurEle=$('#wrapper');
                obj.blurEle.addClass('blurclass')
                setTimeout(function(){
                    obj.blurEle.addClass('blurclass_go')
                },10);
            }
        },
        minify:function(){
            ele=$.fn.alert.getAlert();
            if(!ele) return false;
            var obj=ele.data('data');
            obj.clearBlur();
            ele.addClass('minify')
        },
        expand:function(){
            ele=$.fn.alert.getAlert();
            if(!ele) return false;
            var obj=ele.data('data');
            obj.clearBlur();
            ele.removeClass('minify')
        },
        onOpen:function(ele,data){},
        onClose:function(){}
    }
    var obj=$.extend(true,{},def,obj);
    //if(!obj.uid) obj.uid
    if(!obj.content&&obj.template){
        if(!obj.tempdata) obj.tempdata={};
        obj.content=$.fn.render.getTemplate(obj.template).render($.extend(true,{},{template:obj.template,uid:obj.uid,_tid:obj.uid},obj.tempdata));
        obj.rendered=1;
    }else{
        obj.rendered=0;
    }
    if(obj.template) delete obj.template;
    if(!obj.content) obj.content='';
    var opts={
        uid:obj.uid,
        template:($.fn.alert.useTemplate)?$.fn.alert.useTemplate:'alert',
        data:$.extend(true,{},{
            notop:false
        },obj),
        inAlert:1,
        bindings:[
            {
                type:'fn',
                binding:function(ele,data){ //center content
                    ele.data('data',data);
                    ele.data('scroller',new modules.scroller(ele.find('.relativealert')));
                    ele.find('.alertcontent').css({
                        marginLeft:-ele.find('.alertcontent').width()/2
                    });
                    if(obj.escClose&&!obj.mobilize) ele.find('.clickclose').stap(function(){
                        ele.data('closed',1);
                        obj.closeAlert(false,ele);  
                    })
                    if(obj.autowidth) obj.setAutoWidth(ele);
                    ele.find('img').on('load',function(){
                        obj.onResize(1);
                    });
                    ele.find('.x_closer').stap(function(){
                        ele.data('closed',1);
                        obj.closeAlert(false,ele);  
                    },1,'tapactive')
                    function show(){
                        ele.show();
                        TweenLite.to(ele.find('.clickclose'),.3,{opacity:1});
                        obj.onOpen(ele,data);
                        obj.setBlur();
                        setTimeout(function(){
                            ele.find('.normalfastanimated').addClass('showanimation zoomIn')
                            setTimeout(function(){
                                ele.find('.normalfastanimated').removeClass('zoomIn')//causes issues with iframe fullscreen
                            },500)
                        },10)
                    }
                    if(data.preview){
                        ele.hide();
                        data.preview(show);
                    }else{
                        show();
                    }
                }
            }
        ]
    };
    if(opts.data.icon===false) opts.data.image=false;
    if(opts.data.blurEle) delete opts.data.blurEle;
    if(obj.binding) opts.bindings.push({type:'fn',binding:obj.binding});
    if(obj.bindings) $.each(obj.bindings,function(i,v){
        opts.bindings.push(v);
    });
    $(this).render(opts);
    $.fn.alert.closeAlert=obj.closeAlert;
};
$.fn.alert.getAlert=function(){
    var eles=$('body').find('.modalalert');
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
}
$.fn.alert.cdot='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAMAAAAoyzS7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowNDgwMTE3NDA3MjA2ODExODcxRkM0QjZGODNDNTdCMiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpERkY3NzNEMjdFQTcxMUUxQjE1NkNGQTI0MjlCQUUwOSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpERkY3NzNEMTdFQTcxMUUxQjE1NkNGQTI0MjlCQUUwOSIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IE1hY2ludG9zaCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkM1Rjc4OTU0MjkyMDY4MTE4NzFGQzRBOUVCOEZBRDk0IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjA0ODAxMTc0MDcyMDY4MTE4NzFGQzRCNkY4M0M1N0IyIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+wgFJrQAAAAZQTFRF6+nkAAAApT0hTwAAAAxJREFUeNpiYAAIMAAAAgABT21Z4QAAAABJRU5ErkJggg==';