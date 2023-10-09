modules.user=function(options){
    var self=this;
    this.version=1;
    self.store=(options.store)?options.store:{};
    self.options=options;
    this.profile=false;//if profile exists, logged in, else, not
    this.init=function(){
        modules.prefs.load();
        self.get(function(loggedin){
            if(loggedin){
                self.validAuth()
            }else{
                if(options.onNoAuth) options.onNoAuth();
            }
            if(options.onDoneLoading) options.onDoneLoading();
        })
    }
    this.validAuth=function(){
        if(options.onValidAuth) options.onValidAuth();
        return false;//disble account checking for now, how on homepage instead...too intrusive
        if(self.profile&&self.profile.accounts){
            $.each(self.profile.accounts,function(i,v){
                if(v.pending){
                    switch(i){
                        case 'cobot':
                            self.checkIfAccountExists('cobot',function(exists){
                                if(!exists){
                                    self.ensureAccountCreation({
                                        type:'cobot',
                                        url:v.invite_url
                                    })
                                }
                            })
                        break;
                    }
                }
            })
        }
    }
    this.promptLogin=function(){
        alert('become a member to comment!');
    }
    this.getId=function(){
         return df(self,'store.profile.id','');
    }
    this.getRoles=function(){
        return df(self,'store.profile.roles',[]);
    }
    this.saveStat=function(opts){
        if(!opts.page){
            if(app.user.getId()){
                opts.page={
                    id:app.user.getId(),
                    type:'user'
                }
            }else{
                opts.page={
                    id:'anon',
                    type:'user'
                }
            }
        }
        modules.api({
            url:app.sapiurl+'/user/savestat',
            data:{
                stat:opts
            },
            retry:5
        })
    }
    this.custom={//custom action events - separate logic so code can be reusable

    }
    this.getIdentity=function(){
        var identity=modules.prefs.get('identity');
        var ident=false;
        if(!identity){
            ident={
                type:'profile',
                data:{
                    id:app.user.profile.id,
                    name:app.user.profile.name,
                    pic:app.user.profile.pic
                }
            }
        }else{
            if(identity==app.user.profile.id){
                ide,pnt={
                    type:'profile',
                    data:{
                        id:app.user.profile.id,
                        name:app.user.profile.name,
                        pic:app.user.profile.pic
                    }
                }
            }else{
                if(app.user.profile.pages){
                    $.each(app.user.profile.pages.list,function(i,v){
                        if(v.id==identity){
                            ident={
                                type:'page',
                                data:v
                            }
                        }
                    })
                }
            }
        }
        if(!ident){
            ident={
                type:'profile',
                data:{
                    id:app.user.profile.id,
                    name:app.user.profile.name,
                    pic:app.user.profile.pic
                }
            }
        }
        return ident;
    }
    this.getIdentities=function(){
        var menu=[];
        menu.push({
            id:app.user.profile.id,
            name:app.user.profile.name,
            pic:app.user.profile.pic
        });
        $.each(app.user.profile.pages.list,function(i,v){
            menu.push(v);
        });
        return menu;
    }
    this.getSetting=function(setting){
        if(self.store.profile.settings){
            if(setting.indexOf('.')>=0){
                var sp=setting.split('.');
                var lv=self.store.profile.settings;
                $.each(sp,function(i,v){
                    if(lv&&lv[v]){
                        lv=lv[v];
                    }else{
                        lv=false;
                    }
                })
                return lv;
            }else{
                return self.store.profile.settings[setting];
            }
        }else return false;
    }
    this.setSetting=function(setting,value){
        var set={};
        set[setting]=value;
        self.set({
            items:[{
                type:'set',
                app:'user_settings',
                data:set
            }]
        });
        if(setting.indexOf('.')>=0){
            var p=setting.split('.');
        }else{
            var p=[setting];
        }
        if(!self.store.profile.settings) self.store.profile.settings={};
        $.each(p,function(i,v){
           if(i==0){
            if(p.length>1){
                if(!self.store.profile.settings[p[0]]) self.store.profile.settings[p[0]]={};//ensure object exists
            }else{
                self.store.profile.settings[p[0]]=value;
            }
           } 
           if(i==1){
            if(p.length>2){
                if(!self.store.profile.settings[p[0]][p[1]]) self.store.profile.settings[p[0]][p[1]]={};//ensure object exists
            }else{
                self.store.profile.settings[p[0]][p[1]]=value;
            }
           }
           if(i==2){
            self.store.profile.settings[p[0]][p[1]][p[2]]=value;
           }
        })
        //console.log(self.store.profile.settings);
    }
    this.profileUpdate=function(){
        //change username/profile pic anywhere in app
        $('.mainuserimg').css('backgroundImage','url('+modules.tools.getImg(self.store.profile.pic,'square')+')');
        $('.mainusername').each(function(i,v){
            if($(v).attr('data-first')){
                $(v).html(self.store.profile.name.firstName());
            }else{
                $(v).html(self.store.profile.name);
            }
        })
        $('.userlevel').html(self.store.profile.level_info.name);
    }
    this.setData=function(data){
        self.profile=self.store.profile=$.extend(true,{},self.store.profile,data);
    }
    this.setFlag=function(flag,value){
        if(!self.store.profile.flags) self.store.profile.flags={};
        self.store.profile.flags[flag]=value;
        var set={}
        set[flag]=value;
        self.set({
            items:[{
                type:'set',
                app:'user_flag',
                data:set
            }]
        });
    }
    this.completeOnboarding=function(){
        $('#wrapper').hide()
        var onboard=new modules.onboard({
            ele:$('body'),
            continue:true,
            onViewReady:function(){

            },
            onComplete:function(){
                //self.onLogin(1,cb);//redo! now has been onboarded
                $('#wrapper').show();//ensure anyways
                self.reload();
                //really should reload everything
            }
        });//hardcode for now
        onboard.show();
    }
    this.toggleText=function(){
        $('body').toggleClass('hidehelptext')
    }
    this.loadCreds=function(types,cb){
        modules.api({
            caller:'Ping',
            url: app.sapiurl+'/user/creds', 
            data:{
                types:types
            },
            timeout:10000,
            callback:function(data){
                if(data.success&&data.data){
                    $.each(data.data,function(i,v){
                        if(!self.store.profile.creds) self.store.profile.creds={};
                        self.store.profile.creds[i]=v;
                    })
                }
                cb();
            }
        });
    }
    this.getBanner=function(){
        if(app.appleTestingMode||app.user.profile.storeTester) return false;
        //if(!app.isdev||true) return false;
        if(app.user.profile.level=='explorer'){
            return {
                icon:'icon-hero',
                content:'Become a Player!',
                action:'onboard_explorer'
            }
        }
        if(!app.user.profile.onboarded&&false){
            return {
                icon:'icon-hero',
                content:'Finish Onboarding!',
                action:'onboard'
            }
        }
        return false;
    }
    this.onResume=function(){
        self.ping();
    }
    this.ensureSchedule=function(){
        console.log('ENSURE SCHEDULE')
        var schedules=modules.prefs.get('schedules');
        var scheduled=modules.prefs.get('scheduled');
        if(schedules){
            $.each(schedules,function(i,v){
                //go over schedule
                var upcoming=self.getUpcomingSchedule(v);
                if(upcoming){
                    $.each(upcoming,function(ti,tv){
                        if(v.options[tv.daytime]){
                            if(!self.hasScheduleItem(scheduled,i,tv.time,v.options[tv.daytime])){
                                if(v.options[tv.daytime]){
                                    self.scheduleItem($.extend(true,{},{
                                        triggerTime:tv.time,
                                        key:i,
                                        hash:self.getOptionHash(v.options[tv.daytime])
                                    },v.options[tv.daytime]))
                                }
                            }
                        }else{
                            console.warn('invalid ensureSchedule options for time '+tv.daytime,tv,v);
                            onerror('invalid ensureSchedule options for time '+tv.daytime+ ' '+JSON.stringify(tv)+' '+JSON.stringify(v));
                        }
                    });
                }
            })
        }else{
            //alert('no schedules to check')
        }
    }
    this.getUpcomingSchedule=function(schedule){
        // times:['11:11','13:11'],//[{random:[9,17]}]//sometime between 9 and 5 pm
        // frequency:['daily'],//['Monday','Tuesday'...]
        // maxScheduleLength:10,//dont schedule out past 10 days!
        // ends:'never',
        if(!schedule.maxScheduleLength) schedule.maxScheduleLength=10;
        var ct=new Date().getTime();
        var currentDay=0;
        var momentObject=moment().millisecond(0).seconds(0);
        if(schedule.ends=='never'||!schedule.ends||schedule.ends>ct){//simplify to be every day for now
            var upcoming=[];
            while(currentDay<schedule.maxScheduleLength){
                for (var i = 0; i < schedule.times.length; i++) {
                    // test day condition (frequency)
                    if(schedule.frequency[0]=='daily'||schedule.frequency.indexOf(momentObject.format('dddd'))>=0){
                        var time=schedule.times[i];
                        var tp=time.split(':');
                        momentObject.hours(parseInt(tp[0],10));
                        momentObject.minutes(parseInt(tp[1],10));
                        var triggertime=momentObject.format('x');
                        if(triggertime>ct){
                            upcoming.push({
                                time:triggertime,
                                daytime:time
                            })
                        }
                    }
                }
                momentObject.add(1,'days');
                currentDay++;
            }
            return upcoming;
        }else{
            return false;
        }
    }
    this.getOptionHash=function(options){
        return btoa(JSON.stringify(options))
    }
    this.hasScheduleItem=function(scheduled,key,time,options){
        if(!scheduled) return false;
        var has=false;
        $.each(scheduled,function(i,v){
            if(v.key==key&&v.triggerTime==time){
                if(v.hash!=self.getOptionHash(options)){//option hash changed! clear it!
                    self.unScheduleItem(i);
                }else{
                    has=true;
                }
            }
        })
        return has;
    }
    this.scheduleItem=function(options){
        console.log('schedule item',options);
        var id=phone.localnotification.register({
            title: options.title,
            text: options.text,
            trigger: { at: new Date(parseFloat(options.triggerTime)) }
        },{
            route:options.route
        });
        var scheduled=modules.prefs.get('scheduled');
        if(!scheduled) scheduled={};
        scheduled[id]=options;
        modules.prefs.set('scheduled',scheduled);
    }
    this.unScheduleItem=function(id){
        var scheduled=modules.prefs.get('scheduled');
        if(scheduled&&scheduled[id]){
            console.log('unScheduleItem: '+id);
            delete scheduled[id];
            modules.prefs.set('scheduled',scheduled);
            phone.localnotification.clear(id);
        }
    }
    this.clearSchedule=function(type){
        var scheduled=modules.prefs.get('scheduled');
        if(scheduled){
            $.each(scheduled,function(i,v){
                if(v.key==type){
                    self.unScheduleItem(i);
                }
            })
        }
    }
    this.hasSchedule=function(type){
        var schedules=modules.prefs.get('schedules');
        if(!schedules) schedules={};
        if(!type){
            if(_.size(schedules)) return true;
        }else{
            if(schedules[type]) return true;
        }
        return false;
    }
    this.getSchedule=function(type){
        var schedules=modules.prefs.get('schedules');
        if(!schedules) schedules={};
        if(schedules[type]) return schedules[type];
        return false;
    }
    this.schedule=function(type,options){
        //if(!isPhoneGap()) return console.warn('scheduling only avail on phones');
        var schedules=modules.prefs.get('schedules');
        if(!schedules) schedules={};
        if(options){
            schedules[type]=options;
            modules.prefs.set('schedules',schedules)
            self.ensureSchedule();
        }else{
            self.clearSchedule(type);
            if(schedules[type]) delete schedules[type];
            modules.prefs.set('schedules',schedules)
        }
    }
    this.reloadModal=function(){
        modules.keyboard_global.hide();
        $('body').alert({
            template:'reloadmodal',
            closer:false,
            icon:'icon-info-circled-alt',
            buttons:false,
            binding:function(ele){
                setTimeout(function(){
                    //reload!
                    phi.restart();
                },2000)
            }
        })
    }
    this.updateModal=function(){
        modules.keyboard_global.hide();
        $('body').alert({
            template:'updatemodal',
            closer:true,
            icon:'icon-info-circled-alt',
            buttons:[{
                btext:'<i class="icon-refresh"></i> Reload App',
                bclass:'x_refresh'
            }],
            binding:function(ele){
                ele.find('.x_refresh').stap(function(){
                    ele.find('.x_refresh').find('i').addClass('animate-spin');
                    setTimeout(function(){
                        //reload!
                        if(!isPhoneGap()){
                            app.history.set({
                                intent:'/'
                            })
                        }
                        phi.restart();
                    },500)
                },1,'tapactive')
            }
        })
    }
    this.ping=function(){
        if(!self.token) return false;
        modules.api({
            caller:'Ping',
            url: app.sapiurl+'/user/ping', 
            data:{
                app:app.flower_id,
                branch:_bootloader.flowerinfo.branch,
                bootloader:(_bootloader.version)?_bootloader.version:1,
                loadSplash:(self.splashLoaded)?'':1
            },
            timeout:10000,
            callback:function(data){
                if(!self.processingUpdate&&_bootloader.publicconf.combined&&data.version&&data.version!=_bootloader.publicconf.vars.version.hash){
                    self.processingUpdate=true;
                    window._bootloader.reloadCorePassively(function(){
                        console.log('Successfully reloaded core!');
                        self.updateModal();
                    })
                }
                if(data.success&&data.splash){
                    self.splashLoaded=1;
                    window._bootloader.setSplashFile(data.splash,function(success){
                        if(success){
                            //alert('success');
                        }else{
                            //alert('error saving wallpaper');
                        }
                    });
                    //console.log('load splash!');
                    // var url=app.getImg(data.splash.pic,'small');
                    // if(isPhoneGap()&&app.device!='iOS'){//android can cache locally
                    //     app.file.save(url,'splash.'+data.splash.pic.ext,function(local_url){
                    //        // _alert('saved! '+local_url);
                    //         data.splash.image=local_url;
                    //         localStorage.setObject('splash',data.splash);
                    //         modules.cookie.set('wallpaper',1,10000000,'/',app.domain);
                    //     })
                    // }else{
                    //     data.splash.image=url;
                    //     $.fn.preload(url);//preload/cache image using standard cache1
                    //     localStorage.setObject('splash',data.splash);
                    //     modules.cookie.set('wallpaper',1,10000000,'/',app.domain);
                    // }
                }
                if(data.info&&data.info.time){
                    app.time=data.info.time;
                }
            }
        });
    }
    this.set=function(data,cb){
        if(self.token){
            modules.api({
                caller:'Set User Data',
                url: app.sapiurl+'/user/set', 
                data:data,
                dataType:(app.debugapi)?'jsonp':'json',//force json
                timeout:10000,
                callback:function(data){
                    if(cb) cb(data);
                }
            });
        }else{
            console.warn('Must be logged in to save');
        }
    }
    this.token='';
    this.permissions={
        current:{},
        getAvailable:function(){
            if(app.device=='iOS'){
                return ['geolocation','push'];
            }
            if(app.device=='Android'){
                return ['geolocation'];
            }
        },
        check:{
            geolocation:function(cb){
                if(cordova.plugins.diagnostic){
                    cordova.plugins.diagnostic.isLocationAvailable(function(enabled){
                        if(enabled) self.permissions.current.geolocation=1;
                        else self.permissions.current.geolocation=0;
                        cb();
                    }, function(){
                        self.permissions.current.geolocation=0;
                        cb();
                    });
                }else{
                   self.permissions.current.geolocation=0;
                    cb(); 
                }
            },
            push:function(cb){
                if(cordova.plugins.diagnostic){
                    cordova.plugins.diagnostic.isRemoteNotificationsEnabled(function(enabled){
                        if(enabled) self.permissions.current.push=1;
                        else self.permissions.current.push=0;
                        cb();
                    }, function(){
                        self.permissions.current.push=0;
                        cb();
                    });
                }else{
                    self.permissions.current.push=0;
                    cb();
                }
            }
        },
        hasPermission:function(type,cb){
            if(isPhoneGap()){
                if(self.permissions.canCheck()){
                    self.permissions.check[type](function(){
                        cb(self.permissions.current[type]);
                    })
                }else{
                    cb(true)
                }
            }else{
                cb(true);
            }
        },
        ask:{
            geolocation:function(cb){
                cordova.plugins.diagnostic.requestLocationAuthorization(function(status){
                    var ret=0;
                    switch(status){
                        case cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
                            console.log("Permission not requested");
                        break;
                        case cordova.plugins.diagnostic.permissionStatus.DENIED:
                            console.log("Permission denied");
                        break;
                        case cordova.plugins.diagnostic.permissionStatus.GRANTED:
                            console.log("Permission granted always");
                            ret=1;
                        break;
                        case cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE:
                            console.log("Permission granted only when in use");
                            ret=1;
                        break;
                    }
                    cb(ret);
                }, function(){
                    cb(false);
                }, cordova.plugins.diagnostic.locationAuthorizationMode.WHEN_IN_USE);
            },
            push:function(cb){
               cordova.plugins.diagnostic.requestRemoteNotificationsAuthorization({
                    successCallback: function(){
                        cb(true);
                    },
                    errorCallback: function(err){
                       cb(false);
                    },
                    types: [
                        cordova.plugins.diagnostic.remoteNotificationType.ALERT,
                        cordova.plugins.diagnostic.remoteNotificationType.SOUND,
                        cordova.plugins.diagnostic.remoteNotificationType.BADGE
                    ],
                    omitRegistration: true
                });
            }
        },
        canCheck:function(){
            return (isPhoneGap()&&cordova.plugins.diagnostic)?1:0;
        },
        ensure:function(singleSuccess,onComplete){
            var ask=[];
            $.each(self.permissions.getAvailable(),function(i,v){
                if(!self.permissions.current[v]){
                    ask.push(async.apply(function(key,callback){
                        self.permissions.ask[key](function(set){
                            if(set) singleSuccess(key);
                            callback();
                        })
                    },v));
                }
            })
            async.series(ask,function(){
                onComplete();
            })
        },
        start:function(ele){
            var self=this;
            self.permissions.ensure(function(key){
                ele.find('[data-type='+key+']').find('.permsstatus').addClass('selected');
            },function(){
                self.ocb();
            });
        },
        onboard:function(ele,ocb){
            var self=this;
            if(self.permissions.canCheck()){
                self.permissions.checkAll(function(){
                    var check=self.permissions.getAvailable();
                    var t=check.length;
                    var c=0;
                    $.each(check,function(i,v){
                        if(self.permissions.current[v]) c++;
                    })
                    if(c!=t){
                        if(!ele){
                            var returnTheme=app.statusBar.getCurrent();
                            app.footerBar.setColor('white');//default
                            $('body').page({
                                template:'user_permissions_page',
                                uid:'permission_page',
                                overlay:true,
                                beforeClose:function(ele,cb){//eliminate all animation/timing/etc
                                    app.statusBar.set(returnTheme);
                                    setTimeout(function(){
                                        cb();
                                    },50)
                                },
                                overlay:true,
                                onClose:function(){
                                },
                                pageType:'static',
                                data:{
                                    available:self.permissions.getAvailable(),
                                    current:self.permissions.current,
                                    img:'https://wearenectar.s3.amazonaws.com/static/nectar.png'
                                },
                                onShow:function(ele){
                                    app.statusBar.set('light');
                                },
                                onPageRendered:function(ele,cb){
                                    ele.find('.x_ok').stap(function(){
                                        self.permissions.ensure(function(key){
                                            ele.find('[data-type='+key+']').find('.permsstatus').addClass('selected')
                                        },function(){
                                            $.fn.page.close();
                                            ocb();
                                        });
                                    },1,'tapactive');
                                }
                            });
                        }else{
                            ele.render({
                                template:'user_permissions_page',
                                data:{
                                    inline:true,
                                    available:self.permissions.getAvailable(),
                                    current:self.permissions.current,
                                    img:'https://wearenectar.s3.amazonaws.com/static/nectar.png'
                                },
                                binding:function(ele){
                                    self.ocb=ocb;
                                }
                            })
                        }
                    }else{
                        if(!ele) ocb();
                        else{
                            ele.render({
                                template:'user_permissions_page',
                                data:{
                                    inline:true,
                                    available:self.permissions.getAvailable(),
                                    current:self.permissions.current,
                                    img:'https://wearenectar.s3.amazonaws.com/static/nectar.png'
                                },
                                binding:function(ele){
                                    self.ocb=ocb;
                                }
                            })
                        }
                    }
                })
            }else{
                ocb();
            }
        },
        checkAll:function(cb){
            var self=this;
            if(isPhoneGap()){
                //check location
                if(cordova.plugins.diagnostic){
                    var check=[];
                    var checks=Object.keys(self.check);
                    $.each(checks,function(i,v){
                        check.push(self.check[v]);
                    })
                    async.parallel(check,function(){
                        cb();
                    })
                }else{
                    cb();
                }
            }else{
                cb();
            }
        }
    }
    this.getData=function(key,defaultValue){
        return df(self.store.profile,key,defaultValue);
    }
    this.get=function(cb){
        if(self.store.profile){//if it reloads!
            phi.log('use stored profile');
            return self.load({profile:self.store.profile},cb);
        }
        var data={};
        if(self.fblogin&&app.core.login!='false'&&app.core.login||(self.fblogin&&fb)){
            if(self.store.profile&&self.store.profile.fbid) data['fbid']=self.store.profile.fbid;
            else if(self.facebook&&self.facebook.id) data['fbid']=self.facebook.id;
        }
        if(self.temphash){
            data['hash']=self.temphash;
            delete self.temphash;
        }
        if(self.magicLink){
            data['magic']=self.magicLink;
            delete self.magicLink;
        }
        if(self.token==''){
            self.token=localStorage.getVar('token');
        }
        if(window.temptoken){
            self.token=window.temptoken;
        }
        if(self.token||data.magic){
            data.token=self.token;
            ///_alert(JSON.stringify(data))
            modules.api({
                caller:'Load User',
                url: app.sapiurl+'/user/login', 
                data:data,
                timeout:10000,
                callback:function(data){
                    if(data.success){
                        if(self.hasAlert){
                            $.fn.alert.closeAlert();
                            self.hasAlert=false;
                            self.alertele=false;
                        }
                        self.load(data,cb);
                    }else{
                        if(self.hasAlert){
                            self.alertele.find('.x_retry').find('i').removeClass('animate-spin');
                        }else if(data.error!='user_not_found'){
                            var buttons=[{
                                btext:'<i class="icon-refresh"></i> Retry',
                                bclass:'x_retry'
                            },{
                                btext:'<i class="icon-logout"></i> Sign In',
                                bclass:'x_signin'
                            }];
                            if(data.error=='account_blocked'){
                                buttons=false;
                            }
                            $('body').alert({
                                template:'user_retry_login',
                                tempdata:{
                                    error:data.error
                                },
                                icon:'icon-info-circled-alt',
                                closer:false,
                                buttons:buttons,
                                binding:function(ele){
                                    self.alertele=ele;
                                    ele.find('.x_link').stap(function(){
                                        _.sendEmail({
                                            to:[$(this).attr('data-email')],
                                            subject:'Re-instating Account'
                                        })
                                    },1,'tapactive')
                                    ele.find('.x_signin').stap(function(){
                                        if(self.hasAlert){
                                            $.fn.alert.closeAlert();
                                            self.hasAlert=false;
                                            self.alertele=false;
                                        }
                                        cb(false);
                                    },1,'tapactive')
                                    ele.find('.x_retry').stap(function(){
                                        if($(this).find('i').hasClass('animate-spin')) return false;
                                        $(this).find('i').addClass('animate-spin');
                                        self.get(cb);
                                    },1,'tapactive');
                                }
                            });
                            self.hasAlert=true;
                        }else{
                            cb(false)
                        }
                    }
                    //if(options.onDoneLoading) options.onDoneLoading();
                }
            });
        }else{
            setTimeout(function(){
                cb(false);
            },1);
        }
    }
    this.debugSockets=1;//0,1,or 2
    this.listeningSockets=[];
    this.startSocket=function(id,func){
        var self=this;
        if(self.debugSockets){
            phi.log('✅ SOCKETS::CONNECTING::'+id,'socket');
            if(self.debugSockets==2) console.trace();
        }
        if(self.listeningSockets.indexOf(id)==-1){
            if(self.socket) self.socket.on(id, func);
            self.listeningSockets.push(id);
        }
    }
    this.stopSocket=function(id,func){
        var self=this;
        if(self.debugSockets){
            phi.log('☑️ SOCKETS::DISCONNECTING::'+id,'socket');
            if(self.debugSockets==2) console.trace();
        }
        if(self.listeningSockets.indexOf(id)>=0){
            if(self.socket) self.socket.off(id, func);
            self.listeningSockets.splice(self.listeningSockets.indexOf(id),1);
        }
    }
    this.onLogin=function(loggedin,cb){//also happens on start of app
        var self=this;
        if(loggedin){
            $('#wrapper').show();//ensure anyways
            self.socket=io(app.chatterapi+'?user='+self.store.profile.id+'&device='+Math.uuid(12));//always gen a unique device id
            self.socket._connected=false;
            self.socket.on('connect',function(){
                self.socket._connected=true;
            })
            self.socket.on('disconnect',function(){
                self.socket._connected=false;
            })
            self.startSocket('relay',self.onMessage);
            if(app.isdev) self.startSocket('dev_channel',self.onDevMessage);
            if(!isPhoneGap()) self.startSocket('relay_web',self.onWebPush);
            self.ping();//ping right away!
            modules.tools.setInterval('ping',function(){
                self.ping();
            },self.pingInterval());
            if(cb) cb(true);
            if(modules.oauth_global){
                modules.oauth_global.init();//might be an action needing to run on reload web from oauth return
            }
        }
    }
    this.destroy=function(){
        if(self.socket){
            self.stopSocket('relay',self.onMessage);
            if(app.isdev) self.stopSocket('dev_channel',self.onDevMessage);
            if(!isPhoneGap()) self.stopSocket('relay_web',self.onWebPush);
        }
    }
    this.pingInterval=function(){
        return (app.isdev)?10000:30000;
    }
    this.onWebPush=function(data){
        //console.log(data);
        data.additionalData={
            foreground:true,
            messagedata:data.messagedata
        }
        if(window.phone) phone.push.onNotification(data);
    }
    this.onDevMessage=function(data){
        //console.log(data);
        switch(data.type){
            case 'fileupdate':
                self.reloadComponent(data.data);
            break;
        }
    }
    this.hotReload=function(component){
        var views_to_reload=[];
        //handle hot reload of views
        if(modules.viewdelegate){
            $.each(modules.components,function(i,v){
                if(v.type==component){
                    views_to_reload.push(v.view.options.id);
                }
            });
            if(views_to_reload.length){
                $.each(views_to_reload,function(i,v){
                    modules.viewdelegate.onHotReload(v);
                })
            }
        }
        //handle hot relaod of modules
        phi.onHotReload(component);
    }
    this.reloadTimeouts={};
    this.reloadComponent=function(data){
        if(app.isdev){
            var typep=data[data.length-1];
            var ty=typep.split('.');
            var type=ty[ty.length-1];
            if(data[2]){
                var url=app.codeurl+'/'+data[0]+'/'+data[1]+'/'+data[2];
                var item=data[2];
            }else{
                 var url=app.codeurl+'/'+data[0]+'/'+data[1];
                var item=data[1];
            }
            var nsp=item.split('.');
            var component=nsp[0];
            var skip=['viewmanager.js'];
            if(skip.indexOf(item)>=0){
                return phi.log('Do NOT update this global','file');
            }
            if(self.reloadTimeouts[component]){
                return console.warn('already reloading!');
            }
            self.reloadTimeouts[component]=setTimeout(function(){
                self.reloadTimeouts[component]=false;
            },1000)
            switch(type){
                case 'templates':
                    phi.log(item+' Loading...','file');
                    $.fn.render.loadTemplateUrl(url,function(success){
                        if(success) phi.log(item+' Updated!','file');
                        else phi.log(item+' Update Error!','file');
                        self.hotReload(component);
                    });
                break;
                case 'js':
                    phi.log(item+' Loading...','file');
                    var oHead = document.getElementsByTagName('head')[0];
                    var oScript = document.createElement('script');
                    oScript.type = 'text/javascript';
                    oScript.src = url+'?ts='+new Date().getTime();//cache buster
                    oScript.async = false;
                    oScript.onload = function(){
                        phi.log(item+' Updated!','file');
                        self.hotReload(component);
                    }
                    // IE 6 & 7
                    oScript.onreadystatechange = function() {
                        if (this.readyState == 'complete') {
                            phi.log(item+' Updated!','file');
                            self.hotReload(component);
                        }
                    }
                    oHead.appendChild(oScript);
                break;
                case 'css':
                    phi.log(item+' Loading...','file');
                    url+='?ts='+new Date().getTime();//cache bust;
                    $('head').append('<link href="'+url+'" rel="stylesheet" type="text/css">');
                    phi.log(item+' Updated!','file');
                break;
            }
        }
    }
    this.onMessage=function(data){
        //handle realtime update here!
        if(options.onMessage) options.onMessage(data);
    }
    this.secureLinkToWeb=function(url,cb){
        modules.api({
            url: app.sapiurl+'/user/accounttoken', 
            data:{},
            callback: function(data){
                cb();
                if(data.success){
                    url+=data.token;
                    if(window.app_conf.app_scheme) url+='?scheme='+window.app_conf.app_scheme;
                    _.openLink({
                        intent:url,
                        type:(isPhoneGap())?'self':'external'
                    })
                }else{
                    modules.toast({
                        content:'Error granting account token: '+data.error
                    })
                }
            }
        });
    }
    this.forceUserAccountUpdate=function(cb){
        var self=this;
        $('body').alert({
            //content:'<div style="margin-top:10px;padding:10px 20px;font-size:16px;text-align:left;">Your account is no longer active.<br/><br/>Please update your account settings if you would like to continue using Nectar.</div>',
            template:'user_update',
            tempdata:{
                status:self.store.profile.status
            },
            closer:false,
            smallButtons:[{
                btext:'Contact Us',
                bclass:'x_contact'
            }],
            buttons:[{
                btext:'<i class="icon-gear"></i> Update Account',
                bclass:'x_update'
            },{
                btext:'<i class="icon-logout"></i> Log Out',
                bclass:'x_logout'
            }],
            binding:function(ele){
                ele.find('.x_contact').stap(function(){
                    app.sendEmail({
                        to:['love@nectar.earth'],
                        subject:'Account Management Issue'
                    })
                },1,'tapactive');
                ele.find('.x_logout').stap(function(){
                    self.logout(1,function(){
                        $('#wrapper').show();
                        $.fn.alert.closeAlert();
                    });
                },1,'tapactive');
                ele.find('.x_update').stap(function(){
                    ele.find('.x_update').find('i').removeClass('icon-logout').addClass('icon-refresh animate-spin');
                    self.secureLinkToWeb(app.domain+'/account/',function(){
                        ele.find('.x_update').find('i').addClass('icon-logout').removeClass('icon-refresh animate-spin');
                    });
                },1,'tapactive');
            }
        })
        app.doneLoading();//ensure loading finishes
        app.delayedCB=function(){
            self.onLogin(true,cb);
            //only by defult do this 
            self.permissions.hasPermission('geolocation',function(available){
                if(available){
                    app.location.init();//do not want this to show
                }
            })
        }
    }
    this.needsOnboarding=function(){
        var ob=modules.prefs.get('onboard',0);
        if(window._editor) return true;
        if(ob&&!app.isdev) return false;
        //if(ob) return false;
        return true;
    }
    this.load=function(data,cb,loadOnly){
        var self=this;
        if(data&&data.profile){
            self.profile=self.store.profile=data.profile;
            if(data.schema){
                self.schema=self.store.schema=data.schema;
            }else if(app.loadData&&app.loadData.schema){
                self.schema=app.loadData.schema;
            }
            localStorage.setVar('token',self.store.profile._id);//store for reload..
            self.token=self.store.profile._id;
            self.loadGA();
            if(!loadOnly) self.onLogin(true,cb);
            else if(cb) cb(true);
        }else{
            self.token='';
            localStorage.setVar('token','');//store for reload..
            if(cb) cb(false);
        }
    }
    this.loadGA=function(){
        var self=this;
        if(app.nointernet) return false;
        if(app.gaid&&!self.galoaded){
            self.galoaded=1;
            (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
              (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
              m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
              })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
              if(isPhoneGap()){
                  ga('create', app.gaid,{
                     'storage': 'none',
                     'clientId':self.store.profile.id
                     });
                  ga('set', 'checkProtocolTask', null); // Disable file protocol checking.
                  ga('set','checkStorageTask',null);
              }else{
                ga('create', app.gaid);
            }
        }
    }
    this.setPage=function(path){
        if(app.gaid&&window.ga){
            ga('set', 'page', path);
            ga('send', 'pageview');
        }
    }
    this.reload=function(cb){
        if(app.home) app.home.clear();
        self.get(function(loggedin,skip){
            self.reRender();
        });
    }
    this.reRender=function(cb){
        $('#wrapper').show();
        if(self.store.profile){
            app.home=new modules.home({});
            modules.viewdelegate.init();//do this before a push notification triggers
            if(cb) cb();
        }else{
            var w=new modules.welcome();
            w.show();
        }
    }
    this.checkIfAccountExists=function(type,cb){
        modules.api({
            url: app.sapiurl+'/user/hasaccount', 
            data:{
                type:type
            },
            timeout:5000,
            callback:function(data){
                if(data.success){
                    if(data.hasaccount){
                        cb(true)
                    }else{
                        cb(false,'Could not find account, please try again or create an account if you havent.');
                    }
                }else{
                    cb(false,data.error);
                }
            }
        });
    }
    this.ensureAccountCreation=function(opts){
        $('body').alert({
            icon:'icon-info-circled-alt',
            image:false,
            closer:false,
            buttons:false,
            content:'<div style="padding:10px;text-align:left;"><div style="font-size:20px;">Please create an account on Cobot to access your ONE|Riverside perks.  <br/><br/>Please use the email<br/><b>'+app.user.profile.email+'</b><br/> to link your account.</div><div style="padding-top:40px;padding-bottom:20px;"><div style="text-align:center;" class="button1 l-corner-all x_create">Create Account!</div></div><div style="padding-top:0px;padding-bottom:20px;"><div style="text-align:center;" class="x_check">Check Account</div></div></div>',
            binding:function(ele){
                ele.find('.x_check').stap(function(){
                    self.checkIfAccountExists(opts.type,function(exists,err){
                        if(exists){
                            $.fn.alert.closeAlert();
                        }else{
                            modules.toast({
                                content:err
                            })
                        }
                    });
                },1,'tapactive');
                ele.find('.x_create').stap(function(){
                    if(opts.url){
                        _.openLink({
                            intent:opts.url
                        },{
                            closed:[function(){
                                self.checkIfAccountExists(opts.type,function(exists,err){
                                    if(exists){
                                        $.fn.alert.closeAlert();
                                    }else{
                                        modules.toast({
                                            content:err
                                        })
                                    }
                                });
                            }]
                        })
                    }
                },1,'tapactive');
            }
            
        })
    }
    this.logoutAction=function(cb){
        var self=this;
        if(phi.reset) phi.reset(1);
        if(modules.prefs) modules.prefs.clear();
        localStorage.clear();//just drop everything...
        if(app.core) app.core.setBadge(0);//clear
        //stop all global sockets
        if(self.socket){
            self.socket.off('relay',self.onMessage);
            if(app.isdev) self.socket.off('dev_channel',self.onDevMessage);
            if(app.home&&app.home.badge){
                self.socket.off('badge',app.home.badge.onMessage);
            }
            if(!isPhoneGap()) self.socket.off('relay_web',self.onWebPush);
        }
        window.udid=false;//allow push to register with new person
        self.profile=self.store.profile=false;
        localStorage.setVar('token','');//clear out token!
        self.token=false;//remove token too!
        modules.api({
            caller:'Logout',
            url: app.sapiurl+'/user/logout', 
            data:{
                did:window.udid,
                cid:window.cid
            },
            timeout:10000,
            callback:function(data){
                self.token='';
            }
        });
        if(cb) cb();
        if(options.onLogout) options.onLogout();
    }
    this.update=function(save,cb){
        modules.api({
            url:app.sapiurl+'/user/update',
            data:{data:save},
            timeout:5000,
            callback:function(resp){
                if(resp.success){
                    self.setData(save);
                    cb(true);
                }else{
                    cb(false,resp.error)
                }
            }
        });
    }
    this.save=function(collection,save,cb){
        modules.api({
            url:app.sapiurl+'/user/save',
            data:{data:save,collection:collection},
            timeout:5000,
            callback:function(resp){
                if(resp.success){
                    cb(true);
                }else{
                    cb(false,resp.error)
                }
            }
        });
    }
    this.logout=function(force,cb){
        //confirm!
        if(force){
            self.logoutAction(cb);
        }else{
            var ma=new modules.alertdelegate({
                display:{
                    alert:{
                        content:'Are you sure you want to log out of '+app.name+'?'
                    }
                },
                title:'Log Out of '+app.name+'?',
                closer:true,
                menu:[{
                    id:'yes',
                    //icon:'icon-thumbs-up',
                    name:'Yes'
                },{
                    id:'no',
                    //icon:'icon-ban',
                    name:'No'
                }],
                onEndAnimationSelect:function(id){
                    if(id=='yes'){
                        self.logoutAction(cb)
                    }
                }
            });
            ma.show();
        }
    }
    self.init();
}