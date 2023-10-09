//hack! remove after next app update!
if(window._bootloader){
    console.log('DYNAMICALLY UPDATING BOOTLOADER!!!')
    window._bootloader.loadFile=function(fileconf,cb,ip_address,retry){
        var self=this;
        if(fileconf.combined){
            var conf=(self.versions&&self.versions.conf&&self.versions.conf[fileconf.key])?self.versions.conf[fileconf.key]:false;
            var hash=(self.versions&&self.versions.hash&&self.versions.hash[fileconf.key])?self.versions.hash[fileconf.key]:false;
            self.log('🔹 fileconf.hash ['+fileconf.hash+'], bootloader.versions.hash.'+fileconf.key+' ['+hash+'], bootloader.versions.conf.'+fileconf.key+' == '+JSON.stringify(conf));
            if(conf&&conf.hash&&conf.hash==fileconf.hash&&conf.hash==hash){//we have file stored locally and we havent incrimented hash
                self.file.get(fileconf.key+'.txt',function(data,err){
                    if(data){
                        //compare length!!! basic check
                        if(conf.filelength==data.length){
                            self.log('✅ [CACHE] Got File ['+fileconf.key+'], load it!');
                            cb(data);
                        }else{
                            self.log('⚠️ File ['+fileconf.key+'.txt'+'] length didnt match!!');
                            //this is immediately retryable, clear our cache and retry via network

                            self.setVersionInfo('clear',{
                                key:fileconf.key
                            },function(success){
                                if(success){
                                    self.log('🔹 Successfully cleared bootloader.versions.conf.'+fileconf.key+' and bootloader.versions.hash.'+fileconf.key);
                                    if(!retry) self.loadFile(fileconf,cb,1);//possibility for endless loop here!!!!! only do once before fail!
                                    else cb(false);
                                }else{
                                    self.log('⚠️ Error clearing bootloader.versions.conf/hash ['+fileconf.key+']');
                                    cb(false);
                                }
                            })
                            // self.store.delete('bootloader.'+fileconf.key,function(success){
                            //  if(success){
                            //      self.loadFile(fileconf,cb);//possibility for endless loop here!!!!! only do once before fail!
                            //  }else{
                            //      self.showErrorScreen('store.delete failed!');
                            //  }
                            // })
                        }
                    }else{
                        self.log('⚠️ Error getting file ['+fileconf.key+'.txt'+'] ['+err+']');
                        //this is immediately retryable, clear our cache and retry via network
                        self.versions.conf[fileconf.key]=false;
                        self.versions.hash[fileconf.key]=false;//clear out local version to force update!
                        self.setVersionInfo('clear',{
                                key:fileconf.key
                            },function(success){
                                if(success){
                                    self.log('🔹 Successfully cleared bootloader.versions.conf.'+fileconf.key+' and bootloader.versions.hash.'+fileconf.key);
                                    if(!retry) self.loadFile(fileconf,cb,1);//possibility for endless loop here!!!!! only do once before fail!
                                    else cb(false);
                                }else{
                                    self.log('⚠️ Error clearing bootloader.versions.conf/hash ['+fileconf.key+']');
                                    cb(false);
                                }
                            })
                        // self.store.delete('bootloader.'+fileconf.key,function(success){
                        //  if(success){
                        //      self.loadFile(fileconf,cb);
                        //  }else{
                        //      self.showErrorScreen('store.delete failed!');
                        //  }
                        // })
                    }
                })
            }else{//we dont have up-to-date code, load via URL
                self.loadUrl({
                    url:fileconf.url,
                    timeout:(fileconf.timeout)?fileconf.timeout:25000,
                    error:function(err){
                        //show load error!
                        self.log('⚠️ [TIMEOUT] loading['+fileconf.url+']');
                        cb(false,err);
                    },
                    success:function(resp){
                        self.log('✅ [NETWORK] Successfully loaded ['+fileconf.key+']');
                        if(fileconf.filelength&&fileconf.filelength!=resp.length){//whoa there 
                            self.log('⚠️ Whoa there, we just recieved a file with a length not what we were expecting.  Dont let it load!');
                            cb(false,'code');
                        }else{
                            cb(resp);
                            //try to cache, this is passive because the rest of the load isnt dependant on this
                            self.file.set(fileconf.key+'.txt',resp,function(saved,err){
                                if(saved){
                                    //once it is cached, set nativeStore with cached info!
                                    self.setVersionInfo('conf',{
                                        key:fileconf.key,
                                        data:{
                                            hash:fileconf.hash,//for checking from server
                                            filelength:resp.length//pre-check on client
                                        }
                                    })
                                }else{
                                    self.log('⚠️ Error saving file ['+fileconf.key+'.txt'+'] ['+err+']');
                                    //passive, if this fails, we should still be able to load alright
                                    //self.submitLog();
                                }
                            })
                        }
                    }
                })
            }
        }else{//dev mode
            self.log('🔹 Load Non-combined file conf ['+fileconf.key+']');
            if(fileconf.code){
                if(fileconf.code.js) self.loadSource({type:'js', text:fileconf.code.js});
                if(fileconf.code.css) self.loadSource({type:'css', text:fileconf.code.css});
                self.processTemplates(fileconf.code.templates);
                self.log('🔹 LOADING ALL DONE!');
                cb(true,false);//in the unlikely event we dont have any js files to load
            }else{
                if(fileconf.urls.font&&fileconf.urls.font.length) fileconf.urls.font.map((src)=>self.loadSource({type:'css', src:((ip_address)?ip_address+'/':'')+src+'?t='+new Date().getTime()}));
                if(fileconf.urls.css&&fileconf.urls.css.length) fileconf.urls.css.map((src)=>self.loadSource({type:'css', src:((ip_address)?ip_address+'/':'')+src+'?t='+new Date().getTime()}));
                if(fileconf.urls.templates&&fileconf.urls.templates.length) fileconf.urls.templates.map((src)=>self.loadSource({type:'template', src:((ip_address)?ip_address+'/':'')+src+'?t='+new Date().getTime()}));
                self.counts[fileconf.key]={
                    total:fileconf.urls.js.length,
                    count:0
                }
                if(fileconf.urls.js&&fileconf.urls.js.length){
                    Promise.all(fileconf.urls.js.map(function(src){
                        self.log('🔹 loading JS: '+((ip_address)?ip_address+'/':'')+src+'?t='+new Date().getTime());
                        return self.loadSource({type:'js', src:((ip_address)?ip_address+'/':'')+src+'?t='+new Date().getTime()}).then(function(){
                        self.counts[fileconf.key].count++;
                        self.log('🔹 finished adding JS ('+self.counts[fileconf.key].count+'/'+self.counts[fileconf.key].total+')- '+src);
                        //self.log('🔹 LOADER: finished adding JS ('+self.counts[fileconf.key].count+'/'+self.counts[fileconf.key].total+')- '+src);
                    })})).then(e=>{
                        self.processTemplates(fileconf.templates);
                        self.log('🔹 LOADING ALL DONE!');
                        cb(true,false);//in the unlikely event we dont have any js files to load
                    }).catch((e)=>function(){
                        console.log(e);
                        self.log('⚠️ Error loading dev file!');
                        cb(false,'timeout');
                    })
                }else{
                    cb(true,false);//in the unlikely event we dont have any js files to load
                }
            }
        }
    }
}else{
    console.log('BOOTLOADER NOT FOUND?!?')
}
if(!window.apps) window.apps={};
if(!window.views) window.views={};
if(!window.routes) window.routes={};
if(!window.dependencies) window.dependencies={};
if(!window.phiStore){
    window.phiStore={
        listeners:{},
        components:{},
        views:{
            pages:[],
            overlays:[],
            home:''
        }
    }
}
window.phi={
    init:function(opts){
        if(opts.app&&apps[opts.app]){
            if(isPhoneGap()) app.starturl=window.location.href;
            app.startpath=window.location.pathname;
            phi.app=phi.register(opts.app,opts.app_options,false,'apps',{}).component;
        }else{
            console.warn('invalid app ['+opts.app+']');
        }
    },
    reset:function(destroy){
        $.each(phiStore.components,function(i,v){
            if(v.component_type!='apps'){//dont stop the root app
                if(!destroy){
                    if(v.component.stop) v.component.stop();
                    else console.warn('no stop for ['+v.component_class+']')
                }else{
                    if(v.component.destroy) v.component.destroy();
                    else console.warn('no stop for ['+v.component_class+']')
                }
            }
        })
        window.phiStore={
            listeners:{},
            components:{},
            views:{
                pages:[],
                overlays:[],
                home:''
            }
        }
    },
    destroyListeners:function(context){
        if(phiStore.listeners[context._uuid]){
            delete phiStore.listeners[context._uuid];
            phi.log('destroy listeners for context ['+context._uuid+']','phi');
        }
    },
    listen:function(context,channel,cb){
        if(!phiStore.listeners[context._uuid]) phiStore.listeners[context._uuid]={}
        phiStore.listeners[context._uuid][channel]=cb;
        //phi.log('set listeners for channel ['+channel+']','phi');
    },
    emit:function(channel,data){
        phi.log('emit to channel ['+channel+']','phi');
        if(_.size(phiStore.listeners)){
            for(var uuid in phiStore.listeners){
                var componentListeners=phiStore.listeners[uuid];
                if(componentListeners[channel]) componentListeners[channel](data);
            }
        }
    },
    getApp:function(){
        return phiStore.components[phiStore.views.home].component;
    },
    getHome:function(){
        return phiStore.components[phiStore.views.home].component;
    },
    refreshHome:function(){
        phi.onHotReload('home');
        //phiStore.components[phiStore.views.home].component.refresh()
    },
    restart:function(restart){
        if(isPhoneGap()) window.location.href=app.starturl;
        else{
            if(restart){
                window.location.href=app.siteurl;
            }else{
                window.location.reload();
            }
        }
    },
    hasView:function(app,component_id){
        if(df(window,'views.'+app+'.'+component_id)) return true;
        return false;
    },
    loadDependencies:function(app,component_id,dependencies){
        if(!window.dependencies[app]) window.dependencies[app]={};
        window.dependencies[app][component_id]=dependencies;
    },
    loadView:function(app,component_id,component){
        phi.app_id=app;
        if(!window.views[app]) window.views[app]={};
        window.views[app][component_id]=component;
    },
    loadRoute:function(app,component_id,route){
        phi.app_id=app;
        if(!window.routes[app]) window.routes[app]={};
        if(window.routes[app][component_id]&&window.routes[app][component_id].destroy){
            window.routes[app][component_id].destroy();
        }else{
            //if(window.routes[app][component_id]) console.warn('invalid destroy for route ['+component_id+']')
        }
        window.routes[app][component_id]=new route();
        if(window.routes[app][component_id].register){
            window.routes[app][component_id].register.call(window.routes[app][component_id]);
        }else{
            //console.warn('invalid register for route ['+component_id+']')
        }
    },
    loadApp:function(app,component){
        window.apps[app]=component;
    },
    registerView:function(component_id,options,store,reload,onReady){
        if(!store) store={};
        var app_id=app.flower_id;
        if(!df(window,'views.'+app_id+'.'+component_id)){
            return console.warn('Invalid view ['+component_id+']')
        }
        var uuid=(options._componentId)?options._componentId:Math.uuid(20);//unique compontent ID
        options._componentId=uuid;//save it so if re-rendering it uses same ID
        if(phiStore.components[options._componentId]&&!reload){
            //preserve Store
            if(phiStore.components[options._componentId].component.store) options.store=$.extend(true,{},phiStore.components[options._componentId].component.store);
            //destroy!
            if(phiStore.components[options._componentId].component.destroy) phiStore.components[options._componentId].component.destroy(1);
        }
        phi.log('✳️ phi.registerView ['+uuid+'] ['+component_id+']');
        phiStore.components[uuid]={
            component:new window.views[app_id][component_id](options),
            component_class:component_id,
            app_id:app_id,
            component_type:'views',
            uuid:uuid
        }
        if(options.showOptions){
            phiStore.components[uuid].component.showOptions=options.showOptions;
        }
        phiStore.components[uuid].component._uuid=uuid;
        phiStore.components[uuid].component._component_class=component_id;
        if(!phiStore.components[uuid].component.store) phiStore.components[uuid].component.store=store;//auto-reg of store
        phiStore.components[uuid].component.options=options;
        phi.ensureDefaults(phiStore.components[uuid].component);
        //returnCallback(phiStore.components[uuid].component,reload);
        phi.startView(app_id,component_id,uuid,options,reload,onReady)
    },
    startView:function(app_id,component_id,uuid,options,reload,onReady){
         phi.timeouts[uuid]=setTimeout(function(){
            $('body').spin({bg:true});//signify something is happneing
            phi.timeouts[uuid+'_fail']=setTimeout(function(){
                phi.failView(app_id,component_id,uuid,options,reload);
            },5000)
        },1000);    
        phi.ensureDependencies(((window.dependencies[app_id]&&window.dependencies[app_id][component_id])?window.dependencies[app_id][component_id]:false),function(){
           // setTimeout(function(){//separate...stupid
            if(phi.timeouts[uuid]) clearTimeout(phi.timeouts[uuid]);
            if(phi.timeouts[uuid+'_fail']) clearTimeout(phi.timeouts[uuid+'_fail']);
            $('body').spin(false);//ensure it is clear if it has been initiated
            phiStore.components[uuid].component.show(reload);
            if(onReady) onReady()
           // },1)
        },function(){
            phi.failView(app_id,component_id,uuid,options,reload);
        })
        if(options.onRegister) options.onRegister(phiStore.components[uuid],reload);
    },
    failView:function(app_id,component_id,uuid,options,reload){
        if(phi.timeouts[uuid]) clearTimeout(phi.timeouts[uuid]);
        if(phi.timeouts[uuid+'_fail']) clearTimeout(phi.timeouts[uuid+'_fail']);
        $('body').spin(false);
        //retry ability!
        $('body').alert({
            content:'<div style="padding:10px;font-size:18px;">Please try again, the internet doest appear to be working well</div>',
            image:false,
            zIndex:1000010,
            icon:'icon-warning-sign',
            closer:false,
            binding:function(ele){
                ele.find('.button1').stap(function(){
                    ele.find('.button1').find('i').addClass('animate-spin');
                    phi.startView(app_id,component_id,uuid,options,reload)
                    setTimeout(function(){
                        $.fn.alert.closeAlert()
                    },400)
                },1,'tapactive')
            },
            buttons:[{
                btext:'<i class="icon-refresh"></i> Retry',
                bclass:'button1'
            }]
        })
    },
    timeouts:{},
    ensureDefaults:function(component){
        for(var key in phi.defaults){
            if(!component[key]){
                //console.log('default ['+key+'] ',phi.defaults[key]);
                if(typeof phi.defaults[key]=='object'){//data objects need to be cloned in
                    //component[key]=phi.defaults[key];
                    if(typeof phi.defaults[key].length!=='undefined'){//array, object
                         component[key]=Object.assign([],phi.defaults[key])
                    }else{
                         component[key]=Object.assign({},phi.defaults[key])
                    }
                }else{//functions copy ok
                    component[key]=phi.defaults[key];
                }
            }
        }
    },
    onResume:function(){
        var current=phi.getCurrentView();

        if(current){
            if(current.component.onResume) current.component.onResume();
            else console.warn('no onResume for component ['+current.component_class+']')
            current.component.trigger('onResume');
        }
        //also notify the current app!
        if(phi.app&&phi.app.onResume) phi.app.onResume();
    },
    onPause:function(){
        var current=phi.getCurrentView();
        if(current){
            if(current.component.onPause) current.component.onPause();
            else console.warn('no onPause event in view');
            current.component.trigger('onPause');
        }
    },
    getUnderView:function(){
        var current='';
        //get the most current view
        //two overlays
        if(phiStore.views.overlays.length&&phiStore.views.overlays[phiStore.views.overlays.length-2]){
            current=phiStore.views.overlays[phiStore.views.overlays.length-1];
        }
        //one overlay and at least 1 page
        if(phiStore.views.overlays.length&&phiStore.views.overlays.length==1&&phiStore.views.pages.length){
            current=phiStore.views.pages[phiStore.views.pages.length-1];
        }
        //no overlays, 2 or more pages
        if(!current&&phiStore.views.pages.length>=2){
            current=phiStore.views.pages[phiStore.views.pages.length-2];
        }
        if(!current&&phiStore.views.home){
            current=phiStore.views.home;//otherwise its the move page
        }
        if(current){
            if(phiStore.components[current]){
                return phiStore.components[current].component;
            }else{
                //console.warn('could not find view ['+current+'], it may have been deleted');
                current=false;
            }
        }else{
            phi.log('ℹ️ could not find current under view');
        }
        return current;
    },
    getMinimizedView:function(){
        return phiStore.minimizedEle;
    },
    getPreviousView:function(page_only){
        var current='';
        var last='';
        //get the most current view
        if(phiStore.views.overlays.length){
            current=phiStore.views.overlays[phiStore.views.overlays.length-1];
            if(current&&!last&&phiStore.views.overlays[phiStore.views.overlays.length-2]){
                last=phiStore.views.overlays[phiStore.views.overlays.length-2];
            }
        }
        if(current&&!last&&phiStore.views.pages[phiStore.views.pages.length-1]){
            last=phiStore.views.pages[phiStore.views.pages.length-1];
        }
        if(!current&&phiStore.views.pages.length){
            current=phiStore.views.pages[phiStore.views.pages.length-1];
            if(current&&!last&&phiStore.views.pages[phiStore.views.pages.length-2]){
                last=phiStore.views.pages[phiStore.views.pages.length-2]
            }
        }
        if(page_only) return phiStore.components[last];
        if(!last&&phiStore.views.home){
            last=phiStore.views.home;
        }
        if(last){
            if(phiStore.components[last]){
                return phiStore.components[last];
            }else{
                //console.warn('could not find view ['+last+'], it may have been deleted');
                last=false;
            }
        }else{
            console.warn('could not find last view');
        }
        return last;
    },
    getCurrentView:function(page_only){
        var current='';
        //get the most current view
        if(phiStore.views.overlays.length){
            current=phiStore.views.overlays[phiStore.views.overlays.length-1];
        }
        if(!current&&phiStore.views.pages.length){
            current=phiStore.views.pages[phiStore.views.pages.length-1];
        }
        if(page_only) return phiStore.components[current];
        if(!current&&phiStore.views.home){
            current=phiStore.views.home;
        }
        if(phiStore.components[current]&&phiStore.components[current].component.getCurrentView&&phiStore.components[current].component.getCurrentView()){
            current=phiStore.components[current].component.getCurrentView();
        }
        if(current){
            if(phiStore.components[current]){
                return phiStore.components[current];
            }else{
                //console.warn('could not find view ['+current+'], it may have been deleted');
                current=false;
            }
        }else{
            console.warn('could not find current view');
        }
        return current;
    },
    ensureCurrentView:function(removePageUUID){
        if(removePageUUID){
            if(phiStore.views.overlays.indexOf(removePageUUID)>=0){
                phiStore.views.overlays.splice(phiStore.views.overlays.indexOf(removePageUUID),1);
            } 
            if(phiStore.views.pages.indexOf(removePageUUID)>=0){
                phiStore.views.pages.splice(phiStore.views.pages.indexOf(removePageUUID),1);
            } 
        }
        var current=phi.getCurrentView();
        if(current){
            if(current.component.start) current.component.start();
            //else console.warn('no start for component ['+current.component_class+']');
            if(current.component.setRoute) current.component.setRoute();
            //else console.warn('no setRoute for component ['+current.component_class+']');
            if(current.component.onResume) current.component.onResume();
            //else console.warn('no onResume for component ['+current.component_class+']');
            phi.setStatusBar(current.component);
            // if(current.component.onResume) current.component.onResume();
            // else console.warn('no onResume for component ['+current.component_class+']')
        }
        if(phiStore.appCover){
            if(phiStore.views.pages.length==0&&phiStore.views.overlays.length==0){
                phiStore.appCover.hide();
            }else{//
                //reset to new z-index
                TweenLite.set(phiStore.appCover[0], {opacity:1,zIndex:current.component.getPageZindex(1)});
            }
        }
    },
    setStatusBar:function(component){
        if(!window.phone||!isPhoneGap()) return false;
        if(component.showOptions.statusBar){
            phone.statusBar.set(component.showOptions.statusBar);
            phone.statusBar.show();
        }else if(component.getStatusBar){
            phone.statusBar.set(component.getStatusBar());
            phone.statusBar.show();
        }else if(component.showOptions.statusBar===false){
            phone.statusBar.hide();
        }else{
            phone.statusBar.set('dark');
            phone.statusBar.show();
        }
    },
    destroyCurrentPage:function(){
        var current=phi.getCurrentView();
        if(current&&current.component_class!='home'){
            current.component.destroy();
        }
    },
    goTo:function(e){
        var isevent=false;
        if(e.reload){
            return false;
        }
        if(!e.intent&&!e.length){
            if($(this).attr('href')){
                var o={
                    intent:$(this).attr('href'),
                    type:'external'
                }
            }else{
                var o={
                    intent:$(this).attr('data-intent'),
                    type:$(this).attr('data-type'),
                    opts:$(this).attr('data-opts'),
                    title:$(this).attr('data-title')
                }
            }
            isevent=true;
        }else if(!e.length) o=e;
        else {
            var o={
                intent:e.attr('data-intent'),
                type:e.attr('data-type'),
                opts:e.attr('data-opts'),
                title:e.attr('data-title')
            }
        }
        // var link=app.unwrapExternalLink(o.intent);
        // if((link.indexOf(app.domain)>=0||link.indexOf('https://nectar.earth')>=0)&&link.length>app.domain.length){
        //     if(o.type=='external'&&false){
        //         window.open(o.intent,'_blank');
        //     }else{
        //         var path=link.replace(app.domain,'').replace('https://nectar.earth','');
        //         var pp=path.split('/');
        //         var separate=['callouts','android_install','oauth_return.php','invite','o','i'];
        //         var allowExternal=false;
        //         $.each(separate,function(i,v){
        //             if(path.indexOf(v)==1) allowExternal=true;
        //         })
        //         if(allowExternal){

        //         }else{//internal
        //             app.history.setPage({
        //                 intent:path
        //             });
        //             return false;
        //         }
        //     }
        // }
        if(o.intent.indexOf('https://')===0&&!o.type) o.type='external';
        if(!o.intent) return false;
        if(o.type=='self'){
            if(isPhoneGap()){
                window.open(o.intent,'_system');
            }else window.open(o.intent,'_self')
        }else if(o.type=='external'){
            if(isPhoneGap()){
                if(o.intent.indexOf('mailto:')>=0){
                    var link=o.intent.replace('mailto:','');
                    //try to get subject
                    linkinfo=link.split('?');
                    var to=linkinfo[0];
                    var subject='';
                    if(qs&&qs['subject']) subject=qs['subject'];
                    // app.sendEmail({
                    //     to:[to],
                    //     subject:subject
                    // })
                }else{
                    //hide Status Bar
                    //var color=app.themeColor;
                    var tc=new tinycolor('#1d3a88');
                    var color=tc.darken(5).toString();
                    //iterate over events and "register"
                    var events={
                        opened:[],
                        load:[],
                        closed:[]
                    }
                    events.closed.push(function(){
                        setTimeout(function(){
                            if(phone.device=='iOS'){
                                _.openLink({
                                    intent:'https://app.oneboulder.one/blank.html',
                                    hidden:true
                                })
                            }
                        },50);
                        phone.statusBar.set();//back to deafult
                    })
                    if(e.authCallback){
                        phi.applinkreturn=function(t){
                            phone.statusBar.set();//back to default theme
                            e.authCallback(t);
                        }
                    }
                    var opts={}
                    if(color.indexOf('#')!==0) color='#'+color;
                    if(phone.device=='iOS'){
                        opts={
                            url: o.intent,
                            hidden: false, // default false. You can use this to load cookies etc in the background (see issue #1 for details).
                            animated: true, // default true, note that 'hide' will reuse this preference (the 'Done' button will always animate though)
                            transition: 'slide', // (this only works in iOS 9.1/9.2 and lower) unless animated is false you can choose from: curl, flip, fade, slide (default)
                            enterReaderModeIfAvailable: false, // default false
                           // tintColor: color, // default is ios blue
                            barColor: color, // on iOS 10+ you can change the background color as well
                            controlTintColor: "#FFFFFF" // on iOS 10+ you can override the default tintColor
                          }
                    }
                    if(o.hidden) opts.hidden=true;
                    if(phone.device=='Android'){
                        opts={
                            url:o.intent,
                            toolbarColor:color,
                            animated:false
                        }
                    }
                    if(!o.hidden) phone.statusBar.set('light');
                    phi.browserShowing=true;
                    SafariViewController.show(opts,
                      // this success handler will be invoked for the lifecycle events 'opened', 'loaded' and 'closed'
                      function(result) {
                        //onerror('event:'+result.event)
                        if (result.event == 'opened') {
                            if(events.opened.length){
                              $.each(events.opened,function(i,v){
                                v();
                              })
                            }
                        } else if (result.event == 'loaded') {
                            if(events.load.length){
                              $.each(events.load,function(i,v){
                                v();
                              })
                            }
                        } else if (result.event == 'closed') {
                            phi.browserShowing=false;
                            if(events.closed.length){
                              $.each(events.closed,function(i,v){
                                v();
                              });
                              //set to blank page to clear out any
                              // app.openLink({
                              //   intent:'https://google.com'
                              // })
                          }
                        }
                      },
                      function(msg) {
                        phi.browserShowing=false;
                        _alert(msg)
                      })
                }
            }else{
                window.open(o.intent,'_blank');
            }
        }
    },
    onKeyboardWillShow:function(){
        //hide menu nav!
        $('#mainmenunav').data('hidden',1).hide();
    },
    onKeyboardWillHide:function(){
        var c=phi.getCurrentView()
        if(c&&c.component.setMenuBottom){
            if(c.component.showOptions.display=='page_overlay'){
                $('#mainmenunav').data('hidden',1).hide()
            }else{
                $('#mainmenunav').data('hidden',0).show()
                c.component.setMenuBottom();
            }
        }else{
            $('#mainmenunav').data('hidden',0).show()
        }  
    },
    onKeyboardDidHide:function(){
    },
    onKeyboardDidShow:function(){

    },
    isDependencyAvailable:function(v){
        if(phi.dependencyList[v]) return true;
        return false;
    },
    dependencyList:{},
    ensureDependencies:function(dependencies,cb,fcb){
        if(!phi.id) phi.id=Math.uuid(4);
        if(dependencies&&dependencies.length){
           // onerror('['+phi.id+'] ensureDependencies ['+dependencies.join(', ')+']')
            phi.loadDependencyCode(dependencies,function(success){
              //  onerror('['+phi.id+'] dependencies loaded ['+success+'] ['+dependencies.join(', ')+']')
                if(success) cb()
                else{
                    var logs=[];
                    $.each(dependencies,function(i,v){
                        if(!phi.isDependencyAvailable(v)){
                            logs.push('['+phi.id+'] Dependency ['+v+'] not loaded!');
                        }
                    })
                    onerror(logs,false,false,false,false,false);
                    //_bootloader.submitLog();
                    fcb();
                }
            });
        }else{
            if(cb) cb();
        }
    },
    loadCodeTimeout:{},
    loadDependencyCode:function(dependencies,cb){
        var load=[];
        var url_load=[];
        var regular_loaded=0;
        console.log(dependencies)
        $.each(dependencies,function(i,v){
            if(v.indexOf('http')>=0){
                console.log('load as normal script!')
                var head = document.getElementsByTagName('head')[0];
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = v;
                url_load.push(v);
                script.onload=function(){
                    phi.dependencyList[v]=1;
                    url_load.splice(url_load.indexOf(v),1);
                    if(regular_loaded){
                        var c=0;
                        $.each(dependencies,function(i,v){
                            if(!phi.isDependencyAvailable(v)) c++;
                        })
                        console.log('✅ dependencies processed.  ['+(load.length-c)+'/'+load.length+'] items!');
                        if(c) cb(false)
                        else cb(true);
                    }
                }
                head.appendChild(script);
            }else if(!phi.isDependencyAvailable(v)){
                if(!_bootloader.publicconf.combined){//we will load from the server
                    load.push(async.apply(function(v,callback){
                        _bootloader.addConf({
                            key:v,
                            combined:1,
                            url:app.sapiurl+'/code/'+v,
                            timeout:5000,
                            type:'dna'
                        },false,function(success){
                            if(success) phi.dependencyList[v]=1;
                            callback();
                        });
                    },v))
                }else{//we will load from AWS based on current published version. need to check current local cache version
                    var name=v.replace('module/','');
                    if(app.modules[name]){
                        load.push(async.apply(function(name,v,callback){
                            phi.loadCodeTimeout[name]=setTimeout(function(){//hack because addConf old bootloader doesnt currently have a timeout!
                                callback();//fail callback!
                            },6000);
                            _bootloader.addConf({
                                key:'module_'+name,
                                combined:1,
                                url:app.s3+'/source/'+app.env+'/module/'+name+'/'+app.modules[name].version+'/'+name+'.dna',
                                hash:app.modules[name].hash,
                                timeout:5000,
                                type:'dna'
                            },false,function(success){
                                if(phi.loadCodeTimeout[name]) clearTimeout(phi.loadCodeTimeout[name]);
                                if(success){
                                    phi.dependencyList[v]=1;
                                    callback();
                                }else{//ensure bootloader clears cache!!!
                                    var key='module_'+name;
                                    _bootloader.setVersionInfo('clear',{
                                        key:key
                                    },function(success){
                                        if(success) _bootloader.log('🔹 Successfully cleared bootloader.versions.conf.'+key+' and bootloader.versions.hash.'+key);
                                        else _bootloader.log('⚠️ Error clearing bootloader.versions.conf/hash ['+key+']');
                                        callback();
                                    })
                                }
                            });
                        },name,v))
                    }else{
                        console.warn('['+name+'] not in module directory')
                    }
                }
            }else{
                console.log('dependency ['+v+'] already available');
            }
        })
        if(load.length){
            async.parallel(load,function(){
                //check!
                if(url_load.length==0){
                    var c=0;
                    $.each(dependencies,function(i,v){
                        if(!phi.isDependencyAvailable(v)) c++;
                    })
                    console.log('✅ dependencies processed.  ['+(load.length-c)+'/'+load.length+'] items!');
                    if(c) cb(false)
                    else cb(true);
                    regular_loaded=1;
                }
                //check to ensure they have loaded!
            })
        }else{
            console.log('✅ Dependencies already up-to-date');
            cb(true);
        }
    }, 
    defaults:{
        getRenderOptions:function(reload){
            var opts=this.renderOptions;
            if(!this.showOptions){
                this.showOptions={
                    display:'inline'
                }
            }
            if(!opts.data) opts.data={};
            opts.display=this.showOptions.display;
            if(!opts.context) opts.context=this;
            //if(opts.getData) opts.data=$.extend(true,{},opts.data,opts.getData.call(this));
            return opts;
        },
        start:function(){
            phi.log('▶️ Start View ['+this._component_class+'] ['+this._uuid+']','phi');
            this._active=1;
            if(this.onStart) this.onStart();
            this.trigger('start');
            this.trigger('onStart');
        },
        stop:function(goToShowOptions){
            if(this.showOptions.disableStop) return false;
            this._active=0;
            phi.log('⏹ Stop View ['+this._component_class+'] ['+this._uuid+']','phi');
            if(goToShowOptions){
                if(goToShowOptions&&!goToShowOptions.display){//only do this if it is an immediate show, not animated...
                    this.hide()
                }else{
                    if(this.onStop) this.onStop();
                }
            }else{
                if(this.onStop) this.onStop();
            }
            this.trigger('stop');
            this.trigger('onStop');
        },
        getStatusBar:function(){
            if(this.options.statusBar) return this.options.statusBar;
            if(this.options.data&&this.options.data.statusBar) return this.options.data.statusBar;
            return 'dark'
        },  
        render:function(reload){
            if(reload) this.trigger('destroy');
            if(this.destroyed) return console.warn('component destroyed, dont render')
            if(this.ele) this.ele.remove();
            if(this.renderOptions){
                if(this.options.renderTo||this.renderOptions.getRenderTo){
                    phi.render((this.renderOptions.getRenderTo)?this.renderOptions.getRenderTo():this.options.renderTo,this.getRenderOptions(reload));
                    if(this.onRender) this.onRender();
                    if(this.getPageZindex()){
                        TweenLite.set(this.ele, {zIndex:this.getPageZindex()});
                        if(this.showOptions.display=='page'||this.showOptions.display=='page_overlay'){
                            if(this.showOptions.hideAppCover){
                                if(phiStore.appCover) phiStore.appCover.hide();
                            }else{
                                if(!phiStore.appCover){
                                    //(this.renderOptions.getRenderTo)?this.renderOptions.getRenderTo():this.options.renderTo
                                    phiStore.appCover=phi.render($('#wrapper')[0],{//always put it over main content
                                        template:'phi_appcover',
                                        append:true
                                    })
                                }
                                phiStore.appCover.show();
                                TweenLite.set(phiStore.appCover[0], {zIndex:this.getPageZindex(1)});
                            }
                        }
                    }
                    if(this.store._minimized){
                        this.renderMinimized();
                        if(this.showOptions.display=='page_overlay'){
                            TweenLite.set(this.ele, {y: '100%'});
                        }
                    }
                }else{
                    console.warn('no renderTo passed in options');
                }
            }else{
                console.warn('no render options')
            }
        },
        defaultBottomHeight:10,
        getBottomHeight:function(){
            return this.defaultBottomHeight;
        },
        setMenuBottom:function(height){
            if(window.app&&app.appLayout){
                if(this.destroyed) return false;
                //if($('#mainmenunav').data('hidden')) return false;
                //if(!height&&this.getBottomHeight) height=this.getBottomHeight();
                if(!height) height=this.defaultBottomHeight;
                if(this.keyboard&&this.keyboard.currentContentHeight){
                    height=(this.keyboard.currentContentHeight+20)+'px';
                }
                if(phiStore.minimizedEle){
                    height=(parseInt(height,10)+parseInt($(phiStore.minimizedEle).outerHeight(),10)+10)+'px'
                }
                if(height) TweenLite.to($('#mainmenunav')[0],.2,{bottom:height})
            }
            //$('#mainmenunav').css('bottom',height+'px');
        },
        getPageData:function(cb){//default for pages, use override
            if(app.isdev&&false) console.warn('Add in a custom this.getPageData to load information while the page is showing!')
            cb();
        },
        getPageZindex:function(cover){
            if(this.options._zIndex){
                if(cover) return this.options._zIndex-1;
                return this.options._zIndex;
            }
            var zIndex=0;
            if(this.showOptions.display=='page'){
                zIndex=10+(phiStore.views.pages.length)*2;
            }
            if(this.showOptions.display=='page_web'){
                zIndex=10+(phiStore.views.pages.length)*2;
            }
            if(this.showOptions.display=='page_overlay'||this.showOptions.display=='page_overlay_web'){
                zIndex=100+(phiStore.views.overlays.length)*2;
            }
            phi.log('set zIndex: '+zIndex,'phi');
            this.options._zIndex=zIndex;
            return zIndex;
        },
        animatePageOverlay:function(cb){
            phi.animating=true;
            TweenLite.set(this.ele, {y: '100%',zIndex:this.getPageZindex(),width:'100%',height:'100%'});
            if(!this.showOptions.hideAppCover){
                TweenLite.set(phiStore.appCover, {opacity:0});
                TweenLite.to(phiStore.appCover,.3,{opacity:1});
                phiStore.appCover.show();
            }
            TweenLite.to(this.ele, (this.showOptions.displayTime)?this.showOptions.displayTime:.3,{ y: '0%',onComplete:function(){
                phi.animating=false;
                cb();
            }});
        },
        animateWebPageOverlay:function(cb){
            phi.animating=true;
            TweenLite.set(this.ele,{background:'rgba(55,55,55,0)',zIndex:this.getPageZindex()});
            TweenLite.set(this.ele.find('.webpagecontainer'), {y: '100%'});
            TweenLite.to(this.ele,(this.showOptions.displayTime)?this.showOptions.displayTime:.3,{zIndex:this.getPageZindex(),background:'rgba(55,55,55,.4)'});
            TweenLite.to(this.ele.find('.webpagecontainer'), (this.showOptions.displayTime)?this.showOptions.displayTime:.3,{ y: '0%',onComplete:function(){
                phi.animating=false;
                cb();
            }});
        },
        animatePage:function(cb){
            phi.animating=true;
            TweenLite.set(this.ele, {x: '100%',zIndex:this.getPageZindex()});
            TweenLite.set(phiStore.appCover, {opacity:0});
            if(phi.getUnderView()) TweenLite.to(phi.getUnderView().ele,.3,{x:'-30%'});
            TweenLite.to(phiStore.appCover,.3,{opacity:1});
            TweenLite.to(this.ele, (this.showOptions.displayTime)?this.showOptions.displayTime:.3,{ x: '0%',onComplete:function(){
                phi.animating=false;
                cb();
            }});
        },
        setX:function(x){
            TweenLite.set(this.ele, {x: x});
            //also do the cover too ; )
            TweenLite.set(phi.getUnderView().ele,{x:'-'+(30-(x/document.body.clientWidth)*30)+'%'})
        },
        trigger:function(event,options){
            if(this._events[event]&&this._events[event].length){
                for (var i = 0; i < this._events[event].length; i++) {
                    this.events[event][i](options);
                }
            }
            this.componentEvent(event,options);
        },
        _events:{
        },
        on:function(event,func){
            if(!this.events[event]) this._events[event]=[];
            this.events[event].push(func);
        },
        _components:[],
        componentEvent:function(event,options){
            var destroy=[]
            // console.log('['+this._uuid+'] event: '+event,$.extend(true,{},this._components),this)
            // console.log($.extend(true,{},this))
            // console.trace()
            if(this._components.length) for (var i = 0; i < this._components.length; i++) {
                var comp=this._components[i];
                if(comp.instance&&comp.instance[event]){
                    comp.instance[event](options);
                }else{
                    console.warn('no ['+event+'] for component modules.'+comp.type);
                }
                if(event=='destroy'){//remove it!
                    destroy.push(i);
                }
            }
            if(destroy.length) for (var i = destroy.length - 1; i >= 0; i--) {
                //console.log('remove ['+destroy[i]+'] from ['+this._uuid+']')
                this._components.splice(destroy[i],1);
            }
        },
        registerComponent:function(type,instance){
            //console.log('register component '+this._uuid+' type: '+type)
            this._components.push({
                type:type,
                instance:instance
            })
            return instance;
        },
        goBack:function(cb,forceClose){
            if(forceClose) this.forceClose=forceClose;
            if(modules.keyboard_global) modules.keyboard_global.hide()
            this.goBackCb=cb;
            if(this.onBack) this.onBack();
            if(this.options.onBack) this.options.onBack();
            this.closingPage=true;
            if(!phiStore.views.home){
                setTimeout(function(){
                    phi.registerView('home',{
                        renderTo:$('#wrapper')[0]
                    })
                },10);
            }
            if(this.showOptions){
                //console.log(this.showOptions.display)
                //the cover should now be fixing any issues with clicking delay
                switch(this.showOptions.display){
                    case 'page':
                        setTimeout(this.animatePageBack.bind(this),10)
                    break;
                    case 'page_overlay':
                        setTimeout(this.animatePageBackOverlay.bind(this),10)
                    break;
                    case 'page_overlay_web':
                        setTimeout(this.animateWebPageBackOverlay.bind(this),10)
                    break;
                    default:

                    break;
                }
            } 
        },
        animatePageBack:function(){
            phi.log('🔙 Animate Page Back','phi');
            if(this.onBeforeHide) this.onBeforeHide();
            if(this.options.onBeforeHide) this.options.onBeforeHide()
            if(this.onBeforePageHide) this.onBeforePageHide();
            phi.animating=true;
            TweenLite.to(phiStore.appCover,.3,{opacity:0});
            TweenLite.to(phi.getUnderView().ele,.3,{x:'0%'});
            TweenLite.to(this.ele, (this.showOptions.displayTime)?this.showOptions.displayTime:.3,{ x: '100%',onComplete:this.destroy.bind(this)});
        },
        animatePageBackOverlay:function(){
            phi.log('🔙 Animate Page Back','phi');
            if(this.onBeforeHide) this.onBeforeHide();
            if(this.options.onBeforeHide) this.options.onBeforeHide()
            if(this.onBeforePageHide) this.onBeforePageHide();
            phi.animating=true;
            TweenLite.to(phiStore.appCover,.3,{opacity:0});
            if(this.minimizeOptions&&!this.forceClose){
                TweenLite.to(this.ele, (this.showOptions.displayTime)?this.showOptions.displayTime:.3,{y: '100%',onComplete:this.minimize.bind(this)});
            }else{
                TweenLite.to(this.ele, (this.showOptions.displayTime)?this.showOptions.displayTime:.3,{y: '100%',onComplete:this.destroy.bind(this)});
            }
        },
        animateWebPageBackOverlay:function(){
            phi.log('🔙 Animate Page Back','phi');
            if(this.onBeforeHide) this.onBeforeHide();
            if(this.options.onBeforeHide) this.options.onBeforeHide()
            if(this.onBeforePageHide) this.onBeforePageHide();
            phi.animating=true;
            TweenLite.to(this.ele,(this.showOptions.displayTime)?this.showOptions.displayTime:.3,{background:'rgba(55,55,55,0)'});
            TweenLite.to(this.ele.find('.webpagecontainer'), (this.showOptions.displayTime)?this.showOptions.displayTime:.3,{y: '100%',onComplete:this.destroy.bind(this)});
        },
        renderMinimized:function(){
            phi.render($('body'),{
                template:this.minimizeOptions.template,
                append:true,
                context:this,
                contextElement:'minimizedEle',
                data:(this.minimizeOptions.getData)?this.minimizeOptions.getData():{}
            });
            phiStore.minimizedEle=this.minimizedEle;
            TweenLite.set(this.minimizedEle,{y:$(this.minimizedEle).height()+'px'});
            var h=$(this.minimizedEle).height();
            var c=phi.getPreviousView()
            if(c&&c.component.setMenuBottom){
                if(c.component.showOptions.display=='page_overlay'){
                    $('#mainmenunav').data('hidden',1).hide()
                }else{
                    $('#mainmenunav').data('hidden',0).show()
                    c.component.setMenuBottom();
                }
            }else{
                $('#mainmenunav').data('hidden',0).show()
            }         
            TweenLite.to($('#wrapper'),.3,{bottom:h+'px',onComplete:function(){
                     
            }});
            TweenLite.to(this.minimizedEle,.3,{y:0+'px'});
        },
        minimize:function(){
            //render the minimized view!
            //alert('redner minimized')
            $('body').addClass('hasMinimized');
            this.store._minimized=true;
            phi.animating=false;
            this.closingPage=false;
            if(!this.minimizeOptions.template){
                console.warn('minimized template not found!');
                this.destroy();
                return false;
            }
            this.renderMinimized();
            if(phiStore.appCover) phiStore.appCover.hide();
            //remove from phiStore
            switch(this.showOptions.display){
                case 'page_overlay':
                    phiStore.views.overlays.splice(phiStore.views.overlays.indexOf(this._uuid),1);
                break;
            }
        },
        restoreMinimized:function(){
            //add back to phiStore
            this.store._minimized=false;
            $('body').removeClass('hasMinimized');
            switch(this.showOptions.display){
                case 'page_overlay':
                    TweenLite.set($('#wrapper'),{bottom:'0px'});
                    this.minimizedEle.remove();
                    this.minimizedEle=false;
                    phiStore.minimizedEle=false;
                    phiStore.views.overlays.push(this._uuid);
                    var c=phi.getCurrentView()
                    if(c&&c.component.setMenuBottom){
                        if(c.component.showOptions.display=='page_overlay'){
                            $('#mainmenunav').data('hidden',1).hide()
                        }else{
                            $('#mainmenunav').data('hidden',0).show()
                            c.component.setMenuBottom();
                        }
                    }else{
                        $('#mainmenunav').data('hidden',0).show()
                    }    
                    this.animatePageOverlay.call(this,function(){
                    })
                break;
            }
        },
        exitMinimizedView:function(){
            $('body').removeClass('hasMinimized');
            this.minimizedEle.remove();
            phiStore.minimizedEle=false;
            var c=phi.getCurrentView()
            if(c&&c.component.setMenuBottom){
                if(c.component.showOptions.display=='page_overlay'){
                    $('#mainmenunav').data('hidden',1).hide()
                }else{
                    $('#mainmenunav').data('hidden',0).show()
                    c.component.setMenuBottom();
                }
            }else{
                $('#mainmenunav').data('hidden',0).show()
            }        
            TweenLite.to($('#wrapper'),.3,{bottom:0});
            this.destroy();
        },
        onViewReady:function(){

        },
        listeners:{}, 
        show:function(reloaded,passive){
            //get current page
            var current=phi.getCurrentView();
            if(current&&!reloaded&&!passive){
                if(current.uuid!=this._uuid){
                    if(current.uuid!=phiStore.views.home){
                        if(_.isWebLayout()){
                            if(this.showOptions.display&&this.showOptions.display!='page_overlay_web'){
                                if(!current.component.showOptions.home) current.component.destroy();
                                if(current.component.showOptions.home&&!this.showOptions.home) current.component.hide();
                            }
                        }else{//mobile page handleing
                            if(current.component.stop) current.component.stop(this.showOptions);
                            else console.warn('no stop for component ['+current.component_class+']')
                        }
                    }
                }
            }
            if(this.options._forceShowOpts){
                this.showOptions=this.options._forceShowOpts;
            }
            if(this.ele&&!reloaded){//already exists!
                phi.log('View ['+this._uuid+'] already exists, just show it!','phi');
                //trace
                if(!this.store.hidden){
                    return this.refresh();
                }
                this.store.hidden=false;
                this.ele.show();
                this.start();
                if(this.onShow) this.onShow();
                if(this.setRoute) this.setRoute();
                return false;
            }
            if(this.closingPage||this.destroyed){
                return phi.log('⚠️ Page is closing or destroyed, dont re-render','log')
            }
            if(this.onInit&&!reloaded){
                if(this.onInit()===false){
                    this.destroy();
                    return false;
                }
            }
            this._active=true;
            if(this.showOptions){//page!
                if(this.showOptions.display=='page'){
                    //subpage logic
                    if(reloaded){
                        phi.render(this.options.renderTo,this.getRenderOptions());
                        if(this.onRender) this.onRender(this.ele);
                        if(this.onBeforeShow) this.onBeforeShow(this.ele);
                        TweenLite.set(this.ele, {zIndex:this.getPageZindex()});
                        if(this.onViewReady) this.onViewReady();
                        if(this.options.onViewReady) this.options.onViewReady();
                        if(this.onPageReady) this.onPageReady();
                    }else{
                        phiStore.views.pages.push(this._uuid);
                        this.render();
                        if(this.onBeforeShow) this.onBeforeShow(this.ele);
                        async.parallel([this.animatePage.bind(this),this.getPageData.bind(this)],(function(){
                            if(this.showOptions.renderOnViewReady) this.refresh();
                            if(this.onShow) this.onShow();
                            if(this.onViewReady) this.onViewReady();
                            if(this.options.onViewReady) this.options.onViewReady();
                            if(this.onPageReady) this.onPageReady();
                        }).bind(this));
                    }
                   this.updateStatusBar();
                }else if(this.showOptions.display=='page_overlay'){
                    //subpage logic
                    if(reloaded){
                        this.render();
                        if(this.onBeforeShow) this.onBeforeShow(this.ele);
                        TweenLite.set(this.ele, {zIndex:this.getPageZindex()});
                        if(this.onViewReady) this.onViewReady();
                        if(this.options.onViewReady) this.options.onViewReady();
                        if(this.onPageReady) this.onPageReady();
                    }else{
                        phiStore.views.overlays.push(this._uuid);
                        this.render();
                        if(this.onBeforeShow) this.onBeforeShow(this.ele);
                        async.parallel([this.animatePageOverlay.bind(this),this.getPageData.bind(this)],(function(){
                            if(this.showOptions.renderOnViewReady) this.refresh();
                            if(this.onShow) this.onShow();
                            if(this.onViewReady) this.onViewReady();
                            if(this.options.onViewReady) this.options.onViewReady();
                            if(this.onPageReady) this.onPageReady();
                        }).bind(this));
                    }
                    this.updateStatusBar();
                    if(app.isdev) window._current=this;
                }else if(this.showOptions.display=='page_overlay_web'){
                    //subpage logic
                    if(reloaded){
                        this.render();
                        if(this.onBeforeShow) this.onBeforeShow(this.ele);
                        TweenLite.set(this.ele, {zIndex:this.getPageZindex()});
                        if(this.onViewReady) this.onViewReady();
                        if(this.options.onViewReady) this.options.onViewReady();
                        if(this.onPageReady) this.onPageReady();
                    }else{
                        phiStore.views.overlays.push(this._uuid);
                        this.render();
                        if(this.onBeforeShow) this.onBeforeShow(this.ele);
                        async.parallel([this.animateWebPageOverlay.bind(this),this.getPageData.bind(this)],(function(){
                            if(this.showOptions.renderOnViewReady) this.refresh();
                            if(this.onShow) this.onShow();
                            if(this.onViewReady) this.onViewReady();
                            if(this.options.onViewReady) this.options.onViewReady();
                            if(this.onPageReady) this.onPageReady();
                        }).bind(this));
                    }
                    if(app.isdev) window._current=this;
                }else{
                    if(!this.ele){
                        this.render();
                        if(this.showOptions.display=='home') phiStore.views.home=this._uuid;
                    }else{
                        this.ele.show();
                        if(this.onStart) this.onStart();
                    }
                    if(this.showOptions.display=='page_web'){
                        if(phiStore.views.pages.indexOf(this._uuid)==-1) phiStore.views.pages.push(this._uuid);
                    }
                    if(this.store.hidden&&reloaded){//rerender but hide
                        this.hide();
                        return false;
                    }else this.store.hidden=false;
                    if(this.onBeforeShow) this.onBeforeShow(this.ele);
                    this.updateStatusBar()
                    async.parallel([this.getPageData.bind(this)],(function(){
                        if(this.showOptions.renderOnViewReady) this.render(1);
                        if(this.onShow) this.onShow();
                        if(this.onViewReady) this.onViewReady();
                        if(this.options.onViewReady) this.options.onViewReady();
                        if(this.onPageReady) this.onPageReady();
                    }).bind(this));
                }
                if(this.setRoute) this.setRoute();
            }else{//plain render
                if(!this.ele) this.render();
                else{
                    this.ele.show();
                    if(this.onStart) this.onStart();
                }
                if(this.onBeforeShow) this.onBeforeShow(this.ele);
                if(this.store.hidden&&reloaded){//rerender but hide
                    this.hide();
                }else this.store.hidden=false;
                if(this.onShow) this.onShow();
                if(this.onViewReady) this.onViewReady();
                if(this.options.onViewReady) this.options.onViewReady();
                if(this.onPageReady) this.onPageReady();
            }
        },
        updateStatusBar:function(){
            phi.setStatusBar(this);
            // if(this.showOptions.statusBar) phone.statusBar.set(this.showOptions.statusBar);
            // else if(this.showOptions.statusBar===false){
            //     phone.statusBar.hide()
            // }else phone.statusBar.set('dark');
        },
        onBeforePageHide:function(){//get previous page
            var last=phi.getPreviousView();
            if(last&&last.component.setMenuBottom){
                if(last.component.showOptions.display=='page_overlay'){
                    $('#mainmenunav').data('hidden',1).hide()
                }else{
                    $('#mainmenunav').data('hidden',0).show()
                    last.component.setMenuBottom();
                }
            }else{
                $('#mainmenunav').data('hidden',0).show()
            }
        },
        onBeforeShow:function(){
            if(this.showOptions.display=='page_overlay'){
                $('#mainmenunav').data('hidden',1).hide()
            }else{
                $('#mainmenunav').data('hidden',0).show()
                this.setMenuBottom()
            }
        },
        onPageReady:function(){
            if(this.showOptions.display=='page_overlay'){
            }else{
                this.setMenuBottom()
            }
        },
        rerender:function(){
            this.trigger('destroy');
            this.render();
            TweenLite.set(this.ele, {zIndex:this.getPageZindex()});
        },
        hide:function(){
            this.ele.hide();
            this.store.hidden=true;
            if(this.onHide) this.onHide();
            if(this.onStop) this.onStop();
        },
        refresh:function(force){//only allow refresh if current active page! Otherwise may cause registration issues
            if(this._active||force) phi.reload(this._uuid);
        },
        reload:function(force){//only allow refresh if current active page! Otherwise may cause registration issues
            if(this._active||force) phi.reload(this._uuid);
        },
        destroy:function(reload){
            //if(!reload) alert('destroy')
            phi.log('💣 DESTROY ['+this._uuid+']','phi');
            phi.animating=false;
            this.trigger('destroy');
            //this.destroyComponents();//will clean up anything using bind="method:options"
            if(this.beforeDestroy) this.beforeDestroy();
            if(this.ele) this.ele.remove();
            if(this.onDestroy) this.onDestroy();
            phi.destroyListeners(this);//will remove any listeners if they exist
            //also needs to remove instance reference!!!!
            this.destroyed=true;
            if(!reload) setTimeout(this.deregister.bind(this),1);//if reloading, itll use same UUID
        },
        deregister:function(){
            phi.log('💥 DEREGISTER ['+this._uuid+']','phi');
            if(phiStore.views.overlays.indexOf(this._uuid)>=0){
                phiStore.views.overlays.splice(phiStore.views.overlays.indexOf(this._uuid),1);
            } 
            if(phiStore.views.pages.indexOf(this._uuid)>=0){
                phiStore.views.pages.splice(phiStore.views.pages.indexOf(this._uuid),1);
            } 
            if(this.closingPage){//if overlay or page is hiding
                //remove from view list!
                //console.log('THIS');
                phi.log('ensureCurrentView','phi');
                phi.ensureCurrentView(this._uuid);
            }
            if(this.goBackCb&&typeof this.goBackCb=='function') this.goBackCb();
            delete phiStore.components[this._uuid];
            if(this.options.onDestroy) this.options.onDestroy()
            //need to remove 
        }
    },
	register:function(component,options,reload,component_type,store){
        if(!store) store={};
        if(!component_type) component_type='modules';
		if(!window[component_type][component]){
			return console.warn('Invalid module ['+component+']')
		}
		var uuid=(options._componentId)?options._componentId:Math.uuid(20);//unique compontent ID
		if(phiStore.components[options._componentId]&&!reload){
            //preserve Store
            if(phiStore.components[options._componentId].component.store) options.store=$.extend(true,{},phiStore.components[options._componentId].component.store);
            //destroy!
            if(phiStore.components[options._componentId].component.destroy) phiStore.components[options._componentId].component.destroy(1);
        }
        try{
    		phiStore.components[uuid]={
    			component:new window[component_type][component](options),
                component_class:component,
                component_type:component_type,
                uuid:uuid
    		}
            phiStore.components[uuid].component._uuid=uuid;
        }catch(e){
            console.warn(e);
            return false;
        }
        if(!phiStore.components[uuid].component.store) phiStore.components[uuid].component.store=store;
        phiStore.components[uuid].component.options=options;
        if(phiStore.components[uuid].component.init&&!reload) phiStore.components[uuid].component.init();
        else console.warn('no .init entry point for component ['+component+']')
        if(options.onRegister) options.onRegister(phiStore.components[uuid],reload);
        else console.warn('no onRegister entry point for component ['+component+']')
		//returnCallback(phiStore.components[uuid].component,1);
        return phiStore.components[uuid];
	},
	destroy:function(instance,reload){
		if(typeof instance =='string'){
			var phiinstance=phiStore.components[instance];
			if(!phiinstance){
				return console.warn('invalid instance id ['+instance+']');
			}
			instance=phiinstance.component;
		}
		if(instance&&phiinstance&&phiinstance.uuid){
			if(phiStore.components[phiinstance.uuid]){
				if(reload){
					if(phiStore.components[phiinstance.uuid].component.destroy) phiStore.components[phiinstance.uuid].component.destroy(1);
                    else console.warn('no destroy for compontent ['+phiStore.components[phiinstance.uuid].component_class+']')
				}
				delete phiStore.components[phiinstance.uuid];
			}
			if(!reload) phi.log('DESTROY COMPONENT ['+phiinstance.uuid+']','phi');
            else phi.log('REFRESH COMPONENT ['+phiinstance.uuid+']','phi');
		}else{
			phi.log('invalid instance','phi');
		}
	},
    reload:function(uuid){
        console.log('reload: '+uuid);
        if(!phiStore.components[uuid]) return console.warn('couldnt find component');
        var view=phiStore.components[uuid];
        var opts=$.extend(true,{},view.component.options);
        var store=$.extend(true,{},view.component.store);
        //destroy old component!
        phi.destroy(view.uuid,1);
        //create new one and re-register internally within view
        if(view.component_type=='views'){
            phi.registerView(view.component_class,opts,store,1);
        }else{
            phi.app=phi.register(view.component_class,opts,1,'apps',store).component;
        }
    },
	onHotReload:function(component,app){
		if(Object.keys(phiStore.components).length){
			$.each(phiStore.components,function(i,v){
				if(v.component_class==component){
                    if(component==app&&v.component.onHotReload){
                        v.component.onHotReload();
                    }else{
    					phi.log('reload component ['+component+']','phi');
    					var opts=$.extend(true,{},v.component.options);
    					var store=$.extend(true,{},v.component.store);
                        //console.log(opts,store)
    					//destroy old component!
    					phi.destroy(v.uuid,1);
    					//create new one and re-register internally within view
                        if(v.component_type=='views'){
                            phi.registerView(v.component_class,opts,store,1);
                        }else{
    					    phi.register(v.component_class,opts,1,(v.component_type)?v.component_type:'apps',store);
                        }
                    }
				}
			})
		}
	},
	stop:function(e){
		if(e){
            if(e.stopImmediatePropagation) e.stopImmediatePropagation();
            if(e.stopPropagation) e.stopPropagation();
            if(e.preventDefault) e.preventDefault();
        }
	},
    sendDebugLog:function(cb){
        var viewState={};
        viewState.views=phiStore.views;
        viewState.components={}
        $.each(phiStore.components,function(i,v){
            viewState.components[i]={
                component_class:v.component_class
            }
        })
        phi.logs.unshift(viewState);
        onerror(phi.logs,false,false,false,false,cb);
    },
    logs:[],
	log:function(msg,type){
        if(type){
            switch(type){
                case 'navigation':
                    var s='background:purple;color:white';
                break;
                case 'socket':
                    var s='background:green;color:white';
                break;
                case 'cookie':
                    var s='background:#f02;color:white';
                break;
                case 'stats':
                    var s='background:orange;color:white';
                break;
                case 'file':
                    var s='background:blue;color:white';
                break;
                case 'keyboard':
                    var s='background:aqua;color:white';
                break;
                case 'phi':
                    var s='background:yellow;color:black';
                break;
                default:
                    var s='background:black;color:white';
                break;
            }
            console.log('%c'+msg,s);
        }else{
            console.log('%c'+msg,'background:black;color:white')
        }
        phi.logs.unshift(new Date()+' : '+msg);
        phi.logs=phi.logs.slice(0,100);//keep last 100 logs!
    },
    domParser:false,
    registerComponentFunctions:function(options,obj,context){
        if(typeof obj =='function'){
            var fid=Math.uuid(12);
            context[fid]=obj;
            return 'action:'+fid;
        }
        if(typeof obj =='object'){
            for(var key in obj){
                obj[key]=phi.registerComponentFunctions(options,obj[key],context);
            }
        }
        return obj;
    },
    formatOptions:function(options,context){
        for(var key in options){
            if(context) options[key]=phi.registerComponentFunctions(options,options[key],context);//works recursively!
        }
        return btoa(JSON.stringify(options));
    },
    hydrateOptions:function(ele,context,obj){
        if(typeof obj=='object'){
            for(var key in obj){
                obj[key]=phi.hydrateOptions(ele,context,obj[key]);
            }
        }
        if(typeof obj=='string'){
            if(obj.indexOf('<this>')===0){
                obj=context;
            }else if(obj.indexOf('action:')===0){
                var p=obj.split(':')
                obj=context[p[1]].bind(context);
            }else if(obj.indexOf('element')===0){
                var tp=obj.split(':');
                if(!tp[1]||tp[1]=='parent'){
                    obj=ele;
                }else{
                    obj=ele.querySelectorAll(tp[1]);
                }
            }else if((obj.indexOf('jquery')===0||obj.indexOf('$')===0)){
                var tp=obj.split(':');
                if(!tp[1]||tp[1]=='parent'){
                    obj=$(ele);
                }else{
                    obj=context.ele.find(tp[1]);
                }
            }
        }
        return obj;
    },
    getOptions:function(str,ele,context){//could contain elements in options, traverse and add them in if needed
        try{
            var json=JSON.parse(atob(str));
            for(var key in json){
                json[key]=phi.hydrateOptions(ele,context,json[key]);
            }
            return json;
        }catch(e){
            console.warn(e)
            onerror('error parsing options: '+e.message);
        }
    },
    render:function(domLike,options){
        try{
            if(!phi.domParser) phi.domParser=new DOMParser();
            if(typeof domLike=='string'){
                var renderTo=document.querySelector(domLike);
            }else if(domLike.length){//jquery
                var renderTo=domLike[0];
            }else{
                var renderTo=domLike;
                options.returnhtml=true;
            }
            var o=$.extend(true,{},{
                template:false,
                getTemplate:false,//function
                data:{},
                extendData:false,
                bindings:false,
                display:'',
                id:Math.uuid(10,16),
                append:false,
                wrap:false,
                module:false,
                force:false,
                debug:0
            },options);
            if(options.getData&&options.context) o.data=options.getData.call(options.context);
            if(options.getTemplate) o.template=options.getTemplate();
            if(options.getId){
                if(options.context){
                    o.id=options.getId.call(options.context);
                    delete options.getId;
                }else{
                    console.warn('context required!');
                }
            }
            // o.data.template=o.template;
            // o.data.uid=o.uid;
            // if(domLike===false&&!o.returntemplate&&!o.returnhtml){
            //     console.warn('Element does not exist!')
            //     return false;
            // }
            var template=window.templates[o.template];
            //make backwards compatable to $.fn.render OLD TEMPLATING SYSTEM
            o.data.template=o.template;
            o.data._tid=o.id;
            if(o.extendData) Object.assign(o.data,o.extendData);
            var forceid=false;
            if(template){
                try{
                    o.content=template.render(Object.assign({},o.data,{
                        _util:{
                            formatOptions:function(topts){
                                return phi.formatOptions(topts,o.context);
                            }
                        }
                    }));
                    if(o.wrap){
                        forceid=Math.uuid(12);
                        o.content='<div id="'+forceid+'">'+o.content+'</div>'
                    }
                    if(o.display=='page_overlay_web'){
                        forceid=Math.uuid(12);
                        o.content='<div id="'+forceid+'" class="sfit" style="background:rgba(55,55,55,.4)"><div class="webpagecontainer l-corner-top" style="overflow:hidden">'+o.content+'</div></div>';
                    }
                }catch(e){
                    console.log(e)
                    onerror('TEMPATE ['+o.template+'] error: '+e.message+ ' '+JSON.stringify(o.data));
                    return console.warn('phi.render error::: template:'+o.template+' error: '+e.message,o.data);
                }
            }else if(o.template){
                return console.warn('error: Invalid Template ['+o.template+']');
            }
            if(domLike===false) return o.content;
            if(!o.content){
                if(o.replace) renderTo.remove();
                return console.warn('no content to render');
            }
            if(!domLike) return console.warn('invalid renderTo',domLike);
            //create dom node from the content
            var html = phi.domParser.parseFromString(o.content, 'text/html');  
            if(!html.body.firstChild.id){
                html.body.firstChild.id=o.id;
                var id=(o.id)?o.id:Math.uuid(16);
            }else{
                var id=html.body.firstChild.id;
            }
            if(o.template) html.body.firstChild.template=o.template;
            if(o.replace){
                var parent=renderTo.parentNode;
                renderTo.replaceWith(html.body.firstChild)
            }else if(renderTo.querySelector('[id="'+id+'"]')){//we are replacing!
                renderTo.querySelector('[id="'+id+'"]').replaceWith(html.body.firstChild)
            }else{
                if(o.append) renderTo.appendChild(html.body.firstChild);
                else if(o.prepend) renderTo.prepend(html.body.firstChild);
                else{//replace HTML
                    renderTo.innerHTML='';//clear out
                    renderTo.appendChild(html.body.firstChild)
                }
            }
            if(parent){
                 var res=parent.querySelector('[id="'+id+'"]');
            }else var res=renderTo.querySelector('[id="'+id+'"]');
            var container=$(res);
            if(options.context){
                if(options.contextElement!==false){
                    if(options.contextElement) options.context[options.contextElement]=container;
                    else options.context.ele=container;
                }
            }
            //return container;
            //do bindings!
            var items=phi.getNodes(res,'[action]');
            //items.push(res);//add in the parent element too!
            if(items&&items.length){
                for (var i = 0; i < items.length; i++) {
                    var item=items[i];
                    if(!item.attributes.action) continue;
                    var methods=item.attributes.action.value;
                    if(methods){
                        var types=methods.split(',');
                        for (var ti = 0; ti < types.length; ti++) {
                            var type=types[ti];
                            var typeParts=type.split(':');
                            var action=typeParts[1];
                            var event=typeParts[0];
                            var opts=phi.actions[event];
                           if(event=='click'){//use STAP
                                if(item.dataset.instant){
                                    $(item).stap(function(e){
                                        //phi.stop(e);
                                        return phi.handleEvent(e,options)
                                    });
                                }else{
                                    $(item).stap(function(e){
                                        //phi.stop(e);
                                        return phi.handleEvent(e,options)
                                    },1,'tapactive');
                                }
                            }else if(event=='hover'){
                                $(item).stap(function(e){
                                        //phi.stop(e);
                                    },1,'tapactive',function(e){
                                        return phi.handleEvent({
                                            'type':'hover',
                                            'target':this
                                            },options)
                                    });
                            }else if(opts){
                                if(opts.listener){
                                    item.addEventListener(opts.listener,function(e){
                                        return phi.handleEvent(e,options,container)
                                    });
                                }
                                if(opts.listeners){
                                    for (var li = 0; li < opts.listeners.length; li++) {
                                        var listener=opts.listeners[li];
                                        item.addEventListener(listener,function(e){
                                            return phi.handleEvent(e,options,container)
                                        });
                                    }
                                }
                            }else{
                                console.warn('No lister opts set for ['+event+'], implying default')
                                item.addEventListener(event,function(e){
                                    return phi.handleEvent(e,options,container)
                                });
                            }
                        }
                    }
                }
            }
            var links=phi.getNodes(res,'[link]');
            if(links&&links.length){
                for (var i = 0; i < links.length; i++) {
                    var ele=links[i];
                    if(ele.attributes.link) $(ele).stap(function(e){
                        if(!$(this).attr('data-bubble')) phi.stop(e);
                        if($(this).attr('data-minimize')&&options.context) options.context.minimize();
                        return phi.handleEvent(e);
                    },1,'tapactive',function(e){//copy link, only https
                        var tele=((e.currentTarget)?e.currentTarget:e.target);
                        if(tele){
                            var url=tele.attributes.link.value;
                            if(url.indexOf('http')>=0&&isPhoneGap()){
                                _.share({url:url});
                            }
                        }
                    });
                }
            }
            // var links=phi.getNodes(res,'[linkto]',1);
            // if(links&&links.length){
            //     for (var i = 0; i < links.length; i++) {
            //         var ele=links[i];
            //         if(ele.attributes.linkto) $(ele).stap(function(e){
            //             if(!$(this).attr('data-bubble')) phi.stop(e);
            //             if($(this).attr('data-minimize')&&options.context) options.context.minimize();
            //             return phi.handleEvent(e);
            //         },1,'tapactive',function(e){//copy link
            //             if(isPhoneGap()) _.share({url:((e.currentTarget)?e.currentTarget:e.target).attributes.linkto.value});
            //         });
            //     }
            // }
            var goto=phi.getNodes(res,'[goto]');
            if(goto&&goto.length){
                for (var i = 0; i < goto.length; i++) {
                    var ele=goto[i];
                    if(ele.attributes.goto) $(ele).stap(function(e){
                        phi.stop(e);
                        return phi.handleEvent(e);
                    },1);
                }
            }
            var fit=phi.getNodes(res,'[fitcontent]');
            if(fit&&fit.length){
                for (var i = 0; i < fit.length; i++) {
                    if(fit[i].attributes.fitcontent) _.fitContent(fit[i])
                }
            }
            var bind=phi.getNodes(res,'[bind]');
            if(bind&&bind.length){
                for (var i = 0; i < bind.length; i++) {
                    if(bind[i].attributes.bind) phi.bind(options.context,bind[i],bind[i].attributes.bind.value,options.context);
                }
            }
            //legacy UI
            var ui=phi.getNodes(res,'[data-ui]',1);
            if(ui&&ui.length){
                for (var i = 0; i < ui.length; i++) {
                    var ele=ui[i];
                    //if(!ele.attributes['data-uid']) continue;
                    var id=ele.attributes['data-ui'].value;
                    var did=ele.attributes.id.value;
                    if(!did){
                        console.warn('Invalid id for ui ['+id+']');
                        continue;
                    }
                    if(window._ui[id]&&window._ui[id].bindings){
                        if(did&&o.data[did]){
                            $(ele).wire(window._ui[id].bindings,o.data[did]);
                        }else{
                            $(ele).wire(window._ui[id].bindings,o.data);
                        }
                    }
                }
            }
            //if(options.binding) options.binding(container);
            if(options.binding){
                if(options.context) options.binding.call(options.context,container,o);
                else{
                    console.warn('no context passed to template ['+options.template+']');
                    options.binding(container,options);
                }
            }
            return container;
        }catch(e){
            console.log(e);
            console.log(options)
        }
    },
    bind:function(context,ele,str,context){
        var parts=str.split(',');
        for (var i = 0; i < parts.length; i++) {
            var part=parts[i];
            var bindings=part.split(':');
            //console.log('bind! ',context)
            if(modules[bindings[0]]){
                if(bindings.length==2){
                    if(context){
                        context.registerComponent(bindings[0],new modules[bindings[0]](phi.getOptions(bindings[1],ele,context)));
                    }else{
                        modules[bindings[0]](phi.getOptions(bindings[1],ele));
                    }
                }
                if(bindings.length==3){
                    if(context){
                        context[bindings[1]]=context.registerComponent(bindings[0],new modules[bindings[0]](phi.getOptions(bindings[2],ele,context)));
                    }else{
                        modules[bindings[0]](phi.getOptions(bindings[1],ele));
                    }
                }
            }else{
                console.warn('couldnt find modules.'+bindings[0]);
            }
        }
    },
    getNodes:function(res,query,no_parent){
        var nodes=[];
        if(!no_parent) nodes.push(res);//parent node
        var onodes=res.querySelectorAll(query);
        if(onodes.length) for (var i = 0; i < onodes.length; i++) {
            nodes.push(onodes[i]);
        }
        return nodes;
    },
    actions:{
        click:{
            types:['_tap','mouseup']
        },
        input:{
            listeners:['keyup','input','change']
        }
    },
    handleEvent:function(e,options,container){
        //var target=e.target;
        if(e.type){
            switch(e.type){
                case 'hover':
                    var action=phi.getAction({
                        type:'hover'
                    },e.target);
                    var container=false;
                    var target=e.target;
                    if(options.context&&options.context[action]) return options.context[action](e,container,target,target.dataset);
                    else console.warn('['+action+'] not found in context')
                    return false;
                break;
            }
        }
        var target=(e.currentTarget)?e.currentTarget:e.target;
        if(target.attributes.link){
            var link=target.attributes.link.value;
            if(!link) return console.warn('invalid link')
            if(link) _.openLink({
                intent:link
            })
            if(target.attributes.action&&target.attributes.action.value){
                
            }else{
                return false;//prevent bubble!
            }
        }
        // if(target.attributes.linkto){
        //     var linkto=target.attributes.linkto.value;
        //     if(!linkto) return console.warn('invalid linkto')
        //     if(linkto) _.openLink({
        //         intent:linkto
        //     })
        //     return false;//prevent bubble!
        // }
        if(target.attributes.goto){
            if(target.attributes.goto_opts){
                try{
                    var opts=JSON.parse(target.attributes.goto_opts.value);
                }catch(e){
                    console.trace('error parsing goto_opts');
                    return false;
                }
            }else{
                var opts={};
            }
            phi.registerView(target.attributes.goto.value,{
                renderTo:$('#wrapper')[0],
                data:opts
            });
        }
        if(target.attributes.action){
            var action=phi.getAction(e,target);
            if(action){
                if(typeof action == 'string'){
                    if(options.actions&&options.actions[action]) return options.actions[action](e,container,target,target.dataset);
                    else if(options.context&&options.context[action]) return options.context[action](e,container,target,target.dataset);
                    else{
                        if(!options.context) console.warn('no context passed');
                        if(options.context&&!options.context[action]){
                            console.warn('no binding in place for ['+action+']!')
                        }else{

                        }
                    }
                }else if(action.bind){
                    phi.stop(e);
                    phi.bind(options.context,target,action.bind);
                }
            }
        }
    },
    getAction:function(event,target){
        var methods=target.attributes.action.value;
        var eventType=event.type;
        if(methods){
            var useaction='';
            var types=methods.split(',');
            for (var ti = 0; ti < types.length; ti++) {
                var type=types[ti];
                var typeParts=type.split(':');
                var action=typeParts[1];
                var tevent=typeParts[0];
                var opts=phi.actions[tevent];
                if(typeParts[2]){
                    if(opts){
                        if(opts.types&&opts.types.indexOf(eventType)>=0) useaction={
                            bind:typeParts[1]+':'+typeParts[2]
                        }
                        if(opts.listener==tevent) useaction={
                            bind:typeParts[1]+':'+typeParts[2]
                        }
                        if(opts.listeners&&opts.listeners.indexOf(tevent)) useaction={
                            bind:typeParts[1]+':'+typeParts[2]
                        }
                    }else{
                        if(eventType==tevent) useaction={
                            bind:typeParts[1]+':'+typeParts[2]
                        };
                    }
                }else{
                    if(opts){
                        if(opts.types&&opts.types.indexOf(eventType)>=0) useaction=action;
                        if(opts.listener==tevent) useaction=action;
                        if(opts.listeners&&opts.listeners.indexOf(tevent)) useaction=action;
                    }else{
                        if(eventType==tevent) useaction=action;
                    }
                }
            }
            if(!useaction) console.warn('action not found!',event);
            return useaction;
        }else{
            console.warn('no methods found...somehow');
        }
    },
    exec:function(component,action,options){
        var instance=false;
        $.each(phiStore.components,function(i,v){
            if(v.component_class==component&&!instance){
                instance=v.component;
            }
        })
        if(instance){
            if(instance[action]){
                instance[action](options);
            }else{
                console.warn('action ['+action+'] not found in instance ['+component+']');
            }
        }else{
            console.warn('instance ['+component+'] not found');
        }
    },
    call:function(method){
        var args=[];
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        if(phi[method]) phi[method].apply(phi,args);
        else console.warn('phi.call('+method+') not found','phi')
    },
    require:function(files,cb){
        phi.addFiles.load(files,cb);
    },
    getTheme:function(){
            //will be on user profile, but for now local store
        var ctheme=phi.prefs.get('app_theme');
        if(ctheme){
            ctheme=phi.getThemeList()[ctheme];
        }
        if(!ctheme){
            ctheme=phi.getThemeList().default;
        }
        return ctheme;
    },
    prefs:{
        data:{},
        load:function(){
            phi.prefs.data=localStorage.getObject('prefs');
        },
        clear:function(){
            phi.prefs.data={};
            localStorage.setObject('prefs',phi.prefs.data);
        },
        get:function(id){
            return (phi.prefs.data[id])?phi.prefs.data[id]:false;
        },
        delete:function(id){
            if(phi.prefs.data[id]){
                delete phi.prefs.data[id];
                localStorage.setObject('prefs',phi.prefs.data);
            }
        },
        set:function(id,data){
            phi.prefs.data[id]=data;
            localStorage.setObject('prefs',phi.prefs.data);
        }
    },
    getThemeList:function(){
        return {
            default:{
                name:'Default',
                icon:{color:'#555'},
                header:{color:'white',fontColor:'#0f7198'},
                statusbar:{theme:'dark'},
                subheader:{color:'#0f7198',fontColor:'white'},
                content:{color:'#efefef'},
                highlight:{color:'#48cbff'},
                footer:{color:'white'},
                menu:{color:'#0383a6'}
            }
        }
    },
    addFiles:{
        loaded:[],
        time:4000,
        load:function(conf,cb){
            var self=this;
            var toload=[];
            if(conf.js){
                $.each(conf.js,function(i,v){
                    if(v.indexOf('http')===-1){
                        var p=v.split('/')
                        v=app.codeurl+'/'+v+'/'+p[1]+'.js';
                    }
                    toload.push(async.apply(function(url,callback){
                        phi.addFiles.js(url,phi.addFiles.time,function(){
                            callback();
                        },function(){
                            phi.log('failed','phi')
                            callback();
                        })
                    },v))
                })
            }
            if(conf.css){
                $.each(conf.css,function(i,v){
                    if(v.indexOf('http')===-1){
                        var p=v.split('/')
                        v=app.codeurl+'/'+v+'/'+p[1]+'.css';

                    }
                    toload.push(async.apply(function(url,callback){
                        phi.addFiles.css(url,phi.addFiles.time,function(){
                            callback();
                        },function(){
                            phi.log('failed','phi')
                            callback();
                        })
                    },v))
                })
            }
            if(toload.length){
                async.parallel(toload,function(){
                    cb();
                })
            }else{
                cb();
            }
        },
        css:function(url,time,scb,fcb){
            var self=this;
            if(self.loaded.indexOf(url)>=0) return scb();
            $.ajax({
                url : url,
                dataType: "text",
                timeout:time,
                success : function (data) {
                    $('head').append('<style>'+data+'</style>');
                    self.loaded.push(url);
                    scb();
                },
                error:function(){
                    fcb();
                }
            });
        },
        js:function(url,time,scb,fcb){
            var self=this;
            if(self.loaded.indexOf(url)>=0) return scb();
            var lto=setTimeout(function(){
                fcb();
            },time);
            var oHead = document.getElementsByTagName('head')[0];
            var oScript = document.createElement('script');
            oScript.type = 'text/javascript';
            oScript.src = url;//+'?ts='+new Date().getTime();//cache buster
            oScript.async = false;
            oScript.onload = function(){
                if(lto) clearTimeout(lto);
                self.loaded.push(url);
                scb();
            }
            // IE 6 & 7
            oScript.onreadystatechange = function() {
                if (this.readyState == 'complete') {
                    if(lto) clearTimeout(lto);
                    self.loaded.push(url);
                    scb();
                }
            }
            oHead.appendChild(oScript);
        }
    }
}