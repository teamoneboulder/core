modules.hotreload=function(options){
	var self=this;
	self.options=options;
	this.init=function(){
		options.socket.on(options.channel, self.process);
	}
    this.processCode=function(content){
        var fileconf={};
        var map={
          script:'js',
          templates:'templates',
          style:'css'
        }
        for (var key in map){
          var mapto=map[key];
          if(!fileconf[mapto]) fileconf[mapto]='';
          var start=content.search('<'+key+'>');
          if(start>=0){
            var end=content.search('</'+key+'>');
            if(end){
              var code=content.substring(start+('<'+key+'>').length,end);
              if(mapto=='templates'){
                code=code.replace(/(\r\n|\n|\r|\t)/gm,"");
              }
              fileconf[mapto]+=code;
            }
          }
        }
        return fileconf;
    }
	this.process=function(data){
		console.log(data);
        // var skip=['viewmanager.js'];
        // if(skip.indexOf(item)>=0){
        //     return phi.log('Do NOT update this global','file');
        // }
        // if(item=='schema.json'){
        //     app.updateSchema();
        //     return false;
        // }
        // if(app.reloadTimeouts[component]){
        //     return console.warn('already reloading!');
        // }
        // app.reloadTimeouts[component]=setTimeout(function(){
        //     app.reloadTimeouts[component]=false;
        // },1000)
        var cp=data.data.file.split('/');
        var lp=cp[cp.length-1];
        var tp=lp.split('.');
        var component=tp[0];
        var url=options.api+'/'+data.data.file;
        // if(component==data.data.app){
        // 	phi.onHotReload(data.data.app,data.data.app);
        // 	return false;
        // }
        switch(data.data.ext){
        	case 'template':
            case 'templates':
                phi.log(url+' Loading...','file');
                //load via url
                _bootloader.loadUrl({
					url:url,
					timeout:5000,
					error:function(err){
						//show load error!
						_alert('error loading ['+url+'] ['+err+']');
					},
					success:function(resp){
						_bootloader.processTemplates(resp,1);//force overwritting!
						phi.onHotReload(component,data.data.app);
					}
				});
            break;
            case 'js':
                phi.log(url+' Loading...','file');
                var oHead = document.getElementsByTagName('head')[0];
                var oScript = document.createElement('script');
                oScript.type = 'text/javascript';
                oScript.src = url+'?ts='+new Date().getTime();//cache buster
                oScript.async = false;
                oScript.onload = function(){
                    phi.log(data.data.file+' Updated!','file');
                    //do hot reload!
                   	phi.onHotReload(component,data.data.app);
                }
                // IE 6 & 7
                oScript.onreadystatechange = function() {
                    if (this.readyState == 'complete') {
                        phi.log(data.data.file+' Updated!','file');
                    }
                }
                oHead.appendChild(oScript);
            break;
            case 'css':
                phi.log(url+' Loading...','file');
                url+='?ts='+new Date().getTime();//cache bust;
                $('head').append('<link href="'+url+'" rel="stylesheet" type="text/css">');
                phi.log(data.data.file+' Updated!','file');
            break;
            case 'view':
            case 'app':
                _bootloader.loadUrl({
                    url:url,
                    timeout:5000,
                    error:function(err){
                        //show load error!
                        _alert('error loading ['+url+'] ['+err+']');
                    },
                    success:function(resp){
                        //add code!
                        var code=self.processCode(resp);
                        if(code.js) _bootloader.loadSource({type:'js', text:code.js});
                        if(code.css) _bootloader.loadSource({type:'css', text:code.css});
                        if(code.templates) _bootloader.processTemplates(code.templates,1);//force!
                        phi.onHotReload(component,data.data.app);
                    }
                });
            break;
            default:
                phi.log(data.data.file+' ['+data.data.ext+'] Unhandled!','file');
            break;
        }
	}
}