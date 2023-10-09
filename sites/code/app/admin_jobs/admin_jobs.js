modules.admin_jobs=function(options){
	var self=this;
	this.show=function(){
		options.ele.render({
			uid:'admin_jobs',
			force:1,
			template:'admin_jobs',
			binding:function(ele){
				self.ele=ele;
                self.setScroller();
			     ele.find('.refresh').stap(function(){
                    self.refresh();
                })
                ele.find('.navselect').stap(function(){
                    if(!$(this).hasClass('selected')){
                        ele.find('.navselect').removeClass('selected');
                        $(this).addClass('selected');
                        self.filter=$(this).attr('data-filter');
                        self.last=false;
                        self.listloaded=0;
                        self.refresh();
                    }
                })
                ele.find('.navselect').first().stap();	
			}
		})
	}
	this.setScroller=function(){
		self.inf=new modules.infinitescroll({
            ele:self.ele.find('.itemlist'),
            scroller:self.ele.find('.scroller'),
            endpoint:app.sapiurl+'/jobs/get',
            loaderClass:'lds-ellipsis-black',
            offset:'200%',
            checkNextPage:true,
            onInterval:{
            	time:3000,
            	callback:function(){
            		//pself.updateTimes();
            	}
            },
            waitForReload:true,
            opts:{
            },
            max:20,
            getTemplate:function(){
            	var tpl=''
            	switch(self.filter){
            		case 'fb_import':
            			tpl='admin_jobs_jobitem';
            		break;
            		case 'housekeeping':
            			tpl='admin_jobs_housekeeping';
            		break;
                    case 'broadcast':
                        tpl='admin_jobs_broadcastitem';
                    break;
                    case 'scheduled':
                        tpl='admin_jobs_scheduled_item';
                    break;
            	}
            	return tpl
            },
            nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>You havent queued anything yet.</div></div>',
            onPageReady:function(ele){
               ele.find('.preview').stap(function(){
                    var data=self.inf.getById($(this).attr('data-id'));
                    self.showAlert(data);
               },1,'tapactive')
            },
            scrollBindings:{
                scrollStart:function(){
                },
                scroll:function(obj){
                }
            }
        });
	}
    this.getAlertTemplate=function(){
        var t='';
        switch(self.filter){
            case 'fb_import':
                t='admin_jobs_jobpreview'
            break;
            case 'ensuretokens':
                t='admin_jobs_fbpreview'
            break;
            case 'housekeeping':
                t='admin_jobs_fbpreview'
            break;
            case 'broadcast':
                t='admin_jobs_broadcastpreview'
            break;
            case 'scheduled':
                t='admin_jobs_jobpreview'
            break;
        }
        return t;
    }
    this.showAlert=function(data){
        var btns=[{
            btext:'Close',
            bclass:'x_closer'
        }]
        btns.push({
            btext:'Retry',
            bclass:'x_retry'
        })
        $('body').alert({
            icon:false,
            template:self.getAlertTemplate(),
            tempdata:$.extend(true,{},data,{data:data}),
            mobilize:1,
            loc:'top',
            width:800,
            buttons:btns,
            bindings:[{
                type:'fn',
                binding:function(ele){
                    ele.find('.x_retry').stap(function(){
                        if(self.getting) return false;
                        self.getting=1;
                        modules.api({
                            caller:'Get jobs',
                            url: app.sapiurl+'/jobs/retry', 
                            data:{
                                last:(self.last)?self.last:0,
                                token:window.uuid,
                                job:data._id
                            },
                            callback: function(data){
                                self.getting=0;
                                
                            }
                        })
                    })
                    if(data.opts){
                        var doc = document.getElementById('email').contentWindow.document;
                        doc.open();
                        doc.write(data.opts.Message.Body.Html.Data);
                        doc.close();
                    }
                }
            }]
        })
    }
    this.refresh=function(){
        if(self.inf){
            self.inf.options.opts.filter=self.filter;
            self.inf.reload();
        }
    }
	this.hide=function(){
		self.inf.stop();
		self.ele.hide();
	}
	this.destroy=function(){
    	if(self.inf) self.inf.destroy();
		self.ele.remove();
    }
}