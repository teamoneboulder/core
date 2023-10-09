if(!window.modules) window.modules={};
modules.filter_content=function(opts){
	var self=this;
	self.opts=opts;
	this.loadFilter=function(){
		if(opts.filter){
			if(opts.filter.distance) opts.filter.distance=parseInt(opts.filter.distance,10);
			if(opts.filter.location){
				opts.filter.location.coords=[parseFloat(opts.filter.location.coords[0]),parseFloat(opts.filter.location.coords[1])];
				if(opts.filter.location.gps) opts.filter.location.gps=true;
			}
		}
		return opts.filter;
	}
	this.destroy=function(){
		console.warn('coming soon')
	}
	this.init=function(){
		if(opts.filter){
			self.filter=self.loadFilter();
		}else{
			self.filter={}
		}
		opts.features=['distance','tags','sort'];//'date'
		opts.views=['cloud','wiki'];
		opts.ele.render({
			template:'filter_content_header',
			data:{
				opts:opts,
				current:self.getValues()
			},
			binding:function(ele){
				self.ele=ele;
				ele.find('.x_save').stap(function(){
					self.promptFilter();
				},1,'tapactive')
				ele.find('.filternav').stap(function(){
					self.showNav($(this).attr('data-type'));
				},1,'tapactive');
				self.setWidth();
				self.setHeight();
			}
		});
	}
    this.promptFilter=function(){
    	app.prompt({
    		title:'Name for Favorite',
    		text:self.opts.name,
    		buttons:['Save','Cancel'],
    		callback:function(results){
    			// _alert("You selected button number " + results.buttonIndex + " and entered " + results.input1);
    			if(results.buttonIndex=="1"){
	    			var text=results.input1;
	    			var save={
	    				name:text,
	    				filter:self.filter
	    			}
	    			self.saveFilter(save);
	    		}
    		}
    	})
    }
    this.saveFilter=function(save){
    	app.api({
            url: app.sapiurl+'/module/filter_content/save',
            data:{
                save:save
            },
            callback:function(data){
                if(data.success){

                }else{
                	_alert('error saving!');
                }
            }
        });
    }
	this.showNav=function(nav){
		if(nav=='save'){
			self.promptFilter();
			return false;
		}
		if(self.cnav==nav){
			self.features[self.cnav].hide();
			self.cnav=false;
			self.ele.find('.filternav').removeClass('selected');
		}else{
			if(self.cnav){
				self.features[self.cnav].hide(function(){
					self.cnav=nav;
					self.features[self.cnav].show();
				});
			}else{
				self.cnav=nav;
				self.features[self.cnav].show();
			}
			self.ele.find('.filternav').removeClass('selected');
			self.ele.find('[data-type='+nav+']').addClass('selected');
		}
	}
	this.resetFilter=function(filter){
		self.filter=filter;
		self.setValues();
	}
	this.setFilter=function(key,value){
		if(value){
			self.filter[key]=value;
			if(opts.onFilterChange) opts.onFilterChange(self.filter);
		}else{
			self.clearFilter(key)
		}
		self.setValues();
		//cache
		self.cache()
	}
	this.cache=function(){
		if(self.opts.nocache) return false;
		app.user.profile.content_filter=self.filter;//local
		app.user.set({//remote
            items:[{
                type:'set',
                app:'content_filter',
                data:{
                    filter:self.filter
                }
            }]
        });
	}
	this.getFilter=function(type){
		return self.filter[type];
	}
	this.clearFilter=function(key){
		if(self.filter[key]) delete self.filter[key];
		self.cache();
		if(opts.onFilterChange) opts.onFilterChange(self.filter);
	}
	this.getValues=function(){
		var d={};
		$.each(opts.features,function(i,v){
			if(self.features[v]&&self.features[v].getValue){
				d[v]=self.features[v].getValue();
			}
		})
		return d;
	}
	this.setValues=function(){
		var data=self.getValues();
		$.each(data,function(i,v){
			self.ele.find('[data-type='+i+']').html(v);
		});
		self.setWidth();
	}
	this.features={
		view:{
			show:function(){
				var pself=this;
				var cv=self.getFilter('view');
				self.ele.find('.tray').show();
				self.ele.find('.tray').render({
					template:'filter_content_feature_view',
					data:{
						value:cv,
					},
					binding:function(ele){
						pself.ele=ele;
						ele.find('.toggler').stap(function(){
							if(!$(this).hasClass('selected')){
								ele.find('.toggler').removeClass('selected');
								$(this).addClass('selected');
								self.setFilter('view',$(this).attr('data-filter'));
							}
						},1,'tapactive')
						self.setHeight();
					}
				})
			},
			getValue:function(){
				var c=self.getFilter('view');
				if(c){
					return '<i class="icon-eye"></i>';
				}else{
					return 'View All <i class="icon-down-open"></i>';
				}
			},
			hide:function(cb){
				var pself=this;
				pself.ele.remove();
				self.ele.find('.tray').hide();
				self.setHeight();
				if(cb) cb();
			}
		},
		sort:{
			show:function(){
				var pself=this;
				var cv=self.getFilter('sort');
				self.ele.find('.tray').show();
				self.ele.find('.tray').render({
					template:'filter_content_feature_sort',
					data:{
						value:cv,
					},
					binding:function(ele){
						pself.ele=ele;
						ele.find('.toggler').stap(function(){
							if(!$(this).hasClass('selected')){
								ele.find('.toggler').removeClass('selected');
								$(this).addClass('selected');
								self.setFilter('sort',$(this).attr('data-filter'));
							}
						},1,'tapactive')
						self.setHeight();
					}
				})
			},
			getValue:function(){
				var c=self.getFilter('sort');
				// if(c){
				// 	if(c=='distance'){
				// 		return '<i class="icon-sort-alt-down"></i><i style="margin-left:-10px" class="icon-location-1"></i>';
				// 	}
				// 	if(c=='tsu'){
				// 		return '<i class="icon-sort-alt-down"></i><i style="margin-left:-10px" class="icon-real-time"></i>';
				// 	}
				// 	if(c=='top'){
				// 		return '<i class="icon-sort-alt-down"></i><i style="margin-left:-10px" class="icon-dating"></i>';
				// 	}
				// }else{
				// 	return 'Sort <i class="icon-down-open"></i>';
				// }
				return '<span class="filtersize">Sort <i class="icon-down-open"></i></span>';
			},
			hide:function(cb){
				var pself=this;
				pself.ele.remove();
				self.ele.find('.tray').hide();
				self.setHeight();
				if(cb) cb();
			}
		},
		distance:{
			show:function(){
				var pself=this;
				var c=self.getFilter('distance');
				var cv=(c)?c:2;
				self.ele.find('.tray').show();
				self.ele.find('.tray').render({
					template:'filter_content_feature_distance',
					data:{
						value:cv,
					},
					binding:function(ele){
						pself.ele=ele;
						pself.locationselector=new modules.locationselector({
							ele:ele.find('.location'),
							current:self.getFilter('location'),
							distance:self.getFilter('distance'),
							enableBlank:(opts.enableBlankLocation)?1:0,
							onHeightUpdate:function(){
								self.setHeight();
							},
							onDistanceChange:function(dist){
								self.setFilter('distance',dist);
								self.setHeight();
							},
							onChange:function(latlng){
								var c=self.getFilter('distance');
								self.filter.distance=(c)?c:2;
								self.setFilter('location',latlng);
								self.setHeight();
							}
						});
						self.setHeight();
					}
				})
			},
			getValue:function(){
				var c=self.getFilter('distance');
				if(self.getFilter('location')&&c){
					return '<div class="filtersize">'+c+'mi</div>';
				}else{
					return '<i class="icon-location-1"></i>';
				}
			},
			ensureSlider:function(){
				var pself=this;
				if(self.getFilter('location')){
					pself.ele.find('.slider').show()
				}else{
					pself.ele.find('.slider').hide()
				}
			},
			hide:function(cb){
				var pself=this;
				pself.ele.remove();
				self.ele.find('.tray').hide();
				self.setHeight();
				if(cb) cb();
				// TweenLite.to(pself.ele,.1,{y:'-100%',onComplete:function(){
				// 	pself.ele.remove();
				// 	self.setHeight();
				// 	if(cb) cb();
				// }})
			}
		},
		tags:{
			show:function(){
				var pself=this;
				self.ele.find('.tray').show();
				self.ele.find('.tray').render({
					template:'filter_content_feature_tags',
					data:{
					},
					binding:function(ele){
						pself.ele=ele;
						self.searchbar=new modules.search({
	                        input:ele.find('.taginput'),
	                        allowAdd:true,
	                        exclude:$.extend(true,[],pself.getCurrent('tags')),
	                        endpoint:app.sapiurl+'/search/tags',
	                        searchEle:ele.find('.searchele'),
	                        cancelEle:ele.find('.tagcancel'),
	                        onKeyUp:function(val){
	                            if(val==''){
	                                ele.find('.tagbox').find('.tagcursor').show();
	                            }else{
	                                ele.find('.tagbox').find('.tagcursor').hide();
	                            }
	                        },
	                        onSelect:function(id,item){//might want or need full item.
	                            var c=pself.getCurrent('tags');
	                            c.push(id);
	                            self.setFilter('tags',c);
	                            pself.renderAddSelectedTags();
	                            // self.setTagHash();
	                        }
	                    });
						pself.renderAddSelectedTags();
						self.setHeight();
					}
				});
			},
			getCurrent:function(field){
				if(self.filter[field]) return self.filter[field];
				else return [];
			},
			renderAddSelectedTags:function(){
				var pself=this;
		        pself.ele.find('.tagrender_top').render({
		            template:'filter_content_tagadd',
		            data:{
		                top:true,
		                tags:pself.getCurrent('tags')
		            },
		            append:false,
		            binding:function(ele){
		                ele.find('.x_remove').stap(function(){
		                    var id=$(this).attr('data-id');
		                    var c=pself.getCurrent('tags');
		                    c.splice(c.indexOf(id),1);
		                    if(!c.length) c=false;
		                    self.setFilter('tags',c);
		                    //clear out
		                    self.searchbar.remove(id);
		                    $(this).parent().fadeOut(500,function(){
		                        pself.ele.find('[data-tag='+id+']').remove();
		                        pself.ensureTagHeight(); 
		                    })
		                },1,'tapactive')
		            }
		        })
		        pself.ele.find('.tagrender_bottom').render({
		            template:'filter_content_tagadd',
		            data:{
		                top:false,
		                tags:pself.getCurrent('tags')
		            },
		            append:false
		        })
		        pself.ensureTagHeight();
		    },
			ensureTagHeight:function(){
				var pself=this;
		        //set proper padding on tag input
		        var p1=pself.ele.find('.tagrender_bottom').find('.tagcursor').position();
		        var p3={top:(p1.top),left:(p1.left+55)};
		        pself.ele.find('.taginput').css({paddingLeft:p3.left,paddingTop:p3.top});
		        //set height
		        var h=pself.ele.find('.tagrender_bottom').find('.tagaddbox').outerHeight()+10;
		        pself.ele.find('.tagbox').css({height:h});
		        self.setHeight();
		    },
			hide:function(cb){
				var pself=this;
				pself.ele.remove();
				self.ele.find('.tray').hide();
				self.setHeight();
				if(cb) cb();
			},
			getValue:function(){
				var c=self.getFilter('tags');
				if(c){
					return '<i class="icon-hashtag" style="color:#f09;font-weight:bold"></i>';
				}else{
					return '<i class="icon-hashtag"></i>';
				}
			}
		}
	}
	this.setWidth=function(){
		var w=10;
		self.ele.find('.filterwidth').each(function(i,v){
			w+=$(v).outerWidth();
		})
		self.ele.find('.scrollcontent').css('width',w);
		if(!self.scroller){
			self.scroller=new modules.scroller(self.ele.find('.xscroller'),{
				scrollX:true,
				scrollY:false
			})
		}else{
			self.scroller.refresh();
		}
	}
	this.setHeight=function(){
		var h=self.ele.outerHeight();
		opts.ele.css('top',h+'px');
	}
	this.init();
}