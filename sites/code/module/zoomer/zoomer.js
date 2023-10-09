if(!window.modules) window.modules={};
;modules.zoomer=function(ele,opts){
	var self=this;
	self.opts=opts;
	self.ele=ele;
	self.max=6;
	this.zoomoptions={animate:false};
	this.init=function(){
        self.ele.panzoom({
            increment:1,
          	minScale: 1,
          	maxScale: self.max,
          	contain:'invert',
          	onStart:function(a,b,c){//only support zoom changes
            	if(self.fzoom) return false;//a zoom from a "zoom" event
            	if(opts.dragele){
                 	if((self.currentzoom!=1||c&&c.touches&&c.touches.length>1)&&opts.dragele[0].enabled()){
                    	opts.dragele[0].disable();
                	}
            	}
            },
            onEnd:function(e){
                //phi.stop(e)
                self.checkZoom();
            }
        });
        self.lasttap=0;
        self.center={
            x:(($('body').width()-self.ele.width())/2),
            y:(($('body').height()-self.ele.height())/2)
        }
        self.ele.on('touchstart',function(e){//check for double clicking!
            if(e.originalEvent.touches.length==1){
                var touch=e.originalEvent.touches[0];
                self.lastTouch={
                    clientX:touch.pageX-self.center.x,
                    clientY:touch.pageY-self.center.y
                }
            }else{//pinch! clear out, dont want touchend to trigger zoom
                self.lastTouch=false;
            }
        });
        self.ele.on('touchend',function(e){//check for double clicking!
            if(self.lasttap&&self.lastTouch){
                var diff=e.timeStamp-self.lasttap;
                if(diff<300){
                    if(self.currentzoom==1){//zoom in
                        //_alert(JSON.stringify(self.lastTouch));
                        self.setZoom('max',self.lastTouch);
                    }else{//zoom out
                        self.setZoom(1);
                    }
                }else{
                    if(opts.onClick) opts.onClick();
                }
                self.lastTouch=false;
            }
            self.lasttap=e.timeStamp;

        })
        var fi=self.ele.attr('data-fullimg');
        var ci=self.ele.attr('src');
        self.ele.data('osrc',ci);
        self.currentzoom=1;
        self.fullloaded=0;
	}
	this.destroy=function(){
		if(self.ele){
            self.ele.panzoom("destroy");
            self.ele=false;
        }
	}
    this.disable=function(){
        self.ele.panzoom("disable");
    }
    this.enable=function(){
        self.ele.panzoom("enable");
    }
	this.setZoom=function(zoom,focus){
        if(!self.ele) return false;
        self.fzoom=1;
        setTimeout(function(){
            self.fzoom=0;
        },250);
        if(zoom=='max') zoom=self.max/2;
        self.currentzoom=zoom;
        if(focus){
            var opts=$.extend(true,self.zoomoptions,{
                focal:focus
            })
        }else{
            var opts=self.zoomoptions;
        }
        opts.animate=true;//animate that shit!
        self.ele.panzoom("zoom", zoom,opts);
        self.ele.panzoom("resetDimensions");
        setTimeout(function(){
            self.checkZoom();
        },10);
    }
    this.checkZoom=function(){
        if(!self.ele) return false;
        var matrix=self.ele.panzoom('getMatrix');
        var cz=matrix[3];
        var oz=self.currentzoom;
        self.currentzoom=cz;
        if(cz==1){
            if(self.opts.dragele) self.opts.dragele[0].enable();
        }else{//load full img and disable drag
            if(self.opts.dragele&&self.opts.dragele[0]&&self.opts.dragele[0].enabled()){
                self.opts.dragele[0].disable();
            }
            if(!self.ele) return false;
            var fi=self.ele.attr('data-fullimg');
            var ci=self.ele.attr('src');
            if(!fi||!ci){
                console.warn('invalid data-fullimg')
            }else{
                if(ci!=fi&&fi&&cz!=1){
                    if(!self.ele.data('loaded')){//only allow one time!
                        self.ele.data('loaded',1);
                        $.fn.preload(fi,false,function(){
                            self.ele.attr('src',fi);
                        })
                    }
                } 
            }
        }
        self.ele.panzoom("resetDimensions");
    }
	self.init();
}