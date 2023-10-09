if(!window.modules) window.modules={};
modules.filter=function(opts){
	var self=this;
	//console.log(opts)
	//console.log($.extend(true,{},opts))
	if(!opts.filterOpts) opts.filterOpts={};
	self.opts=opts;
	this.destroy=function(){
		console.warn('coming soon')
	}
	this.hasChanged=function(){
		if(app.deepCompare(self.snapshot,self.getFilter())){
			return 0;
		}else{
			return 1;
		}
	}
	this.loadFilter=function(filter){
		var ret={};
		if(filter){
			if(filter===true){
				if(self.disabled.indexOf('location')==-1) self.disabled.push('location');
				filter={};
			}
			if(filter.distance) filter.distance=parseInt(filter.distance,10);
			if(filter.location){
				if(filter.location.gps) filter.location.gps=true;
			}
			if(!filter.distance&&!opts.filterOpts.noDistance){
				if(app.user.profile&&app.user.profile.filter.location){//share common location filter
					filter.location=$.extend(true,{},app.user.profile.filter.location);
				}
				if(app.user.profile&&app.user.profile.filter.distance){
					filter.distance=parseInt(app.user.profile.filter.distance,10);
				}
			}
			if(filter.age){
				filter.age=[parseInt(filter.age[0],10),parseInt(filter.age[1],10)]
			}
			if(filter.friends_mutual){
				filter.friends_mutual=parseInt(filter.friends_mutual,10);
			}
			var features=self.getFeatures();
			$.each(features,function(i,v){
				if(v=='distance'){
					if(filter[v]) ret[v]=filter[v];
					if(filter.location) ret.location=filter.location;
				}else if(v=='tags'){
					if(filter.tags) ret.tags=filter.tags;
					if(filter.tag_person) ret.tag_person=filter.tag_person;
				}else{
					if(filter[v]) ret[v]=filter[v];
				}
			})
		}
		if(opts.filterOpts){
			ret=$.extend(true,{},ret,opts.filterOpts);
		}
		console.log(ret)
		return ret;
	}
	this.getDefaultFilter=function(){
		var f={};
		if(app.user.profile&&app.user.profile.filter){
			if(app.user.profile.filter[opts.type]){
				f=$.extend(true,{},app.user.profile.filter[opts.type]);
			}
			if(opts.filterOpts&&opts.filterOpts.noDistance){

			}else{
				if(app.user.profile.filter.location){//share common location filter
					f.location=$.extend(true,{},app.user.profile.filter.location);
				}
				if(app.user.profile.filter.distance){
					f.distance=parseInt(app.user.profile.filter.distance,10);
				}
			}
		}
		if(opts.filterOpts&&opts.filterOpts.noDistance){

		}else if(!f.location&&app.user.profile.city_location){
			f.location=app.user.profile.city_location;
		}
		if(f.location&&!f.distance) f.distance=50;
		if(opts.clearFilters){
			$.each(opts.clearFilters,function(i,v){
				if(f[v]) delete f[v];
			})
		}
		if(opts.filterOpts){
			f=$.extend(true,{},f,opts.filterOpts);
		}
		return f;
	}
	this.init=function(){
		if(opts.locationOff){
			self.disabled.push('location');
		}
		if(opts.filter){
			self.filter=self.loadFilter(opts.filter);
		}else{
			self.filter=self.getDefaultFilter();
		}
		opts.ele.render({
			template:'filter_search',
			data:{},
			binding:function(ele){
				self.searchele=ele;
			}
		});
		if(opts.button){
			opts.button.render({
				template:'filter_button',
				binding:function(ele){
					ele.stap(function(){
						self.showNav('filters');
					},1,'tapactive')
				}
			})
			self.ensureAutoPlacement();
		}else{
			opts.ele.render({
				template:'filter_header',
				data:{},
				binding:function(ele){
					self.ele=ele;
					self.renderHeader(1);
				}
			});
		}
	}
	this.ensureAutoPlacement=function(){
		if(opts.list){
			var p=self.features.filters.getPlacement();
			if(p.sidepannel){
				self.showNav('filters');
				opts.button.hide();
			}else{
				opts.button.show();
			}
		}
	}
	this.getFeatures=function(){
		if(!opts.features) return ['distance','tag_post','tag_person','gender','age','friends','sort'];//'date' 'dating'
		return opts.features;
	}
	this.renderHeader=function(load){
		opts.features=self.getFeatures();
		self.ele.find('.filtercontent').render({
			template:'filter_content',
			append:false,
			data:{
				selected:(self.cnav)?self.cnav:'',
				opts:$.extend(true,{},opts,{onFilterChange:true,ele:''}),
				showHint:1,
				current:self.getValues()
			},
			binding:function(ele){
				ele.find('.filternav').stap(function(){
					if($(this).attr('data-type')) self.showNav($(this).attr('data-type'));
				},1,'tapactive');
				self.setWidth();
				self.setHeight();
				if(load&&opts.showFilter){
					self.showNav(opts.showFilter);
				}
			}
		});
	}
	this.initLocation=function(){
		var c=self.getFilter('location');
		if(c&&c.gps){
			if(self.opts.onLocating) self.opts.onLocating();
			self.locateMe(function(){
			},function(){
				if(self.opts.onLocateFail) self.opts.onLocateFail();
				self.showNav('distance');
			})
		}else if(!c&&self.opts.defaultLocation){
			self.setFilter('location',self.opts.defaultLocation);
		}
	}
	self.locateMe=function(cb,fcb){
        if(self.locating){
            return false;
        }else{
            self.locating=true;
            self.locate(function(pos,err){
                if(pos){
                	app.currentLocation=pos;
                	var c=self.getFilter('distance');
					self.filter.distance=(c)?c:50;
                	self.setFilter('location',{
                		gps:true,
                		main:'My Location',
                		secondary:'',
                		coords:[pos.lng,pos.lat]
                	});
                	cb();
                }else{
                   modules.toast({
						content:err,
                        remove:2500,
                        icon:'icon-warning-sign'
					})
                   fcb();
                }
                self.locating=false;
            })
        }
    }
    self.locate=function(cb){
        if(navigator.geolocation){
            self.nto=setTimeout(function(){
                if(!self.geoloaded){
                   cb(false,'We could not find your location');
                }
            },5000);
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
    this.promptFilter=function(){
    	app.prompt({
    		title:'Name for Favorite',
    		message:'',
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
            url: app.sapiurl+'/module/filter/save',
            data:{
                save:save
            },
            callback:function(data){
            	console.log(data)
                if(data.success){

                }else{
                	_alert('error saving!');
                }
            }
        });
    }
    this.hide=function(){
    	if(self.cnav){
    		self.features[self.cnav].hide();
			self.cnav=false;
			self.ele.find('.filternav').removeClass('selected');
    	}
    	self.ensureAutoPlacement();
    }
    this.hideNav=function(nav){
    	self.features[nav].hide();
		self.cnav=false;
		self.ele.find('.filternav').removeClass('selected');
    }
	this.showNav=function(nav){
		if(nav=='save'){
			self.promptFilter();
			return false;
		}
		if(self.cnav==nav){
			self.hideNav(nav);
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
		//self.cache()
	}
	this.updateFilter=function(){
		self.renderHeader();//will update and set proper widht
		self.setValues();
		if(opts.onFilterChange) opts.onFilterChange(self.getFilter());
	}
	this.setFilter=function(key,value,external){
		if(value){
			self.filter[key]=value;
			if(opts.onFilterChange) opts.onFilterChange(self.getFilter());
			if(external){
				//re-render!
			}
		}else{
			var temp=$.extend(true,{},self.filter);
			if(temp[key]) delete temp[key];
			if(!self.isValidSort(temp)) self.filter.sort='tsu';//
			if(self.cnav==key) self.hideNav(key);
			if(self.filter[key]){
				self.clearFilter(key)
			}else{
				return false;//no change!
			}
		}
		//re-render!
		//self.setValues();
		self.renderHeader();
		//cache
		self.cache();
		if(self.filtershowing&&opts.previewCount){
			if(opts.onFilterChange) opts.onFilterChange(self.getFilter(),1);
		}
		if(self.filtershowing){
			if(self.hasChanged()){
				opts.ele.find('.filters_showing').html('Apply');
			}else{
				opts.ele.find('.filters_showing').html('Cancel');
			}
		}
	}
	this.counts={
		loading:function(){
			if(self.filtershowing){
				opts.ele.find('.x_counts').render({
					append:false,
					template:'filter_loadingcounts'
				})
			}
		},
		loadError:function(){
			opts.ele.find('.x_counts').html('');
		},
		set:function(count){
			if(self.filtershowing){
				opts.ele.find('.x_counts').render({
					append:false,
					template:'filter_counts',
					data:{
						count:count
					}
				})
			}
		}
	}
	this.isValidSort=function(temp){
		if(temp.filter=='distance'||temp.filter=='mutual'){
			if(temp.location&&temp.distance) return true;
			return false;
		}
		return true;
	}
	this.cache=function(){
		if(self.opts.nocache) return false;
		var dontcache=['location','distance','category'];
		var f=$.extend(true,{},self.filter);
		$.each(dontcache,function(i,v){
			if(f[v]) delete f[v];
		})
		if(!app.user.profile) return console.warn('cache not enabled');
		if(!app.user.profile.filter) app.user.profile.filter={};
		app.user.profile.filter[self.opts.type]=f;
		var data={}
		data[self.opts.type]=f;
		data['location']=self.filter.location;
		data['distance']=self.filter.distance;
		app.user.profile.filter.location=$.extend(true,{},self.filter.location);
		app.user.profile.filter.distance=self.filter.distance;
		app.user.set({//remote
            items:[{
                type:'set',
                app:'filter',
                data:{
                	data:JSON.stringify(data),
                	encoded:1
                }
            }]
        });
	}
	this.disabled=[];
	this.getFilter=function(type){
		if(!type){
			var ret=$.extend(true,{},self.filter);
			if(self.disabled.indexOf('location')>=0){
				if(ret.location) delete ret.location;
				if(ret.distance) delete ret.distance;
			}
			return JSON.parse(JSON.stringify(ret));
		}
		return self.filter[type]
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
		sort:{
			show:function(renderTo){
				var pself=this;
				var cv=self.getFilter('sort');
				if(!renderTo){
					self.ele.find('.tray').show();
					renderTo=self.ele.find('.tray');
					pself.renderTo=0;
				}else{
					pself.renderTo=1;
				}
				renderTo.render({
					template:'filter_feature_sort',
					data:{
						value:cv
					},
					binding:function(ele){
						pself.ele=ele;
						ele.find('.toggler2').stap(function(){
							if(!$(this).hasClass('selected')){
								var temp=$.extend(true,{},self.filter);
								temp.sort=$(this).attr('data-filter');
								if(self.isValidSort(temp)){
									ele.find('.toggler2').removeClass('selected');
									$(this).addClass('selected');
									self.setFilter('sort',$(this).attr('data-filter'));
								}else{
									modules.toast({content:'location must be set to use this filter'})
								}
							}
						},1,'tapactive')
						if(!pself.renderTo) self.setHeight();
					}
				})
			},
			getName:function(){
				return {
					name:'Sort'
				}
			},
			getValue:function(){
				//return '<span class="filtersize"><i class="icon-down-open"></i> Sort</span>';
				var c=self.getFilter('sort');
				if(c){
					if(c=='distance'){
						return '<div style="display:inline-block;vertical-align:middle">closest</div>';
					}
					if(c=='tsu'){
						return '<div style="display:inline-block;vertical-align:middle">recent</div>';
					}
					if(c=='mutual'){
						return '<div style="display:inline-block;vertical-align:middle">mutual</div>';
					}
				}else{
					return false;
					//return '<i class="icon-sort-alt-down"></i>';
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
		distance:{
			show:function(renderTo){
				var pself=this;
				var c=self.getFilter('distance');
				var cv=(c)?c:2;
				if(!renderTo){
					self.ele.find('.tray').show();
					renderTo=self.ele.find('.tray');
				}
				renderTo.render({
					template:'filter_feature_distance',
					data:{
						value:cv,
					},
					binding:function(ele){
						pself.ele=ele;
						if(self.getFilter('location')){
							ele.find('.x_clear').show();
						}else{
							ele.find('.x_clear').hide();
						}
						ele.find('.x_clear').stap(function(){
							self.setFilter('location','');
						},1,'tapactive')
						pself.locationselector=new modules.locationselector({
							ele:ele.find('.location'),
							current:self.getFilter('location'),
							distance:self.getFilter('distance'),
							disabled:(self.disabled.indexOf('location')>=0)?1:0,
							enableBlank:(opts.enableBlankLocation)?1:0,
							onDisableToggle:function(val){
								console.log(val)
								if(val){
									if(self.disabled.indexOf('location')==-1) self.disabled.push('location');
								}else{
									var ind=self.disabled.indexOf('location');
									if(ind>=0){
										self.disabled.splice(ind,1);
									}
								}
								self.updateFilter();
							},
							onHeightUpdate:function(){
								self.setHeight();
							},
							onDistanceChange:function(dist){
								self.setFilter('distance',dist);
								self.setHeight();
							},
							onChange:function(latlng){
								ele.find('.x_clear').show();
								var c=self.getFilter('distance');
								self.filter.distance=(c)?c:2;
								self.setFilter('location',latlng);
								self.setHeight();
							}
						});
						if(!renderTo) self.setHeight();
					}
				})
			},
			getName:function(){
				return {
					name:'Location'
				}
			},
			getValue:function(){
				if(self.disabled.indexOf('location')>=0) return false;
				var c=self.getFilter('distance');
				if(self.getFilter('location')&&c){
					return '<div class="filtersize">'+c+'mi</div>';
				}else if(!opts.enableBlankLocation){
					return 'set location';
				}else {
					return '';
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
		location:{
			hide:function(cb){
				var pself=self.features.distance;
				pself.ele.remove();
				self.ele.find('.tray').hide();
				self.setHeight();
				if(cb) cb();
			}
		},
		tag_post:{
			show:function(renderTo){
				var pself=this;
				if(!renderTo){
					self.ele.find('.tray').show();
					renderTo=self.ele.find('.tray');
					pself.renderTo=0;
				}else{
					pself.renderTo=1;
				}
				renderTo.render({
					template:'filter_feature_tag_post',
					data:{
						icon:(self.opts.feature_opts&&self.opts.feature_opts.tag_post&&self.opts.feature_opts.tag_post.icon)?self.opts.feature_opts.tag_post.icon:'icon-blog'
					},
					binding:function(ele){
						pself.ele=ele;
						pself.searchbar=new modules.search({
	                        input:ele.find('.taginput'),
	                        allowAdd:false,
	                        exclude:$.extend(true,[],pself.getCurrent('tags')),
	                        endpoint:app.sapiurl+'/search/tags',
	                        searchEle:self.searchele,
	                        fitSearch:true,
	                        fitPosition:true,
	                        inline:true,
	                        scroller:(app.isWebLayout())?self.features.filters.ele:0,
	                        web_inline:(app.isWebLayout())?1:0,
	                        getTop:function(){
	                        	if(pself.renderTo){
	                        		return false;
	                        	}else{
	                        		return 0;
	                        	}
	                        },
	                        cancelEle:ele.find('.tagcancel'),
	                        renderTemplate:'modules_search_tag',
	                        onKeyUp:function(val){
	                            if(val==''){
	                                ele.find('.tagbox').find('.tagcursor').show();
	                            }else{
	                                ele.find('.tagbox').find('.tagcursor').hide();
	                            }
	                        },
	                        onSelect:function(id,item){//might want or need full item.
	                            var c=pself.getCurrent();
	                            c.order.push(id);
	                            c.list[id]=item;
	                            self.setFilter('tag_post',c);
	                            pself.renderAddSelectedTags();
	                            // self.setTagHash();
	                        }
	                    });
						pself.renderAddSelectedTags();
						if(!renderTo) self.setHeight();
					}
				});
			},
			getName:function(){
				return {
					name:'Tags'
				}
			},
			getCurrent:function(field){
				if(self.filter.tag_post) return self.filter.tag_post;
				else return {
					order:[],
					list:{}
				};
			},
			renderAddSelectedTags:function(){
				var pself=this;
				var current=pself.getCurrent()
		        pself.ele.find('.tagrender_top').render({
		            template:'filter_tagadd',
		            data:{
		            	content:(self.opts.feature_opts&&self.opts.feature_opts.tag_post&&self.opts.feature_opts.tag_post.placeholder)?self.opts.feature_opts.tag_post.placeholder:'search posts by tags',
		                top:true,
		                tags:current.order,
		                tag_info:current.list
		            },
		            append:false,
		            binding:function(ele){
		                ele.find('.x_remove').stap(function(){
		                    var id=$(this).attr('data-id');
		                    var c=pself.getCurrent();
		                    c.order.splice(c.order.indexOf(id),1);
		                    if(c.list[id]) delete c.list[id];
		                    self.setFilter('tag_post',c);
		                    //clear out
		                    pself.searchbar.remove(id);
		                    $(this).parent().fadeOut(500,function(){
		                        pself.ele.find('[data-tag='+id+']').remove();
		                        pself.ensureTagHeight(); 
		                    })
		                },1,'tapactive')
		            }
		        })
		        pself.ele.find('.tagrender_bottom').render({
		            template:'filter_tagadd',
		            data:{
		            	content:(self.opts.feature_opts&&self.opts.feature_opts.tag_post&&self.opts.feature_opts.tag_post.placeholder)?self.opts.feature_opts.tag_post.placeholder:'search posts by tags',
		                top:false,
		                tags:current.order,
		                tag_info:current.list
		            },
		            append:false
		        })
		        pself.ensureTagHeight();
		    },
			ensureTagHeight:function(){
				var pself=this;
		        //set proper padding on tag input
		        var p1=pself.ele.find('.tagrender_bottom').find('.tagcursor').position();
		        var p3={top:(p1.top),left:(p1.left+50)};
		        pself.ele.find('.taginput').css({paddingLeft:p3.left,paddingTop:p3.top});
		        //set height
		        var h=pself.ele.find('.tagrender_bottom').find('.tagaddbox').outerHeight()+10;
		        pself.ele.find('.tagbox').css({height:h});
		        if(!pself.renderTo) self.setHeight();
		    },
			hide:function(cb){
				var pself=this;
				pself.ele.remove();
				if(!pself.renderTo){
					self.ele.find('.tray').hide();
					self.setHeight();
				}
				if(!pself.getValue()){
					self.renderHeader();
				}
				if(cb) cb();
			},
			getValue:function(){
				var pself=this;
				var c=pself.getCurrent();
				if(c.order.length){
					if(self.opts.feature_opts&&self.opts.feature_opts.tag_post&&self.opts.feature_opts.tag_post.icon) return '<i class="'+self.opts.feature_opts.tag_post.icon+'"></i>'; 
					return '<i class="icon-blog"></i>';
				}else{
					return false;
				}
			}
		},
		tag_person:{
			show:function(renderTo){
				var pself=this;
				if(!renderTo){
					self.ele.find('.tray').show();
					renderTo=self.ele.find('.tray');
					pself.renderTo=0;
				}else{
					pself.renderTo=1;
				}
				renderTo.render({
					template:'filter_feature_tag_person',
					data:{
					},
					binding:function(ele){
						pself.ele=ele;
						pself.searchbar=new modules.search({
	                        input:ele.find('.taginput'),
	                        allowAdd:false,
	                        exclude:$.extend(true,[],pself.getCurrent()),
	                        endpoint:app.sapiurl+'/search/tags',
	                        searchEle:self.searchele,
	                        scroller:(app.isWebLayout())?self.features.filters.ele:0,
	                        fitSearch:true,
	                        web_inline:(app.isWebLayout())?1:0,
	                        fitPosition:true,
	                        inline:true,
	                        getTop:function(){
	                        	if(pself.renderTo){
	                        		return false;
	                        	}else{
	                        		return 0;
	                        	}
	                        },
	                        cancelEle:ele.find('.tagcancel'),
	                        renderTemplate:'modules_search_tag',
	                        onKeyUp:function(val){
	                            if(val==''){
	                                ele.find('.tagbox').find('.tagcursor').show();
	                            }else{
	                                ele.find('.tagbox').find('.tagcursor').hide();
	                            }
	                        },
	                        onSelect:function(id,item){//might want or need full item.
	                            var c=pself.getCurrent();
	                            c.order.push(id);
	                            c.list[id]=item;
	                            self.setFilter('tag_person',c);
	                            pself.renderAddSelectedTags();
	                            // self.setTagHash();
	                        }
	                    });
						pself.renderAddSelectedTags();
						if(!renderTo) self.setHeight();
					}
				});
			},
			getName:function(){
				return {
					name:'Tags'
				}
			},
			getCurrent:function(field){
				//ensure tags are valid/clean
				if(self.filter.tag_person){
					//return self.filter.tag_person;
					var data={
						list:{},
						order:[]
					}
					$.each(self.filter.tag_person.order,function(i,v){
						var td=self.filter.tag_person.list[v];
						if(td&&td.id){
							data.order.push(v);
							data.list[v]=td;
						}
					})
					return data;
				}else return {
					order:[],
					list:{}
				};
			},
			renderAddSelectedTags:function(){
				var pself=this;
				var current=pself.getCurrent()
		        pself.ele.find('.tagrender_top').render({
		            template:'filter_tagadd',
		            data:{
		            	content:(self.opts.feature_opts&&self.opts.feature_opts.tag_person&&self.opts.feature_opts.tag_person.placeholder)?self.opts.feature_opts.tag_person.placeholder:'search people by tags',
		                top:true,
		                tags:current.order,
		                tag_info:current.list
		            },
		            append:false,
		            binding:function(ele){
		                ele.find('.x_remove').stap(function(){
		                    var id=$(this).attr('data-id');
		                    var c=pself.getCurrent();
		                    c.order.splice(c.order.indexOf(id),1);
		                    if(c.list[id]) delete c.list[id];
		                    self.setFilter('tag_person',c);
		                    //clear out
		                    pself.searchbar.remove(id);
		                    $(this).parent().fadeOut(500,function(){
		                        pself.ele.find('[data-tag='+id+']').remove();
		                        pself.ensureTagHeight(); 
		                    })
		                },1,'tapactive')
		            }
		        })
		        pself.ele.find('.tagrender_bottom').render({
		            template:'filter_tagadd',
		            data:{
		            	content:'search people by tags',
		                top:false,
		                tags:current.order,
		                tag_info:current.list
		            },
		            append:false
		        })
		        pself.ensureTagHeight();
		    },
			ensureTagHeight:function(){
				var pself=this;
		        //set proper padding on tag input
		        var p1=pself.ele.find('.tagrender_bottom').find('.tagcursor').position();
		        var p3={top:(p1.top),left:(p1.left+50)};
		        pself.ele.find('.taginput').css({paddingLeft:p3.left,paddingTop:p3.top});
		        //set height
		        var h=pself.ele.find('.tagrender_bottom').find('.tagaddbox').outerHeight()+10;
		        pself.ele.find('.tagbox').css({height:h});
		        if(!pself.renderTo) self.setHeight();
		    },
			hide:function(cb){
				var pself=this;
				pself.ele.remove();
				if(!pself.renderTo){
					self.ele.find('.tray').hide();
					self.setHeight();
				}
				if(!pself.getValue()){
					self.renderHeader();
				}
				if(cb) cb();
			},
			getValue:function(){
				var pself=this;
				var c=pself.getCurrent();
				if(c.order.length){
					return '<i class="icon-hashtag"></i>';
				}else{
					return false;
				}
			}
		},
		tag_skills:{
			show:function(renderTo){
				var pself=this;
				if(!renderTo){
					self.ele.find('.tray').show();
					renderTo=self.ele.find('.tray');
					pself.renderTo=0;
				}else{
					pself.renderTo=1;
				}
				renderTo.render({
					template:'filter_feature_tag_skills',
					data:{
					},
					binding:function(ele){
						pself.ele=ele;
						pself.searchbar=new modules.search({
	                        input:ele.find('.taginput'),
	                        allowAdd:false,
	                        exclude:$.extend(true,[],pself.getCurrent()),
	                        endpoint:app.sapiurl+'/search/skills',
	                        searchEle:self.searchele,
	                        fitSearch:true,
	                        fitPosition:true,
	                        inline:true,
	                        getTop:function(){
	                        	if(pself.renderTo){
	                        		return false;
	                        	}else{
	                        		return 0;
	                        	}
	                        },
	                        cancelEle:ele.find('.tagcancel'),
	                        renderTemplate:'modules_search_tag',
	                        onKeyUp:function(val){
	                            if(val==''){
	                                ele.find('.tagbox').find('.tagcursor').show();
	                            }else{
	                                ele.find('.tagbox').find('.tagcursor').hide();
	                            }
	                        },
	                        onSelect:function(id,item){//might want or need full item.
	                            var c=pself.getCurrent();
	                            c.order.push(id);
	                            c.list[id]=item;
	                            self.setFilter('tag_skills',c);
	                            pself.renderAddSelectedTags();
	                            // self.setTagHash();
	                        }
	                    });
						pself.renderAddSelectedTags();
						if(!renderTo) self.setHeight();
					}
				});
			},
			getName:function(){
				return {
					name:'Tags'
				}
			},
			getCurrent:function(field){
				if(self.filter.tag_skills){
					var data={
						list:{},
						order:[]
					}
					$.each(self.filter.tag_skills.order,function(i,v){
						var td=self.filter.tag_skills.list[v];
						if(td&&td.id){
							data.order.push(v);
							data.list[v]=td;
						}
					})
				}
				else return {
					order:[],
					list:{}
				};
			},
			renderAddSelectedTags:function(){
				var pself=this;
				var current=pself.getCurrent()
		        pself.ele.find('.tagrender_top').render({
		            template:'filter_tagadd',
		            data:{
		            	content:'search people by skills',
		                top:true,
		                tags:current.order,
		                tag_info:current.list
		            },
		            append:false,
		            binding:function(ele){
		                ele.find('.x_remove').stap(function(){
		                    var id=$(this).attr('data-id');
		                    var c=pself.getCurrent();
		                    c.order.splice(c.order.indexOf(id),1);
		                    if(c.list[id]) delete c.list[id];
		                    self.setFilter('tag_skills',c);
		                    //clear out
		                    pself.searchbar.remove(id);
		                    $(this).parent().fadeOut(500,function(){
		                        pself.ele.find('[data-tag='+id+']').remove();
		                        pself.ensureTagHeight(); 
		                    })
		                },1,'tapactive')
		            }
		        })
		        pself.ele.find('.tagrender_bottom').render({
		            template:'filter_tagadd',
		            data:{
		            	content:'search people by skills',
		                top:false,
		                tags:current.order,
		                tag_info:current.list
		            },
		            append:false
		        })
		        pself.ensureTagHeight();
		    },
			ensureTagHeight:function(){
				var pself=this;
		        //set proper padding on tag input
		        var p1=pself.ele.find('.tagrender_bottom').find('.tagcursor').position();
		        var p3={top:(p1.top),left:(p1.left+50)};
		        pself.ele.find('.taginput').css({paddingLeft:p3.left,paddingTop:p3.top});
		        //set height
		        var h=pself.ele.find('.tagrender_bottom').find('.tagaddbox').outerHeight()+10;
		        pself.ele.find('.tagbox').css({height:h});
		        if(!pself.renderTo) self.setHeight();
		    },
			hide:function(cb){
				var pself=this;
				pself.ele.remove();
				if(!pself.renderTo){
					self.ele.find('.tray').hide();
					self.setHeight();
				}
				if(!pself.getValue()){
					self.renderHeader();
				}
				if(cb) cb();
			},
			getValue:function(){
				var pself=this;
				var c=pself.getCurrent();
				if(c.order.length){
					return '<i class="icon-hero"></i>';
				}else{
					return false;
				}
			}
		},
		date:{
			show:function(renderTo){
				var pself=this;
				if(!renderTo){
					self.ele.find('.tray').show();
					renderTo=self.ele.find('.tray');
				}
				renderTo.render({
					template:'filter_feature_page',
					data:{
					},
					binding:function(ele){
						pself.ele=ele;
						self.setHeight();
					}
				});
			},
			getName:function(){
				return {
					name:'Time'
				}
			},
			hide:function(cb){
				var pself=this;
				pself.ele.remove();
				if(!pself.renderTo){
					self.ele.find('.tray').hide();
					self.setHeight();
				}
				if(cb) cb();
			},
			getValue:function(){
				var c=self.getFilter('date');
				if(c){
					return '<i class="icon-hashtag" style="color:green;font-weight:bold"></i>';
				}else{
					return false
					//return '<i class="icon-calendar"></i>';
				}
			}
		},
		gender:{
			show:function(renderTo){
				var pself=this;
				if(!renderTo){
					self.ele.find('.tray').show();
					renderTo=self.ele.find('.tray');
					pself.renderTo=0;
				}else{
					pself.renderTo=1;
				}
				renderTo.render({
					template:'filter_feature_gender',
					data:{
						current:pself.getCurrent()
					},
					binding:function(ele){
						pself.ele=ele;
						ele.find('.x_filtertoggle').stap(function(){
							var c=pself.getCurrent();
							if(c){
								self.setFilter('gender');
								ele.find('.toggler2').removeClass('selected');
								ele.find('.x_filtertoggle').removeClass('selected')
							}else{
								var f=ele.find('.toggler2').first().attr('data-id');
								self.setFilter('gender',f);
								ele.find('.x_filtertoggle').addClass('selected')
								ele.find('[data-id='+f+']').addClass('selected');
							}
						},1,'tapactive')
						ele.find('.toggler2').stap(function(){
							if($(this).hasClass('selected')){
								$(this).removeClass('selected');
								self.setFilter('gender');
								ele.find('.x_filtertoggle').removeClass('selected')
							}else{
								ele.find('.toggler2').removeClass('selected');
								if($(this).attr('data-id')=='off'){
									self.setFilter('gender');
								}else{
									$(this).addClass('selected');
									self.setFilter('gender',$(this).attr('data-id'));
									ele.find('.x_filtertoggle').addClass('selected')
								}
							}
						},1,'tapactive');
						if(!pself.renderTo) self.setHeight();
					}
				});
			},
			getName:function(){
				return {
					name:'Gender'
				}
			},
			getCurrent:function(){
				var c=self.getFilter('gender');
				return (c)?c:''
			},
			hide:function(cb){
				var pself=this;
				pself.ele.remove();
				self.ele.find('.tray').hide();
				self.setHeight();
				if(cb) cb();
			},
			getValue:function(){
				var c=self.getFilter('gender');
				if(c&&c!='all'){
					return '<div class="filtersize" style="display:inline-block;vertical-align:middle;">'+app.loc(c+'_abr')+'</div>';
				}else{
					return false;
					//return '<i class="icon-gender"></i>';
				}
			}
		},
		age:{
			max:100,
			min:20,
			show:function(renderTo){
				var pself=this;
				if(!renderTo){
					self.ele.find('.tray').show();
					renderTo=self.ele.find('.tray');
					pself.renderTo=0;
				}else{
					pself.renderTo=1;
				}
				renderTo.render({
					template:'filter_feature_age',
					data:{
						current:self.getFilter('age'),
						max:pself.max,
						min:pself.min
					},
					binding:function(ele){
						pself.ele=ele;
						ele.find('.x_filtertoggle').stap(function(){
							var c=self.getFilter('age');
							if(c){
								self.setFilter('age');
								ele.find('.x_filtertoggle').removeClass('selected')
							}else{//toggle on!
								ele.find('.x_filtertoggle').addClass('selected')
								var vs=pself.updateValues();
								self.setFilter('age',vs);
							}
						},1,'tapactive')
						ele.find('input').on('input',function(){
							var vs=pself.updateValues();
							ele.find('.value').html(vs[0]+'-'+vs[1]);
							pself.setBar(vs);
						}).on('change',function(){
							var vs=pself.updateValues();
							pself.setBar(vs);
							ele.find('.value').html(vs[0]+'-'+vs[1]);
							ele.find('.x_clear').show();
							if(!renderTo) self.setHeight();
							self.setFilter('age',vs);
							ele.find('.x_filtertoggle').addClass('selected')
						})
						ele.find('.x_clear').stap(function(){
							ele.find('.x_clear').hide();
							self.setFilter('age');
							self.setHeight();
						},1,'tapactive')
						var vs=pself.updateValues();
						ele.find('.value').html(vs[0]+'-'+vs[1]);
						pself.setBar(vs);
						if(!pself.renderTo) self.setHeight();
					}
				});
			},
			getName:function(){
				return {
					name:'Age'
				}
			},
			setBar:function(vs){
				var pself=this;
				var diff=pself.max-pself.min;
				var t1=vs[0]-pself.min;
				var t2=vs[1]-pself.min;
				var p1=(t1/diff)*100;
				var p2=(t2/diff)*100;
				//ensure proper margin!
				var width=pself.ele.find('.handle1').width();
				var ml1=-((width/2)+((p1-50)/50)*(width/2));
				var ml2=-((width/2)+((p2-50)/50)*(width/2));
				pself.ele.find('.handle1').css({left:p1+'%',marginLeft:ml1});
				pself.ele.find('.handle2').css({left:p2+'%',marginLeft:ml2});
				pself.ele.find('.fillbar').css({left:p1+'%',width:(p2-p1)+'%'});
			},
			updateValues:function(){
				var pself=this;
				var vs=[]
				pself.ele.find('input').each(function(i,v){
					vs.push(parseInt($(v).val(),10));
				})
				if(vs[0]>vs[1]){
					vs=[vs[1],vs[0]];//switch
				}
				return vs;
			},
			hide:function(cb){
				var pself=this;
				pself.ele.remove();
				self.ele.find('.tray').hide();
				self.setHeight();
				if(cb) cb();
			},
			getValue:function(){
				var c=self.getFilter('age');
				if(c){
					return '<div class="filtersize">'+c[0]+'-'+c[1]+'</div>';
				}else{
					return false;
					//return '<div class="filtersize">Age</div>';
				}
			}
		},
		friends_mutual:{
			hide:function(){}//placehodler
		},
		friends:{
			show:function(renderTo){
				var pself=this;
				if(!renderTo){
					self.ele.find('.tray').show();
					renderTo=self.ele.find('.tray');
					pself.renderTo=0;
				}else{
					pself.renderTo=1;
				}
				renderTo.render({
					template:'filter_feature_friends',
					data:{
						current:self.getFilter('friends'),
						mutual:pself.getMutual()
					},
					binding:function(ele){
						pself.ele=ele;
						ele.find('.x_filtertoggle').stap(function(){
							var c=self.getFilter('friends');
							if(c){
								self.setFilter('friends');
								ele.find('.x_filtertoggle').removeClass('selected')
								ele.find('.toggler2').removeClass('selected');
							}else{
								var f=ele.find('.toggler2').first().attr('data-id');
								self.setFilter('friends',f);
								ele.find('.x_filtertoggle').addClass('selected')
								ele.find('[data-id='+f+']').addClass('selected');
							}
						},1,'tapactive')
						ele.find('.x_clear').stap(function(){
							self.setFilter('friends','');
						},1,'tapactive')
						ele.find('.rangeslider').rangeslider({
							polyfill: false,
							fillClass:'rangeslider__fill highlightnav',
							horizontalClass: 'rangeslider--horizontal normalrangeslider',
							onSlide: function(position, value) {
								ele.find('.mutual').html(value);
							},
							onSlideEnd: function(position, value) {
								if(self.getFilter('friends_mutual')!=value){
									self.setFilter('friends_mutual',value);
								}
							}
						});
						ele.find('.mutual').html(pself.getMutual());
						ele.find('.toggler2').stap(function(){
							if($(this).hasClass('selected')){
								$(this).removeClass('selected');
								//ele.find('.slider').hide();
								self.setHeight();
								self.setFilter('friends');
								ele.find('.x_filtertoggle').removeClass('selected')
							}else{
								ele.find('.toggler2').removeClass('selected');
								$(this).addClass('selected');
								// if($(this).attr('data-id')=='friends'){
								// 	ele.find('.slider').hide();
								// }
								// if($(this).attr('data-id')=='notfriends'){
								// 	ele.find('.slider').show();
								// }
								self.setFilter('friends',$(this).attr('data-id'));
								self.setHeight();
								ele.find('.x_filtertoggle').addClass('selected')
							}
						},1,'tapactive');
						if(!pself.renderTo) self.setHeight();
					}
				});
			},
			getName:function(){
				return {
					name:'Friends'
				}
			},
			getMutual:function(){
				var f=self.getFilter('friends_mutual');
				if(f) return f;
				else return 0;//default
			},
			hide:function(cb){
				var pself=this;
				pself.ele.remove();
				self.ele.find('.tray').hide();
				self.setHeight();
				if(cb) cb();
			},
			getValue:function(){
				var pself=this;
				var c=self.getFilter('friends');
				var m=self.getFilter('friends_mutual');
				if(c){
					if(m){
						return '<span style="position:relative"><i class="icon-friend-check"></i><span style="position:absolute;top:-1px;right:-3px;font-size:10px">'+pself.getMutual()+'</span></span>'
					}else{
						return '<i class="icon-friend-check"></i>'
					}
				}else{
					return false;
					//return '<i class="icon-friend-check"></i>';
				}
			}
		},
		filters:{
			show:function(){
				var pself=this;
				//get snapshot of current filter!
				self.snapshot=self.getFilter();
				opts.ele.find('.filters_showing').html('Cancel');
				opts.ele.addClass('showingfilters');
				self.filtershowing=1;
				var placement=pself.getPlacement();
				var rele=opts.ele;
				if(placement.ele){
					rele=placement.ele;
				}
				rele.render({
					template:'filter_feature_filters',
					data:{
						placement:placement,
						filters:pself.getFilters()
					},
					binding:function(ele){
						pself.ele=ele;
						if(placement.mobile){
							new modules.scroller(ele,{},{});
						}
						// ele.find('.x_filter').stap(function(){
						// 	self.showNav($(this).attr('data-type'));
						// },1,'tapactive');
						//self.setHeight();
						$.each(ele.find('.filter_container'),function(i,v){
							var e=$(v);
							self.features[e.attr('data-type')].show(e);
						})
						self.setWidth();
					}
				})
			},
			getPlacement:function(){
				if(!opts.button) return {//display regular mobile
					top:0,
					left:0,
					arrow:0,
					mobile:true
				}
				if(modules.tools.isWebLayout()){
					var w=opts.ele.width();
					var rw=w-opts.list.width();
					if(rw>330){//show on the side
						return {
							ele:opts.sidepane,
							arrow:0,
							width:320,
							sidepannel:true
						}
					}else{//overlay
						return {//figure out placement!
							top:0,
							right:0,
							width:320,
							overlay:true,
							arrow:1
						}
					}
				}else{
					return {//display regular mobile
						top:0,
						left:0,
						arrow:0,
						mobile:true
					}
				}
			},
			getFilters:function(){
				var filters=[];
				var features=self.getFeatures();
				$.each(features,function(i,v){
					if(self.features[v].getValue()){//order by this
						filters.push({
							type:v,
							name:self.features[v].getName(),
							active:1
						})
					}
					if(!self.features[v].getValue()){
						filters.push({
							type:v,
							name:self.features[v].getName(),
							active:0
						})
					}
				})
				return filters
			},
			hideCover:function(){
				opts.ele.find('.filtercoverpage').remove();
			},
			hide:function(cb){
				var pself=this;
				opts.ele.removeClass('showingfilters');
				self.ele.find('.tray').hide();
				pself.ele.remove();
				pself.hideCover();
				self.setHeight();
				self.setWidth();
				self.filtershowing=0;
				if(cb) cb();
			}
		},
		dating:{
			show:function(renderTo){
				var pself=this;
				if(!renderTo){
					self.ele.find('.tray').show();
					renderTo=self.ele.find('.tray')
				}
				renderTo.render({
					template:'filter_feature_page',
					data:{
					},
					binding:function(ele){
						pself.ele=ele;
						if(!renderTo) self.setHeight();
					}
				});
			},
			hide:function(cb){
				var pself=this;
				self.ele.find('.tray').hide();
				pself.ele.remove();
				self.setHeight();
				if(cb) cb();
			},
			getValue:function(){
				var c=self.getFilter('dating');
				if(c){
					return '<i class="icon-hashtag" style="color:green;font-weight:bold"></i>';
				}else{
					return false;
					//return '<i class="icon-dating"></i>';
				}
			}
		}
	}
	this.setWidth=function(){
		var w=20;
		if(!self.ele) return false;
		self.ele.find('.filternav').each(function(i,v){
			w+=$(v).outerWidth();
		})
		self.ele.find('.scrollcontent').css('width',w);
		self.scroller=new modules.scroller(self.ele.find('.xscroller'),{
			scrollX:true,
			scrollY:false
		})
	}
	this.setHeight=function(){
		if(opts.noHeightChange) return false;
		var h=self.ele.outerHeight()-1;
		opts.ele.css('top',h+'px');
	}
	this.init();
}