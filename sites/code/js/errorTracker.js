window.onerror = function(message, url, lineNumber, column, errorObj,cb) {
    if(message){
        var msg=message;
        if(typeof msg=='object'){
            if(typeof msg.isTrusted=='boolean') return;//prevent {isTrusted:false}
            msg=JSON.stringify(msg);
        }
        if(url) msg+=" in "+url
        if(lineNumber) msg+=" at line "+lineNumber;
        if(column) msg+=' and columun '+column;
        var stack='';
        if(errorObj&&errorObj.stack){
            var stack=errorObj.stack;
        }
        if( msg.indexOf('Script error.')>-1 ) { //annoying and useless error, just log: https://blog.sentry.io/2016/05/17/what-is-script-error
            return;
        }
        if(msg.indexOf('jcb_')>-1){
            return;//dont give jsonp callback errors!
        }
        if(window.app){
            //if(app.isdev&&isPhoneGap()) _alert(msg,false,'ERROR');
            if(typeof msg=='string'){
                if( msg.indexOf('jcb_')>-1 && msg.indexOf('not a function')>-1) return '';//stop logging timed out calls
                var api=(modules.api)?modules.api:app.api;
                var data={
                    token:window.uuid,
                    message:msg,
                    stack:stack,
                    device:(window.device)?{
                        p:window.device.platform,
                        v:window.device.version,
                        m:window.device.model
                    }:'',
                    uid:(app.user&&app.user.profile&&app.user.profile.id)?app.user.profile.id:'',
                    did:(window.udid)?window.udid:'',
                    location:window.location.href
                }
                //add in app version for debugging in cached mode...
                if(window.app_conf&&window.app_conf.version) data.app_version=window.app_conf.version;
                //also add build version
                if(window._bootloader&&_bootloader.publicconf&&_bootloader.publicconf.vars&&_bootloader.publicconf.vars.version&&_bootloader.publicconf.vars.version.app) data.build_version=_bootloader.publicconf.vars.version.app
                api({//always expect having an api...
                    caller:'Store Error Log',
                    url: app.sapiurl+'/jserror', 
                    dataType:'jsonp',
                    data:data,
                    callback:function(data){
                        //passive, send only
                        if(cb) cb();
                    }
                });
            }
        }
    }
};
window.messageTraceData={}
window.messageTrace=function(key,message){
    if(!window.messageTraceData[key]) window.messageTraceData[key]={}
    if(!window.messageTraceData[key].messages) window.messageTraceData[key].messages=[];
    window.messageTraceData[key].messages.push({
        message:message,
        ts:modules.moment.format(new Date().getTime(),'mstime')
    });
    if(window.messageTraceData[key].to) clearTimeout(window.messageTraceData[key].to);
    window.messageTraceData[key].to=setTimeout(function(){
        window.onerror('MessageTrace - '+JSON.stringify({messages:window.messageTraceData[key].messages}));
        delete window.messageTraceData[key];
    },1000);
}
window.debugTrace=function(){
    StackTrace.get().then(function(stack){
        modules.api({//always expect having an api...
            caller:'Store Error Log',
            url: app.sapiurl+'/jserror', 
            data:{
                token:window.uuid,
                message:'Stack Trace',
                stack:stack.toString(),
                uid:(app.user&&app.user.profile&&app.user.profile.id)?app.user.profile.id:'',
                did:(window.udid)?window.udid:''
            },
            callback:function(data){
                //passive, send only
            }
        });
    })
}