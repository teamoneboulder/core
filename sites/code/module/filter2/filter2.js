modules.filter2=function(options){
	var self=this;
	self.options=options;
	if(!options.filterOpts) options.filterOpts={}
	this.active={};
	this.features={};
	this.disabled=[];
	this.init=function(){
		if(options.locationOff){
			self.disabled.push('location');
		}
		if(options.filter){
			self.filter=self.loadFilter();
		}else{
			self.filter=self.getDefaultFilter();
		}
		if(options.extendFilter) self.filter=$.extend(true,{},self.filter,options.extendFilter)
		if(options.onFilterStart) options.onFilterStart(self.filter);
		self.disabled=(options.conf.disabled)?options.conf.disabled:[]
		options.ele.render({
			template:'filter2_search',
			data:{},
			binding:function(ele){
				self.searchele=ele;
			}
		});
		if(options.count&&options.count.ele){
			self.countEles.push(options.count.ele)
		}
		if(options.startVisible){
			if(modules.tools.isWebLayout()) self.showNav('filters');//web
			else{
				options.ele.render({
					template:'filter2_header',
					data:{
						count:0,
						inline:1
					},
					binding:function(ele){
						self.ele=ele;
						self.renderHeader(1);
					}
				});
			}
		}else if(options.button){
			options.button.render({
				template:'filter2_button',
				binding:function(ele){
					ele.stap(function(){
						if(options.container){
							//alert
							var alert=new modules.alertdelegate({
		                        display:{
		                            ele:$(this),
		                            container:options.container
		                        },
		                        disableScroll:true,
		                        width:'300px',
		                        title:'Filter Options',
		                        onHide:function(){
		                        	self.features.filters.hide();
		                        	self.features.filters.destroy();
		                        	self.cnav=false;
		                        	delete self.features.filters;
		                        },
		                        renderFunction:function(ele,pele){
		                        	self.filterContainer=ele.find('.rendercontent');
		                            self.showNav('filters');
		                        }
		                    });
		                    alert.show();
	                	}else{
							self.showNav('filters');
						}
					},1,'tapactive')
				}
			})
			self.ensureAutoPlacement();
		}else{
			if(!options.inline) options.ele.render({
				template:(options.inline)?'filter2_header_inline':'filter2_header',
				data:{
					inline:(options.inline)?1:0,
					count:(options.count)?1:0
				},
				binding:function(ele){
					self.ele=ele;
					if(options.inlineFilter) self.renderHeader(1);
					//self.initLocation();
				}
			});
			if(options.inline){
				self.showNav('filters');
			}
		}
	}
	this.destroy=function(reload){
		//if(options.ele) options.ele.children().remove();
		if(options.button) options.button.children().remove();
		if(options.sidepane) options.sidepane.children().remove();
		if(Object.keys(self.features).length){
			$.each(self.features,function(i,v){
				if(v.destroy) v.destroy();
			});
		}
		if(!reload){
			phi.destroy(self);
		}
	}
	this.updateFilter=function(){
		self.renderHeader();//will update and set proper widht
		self.setValues();
		if(options.onFilterChange) options.onFilterChange(self.getCurrentFilter());
	}
	this.setValues=function(){
		var data=self.getDisplayValues();
		if(self.ele){
			$.each(data,function(i,v){
				self.ele.find('[data-id='+i+']').html(v);
			});
		}
		self.setWidth();
	}
	this.isValidSort=function(temp){
		var c=self.getCurrentFilter();
		if(temp.sort=='closest'&&!c.location) return false;
		return true;
	}
	this.countEles=[];
	this.loadCount=function(){
		if(self.cnav!='filters') return false;
		$.each(self.countEles,function(i,v){
    		$(v).html('<i class="icon-refresh animate-spin"></i>')
    	})
    	if(self.features.filters&&self.features.filters.ele) self.features.filters.ele.scrollTop(0);
		modules.api({
            url: options.count.endpoint, 
            data:{
            	filter:self.getCurrentFilter(),
            	counts:1
            },
            callback: function(data){
                if(data.success){
                	$.each(self.countEles,function(i,v){
                		$(v).html(data.data.count)
                	});
                	//scroll to top!
                	self.features.filters.ele.scrollTop(0);
                }else{
                	$.each(self.countEles,function(i,v){
			    		$(v).html('<i class="icon-warning-sign"></i>')
			    	})
                	modules.toast({
                		icon:'icon-warning-sign',
                		content:'Error:'+data.error
                	})
                }
            }
        })
	}
	this.loadFilter=function(){
		if(options.filter){
			if(options.filter===true){
				if(self.disabled.indexOf('location')==-1) self.disabled.push('location');
				options.filter={};
			}
			if(options.filter.distance) options.filter.distance=parseInt(options.filter.distance,10);
			if(options.filter.location){
				if(options.filter.location.gps) options.filter.location.gps=true;
			}
			if(!options.filter.distance&&!options.filter&&options.noDistance){
				if(app.user.profile&&app.user.profile.options.filter.location){//share common location options.filter
					options.filter.location=$.extend(true,{},app.user.profile.options.filter.location);
				}
				if(app.user.profile&&app.user.profile.options.filter.distance){
					options.filter.distance=parseInt(app.user.profile.options.filter.distance,10);
				}
			}
			if(options.filter.age){
				options.filter.age=[parseInt(options.filter.age[0],10),parseInt(options.filter.age[1],10)]
			}
			if(options.filter.friends_mutual){
				options.filter.friends_mutual=parseInt(options.filter.friends_mutual,10);
			}
		}
		var ret=$.extend(true,{},options.filter);
		if(options.filterOpts){
			ret=$.extend(true,{},ret,options.filterOpts);
		}
		//validate all data!
		$.each(ret,function(i,v){
			var filterinfo=options.conf.list[i];
			if(!filterinfo||!filterinfo.type) return true;
			switch(filterinfo.type){
				case 'togglecheck':
					var save=[]
					$.each(v,function(ti,tv){
						if(filterinfo.types.order.indexOf(tv)>=0){
							save.push(tv);
						}else{
							console.warn('removing ['+tv+'] from togglecheck');
						}
					})
					ret[i]=save;
				break;
			}
			if(options.conf.order.indexOf(i)==-1){
				delete ret[i];//remove
				console.warn('removing no longer active field');
			}
		})
		return ret;
	}
	this.getFilter=function(type){
		if(!type){
			var ret=$.extend(true,{},self.filter);
			if(self.disabled.indexOf('location')>=0){
				if(ret.location) delete ret.location;
				if(ret.distance) delete ret.distance;
			}
			return JSON.parse(JSON.stringify(ret));
		}
		return self.filter[type];
	}
	this.renderHeader=function(load){
		if(self.ele) self.ele.find('.filtercontent').render({
			template:'filter2_content',
			append:false,
			data:{
				selected:(self.cnav)?self.cnav:'',
				options:$.extend(true,{},options,{onFilterChange:true,ele:''}),
				showHint:1,
				current:self.getDisplayValues()
			},
			binding:function(ele){
				ele.find('.x_clearfilters').stap(function(){
					self.filter={};
					self.cache();
					if(options.onFilterChange) options.onFilterChange(self.getCurrentFilter());
					self.onUpdate();
					self.renderHeader()
					self.hideNav(self.cnav);
				},1,'tapactive');
				ele.find('.filternav').stap(function(){
					if($(this).attr('data-id')) self.showNav(false,$(this).attr('data-id'));
					else self.showNav($(this).attr('data-type'));
				},1,'tapactive');
				self.setWidth();
				self.setHeight();
				if(load&&options.showFilter){
					self.showNav(options.showFilter);
				}
				if(!self.filter||!_.size(self.filter)){
					ele.find('.x_clearfilters').hide()
				}else{
					ele.find('.x_clearfilters').show()
				}
			}
		});
	}
	this.hideNav=function(nav){
		self.features[nav].hide();
		self.cnav=false;
		if(self.ele) self.ele.find('.filternav').removeClass('selected');
	}
	this.cache=function(){
		if(self.options.nocache) return false;
		var dontcache=['location','distance','category'];
		var f=$.extend(true,{},self.filter);
		$.each(dontcache,function(i,v){
			if(f[v]) delete f[v];
		})
		if(!app.user.profile) return console.warn('cache not enabled');
		if(!app.user.profile.filter) app.user.profile.filter={};
		app.user.profile.filter[self.options.type]=f;
		var data={}
		data[self.options.type]=f;
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
	this.getCurrentFilter=function(){
		var f=self.getFilter();
		if(!self.active.location&&false){
			if(f.location) delete f.location;
			if(f.distance) delete f.distance;
		}
		return f;
	}
	this.onUpdate=function(){
		if(options.count){
			self.loadCount();
		}
	}
	this.clearFilter=function(key){
		if(self.filter[key]) delete self.filter[key];
		self.cache();
		if(options.onFilterChange) options.onFilterChange(self.getCurrentFilter());
		self.onUpdate();
	}
	this.setFilter=function(key,value,external){
		if(value){
			self.filter[key]=value;
			if(options.onFilterChange) options.onFilterChange(self.getCurrentFilter());
			self.onUpdate();
			if(external){
				if(self.filtershowing&&self.features.filters){
					self.features.filters.updateUI();
				}else{
					console.warn('todo')
				}
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
		if(self.filtershowing&&options.previewCount){
			if(options.onFilterChange) options.onFilterChange(self.getCurrentFilter(),1);
		}
		if(self.filtershowing){
			if(self.hasChanged()){
				options.ele.find('.filters_showing').html('Done');
			}else{
				options.ele.find('.filters_showing').html('Cancel');
			}
		}
	}
	this.getValues=function(){
		var d={};
		$.each(options.conf.order,function(i,v){
			if(self.filter[v]) d[v]=self.filter[v];
		});
		return d;
	}
	this.getDisplayValues=function(){
		var d={};
		$.each(options.conf.order,function(i,v){
			if(self.filter[v]){
				var opts=options.conf.list[v];
				switch(opts.type){
					case 'sort':
						var cv=opts.types.list[self.filter[v]];
						d[v]=cv.display;
					break;
					case 'tag':
						if(self.filter[v].order&&self.filter[v].order.length){
							d[v]='<i class="'+opts.icon+'"></i>';
						}
					break;
					case 'range':
						d[v]=self.filter[v][0]+'-'+self.filter[v][1];
					break;
					case 'radio':
						var cv=opts.types.list[self.filter[v]];
						d[v]=cv.display;
					break;
					case 'distance':
						if(!parent.disabled||parent.disabled.indexOf('location')==-1){
							d[v]=self.filter[v]+'mi';
						}
					break;
				}
				// if(d[v]){//wrap
				// 	d[v]='<span class="filternav" data-id="'+v+'">'+d[v]+'</span>';
				// }
			}
		})
		return d;
	}
	this.getCurrent=function(id){
		return self.filter[id];
	}
	this.getDefaultFilter=function(){
		var f={};
		if(app.user.profile&&app.user.profile.filter){
			if(app.user.profile.filter[options.type]){
				f=$.extend(true,{},app.user.profile.filter[options.type]);
			}
			if(options.filterOpts&&options.filterOpts.noDistance||options.noDistance){

			}else{
				if(app.user.profile.filter.location){//share common location filter
					f.location=$.extend(true,{},app.user.profile.filter.location);
				}
				if(app.user.profile.filter.distance){
					f.distance=parseInt(app.user.profile.filter.distance,10);
				}
			}
		}
		if(options.filterOpts&&options.filterOpts.noDistance||options.noDistance){

		}else if(!f.location&&app.user.profile.city_location){
			f.location=app.user.profile.city_location;
		}
		if(f.location&&!f.distance) f.distance=50;
		if(options.clearFilters){
			$.each(options.clearFilters,function(i,v){
				if(f[v]) delete f[v];
			})
		}
		if(options.filterOpts){
			f=$.extend(true,{},f,options.filterOpts);
		}
		if(!f.sort&&options.conf.list.sort){
			f.sort=options.conf.list.sort.default
			if(!f.sort) f.sort=options.conf.list.sort.types.list[options.conf.list.sort.types.order[0]];
		}
		return f;
	}
	this.setWidth=function(){
		if(!self.ele) return false;
		var w=20;
		self.ele.find('.filternav').each(function(i,v){
			w+=$(v).outerWidth();
		})
		self.ele.find('.scrollcontent').css('width',w);
		self.scroller=new modules.scrolldelegate(self.ele.find('.xscroller'),{
			scrollX:true,
			scrollY:false
		})
	}
	this.setHeight=function(){
		if(!self.ele) return false;
		var h=self.ele.outerHeight()+1;
		options.ele.css('top',h+'px');
	}
	this.getPlacement=function(){
		if(options.inline){
			return {
				ele:options.ele
			}
		}
		if(modules.tools.isWebLayout()){
			var w=options.ele.width();
			var rw=w-options.list.width();
			if(rw>330){//show on the side
				return {
					ele:options.sidepane,
					arrow:0,
					width:320,
					sidepannel:true
				}
			}else{//overlay
				var ret={//figure out placement!
					top:0,
					right:0,
					width:320,
					inline:true,
					arrow:1
				}
				if(self.filterContainer){
					ret.ele=self.filterContainer;
				}
				return ret
			}
		}else{
			return {//display regular mobile
				inline:true,
				ele:self.filterContainer,
				mobile:true
			}
		}
	}
	this.showNav=function(nav,key){
		if(nav=='save'){
			self.promptFilter();
			return false;
		}
		var skey=(key)?key:nav;
		if(self.cnav==skey){
			self.hideNav(self.cnav);
		}else{
			if(self.cnav){
				self.features[self.cnav].hide(function(){
					self.cnav=skey;
					if(nav){
						if(!self.features[skey]) self.features[skey]=new modules['filter2_'+nav](self);
						self.features[skey].show(false);
					}else{
						var opts=self.getOpts(skey);
						if(!self.features[skey]) self.features[skey]=new modules['filter2_'+opts.type](self);
						self.features[skey].show(false,opts);
					}
				});
			}else{
				self.cnav=skey;
				if(nav){
					if(!self.features[skey]) self.features[skey]=new modules['filter2_'+nav](self);
					self.features[skey].show(false);
				}else{
					var opts=self.getOpts(skey);
					if(!self.features[skey]) self.features[skey]=new modules['filter2_'+opts.type](self);
					self.features[skey].show(false,opts);
				}
			}
			if(self.button){
				self.ele.find('.filternav').removeClass('selected');
				self.ele.find('[data-type='+skey+']').addClass('selected');
			}
		}
	}
	this.getOpts=function(id){
		if(id=='filters') return false;//filters is a meta
		return options.conf.list[id];
	}
	this.ensureAutoPlacement=function(){
		if(options.list){
			var p=self.getPlacement();
			if(p.sidepannel){
				self.showNav('filters');
				options.button.hide();
			}else{
				options.button.show();
			}
		}
	}
	this.hasChanged=function(){
		if(modules.tools.deepCompare(self.snapshot,self.getFilter())){
			return 0;
		}else{
			return 1;
		}
	}
	this.getValue=function(key){
		if(self.filter[key]) return self.filter[key];
		return false;
	}
	this.isActive=function(key){
		if(self.active[key]) return true;
		return false;
	}
	this.hide=function(){
		if(self.cnav){
    		self.features[self.cnav].hide();
			self.cnav=false;
			if(self.ele) self.ele.find('.filternav').removeClass('selected');
    	}
    	self.ensureAutoPlacement();
	}
	self.init();
}
modules.filter2_tag=function(parent){
	var self=this;
	this.updateUI=function(){
		self.renderAddSelectedTags();
	}
	this.show=function(renderTo,fopts,filters_scroller){
		self.fopts=fopts;
		if(!renderTo){
			parent.ele.find('.tray').show();
			renderTo=parent.ele.find('.tray');
			self.renderTo=false;
		}else{
			self.renderTo=renderTo;
		}
		renderTo.render({
			template:'filter2_feature_tag',
			data:{
				icon:(fopts.icon)?fopts.icon:'icon-question-mark'
			},
			binding:function(ele){
				self.ele=ele;
				var exclude=[];
				if(parent.getCurrent(fopts.id)){
					exclude=parent.getCurrent(fopts.id).order;
				}
				self.searchbar=new modules.search({
                    input:ele.find('.taginput'),
                    allowAdd:false,
                    exclude:exclude,
                    endpoint:fopts.endpoint,
                    searchEle:parent.searchele,
                    fitSearch:true,
                    fitPosition:true,
                    inline:true,
                    web_container:ele,
                    scroller:(modules.tools.isWebLayout()&&filters_scroller)?filters_scroller:0,
                    web_inline:(modules.tools.isWebLayout())?1:0,
                    getTop:function(){
                    	if(self.renderTo){
                    		return false;
                    	}else{
                    		return 0;
                    	}
                    },
                    cancelEle:ele.find('.tagcancel'),
                    renderTemplate:(fopts.renderTemplate)?fopts.renderTemplate:'modules_search_tag',
                    onKeyUp:function(val){
                        if(val==''){
                            ele.find('.tagbox').find('.tagcursor').show();
                        }else{
                            ele.find('.tagbox').find('.tagcursor').hide();
                        }
                    },
                    onSelect:function(id,item){//might want or need full item.
                        var c=parent.getCurrent(fopts.id);
                        if(!c){
                        	c={
                        		list:{},
                        		order:[]
                        	}
                        }else{
                        	c=$.extend(true,{},c);
                        }
                        c.order.push(id);
                        c.list[id]=item;
                        parent.setFilter(fopts.id,c);
                        self.renderAddSelectedTags();
                        // self.setTagHash();
                    }
                });
				self.renderAddSelectedTags();
				if(!renderTo) parent.setHeight();
			}
		});
	}
	this.renderAddSelectedTags=function(){
		var current=parent.getCurrent(self.fopts.id);
        self.ele.find('.tagrender_top').render({
            template:'filter2_tagadd',
            data:{
            	content:(self.fopts.placeholder)?self.fopts.placeholder:'search by tags',
                top:true,
                tags:(current)?current.order:[],
                tag_info:(current)?current.list:{}
            },
            append:false,
            binding:function(ele){
                ele.find('.x_remove').stap(function(){
                    var id=$(this).attr('data-id');
                    var c=parent.getCurrent(self.fopts.id);
                    c.order.splice(c.order.indexOf(id),1);
                    if(c.list[id]) delete c.list[id];
                    parent.setFilter(self.fopts.id,c);
                    //clear out
                    self.searchbar.remove(id);
                    $(this).parent().fadeOut(500,function(){
                        self.ele.find('[data-tag='+id+']').remove();
                        self.ensureTagHeight(); 
                    })
                },1,'tapactive')
            }
        })
        self.ele.find('.tagrender_bottom').render({
            template:'filter2_tagadd',
            data:{
            	content:(self.fopts.placeholder)?self.fopts.placeholder:'search by tags',
                top:false,
                tags:(current)?current.order:[],
                tag_info:(current)?current.list:{}
            },
            append:false
        })
        self.ensureTagHeight();
	}
	this.ensureTagHeight=function(){
        //set proper padding on tag input
        var p1=self.ele.find('.tagrender_bottom').find('.tagcursor').position();
        var p3={top:(p1.top),left:(p1.left+50)};
        self.ele.find('.taginput').css({paddingLeft:p3.left,paddingTop:p3.top});
        //set height
        var h=self.ele.find('.tagrender_bottom').find('.tagaddbox').outerHeight()+10;
        self.ele.find('.tagbox').css({height:h});
        if(!self.renderTo) parent.setHeight();
	}
	this.hide=function(cb){
		self.ele.remove();
		if(!self.renderTo){
			parent.ele.find('.tray').hide();
			parent.setHeight();
		}
		if(!parent.getValue(self.fopts.id)){
			parent.renderHeader();
		}
		if(cb) cb();
	}
}
modules.filter2_filters=function(parent){
	var self=this;
	self.features={};
	this.updateUI=function(){
		if(app.size(self.features)){
			$.each(self.features,function(i,v){
				if(v.updateUI) v.updateUI();
			})
		}
	}
	this.show=function(renderTo,fopts){
		self.fopts=fopts;
		parent.snapshot=parent.getFilter();
		parent.options.ele.find('.filters_showing').html('Cancel');
		parent.options.ele.addClass('showingfilters');
		parent.filtershowing=1;
		var placement=parent.getPlacement();
		var rele=parent.options.ele;
		if(placement.ele){
			rele=placement.ele;
		}
		self.count=(parent.options.count)?1:0;
		rele.render({
			template:'filter2_feature_filters',
			data:{
				count:self.count,
				inline:(parent.options.inline)?1:0,
				placement:placement,
				filters:self.getFilters()
			},
			binding:function(ele){
				self.ele=ele;
				if(self.count){
					parent.countEles.push(ele.find('.count'));
					parent.loadCount();
				}
				if(placement.mobile){
					self.tscroller=new modules.scroller(ele,{},{});
				}
				$.each(ele.find('.filter_container'),function(i,v){
					var e=$(v);
					if(!self.features[e.attr('data-id')]) self.features[e.attr('data-id')]=new modules['filter2_'+e.attr('data-type')](parent);
					self.features[e.attr('data-id')].show(e,parent.getOpts($(this).attr('data-id')),self.tscroller);
				})
				parent.setWidth();
			}
		})
	}
	this.getFilters=function(){
		var filters=[];
		$.each(parent.options.conf.order,function(i,v){
			var item=parent.getOpts(v);
			if(parent.getValue(v)){//order by this
				filters.push({
					id:v,
					type:item.type,
					active:parent.isActive(v)
				})
			}
			if(!parent.getValue(v)){
				filters.push({
					id:v,
					type:item.type,
					active:parent.isActive(v)
				})
			}
		})
		return filters
	}
	this.hide=function(cb){
		parent.options.ele.removeClass('showingfilters');
		if(parent.ele) parent.ele.find('.tray').hide();
		self.ele.remove();
		//pself.hideCover();
		parent.setHeight();
		parent.setWidth();
		parent.filtershowing=0;
		if(cb) cb();
	}
	this.destroy=function(){

	}
}
modules.filter2_toggle=function(parent){
	var self=this;
	this.show=function(renderTo,fopts,filters_scroller){
		var cv=parent.getFilter(fopts.id);
		if(!cv&&fopts.default) cv=fopts.default;
		if(!renderTo){
			parent.ele.find('.tray').show();
			renderTo=parent.ele.find('.tray');
			self.renderTo=0;
		}else{
			self.renderTo=1;
		}
		renderTo.render({
			template:'filter2_feature_toggle',
			data:{
				opts:fopts,
				types:fopts.types,
				value:cv,
				placement:parent.getPlacement()
			},
			binding:function(ele){
				self.ele=ele;
				ele.find('.toggler2').stap(function(){
					if(!$(this).hasClass('selected')){
						ele.find('.toggler2').removeClass('selected');
						$(this).addClass('selected');
						parent.setFilter(fopts.id,$(this).attr('data-filter'));
					}
				},1,'tapactive')
				if(!self.renderTo) self.setHeight();
			}
		})
	}
	this.hide=function(cb){
		self.ele.remove();
		if(parent.ele) parent.ele.find('.tray').hide();
		parent.setHeight();
		if(cb) cb();
	}
}
modules.filter2_togglecheck=function(parent){
	var self=this;
	this.show=function(renderTo,fopts,filters_scroller){
		var cv=parent.getFilter(fopts.id);
		if(!cv&&fopts.default) cv=fopts.default;
		if(!renderTo){
			parent.ele.find('.tray').show();
			renderTo=parent.ele.find('.tray');
			self.renderTo=0;
		}else{
			self.renderTo=1;
		}
		renderTo.render({
			template:'filter2_feature_togglecheck',
			data:{
				opts:fopts,
				types:fopts.types,
				value:cv,
				placement:parent.getPlacement()
			},
			binding:function(ele){
				self.ele=ele;
				ele.find('.toggler2').stap(function(){
					var c=parent.getFilter(fopts.id);
					if(!c) c=[];
					if(!$(this).hasClass('selected')){
						$(this).addClass('selected');
						if(c.indexOf($(this).attr('data-filter'))==-1) c.push($(this).attr('data-filter'));
					}else{
						var ind=c.indexOf($(this).attr('data-filter'));
						if(ind>=0) c.splice(ind,1);
						$(this).removeClass('selected');
					}
					parent.setFilter(fopts.id,c);
				},1,'tapactive')
				if(!self.renderTo) self.setHeight();
			}
		})
	}
	this.hide=function(cb){
		self.ele.remove();
		if(parent.ele) parent.ele.find('.tray').hide();
		parent.setHeight();
		if(cb) cb();
	}
}
modules.filter2_onoff=function(parent){
	var self=this;
	this.show=function(renderTo,fopts,filters_scroller){
		var cv=parent.getFilter(fopts.id);
		if(!cv&&fopts.default) cv=fopts.default;
		if(!renderTo){
			parent.ele.find('.tray').show();
			renderTo=parent.ele.find('.tray');
			self.renderTo=0;
		}else{
			self.renderTo=1;
		}
		var ukey=Math.uuid(12);
		renderTo.render({
			template:'filter2_feature_onoff',
			data:{
				button_id:ukey,
				opts:fopts,
				types:fopts.types,
				value:(cv)?1:0,
				placement:parent.getPlacement()
			},
			binding:function(ele){
				self.ele=ele;
				_ui.register(ukey,{
					onClick:function(val){
						if(val) parent.setFilter(fopts.id,val);
						else parent.clearFilter(fopts.id);
					}
				})
				if(!self.renderTo) self.setHeight();
			}
		})
	}
	this.hide=function(cb){
		self.ele.remove();
		if(parent.ele) parent.ele.find('.tray').hide();
		parent.setHeight();
		if(cb) cb();
	}
}
modules.filter2_sort=function(parent){
	var self=this;
	this.show=function(renderTo,fopts,filters_scroller){
		var cv=parent.getFilter(fopts.id);
		if(!cv&&fopts.default) cv=fopts.default;
		if(!renderTo){
			parent.ele.find('.tray').show();
			renderTo=parent.ele.find('.tray');
			self.renderTo=0;
		}else{
			self.renderTo=1;
		}
		renderTo.render({
			template:'filter2_feature_sort',
			data:{
				renderTo:self.renderTo,
				types:fopts.types,
				value:cv,
				placement:parent.getPlacement()
			},
			binding:function(ele){
				self.ele=ele;
				ele.find('.toggler2').stap(function(){
					if(!$(this).hasClass('selected')){
						var temp=$.extend(true,{},parent.filter);
						temp.sort=$(this).attr('data-filter');
						if(self.isValidSort(temp)){
							ele.find('.toggler2').removeClass('selected');
							$(this).addClass('selected');
							parent.setFilter(fopts.id,$(this).attr('data-filter'));
						}else{
							modules.toast({content:'location must be set to use this filter'})
						}
					}
				},1,'tapactive')
				if(!self.renderTo) parent.setHeight();
			}
		})
	}
	this.isValidSort=function(temp){
		var c=parent.getCurrentFilter();
		if(temp.sort=='closest'&&!c.location) return false;
		return true;
	}
	this.hide=function(cb){
		self.ele.remove();
		if(parent.ele) parent.ele.find('.tray').hide();
		parent.setHeight();
		if(cb) cb();
	}
}
modules.filter2_range=function(parent){
	var self=this;
	this.show=function(renderTo,fopts,filters_scroller){
		var cv=parent.getFilter(fopts.id);
		if(!cv&&fopts.default) cv=fopts.default;
		if(!renderTo){
			parent.ele.find('.tray').show();
			renderTo=parent.ele.find('.tray');
			self.renderTo=0;
		}else{
			self.renderTo=1;
		}
		self.min=fopts.range[0];
		self.max=fopts.range[1];
		renderTo.render({
			template:'filter2_feature_range',
			data:{
				value:cv,
				opts:fopts,
				placement:parent.getPlacement()
			},
			binding:function(ele){
				self.ele=ele;
				ele.find('input').on('input',function(){
					var vs=self.updateValues();
					ele.find('.value').html(vs[0]+'-'+vs[1]);
					self.setBar(vs);
				}).on('change',function(){
					var vs=self.updateValues();
					self.setBar(vs);
					ele.find('.value').html(vs[0]+'-'+vs[1]);
					ele.find('.x_clear').show();
					if(!renderTo) self.setHeight();
					parent.setFilter('age',vs);
					ele.find('.x_filtertoggle').addClass('selected')
				})
				ele.find('.x_filtertoggle').stap(function(){
					if(ele.find('.x_filtertoggle').hasClass('selected')){
						ele.find('.x_filtertoggle').removeClass('selected');
						parent.setFilter(fopts.id,'');
					}else{
						ele.find('.x_filtertoggle').addClass('selected');
						var vs=self.updateValues();
						parent.setFilter('age',vs);
					}
				},1,'tapactive')
				var vs=self.updateValues();
				ele.find('.value').html(vs[0]+'-'+vs[1]);
				self.setBar(vs);
				if(!self.renderTo) parent.setHeight();
			}
		})
	}
	self.updateValues=function(){
		var vs=[]
		self.ele.find('input').each(function(i,v){
			vs.push(parseInt($(v).val(),10));
		})
		if(vs[0]>vs[1]){
			vs=[vs[1],vs[0]];//switch
		}
		return vs;
	}
	this.setBar=function(vs){
		var diff=self.max-self.min;
		var t1=vs[0]-self.min;
		var t2=vs[1]-self.min;
		var p1=(t1/diff)*100;
		var p2=(t2/diff)*100;
		//ensure proper margin!
		var width=self.ele.find('.handle1').width();
		var ml1=-((width/2)+((p1-50)/50)*(width/2));
		var ml2=-((width/2)+((p2-50)/50)*(width/2));
		self.ele.find('.handle1').css({left:p1+'%',marginLeft:ml1});
		self.ele.find('.handle2').css({left:p2+'%',marginLeft:ml2});
		self.ele.find('.fillbar').css({left:p1+'%',width:(p2-p1)+'%'});
	}
	this.hide=function(cb){
		self.ele.remove();
		if(parent.ele) parent.ele.find('.tray').hide();
		parent.setHeight();
		if(cb) cb();
	}
}
modules.filter2_radio=function(parent){
	var self=this;
	this.show=function(renderTo,fopts,filters_scroller){
		var cv=parent.getFilter(fopts.id);
		if(!cv&&fopts.default) cv=fopts.default;
		if(!renderTo){
			parent.ele.find('.tray').show();
			renderTo=parent.ele.find('.tray');
			self.renderTo=0;
		}else{
			self.renderTo=1;
		}
		renderTo.render({
			template:'filter2_feature_radio',
			data:{
				types:fopts.types,
				value:cv,
				opts:fopts,
				placement:parent.getPlacement()
			},
			binding:function(ele){
				self.ele=ele;
				ele.find('.togglelayer').stap(function(){
					if($(this).hasClass('selected')){
						$(this).removeClass('selected')
						ele.find('.toggler2').removeClass('selected');
						parent.setFilter(fopts.id,'');
					}
				},1,'tapactive');
				ele.find('.toggler2').stap(function(){
					if(!$(this).hasClass('selected')){
						ele.find('.togglelayer').addClass('selected');
						ele.find('.toggler2').removeClass('selected');
						$(this).addClass('selected');
						parent.setFilter(fopts.id,$(this).attr('data-filter'));
					}
				},1,'tapactive')
				if(!self.renderTo) parent.setHeight();
			}
		})
	}
	this.hide=function(cb){
		self.ele.remove();
		if(parent.ele) parent.ele.find('.tray').hide();
		parent.setHeight();
		if(cb) cb();
	}
}
modules.filter2_distance=function(parent){
	var self=this;
	this.show=function(renderTo,fopts,filters_scroller){
		self.fopts=fopts;
		var c=parent.getFilter('distance');
		var cv=(c)?c:2;
		if(!renderTo){
			parent.ele.find('.tray').show();
			renderTo=parent.ele.find('.tray');
			self.renderTo=0;
		}else{
			self.renderTo=1;
		}
		renderTo.render({
			template:'filter2_feature_distance',
			data:{
				value:cv,
			},
			binding:function(ele){
				self.ele=ele;
				if(parent.getFilter('location')){
					ele.find('.x_clear').show();
				}else{
					ele.find('.x_clear').hide();
				}
				ele.find('.x_clear').stap(function(){
					parent.setFilter('location','');
				},1,'tapactive')
				self.locationselector=new modules.locationselector({
					ele:ele.find('.location'),
					current:parent.getFilter('location'),
					distance:parent.getFilter('distance'),
					disabled:(parent.disabled&&parent.disabled.indexOf('location')>=0)?1:0,
					enableBlank:(parent.options.enableBlankLocation)?1:0,
					clearOnDisable:true,
					onDisableToggle:function(val){
						if(val){
							if(parent.disabled.indexOf('location')==-1) parent.disabled.push('location');
						}else{
							var ind=parent.disabled.indexOf('location');
							if(ind>=0){
								parent.disabled.splice(ind,1);
							}
						}
					},
					onHeightUpdate:function(){
						parent.setHeight();
					},
					onDistanceChange:function(dist){
						parent.active.location=1;
						var ind=parent.disabled.indexOf('location');
						if(ind>=0){
							parent.disabled.splice(ind,1);
						}
						parent.setFilter('distance',dist);
						parent.setHeight();
					},
					onUpdate:function(){
						parent.updateFilter();
						parent.onUpdate();
					},
					onChange:function(latlng){
						var ind=parent.disabled.indexOf('location');
						if(ind>=0){
							parent.disabled.splice(ind,1);
						}
						parent.active.location=1;
						ele.find('.x_clear').show();
						var c=parent.getFilter('distance');
						parent.filter.distance=(c)?c:2;
						parent.setFilter('location',latlng);
						parent.setHeight();
						parent.onUpdate();
					}
				});
				if(!renderTo) parent.setHeight();
			}
		})
	}
		
	this.ensureSlider=function(){
		var pself=this;
		if(parent.getFilter('location')){
			self.ele.find('.slider').show()
		}else{
			sel.ele.find('.slider').hide()
		}
	}
	this.hide=function(cb){
		self.ele.remove();
		parent.ele.find('.tray').hide();
		parent.setHeight();
		if(cb) cb();
	}
}