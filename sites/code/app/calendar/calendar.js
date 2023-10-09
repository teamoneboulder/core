if(!window.modules) window.modules={};
modules.calendar=function(options){
	this.options=options;
	var self=this;
    self.state_manager=new modules.state_manager({
        id:options.id,
        app:'calendar',
        getPages:function(){
            return self.getPages().order;
        },
        getTabData:function(){
            return {
                name:'Calendar',
                icon:'icon-calendar'
            }
        },
        getPageName:function(){
            return 'Calendar';
        },
        getNavPath:function(){
            if(!self.cpage) self.cpage='upcoming';
            return self.cpage;
        },
        getData:function(){
            if(self.loaded) return true;
        },
        defaultPage:function(){
            return (app.isWebLayout())?'view':'upcoming';
        }
    })
    this.goBack=function(){
        self.onBack(function(){
            app.home.manager.onBack()
        });
    }
    this.viewHide=function(){
        self.ele.hide();
    }
    this.viewShow=function(){
        self.ele.show();
    }
    this.show=function(){
        window._calendar=self;
        if(options.inline){
            self.options.ele.render({
                template:'module_calendar_page',
                data:{
                    pages:self.getPages(),
                    left:0
                },
                binding:function(ele,onback){
                    //bind it!
                    self.ele=ele;
                    ele.find('.topnav').stap(function(){
                        self.setPage($(this).attr('data-nav'))
                    },1,'tapactive');
                    if(app.isWebLayout()){
                        setTimeout(function(){
                            self.loaded=true;
                            self.setPage(self.state_manager.getLoadPage());
                        },50)
                    }else{
                        self.setPage(self.state_manager.getLoadPage());
                    }
                }
            });
        }else{
            self.options.ele.subpage({
                loadtemplate:'module_calendar_page',
                data:{
                    pages:self.getPages()
                },
                beforeClose:function(ele,cb){//eliminate all animation/timing/etc
                    setTimeout(function(){
                        cb();
                    },50)
                },
                onClose:function(){
                    self.destroy();
                },
                pageType:'static',
                onPageReady:function(ele,onback){
                    //bind it!
                    self.ele=ele;
                    self.onBack=onback;
                    ele.find('.topnav').stap(function(){
                        self.setPage($(this).attr('data-nav'))
                    },1,'tapactive');
                    if(app.isWebLayout()){
                        setTimeout(function(){
                            self.loaded=true;
                            self.setPage(self.state_manager.getLoadPage());
                        },50)
                    }else{
                        self.setPage(self.state_manager.getLoadPage());
                    }
                }
            });
        }
    }
    this.getPages=function(){
        var pages={
            list:{},
            order:[]
        }
        $.each(self.pageorder,function(i,tv){
            var v=self.pages[tv]; 
            if(v.getInfo){
                var info=v.getInfo();
                pages.order.push(info.id);
                pages.list[info.id]=info;
            }
        })
        console.log(pages)
        return pages;
    }
    this.setPage=function(page,internal){
        console.log(page)
        if(self.pages[page]&&self.pages[page].open){
            self.pages[page]&&self.pages[page].open()
        }else{
            self.ele.find('.topnav').removeClass('selected');
            self.ele.find('[data-nav='+page+']').addClass('selected');
            if(self.cpage&&self.pages[self.cpage]&&self.pages[self.cpage].hide) self.pages[self.cpage].hide(); 
            if(self.pages[page]&&self.pages[page].show) self.pages[page].show();
            self.cpage=page;
            self.setStatView();
            if(!internal) self.state_manager.setState()
        }
    }
    this.onNavClick=function(){
        self.goBack();
    }
    this.getName=function(){
        return 'Calendar';
    }
    this.destroy=function(){
        self.ele.remove();
    }
    this.setStatView=function(){
        modules.stats.setPage('calendar',(self.cpage)?self.cpage:self.defaultPage);
    }
    this.onResume=function(){
       //self.scroller.onResume();
    }
    this.stop=function(){
        if(self.pages[self.cpage]&&self.pages[self.cpage].stop){
            self.pages[self.cpage].stop()
        }
        //self.scroller.stop()
    }
    this.start=function(){
        if(self.pages[self.cpage]&&self.pages[self.cpage].start){
            self.pages[self.cpage].start()
        }
        //self.scroller.start()
    }
    this.getContainer=function(){
        return $('#homeswiper');
    }
    this.pageorder=['view','upcoming','past','invites','gotoevents'];
    this.pages={
        invites:{
            getInfo:function(){
                return {
                    id:'invites',
                    name:'Invites',
                    icon:'icon-mail'
                }
            },
            show:function(){
                var pself=this;
                if(!pself.ele){
                    self.ele.find('.pagecontent').render({
                        template:'calendar_invites',
                        binding:function(ele){
                            pself.ele=ele;
                            pself.load();
                            
                        }
                    })
                }else{
                    pself.ele.show()
                }      
            },
            load:function(){
                var pself=this;
                pself.infinitescroller=new modules.infinitescroll({
                    ele:pself.ele.find('.content'),
                    endpoint:app.sapiurl+'/module/invite/feed',
                    loaderClass:'lds-ellipsis-black',
                    offset:'200%',
                    swipeContainer:self.getContainer(),
                    onInterval:{
                        time:3000,
                        callback:function(){
                            //pself.updateTimes();
                        }
                    },
                    opts:{
                    },
                    max:10,
                    template:'calendar_listitem_invite',
                    nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>You dont have any upcoming event invites.</div></div>',
                    onPageReady:function(ele){
                        ele.find('.rowitem').stap(function(){
                            //if(!app.isdev) return false;
                            var ev=pself.infinitescroller.getById($(this).attr('data-id')).event;
                            modules.viewdelegate.register('event',{
                                id:ev.id,
                                data:ev
                            })
                        },1,'tapactive');
                    },
                    scrollBindings:{
                        scrollStart:function(){
                        },
                        scroll:function(obj){
                        }
                    }
                });
            },
            hide:function(){
                var pself=this;
                pself.ele.hide();
            }
        },
        upcoming:{
            show:function(){
                var pself=this;
                self.ele.find('.pagecontent').render({
                    template:'calendar_list',
                    binding:function(ele){
                        pself.ele=ele;
                        pself.loadEvents();
                    }
                })
            },
            stop:function(){
                var pself=this;
                if(pself.scroller) pself.scroller.stop()
            },
            start:function(){
                var pself=this;
                if(pself.scroller) pself.scroller.start()
            },
            hide:function(){
                var pself=this;
                pself.scroller.destroy();
                pself.ele.hide();
            },
            getInfo:function(){
                return {
                    id:'upcoming',
                    name:'Upcoming',
                    icon:'icon-real-time'
                }
            },
            loadEvents:function(){
                var pself=this;
                if(!pself.viewrange){
                    var date = new Date();
                    var firstDay = moment(new Date(date.getFullYear(), date.getMonth(), 1)).subtract(7,'days').format('X');
                    var lastDay = moment(new Date(date.getFullYear(), date.getMonth() + 1, 0)).add(7,'days').format('X');
                    pself.viewrange={
                        start:firstDay,
                        end:lastDay
                    }
                }
                pself.scroller=new modules.infinitescroll({
                    ele:pself.ele.find('.content'),
                    endpoint:app.sapiurl+'/module/calendar/feed',
                    opts:{

                    },
                    clearOnResume:true,
                    loaderClass:'lds-ellipsis-black',
                    max:15,
                    swipeContainer:self.getContainer(),
                    template:'calendar_listitem',
                    nodata:(options.nodata)?options.nodata:'<div style="color:#888;text-align:left">No upcoming events here yet<br/><br/>Check out the <span class="x_gotoevent" style="font-weight:bold">events</span> section!</div>',
                    endOfList:' ',
                    header:{
                        key:'start',
                        rule:'samedate',
                        template:'calendar_header'
                    },
                    onPageReady:function(ele){
                        ele.find('.x_gotoevent').stap(function(){
                            app.home.manager.register('events',{
                                id:'events',
                                data:{}
                            })
                        },1,'tapactive')
                        ele.find('.calendarrow').stap(function(){
                            var data=pself.scroller.getById($(this).attr('data-id'));
                            modules.viewdelegate.register('event',{
                                id:data.event.id,
                                data:data.event
                            })
                        },1,'tapactive');
                    }
                });
            }
        },
        gotoevents:{
            open:function(){
                app.home.manager.register('events',{
                    id:'events',
                    data:{}
                })
            },
            getInfo:function(){
                return {
                    id:'gotoevents',
                    name:'Events',
                    notOnWeb:true,
                    icon:'icon-ticket'
                }
            }
        },
        past:{
            show:function(){
                var pself=this;
                self.ele.find('.topnavcontent').render({
                    template:'calendar_list',
                    binding:function(ele){
                        pself.ele=ele;
                        pself.loadEvents();
                    }
                })
            },
            stop:function(){
                var pself=this;
                if(pself.scroller) pself.scroller.stop()
            },
            start:function(){
                var pself=this;
                if(pself.scroller) pself.scroller.start()
            },
            hide:function(){
                var pself=this;
                if(pself.scroller) pself.scroller.destroy();
                pself.ele.hide();
            },
            getInfo:function(){
                return {
                    id:'past',
                    name:'Past',
                    icon:'icon-cw'
                }
            },
            loadEvents:function(){
                var pself=this;
                if(!pself.viewrange){
                    var date = new Date();
                    var firstDay = moment(new Date(date.getFullYear(), date.getMonth(), 1)).subtract(7,'days').format('X');
                    var lastDay = moment(new Date(date.getFullYear(), date.getMonth() + 1, 0)).add(7,'days').format('X');
                    pself.viewrange={
                        start:firstDay,
                        end:lastDay
                    }
                }
                pself.scroller=new modules.infinitescroll({
                    ele:pself.ele.find('.content'),
                    endpoint:app.sapiurl+'/module/calendar/feed',
                    opts:{
                        past:1
                    },
                    clearOnResume:true,
                    loaderClass:'lds-ellipsis-black',
                    max:15,
                    swipeContainer:self.getContainer(),
                    template:'calendar_listitem',
                    nodata:(options.nodata)?options.nodata:'<div style="color:#888;text-align:left">No past events here yet.</div>',
                    endOfList:' ',
                    header:{
                        key:'start',
                        rule:'samedate',
                        template:'calendar_header'
                    },
                    onPageReady:function(ele){
                        ele.find('.x_gotoevent').stap(function(){
                            app.home.manager.register('events',{
                                id:'events',
                                data:{}
                            })
                        },1,'tapactive')
                        ele.find('.calendarrow').stap(function(){
                            var data=pself.scroller.getById($(this).attr('data-id'));
                            modules.viewdelegate.register('event',{
                                id:data.event.id,
                                data:data.event
                            })
                        },1,'tapactive');
                    }
                });
            }
        },
        view:{
            show:function(){
                var pself=this;
                self.ele.find('.pagecontent').render({
                    template:'calendar_calendar',
                    binding:function(ele){
                        pself.ele=ele;
                        pself.calendar=new modules.calendar_view({
                            ele:ele.find('.calendar'),
                            container:ele,
                            page:app.user.profile.id,
                            defaultView:'calendar'
                        });
                    }
                })
                pself.rendered=true;
            },
            hide:function(){
                var pself=this;
                pself.ele.hide();
            },
            destroy:function(){
                var pself=this;
                pself.calendar.destroy();
            },
            getInfo:function(){
                return {
                    id:'view',
                    name:'Calendar',
                    icon:'icon-calendar'
                }
            }
        },
        month:{//mobiscroll
            show:function(){
                var pself=this;
                self.ele.find('.pagecontent').render({
                    template:'calendar_calendar',
                    binding:function(ele){
                        pself.ele=ele;
                        self.inst = ele.find('.content').mobiscroll().eventcalendar({
                            theme: 'ios',
                            display: 'inline',
                            calendarHeight:ele.height(),
                            view: {
                                calendar: {
                                    labels: true
                                }
                            }
                        }).mobiscroll('getInst');
                        pself.loadEvents();
                    }
                })
                pself.rendered=true;
            },
            hide:function(){
                var pself=this;
                pself.ele.hide();
            },
            loadEvents:function(){
                var pself=this;
                if(!pself.viewrange){
                    var date = new Date();
                    var firstDay = moment(new Date(date.getFullYear(), date.getMonth(), 1)).subtract(7,'days').format('X');
                    var lastDay = moment(new Date(date.getFullYear(), date.getMonth() + 1, 0)).add(7,'days').format('X');
                    pself.viewrange={
                        start:firstDay,
                        end:lastDay
                    }
                }
                mobiscroll.util.getJson('https://trial.mobiscroll.com/events/', function (events) {
                    self.inst.setEvents(events);
                }, 'jsonp');
            },
            getInfo:function(){
                return {
                    id:'month',
                    name:'Calendar',
                    icon:'icon-calendar'
                }
            }
        },
        week:{
            show:function(){
                var pself=this;
                self.ele.find('.pagecontent').render({
                    template:'calendar_calendar',
                    binding:function(ele){
                        pself.ele=ele;
                        pself.loadEvents();
                    }
                })
                pself.rendered=true;
            },
            loadEvents:function(){

            },
            hide:function(){
                var pself=this;
                pself.ele.hide();
            },
            getInfo:function(){
                return {
                    id:'week',
                    name:'Week'
                }
            }
        }
    }
}