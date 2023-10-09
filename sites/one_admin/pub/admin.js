var app={
    v:2,
    header:'https://groot.s3.amazonaws.com/sites/nectar/img/header.png',
    appid:'33ee6d44c844xx9765d9220619ae8c152f',
	init:function(vars){
        $('#wrapper').show();
        $.fn.alert.useTemplate='alert';
        $.fn.alert.noblur=true;//disable blur for alerts
		if(vars) $.each(vars,function(i,v){
            app[i]=v;
        });
		app.uuid=window.uuid;
        app.history=new modules.history({});
        app.home=new modules.admin_home({});
        app.setInterval();
        _bootloader.hidePhotoSplash();
	},
    setInterval:function(){
        setInterval(function(){
            app.updateRelTimes();
        },30000);
    },
    updateRelTimes:function(){
        if($('.reltime').length) $.each($('.reltime'),function(i,v){
            var t=$(v).attr('data-time');
            if(t) $(v).html(t.formatTime(false,1));
        });
    },
    getProcessTime:function(data){
        if(data&&data.info&&data.info.processTime) return data.info.processTime;
        return '';
    },
    stop:function(e){
        if(e){
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
        }
    }
}