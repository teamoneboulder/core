modules.admin_tools=function(options){
	var self=this;
	this.show=function(){
		options.ele.render({
			uid:'admin_tools',
			force:1,
			template:'admin_tools',
			binding:function(ele){
				self.ele=ele;
                ele.find('.normalaction').stap(function(){
                    var action=$(this).attr('data-action');
                    var special=$(this).attr('data-special')
                    var tself=$(this).attr('data-self')
                    var tele=$(this);
                    if(tele.attr('data-confirm')){
                        $('body').confirm({
                            icon:'icon-help',
                            text:'Are you sure you want to continue?',
                            buttons:[{
                                btext:'Yes, Continue',
                                bclass:'btn-danger yesbtn'
                            },{
                                btext:'Cancel',
                                bclass:'cancelbtn'
                            }],
                            cb:function(success){
                                if(success){
                                    if(tele.attr('data-doubleconfirm')){
                                        $('body').confirm({
                                            icon:'icon-help',
                                            text:'Are you <b>REALLY</b> sure you want to continue?',
                                            buttons:[{
                                                btext:'Yes, Continue',
                                                bclass:'btn-danger yesbtn'
                                            },{
                                                btext:'Cancel',
                                                bclass:'cancelbtn'
                                            }],
                                            cb:function(success){
                                                if(success){
                                                    self.doAction(action,special,ele,tself);
                                                }
                                            }
                                        })
                                    }else{
                                        self.doAction(action,special,ele,tself);
                                    }
                                }
                            }
                        })
                    }else{
                        self.doAction(action,special,ele,tself);
                    }
                })
                ele.find('.specialaction').stap(function(){
                    switch($(this).attr('data-action')){
                        case 'user_csv':
                            growl({
                                id:'action_user_csv',
                                icon:'icon-refresh animate-spin',
                                content:'Processing!',
                                timeout:5000
                            })
                            _.openLink({
                                type:'self',
                                intent:app.sapiurl+'/action/user_csv?token='+app.user.token+'&appid='+app.appid+'&bust='+new Date().getTime()
                            })
                        break;
                        case 'anon_ticket_csv':
                            growl({
                                id:'action_ticket_csv',
                                icon:'icon-refresh animate-spin',
                                content:'Processing!',
                                timeout:5000
                            })
                            _.openLink({
                                type:'self',
                                intent:app.sapiurl+'/action/anon_ticket_csv?token='+app.user.token+'&appid='+app.appid+'&bust='+new Date().getTime()
                            })
                        break;
                        case 'user_stat_csv':
                            growl({
                                id:'user_stat_csv',
                                icon:'icon-refresh animate-spin',
                                content:'Processing!',
                                timeout:5000
                            })
                            _.openLink({
                                type:'self',
                                intent:app.sapiurl+'/action/user_stat_csv?token='+app.user.token+'&appid='+app.appid+'&bust='+new Date().getTime()
                            })
                        break;
                        default:
                            alert('not wired!')
                        break;
                        // case 'synccoll':
                        //      $('body').alert({
                        //         icon:false,
                        //         closer:true,
                        //         loc:'top',
                        //         template:'admin_tools_selectcollection',
                        //         buttons:[{
                        //             btext:'<i class="icon-refresh"></i> Sync',
                        //             bclass:'x_sync'
                        //         }],
                        //         bindings:[{
                        //             type:'fn',
                        //             binding:function(ele){
                        //                 self.aele=ele;
                        //                 ele.find('.x_sync').stap(function(){
                        //                     var val=ele.find('#collselect').val();
                        //                     if(!val){
                        //                         growl({
                        //                             icon:'icon-warning-sign',
                        //                             content:'Please select a collection'
                        //                         })
                        //                         return false;
                        //                     }
                        //                     if(self.syncing) return false;
                        //                     self.syncing=true;
                        //                     ele.find('.x_sync').find('i').addClass('animate-spin')
                        //                     modules.api({
                        //                         url: app.sapiurl+'/synccoll', 
                        //                         data:{
                        //                             token:window.uuid,
                        //                             coll:val
                        //                         },
                        //                         timeout:60000,
                        //                         callback: function(data){
                        //                             ele.find('.x_sync').find('i').removeClass('animate-spin')
                        //                             if(data.success){
                        //                                 ele.find('.x_sync').html('Successfully Synced!');
                        //                                 setTimeout(function(){
                        //                                     self.syncing=false;
                        //                                     ele.find('.x_sync').html('<i class="icon-refresh"></i> Sync');
                        //                                     //$.fn.alert.closeAlert();
                        //                                 },1500)
                        //                             }else{
                        //                                 self.syncing=false;
                        //                                 growl({
                        //                                     icon:'icon-warning-sign',
                        //                                     content:data.error
                        //                                 })
                        //                             }
                        //                         }
                        //                     })
                        //                 },1,'tapactive')
                        //             }
                        //         }]
                        //     });
                        // break;
                    }
                },1,'tapactive');
			}
		})
	}
    this.doAction=function(action,special,ele,tself){
        growl({
            id:'action_'+action,
            icon:'icon-refresh animate-spin',
            content:'Processing...',
            remove:false
        })
        modules.api({
            url:app.sapiurl+'/action/'+action,
            timeout:100000,
            data:{
            },
            callback:function(data){
                if(data.success){
                    growl({
                        id:'action_'+action,
                        icon:'icon-thumbs-up',
                        content:'Success!',
                        time:app.getProcessTime(data)
                    })
                }else if(data.error){
                    growl({
                        id:'action_'+action,
                        icon:'icon-warning-sign',
                        content:'Error ['+data.error+']',
                        time:app.getProcessTime(data)
                    })
                }
            }
        })
    }
    this.getCount=function(filter,cb){
        self.filter.counts.loading();
        modules.api({
            url:app.sapiurl+'/module/people/find',
            data:{
                filter:filter,
                counts:1,
                max:1000000
            },
            callback:function(resp){
                cb(resp);
            }
        })
    }
	this.hide=function(){
        if(self.ci) clearInterval(self.ci);
		self.ele.hide();
	}
	this.destroy=function(){
        if(self.ci) clearInterval(self.ci);
		self.ele.remove();
    }
}