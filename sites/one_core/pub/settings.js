var app={
    ver:1,
    appid:'2344d44c84409765d9a5ab39ae8cabcd',//web appid
	init:function(vars){
		if(vars) $.each(vars,function(i,v){
            if(i!='modules') app[i]=v;
        });
        app.store={
            resp:window.emaildata
        }
		app.render();
        $('#wrapper').show();
    },
    render:function(){
    	$('#wrapper').render({
    		append:false,
    		template:'home',
    		data:$.extend(true,{},{store:app.store}),
    		binding:function(ele){
                app.ele=ele;
                ele.find('.x_toggle').stap(function(){
                    app.toggle($(this),$(this).data());
                },1,'tapactive');
                ele.find('.x_save').stap(function(){
                    app.save();
                },1,'tapactive');
                app.doneLoaing();
    			// ele.preload('https://one-light.s3.amazonaws.com/static/background_complex2.jpg',1,function(){
    			// 	app.doneLoaing();
    			// })
    		}
    	})
    },
    save:function(){
        if(!app.store.resp.data.current) return false;
        if(app.saving) return false;
        app.saving=1;
        var cv=app.ele.find('.addsubmit').html();
        app.ele.find('.addsubmit').html('<i class="icon-refresh animate-spin"></i> Saving...');
        modules.api({
            url:app.sapiurl+'/user/updatenotifications',
            data:{
                current:app.store.resp.data.current,
                force_id:app.store.resp.uid,
                force_token:app.store.resp.token
            },
            timeout:5000,
            callback:function(resp){
                app.saving=0;
                if(resp.success){
                     app.ele.find('.addsubmit').html('<i class="icon-thumbs-up"></i> Saved!');
                     setTimeout(function(){
                        app.ele.find('.addsubmit').html(cv);
                     },3000)
                }else{
                    app.ele.find('.addsubmit').html(cv);
                    modules.toast({
                        content:resp.error,
                        remove:2500,
                        icon:'icon-warning-sign'
                    });
                }
            }
        });
    },
    toggle:function(target,data){
        if(!app.store.resp.data.current) app.store.resp.data.current={};
        if(!app.store.resp.data.current[data.type]) app.store.resp.data.current[data.type]={};
        if(typeof app.store.resp.data.current[data.type][data.id]=='undefined') app.store.resp.data.current[data.type][data.id]=1;//init
        if(app.store.resp.data.current[data.type][data.id]){
            $(target).removeClass('checked').addClass('unchecked')
            app.store.resp.data.current[data.type][data.id]=0;
        }else{
            $(target).addClass('checked').removeClass('unchecked')
            app.store.resp.data.current[data.type][data.id]=1;
        }
        //console.log(self.store)
    },
    doneLoaing:function(){
    	$('.page-loader').fadeOut(500,function(){
    		$(this).remove();
    	})
    }
};