modules.admin_waivers=function(options){
	var self=this;
	this.show=function(){
        if(!self.ele){
    		options.ele.render({
    			uid:'admin_waivers',
    			force:1,
    			template:'admin_waivers',
    			binding:function(ele){
    				self.ele=ele;
                    //load slides!
                    self.load()
    			}
    		})
        }else{
            self.ele.show()
        }
	}
    this.load=function(){
        modules.api({
            url:app.sapiurl.replace('one_admin','one_core')+'/user/waivers',
            data:{
            },
            timeout:5000,
            callback:function(resp){
                self.resp=resp;
                self.render()
            }
        });
    }
    this.render=function(){
        self.ele.find('.content').render({
            template:'waivers_page',
            append:false,
            data:{
                resp:self.resp
            },
            binding:function(ele){
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
                        title:'Add Waiver!',
                        action:'Save!',
                        data:{
                            schema:'waiver',
                            current:{
                                order:(self.resp.data&&self.resp.data.order&&self.resp.data.order.length)?(self.resp.data.order.length+1):0
                            }
                        },
                        onSave:function(resp){
                            if(!self.resp.data){
                                self.resp={
                                    success:true,
                                    data:{
                                        list:{},
                                        order:[]
                                    }
                                }
                            }
                            self.resp.data.list[resp.data._id]=resp.data
                            if(self.resp.data.order.indexOf(resp.data._id)==-1) self.resp.data.order.push(resp.data._id);
                            self.render();
                            //console.log(resp)
                        },
                        onRegister:function(instance){
                            instance.component.show();
                        }
                    });
                },1,'tapactive')
                ele.find('.x_edit').stap(function(){
                    var id=$(this).attr('data-id');
                    var d=self.resp.data.list[id];
                    phi.register('admin_add',{
                        ele:$('#wrapper'),
                        title:'Edit Waiver!',
                        action:'Save!',
                        data:{
                            schema:'waiver',
                            current:d
                        },
                        onSave:function(resp){
                            self.resp.data.list[id]=resp.data
                            self.render();
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
            url:app.sapiurl+'/action/updatewaiverorder',
            data:{
                order:order
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