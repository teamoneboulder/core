if(!window.modules) window.modules={};
modules.imageviewer=function(options){
	var self=this;
	self.options=options;
    this.init=function(){
        if(modules.keyboard_global) modules.keyboard_global.hide()
        if(phone.statusBar) phone.statusBar.hide();
        //enable rotate
        if(phone.orientation) phone.orientation.unlock();
        $('body').render({
            template:'imageviewer',
            data:{
            },
            binding:function(ele){
                //set up animation
                self.ele=ele;
                self.bindMore();
                ele.find('.x_left').stap(function(e){
                    phi.stop(e);
                    self.gallery.prev();
                },1,'tapactive');
                ele.find('.x_right').stap(function(e){
                    phi.stop(e);
                    self.gallery.next();
                },1,'tapactive');
                ele.find('.x_closer').stap(function(e){
                    phi.stop(e);
                    self.gallery.close()
                },1,'tapactive');
                if(!isMobile){
                    ele.find('.pswp__item').on('click',function(e){
                        if(self.gallery.getZoomLevel()==self.gallery.currItem.fitRatio){
                            self.gallery.zoomTo(self.gallery.currItem.fitRatio*2, {x:self.gallery.viewportSize.x/2,y:self.gallery.viewportSize.y/2}, 300, false, false);
                        }else{
                            self.gallery.zoomTo(self.gallery.currItem.fitRatio, {x:self.gallery.viewportSize.x/2,y:self.gallery.viewportSize.y/2}, 300, false, false);
                        }
                    });
                }
                ele.on('touchstart',function(e){
                    if(!e.originalEvent||(e.originalEvent&&e.originalEvent.touches.length==1)){//only handle for single touches
                        var ct=new Date().getTime();
                        if(self.lastTap&&(ct-self.lastTap)<300){
                            //console.log('double tap!!')
                            if(self.gallery.getZoomLevel()==self.gallery.currItem.fitRatio){
                                self.gallery.zoomTo(self.gallery.currItem.fitRatio*3, {x:self.gallery.viewportSize.x/2,y:self.gallery.viewportSize.y/2}, 300, false, false);
                            }else{
                                self.gallery.zoomTo(self.gallery.currItem.fitRatio, {x:self.gallery.viewportSize.x/2,y:self.gallery.viewportSize.y/2}, 300, false, false);
                            }
                        }
                        self.lastTap=ct;
                    }
                })
                var pswpElement = ele[0];
                var items=[];
                if(self.options.img){
                    var img=self.options.img;
                    if(!self.options.data) self.options.data={}
                    self.options.data.list={};
                    self.options.data.order=[]
                    var id=Math.uuid(12);
                    self.options.data.list[id]=img;
                    self.options.data.order.push(id);
                }
                $.each(self.options.data.order,function(i,v){
                    var img=self.options.data.list[v];
                    items.push({
                        src:_.getImg(self.getPic(img),'small'),
                        w:1000,
                        h:1000/((self.getPic(img).ar)?self.getPic(img).ar:1)
                    })
                })
                // define options (if needed)
                var options = {
                    // optionName: 'option value'
                    // for example:
                    showHideOpacity:true,
                    closeOnScroll:false,
                    history:false,
                    index: (self.options.index)?self.options.index:0 ,
                    getThumbBoundsFn:function(){
                        if(self.options.ele){
                            var rect = self.options.ele[0].getBoundingClientRect(); 
                            var pageYScroll=0;
                            return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
                        }else{
                            return false;
                        }
                    }
                };
                self.currentIndex=options.index;
                // Initializes and opens PhotoSwipe
                self.gallery = new PhotoSwipe( pswpElement, false, items, options);
                self.gallery.init();
                self.gallery.listen('close', function() {
                    self.destroy();
                });
                self.gallery.listen('afterChange', function() {
                    self.ensureArrows();
                });
                self.ensureArrows();
            }
        });
    }
	this.init2=function(){
        if(modules.keyboard_global) modules.keyboard_global.hide()
        if(phone.statusBar) phone.statusBar.hide();
        //enable rotate
        if(phone.orientation) phone.orientation.unlock();
        //get current position of photo from element passed
        if(options.img){
            var img=options.img;
            if(!options.data) options.data={}
            options.data.list={};
            options.data.order=[]
            var id=Math.uuid(12);
            options.data.list[id]=img;
            options.data.order.push(id);
            self.currentIndex=0;
        }else if(options.data){
            var img=options.data.list[options.data.order[options.index]];
            self.currentIndex=parseInt(options.index,10);
        }else{
            return console.warn('Invalid imageviwer conf');
        }
        $('body').on('keyup',self.onKeyup);
        //get aspect ratio of current screen
        var ar=$('body').width()/$('body').height();
        if(options.ele){
            if(!self.getPic(img).ar){
                var ar=options.ele.width()/options.ele.height();
            }else{
                var ar=self.getPic(img).ar;
            }
            var offset=options.ele.offset();
            var c={
                x:offset.left+(options.ele.outerWidth()/2),
                y:offset.top+(options.ele.outerHeight()/2)
            }
            if(1>ar){//portrait
                var imgwidth=options.ele.outerWidth();
                var imgheight=imgwidth/ar;
                if(ar>ar){//fit by width
                    var scale=imgwidth/$('body').width();
                    var page={
                        width:$('body').width()*scale,
                    }
                    page.height=page.width/ar;
                }else{//fit by height
                    var scale=imgheight/$('body').height();
                    var page={
                        height:$('body').height()*scale,
                    }
                    page.width=page.height*ar;
                }
            }else{//landscape
                var imgheight=options.ele.outerHeight();
                var imgwidth=imgheight*ar;
                if(ar>ar){//fit by width
                    var scale=imgwidth/$('body').width();
                    var page={
                        width:$('body').width()*scale,
                    }
                    page.height=page.width/ar;
                }else{//fit by height
                    var scale=imgheight/$('body').height();
                    var page={
                        height:$('body').height()*scale,
                    }
                    page.width=page.height*ar;
                }
            }
            page.left=c.x-page.width/2;
            page.top=c.y-page.height/2;
        }else{
            var page={
                width:$('body').width(),
                height:$('body').height(),
                top:0,
                left:0
            }
        }
        //calcuate page position which matches current offset
        $('body').render({
            template:'imageviewer',
            data:{
                index:self.currentIndex,
                page:page,
                spin:(options.spin)?1:0,
                img:img
            },
            binding:function(ele){
                //set up animation
                self.ele=ele;
                self.bindMore();
                self.ensureFull(ele.find('.imgcard'),img);
                self.bindTools(ele);
                self.ensureArrows();
                ele.find('.x_left').stap(function(){
                    self.previous();
                },1,'tapactive');
                ele.find('.x_right').stap(function(){
                    self.next();
                },1,'tapactive');
                if(options.spin){
                    $('body').spin();
                    var timg=modules.tools.getImg(self.getPic(img),'small');
                    $.fn.preload(timg,false,function(){
                        ele.find('.mainimg').attr('src',timg);
                        $('body').spin(false);
                    })
                }
                ele.find('.x_closer').stap(function(){
                    self.close();
                },1,'tapactive')
                var animateele=ele.find('.animatedimage');
                //animate background opacity!
                TweenLite.to(ele.find('.mainele'),.2,{background:'rgba(0,0,0,1)',ease:Power1.easeIn})
                TweenLite.to(animateele,.2,{top:'0px',left:'0px',width:'100%',height:'100%',ease:Power1.easeIn,onComplete:function(){
                    //bind swiping and image carrousell
                    self.bind();
                }});

            }
        })
        //add another photo idential to the dom overlaid and animate to final, fullscreen position, and fade in black
    }
    this.bindMore=function(){
        self.ele.find('.x_more').stap(function(){
            if(isPhoneGap()){
                var menu=[{
                    id:'share',
                    name:'Share Image',
                    icon:'icon-share'
                }]
                if(app.device=='Android'){
                    menu.push({
                    id:'download',
                    name:'Save Image',
                    icon:'icon-floppy'
                })
                }
            }else{
                var menu=[{
                    id:'download',
                    name:'Download Image',
                    icon:'icon-download'
                }]
            }
            var alert=new modules.alertdelegate({
                display:{
                    ele:$(this).find('i'),
                    container:self.ele,
                    locations:['bottomright']
                },
                body:true,
                menu:menu,
                onSelect:function(id){
                    var img=options.data.list[options.data.order[self.gallery.getCurrentIndex()]];
                    if(id=='download'){
                        modules.saveimage.save(modules.tools.getImg(self.getPic(img),'full'));
                    }
                    if(id=='share'){
                        window.plugins.socialsharing.share('','',_.getImg(self.getPic(img),'full'),null);
                    }
                }
            });
            alert.show();
        },1,'tapactive')
    }
    this.ensureArrows=function(){
        if(options.data){
            if(self.gallery.getCurrentIndex()==0){
                //hide left
                self.ele.find('.x_left').hide();
            }else{
                self.ele.find('.x_left').show();
            }
            if(self.gallery.getCurrentIndex()==options.data.order.length-1){
                self.ele.find('.x_right').hide();
            }else{
                self.ele.find('.x_right').show();
            }
        }else{
            self.ele.find('.x_left').hide();
            self.ele.find('.x_right').hide();
        }
    }
    this.onKeyup=function(e){
        if(e.which==27){
            self.close();
        }
        if(e.which==37){//left
            self.previous();
        }
        if(e.which==39){//right
            self.next();
        }
    }
    this.getPic=function(img){
        if(img.pic) return img.pic;
        if(img.data) return img.data;
        return img;
    }
    this.destroy=function(){
        if(self.options.onClose) self.options.onClose();
        $('body').off('keyup',self.onKeyup);
        if(phone.orientation) phone.orientation.lock();
        if(phone.statusBar) phone.statusBar.show();
    	self.currentpage=false;
    	//if(self.zoomer) self.zoomer.destroy();
        //if(self.swiper) self.swiper[0].kill();
        self.ele.remove();
        self.animating=false;
        delete self;
    }
    this.bindTools=function(ele){
        ele.find('.x_download').stap(function(){

        },1,'tapactive');
        ele.find('.x_share').stap(function(){
            var index=$(this).parents('.actionbar').first().attr('data-index');
            var item=self.options.data.list[self.options.data.order[index]];
            modules.tools.share({
                img:modules.tools.getImg(self.getPic(img),'full')
            })
        },1,'tapactive');
    }
    self.init();
}