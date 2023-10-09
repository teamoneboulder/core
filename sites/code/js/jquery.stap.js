//Stap
(function(e) {
    function isPhoneGap(){
        if ((document.URL.indexOf('http://') === -1) && (document.URL.indexOf('https://') === -1)) {
            return true;
        }else{
            return false;
        }
    };
    function mobileCheck() {
        if( navigator.userAgent.match(/Android/i)
         || navigator.userAgent.match(/webOS/i)
         || navigator.userAgent.match(/iPhone/i)
         || navigator.userAgent.match(/iPad/i)
         || navigator.userAgent.match(/iPod/i)
         || navigator.userAgent.match(/BlackBerry/i)
         || navigator.userAgent.match(/Windows Phone/i)
         ){
            return true;
          }
         else {
            return false;
          }
    };
    window.isMobile=mobileCheck();
    if(!isPhoneGap()){
        window.addEventListener('mousedown',function(){
            window.mousedown=true;
            window.mousemoving=false;
        },{
            passive:true
        })
        window.addEventListener('mouseup',function(){
            setTimeout(function(){
                window.mousedown=false;
                window.mousemoving=false;
            },10)
        },{
            passive:true
        }) 
        window.addEventListener('mousemove',function(){
            if(window.mousedown){
                window.mousemoving=true;
            }
        },{
            passive:true
        }) 
    }
    e.fn.stap = function(t, n, r, h) {
        if (typeof t !== "function") {
            return this.each(function() {
                e(this).trigger("stap")
            })
        }
        return this.each(function() {
            if (isMobile) {
                e(this).data({
                    scr: n,
                    activeClass: r
                }).addClass("_tap").addClass('_stap').on("stap", function(f){
                    t.call(this,f);
                }).on("_tap.stap", function(f){
                    if(window.phi&&phi.animating){
                        return console.warn('ℹ️ An app page animation is happening, dont allow a click during this time!');
                    }
                    var ct=new Date().getTime();
                    var last=$(this).attr('data-last');
                    if(last){//prevents quick double clicking!
                        var diff=ct-last;
                        if(diff<300){
                            console.warn('ℹ️ Quick double click detected! Preventing second click!');
                            return false;
                        }
                    }
                    $(this).attr('data-last',ct);
                    t.call(this,f);
                }).on("click.stap", function(f) {
                    this.blur();
                    f.preventDefault();
                    f.stopPropagation()
                }).data("stap", true);
                if(h){
                    e(this).data('hold',1).on("_tap_hold.stap", h);
                }
            } else {
                // e(this).addClass('_stap').on("stap",t).on("click.stap",  function(e){
                //     if(!window.mousemoving) t.call(this,e);
                // }).data("stap", true)
                if(h){
                    modules.tools.onHover(e(this),function(ele){
                        h.call(ele[0],e);
                    })
                    //e(this)
                }
                e(this).addClass('_stap').on("stap", t).on("mousedown",function(e){
                    var c={
                        x:e.clientX,
                        y:e.clientY
                    }
                    $(this).data('last',c)
                }).on('mouseup',function(te){
                    var last=$(this).data('last');
                    if(last){
                        var c={
                            x:te.clientX,
                            y:te.clientY
                        }
                        var dx=c.x-last.x;
                        var dy=c.y-last.y;
                        var d=Math.sqrt((dx*dx+dy*dy));
                        if(d<1){
                            //console.log(e(this))
                            //e(this).trigger('_stap');//click event happend, bubble it
                            t.call(this,te);
                        }
                    }
                    $(this).data('last',false)
                }).data("stap", true)
            }
        })
    };
    e.stap = {
        tolerance:5,//5 px tolerance
        doc: window.document,
        tstart: function(t) {
            e.stap.moved = false;
            e.stap.tapped=false;
            e.stap.startTime = t.timeStamp;
            e.stap.el = e(t.target);
            if (!e.stap.el.hasClass("_tap")) {
                e.stap.el = e.stap.el.parents("._tap:first")
            }
            if (e.stap.el[0]) {
                if (!e.stap.el.data("scr")) {
                    t.preventDefault();
                    t.stopPropagation();
                    e.stap.el.trigger("_tap")
                } else {
                    if (e.stap.el.data("hold")) {
                        e.stap.to=setTimeout(function(){
                            if(!e.stap.moved){
                                e.stap.moved=true;
                                e.stap.el.removeClass(e.stap.ac);
                                e.stap.el.trigger("_tap_hold");
                            }
                        },300);
                    }
                    e.stap.startX = t.touches[0].clientX;
                    e.stap.startY = t.touches[0].clientY;
                    e.stap.el[0].addEventListener("touchmove", e.stap.tmove,{
                        passive:true
                    });
                    e.stap.doc.addEventListener("touchend", e.stap.tend,{
                        passive:true
                    });
                    e.stap.ac = e.stap.el.data("activeClass") || "active";
                    e.stap.hold=e.stap.el.data("hold");
                    e.stap.el.addClass(e.stap.ac)
                }
            } else {}
        },
        tmove:function(t){
            var dy=(t.touches[0].clientY-e.stap.startY)
            var dx=(t.touches[0].clientX-e.stap.startX);
            var diff=Math.sqrt(dy*dy+dx*dx);
            //onerror('moved:'+diff+' px');
            // if (!e.stap.moved && (t.touches[0].clientX != e.stap.startX || t.touches[0].clientY != e.stap.startY)) {
            //     e.stap.el.removeClass(e.stap.ac);
            //     e.stap.moved = true
            // }
            if (!e.stap.moved && diff>e.stap.tolerance) {
                e.stap.el.removeClass(e.stap.ac);
                e.stap.moved = true
                if(e.stap.to) clearTimeout(e.stap.to);
            }
            e.stap.lastmove = t.timeStamp
        },
        tend: function(t) {
            if (e.stap.el[0]) e.stap.el[0].removeEventListener("touchmove", e.stap.tmove, false);
            e.stap.doc.removeEventListener("touchend", e.stap.tend, false);
            if(e.stap.to) clearTimeout(e.stap.to);
            if (!e.stap.moved) {
                e.stap.el.removeClass(e.stap.ac);
                e.stap.el.trigger("_tap");
                e.stap.preventGhostClick(e.stap.startX, e.stap.startY)
                return false;
            } else {}
        },
        enable: function() {
            if (isMobile) {
                e.stap.doc.addEventListener("touchstart", e.stap.tstart,{
                    passive:true
                });
                e.stap.doc.addEventListener("click", e.stap.ghostClickHandler,{
                    passive:true
                })
            }
        },
        preventGhostClick: function(t, n) {
            e.stap.coords.push(t, n);
            window.setTimeout(function() {
                e.stap.coords.splice(0, 2)
            }, 1e3)
        },
        ghostClickHandler: function(t) {
            for (var n = 0, r = e.stap.coords.length; n < r; n += 2) {
                var i = e.stap.coords[n];
                var s = e.stap.coords[n + 1];
                if (Math.abs(t.clientX - i) < 1e3 && Math.abs(t.clientY - s) < 1e3) {
                    t.stopPropagation();
                    t.preventDefault()
                }
            }
        },
        coords: []
    };
    e.stap.enable()
})(jQuery);