modules.admin_add=function(options){
	var self=this;
	this.show=function(){
		options.ele.render({
			uid:'admin_add',
			force:1,
            append:true,
			template:'admin_add',
            data:{
                options:options
            },
			binding:function(ele){
				self.ele=ele;
                var schema=app.user.schema[self.options.data.schema];
                if(!schema){
                    return alert('invalid schema ['+self.options.data.schema+']');
                }
                self.form=new modules.formbuilder({
                    ele:self.ele.find('.formcontent'),
                    canDelete:(self.options.canDelete)?1:0,
                    load:(self.options.load)?self.options.load:false,
                    endpoint:(self.options.endpoint)?self.options.endpoint:false,
                    current:self.options.data.current,//passed as a refernce
                    excludeFields:(self.options.data.excludeFields)?self.options.data.excludeFields:[],
                    getTransformOffset:function(){
                        //return options.ele.parents('.mobilepagemain').offset()
                    },
                    schema_type:self.options.data.schema,
                    schema:schema,
                    onDelete:function(){
                        self.destroy()
                        if(self.options.onDelete) self.options.onDelete();
                    },
                    onUpdate:function(current){
                        //self.options.data.current=current;
                        //console.log(current)
                        //if(options.onStatusChange) options.onStatusChange(1);//calc validity later
                    }
                });
                ele.find('.x_submit').stap(function(){
                    self.save();
                },1,'tapactive')
                ele.find('.x_close').stap(function(){
                    self.destroy()
                },1,'tapactive');

			}
		})
	}
    this.getEndpoint=function(endpoint,type){
        var replace={
            '[apiurl2]':app.apiurl2,
            '[apiurl]':app.sapiurl
        }
        $.each(replace,function(i,v){
            endpoint=endpoint.replace(i,v);
        })
        return endpoint+'/'+type;
    }
    this.save=function(force){
        if(self.saving) return false;
        self.saving=1;
        self.ele.find('.addsubmit').html('<i class="icon-refresh animate-spin"></i>')
        var schema=app.user.schema[this.options.data.schema];
        var url=(schema.endpoint)?this.getEndpoint(schema.endpoint,'create'):app.sapiurl+'/module/formbuilder/save';
        if(schema.useEndpoint) url=schema.useEndpoint;
        var data={
            current:self.form.getCurrent(),
            schema:self.options.data.schema,
            timezone:_.getTimeZone(),
            _disable:{
                    gameHook:1
                }
        }
        if(self.form.initId) data.last_id=self.form.initId;
        if(self.form.shouldUploadVideo()&&!force){
            if(options.videoTempIdField){
                self.form.set(options.videoTempIdField,Math.uuid(12));
            }
            self.form.backgroundProcess();
            self.ele.find('.addsubmit').html('<i class="icon-thumbs-up"></i>');
            //self.goBack();
            self.saving=0;
            self.save(1);
        }else{
            console.log(data);
            modules.api({
                url:url,
                data:data,
                timeout:5000,
                callback:function(resp){
                    self.saving=0;
                    if(resp.success){
                         self.ele.find('.addsubmit').html('<i class="icon-thumbs-up"></i>');
                        modules.toast({
                            content:'Successfully Saved!',
                            remove:2500
                        });
                        if(self.options.onSave) self.options.onSave(resp);
                        self.destroy();
                    }else{
                        self.ele.find('.addsubmit').html(self.options.data.action);
                        modules.toast({
                            content:self.form.getError(resp),
                            remove:2500,
                            icon:'icon-warning-sign'
                        });
                    }
                }
            });
        }
    }
	this.hide=function(){
		self.ele.hide();
	}
	this.destroy=function(){
		self.ele.remove();
    }
}