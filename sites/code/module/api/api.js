modules.api=function(topts){
    if(topts.open){
        return window.open(topts.url+'?'+$.param(topts.data),'_self');
    }
    if(topts.loadingmodal&&!topts.loadingmodal.uid){
        topts.loadingmodal.uid=Math.uuid(8);
    }
    var data=(topts.data)?topts.data:{};
    if(!topts.cleanData){
        if(!data.appid) data.appid=app.appid;
        if(!data.token){
            if(app.user&&app.user.token) data.token=app.user.token;
            else if(app.token) data.token=app.token;
            else{
                var temptoken=localStorage.getVar('temporary_token');
                if(!temptoken){
                    var temptoken=Math.uuid(16);
                    localStorage.setVar('temporary_token',temptoken);
                }
                data.token=temptoken;
            }
        }
    }
    if(topts.url.indexOf(app.apiurl2)===0){
        topts.type='GET';
    }
    topts.startTime=new Date().getTime();
    var opts=$.extend(true,{},{
        //dataType:'jsonp',
        type:(topts.type)?topts.type:'POST',
        dataType:((app.debugapi||app.isdev)&&topts.dataType!='json')?'jsonp':'json',
        jsonpCallback: 'jcb_'+Math.uuid(4),
        timeout:8000,
        ele:false,
        onecallback:false,
        data:data,
        key:'',
        precall:function(){},
        error:function(x,status,reason){
            if(topts.key&&app.api_sending[topts.key]) delete app.api_sending[topts.key];
            if(topts.retry&&topts.retry>0){
                topts.retry--;
                if(app.netfail) clearTimeout(app.netfail);
                app.netfail=setTimeout(function(){
                    modules.api(topts);
                },5000);
            }
            if(opts.callback){
            if(reason=='timeout'){
                    if(app.isdev){
                        var err=new Error();
                        opts.callback({error:'Network Timeout',type:'internet',stack:err.stack},topts);
                    }else{
                        opts.callback({error:'Network Timeout',type:'internet'},topts);
                    }
                }else{
                    if(x.readyState===0){
                        var diff=new Date().getTime()-topts.startTime;
                        onerror('Unkonwn API Error: Status ['+diff+'ms]: '+status+ ' xhr: '+JSON.stringify(x));
                        //retry!!!
                        if(!topts.forceRetry){
                            topts.forceRetry=1;
                            modules.api(topts);
                        }else{
                            opts.callback({error:(reason)?reason:'Unknown',status:status},topts,x);
                        }
                    }else{
                        opts.callback({error:(reason)?reason:'Unknown',status:status},topts,x);
                    }
                }
            }else if(reason!='timeout'){
                var diff=new Date().getTime()-topts.startTime;
                //onerror('Unkonwn API Error: Status ['+diff+'ms]: '+status+ ' xhr: '+JSON.stringify(x));
                // if(!topts.forceRetry){
                //     topts.forceRetry=1;
                //     modules.api(topts);
                // }
            }

        },
        success:function(data){
            if(topts.forceRetry){
                //onerror('successful retry of XHR:0 State!!!!');
            }
            if(topts.key&&app.api_sending[topts.key]) delete app.api_sending[topts.key];
            if(topts.btn) topts.btn.removeClass('sending')
            if(topts.callback) opts.callback(data,topts);
        }
    },topts);
    opts.precall();
    if(topts.key){
        if(!app.api_sending[topts.key]){
            app.api_sending[topts.key]=1;
        }else{
            console.warn('Request already happening');
        }
    }
    if(topts.btn) topts.btn.addClass('sending')
    $.ajax(opts);
    return false;
}