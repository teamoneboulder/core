if(!window.modules) window.modules={};
;modules.toast=function(oopts){
    if(app.browserShowing){
        console.warn('borwser showing');
        return false;//dont show toast for now, eventually do as localnotification
    }
    if(_.isWebLayout()){
        growl(oopts);
        return false;
    }
    //if(phone.statusBar) var returnTheme=phone.statusBar.getCurrent();
    opts=$.extend(true,{},{
        remove:2000,
        images:[],
        defaultImageSize:'small',
        content:'',
        title:'',
        loc:'top',
        bindings:[],
        embedded:false,
        swipable:true,
        icon:'icon-info-circled-alt',
        type:'default',
        fontColor:'#555',
        //height:(isPhoneGap())?80:85,
        typecolors:{
            default:app.headerColor,
            info:'#ccc',
            warning:'#FFCC00',
            danger:'#B22222',
            error:'#B22222'
        },
        highlightcolor:false,
        closeable:false,
        retry:false,
        onRetry:function(){},
        onClose:function(){}
    },oopts);
    if(opts.icon&&opts.icon=='icon-warning-sign') opts.icon='icon-info-circled-alt';
    if(!opts.highlightcolor){
        if(oopts.type){
            opts.highlightcolor=opts.typecolors[opts.type];
            opts.fontColor='white';
        }else{
            opts.highlightcolor='white';
        }
    }
    opts.highlightcolor=new tinycolor(opts.highlightcolor).setAlpha(.8).toRgbString();
    var id=(opts.id)?opts.id:Math.uuid(8);
    var tdata=$.extend(true,{},{uid:Math.uuid(8),template:opts.template},((opts.tempdata)?opts.tempdata:{}));
    tdata._tid=tdata.uid;
    if(opts.template&&$.fn.render.getTemplate(opts.template)) opts.content=$.fn.render.getTemplate(opts.template).render(tdata);
    opts.template='module_toast_item';
    var bindings=[{
        type:'fn',
        binding:function(ele){
            if(opts.onClick){
                ele.stap(function(){
                    opts.onClick();
                    ele.fadeOut(500,function(){
                        opts.onClose();
                        $(this).remove();
                    })
                },1,'tapactive')
            }
            if(opts.link){
                ele.stap(function(){
                    ele.fadeOut(500,function(){
                        opts.onClose();
                        ele.remove();
                    })
                })
            }
            if(opts.retry){
                ele.find('.x_retry').stap(function(){
                    opts.onRetry();
                },1,'tapactive')
            }
            ele.find('.x_closer').stap(function(){
                TweenLite.to(ele,.2,{marginTop:'-100px',onComplete:function(){
                    opts.onClose();
                    ele.remove();
                }});
            },1,'tapactive')
        }
    }];
    if(opts.bindings) $.each(opts.bindings,function(i,v){
        bindings.push(v);
    })
    if(opts.ele) delete opts.ele;
    bindings.push({
        type:'fn',
        binding:function(ele){
            var h=ele.height();
            var hideheight=-h+'px';
            TweenLite.set(ele,{marginTop:hideheight});
            //if(phone.statusBar) phone.statusBar.set('dark');
            if(opts.loc=='top'){
                //prevent bubbline of evnet
                // ele.on('touchmove',function(e){
                //     phi.stop(e);
                // })
                function hide(){
                    TweenLite.to(ele,.2,{marginTop:hideheight,onComplete:function(){
                        //if(phone.statusBar) phone.statusBar.set(returnTheme);
                        if(opts.dragger) opts.dragger[0].kill();
                        ele.remove();
                    }});
                }
                TweenLite.to(ele,.2,{marginTop:0,onComplete:function(){
                    if(opts.swipable){
                        if(window.Draggable){
                            opts.dragger=Draggable.create(ele, {
                                type:"y",
                                bounds:{minX:0,maxX:0,minY:-200,maxY:0},
                                throwProps:true,
                                force3D:true,
                                cursor:'defualt',
                                lockAxis:true,
                                edgeResistance:1,
                                onDragStart:function(e){
                                },
                                onDragEnd:function(e) {
                                    if(this.endY<-20){
                                        hide();
                                    }else{
                                        TweenLite.to(ele,.05,{y:'0px'});
                                    }
                                },
                                onDrag:function(){
                                }
                            });
                        }else{
                            console.warn('no-draggable')
                        }
                    }
                }});
                if(opts.remove){
                    setTimeout(function(){
                        hide();
                    },opts.remove)
                }
            }
            if(opts.loc=='bottom'){
                TweenLite.to(ele,.2,{marginBottom:0});
                if(opts.remove){
                    setTimeout(function(){
                        TweenLite.to(ele,.2,{marginBottom:'-100px',onComplete:function(){
                            ele.remove();
                        }});
                    },opts.remove)
                }
            }
        }
    })
    var rele=(opts.rele)?opts.rele:$('body');
    if(opts.rele){
        opts.embedded=true;
        opts.height-=20;
    }
    rele.render({
        uid:id,
        template:'module_toast_item',
        data:opts,
        bindings:bindings
    });
    return rele.find('[data-module_toast_item='+id+']');
}