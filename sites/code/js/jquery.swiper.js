$.fn.swiper=function(opts,aopts){
    var ele=this;
    //ele.addClass('swiper')
    if(!opts||typeof opts=='object'){
        ele.data('onpage',1);
        //pages are based on the child div that will be moved as parent
        if(opts.template){
            ele.render({
                template:opts.template,
                data:opts.data,
                bindings:[{
                    type:'fn',
                    binding:function(){
                        $.fn.swiper.bind(ele,opts);
                    }
                }]
            })
        }else{//its already rendered, just bind
            $.fn.swiper.bind(ele,opts)
        }
    }else{
        if($.fn.swiper[opts]){
            return $.fn.swiper[opts](ele,aopts);
        }else{
            console.warn('invalid call to $.fn.swiper')
        }
    }
};
$.fn.swiper.getBounds=function(ele){
        var bounds={};
        var onpage=parseInt(ele.data('onpage'),10)
        if(onpage>1) bounds.maxX=300;
        else bounds.maxX=0;
        if(onpage<ele.data('pages')) bounds.minX=-300;
        else bounds.minX=0;
        bounds.minY=0;//never swipe up...
        bounds.maxY=0;//always swipe to close
        return bounds;
    }
$.fn.swiper.getVar=function(ele,tvar){
    return ele.data(tvar);
}
$.fn.swiper.enable=function(ele){
    ele.data('dragbody')[0].enable();
}
$.fn.swiper.disable=function(ele){
    ele.data('moving',0);
    ele.data('dragbody')[0].disable();
}
$.fn.swiper.disablerevert=function(ele){
    ele.data('moving',0);
    ele.data('dragbody')[0].disable();
    TweenLite.to(ele,.1,{x:0});
}
$.fn.swiper.setPage=function(ele,setOpts){
    var opts=ele.data('opts');
    var fc=ele.children().first();
    ele.data('onpage',setOpts.page);
    ele.data('dragbody')[0].disable();
    var toPercentage=-(setOpts.page-1)*100;
    if(!setOpts.timing) setOpts.timing=.3;
    TweenLite.to(ele,setOpts.timing,{x:toPercentage+'%',onComplete:function(){
        ele.data('dragbody')[0].enable();
        ele.data('dragbody')[0].applyBounds($.fn.swiper.getBounds(ele))
        if(opts.onPageSelect) opts.onPageSelect(setOpts.page,fc.find('.page:nth-child('+setOpts.page+')'))
    }});
}
$.fn.swiper.swipeThreshhold=1;//px that must move in X time to indicate that a swipe motion is really meant.
$.fn.swiper.bind=function(ele,opts){
    var fc=ele.children().first();
    var pages=fc.children().length;
    opts=$.extend(true,{
        pages:pages,
        template:false,
        data:{},
        onPageSelect:function(page,ele){
            //console.log(page)
        }
    },opts);
    fc.css('width',(100*pages)+'%');
    ele.data('pages',pages);
    ele.data('opts',opts);
    ele.data('dragbody',Draggable.create(ele, {
        type:"x",
        bounds:$.fn.swiper.getBounds(ele),
        lockAxis:true,
        throwProps:true,//dont have this plugin...
        //force3D:true,//auto?
        cursor:'defualt',
        edgeResistance:1,
        onDrag:function(){
            return false;//prevent?
        },
        onDragStart:function(e){
            var obj=this
            // setTimeout(function(){
            //     if(Math.abs(obj.x)<$.fn.swiper.swipeThreshhold){
            //         console.log('not real intent');
            //         //move back!
            //         ele.data('dragbody')[0].disable();//stops drag event?
            //         TweenLite.set(ele,{x:0});
            //         ele.data('dragbody')[0].enable();
            //     }else{
            //         ele.data('moving',1);
            //         if(opts.onDragStart) opts.onDragStart();
            //     }
            // },20)
            ele.data('moving',1);
            if(opts.onDragStart) opts.onDragStart(obj);
        },
        onDragEnd:function(e) {
            //let momentum take for a second
            if(this.x!=0){
                if(this.x<80&&this.x>-80){
                    ele.data('dragbody')[0].disable();
                    TweenLite.to(ele,.3,{x:0,onComplete:function(){
                        ele.data('dragbody')[0].enable();
                        ele.data('moving',0);
                        if(opts.onDragEnd) opts.onDragEnd();
                    }});
                    //return
                }else if(this.x>=80){//right
                    ele.data('dragbody')[0].disable();
                    var onpage=parseInt(ele.data('onpage'),10)
                    onpage--;
                    ele.data('onpage',onpage);
                    var toPercentage=-(onpage-1)*100;
                    TweenLite.to(ele,.3,{x:toPercentage+'%',onComplete:function(){
                        ele.data('dragbody')[0].enable();
                        ele.data('dragbody')[0].applyBounds($.fn.swiper.getBounds(ele));
                        if(opts.onPageSelect) opts.onPageSelect(onpage,fc.find('.page:nth-child('+onpage+')'))
                        ele.data('moving',0);
                        if(opts.onDragEnd) opts.onDragEnd();
                    }});
                }else if(this.x<=-80){//left
                    ele.data('dragbody')[0].disable();
                    var onpage=parseInt(ele.data('onpage'),10)
                    onpage++;
                    ele.data('onpage',onpage);
                    var toPercentage=-(onpage-1)*100;
                    TweenLite.to(ele,.3,{x:toPercentage+'%',onComplete:function(){
                        ele.data('dragbody')[0].enable();
                        ele.data('dragbody')[0].applyBounds($.fn.swiper.getBounds(ele))
                        if(opts.onPageSelect) opts.onPageSelect(onpage,fc.find('.page:nth-child('+onpage+')'))
                        ele.data('moving',0);
                        if(opts.onDragEnd) opts.onDragEnd();
                    }});
                }
            }else{
                ele.data('moving',0);
                if(opts.onDragEnd) opts.onDragEnd();
            }
        }
    }));
}