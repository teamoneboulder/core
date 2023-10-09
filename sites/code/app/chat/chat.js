if(!window.modules) window.modules={};
modules.chat=function(options,renderTo){
	this.options=options;
	var self=this;
	this.show=function(){
        // if(self.options.people.length==1){//trust
        //     _alert('bug! should show profile!')
        // }else{//multiperson chat
            async.parallel([self.showLoader,self.loadKeyboard],function(){
                self.onViewReady();
            })
        //}
	}
    this.focus=function(){
        self.keyboard.focus();
    }
    this.isActive=function(){
        if(self.keyboard&&self.keyboard.isActive()) return true;
        return false;
    }
    this.setStatView=function(){
        modules.stats.setPage('groupchat');
    }
    this.onViewReady=function(){
        self.ele.find('.chatcontent').show();
        self.ele.find('.loaderarea').hide();
        self.ele.find('.errormessage').remove();//not needed anymore
        self.keyboard.onPageReady();
        self.isVisible=true;
        if(self.options.onViewReady) self.options.onViewReady();
    }
    this.stop=function(){
        if(self.profile){
            self.profile.stop()
        }else if(self.keyboard){
             self.keyboard.stop();
        }
    }
    this.start=function(){
         if(self.profile){
            self.profile.start()
        }else if(self.keyboard) self.keyboard.start();
    }
    this.onResume=function(){
        if(self.profile){
            self.profile.onResume()
        }else if(self.keyboard) self.keyboard.onResume();
    }
    this.loadKeyboard=function(cb){
        if(!self.options.keyboardOptions) self.options.keyboardOptions={};
        self.options.keyboardOptions.module='chat';
        // if(app.isdev) self.options.keyboardOptions.mode='picture';
        // else self.options.keyboardOptions.mode='simple';
//        self.options.keyboardOptions.mode='picture';
        self.options.keyboardOptions.mode='advanced';
        self.options.keyboardOptions.focusOnLoad=true;
        self.options.keyboardOptions.keepFocusOnSend=true;
        self.options.keyboardOptions.scrollToBottom=true;
        self.options.keyboardOptions.adjustOnKeyboardShow=true;
        self.options.keyboardOptions.scrollOnNewMessage=true;
        self.options.keyboardOptions.endpoint_module='chat';
        self.keyboard=new modules.keyboard({
            backgroundClass:'',
            ele:self.ele.find('.keyboardinput'),
            scrollele:self.ele.find('.scrollcontent'),
            room:self.options.id,
            identity:self.options.identity,
            showDiff:0,
            getContainerWidth:self.options.getContainerWidth,
            keyboardOptions:self.options.keyboardOptions,
            renderTemplate:'chat_item',
            asyncLoad:true,
            timeToggle:true,
            moveParentReplyToBottom:true,
            readReceipts:true,
            onAction:function(action,data){
                switch(action){
                    case 'serviceDecline':
                        if(self.sending) return false;
                        self.sending=true;
                        modules.api({
                            url:app.sapiurl+'/module/service/pay/'+data.id,
                            data:{
                            },
                            timeout:5000,
                            callback:function(resp){
                                self.sending=false;
                                if(resp.success){
                                    _alert('success');
                                }else{
                                   
                                }
                            }
                        });                       
                    break;
                    case 'servicePay':
                        _alert('modal to select payment method / pay');
                    break;
                }
                console.log(action,data)
            },
            onMessage:function(){
                if(!self.isVisible){
                    self.profile.pages.chat.incCount();
                }
            },
            infinitescroll:{
                max:15,
                buttonLoad:true,//hack for infinite scrolling in reverse
                template:'chat_item',
                endpoint:app.sapiurl+'/module/chat/load',
                opts:{
                    room:self.options.id
                },
                // renderData:{
                //     container:{
                //         width:self.ele.find('.scrollcontent').width(),
                //         height:self.ele.find('.scrollcontent').height()
                //     }
                // },
                onPageReady:function(ele){
                    modules.chat_global.bindItems(ele,self.keyboard)
                    ele.find('.x_viewprofile').stap(function(){
                        var p=self.keyboard.infinitescroll.getById($(this).attr('data-id'));
                        app.history.go('/profile/'+p.user.id);
                        //app.showProfile(p.user);
                    },1,'tapactive')
                },
                onExtraData:function(ele,data){
                    self.renderFriendRequest(data);
                },
                offset:'200%',
                reverse:true,
                endOfListColor:'black',
                endOfList:'Beginning of chat history',
                nodata:'No Chats Yet',
                onAsyncReady:cb,
                swipeToClose:true,
                scrollBindings:{
                    onSwipe:function(e){
                        self.onSwipe(e);
                    },
                    onSwipeEnd:function(e){
                       self.onSwipeEnd(e);
                    },
                    onSwipeStart:function(e){
                        console.log('swipe')
                    }
                },
                //disabled:true,//will load first page
                // onLoadError:function(resp){
                //     //self.showLoadError(resp);
                // }
            }
        });
    }
    this.clearFriendRequest=function(msg){
        if(!msg||app.user.profile.id!=msg.from){//only close others that are currently looking at it
            if(self.frele&&self.frele.length){
                TweenLite.to(self.frele,.2,{y:'-300px',onComplete:function(){
                    self.frele.remove();
                }})
            }
        };
    }
    this.renderFriendRequest=function(data){
        //change status of friend request
        self.request=data;
        self.ele.find('.friendrequest').render({
            template:'profile_friendrequest',
            append:false,
            data:{
                data:data
            },
            binding:function(ele){
                self.frele=ele;
                ele.find('.toggleview').stap(function(){
                    ele.find('.friendview').toggleClass('hideview');
                },1,'tapactive');
                ele.find('.x_yes').stap(function(){
                    self.permissions=new modules.permissions({
                        id:data.from_info.id,
                        name:data.from_info.name,
                        pic:data.from_info.pic,
                        request:self.request,
                        onSuccess:function(){
                            self.clearFriendRequest();
                        }
                    });
                    self.permissions.show();
                },1,'tapactive')
                ele.find('.x_delete').stap(function(){
                    ele.find('.x_delete').html('<i class="icon-refresh animate-spin"></i>');
                    self.deny(function(success,resp){
                        if(success){
                            //hide!
                            TweenLite.to(ele,.2,{y:'-300px',onComplete:function(){
                                $(this).remove();
                            }})
                        }else{
                            ele.find('.x_delete').html(ele.find('.x_delete').attr('data-text'));
                            modules.toast({
                                content:resp.error,
                                remove:2500,
                                icon:'icon-warning-sign'
                            })
                        }
                    });
                },1,'tapactive')
                ele.find('.x_no').stap(function(){
                    ele.find('.x_no').html('<i class="icon-refresh animate-spin"></i>');
                    self.deny(function(success,resp){
                        if(success){
                            self.onNo();
                        }else{
                            ele.find('.x_no').html(ele.find('.x_no').attr('data-text'));
                            modules.toast({
                                content:resp.error,
                                remove:2500,
                                icon:'icon-warning-sign'
                            })
                        }
                    });
                },1,'tapactive')
                ele.find('.x_report').stap(function(){
                    var report=new modules.report({
                        type:'friendrequest',
                        id:data.id,
                        data:data
                    })
                    report.show();
                },1,'tapactive')
            }
        })

    }
    this.deny=function(cb){
        if(self.sending) return false;
        self.sending=true;
        modules.api({
            url:app.sapiurl+'/module/permissions/'+self.request.from+'/delete',
            data:{
                id:self.request.id
            },
            timeout:5000,
            callback:function(resp){
                self.sending=false;
                if(resp.success){
                    cb(true);
                }else{
                    cb(false,resp);
                }
            }
        });
    }
    this.onNo=function(){
        self.ele.find('.friendrequest').render({
            template:'profile_friendrequest_no',
            append:false,
            data:{
            },
            binding:function(ele){
                self.nele=ele;
                setTimeout(function(){
                    ele.find('textarea').focus();
                },50);
                //autosize
                ele.find('textarea').autosize();
                ele.find('.x_no').stap(function(){
                    TweenLite.to(ele,.2,{y:'-300px',onComplete:function(){
                        $(this).remove();
                    }})
                },1,'tapactive')
                ele.find('.x_yes').stap(function(){
                    var text=ele.find('textarea').val();
                    if(!text){
                        modules.toast({
                            content:'Please enter text before sending...',
                            remove:2500,
                            icon:'icon-warning-sign'
                        })
                        return false;
                    }
                    self.sendFeedback();
                },1,'tapactive');
            }
        });
    }
    this.sendFeedback=function(){
        if(self.sending) return false;
        self.sending=true;
        self.ele.find('.x_yes').html('<i class="icon-refresh animate-spin"></i>');             
        modules.api({
            url:app.sapiurl+'/module/permissions/'+self.request.from+'/respond',
            data:{
                id:self.request.id,
                message:self.nele.find('textarea').val()
            },
            timeout:5000,
            callback:function(resp){
                self.sending=false;
                if(resp.success){
                    TweenLite.to(self.nele,.2,{y:'-300px',onComplete:function(){
                        $(this).remove();
                    }})
                }else{
                    self.ele.find('.x_yes').html(self.ele.find('.x_yes').attr('data-text'));
                    modules.toast({
                        content:resp.error,
                        remove:2500,
                        icon:'icon-warning-sign'
                    })
                }
            }
        });
    }
    this.onSwipe=function(info){
        if(info.dx>0){
            TweenLite.set($('#subpagewrapper'),{x:info.dx})
        }
    }
    this.onSwipeEnd=function(info){
        if(info.dx>50){
            //animate
            self.goBack();
        }else{
           TweenLite.to($('#subpagewrapper'),.2,{x:0})
        }
    }
    this.reload=function(){
        self.replace=true;
        if(self.keyboard) self.keyboard.destroy();
        self.show();
    }
    this.add=function(){
        //app.comingSoon();
        self.adder=new modules.add({
            type:'chat',
            data:{
                //ele:self.ele,
                id:options.id,
                data:options,
                current:self.options,
                onSuccess:function(resp){
                    self.options.people=resp.people;
                    self.options.people_list=resp.people_list;
                    self.reload();
                }
            }
        })
        self.adder.show();
        // modules.chat_global.addPeople({ele:self.ele,id:options.id,data:options,onSuccess:function(resp){
        //     self.options.replace=true;
        //     self.options.people=resp.people;
        //     self.options.people_list=resp.people_list;
        //     self.reload();
        // }});
    }
    this.onPageReady=function(ele,onback){
        self.replace=false;
        if(onback) self.onback=onback;
        ele.find('.x_people').stap(function(){
            var menu=[];
            // menu.push({
            //     id:'add',
            //     name:'Add People',
            //     icon:'icon-add-clean'
            // })
            // menu.push({
            //     id:'invite',
            //     name:'Invite People',
            //     icon:'icon-mail'
            // })
            $.each(options.people_list,function(i,p){
                menu.push(p)
            })
            // menu.push({
            //     id:app.user.profile.id,
            //     name:app.user.profile.name,
            //     pic:app.user.profile.pic,
            //     type:'profile'
            // })
            modules.keyboard_global.hide();
            var inline=new modules.inlinemenu({
                button:$(this),
                ele:ele,
                render_template:'modules_inlinemenu_peoplelist',
                menu:menu,
                onSelect:function(id,opts){
                    if(id=='add'){
                        self.add();
                    }else if(id=='invite'){
                        var url=app.domain+'?referal='+app.user.profile.id+'&action='+encodeURIComponent($.param({type:'addToChat',uid:app.user.profile.id,data:{id:options.id}}))
                        app.share({
                            url:url
                        })
                    }else{
                        if(opts.type=='person'||opts._type=='people'){
                            modules.viewdelegate.register('profile',{
                                id:opts.id,
                                ele:$('#homecontainer'),
                                data:opts
                            })
                        }
                        if(opts.type=='page'||opts._type=='page'){
                            modules.viewdelegate.register('page',{
                                id:opts.id,
                                ele:$('#homecontainer'),
                                data:opts
                            })
                        }
                    }
                }
            });
            inline.show();
        },1,'tapactive')
        ele.find('.middlearea').stap(function(){
            //show profile
            if(!_.isWebLayout()){
                if(options.people&&options.people.length==1){
                    //console.log(options)
                    self.profile.showFullProfile();
                }
            }else{
                if(options.people&&options.people.length==1){
                    //console.log(options)
                    var person=options.people_list[options.people[0]];
                    app.showProfile(person);
                }
            }
        },1,'tapactive');
        ele.find('.x_phone').stap(function(){
            var person=options.people_list[options.people[0]];
            app.webrtc.call(person,1);
        },1,'tapactive')
        ele.find('.backbtn').stap(function(){
            self.goBack();
        },1,'tapactive');
    }
    this.showLoader=function(cb){
        var rele=$('#homecontainer');
        if(renderTo){
            if(self.replace){
                renderTo=self.ele.parent();//replacing
            }
            renderTo.render({
                template:'module_chat_page_web',
                data:options,
                append:false,
                binding:function(ele){
                    self.ele=ele;
                    self.onPageReady(ele,false);
                    cb();
                }
            })
        }else{
            $('#homecontainer').subpage({
                uid:'chat_page_'+options.id,
                loadtemplate:'module_chat_page',
                data:options,
                replace:self.replace,
                animation:(self.replace)?false:'slideup',
                binding:false,
                onPageRendered:function(ele){
                    self.ele=ele;
                },
                onPageReturn:function(){
                    self.destroy();
                },
                onPageReady:function(ele,onback){
                    self.onPageReady(ele,onback);                    
                    cb();
                }
            });
        }
    }
    this.goBack=function(){
        if(options.onClose) options.onClose();
        //self.destroy();//going back! clean up!
        self.stop();
        if(self.profile) self.profile.destroy();
        modules.keyboard_global.hide();
        if(self.onback) self.onback(function(){
            modules.viewdelegate.onBack();
            if(self.keyboard) self.keyboard.destroy()
        });
    }
    this.destroy=function(){
        if(self.keyboard) self.keyboard.destroy();
        self.ele.remove();
    }
}