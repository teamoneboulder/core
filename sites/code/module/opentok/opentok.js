modules.opentok={
    call:function(room,user,video,debug){
        var self=this;

    },
    joinCall:function(opts){
        var self=this;
        if(!opts.renderopts){
            opts.renderopts={
                name:'Tom',
                id:'UC9QP6XFW',
                pic:'https://s3-us-west-2.amazonaws.com/groot/sites/nectar/union.jpg'
            };
        }
        self.startVideo(true,opts.renderopts,function(){
            self.getToken(opts.session,function(data){
                self.bindSession(data,1);
            })
        });
    },
    ensureOpenTokJs:function(cb){
        var url='https://static.opentok.com/v2/js/opentok.min.js';
        app.addFiles.js(url,app.addFiles.time,function(){
            cb(true)
        },function(){
            _alert('error loading JS');
        })
    },
    getToken:function(session_id,cb){
        app.api({
            url: app.apiurl2+'/opentok/token',
            data:{
                session:session_id
            },
            callback:function(resp){
                if(resp.success){
                    cb(resp);
                }else{
                    _alert('TODO: Error creating token');
                }
            }
        });
    },
    testCall:function(renderopts){
        var self=this;
        if(isPhoneGap()&&!window.OT){
            return _alert('OpenTok not installed');
        }
        if(!renderopts){
            renderopts={
                name:'Tom',
                id:'UC9QP6XFW',
                pic:'https://s3-us-west-2.amazonaws.com/groot/sites/nectar/union.jpg'
            };
        }
        self.startVideo(false,renderopts,function(){
            self.getSession(function(data){
                self.bindSession(data);
            })
        })
    },
    isNative:function(){

    },
    bindSession:function(data,join){
        var self=this;
        if(isPhoneGap()&&app.device=='iOS'){
            self.currentSession = OT.initSession(app.opentok_api_key, data.session);
            // Connect to the Session
            self.currentSession.connect(data.token, function(error){
              if (error) {
                 console.log('There was an error connecting to the session: ${error}');
              }
            });
            self.currentSession.on({
                sessionConnected:function(event){
                  // publish
                  self.ele.find('#videoloading').fadeOut(500,function(){
                    $(this).remove();
                  });
                  var publisher = OT.initPublisher('publisher');
                    self.currentSession.publish(publisher);
                    console.log(event);
                },
                streamCreated: function(event){
                    self.currentSession.subscribe(event.stream, 'subscriber');
                    console.log(event);
                    self.ele.find('#publisher').css({
                        top:'',
                        left:'',
                        bottom:5,
                        right:5,
                        width:150,
                        height:250
                    });
                    OT.updateViews()
                },
                streamDestroyed: function(event) {
                  console.log('Stream ${event.stream.name} ended because ${event.reason}');
                }
            });
        }else{
            self.currentSession = OT.initSession(app.opentok_api_key, data.session);
            // Create a publisher
              var publisher = OT.initPublisher('publisher', {
                insertMode: 'append',
                width: '100%',
                height: '100%'
              }, function(){
                //_alert('error creating publisher')
              });
              self.currentSession.on('sessionConnected', function(event) {
                self.ele.find('#videoloading').fadeOut(500,function(){
                    $(this).remove();
                  });
                self.currentSession.publish(publisher, function(){
                    //_alert('err publishinga')
                  });
              })
              self.currentSession.on('streamCreated', function(event) {
                  self.currentSession.subscribe(event.stream, 'subscriber', {
                    insertMode: 'append',
                    width: '100%',
                    height: '100%'
                  }, function(){
                        //_alert('err joining subscriber')
                        self.ele.find('#publisher').css({
                            top:'',
                            left:'',
                            bottom:5,
                            right:5,
                            width:80,
                            height:150
                        });
                  });
                });
              // Connect to the session
              self.currentSession.connect(data.token, function(error) {
                // If the connection is successful, publish to the session
              });
        }
    },
    stopVideo:function(){
       var self=this;
       self.endCall(function(){
            self.resetBG();
            self.currentSession.disconnect();
            self.ele.find('#videocontainer').find('.videos').remove();
            self.ele.fadeOut(500,function(){
                $(this).remove()
            });
       })
    },
    clearBG:function(){
        var self=this;
        if(isPhoneGap()&&app.device=='iOS'){
            $('html,body').css('background','transparent');
            $('#wrapper').hide();
            $('#footer_color').hide();
            self.ele.css('background','transparent');
            //hide all modals!
            if($.fn.alert.closeAlert){
                $.fn.alert.closeAlert();
                $.fn.alert.closeAlert();
            }
        }else{
            self.ele.css('background','black')
        }
    },
    resetBG:function(){
        if(isPhoneGap()&&app.device=='iOS'){
            $('html,body').css('background','white');
            $('#wrapper').show();
            $('#footer_color').show();
        }
    },
    endCall:function(cb){
        var self=this;
        //self.clearContact();
        if(isPhoneGap()&&app.device=='iOS'){
            cordova.plugins.CordovaCall.endCall(function(){
                cb();
            },function(){
                cb();
            });
        }else{
            cb();
        }
    },
    startVideo:function(add,renderopts,cb){
        var self=this;
        if(isPhoneGap()){
            app.ensureAndroidPerms('CAMERA',function(){
                app.ensureAndroidPerms('RECORD_AUDIO',function(){
                    $('body').render({
                        template:'opentok_call',
                        data:$.extend(true,{},{calling:(add)?0:1},renderopts),
                        binding:function(ele){
                            self.ele=ele;
                            self.clearBG();
                            ele.addClass('showcontrols')
                            ele.stap(function(){
                                ele.toggleClass('showcontrols');
                            },1,'tapactive');
                            ele.find('.x_endcall').stap(function(){
                                self.stopVideo();
                            },1,'tapactive')
                            cb();
                        }
                    });
                });
            });
        }else{
            $('body').render({
                template:'opentok_call',
                data:$.extend(true,{},{calling:(add)?0:1},renderopts),
                binding:function(ele){
                    self.ele=ele;
                    ele.stap(function(){
                        ele.toggleClass('showcontrols');
                    },1,'tapactive');
                    ele.find('.x_endcall').stap(function(){
                        self.stopVideo();
                    },1,'tapactive')
                    self.ensureOpenTokJs(function(){
                        cb();
                    })
                }
            })
        }
    },
    getSession:function(cb){
        app.api({
            url: app.apiurl2+'/opentok/createsession',
            data:{},
            callback:function(resp){
                if(resp.success){
                    cb(resp);
                }else{
                    _alert('TODO: Error creating session');
                }
            }
        });
    }
};