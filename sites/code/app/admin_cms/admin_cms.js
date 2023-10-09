modules.admin_cms=function(options){
	var self=this;
    //this.path='onboard';
    this.init=function(){
        self.store.schema='onboard_slide'
        self.store.path='home';
    }
    this.onStart=function(){
        self.ensureSocket();
    }
    this.onStop=function(){
        self.ensureSocket(1);
    }
    this.onDestroy=function(){
        self.ensureSocket(1);
    }
    this.ensureSocket=function(stop){
        if(stop){
            app.user.stopSocket(self.store.currentSocket, function(){
                console.log('Stop CMS Socket!')
            });
        }else{
            var newsocket='admin_cms_'+self.store.schema;
            if(!self.store.currentSocket||self.store.currentSocket!=newsocket){
                if(self.store.currentSocket){
                     app.user.stopSocket(self.store.currentSocket, function(){
                        console.log('Stop CMS Socket!')
                    });
                }
                self.store.currentSocket=newsocket;
                app.user.startSocket(self.store.currentSocket, function(){
                    console.log('updating page from socket update!')
                    self.load();
                });
            }else{
                console.log('socket up to date');
            }
        }
    }
	this.show=function(){
        if(!self.ele){
    		options.ele.render({
    			uid:'admin_cms',
    			force:1,
    			template:'admin_cms',
                data:{
                    schema:self.store.schema
                },  
    			binding:function(ele){
    				self.ele=ele;
                    //load slides!
                    ele.find('#cms_select').on('change',function(){
                        self.store.schema=ele.find('#cms_select').val();
                        self.store.path='home';
                        self.load();
                    })
                    ele.find('.x_reload').stap(function(){
                        self.load();
                    })
                    self.load()
    			}
    		})
        }else{
            self.ele.show()
        }
	}
    this.renderCookies=function(){
        self.ele.find('#cmspath').render({
            template:'onboard_cms_path',
            append:false,
            data:{
                path:self.getPathInfo()
            },
            binding:function(ele){
                ele.find('.x_goto').stap(function(){
                    var id=$(this).attr('data-id');
                    self.store.path=id;
                    self.render();//should already have data!
                })
            }
        })
    }
    this.getPathInfo=function(ipath,info){
        if(!self.resp||!self.resp.data||!self.resp.data.list) return false;
        if(!ipath) var path=self.store.path;//start at high level
        else var path=ipath;
        if(!info) info=[];
        var current=false;
        if(path!='home'){
            $.each(self.resp.data.list,function(i,v){
                if(v.id==path) current=v;
            })
            if(current){
                info.push(current);
                $.each(self.resp.data.list,function(i,v){
                    if(v.children&&v.children.indexOf(current.id)>=0){
                        self.getPathInfo(v.id,info);
                    }
                })
            }
        }
        if(!ipath) return info.reverse();
        return info;
    }
    this.load=function(){
        modules.api({
            url:app.sapiurl.replace('one_admin','one_core')+'/user/loadcmspages',
            data:{
                //path:self.path,
                schema:self.store.schema
            },
            timeout:5000,
            callback:function(resp){
                self.resp=resp;
                self.render();
                self.ensureSocket();
            }
        });
    }
    this.getCurrentOrderNumber=function(){
        var resp=self.getData();
        return (resp.data&&resp.data.order&&resp.data.order.length)?(resp.data.order.length+1):0;
    }
    this.getData=function(){
        var ret={
            success:true,
            data:{
                order:[],
                list:{}
            }
        }
        var sort=[]
        if(self.resp.data&&self.resp.data.order&&self.resp.data.order.length){
            //get based on appropriate directory
            $.each(self.resp.data.list,function(i,v){
                if((v.folder&&v.folder==self.store.path)||!v.folder){
                    ret.data.list[v._id]=v;
                    sort.push(v);
                }
            })
            //sort!
            ret.data.order=_.arsort(sort,'_id');
        }
        return ret;
    }
    this.render=function(){
        var template='onboard_page_'+self.store.schema;
        var temp=self.ele.find('#cms_select').find('[value="'+self.store.schema+'"]').attr('data-template');
        if(temp) template=temp;
        self.ele.find('.content').render({
            template:template,
            append:false,
            data:{
                resp:self.getData(self.resp)
            },
            binding:function(ele){
                self.renderCookies()
                ele.find('.edititems').sortable({
                    revert: true,
                    //helper : 'previewclone',
                    placeholder: "onboardplaceholder",
                    //scroll:false,
                    //handle:'.x_drag',
                    cursor: "move",
                    containment:ele,
                    start:function(){
                       
                    },
                    stop:function(){
                        
                    },
                    update:function(){
                        self.updateOrder()
                    }
                });
                ele.find('.x_add').stap(function(){
                    phi.register('admin_add',{
                        ele:$('#wrapper'),
                        title:'Add!',
                        action:'Save!',
                        data:{
                            schema:self.store.schema,
                            current:{
                                folder:self.store.path,
                                order:self.getCurrentOrderNumber()
                            }
                        },
                        videoTempIdField:'temp_id',
                        onSave:function(resp){
                            // if(!self.resp.data){
                            //     self.resp={
                            //         success:true,
                            //         data:{
                            //             list:{},
                            //             order:[]
                            //         }
                            //     }
                            // }
                            // self.resp.data.list[resp.data._id]=resp.data
                            // if(self.resp.data.order.indexOf(resp.data._id)==-1) self.resp.data.order.push(resp.data._id);
                            // self.render();
                            self.load();//children field of other items may be effected
                            //console.log(resp)
                        },
                        onRegister:function(instance){
                            instance.component.show();
                        }
                    });
                },1,'tapactive')
                ele.find('.x_deeper').stap(function(){
                    var id=$(this).attr('data-iid');
                    var d=self.resp.data.list[id];
                    self.store.path=d.id;
                    self.render();//should already have data!
                })
                ele.find('.x_edit').stap(function(){
                    var id=$(this).attr('data-iid');
                    var d=self.resp.data.list[id];
                    phi.register('admin_add',{
                        ele:$('#wrapper'),
                        title:'Edit!',
                        action:'Save!',
                        canDelete:1,
                        data:{
                            schema:self.store.schema,
                            current:d
                        },
                        onDelete:function(){
                            // delete self.resp.data.list[id];
                            // self.resp.data.order.splice(self.resp.data.order.indexOf(id),1);
                            // self.render();
                            self.load()
                        },
                        onSave:function(resp){
                            // self.resp.data.list[id]=resp.data
                            // self.render();
                            self.load();
                            //console.log(resp)
                        },
                        onRegister:function(instance){
                            instance.component.show();
                        }
                    });
                },1,'tapactive')
            }
        })
    }
    this.updateOrder=function(){
        var order=[]
        self.ele.find('.x_drag').each(function(i,v){
            order.push($(v).attr('data-id'));
        })
        modules.api({
            url:app.sapiurl+'/action/updateonboardorder',
            data:{
                order:order,
                schema:self.store.schema
            },
            timeout:5000,
            callback:function(resp){
                if(resp.success){
                    modules.toast({
                        content:'Updated!'
                    })
                }else{
                    modules.toast({
                        content:'Error: '+resp.error
                    })
                }
            }
        });
    }
	this.hide=function(){
		self.ele.hide();
	}
	this.destroy=function(){
		self.ele.remove();
    }
}