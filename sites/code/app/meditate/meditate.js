if(!window.modules) window.modules={};
modules.meditate=function(options){
    this.options=options;
    var self=this;
    this.nav=[{
        _id:'tracker',
        name:'Tracker'
    },{
        _id:'history',
        name:'History'
    }];
    this.show=function(){
        //start async loading!
        async.parallel([self.showLoading,self.loadData],function(){
            self.onViewReady();
        })
    }
    this.onNavClick=function(){
        self.goBack();
    }
    this.getName=function(){
        return 'Meditate';
    }
    this.setStatView=function(){
        if(!self.cpage) self.cpage='tracker';
        modules.stats.setPage('meditate',self.cpage);
    }
    this.goBack=function(){
        self.onBack(function(){
            app.home.manager.onBack();
        });
    }
    this.showLoading=function(cb){
        self.options.ele.show();
        self.options.ele.subpage({
            loadtemplate:'module_meditate_loading',
            pageType:'static',
            data:{
                
            },
            onPageReady:function(ele,onback){
                self.pele=ele;
                self.onBack=onback;
                ele.find('.backbtn').stap(function(){
                    self.goBack();
                },1,'tapactive')
                //refresh current sscroller
                cb();
            },
            onClose:function(){
                self.destroy();
            }
       })
    }
    this.destroy=function(){
        self.infinitescroller.destroy();
        self.stopSession();//stop any sessions
        //self.map.destroy();
        self.chakras.destroy();
        self.pele.remove();
    }
    this.loadData=function(cb){
        self.data={};
        //return cb();
        app.api({
            url:app.sapiurl+'/module/meditate/load',
            data:{},
            timeout:5000,
            callback:function(resp){
                if(resp.error) self.data=resp;
                else if(!resp.data) self.data={error:'Invalid Page'};
                else self.data=self.parseData(resp.data);
                cb();
            }
        });
    }
    this.onPageWillHide=function(){
        console.log('onPageWillHide')
    }
    this.sessionStops=[5,10,11,15,20,22,25,30,33,40,45,50,60];
    this.intervalStops=[2,3,5,10,15,20,30];
    this.parseData=function(data){
        if(data.settings){
            if(data.settings.session) data.settings.session=parseInt(data.settings.session,10);
            if(data.settings.interval) data.settings.interval=parseInt(data.settings.interval,10);
            self.interval=data.settings.interval;
            self.session=data.settings.session;
        }
        if(!self.session) self.session=self.sessionStops[0];
        if(!self.interval) self.interval=self.intervalStops[0];
        return data;
    }
    this.updateSettings=function(){
        var settings={
            session:parseInt(self.session,10),
            interval:parseInt(self.interval,10)
        }
        app.user.set({
            items:[{
                type:'set',
                app:'meditate',
                data:{
                    settings:settings
                }
            }]
        });
    }
    this.bindHistory=function(){
        self.infinitescroller=new modules.infinitescroll({
            ele:self.ele.find('.meditate_history'),
            endpoint:app.sapiurl+'/module/meditate/sessions',
            opts:{
            },
            max:15,
            endOfList:'endoflist',
            template:'module_meditate_item',
            nodata:'<div style="margin:5px;background:rgba(255,255,255,.75);border:1px solid #ccc;padding:10px" class="s-corner-all truebox">Start a session!</div>',
            onPageReady:function(ele){
               
            }
        });
    }
    // this.setPosition=function(){
    //     var w=self.ele.find('#meditate_swipe1').find('.swipeselect_item').width();
    //     var c=self.ele.find('#meditate_swipe1').find('[data-val='+self.session+']');
    //     var osw=0;
    //     $.each(self.ele.find('#meditate_swipe1').find('.swipeselect_item'),function(i,v){
    //         var v=parseInt($(v).attr('data-val'));
    //     })
    // }
    this.onViewReady=function(){
        var swipe_1={id:'meditate_swipe1',options:[]};
        var c=0;
        while(self.sessionStops[c]){
            swipe_1.options.push({
                name:self.sessionStops[c]+'',
                val:self.sessionStops[c]
            })
            c++;
        }
        if(!self.gong){
            self.gong=new modules.audio({src:'https://wearenectar.s3.amazonaws.com/audio/gong.mp3'})
        }
        if(!self.bell){
            self.bell=new modules.audio({src:'https://wearenectar.s3.amazonaws.com/audio/bell.mp3'})
        }
        if(self.session) swipe_1.selected=self.session;
        var swipe_2={id:'meditate_swipe2',options:[]};
        var c=0;
        while(self.intervalStops[c]){
            swipe_2.options.push({
                name:self.intervalStops[c]+'',
                val:self.intervalStops[c]
            })
            c++;
        }
        if(self.interval) swipe_2.selected=self.interval;
        //page
        self.pele.find('.content').render({
            template:'module_meditate',
            append:false,
            data:{
                nav:self.nav,
                meditate_swipe1:swipe_1,
                meditate_swipe2:swipe_2
            },
            bindings:[{
                type:'fn',
                binding:function(ele){
                    self.ele=ele;
                    //set position
                    //self.setPosition();
                    self.bindHistory();
                    ele.find('.x_stop').stap(function(){
                        self.stopSession();
                    },1,'tapactive');
                    ele.find('.x_begin').stap(function(){
                        self.startSession();
                    },1,'tapactive');
                    window._ui.register('swipenav',{
                        onNavSelect:function(cur){
                            self.selectPage(cur);
                        }
                    });
                    window._ui.register('meditate_swipe1',{
                        onSelect:function(cur){
                            self.session=cur;
                            self.updateSettings();
                        }
                    });
                    window._ui.register('meditate_swipe2',{
                        onSelect:function(cur){
                            self.interval=cur;
                            self.updateSettings();
                        }
                    });
                    // self.map=new map(ele.find('[data-page=maps]'),{
                    //     confurl:app.mapurl+'/conf/yoga'
                    // });
                    self.chakras=new chakras(ele.find('.chakraarea'),{
                        chakras:{
                            crown:{
                                intensity:3
                            },
                            thirdeye:{
                                intensity:3
                            },
                            throat:{
                                intensity:3
                            },
                            heart:{
                                intensity:3
                            },
                            solarplexus:{
                                intensity:3
                            },
                            sacral:{
                                intensity:3
                            },
                            root:{
                                intensity:3
                            }
                        }
                    });
                }
            }]
        });
        //stap it!
        self.ele.find('[data-nav='+self.nav[0]._id+']').stap();
    }
    this.stopSession=function(){
        modules.audio_global.stop();
        app.sleep.enable();
        self.cancelCountdown();
        TweenLite.to(self.ele.find('.trackerpage'),.3,{top:'0%',scale:1,onComplete:function(){
            self.ele.find('.countdowntimer').children().remove();
            self.ele.find('.sessiontimer').children().remove();
        }})
    }
    this.startSession=function(){
        //set up begin timer
        //get settings!
        modules.audio_global.stream('Meditation');
        app.sleep.disable()
        if(!self.session) self.session=self.sessionStops[0];
        if(!self.interval) self.interval=self.intervalStops[0];
        var settings={
            session:parseInt(self.session,10),
            interval:parseInt(self.interval,10)
        }
        var countdown=radialIndicator(self.ele.find('.countdowntimer')[0],{
            radius:110,
            barWidth:10,
            roundCorner : true,
            barColor: '#87CEEB',
            barBgColor:'#ddd',
            initValue: 5,
            minValue: 0,
            maxValue: 5,
            format: function (value) {
                return Math.ceil(value)+'';//round to neares 1
            }
        });
        self.ele.find('.message').html('Starting in');
        setTimeout(function(){
            //hide tracker page
            TweenLite.to(self.ele.find('.trackerpage'),.3,{top:'100%',scale:.8,onComplete:function(){
                self.startCountdown({
                    onFrame:function(diff){
                        countdown.value(5-diff);
                    },
                    onComplete:function(){
                        self.ele.find('.countdowntimer').children().remove();
                        self.ele.find('.sessiontimer').show();
                        self.ele.find('.message').html('<b>'+self.session+' min</b> session in progress');
                        var overall=radialIndicator(self.ele.find('.sessiontimer')[0],{
                            radius:110,
                            barWidth:10,
                            roundCorner : true,
                            barColor: '#87CEEB',
                            barBgColor:'#ddd',
                            initValue: 0,
                            minValue: 0,
                            maxValue: self.session,
                            format: function (value) {
                                //return value.toFixed(1);
                                return self.formatTime(value);//round to neares 1
                            }
                        });
                        self.gong.play();
                        var intervals={};
                        self.startCountdown({
                            onFrame:function(diff){
                                var min=diff/60;
                                var quad=Math.floor(min/self.interval);
                                if(min<self.session){
                                    if(quad&&!intervals[quad]){
                                        intervals[quad]=true;
                                        self.bell.play();
                                    }
                                }
                                overall.value(min);
                            },
                            onComplete:function(){
                                self.onCompleteSession();
                            },
                            max:self.session*60//in seconds
                        });
                    }, 
                    max:5
                });
            }})
        },20);

    }
    this.clearSession=function(){
        self.ele.find('.x_saving').html('').hide();
        self.ele.find('.x_stop').show()
        self.stopSession();
    }
    this.onCompleteSession=function(){
        self.gong.play();
        self.ele.find('.message').html('<b>'+self.session+' min</b> session <b>Completed!</b>');
        self.ele.find('.x_stop').hide()
        self.ele.find('.x_saving').html('<div style="font-size:20px;"><i class="icon-refresh animate-spin"></i> Saving...</div>').show();
        app.api({
            url:app.sapiurl+'/module/meditate/save',
            data:{
                length:self.session
            },
            timeout:5000,
            callback:function(resp){
                self.ele.find('.sessiontimer').children().remove();
                self.ele.find('.x_saving').render({
                    template:'module_meditate_save',
                    data:resp,
                    append:false,
                    binding:function(ele){
                        ele.find('.x_view').stap(function(){
                            self.selectPage('history',1);
                            self.clearSession();
                        },1,'tapactive');
                        ele.find('.x_done').stap(function(){
                            self.clearSession();
                        },1,'tapactive');
                        ele.find('.x_reload').stap(function(){
                            self.onCompleteSession();
                        },1,'tapactive');
                    }
                });
                if(resp.success&&resp.data){
                    self.infinitescroller.add(resp.data);
                }
            }
        });
    }
    this.formatTime=function(t){
        var formatted='';
        var int=Math.floor(t);
        var fpart=t-int;
        var seconds=parseInt((fpart*60).toFixed(0),10);
        if(seconds<10) seconds='0'+seconds;
        formatted=int+':'+seconds;
        return formatted;
    }
    this.startCountdown=function(opts){
        self.countdownopts=opts;
        self.ani=window.requestAnimationFrame(self.count);
    }
    this.cancelCountdown=function(){
        self.start=false;
        window.cancelAnimationFrame(self.ani);
    }
    this.count=function(timestamp){
        if (!self.start) self.start = timestamp;
        var diff=(timestamp-self.start)/1000;
        if(app.isdev) diff*=20;//make it 20x faster in dev
        if(diff<self.countdownopts.max){
            if(self.countdownopts.onFrame) self.countdownopts.onFrame(diff);
            self.ani=window.requestAnimationFrame(self.count);
        }else{
            self.cancelCountdown();
            if(self.countdownopts.onComplete) self.countdownopts.onComplete(diff);
        }
    }
    this.selectPage=function(page,updateui){
        var p=self.ele.find('[data-page='+page+']');
        if(updateui){
            self.ele.find('.x_swipenavitem').removeClass('selected');
            self.ele.find('[data-nav='+page+']').addClass('selected')
        }
        if(p.length){
            self.ele.find('.contentpage').hide();
            p.show();
            self.onPageSelect(page);
        }else{
            console.warn('No page ['+page+'] to show')
        }
        self.cpage=page;
        self.setStatView();
    }
    // this.wisdom={
    //     show:function(){
    //         var page=self.wisdom;
    //         if(!self.wisdom.rendered){
    //             self.wisdom.rendered=1;
    //             self.widsomfeed=new modules.feed({
    //                 ele:self.ele.find('[data-page=wisdom]'),
    //                 embedded:true,
    //                 data:{
    //                     page:{
    //                         id:'meditate',
    //                         type:'app'
    //                     },
    //                     name:'Meditation Wisdom'
    //                 }
    //             });
    //             self.widsomfeed.show();
    //         }else{

    //         }
    //     },
    //     hide:function(){
    //         var page=self.wisdom;
    //         //self.widsomfeed.show();

    //     }
    // }
    this.onPageSelect=function(page){
        if(page=='history'){
            self.chakras.start();
        }else{
            self.chakras.stop();
        }
        // if(page=='maps'){
        //     self.map.show();
        // }else{
        //     self.map.hide();
        // }
        // if(page=='wisdom'){
        //     self.wisdom.show();
        // }else{
        //     self.wisdom.hide();
        // }
        self.page=page;
    }
}