function growl(opts){
    opts=$.extend(true,{},{
        remove:1500,
        progress:false,
        images:[],
        defaultImageSize:'small',
        content:'',
        width:270,
        bindings:[],
        append:true,
        title:'',
        fontColor:'#555',
        icon:'icon-info-circled-alt',
        type:'default',
        typecolors:{
            default:'white',
            warning:'#FFCC00',
            danger:'#B22222',
            error:'#B22222'
        },
        highlightcolor:false,
        closeable:true,
        onClose:function(){}
    },opts);
    if(opts.icon&&opts.icon=='icon-warning-sign') opts.icon='icon-info-circled-alt';
    if(!opts.highlightcolor) opts.highlightcolor=opts.typecolors[opts.type];
    if(!opts.highlightcolor) opts.highlightcolor='white';//default default
    var id=(opts.id)?opts.id:Math.uuid(8);
    var tdata=$.extend(true,{},{uid:Math.uuid(8),template:opts.template},((opts.tempdata)?opts.tempdata:{}));
    tdata._tid=tdata.uid;
    if(opts.template&&$.fn.render.getTemplate(opts.template)) opts.content=$.fn.render.getTemplate(opts.template).render(tdata);
    opts.template='growl';
    var bindings=[{
        type:'fn',
        binding:function(ele){
            if(opts.onClick){
                ele.stap(function(){
                    opts.onClick();
                    if(ele.data('timeout')) clearTimeout(ele.data('timeout'))
                    ele.fadeOut(500,function(){
                        ele.remove();
                    })
                })
            }
            if(opts.link){
                ele.stap(function(){
                    if(ele.data('timeout')) clearTimeout(ele.data('timeout'))
                    ele.fadeOut(500,function(){
                        ele.remove();
                    })
                })
            }
        }
    },{
        type:'click',
        selector:'.x_closer',
        binding:function(e){
            if(opts.onCancel){
                opts.onCancel();
            }else{
                $(this).parents('.growler').fadeOut(500,function(){
                    opts.onClose();
                    $(this).remove();
                })
            }
        }
    }];
    if(opts.bindings) $.each(opts.bindings,function(i,v){
        bindings.push(v);
    })
    var rele=(opts.ele)?opts.ele:$('#growlarea');
    if(opts.ele) delete opts.ele;
    rele.render({
        uid:id,
        append:opts.append,
        template:'growl',
        data:opts,
        bindings:bindings
    })
    var e=rele.find('[data-growl='+id+']');
    if(opts.remove) e.data('timeout',setTimeout(function(){
        e.fadeOut(1000,function(){
            opts.onClose();
            $(this).remove();
        })
    },opts.remove));
    return e;
}