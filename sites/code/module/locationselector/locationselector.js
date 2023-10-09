modules.locationselector=function(opts){
	var self=this;
	if(opts.current){
		self.current=opts.current;
	}
	if(!opts.distance) opts.distance=1;
	self.options=opts;
	self.init=function(){
		if(opts.current){
			self.renderView('location');
		}else{
			self.renderView('blank');
		}
	}
	self.toggle=function(){
		if(self.options.disabled){
			self.options.disabled=0;
			self.vele.find('.x_filtertoggle').addClass('selected');
		}else{
			self.options.disabled=1;
			self.vele.find('.x_filtertoggle').removeClass('selected');
			if(self.options.clearOnDisable){
				self.renderView('blank');
			}
		}
		if(self.options.onDisableToggle) self.options.onDisableToggle(self.options.disabled);
		if(self.options.onUpdate) self.options.onUpdate();
	}
	self.renderView=function(type){
		switch(type){
			case 'blank':
				opts.ele.render({
					template:'locationselector_blank',
					append:false,
					binding:function(ele){
						self.vele=ele;
						ele.find('.x_gps').stap(function(){
							self.vele.find('.gpsicon').removeClass('icon-location-1').addClass('icon-refresh animate-spin');
							self.locateMe(function(){
								self.vele.find('.gpsicon').addClass('icon-location-1').removeClass('icon-refresh animate-spin');
							});
						},1,'tapactive')
						if(self.locationpicker) self.locationpicker.destroy();
						self.locationpicker=new modules.locationpicker({
							btn:ele.find('.x_location'),
							onChange:function(loc,data){
								self.current=data;
								if(data.gps) self.current.coords=[loc.lng,loc.lat];
								self.renderView('location');
								opts.onChange(self.current);
							}
						});
					}
				})
			break;
			case 'location':
				opts.ele.render({
					template:'locationselector_location',
					append:false,
					data:{
						current:self.current,
						distance:opts.distance,
						enableBlank:(opts.enableBlank)?1:0,
						disabled:(opts.disabled)?1:0
					},
					binding:function(ele){
						self.vele=ele;
						ele.find('.x_filtertoggle').stap(function(){
							self.toggle();
						},1,'tapactive')
						ele.find('.rangeslider').rangeslider({
							polyfill: false,
							fillClass:'rangeslider__fill highlightnav',
							horizontalClass: 'rangeslider--horizontal normalrangeslider',
							onSlide: function(position, value) {
								if(value==52){
									ele.find('.distance').html('100mi');
								}else if(value==54){
									ele.find('.distance').html('1000mi');
								}else{
									ele.find('.distance').html(value+'mi');
								}
							},
							onSlideEnd: function(position, value) {
								if(opts.distance!=value){
									if(value==52){
										value=100;
										opts.distance=value;
										ele.find('.distance').html(value+'mi');
										opts.onDistanceChange(value);
									}else if(value==54){
										value=1000;
										opts.distance=value;
										ele.find('.distance').html(value+'mi');
										opts.onDistanceChange(value);
									}else{
										opts.distance=value;
										ele.find('.distance').html(value+'mi');
										opts.onDistanceChange(value);
									}
									if(self.options.disabled){
										self.options.disabled=0;
										self.vele.find('.x_filtertoggle').addClass('selected');
									}
								}
							}
						});
						ele.find('.distance').html(opts.distance+'mi');
						if(opts.enableBlank){
							ele.find('.x_clear').stap(function(){
								self.current=false;
								self.renderView('blank');
								opts.onChange(self.current);
							},1,'tapactive')
						}else{
							if(self.locationpicker) self.locationpicker.destroy();
							self.locationpicker=new modules.locationpicker({
								btn:ele.find('.x_change'),
								onChange:function(loc,data){
									self.current=data;
									if(data.gps) self.current.coords=[loc.lng,loc.lat];
									self.renderView('location');
									opts.onChange(self.current);
								}
							});
						}
					}
				})
			break;
		}
		if(opts.onHeightUpdate) opts.onHeightUpdate();
	}
	self.locateMe=function(cb){
        if(self.locating){
            return false;
        }else{
            self.locating=true;
            self.locate(function(pos,err){
                if(pos){
                	self.current={
                		main:'My Location',
                		secondary:'',
                		coords:[pos.lng,pos.lat],
                		gps:1
                	}
                    self.renderView('location');
                	opts.onChange(self.current);
                }else{
                   modules.toast({
						content:err,
                        remove:2500,
                        icon:'icon-warning-sign'
					})

                }
                self.locating=false;
                cb();
            })
        }
    }
    self.locate=function(cb){
        if(navigator.geolocation){
            self.nto=setTimeout(function(){
                if(!self.geoloaded){
                   cb(false,'We could not find your location');
                }
            },10000);
            self.geoloaded=0;
            navigator.geolocation.getCurrentPosition(function(position){
                //override
                if(self.nto) clearTimeout(self.nto);
                self.geoloaded=1;
                if(position.coords){
                    if(position.coords.accuracy < 1000){
                        return cb({lat:position.coords.latitude,lng:position.coords.longitude})
                    }
                }
                return cb(false,'We could not find your location');
            });
        }else{
            cb(false,'We could not find your location');
        }
    }
	self.showCitySelector=function(){
		$('#wrapper').page({
            template:'locationselector_searcher',
            uid:'location',
            beforeClose:function(ele,cb){//eliminate all animation/timing/etc
                setTimeout(function(){
                    cb();
                },50)
            },
            overlay:true,
            onClose:function(){
            },
            pageType:'static',
            data:{},
            onPageRendered:function(ele){
            	ele.find('.x_cancel').stap(function(){
            		$.fn.page.close();
            	},1,'tapactive')
            },
            onShow:function(ele){
            	self.ele=ele;
            	ele.find('input').focus()
            	ele.find('input').on('input',function(){
            		self.search($(this).val())
            	})
            	self.search('');
            }
        });
	}
	self.search=function(val){
		if(val.length){
			modules.geocode.search(val,{types: []},function(res){//'(cities)'
				if(res&&res.length){
					self.ele.find('.resultslist').html('');
	                $.each(res,function(i,v){
	                    self.ele.find('.resultslist').render({
	                        template:'location_city_search',
	                        data:{data:v},
	                        bindings:[{
	                            type:'click',
	                            binding:function(){
	                            	self.current=v.text;
	                                self.ele.find('.resultslist').html('<div style="padding:20px;text-align:center;font-size:16px;"><i class="icon-refresh animate-spin"></i> Getting Location</div>')
	                                //geocode and center based on placeid
	                                modules.geocode.getLocation(v.place_id,function(loc,isAddress){
	                                    self.current.coords=[loc.lng,loc.lat];
	                                    $.fn.page.close();
	                                   	self.renderView('location');
	                                   	opts.onChange(self.current);
	                                })
	                            }
	                        }]
	                    })
	                });
				}else{
					self.ele.find('.resultslist').html('<div style="padding:20px;text-align:center;font-size:16px;"><i class="icon-warning-sign"></i> No Results</div>');
				}
			});
		}else{
			self.ele.find('.resultslist').html('<div style="padding:20px;text-align:center;font-size:16px;"><i class="icon-search"></i> Search for Locations!</div>');
		}
	}
	self.init();
}