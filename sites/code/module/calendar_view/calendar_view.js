modules.calendar_view=function(options){
	var self=this;
	self.options=options;
    self.defaultView=(options.defaultView)?options.defaultView:'list';
	this.init=function(){
        if(options.header) options.header.find('.x_changeview').stap(function(){
            self.setView($(this).attr('data-view'));
        },1,'tapactive');
        self.setView(self.defaultView);
	}
    this.setView=function(page){
        if(self.cpage){
            self.views[self.cpage].destroy();
        }
        self.views[page].show();
        if(options.header) options.header.find('.x_changeview').removeClass('selected');
        if(options.header) options.header.find('[data-view='+page+']').addClass('selected')
        self.cpage=page;
    }
    this.views={
        list:{
            show:function(){
                var pself=this;
                if(options.header) options.header.addClass('feeditems');
                 options.ele.render({
                    template:'calendar_view_list',
                    binding:function(ele){
                        pself.ele=ele;
                    }
                })
            },
            load:function(){
                var pself=this;
                var opts={};
                if(options.opts&&options.opts.list&&options.opts.list.endpointOpts) opts=$.extend(true,{},options.opts.list.endpointOpts);
                pself.inf=new modules.infinitescroll({
                    ele:pself.ele.find('.calendarlistcontent'),
                    endpoint:(options.opts&&options.opts.list&&options.opts.list.endpoint)?options.opts.list.endpoint:app.sapiurl+'/module/calendar/feed',
                    opts:opts,
                    isFeed:function(){return true},
                    clearOnResume:true,
                    loaderClass:'lds-ellipsis-black',
                    max:15,
                    //swipeContainer:self.getContainer(),
                    template:'page_calendar_event_listitem',
                    nodata:'<div style="color:#888;text-align:center;" class="feeditems">Nothing Here.</div>',
                    endOfList:' ',
                    // header:{
                    //     key:'start',
                    //     rule:'samedate',
                    //     template:'calendar_header'
                    // },
                    processResponse:function(resp){
                        return _.graphList(resp,[{
                            key:"oneboulder",
                            fn:function(item){
                                if(item.cohost_info){
                                    for(var key in item.cohost_info){
                                        if(item.cohost_info[key].badges&&item.cohost_info[key].badges.intersect(['regenerator','steward']).length>0){
                                            return true
                                        }
                                    }
                                }
                                if(item.page&&item.page_info){
                                    if(item.page_info.badges&&item.page_info.badges.intersect(['regenerator','steward']).length>0){
                                        return true;
                                    }
                                }
                                return false;
                            }
                        }]);
                    },
                    onPageReady:function(ele){
                        ele.find('.rowitem').stap(function(){
                            var data=pself.inf.getById($(this).attr('data-id'));
                            modules.viewdelegate.register('event',{
                                id:data.id,
                                data:data
                            })
                        },1,'tapactive');
                    }
                });
            },
            destroy:function(){
                var pself=this;
                if(pself.inf) pself.inf.destroy();
            }
        },
        calendar:{
            show:function(){
                var pself=this;
                if(options.header) options.header.removeClass('feeditems');
                options.ele.render({
                    template:'calendar_view_calendar',
                    binding:function(ele){
                        pself.load();
                    }
                })
            },
            load:function(){
                var pself=this;
                _ui.pageloader.render({theme:false,themeClass:'lds-ellipsis-black'},options.ele.find('.calendarcontent'),1);
                self.ensureCalendarCode(function(){ 
                    options.ele.find('.calendarcontent').html('');
                    self.calendar = new FullCalendar.Calendar(options.ele.find('.calendarcontent')[0], {
                      plugins: (_.isWebLayout())?['dayGrid']:[ 'dayGrid' ],
                      defaultView:(_.isWebLayout())?'dayGridMonth':'dayGridWeek',
                      firstDay:(_.isWebLayout())?0:1,
                      eventLimit:(_.isWebLayout())?20:6, // for all non-TimeGrid views
                      contentHeight: function(){
                        return options.container.height();
                      },
                      eventRender: function (calev, elt, view) {
                        var ev=self.events[calev.event._def.publicId];
                        if(ev.icon){
                            $(calev.el).find(".fc-title").prepend("<i class='"+ev.icon+"'></i>");
                        }
                        if(ev&&ev.cancelled){
                            $(calev.el).addClass('fc-canceled-event')
                        }
                    },
                      eventClick: function(info) {
                        var ev=self.events[info.event._def.publicId];
                        if(ev.type=='birthday'){
                            app.history.go('/profile/'+ev.id);
                        }else{
                            app.history.go('/event/'+ev.id);
                        }
                      },
                      // customButtons: {
                      //   myCustomButton: {
                      //     text: 'List View',
                      //     click: function() {
                      //       alert('clicked the custom button!');
                      //     }
                      //   }
                      // },
                      // header: {
                      //   right: 'prev,next today myCustomButton'
                      // },
                      datesRender:function(){
                        self.loadEvents();
                      }
                    });
                    self.calendar.render();
                },function(){
                    _alert('error loading calendar');
                })
            },
            destroy:function(){
                if(self.calendar) self.calendar.destroy();
                options.ele.html('');
            }
        }
    }
    this.events={};
	this.loadEvents=function(){
		var firstDay = moment(self.calendar.view.currentStart).subtract(5,'days').format('X');
        var lastDay = moment(self.calendar.view.currentEnd).add(5,'days').format('X');
        self.viewrange={
            start:firstDay,
            end:lastDay
        }
        var data={
            range:self.viewrange
        }
        if(options.opts&&options.opts.calendar&&options.opts.calendar.endpointOpts){
        	data=$.extend(true,{},data,options.opts.calendar.endpointOpts);
        }
        modules.api({
            url:(options.opts&&options.opts.calendar&&options.opts.calendar.endpoint)?options.opts.calendar.endpoint:app.sapiurl+'/module/events/range',
            data:data,
            timeout:5000,
            callback:function(resp){
                if(resp.data&&resp.data.list){
                	var events=[];
                    $.each(resp.data.list,function(i,v){
                        var toadd=(v.event)?v.event:v;//v.event is for RSVP info
                        if(toadd){
                            if(!self.calendar.getEventById(toadd.id)){
                                toadd.title=toadd.name;
                                toadd.start=new Date(toadd.start*1000);
                                if(toadd.end) toadd.end=new Date(toadd.end*1000);
                                toadd.oneboulder=0;
                                if(toadd.cohost_info){
                                    for(var key in toadd.cohost_info){
                                        if(toadd.cohost_info[key].badges&&toadd.cohost_info[key].badges.intersect(['regenerator','steward']).length>0){
                                            toadd.oneboulder=1
                                        }
                                    }
                                }
                                if(toadd.page&&toadd.page_info){
                                    if(toadd.page_info.badges&&toadd.page_info.badges.intersect(['regenerator','steward']).length>0){
                                        toadd.oneboulder=1;
                                    }
                                }
                                if(toadd.oneboulder){
                                    toadd.color='#194887'
                                }else{
                                    toadd.color='#eee';
                                    toadd.textColor='black'
                                    toadd.borderColor='#ccc'
                                }
                                //console.log(toadd)
                                events.push(toadd);
                                self.events[toadd.id]=toadd;
                                //self.calendar.addEvent(toadd);
                            }
                        }
                    })
                    if(events.length) self.calendar.addEventSource(events);
                }
            }
        });
	}
	this.ensureCalendarCode=function(success,fail){
        var load={
            js:['https://unpkg.com/@fullcalendar/core@4.3.1/main.min.js','https://unpkg.com/@fullcalendar/daygrid@4.3.0/main.min.js'],
            css:['https://unpkg.com/@fullcalendar/core@4.3.1/main.min.css','https://unpkg.com/@fullcalendar/daygrid@4.3.0/main.min.css']
        }
        _.addFiles.load(load,function(){
            if(success) success();
        },function(){
            if(fail) fail();
        })
    }
	this.destroy=function(){
		if(self.calendar) self.calendar.destroy();
	}
	self.init();
}