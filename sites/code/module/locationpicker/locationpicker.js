modules.locationpicker=function(options){
	var self=this;
	self.options=options;
	self.current=options.data;
	this.init=function(){
		if(!self.current&&options.cache){
			self.current=self.getLocationData();
			if(self.current.gps){
				//get current
				modules.tools.location.get(function(lnglat){
    				self.current={
						main:'GPS Location',
						gps:true,
						geometry:{
							coordinates:[lnglat.lng,lnglat.lat]
						}
					}
					self.setHistory();
                    self.setButton();
                    if(options.onChange) options.onChange(lnglat,self.current);
                    if(self.options.onCacheInit) self.options.onCacheInit(modules.geocode.getLoc(self.current),self.current,self.current.id);
    			},function(){
    				self.locating=false;
    				console.log('failed, default to last city!');
    				// if(app.user.profile.cast_location){
    				// 	self.current=$.extend(true,{},app.user.profile.cast_location);
	       //              self.bele.find('.locationname').html(self.getLocationName(self.current));
	       //              var lnglat=false;
	       //              if(self.current.loc) lnglat=self.current.loc;
	       //              if(options.onChange&&lnglat) options.onChange(lnglat,self.current);
    				// }	
    			})
			}else{
				if(self.options.onCacheInit&&self.current.geometry) self.options.onCacheInit(modules.geocode.getLoc(self.current),self.current,self.current.id);
			}
		}
		if(options.btn){
			self.bele=options.btn;
			self.setButton();
			options.btn.stap(function(){
				self.show()
			},1,'tapactive');
		}else if(options.ele){
			options.ele.render({
				template:(options.compact)?'locationpicker_button_compact':'locationpicker_button',
				append:false,
				data:{
					current:self.current
				},
				binding:function(ele){
					self.bele=ele;
					self.setButton();
					ele.find('.x_cancel').stap(function(e){
						self.clear();
						phi.stop(e)
					},1,'tapactive')
					ele.stap(function(){
						self.show()
					},1,'tapactive');
				}
			})
		}else{
			self.show();
		}
	}
	this.setButton=function(format){
		if(self.bele){
			if(self.current&&self.current.geometry){
				self.bele.find('.locationname').html(self.getLocationName(self.current,format));
				self.bele.find('.x_cancel').show();
			}else{
				self.bele.find('.locationname').html('');
				self.bele.find('.x_cancel').hide();
			}
		}
	}
	this.clear=function(){
		self.current={};
		self.setButton();
	}
	this.getLocationData=function(){
        if(app.user.profile.cast_location&&false){
            //self.loc=app.user.profile.cast_location.loc;
            return $.extend(true,{},app.user.profile.cast_location);
        }else{
        	if(options.default_location){
	            var loc={
	                main:'GPS Location',
	                secondary:'',
	                gps:true
	            }
	        }else{
	        	var loc={};
	        }
            //app.user.profile.cast_location=loc;
            return loc;
        }
    },
	this.show=function(){
		if(modules.keyboard_global) modules.keyboard_global.hide();
		$('body').render({
			template:'locationpicker_page',
			data:{
				placeholder:(options.placeholder)?options.placeholder:'Search Cities'
			},
			binding:function(ele){
				self.ele=ele;
				ele.find('.search').on('keyup',function(){
					self.search($(this).val())
				})
				self.ele.find('.x_cancel').stap(function(){
					ele.find('.search').val('');
					self.search('');
				},1,'tapactive')
				// ele.find('.x_clear').stap(function(){
				// 	self.current=false;
				// 	if(options.onChange) options.onChange(false);
				// 	self.setButton();
				// 	self.hidePicker();
				// },1,'tapactive')
				ele.find('.x_gps').stap(function(){
					if(self.locating) return false;
					self.locating=true;
					ele.find('.x_gps').find('i').removeClass('icon-location-1').addClass('icon-refresh animate-spin');
					modules.tools.location.get(function(lnglat){
						self.locating=false;
						ele.find('.x_gps').find('i').addClass('icon-location-1').removeClass('icon-refresh animate-spin');
	    				self.current={
							main:'GPS Location',
							secondary:'',
							gps:true,
							geometry:{
								coordinates:[lnglat.lng,lnglat.lat]
							}
						}
						self.setHistory();
	                    self.setButton();
	                    if(options.onChange) options.onChange(lnglat,self.current);
	                    self.hidePicker();
	    			},function(){
	    				self.locating=false;
	    				ele.find('.x_gps').find('i').addClass('icon-location-1').removeClass('icon-refresh animate-spin');
	    				modules.toast({
	    					icon:'icon-warning-sign',
	    					content:'Error getting your location...'
	    				})
	    			})
				},1,'tapactive');
				self.infinitescroller=new modules.infinitescroll({
                    ele:ele.find('.history'),
                    scroller:ele.find('.historyscroller'),
                    loadData:self.resp,//will also handle errors
                    endpoint:app.site_apiurl+'/module/locationpicker/history',
                    loaderClass:'lds-ellipsis-black',
                    offset:'200%',
                    onInterval:{
                        time:3000,
                        callback:function(){
                            //pself.updateTimes();
                        }
                    },
                    opts:{
                    },
                    max:10,
                    template:'locationpicker_location',
                    endOfList:' ',
                    nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>You dont have and used locations yet.</div></div>',
                    onPageReady:function(ele){
                        ele.find('.selectloc').stap(function(){
                        	var coll=self.infinitescroller.getById($(this).attr('data-id'));
                        	self.current=coll.place_info;
                        	self.setHistory({
                            	id:coll.place,
                            	data:self.current
                            });
                            self.setButton();
                            if(options.onChange) options.onChange(modules.geocode.getLoc(self.current),self.current);
                            self.hidePicker();
						},1,'tapactive');
                    },
                    scrollBindings:{
                        scrollStart:function(){
                        	if(modules.keyboard_global) modules.keyboard_global.hide();
                        },
                        scroll:function(obj){
                        }
                    }
                });
				TweenLite.set(self.ele.find('.pane'),{y:self.ele.find('.pane').height()});
				ele.find('.x_close').stap(function(){
					self.hidePicker()
				},1,'tapactive');
				setTimeout(function(){
					TweenLite.to(self.ele.find('.bg'),.3,{opacity:.3})
					TweenLite.to(self.ele.find('.pane'),.3,{y:0});
				},100);
			}
		})
	}
	self.search=function(val){
		if(val.length){
			self.ele.find('.searchscroller').show();
			self.ele.find('.x_cancel').show();
			self.ele.find('.historyscroller').hide();
			self.ele.find('.searchresults').html('<div style="padding:20px;text-align:center;font-size:16px;"><i class="icon-refresh animate-spin"></i> Loading.</div>');
			modules.geocode.search(val,{types: ['(cities)','(pois)']},function(res){//'(cities)'
				if(res&&res.length){
					self.ele.find('.searchresults').html('');
	                $.each(res,function(i,v){
	                    self.ele.find('.searchresults').render({
	                        template:'location_city_search',
	                        data:{data:v,format:'city'},
	                        bindings:[{
	                            type:'click',
	                            binding:function(){
	                            	self.current=v;
	                            	self.setButton('city_simple');
	                            	if(options.onChange) options.onChange(modules.geocode.getLoc(v),self.current,self.current.id);
	                                self.hidePicker();
	                            	self.setHistory({
                                    	id:v.id,
                                    	data:v
                                    });
	                            	// self.current=v.text;
	                             //    self.ele.find('.searchresults').html('<div style="padding:20px;text-align:center;font-size:16px;"><i class="icon-refresh animate-spin"></i> Getting Location</div>')
	                             //    //geocode and center based on placeid
	                             //    modules.geocode.getLocation(v.place_id,function(loc,isAddress,data){
	                             //    	//console.log(data);
	                             //        self.current.loc=loc;
	                             //        self.setHistory({
	                             //        	id:v.place_id,
	                             //        	data:self.current
	                             //        });
	                             //        if(self.bele) self.bele.find('.locationname').html(self.getLocationName(self.current));
	                             //        if(options.onChange) options.onChange(loc,self.current);
	                             //        self.hidePicker();
	                             //    })
	                            }
	                        }]
	                    })
	                });
				}else{
					self.ele.find('.searchresults').html('<div style="padding:20px;text-align:center;font-size:16px;"><i class="icon-warning-sign"></i> No Results</div>');
				}
			});
		}else{
			self.ele.find('.x_cancel').hide();
			self.ele.find('.searchscroller').hide();
			self.ele.find('.historyscroller').show();
		}
	}
	this.getLocationName=function(data){
		if(data.main) return data.main;
		return modules.tools.location.getName(data,'city');
	}
	this.destroy=function(){

	}
	this.setHistory=function(history){
		if(!history||history.gps) return true;//dont set history for current location
		// app.user.profile.cast_location=self.current;
  //       app.user.set({
  //           items:[{
	 //            type:'set',
	 //            app:'cast_location',
	 //            data:{
	 //                cast_location:self.current.id
	 //            }
	 //        }]
  //       });
		if(history){
			modules.api({
	            url:app.sapiurl+'/module/locationpicker/sethistory',
	            data:history,
	            timeout:5000,
	            callback:function(resp){
	            	console.log(resp)
	            }
	        });
			console.log('set history!')
		}
	}
	this.hidePicker=function(cb){
		self.hiding=true;
		TweenLite.to(self.ele.find('.bg'),.3,{opacity:0})
		TweenLite.to(self.ele.find('.pane'),.3,{y:self.ele.find('.pane').height(),onComplete:function(){
			self.ele.remove();
			self.hiding=false;
			if(self.onHide) self.onHide();
			self.onHide=false;
			if(cb) cb();
		}})
	}
	this.init();
}