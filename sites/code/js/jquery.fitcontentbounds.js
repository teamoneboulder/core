;$.fn.fitContentBounds = function(c){
    this.each(function(i,el){//could be grouping
        var max = parseInt(el.getAttribute("data-max"),10);
        var debug = (el.getAttribute('data-debug')) ? 1 : 0;
        var center = (el.getAttribute('data-center')) ? 1 : 0;
        var height=false;
        if(center) height = el.style.height;
        var min = (el.getAttribute('data-min')) ? parseInt(el.getAttribute('data-min'),10) : 9;
        var incriment = parseInt(el.getAttribute('data-incriment'),10);
        if(!incriment) incriment=1;
       // var debug=true;//force debugging
        var font_size = max;
        if (height) {
            if(debug) console.log("initial sizing", "style height = " + el.clientHeight)
            while (font_size >= min) {
                el.style.fontSize = font_size+"px";
                if(!el.firstChild) return console.warn('wrap the content in a div! <div></div>');
                if (el.firstChild.clientHeight <= height) {
                    if(debug) console.log("breaking loop","font_size = " + font_size, "height = " + height, "style height = " + el.clientHeight);
                    break;
                }
                font_size=font_size-incriment;
                //font_size--;
            }
        } else {
            var width = (el.getAttribute('data-width')) ? parseFloat(el.getAttribute('data-width')) : ($(el).parent().width()-10); //no need to create this var unless it's needed
            el.style.whiteSpace = "nowrap";
            if(debug) console.log("initial sizing", "style width = " + el.clientWidth+' max= '+width)
            while (font_size >= min) {
                el.style.fontSize = font_size+"px";
                if (debug) {
                    console.log(font_size + ' ' + width + ' ' + el.clientWidth, 1);
                }
                if (el.clientWidth <= width) {
                    if(center){
                        var parent=$(el).parent();
                        var h=parent.outerHeight();
                        var p=parseInt(parent.css('padding'),10);
                        var mid=h/2;
                        var t=mid-(font_size/1.5)
                       // var pt=t-p;
                       // console.log(pt);
                        parent.css('paddingTop',t);
                    }
                    if(debug) console.log("breaking loop", "font_size = " + font_size, "width = " + width);
                    break;
                }
                font_size=font_size-incriment;
                //font_size--;
            }
        }
    });
    return this;
};