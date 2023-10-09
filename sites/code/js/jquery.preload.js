;$.fn.preload = function(src,bg,cb,timeout,failcb,noset){
    if(!window.imgs) window.imgs={};
    var o=this;
    if(!window.imgs[src]){
        if(timeout&&failcb) setTimeout(function(){
            if(!window.imgs[src]&&failcb) failcb();
        },timeout)
        var img = new Image();
        var timg=$(img);
        timg.attr('src',src);
        if (img.complete || img.readyState === 4) {
            // image is cached
            window.imgs[src]={
                width:img.width,
                height:img.height,
                ar:img.width/img.height
            }
            if(o){
                if(!noset){
                    if(!bg){
                        o.attr('src',src);

                    }else{ //set as background img
                        o.css('backgroundImage','url('+src+')');
                    }
                }
                if(cb) cb(window.imgs[src]);
            }
        } else {
            timg.on('load',function() {
                window.imgs[src]={
                    width:img.width,
                    height:img.height,
                    ar:img.width/img.height
                }
                // image was not cached, but done loading
                if(!noset){
                    if(o){
                        if(!bg){
                            o.attr('src',src);
                        }else{ //set as background img
                            o.css('backgroundImage','url('+src+')');
                        }
                    }
                }
                if(cb) cb(window.imgs[src]);
            }).on('error',function(){
                if(!window.imgs[src]&&failcb) failcb();
            });
        }
    }else{ //go ahead a set - the image has been loaded in this session
        if(o){
            if(!bg){
                o.attr('src',src);
            }else{ //set as background img
                o.css('backgroundImage','url('+src+')');
            }
        }
        if(cb) cb(window.imgs[src]);
    }
    return this;
};