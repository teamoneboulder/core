modules.admin_apptext=function(options){
    var self=this;
    this.show=function(){
        options.ele.render({
            uid:'admin_apptext',
            force:1,
            template:'admin_apptext',
            binding:function(ele){
                self.ele=ele;
                ele.find('.x_changemode').stap(function(){
                    self.setMode($(this).attr('data-mode'));
                },1,'tapactive')
                self.setMode('editing');
                //self.setScroller()
                _.iframe.listenParent(function(e){
                    if(e.data){
                        if(e.data.key){                            //
                            phi.register('admin_add',{
                                ele:self.ele.find('#mainwindow'),
                                title:'Edit',
                                action:'Save!',
                                load:{
                                    opts:{
                                        id:e.data.key
                                    },
                                    default:{
                                        scopes:['app'],
                                        complex:(e.data.complex)?1:0,
                                        scopes_info:{
                                            app:{
                                                id:'app',
                                                name:'App'
                                            }
                                        }
                                    }
                                },
                                data:{
                                    schema:'app_text'
                                },
                                onSave:function(resp){
                                    //self.inf.onEmitData(resp.data);
                                    _.iframe.sendChild(ele.find('iframe')[0],{
                                        update:{
                                            key:e.data.key,
                                            complex:(e.data.complex)?1:0,
                                            content:resp.data.content
                                        }
                                    },app.siteurl);
                                },
                                onRegister:function(instance){
                                    instance.component.show();
                                }
                            });
                            // _.iframe.sendChild(ele.find('iframe')[0],{
                            //     update:{
                            //         key:e.data.key,
                            //         content:'Update!'
                            //     }
                            // },app.siteurl);
                        }
                    }
                });
                 ele.find('.addbtn').stap(function(){
                    phi.register('admin_add',{
                        ele:$('#wrapper'),
                        title:'Create!',
                        action:'Save!',
                        data:{
                            schema:'app_text'
                        },
                        onSave:function(resp){
                            self.inf.onEmitData(resp.data);//feed directly
                        },
                        onRegister:function(instance){
                            instance.component.show();
                        }
                    });
                 },1,'tapactive')
            }
        })
    }
    this.setMode=function(mode){
        _.iframe.sendChild(self.ele.find('iframe')[0],{
            mode:mode
        },app.siteurl);
        self.ele.find('.x_changemode').removeClass('active');
        self.ele.find('[data-mode='+mode+']').addClass('active')
        self.ele.find('.x_viewitem').hide();
        self.ele.find('[data-view='+mode+']').show()
        self.store.mode=mode;
    }
    this.setScroller=function(){
        //if(!self.inf){
            self.ele.find('.itemlist').html('');
            if(self.inf) self.inf.destroy();
            self.inf=new modules.infinitescroll({
                ele:self.ele.find('.itemlist'),
                scroller:self.ele.find('.scroller'),
                endpoint:app.sapiurl+'/data/load',
                loaderClass:'lds-ellipsis-black',
                offset:'200%',
                listen:true,
                checkNextPage:true,
                context:self,
                datakey:'_id',
                onInterval:{
                    time:3000,
                    callback:function(){
                        //pself.updateTimes();
                    }
                },
                opts:{
                    filter:'app_text',
                    type:'full'
                },
                max:10,
                template:'admin_apptext_item',
                nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>No data here yet.</div></div>',
                onPageReady:function(ele){
                    ele.find('.x_edit').stap(function(e){
                        var item=self.inf.getById($(this).attr('data-iid'));
                        //edit it!
                        phi.register('admin_add',{
                            ele:$('#wrapper'),
                            title:'Edit',
                            action:'Save!',
                            data:{
                                schema:'app_text',
                                current:item
                            },
                            onSave:function(resp){
                                self.inf.onEmitData(resp.data);
                            },
                            onRegister:function(instance){
                                instance.component.show();
                            }
                        });
                    })  
                },
                scrollBindings:{
                    scrollStart:function(){
                    },
                    scroll:function(obj){
                    }
                }
            });
        // }else{
        //     self.inf.options.opts.filter='app_text';
        //     self.inf.options.opts.type='full';
        //     self.inf.reload();
        // }
    }
    this.refresh=function(){
        if(self.inf){
            self.inf.reload();
        }
    }
    this.hide=function(){
        if(self.inf) self.inf.stop();
        self.ele.hide();
    }
    this.destroy=function(){
        if(self.inf) self.inf.destroy();
        self.ele.remove();
    }
}