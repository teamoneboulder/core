if(!window.modules) window.modules={};
modules.location=function(options){
	var self=this;
	if(!options.data) options.data={};
	self.options=options;
	self.current=$.extend(true,{},{location:'',location_info:'',location_apt:'',hasAddress:''},options.data);
	this.show=function(){
		options.ele.subpage({
            loadtemplate:'location_page',
            data:{},
            onPageRendered:function(ele){
            	self.ele=ele;
            	self.permissions=new modules.inlinepermissions({
			    	ele:ele.find('.permissions'),
			    	data:{
			    		field:'location'
			    	}
			    });
            },
            onPageReady:function(ele,onback){
                self.onBack=onback;
                self.permissions.show();
                ele.find('.backbtn').stap(function(){
                	self.goBack();
                },1,'tapactive')
                ele.find('.x_save').stap(function(){
                	self.save();
                },1,'tapactive')
                self.renderLocation();
                //scroll
                new modules.scroller(ele.find('.locationarea'),{},{
                	scrollStart:function(){
                        modules.keyboard_global.hide();
                    }
                })
            },
            onPageReturn:function(){
                self.destroy();
            }
        });
	}
	this.save=function(){
		self.current['_perm.location']=self.permissions.getPermissions();
		self.options.onSave(self.current,function(){
			self.goBack();
		});
	}
	this.goBack=function(){
		modules.viewdelegate.onBack();
		self.onBack()
	}
	this.renderLocation=function(focus){
		self.ele.find('.locationcontent').render({
			template:'location_cityinput',
			data:self.current,
			append:false,
			binding:function(ele){
				ele.find('.x_apt').on('input',function(){
					self.current.location_apt=$(this).val();
				})
				ele.find('.x_removecity').stap(function(){
					self.current.location='';
					self.current.location_apt='';
					self.current.hasAddress='';
					self.current.location_info={};
					self.renderLocation(1);
				},1,'tapactive')
				ele.find('.addressinput').on('keyup',function(){
					if(!$(this).val()){
						self.ele.find('.resultslist').html('');
						return false;
					}
					self.ele.find('.resultslist').html('<div style="padding:20px;text-align:center;font-size:16px;"><i class="icon-refresh animate-spin"></i> Searching</div>');
					modules.geocode.search($(this).val(),{types: []},function(res){//'(cities)'
            			if(res&&res.length){
            				self.ele.find('.resultslist').html('');
	                        $.each(res,function(i,v){
	                            self.ele.find('.resultslist').render({
	                                template:'location_city_search',
	                                data:v,
	                                bindings:[{
	                                    type:'click',
	                                    binding:function(){
	                                    	self.current.location=v.place_id;
	                                    	self.current.location_info=v.text;
	                                        self.ele.find('.resultslist').html('<div style="padding:20px;text-align:center;font-size:16px;"><i class="icon-refresh animate-spin"></i> Getting Location</div>')
	                                        //geocode and center based on placeid
	                                        modules.geocode.getLocation(v.place_id,function(loc,isAddress){
	                                            self.current.location_info.coords=[loc.lng,loc.lat];
	                                            if(isAddress) self.current.location_info.isAddress=1;
	                                            if(isAddress) self.current.hasAddress=1;
	                                            else self.current.hasAddress='';
	                                            self.renderLocation();
	                                        })
	                                    }
	                                }]
	                            })
	                        })
            			}else{
            				self.ele.find('.resultslist').html('<div style="padding:20px;text-align:center;font-size:16px;"><i class="icon-warning-sign"></i> No Results</div>');
            			}
            		});
				})
				if(focus){
					setTimeout(function(){
						ele.find('.addressinput').focus();
					},20)
				}
			}
		})
	}
	this.hide=function(){

	}
	this.destroy=function(){
		self.permissions.destroy();
		delete self;
	}
}