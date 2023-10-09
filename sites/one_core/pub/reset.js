var app={
    ver:1,
    appid:'2344d44c84409765d9a5ab39ae8cabcd',//web appid
	init:function(vars){
		if(vars) $.each(vars,function(i,v){
            if(i!='modules') app[i]=v;
        });
		if(window.resetdata){
			app.renderReset();
		}else{
			app.renderInvalidPage();
		}
        $('#wrapper').show();
    },
    renderReset:function(){
    	$('#wrapper').render({
    		append:false,
    		template:'home',
    		data:$.extend(true,{},{img:'https://one-light.s3.amazonaws.com/static/flatirons_icon.jpg'},window.resetdata),
    		binding:function(ele){
                app.ele=ele;
    			ele.find('#reset').stap(function(){
    				app.reset();
    			},1,'tapactive')
    			ele.find('.prettyinput').find('input').on('keyup',function(e){
                    if($(this).val().length){
                        $(this).parents('.prettyinput').addClass('hasvalue')
                    }else{
                        $(this).parents('.prettyinput').removeClass('hasvalue')
                    }
                    $('#response').html('').hide();
                    if(e.which==13){
                        app.reset();
                    }
                })
                app.doneLoaing();
    			// ele.preload('https://one-light.s3.amazonaws.com/static/background_complex2.jpg',1,function(){
    			// 	app.doneLoaing();
    			// })
    		}
    	})
    },
    reset:function(){
        if(!app.ele.find('#password').val()){
            $('#response').html('Password Required').show();
            return false;
        }
        if(app.ele.find('#password').val()!=app.ele.find('#cpassword').val()){
            $('#response').html('Password Must Match').show();
            return false;
        }
        if(app.sending) return false;
        app.sending=1;
        app.api({
            caller:'Load Token',
            url: app.sapiurl+'/user/resetpw', 
            data:{
                id:window.resetdata.id,
                pw:app.ele.find('#password').val()
            },
            timeout:10000,
            callback:function(data){
                app.sending=0;
                if(data.success){
                    $('#wrapper').render({
                        template:'success',
                        append:false,
                        data:{
                            app_link:data.app_link
                        },
                        binding:function(ele){
                            
                        }
                    })
                    //mobile only, show a link to go to app
                    // $('#response').html('Successfully Reset Password!').show();
                    // if(modules.cookie) modules.cookie.set('loggedin',1,1000000,'/',window._domain);
                    // localStorage.setVar('token',data.token);
                    // setTimeout(function(){
                    //     if(data.redirect) window.location.href=data.redirect;
                    // },100);
                }else{
                    $('#response').html(data.error).show();
                }
            }
        });
    },
    api:function(topts){
    	if(topts.open){
    		return window.open(topts.url+'?'+$.param(topts.data),'_self');
    	}
        if(topts.loadingmodal&&!topts.loadingmodal.uid){
            topts.loadingmodal.uid=Math.uuid(8);
        }
        var data=(topts.data)?topts.data:{};
        if(!data.appid) data.appid=app.appid;
        var opts=$.extend(true,{},{
            //dataType:'jsonp',
            type:'POST',
            dataType:(true)?'jsonp':'json',
            jsonpCallback: 'jcb_'+Math.uuid(4),
            timeout:8000,
            ele:false,
            onecallback:false,
            data:data,
            precall:function(){},
            error:function(x,status,reason){
                if(topts.retry&&topts.retry>0){
                    topts.retry--;
                    if(app.netfail) clearTimeout(app.netfail);
                    app.netfail=setTimeout(function(){
                        app.api(topts);
                    },5000);
                }
                if(opts.callback){
                    if(reason=='timeout') opts.callback({error:'Network Timeout',type:'internet'},topts);
                    else opts.callback({error:reason},topts);
                }

            },
            success:function(data){
                if(topts.btn) topts.btn.removeClass('sending')
                if(topts.callback) opts.callback(data,topts);
            }
        },topts);
        opts.precall();
        $.ajax(opts);
	},
    renderInvalidPage:function(){
    	$('#wrapper').render({
    		append:false,
    		template:'invalid',
    		data:$.extend(true,{},{img:'https://groot.s3.amazonaws.com/sites/nectar/drop_logo.png'}),
    		binding:function(ele){
    			ele.preload('https://one-light.s3.amazonaws.com/static/background_complex2.jpg',1,function(){
    				app.doneLoaing();
    			})
    		}
    	})
    },
    doneLoaing:function(){
    	$('.page-loader').fadeOut(500,function(){
    		$(this).remove();
    	})
    },
    getImg:function(obj,type,forcegroot){
        if(app.nointernet) return app.cdot;
        var s3=(obj.s3)?obj.s3:app.s3;//hack!!!;
        if(forcegroot) s3='https://s3-us-west-2.amazonaws.com/groot';//for mapping stuff
        if(!obj) return '';
        var out='';
        if(typeof obj=='object'){
            if(!obj.path){
                out='https://s3-us-west-2.amazonaws.com/groot/common/earth_user.jpg';
            }else{
                if(type) out=s3+obj.path+'/'+type+'.'+obj.ext;
                else out=s3+obj.path+'/full.'+obj.ext;
            }
        }else{
            if(obj&&obj.indexOf('http://')==-1&&obj.indexOf('https://')==-1&&obj.indexOf('www')==-1) out=s3+obj;
            else if(obj.indexOf(app.s3)>=0) out=obj;
            else{
                if(obj.indexOf('https://')!=-1) out=obj.replace(/ /g,'%20');//allow for remote sites using https
                else out=app.apiurl+'/proxy/image?img='+encodeURIComponent(obj);
            }
        }
        return out;
    }
};