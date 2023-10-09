modules.admin_engagement=function(options){
	var self=this;
	this.show=function(){
		options.ele.render({
			uid:'admin_engagement',
			force:1,
			template:'admin_engagement2',
            data:{
                menu:[{
                    _id:'custom',
                    name:'Custom Notifications',
                },{
                    _id:'system',
                    selected:true,
                    name:'System Notifications'
                }]
            },
			binding:function(ele){
				self.ele=ele;
                window._ui.register('engagementnav',{
                    onNavSelect:function(cur,ele){
                        self.setPage(cur);
                    }
                });
                ele.find('.x_new').stap(function(){
                    self.renderEmail({
                        type:self.cpage
                    });
                },1,'tapactive');
                self.inf=new modules.infinitescroll({
                    ele:self.ele.find('.emaillist'),
                    endpoint:app.sapiurl+'/engagement/get',
                    loaderClass:'lds-ellipsis-black',
                    channel:'admin_engagement',
                    offset:'200%',
                    waitForReload:true,
                    //checkNextPage:true,
                    onInterval:{
                        time:3000,
                        callback:function(){
                            //pself.updateTimes();
                        }
                    },
                    opts:{
                    },
                    max:40,
                    template:'admin_engagement_emailitem',
                    nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>Nothing here yet.</div></div>',
                    onPageReady:function(ele){
                        ele.find('.rowitem').stap(function(){
                            self.renderEmail($.extend(true,{},self.inf.getById($(this).attr('data-id'))));
                        }) 
                    },
                    scrollBindings:{
                        scrollStart:function(){
                        },
                        scroll:function(obj){
                        }
                    }
                });
                self.setPage('system');
                self.renderEmail();
			}
		})
	}
    this.setPage=function(page){
        self.inf.options.opts.type=page;
        self.inf.reload();
        self.cpage=page;
        self.inf.options.template=self.getTemplate();
    }
    this.getTemplate=function(){
        return (self.cpage=='custom')?'admin_email_nav':'admin_engagement_notification';
    }
    this.getSchema=function(){
        return (self.cpage=='custom')?'admin_email':'admin_notification';
    }
    this.getSendType=function(){
        return 'send';
    }
    this.renderEmail=function(data){
        if(!data){
            self.ele.find('.emailcontent').render({
                template:'admin_engagement_email_welcome',
                append:false,
                data:{
                }
            });
            return false;
        }
        self.cdata=data;
        self.ele.find('.emailcontent').render({
            template:'admin_engagement_email',
            append:false,
            data:{
                data:data,
                page:self.cpage
            },
            binding:function(ele){
                var pele=ele;
                self.loadCount();
                if(false) ele.find('.x_segment').stap(function(){
                    var alert=new modules.alertdelegate({
                        display:{
                            ele:$(this),
                            container:ele,
                        },
                        group:'admin_engagement',
                        renderFunction:function(ele){
                            self.filter=new modules.filter2({
                                nocache:true,
                                type:'people',
                                ele:ele,
                                inline:true,
                                filter:self.cdata.filter,
                                count:{
                                    ele:self.ele.find('.segmentcount'),
                                    endpoint:app.sapiurl+'/engagement/count'
                                },
                                onFilterChange:function(filter){
                                    console.log(filter);
                                    self.cdata.filter=filter;
                                    self.queueSave();
                                },
                                conf:{
                                    order:['distance','member_settings','paid_personal','overdue','business_info','facebook_link','facebook_post','facebook_friend','facebook_post_off','facebook_friend_off','intro_video','loc_city','callout','callout'],
                                    list:{
                                        distance:{
                                            id:'distance',
                                            type:'distance'
                                        },
                                        facebook_link:{
                                            id:'facebook_link',
                                            type:'onoff',
                                            name:'Not fully linked facebook account'
                                        },
                                        overdue:{
                                            id:'overdue',
                                            type:'onoff',
                                            name:'Overdue Accounts'
                                        },
                                        paid_personal:{
                                            id:'paid_personal',
                                            type:'onoff',
                                            name:'All who have had an active paid personal account with no businesses'
                                        },
                                        business_info:{
                                            id:'business_info',
                                            type:'onoff',
                                            name:'Onboarded with business info (old way)'
                                        },
                                        facebook_post:{
                                            id:'facebook_post',
                                            type:'onoff',
                                            name:'Has Facebook Post Permission'
                                        },
                                        facebook_friend:{
                                            id:'facebook_friend',
                                            type:'onoff',
                                            name:'Has Facebook Friend Permission'
                                        },
                                        facebook_post_off:{
                                            id:'facebook_post_off',
                                            type:'onoff',
                                            name:'<b>Doesnt</b> Have Facebook Post Permission'
                                        },
                                        facebook_friend_off:{
                                            id:'facebook_friend_off',
                                            type:'onoff',
                                            name:'<b>Doesnt</b> Have Facebook Friend Permission'
                                        },
                                        intro_video:{
                                            id:'intro_video',
                                            type:'onoff',
                                            name:'<b>Doesnt</b> Have Intro Video'
                                        },
                                        loc_city:{
                                            id:'loc_city',
                                            type:'onoff',
                                            name:'<b>Doesnt</b> Have Home City Set'
                                        },
                                        callout:{
                                            id:'callout',
                                            type:'onoff',
                                            name:'<b>Doesnt</b> Have Callout Set'
                                        },
                                        password:{
                                            id:'password',
                                            type:'onoff',
                                            name:'<b>Doesnt</b> Have Password Set'
                                        },
                                        member_settings:{
                                            id:'member_settings',
                                            type:'togglecheck',
                                            name:'Member Settings',
                                            types:{
                                                order:['active','trial','overdue'],
                                                list:{
                                                    active:{
                                                        id:'active',
                                                        name:'Active'
                                                    },
                                                    trial:{
                                                        id:'trial',
                                                        name:'Trial'
                                                    },
                                                    overdue:{
                                                        id:'overdue',
                                                        name:'Overdue'
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    });
                    alert.show();
                },1,'tapactive');
                ele.find('.x_preview').stap(function(){
                    var alert=new modules.alertdelegate({
                        display:{
                            ele:$(this),
                            container:ele,
                        },
                        group:'admin_engagement',
                        contentTemplate:'admin_engagement_preview',
                        data:{
                            current:self.cdata,
                            type:self.getSchema()
                        },
                        binding:function(ele){
                            ele.find('.x_send').stap(function(){
                                self.save(function(saved){
                                    if(saved) self.preview(ele.find('.previewid').val());
                                },false,1);
                            },1,'tapactive');
                             ele.find('.x_preview').stap(function(){
                                self.save(function(saved){
                                    if(saved) self.preview(ele.find('.previewid').val(),1,{preview:1});
                                },false,1);
                            },1,'tapactive');
                             ele.find('.x_previewdata').stap(function(){
                                self.save(function(saved){
                                    if(saved) self.preview(ele.find('.previewid').val(),1,{debug:1});
                                },false,1);
                            },1,'tapactive');
                        }
                    });
                    alert.show();
                },1,'tapactive');
                ele.find('.x_send').stap(function(){
                    var alert=new modules.alertdelegate({
                        display:{
                            ele:$(this),
                            container:ele,
                        },
                        group:'admin_engagement',
                        contentTemplate:'admin_engagement_send',
                        binding:function(ele){
                            ele.find('.x_send').stap(function(){
                                self.save(function(saved){
                                    if(saved) self.send();
                                },false,1);
                            },1,'tapactive');
                            ele.find('.x_send_force').stap(function(){
                                self.save(function(saved){
                                    if(saved) self.send(1);
                                },false,1);
                            },1,'tapactive');
                        }
                    });
                    alert.show();
                },1,'tapactive');
                ele.find('input').on('keyup change input',function(){
                    self.cdata[$(this).attr('data-id')]=$(this).val();
                    self.queueSave();
                })
                ele.find('.x_more').stap(function(){
                    if(self.cdata.id){
                        var menu=[{
                            id:'clone',
                            name:'Clone'
                        },{
                            id:'delete',
                            name:'Delete'
                        }]
                    }else{
                        var menu=[{
                            id:'no',
                            name:'No options available'
                        }]
                    }
                    var alert=new modules.alertdelegate({
                        display:{
                            ele:$(this),
                            container:ele
                        },
                        menu:menu,
                        onSelect:function(id){
                            switch(id){
                                case 'clone':
                                    self.clone();
                                break;
                                case 'delete':
                                    self.delete();
                                break;
                            }
                        },
                        binding:function(ele){
                            ele.find('.x_send').stap(function(){
                                self.save(function(saved){
                                    if(saved) self.send();
                                },false,1);
                            },1,'tapactive');
                            ele.find('.x_send_force').stap(function(){
                                self.save(function(saved){
                                    if(saved) self.send(1);
                                },false,1);
                            },1,'tapactive');
                        }
                    });
                    alert.show();
                },1,'tapactive');
                ele.find('.x_action').stap(function(){
                    switch($(this).attr('data-action')){
                        case 'save':
                            self.save(false,false,1);
                        break;
                        case 'delete':
                            self.delete();
                        break;
                    }
                },1,'tapactive');
                self.form=new modules.formbuilder({
                    ele:ele.find('.content'),
                    current:$.extend(true,{},self.cdata),//passed as a refernce
                    schema_type:self.getSchema(),
                    onUpdate:function(current){
                        self.queueSave();
                    },
                    onInit:function(current){
                    }
                });
                // ele.find('#emailbox').redactor({
                //     plugins:['variable','imagemanager_nectar','alignment','button','fullscreen'],
                //     variables:['[user.name]'],
                //     callbacks:{
                //         synced:function(html){
                //             self.cdata.content=html;
                //             self.queueSave();
                //         }
                //     }
                // });
            }
        })
    }
    this.queueSave=function(){
        //return console.warn('disabled until better channel handeling update of nav')
        if(!self.to){
            self.to=setTimeout(function(){
                self.to=false;
                self.save();
            },1000);
        }
    }
    this.send=function(force){
        if(self.sending) return false;
        self.sending=true;
        growl({
            id:'preview',
            icon:'icon-refresh animate-spin',
            content:'Sending Preview...'
        })
        var d=$.extend(true,{},self.cdata);
        if(force) d.force=1;
         modules.api({
            caller:'Action',
            url: app.sapiurl+'/engagement/'+self.getSendType(), 
            data:d,
            callback: function(data){
                self.sending=false;
                //if(data.message){
                    if(data.success){
                        growl({
                            id:'preview',
                            icon:'icon-thumbs-up',
                            content:data.message,
                            time:modules.tools.getProcessTime(data)
                        })
                    }else if(data.error){
                        growl({
                            id:'preview',
                            type:'warning',
                            icon:'icon-warning-sign',
                            content:data.error,
                            time:modules.tools.getProcessTime(data)
                        })
                    }
                //}
            }
        })
    }
    this.preview=function(uid,newwindow,data){
        if(self.sending) return false;
        self.cdata.user=uid;
        var type=(self.cpage=='custom')?'previewemail':'preview';
        if(newwindow){//email only
            var d=$.extend(true,{},self.cdata,data);
            //
            if(data.preview){
                $('body').alert({
                    icon:false,
                    image:false,
                    width:800,
                    buttons:false,
                    content:'<iframe src="'+app.sapiurl+'/engagement/'+type+'?'+$.param(d)+'" style="width:100%;border:0;height:600px;"></ifame>'
                })
            }else{
                modules.api({
                    url:app.sapiurl+'/engagement/'+type,
                    data:d,
                    callback:function(resp){
                        if(resp.success){
                            $('body').alert({
                                icon:false,
                                image:false,
                                width:800,
                                buttons:false,
                                content:'<div style="padding:10px;text-align:left;">'+JSON.stringify(resp.data).wrapJson()+'</div>'
                            })
                        }else{
                            modules.toast({
                                content:'error: '+resp.error
                            })
                        }
                    }
                })
            }
            // modules.tools.openLink({
            //     intent:app.sapiurl+'/engagement/'+type+'?'+$.param(d)
            // })
            return false;
        }
        self.sending=true;
        growl({
            id:'preview',
            icon:'icon-refresh animate-spin',
            content:'Sending Preview...'
        });
         modules.api({
            caller:'Action',
            url: app.sapiurl+'/engagement/'+type, 
            data:self.cdata,
            callback: function(data){
                self.sending=false;
                //if(data.message){
                    if(data.success){
                        growl({
                            id:'preview',
                            icon:'icon-thumbs-up',
                            content:data.message,
                            time:modules.tools.getProcessTime(data)
                        })
                    }else if(data.error){
                        growl({
                            id:'preview',
                            icon:'icon-warning-sign',
                            type:'warning',
                            content:data.error,
                            time:modules.tools.getProcessTime(data)
                        })
                    }
                //}
            }
        })
    }
    this.clone=function(){
        var d=$.extend(true,{},self.cdata);
        if(d.id) delete d.id;
        if(d.live) delete d.live;
        self.save(function(created,resp){
            if(created){
                growl({
                    content:'Successfully Cloned Email',
                    icon:'icon-thumbs-up'
                })
                self.renderEmail(resp.data);
            }
        },d);
    }
    this.save=function(cb,data,force){
        var cf=self.cdata.filter;
        self.cdata=$.extend(true,{},self.form.getCurrent());
        if(self.filter) self.cdata.filter=self.filter.getFilter();
        var m=self.form.getMissing();
        if(m.length&&!force){
            console.warn('cant save, missing '+JSON.stringify(m));
            return false;
        }
        //console.log((data)?data:self.cdata)
        modules.api({
            url:app.sapiurl+'/module/formbuilder/save',
            data:{
                current:(data)?data:self.cdata,
                schema:self.getSchema()
            },
            callback:function(resp){
                if(resp.error){
                    growl({
                        content:modules.formbuilder_global.getError(resp),
                        type:'warning'
                    })
                    if(cb) cb(false,resp);
                }else{
                    if(!self.cdata.id){
                        self.cdata.id=resp.data.id;
                    }
                    self.form.set('id',resp.data.id);
                    self.form.set('v',resp.data.v);
                    self.ele.find('.lastupdate').html('Last Saved: '+modules.moment.format(resp.data.tsu,'ago'));
                    if(cb) cb(true,resp);
                    app.home.statusCheck();
                }
            }
        })
    }
    this.delete=function(){
        modules.api({
            url:app.sapiurl+'/module/formbuilder/delete',
            data:{
                id:self.cdata.id,
                schema:self.getSchema()
            },
            callback:function(resp){
                if(resp.error){
                    growl({
                        content:modules.formbuilder_global.getError(resp)
                    })
                }else{
                    self.renderEmail();
                    app.home.statusCheck();
                }
            }
        })
    }
    this.loadCount=function(){
        self.ele.find('.segmentcount').html('<i class="icon-refresh animate-spin"></i>')
        modules.api({
            url:app.sapiurl+'/engagement/count', 
            data:self.cdata,
            callback: function(data){
                if(data.success){
                    self.ele.find('.segmentcount').html(data.data.count)
                }else{
                    self.ele.find('.segmentcount').html('<i class="icon-warning-sign"></i>')
                    growl({
                        icon:'icon-warning-sign',
                        content:'Error:'+data.error
                    })
                }
            }
        })
    }
	this.hide=function(){
        if(self.ci) clearInterval(self.ci);
		if(self.inf) self.inf.stop();
		self.ele.hide();
	}
	this.destroy=function(){
        if(self.ci) clearInterval(self.ci);
        if(self.inf) self.inf.destroy();
		self.ele.remove();
    }
}