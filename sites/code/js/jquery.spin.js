$.fn.spin = function(opts){
    if(opts!==false){
        var color=(opts&&opts.color)?opts.color:'white';
        var bg=(opts&&opts.bg)?1:0;
        var size=(opts&&opts.size)?opts.size:50;
        var box=(opts&&opts.box)?1:0;
        var hs=size/2;
        if(!opts) opts={};
        $(this).data('data-spinopts',{
            fadeOut:(opts.fadeOut)?opts.fadeOut:0
        });
        if(!$(this).find('.rtspin').length){
            if(opts.type=='bars'){
                var icon='<div class="spinner" style="position:absolute;top:50%;left:50%;z-index:1000000;margin-left:0px;margin-top:-20px;color:'+color+'"><div class="loaderbars"></div></div>';
                $(this).append('<div class="rtspinner rtspin">'+icon+'</div>');
            }else{
                if(!box) var icon='<i class="icon-refresh animate-spin spinner" style="position:absolute;top:50%;left:50%;z-index:1000000;margin-left:-'+(hs+8)+'px;margin-top:-'+(hs+3)+'px;font-size:'+size+'px;color:'+color+'"></i>';
                else var icon='<div style="position:absolute;top:50%;left:50%;z-index:1000000;margin-left:-'+(hs+8)+'px;margin-top:-'+(hs+3)+'px;font-size:'+size+'px;color:'+color+';background:rgba(55,55,55,.4);padding:4px;" class="m-corner-all"><i class="icon-refresh animate-spin spinner"></i></div>';
                if(!bg) $(this).append('<span class="rtspinner rtspin">'+icon+'</span>');
                else $(this).append('<div class="sfit rtspin" style="z-index:1000000;background:rgba(55,55,55,.4)"><i class="icon-refresh animate-spin spinner" style="position:absolute;top:50%;left:50%;z-index:1000;margin-left:-'+(hs+8)+'px;margin-top:-'+(hs+3)+'px;font-size:'+size+'px;color:'+color+'"></i></div>');
            }
        }
    }else{
        var opts=$(this).data('data-spinopts');
        if(opts&&opts.fadeOut){
            $(this).children('.rtspin').fadeOut(opts.fadeOut,function(){
                $(this).remove();
            });
        }else{
            $(this).children('.rtspin').remove();
        }
    }
    return $(this);
};