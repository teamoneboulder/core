modules.admin_home=function(options){
    var self=this;
    self.options=options;
    this.init=function(){
        app.canView=self.canView;
        app.user=new modules.user({
            onLogout:function(){
                self.renderLogin();
            },
            onValidAuth:function(){
                self.render();
            },
            onNoAuth:function(){
                //render login page!
                self.renderLogin()
            },
            onDoneLoading:function(){
                $('.page-loader').hide() 
            }
        });
    }
    this.renderLogin=function(){
        self.login=new modules.login({
            ele:$('#wrapper'),
            background:'https://wearenectar.s3.dualstack.us-east-1.amazonaws.com/static/admin_background.jpg',
            prettyClass:'prettyinput3',
            noPlaceholder:true,
            onLogin:function(data){
                app.user.load(data,function(){
                    self.render();
                });
            }
        });
    }
    this.getMenu=function(){
        var menu=[];
        if(self.canView('logs')){
            menu.push({
                id:'logs',
                name:'Logs',
                icon:'icon-code'
            })
        }
        if(self.canView('finances')){
            menu.push({
                id:'finances',
                name:'Finances',
                icon:'icon-academy'
            })
        }
        if(self.canView('tools')){
            menu.push({
                id:'tools',
                name:'Tools',
                icon:'icon-tools'
            })
        }
        // if(self.canView('onboard')){
        //     menu.push({
        //         id:'onboard',
        //         name:'Onboard Slides',
        //         icon:'icon-hero'
        //     })
        // }
        if(self.canView('cms')){
            menu.push({
                id:'cms',
                name:'CMS',
                icon:'icon-hero'
            })
        }
        // if(self.canView('waivers')){
        //     menu.push({
        //         id:'waivers',
        //         name:'Waivers',
        //         icon:'icon-doc-text-inv'
        //     })
        // }
        // if(self.canView('gameguide')){
        //     menu.push({
        //         id:'gameguide',
        //         name:'Game Guide',
        //         icon:'icon-hero'
        //     })
        // }
        if(self.canView('apptext')){
            menu.push({
                id:'apptext',
                name:'App Text',
                icon:'icon-doc-text'
            })
        }
        if(self.canView('notifications')){
            menu.push({
                id:'notifications',
                name:'Notifications',
                icon:'icon-mail'
            })
        }
        if(self.canView('data')){
            menu.push({
                id:'data',
                name:'Data',
                icon:'icon-key'
            })
        }
        if(self.canView('consierge')){
            menu.push({
                id:'checkin',
                name:'Check Ins',
                icon:'icon-logout'
            })
        }
        // if(self.canView('uploads')){
        //     menu.push({
        //         id:'uploads',
        //         name:'Uploads',
        //         icon:'icon-upload'
        //     })
        // }
        // if(self.canView('tools')){
        //     menu.push({
        //         id:'tools',
        //         name:'Tools',
        //         icon:'icon-settings'
        //     })
        // }
        if(self.canView('engagement')){
            menu.push({
                id:'engagement',
                name:'Engagement',
                icon:'icon-academy'
            })
        }
        if(self.canView('stats')){
            menu.push({
                id:'graphs',
                name:'Graphs',
                icon:'icon-bar-chart'
            })
        }
        if(self.canView('infastructure')){
            menu.push({
                id:'infastructure',
                name:'Infastructure',
                icon:'icon-bar-chart'
            })
        }
        // if(self.canView('stats')){
        //     menu.push({
        //         id:'stats',
        //         name:'Stats',
        //         icon:'icon-grid'
        //     })
        // }
        return menu;
    }
    this.canView=function(perm){
        if(app.user.profile.scopes.indexOf('*')>=0){
            return true
        }else if(app.user.profile.scopes.indexOf(perm)>=0) return true;
        return false;
    }
    this.pages={};
    this.setPage=function(page,internal){
        if(page==self.cpage) return false;
        if(self.cpage&&self.pages[self.cpage]){
            if(app.isdev){
                if(self.pages[self.cpage].destroy) self.pages[self.cpage].destroy();
                self.pages[self.cpage]=false;
            }else{
                self.pages[self.cpage].hide();
            }
        }
        if(!self.pages[page]){
            if(modules['admin_'+page]){
                phi.register('admin_'+page,{
                    ele:$('#contentpage'),
                    onRegister:function(instance){
                        self.pages[page]=instance.component;
                        self.pages[page].show();
                    }
                });
            }else{
                console.warn('invalid page! [admin_'+page+']');
            }
        }else{
           self.pages[page].show(); 
        }
        self.ele.find('.x_nav').removeClass('selected');
        self.ele.find('[data-nav='+page+']').addClass('selected');
        self.cpage=page;
        if(!internal) self.state_manager.setState();
    }
    this.getApps=function(){
        var menu=self.getMenu()
        var ret={
            list:{},
            order:[]
        }
        $.each(menu,function(i,v){
            ret.list[v.id]=v;
            ret.order.push(v.id);
        })
        return ret;
    }
    this.render=function(){
        var menu=self.getMenu();
        var ps=[];
        $.each(menu,function(i,v){
            ps.push(v.id);
        })
        self.state_manager=new modules.state_manager({
            base:'',
            setHistory:true,
            title:'One Admin',
            getPages:function(){
                var menu=self.getMenu();
                var ps=[];
                $.each(menu,function(i,v){
                    ps.push(v.id);
                })
                return ps
            },
            getTabData:function(){
                return true;
            },
            getPageName:function(){
                return true;
            },
            getNavPath:function(){
                if(self.pages[self.cpage]&&self.pages[self.cpage].cpage){
                    return self.cpage+'/'+self.pages[self.cpage].cpage;
                }else{
                    return self.cpage;
                }
            },
            getData:function(){
                return true;//no tab info
            },
            defaultPage:function(){
                if(options.page){
                    return options.page;
                }else if(options.state){
                    var sp=options.state.split('/');
                    return sp[1];
                }else{
                    return ps[0]
                }
            }
        })
        $('#wrapper').render({
            template:'admin_home',
            append:false,
            data:{
                header:'https://groot.s3.amazonaws.com/sites/nectar/img/header.png',
                menu:menu,
                vendors:[
                    {
                        id:'stripe',
                        pic:'https://s3.amazonaws.com/wearenectar/img/stripe.png',
                        name:'Stripe',
                        link:'https://dashboard.stripe.com'
                    },
                    {
                        id:'aws',
                        pic:'https://s3.amazonaws.com/wearenectar/img/aws.png',
                        name:'AWS',
                        link:'https://console.aws.amazon.com/'
                    }
                ]
            },
            binding:function(ele){
                self.ele=ele;
                self.setPage(self.state_manager.getLoadPage());
                ele.find('.x_nav').stap(function(){
                    self.setPage($(this).attr('data-nav'));
                },1,'tapactive')
                ele.find('.x_link').stap(function(){
                    modules.tools.openLink({intent:$(this).attr('data-link')});
                },1,'tapactive');
                ele.find('.x_profile').stap(function(){
                    self.showProfileMenu();
                },1,'tapactive',function(){
                    self.showProfileMenu()
                })
                self.statusCheck();
                modules.tools.setInterval('statuscheck',function(){
                    self.statusCheck();
                },6000);
                self.search=new modules.search({
                    input:ele.find('.x_usersearch'),
                    allowAdd:false,
                    web_inline:true,
                    web_container:ele.find('.x_usersearch').parent(),
                    searchOffsetTop:13,
                    disableLoading:false,
                    showNoResults:true,
                    endpoint:app.apiurl2+'/search/aggregate',
                    endpointData:{
                        filters:['people'],
                        allowMe:1,
                        graphData:{
                            people:['email']
                        }
                    },
                    renderTemplate:'admin_home_search',
                    cancelEle:ele.find('.x_cancel'),
                    onKeyUp:function(val){
                    },
                    onSelect:function(id,item){//might want or need full item.
                        self.showProfile(item);
                    }
                });
            }
        })
    }
    this.deleteUser=function(uid,code){
        modules.api({
            caller:'',
            url: app.sapiurl+'/user/delete', 
            data:{
                uid:uid,
                password:code
            },
            callback: function(data){
                if(data.success){
                    growl({
                        icon:'icon-thumbs-up',
                        content:'Successfully deleted user.',
                    });
                    $.fn.alert.closeAlert();
                }else{
                    growl({
                        icon:'icon-warning-sign',
                        content:data.error,
                        type:'error'
                    })
                }
            }
        });
    }
    this.getUser=function(oele,udata){
        modules.api({
            url: app.sapiurl+'/user/load', 
            data:{uid:udata.id},
            callback: function(data){
                self.user=data.user;
                oele.find('.x_loginas').show();
                oele.find('.x_fblink').show();
                oele.find('#moreuserinfo').render({
                    template:'admin_home_moreuserinfo',
                    append:false,
                    data:data,
                    binding:function(ele){
                        ele.find('.x_inviteoracle').stap(function(){
                            $('body').alert({
                                template:'admin_home_oracle_invite',
                                icon:'icon-oracle',
                                uid:'oracle',
                                closer:false,
                                overlay:true,
                                loc:'top',
                                buttons:[{
                                    btext:'Invite!',
                                    bclass:'yesbtn'
                                },{
                                    btext:'Cancel',
                                    bclass:'x_closer'
                                }],
                                binding:function(ele){
                                    ele.find('#shorturl').on('keyup paste input',function(){
                                        $(this).val($(this).val().safeURL())
                                    })
                                    ele.find('.yesbtn').stap(function(){
                                        var v=ele.find('#shorturl').val().safeURL();
                                        if(!v.length){
                                            growl({
                                                icon:'icon-warning-sign',
                                                content:'Please provide a short URL'
                                            })
                                            return false;
                                        }
                                        growl({
                                            id:'processing',
                                            remove:false,
                                            icon:'icon-refresh animate-spin',
                                            content:'Inviting...'
                                        });
                                        modules.api({
                                            caller:'Action',
                                            url: app.sapiurl+'/user/inviteoracle', 
                                            data:{
                                                url:v,
                                                uid:self.user.id
                                            },
                                            callback: function(data){
                                                if(data.success){
                                                    growl({
                                                        id:'processing',
                                                        remove:2000,
                                                        icon:'icon-thumbs-up',
                                                        content:'Successfully invited!'
                                                    });
                                                    self.getUser(oele,udata);//reload!
                                                    $.fn.alert.closeAlert();
                                                }else{
                                                    growl({
                                                        id:'processing',
                                                        remove:2000,
                                                        icon:'icon-warning-sign',
                                                        content:'Error inviting '+data.error
                                                    });
                                                }
                                            }
                                        });
                                    },1,'tapactive')
                                    // ele.find('.x_closer').stap(function(){
                                    //     $.fn.alert.closeAlert();
                                    // },1,'tapactive')
                                }
                            })
                            if(false) $.fn.confirm({
                                template:'oracle_invite',
                                icon:'icon-oracle',
                                loc:'top',
                                buttons:[{
                                    btext:'Invite!',
                                    bclass:'yesbtn'
                                },{
                                    btext:'Cancel',
                                    bclass:'x_closer'
                                }],
                                cb:function(success){
                                    if(success){
                                        growl({
                                            id:'processing',
                                            remove:false,
                                            icon:'icon-refresh animate-spin',
                                            content:'Inviting...'
                                        });
                                        app.api({
                                            caller:'Action',
                                            url: app.sapiurl+'/user/inviteoracle', 
                                            data:{
                                                uid:self.user.id
                                            },
                                            callback: function(data){
                                                if(data.success){
                                                    growl({
                                                        id:'processing',
                                                        remove:2000,
                                                        icon:'icon-thumbs-up',
                                                        content:'Successfully invited!'
                                                    });
                                                    self.getUser(oele,udata);//reload!
                                                }else{
                                                    growl({
                                                        id:'processing',
                                                        remove:2000,
                                                        icon:'icon-warning-sign',
                                                        content:'Error inviting '+data.error
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            })
                        },1,'tapactive')
                        ele.find('.x_stopmembership').stap(function(){
                             $.fn.confirm({
                                text:'<div style="text-align:center">Are you sure you want to stop the membership?</div>',
                                icon:'icon-warning-sign',
                                loc:'top',
                                buttons:[{
                                    btext:'<i class="icon-stop"></i> Stop',
                                    bclass:'yesbtn btn-danger'
                                },{
                                    btext:'Cancel',
                                    bclass:'x_closer'
                                }],
                                cb:function(success){
                                    if(success){
                                        growl({
                                            id:'processing',
                                            remove:false,
                                            icon:'icon-refresh animate-spin',
                                            content:'Stopping membership'
                                        });
                                        modules.api({
                                            caller:'Action',
                                            url: app.sapiurl+'/user/stopmembership', 
                                            data:{
                                                uid:self.user.id
                                            },
                                            callback: function(data){
                                                if(data.success){
                                                    growl({
                                                        id:'processing',
                                                        remove:2000,
                                                        icon:'icon-thumbs-up',
                                                        content:'Successfully stopped membership'
                                                    });
                                                    self.getUser(oele,udata);//reload!
                                                }else{
                                                    growl({
                                                        id:'processing',
                                                        remove:2000,
                                                        icon:'icon-warning-sign',
                                                        content:'Error stopping membership '+data.error
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            })
                        },1,'tapactive')
                        ele.find('.x_retry').stap(function(){
                            if(ele.find('.x_retry').find('i').hasClass('animate-spin')) return false;
                            ele.find('.x_retry').find('i').addClass('animate-spin')
                            self.getUser(ele,data);
                        });
                        ele.find('.x_deletedevice').stap(function(e){
                            phi.stop(e);
                            var p=$(this).parents('.userdevice');
                            var id=$(this).attr('data-id');
                            var device=data.user.devices.list[id];
                            $.fn.confirm({
                                text:'<div style="text-align:center">Are you sure you want to delete this device?</div>',
                                icon:'icon-warning-sign',
                                loc:'top',
                                buttons:[{
                                    btext:'<i class="icon-trash-empty"></i> Remove',
                                    bclass:'yesbtn'
                                },{
                                    btext:'Cancel',
                                    bclass:'x_closer'
                                }],
                                cb:function(success){
                                    if(success){
                                        self.removeDevice(device,function(){
                                            data.user.devices.order.splice(data.user.devices.order.indexOf(id),1);
                                            p.fadeOut(500,function(){
                                                $(this).remove()
                                                if(!data.user.devices.order.length){
                                                    $('#devices').html('No Devices');
                                                }
                                            })
                                        });
                                    }
                                }
                            })
                        })
                        ele.find('.x_revoke_app').stap(function(){
                            var p=$(this).parent();
                            self.revokeToken(data.user.apps.list[$(this).attr('data-id')],function(){
                                p.fadeOut(500,function(){
                                    $(this).remove();
                                })
                            })
                        })
                        ele.find('.userdevice').stap(function(){
                            self.testPush(udata,data.user.devices.list[$(this).attr('data-id')]);
                        })
                    }
                })
            }
        })
    }
    this.testPush=function(user,device){
        $('body').alert({
            id:'push',
            uid:'push',
            overlay:1,
            icon:false,
            loc:'top',
            template:'admin_home_testpush',
            buttons:[{
                btext:'<i class="icon-logout"></i> Send Push',
                bclass:'x_send'
            }],
            bindings:[{
                type:'fn',
                binding:function(ele){
                    ele.find('.x_send').stap(function(){
                        if($(this).find('i').hasClass('icon-refresh')) return false;
                        var te=$(this)
                        te.find('i').removeClass('icon-logout').addClass('icon-refresh animate-spin')
                        var msg=ele.find('#pushmessage').val();
                        var intent=ele.find('#intent').val();
                        var call=ele.find('.x_call').val();
                        console.log(call);
                        if(!msg){
                            growl({
                                icon:'icon-warning-sign',
                                content:'Must Provided Message'
                            })
                            return false;
                        }
                        modules.api({
                            caller:'Send Push',
                            url: app.sapiurl+'/action/testpush', 
                            data:{
                                message:msg,
                                intent:intent,
                                device:device.id,
                                call:(call)?1:''
                            },
                            callback: function(tdata){
                                te.find('i').addClass('icon-logout').removeClass('icon-refresh animate-spin')
                                if(tdata.success){
                                    $.fn.alert.closeAlert();
                                    growl({
                                        icon:'icon-thumbs-up',
                                        content:'Successfully Sent'
                                    })
                                }else{
                                    growl({
                                        icon:'icon-warning-sign',
                                        content:'Error Sending ['+tdata.error+']'
                                    })
                                }
                            }
                        });
                    })
                }
            }]
        })
    }
    this.statusCheck=function(){
        if(!self.canView('admin')) return false;
        modules.api({
            caller:'Action',
            url: app.sapiurl+'/statuscheck', 
            data:{
            },
            callback:function(data){
                if(data.success){
                    self.ele.find('.statstitles').each(function(i,v){
                        var id=$(v).attr('data-id');
                        if(data.data[id]){
                            $(v).html(data.data[id]);
                        }else{
                            console.warn('invalid')
                        }
                    })
                    if(data.data.activeUsers){
                        self.ele.find('.usercount').html(data.data.activeUsers.addCommas())
                    }
                    self.status_data=data;
                    self.info=self.parseStatus(data);
                    self.ele.find('.statusinfo').render({
                        template:'admin_home_statusinfo',
                        append:false,
                        data:{
                            urgent:data.data.urgent,
                            count:self.info.count
                        },
                        binding:function(ele){
                            ele.stap(function(){
                                self.showStatus($(this).find('i'));
                            },1,'tapactive',function(){
                                self.showStatus($(this).find('i'));
                            })
                        }
                    })
                }
            }
        });
    }
    this.showStatus=function(ele){
        var alert=new modules.alertdelegate({
            display:{
                ele:ele,
                container:self.ele,
                locations:['topcenter']
            },
            contentTemplate:'admin_home_statusmenu',
            data:{
                info:self.info,
                data:self.status_data
            },
            binding:function(ele){
                
            }
        });
        alert.show();
    }
    this.parseStatus=function(data){
        var info={
            items:{
                list:{},
                order:[]
            },
            count:0
        }
        if(data.data.email_required&&data.data.email_required.order.length){
            info.count+=data.data.email_required.order.length;
            info.items.order.push('email_required');
            info.items.list['email_required']={
                title:data.data.email_required.order.length+' Email Templates Missing!',
                subitems:[]
            }
            $.each(data.data.email_required.order,function(i,v){
                var ti=data.data.email_required.list[v];
                info.items.list['email_required'].subitems.push({
                    content:'Missing '+ti.name
                })
            })
        }
        if(data.data.push_required&&data.data.push_required.order.length){
            info.count+=data.data.push_required.order.length;
            info.items.order.push('push_required');
            info.items.list['push_required']={
                title:data.data.push_required.order.length+' Push Templates Missing!',
                subitems:[]
            }
            $.each(data.data.push_required.order,function(i,v){
                var ti=data.data.push_required.list[v];
                info.items.list['push_required'].subitems.push({
                    content:'Missing '+ti.name
                })
            })
        }
        if(data.data.app_required&&data.data.app_required.order.length){
            info.count+=data.data.app_required.order.length;
            info.items.order.push('app_required');
            info.items.list['app_required']={
                title:data.data.app_required.order.length+' App Notification Templates Missing!',
                subitems:[]
            }
            $.each(data.data.app_required.order,function(i,v){
                var ti=data.data.app_required.list[v];
                info.items.list['app_required'].subitems.push({
                    content:'Missing '+ti.name
                })
            })
        }
        return info;
    }
    this.revokeToken=function(token,cb){
        growl({
            id:'process',
            remove:false,
            icon:'icon-refresh animate-spin',
            content:'Processing...'
        })
        modules.api({
            caller:'Action',
            url: app.sapiurl+'/action/revoketoken', 
            data:{
                app_token:token.id
            },
            callback: function(data){
                if(data.success){
                    growl({
                        id:'process',
                        icon:'icon-thumbs-up',
                        content:'Successfully revoked app'
                    });
                    cb();
                }else{
                    growl({
                        id:'process',
                        remove:false,
                        icon:'icon-warning-sign',
                        content:'Error removing device'
                    });
                }
            }
        });
    }
    this.removeDevice=function(device,cb){
        growl({
            id:'process',
            remove:false,
            icon:'icon-refresh animate-spin',
            content:'Processing...'
        })
        modules.api({
            caller:'Action',
            url: app.sapiurl+'/action/removedevice', 
            data:{
                device:device.id
            },
            callback: function(data){
                if(data.success){
                    growl({
                        id:'process',
                        remove:5000,
                        icon:'icon-thumbs-up',
                        content:'Successfully removed device'
                    });
                    cb();
                }else{
                    growl({
                        id:'process',
                        remove:false,
                        icon:'icon-warning-sign',
                        content:'Error removing device'
                    });
                }
            }
        });
    }
    this.showProfile=function(data){
        //console.log(data)
        $('body').alert({
            id:'userview',
            uid:'userview',
            template:'admin_home_userview',
            tempdata:data,
            loc:'top',
            icon:false,
            overlay:true,
            bindings:[{
                type:'fn',
                binding:function(ele){
                    ele.find('.x_loginas').stap(function(){
                        self.loginAs()
                    },1,'tapactive');
                    ele.find('.x_magic').stap(function(){
                        self.magicLink(data.id);
                    },1,'tapactive');
                    ele.find('.x_fblink').stap(function(){
                        self.fbLink()
                    },1,'tapactive');
                    ele.find('.x_delete').stap(function(){
                        $.fn.confirm({
                            uid:'confirm1',
                            text:'<div style="text-align:center">Are you *REALLY* sure you want to delete this user?</div>',
                            icon:'icon-trash-empty',
                            loc:'top',
                            buttons:[{
                                btext:'<i class="icon-trash-empty"></i> Remove',
                                bclass:'btn-danger yesbtn'
                            },{
                                btext:'Cancel',
                                bclass:'x_closer'
                            }],
                            cb:function(success){
                                if(success){
                                    $.fn.confirm({
                                        uid:'confirm2',
                                        text:'<div style="text-align:center"><input type="password" class="s-corner-all x_input" style="padding:10px;font-size:20px;border:1px solid #ccc;" placeholder="Enter Password"></div>',
                                        icon:'icon-trash-empty',
                                        loc:'top',
                                        buttons:[{
                                            btext:'<i class="icon-trash-empty"></i> Remove',
                                            bclass:'btn-danger yesbtn'
                                        },{
                                            btext:'Cancel',
                                            bclass:'x_closer'
                                        }],
                                        cb:function(success,ele){
                                            if(success){
                                                var code=ele.find('.x_input').val();
                                                self.deleteUser(data.id,code);
                                            }
                                        }
                                    })
                                }
                            }
                        })
                    },1,'tapactive')
                    self.getUser(ele,data);
                }
            }]
        });
    }
    this.magicLink=function(uid){
        growl({
            id:'magic',
            icon:'icon-refresh animate-spin',
            content:'Getting',
        }) 
        modules.api({
            caller:'',
            url: app.sapiurl+'/user/magiclink', 
            data:{
                uid:uid
            },
            callback: function(data){
                if(data.success){
                    modules.clipboard.copy(data.magiclink,function(){
                        growl({
                            id:'magic',
                            icon:'icon-thumbs-up',
                            content:'Successfully copied content!',
                        }) 
                    },function(){
                        growl({
                            id:'magic',
                            icon:'icon-warning-sign',
                            content:'Error getting clipboard',
                        }) 
                    })
                }else{
                    growl({
                        id:'magic',
                        icon:'icon-warning-sign',
                        content:data.error,
                        type:'error'
                    })
                }
            }
        });
    }
    this.loginAs=function(){
        var self=this;
        if(self.user.login){
            window.open(self.user.login,'_blank');
        }else{
            _alert('invalid login');
        }
    }
    this.fbLink=function(){
        if(self.user.fblink){
            modules.clipboard.copy(self.user.fblink,function(){
                growl({
                    icon:'icon-thumbs-up',
                    content:'Successfully copied content!',
                }) 
            },function(){
                growl({
                    icon:'icon-warning-sign',
                    content:'Error getting clipboard',
                }) 
            })
        }else{
            _alert('invalid link');
        }
    },
    this.showProfileMenu=function(){
        var alert=new modules.alertdelegate({
            display:{
                ele:self.ele.find('.x_profile'),
                container:$('#wrapper'),
                noCheck:1,
                width:150
            },
            menu:[{
                id:'logout',
                name:'Sign Out?',
                icon:'icon-signout'
            }],
            onSelect:function(id){
                if(id=='logout'){
                    app.user.logout();
                }
            }
        });
        alert.show();
    }
    this.init();
}