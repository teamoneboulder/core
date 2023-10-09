;$.fn.confirm=function(oopts){
    opts=$.extend(true,{
        animate:false,
        text:'',
        loc:'center',
        icon:'icon-help',
        buttons:[{
            btext:'Yes, Delete',
            bclass:'yesbtn'
        },{
            btext:'Cancel',
            bclass:'cancelbtn'
        }],
        bindings:[],
        cb:function(){}
    },oopts);
    opts.bindings.push({
        type:'fn',
        binding:function(ele){
            ele.find('.cancelbtn').stap(function(){
                if(oopts.beforeClose){
                    if(oopts.beforeClose(ele)){
                        $.fn.alert.closeAlert(false,false,true);
                        opts.cb(false,ele)  
                    }
                }else{
                    $.fn.alert.closeAlert(false,false,true);
                    opts.cb(false,ele)
                }
            },1,'tapactive')
            ele.find('.yesbtn').stap(function(){
                if(oopts.beforeClose){
                    if(oopts.beforeClose(ele)){
                        $.fn.alert.closeAlert(false,false,true);
                        opts.cb(true,ele)
                    }
                }else{
                    $.fn.alert.closeAlert(false,false,true);
                    opts.cb(true,ele)
                }
            },1,'tapactive')
        }
    })
    var topts={
        overlay:1,
        closer:false,
        mobilize:1,
        zIndex:100000,
        uid:'deleteconfirm',
        icon:opts.icon,
        buttons:opts.buttons,
        bindings:opts.bindings
    }

    if(oopts.buttons) topts.buttons=oopts.buttons;//stupid merge issue
    if(oopts.text) topts.content='<div style="padding:10px;font-size:16px">'+oopts.text+'</div>';
    if(oopts.content) topts.content=oopts.content;
    if(oopts.loc) topts.loc=oopts.loc;
    if(oopts.template){
        topts.template=oopts.template;
        if(oopts.data) topts.tempdata=oopts.data;
    }
    if(oopts.closer) topts.closer=oopts.closer;
    if(oopts.image) topts.image=oopts.image;
    if(oopts.id) topts.id=oopts.id;
    if(oopts.uid) topts.uid=oopts.uid;
    if(oopts.binding) topts.bindings.push({
        type:'fn',
        binding:oopts.binding
    })
    $('body').alert(topts)
}