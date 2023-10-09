window.phone={//basic phone interactions/commands
	version:2,
    hash:'',
	log:function(msg){
		console.log('[PHONE] '+msg);
	},
    call:function(number){
        if(typeof number =='object'){
            number=number.code+number.number;
        }
        if(isPhoneGap()){
            window.plugins.CallNumber.callNumber(function(){}, function(){
                _alert('error calling');
            }, number, 1);
        }else{
            console.log('calling not enabled');
        }
    },
    calendar:{
        name:'ONE|Boulder',
        getDefaultCalendar:function(cb){
            var self=this;
            self.getCalendar(cb,false,false,1);
        },
        clearDefaultCalendar:function(){
            modules.prefs.set('default_calendar','');
            modules.prefs.set('default_calendar_skip',1)
        },
        linkCalendar:function(cb){
            var self=this;
            self.getCalendar(function(calendar){
                //set default calendar!
                if(calendar){
                    modules.prefs.set('default_calendar_skip','');
                    modules.prefs.set('default_calendar',calendar.id);
                    //self.ensureLocalCalendar();
                    cb(calendar);
                }else{
                    cb(false)
                }
            });
        },
        ensureLocalCalendar:function(){
            var self=this;
            if(!isPhoneGap()) return false;
            if(modules.prefs.get('default_calendar_skip')){
                console.log('===skipping calendar sync')
                return false;
            }
            // if(!modules.prefs.get('default_calendar')){
            //     console.log('===skipping, no default calendar set')
            //     self.linkCalendar(function(picked){
            //         if(!picked) self.ensureLocalCalendar();
            //     })
            //     return false;
            // }
            //read last update and sync whatever is needed!
            modules.api({
                url: app.sapiurl+'/module/calendar/feed',
                data:{
                    laston:'tsu',
                    last:self.getLast(),
                    calendarsync:1//ensures we dont pull events that started more than a day ago
                },
                callback:function(resp){
                    if(resp.success&&resp.data&&resp.data.order&&resp.data.order.length){
                        //add in!
                        self.getCalendar(function(calendar){
                            //set default calendar!
                            if(!calendar) return false;
                            modules.prefs.set('default_calendar',calendar.id);
                            var st=new Date().getTime();
                            var updates=[];
                            //if(app.isdev||app.user.profile.admin) _alert('updating: '+resp.data.order.length+' items');
                            $.each(resp.data.list,function(i,v){
                                var opts={
                                    id:v.event.id,
                                    title:v.event.name,
                                    eventLocation:(v.event.venue_info)?v.event.venue_info.name:(v.event.location&&v.event.location.info)?_.location.getName(v.event.location.info,'simple'):'',
                                    notes:(v.event.description)?v.event.description:'',
                                    startDate:new Date(v.event.start*1000),
                                    calendar:calendar
                                }
                                var type=v.rsvp;
                                if(v.event.end) opts.endDate=new Date(v.event.end*1000);
                                else opts.endDate=moment(new Date(v.event.start*1000)).add(60, 'm').toDate()
                                updates.push(function(cb){
                                    if(type=='notgoing'||type=='cantgo'){
                                        self.deleteEvent(opts,function(update){
                                            if(app.isdev||app.user.profile.admin){
                                               //if(update) _alert('deleted')
                                            }
                                            cb();
                                        })
                                    }else{
                                        self.editEvent(opts,1,cb);
                                    }
                                })
                            })
                            if(updates.length) async.series(updates,function(){
                                var et=new Date().getTime();
                                var diff=et-st;
                                self.setLast(resp.data.last);//tsu
                                if(app.isdev||app.user.profile.admin) modules.toast({icon:'icon-calendar',content:'updated: '+resp.data.order.length+' items in '+diff+' ms'});
                                modules.toast({icon:'icon-calendar',content:resp.data.order.length+' Updated events to your phones calendar!'});
                            })
                            //set last!
                        },{
                            getDefault:true,
                            title:'Set Default Calendar'
                        });
                    }
                }
            });
        },
        getCalendarData:function(data){
            var list={
                list:{
                    local:{
                        name:'Local Calendars',
                        list:{},
                        order:[]
                    },
                    recent:{
                        name:'Recently Used Calendars',
                        list:{},
                        order:[]
                    },
                    syncable:{
                        name:'Online Calendars',
                        list:{},
                        order:[]
                    }
                },
                order:['recent','syncable','local']
            }
            var tdata={};
            $.each(data,function(i,v){
                if(app.device=='iOS'){
                    if(v.type!='Subscription'){
                        if(v.type=='CalDAV'){
                            list.list.syncable.order.push(v.id);
                            list.list.syncable.list[v.id]=v;
                        }
                        if(v.type=='Local'){
                            list.list.local.order.push(v.id);
                            list.list.local.list[v.id]=v;
                        }
                        tdata[v.id]=v;
                    }
                }
                if(app.device=='Android'){
                    list.list.syncable.order.push(v.id);
                    list.list.syncable.list[v.id]=v;
                    tdata[v.id]=v;
                }
            })
            var cals=modules.prefs.get('recent_calendars');
            if(cals&&cals.length){
                $.each(cals,function(i,v){
                    if(v&&tdata[v]){
                        list.list.recent.order.push(tdata[v].id);
                        list.list.recent.list[tdata[v].id]=tdata[v];
                    }
                })
            }
            return list;
        },
        setRecent:function(calendar){
            var cals=modules.prefs.get('recent_calendars');
            if(!cals) cals=[];
            var cindex=cals.indexOf(calendar.id);
            if(cindex>=0) cals.splice(cindex,1);
            cals.unshift(calendar.id);
            modules.prefs.set('recent_calendars',cals);
        },
        testCalendar:function(){
            var alert=new modules.mobilealert({
                contentTemplate:'mobilealert_calendar_picker',
                data:{
                    title:'Add To Calendar',
                    closer:true,
                    calendars:{
                        list:{
                            local:{
                                name:'Local Calendars',
                                list:{
                                    test:{
                                        id:'test',
                                        name:'Test'
                                    }
                                },
                                order:['test']
                            },
                            recent:{
                                name:'Recently Used Calendars',
                                list:{
                                    test:{
                                        id:'test',
                                        name:'Test'
                                    }
                                },
                                order:['test']
                            },
                            syncable:{
                                name:'Online Calendars',
                                list:{
                                    test:{
                                        id:'test',
                                        name:'Test'
                                    }
                                },
                                order:['test']
                            }
                        },
                        order:['recent','syncable','local']
                    }
                },
                onSelect:function(id){
                    //set default
                    var opts=_.getByKey(data,id,'id');
                    self.setRecent(opts);
                    cb(opts);
                }
            });
            alert.show();
        },
        promptCalendar:function(cb,topts){
            var self=this;
            var alert1=new modules.mobilealert({
                title:'Sync My Events!',
                subtitle:'Would you like to sync your Event calendar to a calendar on your phone?',
                closer:true,
                menu:[{
                    id:'yes',
                    name:'Yes'
                },{
                    id:'no',
                    name:'No'
                }],
                onSelect:function(id){
                    //set default
                   if(id=='yes'){
                    self.getCalendar(cb,topts,1);
                   }
                   if(id=='no'){
                    modules.prefs.set('default_calendar_skip',1);
                    cb(false);
                   }
                },
                onExit:function(){
                    cb(false);
                }
            });
            alert1.show();
        },
        getCalendar:function(cb,topts,force,silent){
            var self=this;
            var tdefault=modules.prefs.get('default_calendar');
            if(silent&&!tdefault){
                return cb(false);
            }
            if(!tdefault&&!force){
                if(silent){
                    return cb(false);
                }
                self.promptCalendar(cb,topts);
                return false;
            }else{
                window.plugins.calendar.listCalendars(function(data){
                    var use_default=false;
                    $.each(data,function(i,v){
                        if(tdefault&&v.id==tdefault) use_default=tdefault;
                    })
                    if(use_default){
                        var opts=_.getByKey(data,use_default,'id');
                        if(!silent) self.setRecent(opts);
                        cb(opts);
                    }else if(!silent){
                        if(topts&&topts.getDefault&&!force){
                            self.promptCalendar(cb,topts);
                            return false;
                        }
                        var alert=new modules.mobilealert({
                            title:(topts&&topts.title)?topts.title:'Add To Calendar',
                            closer:true,
                            contentTemplate:'mobilealert_calendar_picker',
                            data:{
                                calendars:self.getCalendarData(data),
                            },
                            onSelect:function(id){
                                //set default
                                var opts=_.getByKey(data,id,'id');
                                self.setRecent(opts);
                                cb(opts);
                            },
                            onExit:function(){
                                cb(false);
                            }
                        });
                        alert.show();
                    }
                },function(){
                    onerror('error with calendar');
                    cb(false);
                });
            }
        },
        setLast:function(val){
            modules.prefs.set('last_calendar',val);
        },
        getLast:function(){
            return (modules.prefs.get('last_calendar'))?modules.prefs.get('last_calendar'):'';
        },
        ensureCalendar:function(name,cb){
            var self=this;
            if(app.device=='iOS'){
                if(!name) name=self.name;
                var createCalOptions = window.plugins.calendar.getCreateCalendarOptions();
                createCalOptions.calendarName = name;
                createCalOptions.calendarColor = "#FF0000"; // an optional hex color (with the # char), default is null, so the OS picks a color
                window.plugins.calendar.createCalendar(createCalOptions,function(d){
                    _alert(JSON.stringify(d));
                },function(){
                    _alert('error creating calendar!');
                });
            }else{//android doesnt support
                cb({
                    id:1
                });
            }
        },
        deleteCalendar:function(name){
            if(!window.plugins||!window.plugins.calendar) return false;
            window.plugins.calendar.deleteCalendar(name,function(){
                _alert('successfully deleted calendar')
            },function(){
                _alert('error deleting calendar')
            });
        },
        addEvent:function(opts,update,silent,cb){
            var self=this;
            if(!window.plugins||!window.plugins.calendar){
                if(cb) cb();
                return false;
            }
            //silent=true;
            //self.ensureCalendar(false,function(){
            //     var calOptions = window.plugins.calendar.getCalendarOptions(); // grab the defaults
            //     calOptions.firstReminderMinutes = 120; // default is 60, pass in null for no reminder (alarm)
            //     calOptions.secondReminderMinutes = 5;
            //       // Added these options in version 4.2.4:
            //     //calOptions.recurrence = "monthly"; // supported are: daily, weekly, monthly, yearly
            //     //calOptions.recurrenceEndDate = new Date(2016,10,1,0,0,0,0,0); // leave null to add events into infinity and beyond
            //     calOptions.calendarName = self.name; // iOS only
            //     //calOptions.calendarId = 1; // Android only, use id obtained from listCalendars() call which is described below. This will be ignored on iOS in favor of calendarName and vice versa. Default: 1.

            //       // This is new since 4.2.7:
            //     //calOptions.recurrenceInterval = 2; // once every 2 months in this case, default: 1

            //       // And the URL can be passed since 4.3.2 (will be appended to the notes on Android as there doesn't seem to be a sep field)
            //     //calOptions.url = "https://www.google.com";
            //     calOptions.id =opts.id;
                  // on iOS the success handler receives the event ID (since 4.3.6)
                //window.plugins.calendar.createEvent(opts.title,opts.eventLocation,opts.notes,opts.startDate,opts.endDate,function(message){
                var calOptions = window.plugins.calendar.getCalendarOptions();
                calOptions.firstReminderMinutes=15;
                calOptions.id=opts.id;
                if(opts.calOptions){
                    calOptions=$.extend(true,{},calOptions,opts.calOptions);
                }
                if(opts.calendar){
                    if(app.device=='iOS'){
                        calOptions.calendarName=opts.calendar.name // iOS only
                    }
                    if(app.device=='Android'){
                        calOptions.calendarId=opts.calendar.id // Android only
                    }
                }else{
                    return self.getCalendar(function(calendar){
                        if(calendar){
                            opts.calendar=calendar;
                            self.addEvent(opts,update,silent,cb);
                        }
                    });
                }
                //_alert(JSON.stringify(calOptions))
                window.plugins.calendar.createEventWithOptions(opts.title,opts.eventLocation,opts.notes,opts.startDate,opts.endDate,calOptions,function(message){
                    // if(app.device=='iOS'){
                    //     var filterOptions = window.plugins.calendar.getCalendarOptions(); // or {} or null for the defaults
                    //     filterOptions.calendarName = self.name; // iOS only
                    //     var newOptions = window.plugins.calendar.getCalendarOptions();
                    //     newOptions.firstReminderMinutes = 120; // default is 60, pass in null for no reminder (alarm)
                    //     newOptions.secondReminderMinutes = 5;
                    //     window.plugins.calendar.modifyEventWithOptions(opts.title,opts.eventLocation,opts.notes,opts.startDate,opts.endDate,opts.title,opts.eventLocation,opts.notes,opts.startDate,opts.endDate,filterOptions,newOptions,function(){
                    //         _alert('set')
                    //     },function(){
                    //         _alert('error modifying event');
                    //     });
                    // }
                    modules.prefs.set('event.'+opts.id,{
                        id:message,
                        opts:self.getOpts(opts)
                    })
                    if(!silent){
                        modules.toast({
                            icon:'icon-thumbs-up',
                            content:(update)?'Successfully updated the event on your calendar':'Successfully added the event to your calendar!'
                        })
                    }
                    if(cb) cb();
                },function(message){
                    if(app.isdev) _alert("Error: " + message); 
                    onerror('Error syncing calendar: '+message);
                    if(cb) cb();
                });
                //window.plugins.calendar.createEvent(opts.title,opts.eventLocation,opts.notes,opts.startDate,opts.endDate,success,error);
                //window.plugins.calendar.createEventInteractively(title,eventLocation,notes,startDate,endDate,success,error);
            //})
        },
        deleteEvent:function(opts,cb){
            var self=this;
            if(!window.plugins||!window.plugins.calendar) return false;
            var ev=modules.prefs.get('event.'+opts.id);
            if(ev){
               var oldopts=self.parseOpts(ev.opts);//always try to delte
                //_alert('dlete: '+opts.id+' old'+oldopts.id);
                window.plugins.calendar.deleteEventById(ev.id,false,function(){
                    if(cb) cb(true);
                },function(message){
                    if(app.isdev||app.user.profile.admin) _alert('error: '+message)
                    if(cb) cb(false);
                });
            }else{
                if(cb) cb(false);
            }
            // if(app.device=='iOS'){
            //     window.plugins.calendar.deleteEventFromNamedCalendar(oldopts.title,null,null,oldopts.startDate,oldopts.endDate,oldopts.calendar.name,function(msg){
            //         if(cb) cb();
            //     },function(){
            //         _alert('failed removing event');
            //     })
            // }else{
            //     window.plugins.calendar.deleteEvent(oldopts.title,null,null,oldopts.startDate,oldopts.endDate,function(msg){
            //         if(cb) cb();
            //     },function(){
            //         _alert('failed removing event');
            //     });
            // }
        },
        editEvent:function(opts,silent,cb){
            var self=this;
            var ev=modules.prefs.get('event.'+opts.id);
            var oldopts=self.parseOpts(ev.opts);
            //calOptions.id=opts.id;
            if(_.size(oldopts)||true){//always try to delete, wont hurt
                self.deleteEvent(opts,function(update){
                    self.addEvent(opts,update,silent,cb);//re-add new one!
                })
                // window.plugins.calendar.deleteEvent(oldopts.title,null,null,oldopts.startDate,oldopts.endDate,function(msg){
                //     self.addEvent(opts,1);//re-add new one!
                // },function(){
                //     _alert('failed removing event');
                // });
            }else{
                self.addEvent(opts,false,1,cb);
            }
        },
        getOpts:function(opts){
            var topts=$.extend(true,{},opts);
            if(topts.startDate) topts.startDate=topts.startDate.getTime();
            if(topts.endDate) topts.endDate=topts.endDate.getTime();
            return topts;
        },
        parseOpts:function(opts){
            var topts=$.extend(true,{},opts);
            if(topts.startDate) topts.startDate=new Date(parseInt(topts.startDate,10)-(1000*60*60*24));//give some space
            if(topts.endDate) topts.endDate=new Date(parseInt(topts.endDate,10));
            if(!topts.endDate&&topts.startDate) topts.endDate=moment(topts.startDate).add((60*60*24), 'm').toDate();
            return topts;
        },
        editTestEvent:function(){
            var self=this;
            self.editEvent({
                id:'test_id',
                title:'*new* Test Event *edited*',
                eventLocation:'57 Acorn Lane',
                notes:'boulder',
                startDate:new Date(),
                endDate:moment(new Date()).add(60, 'm').toDate()
            }); 
        },
        addTestEvent:function(id){
            var self=this;
            self.addEvent({
                id:'test_id',
                title:'Test Event 1',
                eventLocation:'Home',
                notes:'notes',
                startDate:new Date(),
                endDate:moment(new Date()).add(60, 'm').toDate()
            });
        }
    },
    location:{
        start:function(){
            var self=this;
            self.loadIpLocation();
        },
        data:{
            ip:false,
            geo:false
        },
        getName:function(data,type){
            var s='';
            if(!data) return '';
            data.info=modules.geocode.getText(data);
            if(!data.info) return '';
            switch(type){
                case 'simple'://general
                    s=data.place_name;
                break;
                case 'city_simple':
                    if(data.info.text) s+=data.info.text;
                break;
                case 'city':
                    if(data.info.text) s+=data.info.text;
                    if(data.info.region) s+=', '+data.info.region;
                    else if(data.info.country) s+=', '+data.info.country;
                break;
                case 'city_full':
                    if(data.info.text) s+=data.info.text;
                    if(data.info.region) s+=', '+data.info.region;
                    if(data.info.country) s+=', '+data.info.country;
                break;
                default:
                    s=data.info[type];
                break;
            }
            return s;
        },
        getNearestLocation:function(){
            var self=this;
            if(self.data.geo) return self.data.geo;//best
            if(self.data.ip) return self.data.ip;//second best
            //return user city preference?
            return false;
        },
        init:function(retry){
            var self=this;
            if(self.initd){
                console.trace();
                return false;
            } 
            if(isPhoneGap()){
                self.get(function(data){
                    self.data.geo=data;
                    self.initd=true;
                    //console.log('===>initial location set');
                },function(){
                    setTimeout(function(){
                        self.init(1);//keep on trying
                    },10000)
                })
            }
        },
        loadIpLocation:function(){
            var self=this;
            modules.api({
                url:app.sapiurl+'/iplocation',
                data:{},
                success:function(resp){
                    if(resp.success){
                        self.data.ip=resp.data;
                    }else{
                        console.warn('error loading iplocation information');
                    }
                }
            });
        },
        get:function(cb,fcb){
            var self=this;
            if(self.locating){
                return false;
            }else{
                self.locating=true;
                self.locate(function(pos,err){
                    if(pos){
                        self.current=pos;
                        cb(self.current);
                    }else{
                       fcb();
                    }
                    self.locating=false;
                })
            }
        },
        locate:function(cb){
            var self=this;
            if(navigator.geolocation){
                self.nto=setTimeout(function(){
                    if(!self.geoloaded){
                       cb(false,'We could not find your location');
                    }
                },5000);
                self.geoloaded=0;
                navigator.geolocation.getCurrentPosition(function(position){
                    //override
                    if(self.nto) clearTimeout(self.nto);
                    self.geoloaded=1;
                    if(position.coords){
                        if(position.coords.accuracy < 1000){
                            app.currentLocation={lat:position.coords.latitude,lng:position.coords.longitude};
                            return cb({lat:position.coords.latitude,lng:position.coords.longitude})
                        }
                    }
                    return cb(false,'We could not find your location');
                });
            }else{
                cb(false,'We could not find your location');
            }
        }
    },
    badge:{
        listening:0,
        init:function(options){
            phone.badge.options=$.extend(true,{
                notificationEle:[],
                notificationBadge:[],
                chatEle:[],
                chatBadge:[]
            },options);
            phone.badge.load();
            if(!phone.badge.listening&&app.user.socket) app.user.socket.on('badge',phone.badge.onMessage);
            phone.badge.listening=1;
        },
        onResume:function(){
            phone.badge.load();
        },
        load:function(){
            modules.api({
                url:app.sapiurl+'/user/badge',
                data:{
                },
                retry:4,
                success:function(resp){
                    phone.badge.data=resp.data;
                    phone.badge.set();
                }
            });
        },
        onMessage:function(msg){
            switch(msg.type){
                case 'update':
                    if(phone.badge.data){
                        phone.badge.data[phone.badge.getIdentity(msg.identity)]=msg.data;
                        phone.badge.set();
                    }
                break;
            }
        },
        removeChat:function(id){
            if(!phone.badge.data){
                console.log('wait to clear!');
                setTimeout(function(){
                    phone.badge.removeChat(id);//will retry until it works
                },500);
                return false;
            }
            if(phone.badge.data[phone.badge.getIdentity(app.user.profile.id)].chat&&phone.badge.data[phone.badge.getIdentity(app.user.profile.id)].chat[id]) delete phone.badge.data[phone.badge.getIdentity(app.user.profile.id)].chat[id];
            phone.badge.data[phone.badge.getIdentity(app.user.profile.id)].chat_count=phone.badge.countChats();
            phone.badge.set();
        },
        countChats:function(){
            var c=0;
            if(phone.badge.data.chat&&_.size(phone.badge.data.chat)) $.each(phone.badge.data.chat,function(i,v){
                c+=v;
            })
            return c;
        },
        getIdentity:function(id){
            if(!id){
                window.debugTrace();
                onerror('Invalid getIdentity ID: ['+id+']');
                return false;
            }
            if(id[0]=='G'){
                return id+'_'+app.user.profile.id;
            }else return id;
        },
        getTotal:function(skip_identity){
            var c=0;
            if(phone.badge.data){
                $.each(phone.badge.data,function(i,v){
                    if(!skip_identity||(skip_identity&&i!=phone.badge.getIdentity(app.user.profile.id))){
                        c+=v.notification;
                        c+=v.chat_count;
                    }
                })
            }
            return c;
        },
        getChatCount:function(id){
            if(!phone.badge.data){
                console.warn('no badge data!')
                return 0;
            }
            if(phone.badge.data[phone.badge.getIdentity(app.user.profile.id)]&&phone.badge.data[phone.badge.getIdentity(app.user.profile.id)].chat&&phone.badge.data[phone.badge.getIdentity(app.user.profile.id)].chat[id]) return phone.badge.data[phone.badge.getIdentity(app.user.profile.id)].chat[id];
            return 0;
        },
        set:function(set){
            //console.log('SET BADGE',phone.badge.data,phone.badge.getIdentity(app.user.profile.id));
            if(!phone.badge||!phone.badge.options){
                onerror('badge not initialized');
                return false;
            }
            if(!phone.badge.data) return false;
            if(set) phone.badge.data=set;
            var data=phone.badge.data[phone.badge.getIdentity(app.user.profile.id)];
            //console.log(data,phone.badge.options)
            if(data){
                if(data.notification){
                    if(data.notification>99) data.notification=99;//dont let go over 99
                    phone.badge.options.notificationEle.html(data.notification);
                    phone.badge.options.notificationBadge.show();
                }else{
                    phone.badge.options.notificationBadge.hide();
                }
                if(data.chat_count){
                    if(data.chat_count>99) data.chat_count=99;//dont let go over 99
                    phone.badge.options.chatEle.html(data.chat_count);
                    phone.badge.options.chatBadge.show();
                }else{
                    phone.badge.options.chatBadge.hide();
                }
            }else{
                phone.badge.options.notificationBadge.hide();
                phone.badge.options.chatBadge.hide();
            }
            if(isPhoneGap()) cordova.plugins.notification.badge.set(phone.badge.getTotal());
            // var othertotal=phone.badge.getTotal(1);
            // if(othertotal){
            //     if(othertotal>99) othertotal=99;//dont let go over 99
            //     $('.othernotifications').html(othertotal);
            //     $('.othernotificationsalert').show();
            // }else{
            //     $('.othernotificationsalert').hide();
            // }
            // //clear out old chat counts
            // if(self.pages.chats){
            //     self.pages.chats.updateBadges();
            // }else{
            //     //console.warn('Chats doesnt exist yet!')
            // }
        }
    },
    camera:{
        get:function(opts,cb,err){
            var galleryOpts={};
            if(opts.sourceType==Camera.PictureSourceType.CAMERA){
                galleryOpts={
                    maximumImagesCount: 1,
                    mode:'CameraOnly'
                }
            }
            if(opts.sourceType==Camera.PictureSourceType.PHOTOLIBRARY){
                galleryOpts={
                    maximumImagesCount: 1,
                    mode:'LibraryOnly'
                }
            }
            if(app.device=='Android'&&opts.sourceType==Camera.PictureSourceType.CAMERA){
                navigator.camera.getPicture(cb, err,opts);
            }else{
                self.mediapicker=new modules.mediapicker({
                    galleryOpts:galleryOpts,
                    onError:function(){
                        err();
        
                    },
                    onExit:function(){
                        err();
                    },
                    onPick:function(uris){
                        var path=uris[0];
                        cb(path);
                    }
                });
            }
        },
        getPicture:function(opts){
            var self=this;
            if(!opts.type||opts.type=='both'){
                //mobilealert
                var menu=[{
                    id:'camera',
                    icon:'icon-camera-thin',
                    name:'Use Camera'
                },{
                    id:'library',
                    icon:'icon-images',
                    name:'Photo Library'
                }];
                var alert=new modules.mobilealert({
                    menu:menu,
                    body:opts.body,
                    ele:$('body'),
                    zIndex:100000000,
                    onExit:function(){
                        if(opts.onExit) opts.onExit();
                    },
                    onEndAnimationSelect:function(id){
                        var topts={}
                        if(id=='camera'){
                            phone.statusBar.set('dark');
                            topts={
                                quality: 50,
                                mediaType: Camera.MediaType.PICTURE,
                                destinationType: Camera.DestinationType.FILE_URI,
                                sourceType:Camera.PictureSourceType.CAMERA,
                                correctOrientation:1
                            }
                        }
                        if(id=='library'){
                            phone.statusBar.set('dark');
                            topts={ 
                                quality: 50,
                                destinationType: Camera.DestinationType.FILE_URI,
                                sourceType:Camera.PictureSourceType.PHOTOLIBRARY,
                                correctOrientation:1
                            }
                        }
                        topts.onExit=opts.onExit;
                        if(_.size(topts)) self.get(topts,function(imgdata){
                            phone.statusBar.ensure();
                            if(opts.cb) opts.cb(imgdata);
                        },function(){
                            if(opts.onExit) opts.onExit();
                            phone.statusBar.ensure();
                        })
                    }
                });
                alert.show();
                return false;
            }
            var topts={};
            if(opts.type=='library'){
                phone.statusBar.ensure();
                 topts={ quality: 80,
                    destinationType: Camera.DestinationType.FILE_URI,
                    sourceType:Camera.PictureSourceType.PHOTOLIBRARY,
                    //encodingType : Camera.EncodingType.PNG,
                    correctOrientation:1
                }
            }
            if(opts.type=='camera'){
                topts={ quality: 80,
                    destinationType: Camera.DestinationType.FILE_URI,
                    sourceType:Camera.PictureSourceType.CAMERA,
                    //encodingType : Camera.EncodingType.PNG,
                    correctOrientation:1
                }
            }
            if(_.size(topts)) self.get(topts,function(imgdata){
                phone.statusBar.ensure();
                if(opts.cb) opts.cb(imgdata);
            },function(){
                phone.statusBar.ensure();
                if(opts.onExit) opts.onExit();
            })
        },
        uploadimg:function(imageURI,opts,fileobj,cb){
            if(!isPhoneGap()) return false;
            var options = new FileUploadOptions();
            options.fileKey="file";
            options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
            options.mimeType="image/jpeg";
            options.params = opts.data;
            options.chunkedMode = false;
            var ft = new FileTransfer();
            // var progcent=opts.ele.find('.uploadsize');
            // var progbar=opts.ele.find('.progbar');
            // progbar.css('width','0%');
            ft.onprogress = function(progressEvent) {
                if (progressEvent.lengthComputable) {
                    var p=parseInt((progressEvent.loaded / progressEvent.total)*100,10);
                    // progbar.css('width',p+'%');
                    // progcent.html(p+'%');
                    console.log('Upload progress ['+p+'%]',1);
                    if(opts.onProgress) opts.onProgress(p,fileobj);
                    if(p==100){       
                    }
                }
            };
            var s=$.extend(true,[],options.params.sizes);
            options.params.sizes=s.join(',');
            ft.upload(imageURI, app.uploadurl+'/upload/image/submit', function(success){
                console.log(success,1);
                var r=JSON.parse(success.response);
                //_alert(JSON.stringify(r))
                if(r&&r.path){
                    cb({
                        path:r.path,
                        ext:r.ext,
                        ar:r.ar,
                        v:r.v
                    })
                }else{//error
                    cb(false);
                }
            }, function(fail){
                //alert('Error uploading image');
                cb(false);
            }, options);
            return ft;
        }
    },
    orientation:{
        init:function(){
            var self=this;
            window.addEventListener("orientationchange", function(){
                //_alert(screen.orientation.type); // e.g. portrait
            });
            self.lock();
        },
        lock:function(){
            if(isPhoneGap()){
                if(window.screen&&window.screen.orientation&&window.screen.orientation.lock){
                    window.screen.orientation.lock('portrait-primary')
                }
            }
        },
        unlock:function(){
            if(isPhoneGap()){
                if(window.screen&&window.screen.orientation&&window.screen.orientation.unlock){
                    window.screen.orientation.unlock()
                }
            }
        }
    },
    parseURL:function(url){
        var path=url.replace(app_conf.app_scheme+':/','');
        if(path) app.history.go(path);
    },
	init:function(){
        phone.location.start();
        phone.hash=Math.uuid(12);
        if(window.amplitude){
            console.log('**** starting amplitude')
            amplitude.getInstance().logEvent('['+app.domain+'] Page Load');
        }else{
            console.log('**** amplitude not available')
        }
        if(window._editor){
            phone.currentMode='editing';
            $('body').addClass('apptexteditor');
            _.iframe.listenChild(function(e){
                if(e.data&&e.data.update){
                    $('body').find('[data-loc='+e.data.update.key+']').html(e.data.update.content);
                    if(!app.localizations[e.data.update.key]) app.localizations[e.data.update.key]={};
                    app.localizations[e.data.update.key].content=e.data.update.content;
                }
                if(e.data&&e.data.mode){
                    if(e.data.mode=='preview'){
                        $('body').removeClass('apptexteditor');
                    }else{
                        $('body').addClass('apptexteditor');
                    }
                    phone.currentMode=e.data.mode;
                }
            })
            $('body').on('mouseover',function(ev){
                if(phone.currentMode!='editing') return true;
                if($(ev.target).hasClass('locinfo')){
                    //console.log('mouseover!')
                    _.iframe.sendParent({
                        key:$(ev.target).attr('data-loc'),
                        complex:($(ev.target).attr('data-complex'))?1:0
                    })
                }
                if($(ev.target).parent().hasClass('locinfo')){
                    //console.log('mouseover!')
                    _.iframe.sendParent({
                        key:$(ev.target).parent().attr('data-loc'),
                        complex:($(ev.target).parent().attr('data-complex'))?1:0
                    })
                }
            })
        }
		if(!isPhoneGap()) return false;
        app.parseURL=phone.parseURL;
        //if(app.isdev) _alert('openlink: '+window.applink)
        if(window.applink){
            setTimeout(function(){//kind of hack, be optimistic that rest of app has loaded at this point
                app.parseURL(window.applink);
                window.applink=false;
            },1000)
        }
        phone.orientation.init();
        modules.keyboard_global.init()
        if(modules.bg_upload) phone.bg_uploader=new modules.bg_upload();
        if(window.mobiscroll){
            if(isPhoneGap()){
                if(app.device=='iOS'){
                    mobiscroll.settings = {
                        theme: 'ios'
                    };
                }else{
                    mobiscroll.settings = {
                        theme: 'material'
                    };
                }
            }else{
                mobiscroll.settings = {
                    theme: 'ios'
                };  
            }
        }
		if(window.device){
            if(window.MobileAccessibility){//prevent autoscaling from user
               window.MobileAccessibility.usePreferredTextZoom(false);
            }
            $('body').addClass('isPhoneGap')
            phone.platform=app.platform=device.platform;
            //if(device.platform=='Android') $('body').addClass('AndroidDevice');
            phone.device=app.device=device.platform;
            $('body').addClass('device_'+app.device);
            var vp=window.device.version.split('.');
            var version=parseInt(vp[0]);
            $('body').addClass('version_'+version);
            document.addEventListener("resume",function(){
                var ct=new Date().getTime();
                if(!phone.lastResumeTime||(ct-phone.lastResumeTime)>1000){
                    phi.log('app::resume');
                    app.inForeground=true;
                    phi.onResume();
                    phone.badge.onResume()
                    phone.lastResumeTime=ct;
                }else{
                    phi.log('app::resume (duplicate disabled!)')
                }
            }, false);
            document.addEventListener("pause",function(){
                app.inForeground=false;
                phi.onPause();
            }, false);
            document.addEventListener("backbutton",function(){
                var current=phi.getCurrentView(1);
                if(current&&current.component){
                    if(current.component.goBack){
                        current.component.goBack();
                    }
                }else{
                    navigator.app.exitApp(); 
                }
            }, false);
            app.inForeground=true;
            if(app.device=='iOS'){
                if(version<13){
                    $('body').addClass('device_'+app.device+'_lt13');
                }
                if(cordova.plugins.iosrtc) cordova.plugins.iosrtc.registerGlobals();
                // load adapter.js
                  var script = document.createElement("script");
                  script.type = "text/javascript";
                  script.src = "js/adapter-latest.js";
                  script.async = false;
                  document.getElementsByTagName("head")[0].appendChild(script);
            }
            if(window.StatusBar){//this exact order is needed for android
                phone.statusBar.show();
            }
            if(phone.hasNotch()){
            	$('body').addClass('hasNotch')
            }
            if(phone.hasBottomNotch()){
                $('body').addClass('hasBottomNotch')
            }
            if(phone.isIphoneX()){
                $('body').addClass('iphoneX')
                //$('body').addClass('themecolor');
                $.stap.tolerance=15;
            }
            //if(app.device=='iOS') $.stap.tolerance=.5;//more strict with iOS
            if($(window).width()>600) app.istablet=1;
            if(app.device=='Android'){
                $('body').addClass('isAndroid')
                //app.ensureAndroidPerms();
            }
        }else{
            phone.statusBar.set();
        }
        phone.footerBar.init();
        if(modules.keyboard_global) modules.keyboard_global.init();
	},
    background:{
        clear:function(){
            $('html,body').css('background','transparent');
            $('#wrapper').hide();
        },
        reset:function(){
            $('html,body').css('background','');
            $('#wrapper').show();
        }
    },
    localnotification:{
        bound:0,
        register:function(opts,data){
            var self=this;
            var current=localStorage.getObject('localnotification');
            var id=(opts.id)?opts.id:self.getNotificationId();
            current[id]={
                id:id,
                opts:$.extend(true,{},{
                    id:id,
                    priority:2//used on android for more exact timeing!
                },opts),
                data:(data)?data:{}
            };
            this.run('schedule',{
                opts:current[id].opts
            })
            localStorage.setObject('localnotification',current);
            return id;
        },
        run:function(action,data,cb){//ensures that all operations run in order!
            if(!isPhoneGap()){
                if(cb) return cb();
                return false;
            }
            if(!this.queue){
                this.queue= async.queue(function(task, callback) {
                    console.log('running task ['+task+']')
                    switch(task.action){
                        case 'clearAll':
                            cordova.plugins.notification.local.clearAll(function(){
                                callback();
                            });
                        break;
                        case 'clear':
                            cordova.plugins.notification.local.clear(task.data.id,function(){
                                callback()
                            });
                        break;
                        case 'schedule':
                            cordova.plugins.notification.local.schedule(task.data.opts,function(){
                                callback()
                            });
                        break;
                        default:
                            console.warn('Invalid LocalNotification Queue task');
                            callback();
                        break;
                    }
                }, 1);   
                // assign a callback
                this.queue.drain(function() {
                    console.log('all items have been processed');
                });            
            }
            this.queue.push({
                action:action,
                data:data
            },cb);
        },
        clearAll:function(cb){
            this.run('clearAll',false,cb);
        },
        clear:function(id,cb){
            var self=this;
            var notif=self.get(id);
            if(notif){
                var current=localStorage.getObject('localnotification');
                delete current[id];
                localStorage.setObject('localnotification',current)
                this.run('clear',{
                    id:id
                },cb);
            }
        },
        get:function(id){
            var current=localStorage.getObject('localnotification');
            if(current[id]){
                return current[id];
            }else{
                error('notification ['+id+'] not found');
                return false;
            }
        },
        getNotificationId:function(){
            return Math.floor(Math.random()*10000000);
        },
        bind:function(){
            var self=this;
            self.bound=1;
            if(cordova.plugins.notification&&cordova.plugins.notification.local){
                cordova.plugins.notification.local.on('trigger', function(e){
                    self.handleNotification(e.id);
                });
                cordova.plugins.notification.local.on('click', function(e){
                    self.handleNotification(e.id);
                });
                if(cordova.plugins.notification.local.launchDetails){
                    if(cordova.plugins.notification.local.launchDetails.action=="click"){
                        self.handleNotification(cordova.plugins.notification.local.launchDetails.id)
                    }
                }
            }
        },
        handleNotification:function(id){
            var self=this;
            var current=self.get(id);
            if(current){
                if(current.data.route){
                    app.history.go(current.data.route)
                }
            }
            //_alert(JSON.stringify(current));
        }
    },
	push:{
       // disabled:true,
       testing:true,
        channel:{
            id: "one",
            description: "ONE Push Notifications",
            importance: 5 ,
            visibility:1,
            vibration:1
        },
        // onAppReady:function(){
        //     var self=phone.push;
        //     if(self.currentNotification){
        //         self.onNotification(self.currentNotification);
        //     }
        // },
        init:function(){
            var self=phone.push;
            //if(self.disabled) return false;
            if(!window.PushNotification) return console.warn('No native push code found');
            if(window.device.isVirtual) return console.warn('Simulated device, cannot register push');//dont allow in simulator!
            self.plugin = PushNotification.init({ 
                android:{
                    senderID: app.gcmid,//fix this
                    clearNotifications: false,//dont clear notifications when going to background!
                    iconColor:'#194887',
                    icon:'pushicon'
                },
                ios:{
                    alert: true, 
                    badge: true, 
                    sound: true,
                    categories: {
                      call: {
                        yes: {
                          callback: 'accept',
                          title: 'Accept',
                          foreground: true,
                          destructive: false
                        },
                        no: {
                          callback: 'reject',
                          title: 'Reject',
                          foreground: false,
                          destructive: false
                        }
                      }
                  }
                }, 
                windows: {}
            });
            self.plugin.on('registration', function(data){
                phone.localnotification.bind();
                if(!window.udid){
                    if(cordova.plugins.DeviceMeta&&cordova.plugins.DeviceMeta.getDeviceMeta){
                        cordova.plugins.DeviceMeta.getDeviceMeta(function(device_info){
                            if(device_info.debug) phone.push.sandbox=1;
                            self.registerDevice(data.registrationId,(app.device=='Android')?1:0);
                        })
                    }else{
                        self.registerDevice(data.registrationId,(app.device=='Android')?1:0);
                    }
                }else{
                    console.warn('device already registered')
                }
            })
            self.plugin.on('error', function(e) {
                if(app.isdev) _alert('error registering '+e.message)
            });
            self.plugin.on('notification', function(e){
                self.onNotification(e);
                // if(e.additionalData&&e.additionalData.coldstart&&!e.additionalData.call){
                //     self.onNotification(e);
                // }else{
                //     self.onNotification(e);
                // }
            });
            self.plugin.on('accept', function(data){
                onerror(data);
                self.plugin.finish(function(){
                    console.log('accept callback finished');
                }, function(){
                    console.log('accept callback failed');
                }, data.additionalData.notId);
            })
            self.plugin.on('reject', function(data){
                onerror(data);
                self.plugin.finish(function(){
                    console.log('accept callback finished');
                }, function(){
                    console.log('accept callback failed');
                }, data.additionalData.notId);
            })
            if(localStorage.getVar('pushinit')) setTimeout(function(){
                PushNotification.hasPermission(function(data){
                    if(!data.isEnabled) {
                        self.alertCheckPermissions();
                    }
                });
            },3000);
            localStorage.setVar('pushinit',1);
            if(app.device=='Android'){
                self.ensureChannel();
            }
        },
        alertCheckPermissions:function(){
            $('body').alert({
                content:'<div style="font-size:16px;padding:20px;text-align:left;">Push is not enabled, to get the most of your experience, please update your settings.</div>',
                icon:'icon-info-circled-alt',
                closer:true,
                buttons:[{
                    btext:'<i class="icon-logout"></i> Update Settings',
                    bclass:'x_update'
                }],
                binding:function(ele){
                    ele.find('.x_update').stap(function(){
                        $.fn.alert.closeAlert();
                        cordova.plugins.diagnostic.switchToSettings(function(){
                            console.log("Successfully switched to Settings app");
                        }, function(error){
                            onerror("The following error occurred: "+error);
                        });
                    },1,'tapactive')
                }
            })
        },
        ensureChannel:function(){
            var self=phone.push;
            PushNotification.listChannels(function(channels){
                var create=true;
                //onerror('channels: '+JSON.stringify(channels))
                if(channels){
                    $.each(channels,function(i,v){
                        if(v.id==self.channel.id){
                            create=false;
                        }
                    })
                }
                if(create) self.createChannel();
            })
        },
        createChannel:function(){
            var self=phone.push;
            //onerror('['+self.channel.id+'] channel not opened, create it!');
            PushNotification.createChannel(function(){
                //onerror('Created Android Channel');
            },function(){
                onerror('Failed to create Android Channel');
            },self.channel)
        },
        chatIsVisible:function(data){
            if(!app.chatmanager) return false;
            var sd=data.route.split('/');
            if(app.chatmanager.hasChat(sd[2])) return true;
            return false;
        },
        onNotification: function(data) {
            //do custom messge
            app.currentNotification=false;
            var self=phone.push;
            var messagedata=false;
            if(data.additionalData&&data.additionalData.messagedata) messagedata=data.additionalData.messagedata;//ios data
            if(!messagedata&&data.additionalData) messagedata=data.additionalData;//android data
            if(messagedata.action=='call'){
                //onerror('got notification, directing incoming call');
                //_alert(JSON.stringify(messagedata));
                app.webrtc.incoming(messagedata);
                return false;
            }
            if(data.message){//regular push  
                if(data.additionalData.foreground){
                    //toast!
                    //also make sure chat isnt visible in web
                    if(((messagedata.route&&messagedata.route!=app.history.currentHash)||!messagedata.route)&&!self.chatIsVisible(messagedata)){
                        var conf={
                            content:data.message,
                            title:data.title,
                            remove:5000,
                            onClick:function(){
                                self.onNotificationClick(messagedata);
                            }
                        }
                        if(messagedata.pic){
                            conf.images=[messagedata.pic];
                        }else{
                            conf.icon='icon-bell';
                        }
                        modules.toast(conf);
                    }else{
                        console.log('update current view ui')
                    }
                }else{
                    self.onNotificationClick(messagedata);
                }
                // _alert(JSON.stringify(messagedata));
            }else{//voip
                //_alert(JSON.stringify(messagedata));
                //app.webrtc.incoming(messagedata);
            }
        },
        onNotificationClick:function(messagedata){
            var self=this;
            if(messagedata){
                phi.log('onNotificationClick')
                if(messagedata.route) app.history.go(messagedata.route)
                else if(app.isdev) _alert('no route!');
            }
        },
        registerDevice:function(regid,isAndroid){
            var self=phone.push;
            var is=0;
            if(isAndroid) is=1;
            // if(app.isdev) _alert('register device :'+regid)
            //window.onerror('url: '+app.sapiurl+'/user/push/registerpush?android='+is+'&regid='+regid+'&topic='+window.app_conf.appid+'&app_identifier='+window.app_conf.app_identifier)
            try{
	            modules.api({
	                caller:'Register Push',
	                url: app.sapiurl+'/user/push/registerpush',
	                data:{
	                    android:is,
	                    regid:regid,
                        sandbox:(phone.push.sandbox)?1:0,
	                    device:modules.tools.keepFields(window.device,['platform','version','model','manufacturer']),
	                    topic:window.app_conf.id,
	                    app_identifier:window.app_conf.app_identifier,//this has to exist
	                	token:app.user.token
	                },
	                callback:function(data){
	                    if(data.success){
	                        phone.log('Set Device ID ['+data.deviceid+']',1);
	                        window.udid=data.deviceid;
	                        //set up app device
	                        app.userdevice={
	                            id:data.deviceid,
	                            subscribed:data.subscribed
	                        }
	                        phone.log('Successfully registered push',1);
	                    }else{
	                        phone.log('Error registering push',1);
	                    }
	                }
	            });
	        }catch(e){
	        	_alert('error: '+e.message);
	        }
        },
        clearBadge:function(){
            var self=phone.push;
            if(isPhoneGap()&&self.plugin&&self.plugin.setApplicationIconBadgeNumber){
                self.plugin.setApplicationIconBadgeNumber(function(){}, function(){}, 0);
            }
        },
        setBadge:function(count){
            var self=phone.push;
            if(isPhoneGap()&&self.plugin&&self.plugin.setApplicationIconBadgeNumber){
                if(!count) count=0;
                self.plugin.setApplicationIconBadgeNumber(function(){}, function(){}, count);
            }
        }
    },
    footerBar:{
        init:function(){
            return false;
            if(!phone.isIphoneX()) return false;//only applies to iphonex
            $('body').addClass('hasFooter');
            $('body').render({
                template:'phone_footer'
            });
            phone.footerBar.setColor();
        },
        getCurrent:function(){
            return this.color;
        },
        setColor:function(color){
            if(!phone.isIphoneX()) return false;//only applies to iphonex
            if(!color){
                color='white';
            }
            TweenLite.to($('#footer_color'),.2,{backgroundColor:color})
            //$('#footer_color').css('background',color);
            this.color=color;
        }
    },
    statusBar:{
        current:'',
        ensure:function(){//ios things
            if(app.device=='iOS'){
                phone.statusBar.set();
                phone.statusBar.show();
            }
        },
        getHeight:function(){
            if(phone.hasNotch()){
                return 30;
            }else{
                return 20;
            }
        },  
        set:function(settheme){//ensures color!
            // if(app.device=='Android'){
            //     var theme=phi.getTheme();
            //     var ctheme=(settheme)?settheme:theme.statusbar.theme;
            //     if(ctheme=='light'){

            //     }else{
            //         StatusBar.styleDefault();
            //         StatusBar.backgroundColorByHexString('#00000000');
            //     }
            // }else{
               // if(phone.statusBar.current!=settheme){//only do something if changed.  fixes an android issue
                    var theme=phi.getTheme();
                    var ctheme=(settheme)?settheme:theme.statusbar.theme;
                    if(ctheme=='dark'){
                        if(window.StatusBar) window.StatusBar.styleDefault();
                        if(!isPhoneGap()){
                            $('.iosbar').find('table').css('color','#555');
                        }
                    }else{
                        if(window.StatusBar) window.StatusBar.styleLightContent();
                        if(!isPhoneGap()){
                            $('.iosbar').find('table').css('color','white');
                        }
                    }
                    if(app.device=='Android') StatusBar.backgroundColorByHexString('#00000000');
                    phone.statusBar.current=ctheme;
               // }
            //}
        },
        getCurrent:function(){
            return phone.statusBar.current;
        },
        show:function(){
            if(!phone.statusBar.showing){
                if(isPhoneGap()){
                    if(window.StatusBar){
                        window.StatusBar.show();
                        window.StatusBar.overlaysWebView(true);
                        phone.statusBar.set();
                    }
                }else{
                    $('.iosbar').show()
                }
            }
            phone.statusBar.showing=1;
        },
        hide:function(){
            if(phone.statusBar.showing){
                if(isPhoneGap()){
                    if(window.StatusBar){
                        window.StatusBar.hide();
                    }
                }else{
                    $('.iosbar').hide()
                }
            }
            phone.statusBar.showing=0;
        }
    },
    hasNotch:function(){
    	if(!isPhoneGap()) return false;
        return true;//all phones fucking have it at this point!
        var teststring=/Pixel 3/i;
        var ua=navigator.userAgent;
        if(teststring.test(ua)){
            return true;
        }else{
            return phone.isIphoneX();
        }
    },
    hasBottomNotch:function(){
        if(!isPhoneGap()) return false;
        return phone.isIphoneX();
    },
    isIphoneX:function(){
        if(!isPhoneGap()) return false;
        if(app.device!='iOS') return false;
        var ratio = window.devicePixelRatio || 1;

          // Define the users device screen dimensions
          var screen = {
            width : window.screen.width * ratio,
            height : window.screen.height * ratio
          };
        var ret=false;
        var sizes=[
            [828,1792],
            [1242,2688],
            [1125,2436],
            [2532,1170]
        ]
        $.each(sizes,function(i,v){
            if(v[0]==screen.width&&v[1]==screen.height||v[1]==screen.width&&v[0]==screen.height){
                ret=true;
            }
        })
        return ret;
        // if (app.device=='iOS' && screen.width == 1125 && screen.height === 2436) return true;
        // if(model.indexOf('iPhone10')>=0) return true;
        // return false;
    }
}