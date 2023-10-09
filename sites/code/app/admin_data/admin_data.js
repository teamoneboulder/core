modules.admin_data=function(options){
	var self=this;
	this.show=function(){
        if(!self.ele){
    		options.ele.render({
    			uid:'admin_data',
    			force:1,
    			template:'admin_data',
    			binding:function(ele){
    				self.ele=ele;
                    self.setScroller();
                    ele.find('.x_schema').stap(function(){
                        self.showSchema()
                    },1,'tapactive');
                    ele.find('.x_sync').stap(function(){
                        self.sync();
                    },1,'tapactive')
                    ele.find('.x_exportcsv').stap(function(){
                        self.exportCSV();
                    },1,'tapactive')
                    ele.find('.x_exportjson').stap(function(){
                        self.exportJSON();
                    },1,'tapactive')
    			     ele.find('.typebtn').stap(function(){
                        if($(this).hasClass('bluebtn')) return false;
                        ele.find('.typebtn').removeClass('bluebtn');
                        $(this).addClass('bluebtn');
                        self.type=$(this).attr('data-type');
                        self.setScroller();
                    })
                     ele.find('.refresh').stap(function(){
                        self.refresh();
                    })
                     ele.find('#datasubmitquery').stap(function(){
                        var query=self.ele.find('#dataquery').val();
                        try{
                            var json=JSON.parse(query);
                            self.ele.find('.query').html(query.wrapJson());
                            self.ele.find('.noquery').hide();
                            self.ele.find('.hasquery').show();
                            self.setScroller();
                        }catch(e){
                            alert('bad json!');
                        }
                     },1,'tapactive')
                     ele.find('.addbtn').stap(function(){
                        var current=self.ele.find('#datacollselect').val();
                        if(!current){
                            return modules.toast({
                                content:'Please select a collection first'
                            })
                        }
                        phi.register('admin_add',{
                            ele:$('#wrapper'),
                            title:'Create!',
                            action:'Save!',
                            data:{
                                schema:current
                            },
                            onSave:function(resp){
                                self.inf.onEmitData(resp.data);//feed directly
                            },
                            onRegister:function(instance){
                                instance.component.show();
                            }
                        });
                     },1,'tapactive')
                    ele.find('#clearquery').stap(function(){
                        self.ele.find('.query').html('');
                        self.ele.find('.noquery').show();
                        self.ele.find('.hasquery').hide();
                        self.ele.find('#dataquery').val('')
                        self.setScroller();
                    },1,'tapactive')
                    ele.find('#datacollselect').on('change',function(){
                        self.setScroller()
                    })
    			}
    		})
        }else{
            self.ele.show()
        }
	}
    this.exportCSV=function(){
        var current=self.ele.find('#datacollselect').val();
        modules.toast({
            id:'exporting',
            icon:'icon-refresh animate-spin',
            content:'Processing....',
            remove:2000
        })
        _.openLink({
            type:'self',
            intent:app.sapiurl+'/export/csv/'+current+'?token='+app.user.token+'&appid='+app.appid+'&bust='+new Date().getTime()
        })
    }
    this.exportJSON=function(){
        var current=self.ele.find('#datacollselect').val();
        modules.toast({
            id:'exporting',
            icon:'icon-refresh animate-spin',
            content:'Processing....',
            remove:2000
        })
        _.openLink({
            type:'self',
            intent:app.sapiurl+'/export/json/'+current+'?token='+app.user.token+'&appid='+app.appid+'&bust='+new Date().getTime()
        })
    }
    this.loadCollectionInfo=function(){
        var current=self.ele.find('#datacollselect').val();
        modules.api({
            url: app.sapiurl+'/data/collectioninfo', 
            data:{
                token:window.uuid,
                coll:current
            },
            callback:function(data){
                console.log(data)
                self.ele.find('.x_data').render({
                    template:'admin_data_stats',
                    append:false,
                    data:data
                })
            }
        })
    }
    this.sync=function(){
         var current=self.ele.find('#datacollselect').val();
         if(!current){
            modules.toast({
                content:'Please select a colection to sync'
            })
            return false;
         }
        if(self.syncing) return false;
        self.syncing=true;
        var cv=self.ele.find('.x_sync').html();
        self.ele.find('.x_sync').find('i').addClass('animate-spin')
        modules.api({
            url: app.sapiurl+'/synccoll', 
            data:{
                token:window.uuid,
                coll:current
            },
            timeout:60000,
            callback: function(data){
                self.ele.find('.x_sync').find('i').removeClass('animate-spin')
                if(data.success){
                    self.ele.find('.x_sync').html('Successfully Synced!');
                    self.refresh()
                    setTimeout(function(){
                        self.syncing=false;
                        self.ele.find('.x_sync').html(cv);
                        //$.fn.alert.closeAlert();
                    },1500)
                }else{
                    self.syncing=false;
                    growl({
                        icon:'icon-warning-sign',
                        content:data.error
                    })
                }
            }
        })
    }
    this.showSchema=function(){
        var current=self.ele.find('#datacollselect').val();
        if(app.user.schema[current]){
            $('body').alert({
                width:800,
                icon:false,
                image:false,
                buttons:false,
                content:'<div style="font-size:20px;padding-bottom:10px;text-align:left">Schema for '+current+'</div><div style="text-align:left">'+JSON.stringify(app.user.schema[current]).wrapJson()+'</div>'
            })
        }else{
            alert('schema not available');
        }
    }
	this.setScroller=function(){
        var current=self.ele.find('#datacollselect').val();
        var query=self.ele.find('#dataquery').val();
        if(!self.type){
            self.type='full';
            self.ele.find('[data-type='+self.type+']').addClass('bluebtn')
        }
        self.loadCollectionInfo()
        if(!current){
            self.ele.find('.itemlist').html('<div style="padding:20px;font-size:18px;">Please select a collection</div>');
        }else if(!self.inf){
            self.ele.find('.itemlist').html('');
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
                    filter:current,
                    query:query,
                    type:self.type
                },
                max:10,
                template:'admin_data_item',
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
                                schema:self.ele.find('#datacollselect').val(),
                                current:item,
                                excludeFields:['pass']
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
        }else{
            self.inf.options.opts.filter=current;
            self.inf.options.opts.query=query;
            self.inf.options.opts.type=self.type;
            self.inf.reload();
        }
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