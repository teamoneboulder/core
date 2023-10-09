modules.formbuilder=function(options){
	var self=this;
	self.debug=true;
	if(options.context){
		if(options.context.store._formbuilder){//restore from previous version of reload
			options.current=options.context.store._formbuilder;
			console.log('Restoring previous formbuilder data',options.current)
		}
	}
	if(!options.current) options.current={};//ensure blank object!
	self.start=$.extend(true,{},options.current);
	if(options.schema_type&&!options.schema&&app.user.schema[options.schema_type]){
		options.schema=$.extend(true,{},app.user.schema[options.schema_type]);
		options.schema.id=options.schema_type;
	}
	if(!options.schema_type&&options.schema){
		options.schema_type=options.schema.id;
	}
	if(!options.schema){
		_alert('invalid_schema ['+options.schema_type+']!');
		return false;
	}
	if(!isPhoneGap()){
		if(window.mobiscroll) mobiscroll.settings = {
		    theme: 'ios',
		    lang: 'en'
		};
	}
	this.init=function(){
		if(options.load){
			self.load();
		}else{
			self.render();
		}
	}
	this.set=function(key,val){
		options.current[key]=val;
	}
	this.getChanges=function(){
		return _.getObjectDiff(self.start,options.current);
	}
	this.load=function(reload){
		if(options.schema.id){
			var data={
	            schema:options.schema.id
	        };
	    }else if(options.schema_type){
	    	var data={
	            schema:options.schema_type
	        };
	    }
        if(options.load.opts){
        	data=$.extend(true,{},data,options.load.opts);
        }
        if(!reload) _ui.pageloader.render({theme:false,themeClass:'lds-ellipsis-black',feed:1,inline:(options.inline)?1:0,background:'white'},options.ele,1);
		modules.api({
            url:(options.load&&options.load.endpoint)?options.load.endpoint:app.sapiurl+'/module/formbuilder/load',
            data:data,
            timeout:5000,
            callback:function(resp){
               if(resp.success){
               	if(!options.load.default) options.load.default={}
               	options.current=$.extend(true,{},options.load.default,resp.current);
               	self.render();
               	if(options.onLoad) options.onLoad();
               }else{
               		//reload!
               		modules.loadError({
		                ele:options.ele,
		                error:resp.error,
		                background:'white',
		                feed:1,
		                inline:(options.inline)?1:0,
		                onRetry:function(){
		                    self.load(1);
		                }
		            })
               }
            }
        });
	}
	this.delete=function(){
		if(this.deleting) return false;
		this.deleting=true;
		modules.api({
            url:app.sapiurl+'/module/formbuilder/delete',
            data:{
                id:options.current.id,
                schema:options.schema_type
            },
            timeout:5000,
            callback:function(resp){
            	self.deleting=false;
                //$(target).find('i').addClass('icon-trash-empty').removeClass('icon-refresh animate-spin')
                if(resp.success){
                    modules.toast({
                        content:'Successfully Removed item'
                    })
                    if(options.onDelete) options.onDelete();

                }else{
                    modules.toast({
                        content:'Error: '+resp.error
                    })
                }
            }
        });
	}
	this.handleSingleLinkAction=function(field,opts,action,actionOpts){
		var d=options.schema.fields[field];
		if(!d) return console.warn('invalid data field ['+field+']');
		var ele=self.ele.find('[data-key='+field+']');
		if(self.types[d.form.type]&&self.types[d.form.type].handleAction){
			self.types[d.form.type].handleAction(ele,field,d,action,actionOpts);
		}else{
			console.warn('invalid_type');
		}
	}
	this.handleLinkAction=function(opts,action,actionOpts){
		if(opts.fields){
			if(typeof opts.fields=='object'){
				$.each(opts.fields,function(i,v){
					self.handleSingleLinkAction(v,opts,action,actionOpts);
				})
			}else{
				self.handleSingleLinkAction(opts.fields,opts,action,actionOpts);	
			}
		}else{
			self.handleSingleLinkAction(opts.field,opts,action,actionOpts);
		}
	}
	this.setPrivacy=function(e,container,target,data){
		var menu=[]
		menu.push({
			id:'public',
			name:'Anyone can <b>View</b>'
		})
		menu.push({
			id:'private',
			name:'Only those approved can <b>View</b>'
		})
		var alt=modules.alertdelegate({
            display:{
                ele:$(this),
                container:self.ele,
                locations:['topleft']
            },
            menu:menu,
            onSelect:function(id){
                //set permission!
                var item=options.schema.fields[data.privacy];
                item.id=data.privacy;
                item.currentPrivacy=id;
                _.dotSet(item.form.privacy.key,id,options.current);
                //console.log(self.ele.find('[data-privacy='+data.privacy+']'))
               	phi.render(self.ele.find('[data-privacy='+data.privacy+']'),{
        			replace:true,
        			template:'formbuilder_privacy_basic',
        			contextElement:false,
        			context:self,
        			data:{
        				item:item
        			}
        		})
            }
        })
        alt.show();
	}
	this.minimize=function(){
		if(options.context) options.context.goBack()
	}
	this.remove=function(){
		var ma=new modules.alertdelegate({
	        display:{
	            alert:{
	                content:'Delete this item?'
	            }
	        },
	        title:'Delete this item?',
	        closer:true,
	        menu:[{
	            id:'yes',
	            //icon:'icon-thumbs-up',
	            name:'Yes'
	        },{
	            id:'no',
	            //icon:'icon-ban',
	            name:'No'
	        }],
	        onEndAnimationSelect:function(id){
	            if(id=='yes'){
	               	self.delete()
	            }
	        }
	    });
	    ma.show();
	}
	this.autoSave=function(data,versionField){
		if(!options.current.id) return console.warn('Autosave disabled until first save');
		data.id=options.current.id;
		// modules.api({
  //           url:(options.endpoint)?options.endpoint:app.sapiurl+'/module/formbuilder/save',
  //           data:{
  //               current:data,
  //               schema:options.schema_type
  //           },
  //           timeout:5000,
  //           callback:function(resp){
  //               if(resp.success){
  //               	options.current[versionField]=resp.data[versionField];
  //               }
  //           }
  //       });
		console.log('autosave currently disabled.',data)
		//throttle save every 1000ms
		//update the 
	}
	this.render=function(){
		if(!self.initId&&options.current&&options.current.id){
			self.initId=options.current.id;
		}
		if(options.order&&options.schema){
			options.schema.order=options.order;//limit to what is passed
		}
		if(options.onInit) options.onInit(self.getCurrent());
		phi.render(options.ele,{
			template:(options.row)?'formbuilder_content_row':'formbuilder_content',
			append:false,
			context:self,
			data:{
				mobileLayout:(options.mobileLayout)?1:0,
				enableRequiredAsterisk:(options.enableRequiredAsterisk)?1:0,
				schema:options.schema,
				current:options.current,
				canDelete:(options.canDelete)?1:0,
				types:self.types,
				excludeFields:(options.excludeFields)?options.excludeFields:[],
				includeFields:(options.includeFields)?options.includeFields:false,
				inline:(options.inline)?1:0
			},
			binding:function(ele){
				//do bindings!
				if(options.dynamic&&!self.isWebLayout()){
					ele.addClass('force_mobile');
				}
				ele.find('.x_tooltip').stap(function(){
					var id=$(this).attr('data-id');
					var field=options.schema.fields[id];
					var menu=[];
					menu.push({
        				id:'info',
        				name:field.tooltip
        			})
	                var alt=modules.alertdelegate({
	                    display:{
	                        ele:$(this),
	                        container:self.ele,
	                        locations:['topright']
	                    },
	                    title:'About <b>'+field.name+'</b>',
	                    menu:menu,
	                    onSelect:function(id){
	                        
	                    }
	                })
	                alt.show();
				},1,'tapactive')
				self.ele=ele;
				ele.find('.x_minimize').stap(function(){
					self.minimize()
				},1,'tapactive')
				if(!options.inline){
					self.scroller=new modules.scroller(ele,{
						hasInput:true,
						hideKeyboardOnScroll:1
					},{

					});
				}
				ele.find('.formelement').each(function(i,v){
					var ele=$(v);
					var t=ele.attr('data-type');
					var k=ele.attr('data-key');
					if(self.types[t]&&self.types[t].binding){
						self.types[t].binding(ele,k,options.schema.fields[k]);
					}
				});
				if(self.getScroller()) self.getScroller().bindInputs(ele.find('textarea:not(.redactorcontent),input'));
			}
		})
	}
	this.getScroller=function(){
		if(options.inline&&options.scroller){
			return options.scroller;
		}else{
			return self.scroller;
		}
	}
	this.getCropData=function(type){
		var d={}
		switch(type){
			case 'background':
				d={
					directUpload:true,
					sizes:['small','full','background'],
					data:{
						title:'Set Background Picture',
						suggested:'1200px x 600px',
						crops:[{
							title:'Crop Background',
							width:500,
							height:250,
							cropKey:'background'
						}]
					}
				}
			break;
			case 'header':
				d={
					directUpload:true,
					sizes:['full','header'],
					data:{
						title:'Set Header',
						suggested:'1000px x 200px',
						crops:[{
							title:'Crop Header',
							width:1000,
							height:200,
							cropKey:'header'
						}]
					}
				}
			break;
			case 'square':
				d={
					directUpload:true,
					sizes:['full','square'],
					data:{
						title:'Crop Square',
						suggested:'1000px x 1000px',
						crops:[{
							title:'Crop Square',
							width:1000,
							height:1000,
							cropKey:'square'
						}]
					}
				}
			break;
			case 'profile':
				d={
					directUpload:true,
					sizes:['small','full','profile','square'],
					data:{
						title:'Set Profile Picture',
						suggested:'800px x 800px',
						crops:[{
							title:'1. Crop Portrait',
							width:200,
							height:300,
							cropKey:'profile'
						},{
							title:'2. Crop Square',
							width:200,
							height:200,
							cropKey:'square'
						}]
					}
				}
			break;
			default:
				alert('invald crop!')
			break;
		}
		if(options.webpage){
			d.onBeforeShow=function(){
                $('html,body').animate({
                      scrollTop: 0
                  }, 0,function(){

                  });
            }
            d.disableBodyScroll=true;
            d.data.webpage=true;
		}
		return d;
	};
	this.isWebLayout=function(){
		if(options.dynamic){
			if($('body').width()<500){
				return false;
			}else{
				return true;
			}
		}else{
			return modules.tools.isWebLayout();
		}
	}
	this.backgroundProcess=function(){
		// var data={
		// 	token:app.user.token,
		// 	appid:app.appid,
  //       	module:'video',
  //       	data:{
  //       		formbuilder:1,
  //       		schema:options.schema_type,
  //       		current:options.current
  //       	}
  //       }
  		var tdata={
    		formbuilder:1,
    		schema:options.schema_type,
    		current:options.current
    	}
    	this.types.video.video.process(tdata);
		// if(isPhoneGap()){
		// 	console.log(this.types.video.uri)
	 //        phone.bg_uploader.queue(this.types.video.uri,data,{
	 //        	id:Math.uuid(8)//unique id
	 //        },function(){

	 //        });
	 //    }else{
	 //    	//_alert('non phone upload')
	 //    	this.types.video.video.uploader.processUpload(data);
	 //    }
	}
	this.shouldUploadVideo=function(){
		if(this.types.video.hasBackgroundUpload()) return true;
		return false;
	}
	this.canSave=function(){//might return false if uploading
		var toreturn=true;
		$.each(this.types,function(i,v){
			if(v.isUploading&&v.isUploading()){
				toreturn=false;
				modules.toast({
					content:'Please wait for the file to finish uploading.'
				})
			}
		})
		return toreturn;
	}
	this.save=function(cb,onSuccess){
		if(self.saving) return console.warn('Saving Already');
		self.saving=true;
		if(cb) cb(0);
		if(!options.endpoint&&!options.schema_type){
			_alert('schema_type not set');
		}
		if(self.shouldUploadVideo()){
			_alert('should upload video')
		}else{
			modules.api({
	            url:(options.endpoint)?options.endpoint:app.sapiurl+'/module/formbuilder/save',
	            data:{
	                current:self.getCurrent(),
	                schema:options.schema_type,
	                timezone:_.getTimeZone()
	            },
	            timeout:5000,
	            callback:function(resp){
	                if(cb) cb(1);
	                self.saving=0;
	                if(resp.success){
	                	self.updated=0
	                    if(onSuccess) onSuccess(resp);
	                }else{
	                    modules.toast({
	                        content:self.getError(resp),
	                        remove:2500,
	                        icon:'icon-warning-sign'
	                    });
	                }
	            }
	        });
		}
	}
	this.getError=function(data){
        return modules.formbuilder_global.getError(data);
    }
    this.getEndpoint=function(endpoint,formOpts){
    	var replace={
    		'[apiurl2]':app.apiurl2,
    		'[apiurl]':app.sapiurl
    	}
    	if(formOpts&&formOpts.endpointData){
    		$.each(formOpts.endpointData,function(i,v){
    			replace['['+v+']']=options.current[v];
    		})
    	}
    	$.each(replace,function(i,v){
    		endpoint=endpoint.replace(i,v);
    	})
    	return endpoint;
    }
    this.getCurrent=function(){
    	if(!options.current) options.current={};
    	var tc=$.extend(true,{},options.current);
    	if(options.order){
    		var td={}
    		$.each(options.order,function(i,v){
    			td[v]=tc[v];
    		})
    		tc=td;
    	}
    	if(options.includeFields&&options.limitReturn){//only return fields we are editing
    		var td={}
    		$.each(options.includeFields,function(i,v){
    			td[v]=tc[v];
    		})
    		if(tc.id) td.id=tc.id;
    		tc=td;
    	}
    	if(options.excludeFields&&options.excludeFields.length){
    		$.each(options.excludeFields,function(i,v){
    			if(tc[v]||tc[v]===''||tc[v]===false) delete tc[v];
    		})
    	}
    	$.each(tc,function(i,v){
    		if(v&&typeof v=='object'){
	    		if(v.length===0) tc[i]=[false];//blank array, clear it out!
	    		if(typeof v.length=='undefined'&&_.size(v)==0){
	    			tc[i]=false;
	    		}
	    	}
    	})
    	//console.log(tc)
    	return tc;
    }
    this.hasEdit=function(){
    	if(self.updated) return true;
    	return false;
    }
	this.onUpdate=function(){
		if(options.onUpdate) options.onUpdate(options.current);
		if(options.context){
			options.context.store._formbuilder=options.current;
		}
		self.updated=1
	}
	this.getMissingError=function(){
		var missing=self.getMissing();
		if(missing.length){
			var error={}
			error['Missing Data']=[];
			$.each(missing,function(i,v){
				var field=options.schema.fields[v];
				error['Missing Data'].push(field);
			})
			return self.getError({error:error});
		}else{
			return '';
		}
	}
	this.getMissing=function(){
		var required=[];
		var exclude=(options.excludeFields)?options.excludeFields:[];
		$.each(options.schema.fields,function(i,v){
			var hidden=(v.form&&v.form.type&&v.form.type=='hidden')?1:0;
			if(v.required&&i!='id'&&exclude.indexOf(i)==-1&&!hidden) required.push(i);
		});
		if(required.length){
			var rc=0;
			var missing=[];
			//console.log(required,options.current)
			$.each(required,function(i,v){
				if(typeof options.current[v]!='undefined') rc++;
				else missing.push(v);
			})
			if(rc==required.length) return [];
			else return missing;
		}else return [];
	}
	this.inputLoading=function(){
		self.inputSubmit=self.iele.find('.x_set').html();
		self.iele.find('.x_set').html('<i class="icon-refresh animate-spin"></i>');
	}
	this.inputDone=function(){
		self.iele.find('.x_set').html(self.inputSubmit);
	}
	this.showInput=function(cele,opts,render,set,clear){
		if(modules.keyboard_global) modules.keyboard_global.hide();
		self.hasInput=true;
		if(self.isWebLayout()){
			if(self.inputarea) self.inputarea.destroy();//clear out previous one
			self.inputarea=new modules.webcontext({
				template:'formbuilder_input_page_web',
				opts:opts,
				binding:function(ele){
					self.iele=ele;
					ele.find('.x_closer').stap(function(){
						self.inputarea.destroy();
						self.hideInput();
					},1,'tapactive')
					ele.find('.x_clear').stap(function(){
						if(clear){
							clear(ele,function(){
								self.inputarea.destroy();
								self.hideInput();
							})
						}else{
							console.warn('no clear section set')
						}
					},1,'tapactive');
					ele.find('.x_set').stap(function(){
						set(ele,function(){
							self.inputarea.destroy();
							self.hideInput();
						});
					},1,'tapactive')
					render(ele.find('.inputarea'));
				},
				disableMouseOff:true,
				width:(opts.width)?opts.width:'',
				display:{
					ele:cele.find('.formbuilder_contentarea'),
					container:self.ele,
					offset:{
						left:(options.mobileLayout)?0:130
					},
					locations:['topleftmatch']
				}
			})
			self.inputarea.show();
		}else{
			opts.fixed=0;
			if(options.fixed) opts.fixed=1;
			$('body').render({
				template:'formbuilder_input_page',
				data:opts,
				binding:function(ele){
					self.iele=ele;
					ele.find('.x_closer').stap(function(){
						self.hideInput();
					},1,'tapactive')
					ele.find('.x_set').stap(function(){
						set(ele,function(){
							self.hideInput();
						});
					},1,'tapactive')
					ele.find('.x_clear').stap(function(){
						if(clear){
							clear(ele,function(){
								self.hideInput();
							})
						}else{
							console.warn('no clear section set')
						}
					},1,'tapactive');
					if(window.Draggable) self.dragger=Draggable.create(ele.find('.swiper'), {
				        type:"y",
				        bounds:{minX:0,maxX:0,minY:0,maxY:300},
				        lockAxis:true,
				        throwProps:true,
				        force3D:true,
				        cursor:'defualt',
				        edgeResistance:1,
				        onDrag:function(){
				        	TweenLite.set(ele.find('.swiper'),{y:0});
				        	TweenLite.set(ele.find('.pane'),{y:this.y});
				        },
				        onDragStart:function(e){
				        },
				        onDragEnd:function(e) {
				        	if(this.endY>80){
				        		self.hideInput();
				        	}else{
				        		TweenLite.to(ele.find('.pane'),.3,{y:0});
				        	}
				        }
				    });
				    var hideviews=[];
				    if(modules.keyboard_global) modules.keyboard_global.overrides={
						onKeyboardWillShow:function(h){
							if(hideviews.indexOf(options.type)>=0) self.iele.addClass('condense')
							TweenLite.to(self.iele.find('.content'),.3,{bottom:h})
						},
						onKeyboardWillHide:function(){
							if(hideviews.indexOf(options.type)>=0) self.iele.removeClass('condense')
							TweenLite.to(self.iele.find('.content'),.3,{bottom:0})
						}
					}
				    TweenLite.set(ele.find('.pane'),{y:'100%'})
				    //render
				    render(ele.find('.inputarea'));
					setTimeout(function(){
						TweenLite.to(ele,.3,{background:'rgba(55,55,55,.3)'})
						TweenLite.to(ele.find('.pane'),.3,{y:'0%'})
					},50)
				}
			})
		}
	}
	this.hideInput=function(){
		self.hasInput=false;
		if(self.isWebLayout()){
			self.destroyInput();
		}else{
			if(modules.keyboard_global) modules.keyboard_global.hide();
			setTimeout(function(){
				TweenLite.to(self.iele,.5,{background:'rgba(55,55,55,0)'})
				if(modules.keyboard_global) modules.keyboard_global.overrides=false;//clear out overrides
				TweenLite.to(self.iele.find('.pane'),.5,{y:'100%',onComplete:function(){
					setTimeout(function(){
						self.destroyInput();
					},50);
				}})
			},50)
		}
	}
	this.destroyInput=function(){
		if(self.dragger) self.dragger[0].kill();
		self.iele.remove();
	}
	this.modules={};
	this.destroy=function(){
		if(self.hasInput) self.hideInput();
		if(app.size(self.modules)){
			$.each(self.modules,function(i,v){
				v.destroy();
			})
		}
		console.warn('Finish');
	}
	this.types={
		id:{
			render:function(key,opts){
				var pself=this;
				return $.fn.render({//return template
					returntemplate:true,
					template:(opts.template)?opts.template:'formbuilder_id',
					data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
				})
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			binding:function(ele,key){
				
			}
		},
		int:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_int',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_int',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]||options.current[key]===0) return parseInt(options.current[key],10);
				if(opts.form.default){
					options.current[key]=opts.form.default;
					self.onUpdate();
					return opts.form.default;
				}
				return '';//best guess default!
			},
			renderNumpad:function(ele,key,opts){
				var pself=this;
				pself.curinstance=ele.mobiscroll().numpad({ 
		            theme: mobiscroll.settings.theme,
		            preset: 'decimal',
		            scale:0,
		            display:'inline',
		            min: (opts.form.min)?opts.form.min:1,
		            max: (opts.form.max)?opts.form.max:1000,
		           	deleteIcon:'',
		            prefix: '',
		            onClose:function(){
		               
		            }
		        });
		        //add back button
		        ele.append('<div class="x_delete" style="text-align:center;position:absolute;bottom:5px;right:0px;width:33%;padding:10px;z-index:99999" class="truebox"><i class="icon-level-up" style="font-size:30px;color:black"></i></div>')
		        ele.find('.x_delete').stap(function(){
		            var cv=ele.mobiscroll('getArrayVal');
		            if(cv&&cv.length){
		                cv.splice(cv.length-1,1);
		                ele.mobiscroll('setVal',cv);
		            }
		        },1,'tapactive')
		        var current=pself.getCurrent(key,opts);
		        if(current){
		        	ele.mobiscroll('setVal',current);
		        }
			},
			validate:function(key,opts,val,cb){
				var val=parseInt(val,10);
				var pass=0;
				if(opts.form.min){
					if(val>=opts.form.min) pass++
				}else pass++;
				if(opts.form.max){
					if(val<=opts.form.max) pass++;
					if(val>opts.form.max){
						pass++;
						val=opts.form.max;
					}
				}else pass++;
				cb(val,(pass==2)?1:0);
			},
			binding:function(ele,key,opts){
				var pself=this;
				if(_.isWebLayout()){
					ele.find('.enterint').on('keydown keyup change',function(){
						var tv=$(this).val();
						var nv=tv.replace(/[^\d-]/g,'');
						if(tv!=nv) $(this).val(nv);
						var te=$(this);
						if(nv){
							pself.validate(key,opts,nv,function(tval,pass){
								te.val(tval);
								if(pass){
									options.current[key]=tval;
									self.onUpdate();
								}
							});
						}
					})
				}else{
					ele.stap(function(){
						self.showInput(ele,{
							title:opts.form.placeholder
						},function(tele){
							pself.renderNumpad(tele,key,opts);
						},function(tele,cb){
							var cv=tele.find('.inputarea').mobiscroll('getArrayVal');
							if(cv){
								var tval=parseInt(cv.join(''),10);
							}else{
								var tval='';
							}
							options.current[key]=tval;
							self.onUpdate();
							pself.render(key,opts,1);
							cb();
						})
					},1,'tapactive')
				}
			}
		},
		birthday:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_birthday',
						data:$.extend(true,{},opts,{webLayout:modules.tools.isWebLayout(),current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_birthday',
						data:$.extend(true,{},opts,{webLayout:modules.tools.isWebLayout(),current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return {};//best guess default!
			},
			inputs:{},
			binding:function(ele,key,opts){
				var pself=this;
				pself.inputs[key]=new modules.input({
					ele:ele.find('.birthday'),
					container:ele,
					title:'Birthday',
					type:'birthday',
					noperms:true,
					data:pself.getCurrent(key,opts),
					onSet:function(data){
						options.current[key]=data;
						if(_.size(data)){
							ele.addClass('hasvalue');
						}else{
							ele.removeClass('hasvalue');
						}
						self.onUpdate();
						//self.render(key,opts,1);
					}
				})
				if(_.size(pself.getCurrent(key,opts))){
					ele.addClass('hasvalue');
				}else{
					ele.removeClass('hasvalue');
				}
			}
		},
		points:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_points',
						data:$.extend(true,{},opts,{webLayout:modules.tools.isWebLayout(),current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_points',
						data:$.extend(true,{},opts,{webLayout:modules.tools.isWebLayout(),current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return parseInt(options.current[key],10);
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			renderNumpad:function(ele,key,opts){
				var pself=this;
				pself.curinstance=ele.mobiscroll().numpad({ 
		            theme: mobiscroll.settings.theme,
		            preset: 'decimal',
		            scale:0,
		            display:'inline',
		            min: 1,
		            max: 1000,
		           	deleteIcon:'',
		            prefix: ' ',
		            onClose:function(){
		               
		            }
		        });
		        //add back button
		        ele.append('<div class="x_delete" style="text-align:center;position:absolute;bottom:5px;right:0px;width:33%;padding:10px;z-index:99999" class="truebox"><i class="icon-level-up" style="font-size:30px;color:black"></i></div>')
		        ele.find('.x_delete').stap(function(){
		            var cv=ele.mobiscroll('getArrayVal');
		            if(cv&&cv.length){
		                cv.splice(cv.length-1,1);
		                ele.mobiscroll('setVal',cv);
		            }
		        },1,'tapactive')
		        var current=pself.getCurrent(key,opts);
		        if(current){
		        	ele.mobiscroll('setVal',current);
		        }
			},
			format:function(ele,key,opts,set){
				var te=ele.find('textarea');
				if(set){
					var cv=set;
				}else{
					var cv=te.val();
				}
		      	var max=(opts.form.max)?opts.form.max:1000;
		      	if(cv>max) cv=max;
		      	var nv=cv+'';
		      	nv=nv.replace(/\D+/g, '');
		      	te.val(nv);
		      	nv=parseFloat(nv);
		      	var sv=parseInt(nv);
		      	options.current[key]=sv;
		      	self.onUpdate();
			},
			binding:function(ele,key,opts){
				var pself=this;
				if(!_.isWebLayout()){
					ele.find('.selectpoint').stap(function(e){
						var val=$(this).attr('data-val');
						if(val!='custom'){
							phi.stop(e);
							options.current[key]=parseFloat(val);
							self.onUpdate();
							pself.render(key,opts,1);
						}
					},1,'tapactive');
					ele.stap(function(){
						self.showInput(ele,{
							title:opts.form.placeholder
						},function(tele){
							pself.renderNumpad(tele,key,opts);
						},function(tele,cb){
							var cv=tele.find('.inputarea').mobiscroll('getArrayVal');
							if(cv){
								options.current[key]=parseFloat(cv.join(''));
							}else{
								if(options.current[key]) delete options.current[key];
							}
							self.onUpdate();
							pself.render(key,opts,1);
							cb();
						})
					},1,'tapactive')
				}else{//bind textarea! formatting
					ele.find('.selectpoint').stap(function(e){
						var val=$(this).attr('data-val');
						if(val!='custom'){
							phi.stop(e);
							options.current[key]=parseFloat(val);
							self.onUpdate();
							pself.render(key,opts,1);
						}
					},1,'tapactive');
					pself.format(ele,key,opts,pself.getCurrent(key,opts));
					ele.find('textarea').on('keyup input change',function(){
						pself.format(ele,key,opts);
					})
				}
			}
		},
		payment:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_payment',
						data:$.extend(true,{},opts,{webLayout:modules.tools.isWebLayout(),current:pself.getCurrent(key,opts),key:key},{methods:pself.data}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_payment',
						data:$.extend(true,{},opts,{webLayout:modules.tools.isWebLayout(),current:pself.getCurrent(key,opts),key:key},{methods:pself.data})
					})
				}
			},
			getCurrent:function(key,opts){
				//oif(pself.data)
				if(options.current[key]) return options.current[key];
				return '';//best guess default!
			},
			load:function(key,opts,cb){
				var pself=this;
				modules.api({
					url:app.sapiurl+'/user/bankmethods',
					callback:function(data){
						pself.data=data;
						if(!options.current[key]&&pself.data.data.usd.default_source){
							options.current[key]={
								type:'usd',
								data:{
									card:pself.data.data.usd.default_source
								}
							}
							self.onUpdate()
						}
						pself.render(key,opts,1);
					}
				})
			},
			binding:function(ele,key,opts){
				var pself=this;
				if(!pself.data) pself.load(key,opts);
				ele.find('.x_addcard').stap(function(){
					phi.registerView('edit_card',{
						renderTo:$('body')[0],
						_forceShowOpts:{
							display:(_.isWebLayout())?'page_overlay_web':'page_overlay'
						},
						onSuccess:function(data){
							pself.data={
								success:true,
								data:{
									usd:{
										methods:data.cards.data,
										default_source:data.cards.default_source
									}
								}
							}
							if(!options.current[key]&&pself.data.data.usd.default_source){
								options.current[key]={
									type:'usd',
									data:{
										card:pself.data.data.usd.default_source
									}
								}
								self.onUpdate()
							}
							pself.render(key,opts,1);
						}
					})
				},1,'tapactive');
				ele.find('.cardmethod').stap(function(){
					ele.find('.cardmethod').removeClass('checked');
					$(this).addClass('checked');
					options.current[key]={
						type:'usd',
						data:{
							card:$(this).attr('data-id')
						}
					}
					self.onUpdate()
				},1,'tapactive')
			}
		},
		color:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_color',
						data:$.extend(true,{},opts,{webLayout:modules.tools.isWebLayout(),current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_color',
						data:$.extend(true,{},opts,{webLayout:modules.tools.isWebLayout(),current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default){
					options.current[key]=opts.form.default;
					self.onUpdate()
					return opts.form.default;
				}
				options.current[key]="#f00";
				self.onUpdate()
				return "#f00";//best guess default!
			},
			binding:function(ele,key,opts){
				var pself=this;
				//ele.find('.colorpicker');
				var colorPicker = new iro.ColorPicker(ele.find('.colorpicker')[0],{
				  width: 140,
				  color: pself.getCurrent(key,opts)
				});
				ele.find('.colorpicker').after('<div class="colorsetarea"><input type="text" style="padding:5px 5px 20px 5px;margin-top:5px;border:1px solid #ccc;display:inline-block;width:100px" class="s-corner-all x_hexcolor keepborder enterint"><span class="x_set s-corner-all" style="margin-left:5px;padding:2px 5px;border:1px solid #ccc;font-size:14px;display:none;">Set By Hex</span></div>')
				ele.find('.colorsetarea').find('input').val(pself.getCurrent(key,opts)).on('keyup',function(){
					ele.find('.colorsetarea').find('.x_set').show()
				});
				ele.find('.colorsetarea').find('.x_set').stap(function(){
					var c=ele.find('.colorsetarea').find('input').val();
					ele.find('.colorsetarea').find('.x_set').hide();
					colorPicker.color.set(c);
					//colorPicker.setActiveColor(c);
				},1,'tapactive');
				colorPicker.on('color:change', function(color) {
				  // log the current color as a HEX string
				  //console.log(color.hexString);
				  options.current[key]=color.hexString
				  ele.find('.colorsetarea').find('.x_set').hide();
				  ele.find('.colorsetarea').find('input').val(color.hexString);
				  self.onUpdate();
				});
			}
		},
		money:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_money',
						data:$.extend(true,{},opts,{webLayout:modules.tools.isWebLayout(),current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_money',
						data:$.extend(true,{},opts,{webLayout:modules.tools.isWebLayout(),current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return parseInt(options.current[key],10);
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			renderNumpad:function(ele,key,opts){
				var pself=this;
				var max=(opts.form.max)?opts.form.max:100000;
				pself.curinstance=ele.mobiscroll().numpad({ 
		            theme: mobiscroll.settings.theme,
		            preset: 'decimal',
		            scale:2,
		            display:'inline',
		            min: 1,
		            max: max,
		           	//deleteIcon:'',
		            prefix: '$',
		            onClose:function(){
		               
		            }
		        });
		        //add back button
		        //ele.append('<div class="x_delete" style="text-align:center;position:absolute;bottom:5px;right:0px;width:33%;padding:10px;z-index:99999" class="truebox"><i class="icon-level-up" style="font-size:30px;color:black"></i></div>')
		        // ele.find('.x_delete').stap(function(){
		        //     var cv=ele.mobiscroll('getArrayVal');
		        //     if(cv&&cv.length){
		        //         cv.splice(cv.length-1,1);
		        //         ele.mobiscroll('setVal',cv);
		        //     }
		        // },1,'tapactive')
		        var current=pself.getCurrent(key,opts);
		        if(current){
		        	ele.mobiscroll('setVal',modules.tools.toMoney(current));
		        }
			},
			format:function(ele,key,opts,set){
				var te=ele.find('textarea');
				if(set){
					var cv=set/100;
				}else{
					var cv=te.val();
				}
		      	var nv=cv.toMoney()+'';
		      	var max=(opts.form.max)?opts.form.max:100000;
		      	if(cv.toMoney(1)>max) nv=max;
		      	te.val(nv);
		      	nv=parseFloat(nv);
		      	var sv=parseInt(nv*100);
		      	options.current[key]=sv;
		      	self.onUpdate();
			},
			binding:function(ele,key,opts){
				var pself=this;
				if(!modules.tools.isWebLayout()){
					ele.stap(function(){
						self.showInput(ele,{
							title:opts.form.placeholder
						},function(tele){
							pself.renderNumpad(tele,key,opts);
						},function(tele,cb){
							var cv=tele.find('.inputarea').mobiscroll('getArrayVal');
							if(cv){
								options.current[key]=parseFloat(cv.join(''));
							}else{
								if(options.current[key]) delete options.current[key];
							}
							self.onUpdate();
							pself.render(key,opts,1);
							cb();
						})
					},1,'tapactive')
				}else{//bind textarea! formatting
					pself.format(ele,key,opts,pself.getCurrent(key,opts));
					ele.find('textarea').on('keyup input change',function(){
						pself.format(ele,key,opts);
					})
				}
			}
		},
		ticket:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_ticket',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_ticket',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return {};//best guess default!
			},
			ensureVisibility:function(ele,key,opts){
				var pself=this;
				var current=pself.getCurrent(key,opts);
				if(current.type&&current.type!='none'){
					if(current.type=='hosted'){
						ele.find('.x_select_type').hide()
						ele.find('.enterurl').hide()
						ele.find('.hostededit').show();
						// if(current.tickets&&current.tickets.order&&current.tickets.order.length){
						// 	ele.find('.x_clearnectar').hide();
						// }else{
						// 	ele.find('.x_clearnectar').show();
						// }
					}
					if(current.type=='external'){
						ele.find('.x_select_type').hide()
						ele.find('.enterurl').show()
						ele.find('.hostededit').hide();
					}
				}else{
					ele.find('.x_select_type').show()
					ele.find('.enterurl').hide()
					ele.find('.hostededit').hide();
				}
			},
			tempId:function(){
				return 'TEMP-'+Math.uuid(20);
			},
			editTicket:function(key,opts,current_id){
				var pself=this;
				var c=pself.getCurrent(key,opts);
				if(current_id&&c.tickets&&c.tickets.list&&c.tickets.list[current_id]){
					var current=$.extend(true,{},c.tickets.list[current_id]);
				}else{
					var current={};
				}
				options.addPage.showSubpage({
					name:'Edit Ticket',
					onPageReady:function(ele,onBack){
						pself.form=new modules.formbuilder({
		                    ele:ele.find('.content'),
		                    current:current,//passed as a refernce
		                    schema:$.extend(true,{},app.user.schema.ticket),
		                    onUpdate:function(current){
		                    	//self.onUpdate();
		                    }
		                });
						ele.find('.x_done').stap(function(){
							onBack();
						},1,'tapactive');
						ele.find('.x_add').stap(function(){
							var missing=pself.form.getMissing();
							if(!missing.length){
								var c=pself.form.getCurrent();
								if(!c.id) c.id=pself.tempId();//ensure id if only temp
								//set changes!
								var cfield=pself.getCurrent(key,opts);
								if(!cfield.tickets) cfield.tickets={
									order:[],
									list:{}
								}
								if(cfield.tickets.order.indexOf(c.id)==-1) cfield.tickets.order.push(c.id);
								cfield.tickets.list[c.id]=c;
								options.current[key]=cfield;
								self.onUpdate();
								pself.render(key,opts,1);
								onBack();
							}else{
								modules.toast({
									content:'Missing Fields '+JSON.stringify(missing)
								})
							}
						},1,'tapactive');
					}
				});
			},
			renderWebsite:function(oele,key,opts){
				var pself=this;
				var current=pself.getCurrent(key,opts);
				oele.render({
		            template:'formbuilder_url_input_ticket',
		            data:{
		            	current:current,
		            	name:'Ticket URL'
		            },
		            binding:function(ele){
		            	pself.ele=ele;
		            	ele.find('input').on('keyup paste',function(){
		            		ele.find('.x_error').html('').hide();
		            	})
		            }
		        });
			},
			getInputVal:function(){
				var pself=this;
				return pself.ele.find('input').val();
			},
			validate:function(val,cb){
				var pself=this;
				self.inputLoading();
				modules.api({
		            url:app.sapiurl+'/module/links/validate',
		            data:{
		            	url:val
		            },
		            success:function(resp){
		                self.inputDone();
		                if(resp.valid){
		                	cb(true);
		                }else{
		                	pself.invalid(cb);
		                }
		            }
		        });
			},
			invalid:function(cb){
				var pself=this;
				pself.ele.find('.x_error').show();
				pself.ele.find('.x_error').render({
					template:'formbuilder_url_error',
					append:false,
					binding:function(ele){
						ele.find('.x_continue').stap(function(){
							cb(false);
						},1,'tapactive')
					}
				})
			},
			binding:function(ele,key,opts){
				var pself=this;
				ele.find('.x_hosted').stap(function(){
					var current=pself.getCurrent(key,opts);
					current.type='hosted';
					options.current[key]=current;
					self.onUpdate();
					pself.ensureVisibility(ele,key,opts);
				},1,'tapactive');
				ele.find('.x_external').stap(function(){
					var current=pself.getCurrent(key,opts);
					current.type='external';
					options.current[key]=current;
					self.onUpdate();
					pself.ensureVisibility(ele,key,opts);
				},1,'tapactive');
				ele.find('.x_addticket').stap(function(){
					pself.editTicket(key,opts,'');
				},1,'tapactive')
				ele.find('.x_edit').stap(function(){
					var c=pself.getCurrent(key,opts);
					var id=$(this).attr('data-id');
					if(id){
						pself.editTicket(key,opts,id);
					}else{
						console.warn('cant edit');
					}
				},1,'tapactive');
				ele.find('.urlarea').stap(function(){
					if(modules.keyboard_global) modules.keyboard_global.hide();
					self.showInput(ele,{
						title:opts.name
					},function(ele){
						pself.renderWebsite(ele,key,opts);
					},function(ele,cb){
						var d=pself.getInputVal();
						if(opts.form.validate){
							if(d){
								pself.validate(d,function(isValid){
									if(isValid){
										options.current[key].url=d;
										self.onUpdate();
										pself.render(key,opts,1);
										cb();
									}else{
										options.current[key].url=d;
										if(!options.current._validateOpts) options.current._validateOpts={};
										options.current._validateOpts[key]={
											dontCheckURL:1
										}
										pself.render(key,opts,1);
										cb();
									}
								});
							}else{
								cb();
							}
						}else{
							options.current[key].url=d;
							self.onUpdate();
							pself.render(key,opts,1);
							cb();
						}
					})
				},1,'tapactive');
				ele.find('.x_clear').stap(function(){
					//confirm!?
					options.current[key]={
						type:'none'
					};
					self.onUpdate();
					pself.ensureVisibility(ele,key,opts);
				},1,'tapactive');
				pself.ensureVisibility(ele,key,opts);
			}
		},
		hidden:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_hidden',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_hidden',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			binding:function(ele,key,opts){
				var pself=this;
				pself.setToggleState(key,opts);
			},
			setToggleState:function(key,opts){
				var pself=this;
				if(opts.form.toggle){
					var current=pself.getCurrent(key,opts);
					if(current){
						var t=opts.form.toggle[current];
						if(t){
							if(t.on.length){
								$.each(t.on,function(i,v){
									self.ele.find('[data-key='+v+']').show();
									self.ele.find('[data-group='+v+']').show();
								})
							}
							if(t.off.length){
								$.each(t.off,function(i,v){
									self.ele.find('[data-key='+v+']').hide();
									self.ele.find('[data-group='+v+']').hide();
								})
							}
						}
					}else{
						var t=opts.form.toggle.default;
						if(t){
							if(t.on.length){
								$.each(t.on,function(i,v){
									self.ele.find('[data-key='+v+']').show();
									self.ele.find('[data-group='+v+']').show();
								})
							}
							if(t.off.length){
								$.each(t.off,function(i,v){
									self.ele.find('[data-key='+v+']').hide();
									self.ele.find('[data-group='+v+']').hide();
								})
							}
						}
					}
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default||opts.form.default===0){
					options.current[key]=opts.form.default;
					self.onUpdate();
					return opts.form.default;
				}
				return '';//best guess default!
			}
		},
		linked:{
			render:function(){
				return '';
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
		},
		text:{
			render:function(key,opts){
				var pself=this;
				return $.fn.render({//return template
					returntemplate:true,
					template:(opts.template)?opts.template:'formbuilder_text',
					data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
				})
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			binding:function(ele,key){
				ele.find('input').on('keyup input paste',function(){
					options.current[key]=$(this).val();
					self.onUpdate();
				})
			}
		},
		media:{
			render:function(key,opts){
				var pself=this;
				return $.fn.render({//return template
					returntemplate:true,
					template:(opts.template)?opts.template:'formbuilder_media',
					data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
				})
			},
			isProcessing:function(){
				var count=0;
				$.each(this.bindings,function(i,v){
					if(v.isProcessing&&v.isProcessing()) count++;
				})
				return count;
			},
			bindings:{},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				return {
					list:{},
					order:[]
				};//best guess default!
			},
			binding:function(ele,key,opts){
				var pself=this;
				ele.find('.x_remove').stap(function(e){
					phi.stop(e);
	                var tid=$(this).attr('data-id');
	                $(this).parent().fadeOut(500,function(){
	                    $(this).remove()
                        //self.setImgWidth();
	                    pself.removeItem(key,opts,tid);
	                })
				},1,'tapactive');
				pself.bindings[key+'_multiimage']=new modules.multiimage({
		            ele:ele.find('.x_addphotos'),
		            data:{
		                sizes:['full','small'],
		                path:'/img/'
		            },
		            onPreviewReady:function(data,obj){//render preview
		                pself.renderPreviewImage(key,opts,ele,obj.id,data);
		            },
		            onProcessStart:function(fileobj,clearcb){
		                // self.filestats[fileobj.id].status='uploading';
		                // self.filestats[fileobj.id].clearcb=clearcb;
		            },
		            onProgress:function(p,obj){
		                pself.setUploadProgress(ele,obj.id,p);
		            },
		            // onClick:function(){
		            //     //if(!app.onlyMembers()) return false;
		            //     self.clearSearch();
		            //     self.ensureFocus();
		            // },
		            onError:function(obj){
		                pself.setUploadProgress(self.keyboardele,obj.id,-1);
		                modules.toast({
		                    content:'Error Processing Image',
		                    remove:2500,
		                    icon:'icon-warning-sign'
		                });
		            },
		            onSuccess:function(data,resp,obj){
		                pself.setUploadProgress(ele,obj.id,100,1);
		                var img={
		                    path:resp.path,
		                    ext:resp.ext,
		                    ar:resp.ar,
		                    process:1,
		                    type:'images'
		                };
		                pself.addItem(key,opts,obj.id,img);                
		            }
		        })
			},
			renderPreviewImage:function(key,opts,ele,id,img,edit){
		        if(edit) this.addItem(key,opts,id,img);
		        else this.addItem(key,opts,id);
		        //self.setHeight();
		        //ability to upload
		    	ele.find('.mediatray').render({
			        template:'formbuilder_previewimg',
			        //prepend:true,
			        data:{
			            id:id,
		                editing:(edit)?0:1
			            //img:(edit)?modules.tools.getImg(img,'small'):img
			        },
			        binding:function(tele){
		                tele.find('.previewimg').on('load',function(){
		                    //self.setImgWidth();
		                });
		                tele.find('.previewimg').attr('src',(edit)?modules.tools.getImg(img,'small'):img);
		                if(!edit){
		                    tele.find('.indicator').radialIndicator({
		                        barColor: '#0e345e',
		                        barWidth: 5,
		                        initValue: 0,
		                        roundCorner : true,
		                        radius:20,
		                        percentage: false,
		                        displayNumber:false,
		                        onAnimationComplete:function(cur_p){
		                            if(cur_p==100){//set to done!
		                                tele.find('.indicator').fadeOut(500,function(){
		                                    $(this).remove();
		                                })
		                            }
		                        }
		                    });
		                    tele.find('.indicator').find('canvas').css({position:'absolute',left:'50%',top:'50%',marginLeft:'-25px',marginTop:'-25px'})
			            }
		                tele.find('.x_remove').stap(function(e){
		                    phi.stop(e);
			                var tid=$(this).attr('data-id');
			                tele.fadeOut(500,function(){
			                    $(this).remove()
		                        //self.setImgWidth();
			                   	pself.removeItem(key,opts,tid);
			                })
			            },1,'tapactive');
			        }
			    });
		    },
			setUploadProgress:function(ele,id,p,force){
				var rele=ele.find('.mediatray').find('[data-image='+id+']').find('.indicator');
		        var indicator=rele.data('radialIndicator');
		        if(indicator){
		            if(p==-1){
		                indicator.stop();
		            }else{
		                if(!force) p=p*.95;//give more room for uploading...
		                indicator.animate(p,1);
		            }
		        }
			},
			addItem:function(key,opts,id,item){
				var current=this.getCurrent(key,opts);
		       if(current.order.indexOf(id)==-1) current.order.push(id);
		       current.list[id]=item;
		       options.current[key]=current;
		       self.onUpdate();
		    },
		    removeItem:function(key,opts,id){
		    	var current=this.getCurrent(key,opts);
		        if(current.order.indexOf(id)>=0){
		            current.order.splice(current.order.indexOf(id),1);
		            if(current.list[id]) delete current.list[id];
		            if(!current.order.length) current='';
		            options.current[key]=current;
		            self.onUpdate();
		            // if(!current.order.length){
		            //     self.setCantAdd(0);
		            //     //clear 
		            //     self.clearImages();
		            // }
		        }else{
		        	console.log('not found')
		        }
		    }
		},
		timezone:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_timezone',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts,1);
						}
					})
				}else{
					if(!pself.getCurrent(key,opts)){
						options.current[key]=Intl.DateTimeFormat().resolvedOptions().timeZone;//default
					}
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_timezone',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//current best guess timezone
			},
			binding:function(ele,key,opts,rerender){
				var pself=this;
				if(pself.getCurrent(key,opts)){
					ele.find('.x_clear').stap(function(){
						options.current[key]='';
						self.onUpdate();
						pself.render(key,opts,1);
					},1,'tapactive');
				}else{
					if(rerender){
						ele.find('input').focus();
					}
					new modules.search({
	                    input:ele.find('input'),
	                    allowAdd:false,
	                    scroller:self.getScroller(),
	                    // searchOffsetTop:(self.isWebLayout())?-80:0,
	                    // searchOffsetLeft:(self.isWebLayout())?125:0,
	                    web_inline:(self.isWebLayout())?1:0,
	                    disableLoading:false,
	                    noMinHeight:true,
	                    searchWidth:'400px',
	                    endpoint:app.sapiurl+'/timezones',
	                    endpointData:{},
	                    allowBlank:false,
	                    searchEle:self.ele.find('.mainsearchresults'),
	                    renderTemplate:'formbuilder_timezone_item',
	                    keyUpOnFocus:true,
	                    fitSearch:true,
	                    inline:true,
	                    cancelEle:ele.find('.tagcancel'),
	                    onKeyUp:function(val){
	                    },
	                    onSelect:function(id,item){//might want or need full item
	                    	//check permissions here?
	                    	options.current[key]=item.timezone;
	                    	//update other
	                    	$.each(options.schema.fields,function(i,v){
	                    		if(v.form&&v.form.timezoneField==key){
	                    			self.types.date.render(i,v,1);
	                    		}
	                    	})
	                        self.onUpdate();
							pself.render(key,opts,1);
	                    }
	                });
				}
			}
		},
		namepic:{
			render:function(key,opts){
				var pself=this;
				return $.fn.render({//return template
					returntemplate:true,
					template:(opts.template)?opts.template:'formbuilder_namepic',
					data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key,placeholders:pself.getPlaceholders(key,opts)})
				})
			},
			getCurrent:function(key,opts){
				var fields=[]
				fields.push(key);
				if(opts.form.linkedTo){
					fields.push(opts.form.linkedTo)
				};
				var current={};
				$.each(fields,function(i,v){
					if(options.current[v]) current[v]=options.current[v];
					else current[v]='';
				})
				return current;
			},
			getPlaceholders:function(key,opts){
				var fields=[]
				fields.push(key);
				if(opts.form.linkedTo){
					fields.push(opts.form.linkedTo)
				};
				var current={};
				$.each(fields,function(i,v){
					if(options.schema.fields[v].form&&options.schema.fields[v].form.placeholder) current[v]=options.schema.fields[v].form.placeholder;
					else current[v]='';
				});
				return current;
			},
			croppers:[],
			binding:function(ele,key,opts){
				var pself=this;
				ele.find('.autosize').autosize();
				ele.find('.maxlengtharea').maxlength();
				ele.find('.forminput').on('keyup input paste',function(i,v){
					options.current[key]=$(this).val();
	                self.onUpdate();
				})
				if(ele.find('.x_upload').length){
					if(opts.form.linkedTo&&options.schema.fields[opts.form.linkedTo]&&options.schema.fields[opts.form.linkedTo].form.crop){
						pself.croppers.push(new modules.cropuploader($.extend(true,{
							btn:ele.find('.x_upload'),
							onSuccess:function(data,cself){
								cself.saving();
								cself.destroy();
								ele.find('.coverimg').css('backgroundImage','url('+modules.tools.getImg(data,options.schema.fields[opts.form.linkedTo].form.displayCrop)+')');
								ele.find('.notuploaded').hide();
								options.current[opts.form.linkedTo]=data;
		                        self.onUpdate();
							}
						},self.getCropData(options.schema.fields[opts.form.linkedTo].form.crop))))
					}else{
						ele.find('.x_upload').bindUploader({
		                    apiurl:app.uploadurl,
		                    data:{
		                        sizes:['full','small'],
		                        path:'/img/',
		                        site:'nectar'
		                    },
		                    growl:false,
		                    radial:true,
		                    phoneType:'both',
		                    onError:function(msg,obj){
		                    	pself.count--;
		                    	//ele.find('.indicator').remove();
		                    	ele.find('.coverimg').css('backgroundImage','');
		                    	ele.find('.notuploaded').show();
		                        modules.toast({
		                            content:'Error: '+msg,
		                            remove:2500,
		                            icon:'icon-warning-sign'
		                        });
		                    },
		                    onPreviewReady:function(data,fileobj){//render previe
		                    	ele.find('.coverimg').css('backgroundImage','url('+data+')');
		                    },
		                    onProgress:function(p,fileobj,force){
		                    },
		                    onUploadStart:function(options){
		                    	pself.count++;
		                    	ele.find('.notuploaded').hide();
		                    },
		                    onSuccess:function(data,resp,fileobj){  
		                    	pself.count--;
		                    	//this.onProgress(100,fileobj,1);
		                        var img={
		                            path:resp.path,
		                            ext:resp.ext,
		                            ar:resp.ar
		                        };
		                        options.current[opts.form.linkedTo]=img;
		                        self.onUpdate();
		                    }
		                })
					}
				}
			}
		},
		drive:{
			render:function(key,opts,replace){
				var pself=this;
				if(replace){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						force:true,
						template:(opts.template)?opts.template:'formbuilder_drive',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_drive',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(opts.form.saveto){
					if(opts.form.linkedTo&&options.current[opts.form.linkedTo]=='drive'){
						var c=options.current[opts.form.saveto];
						if(c) return c;
						else return {};
					}else{
						return {};
					}
				}else{
					console.warn('Invalid Data SaveTo');
				}
			},
			loadAccounts:function(ele,key,opts){
				var pself=this;
				modules.api({
		            url:app.sapiurl+'/user/driveaccounts',
		            data:{
		            },
		            success:function(resp){
		            	if(resp.success){
		            		pself.loaded[key]=resp.data;
		            		pself.renderAccounts(ele,key,opts);
		            	}else{
		            		//show error and allow retry
		            	}
		            }
		        });
			},
			addAccount:function(ele,key,opts){
				var data={
					id:'google',
					name:'Google Drive',
					payload:{
						uniqueKey:Math.uuid(20),//allows multiple accounts to happen!
						provider:'google',
						process:'loadgoogle',
                        uid:app.user.profile.id,
                        app:'nectar',
                        redirect:window.location.href,
                        scope:['https://www.googleapis.com/auth/drive','profile','email']
                    }
				}
				if(options.addPage&&!isPhoneGap()) options.addPage.cache();
				modules.oauth({
                    payload:data.payload,
                   	authOptions:{
                   		// auth_type:'reauthenticate',
                   		// auth_nonce: Math.uuid(32)
                   	},
                    scope:data.payload.scope,
                },{
                    onAuthOpen:function(){
                        //cur.removeClass('submitting')
                    },
                    onSuccess:function(){
                        //shownextpage!
                      	//reload!
                      	pself.loadAccounts(ele,key,opts);
                    },
                    onError:function(data){
                        $('body').alert({
                            icon:'icon-warning-sign',
                            content:data.error
                        })
                    }
                },{//can only be data as it will be stored in localstore
            		case:'showadd'
            	});
			},
			selectAccount:function(ele,key,opts,account_id){
				var pself=this;
				pself.loaded[key].current=account_id;
				pself.renderAccounts(ele,key,opts);
			},
			renderAccounts:function(ele,key,opts){
				var pself=this;
				var dropdown=false;
				var pic='';
				var email='';
				var name='';
				if(pself.loaded[key].current){
					var item=pself.loaded[key].list[pself.loaded[key].current];
					if(item&&item.info){
						name=item.info.name;
						pic=item.info.pic;
						email=item.info.email;
					}
					dropdown=true;
				}else if(pself.loaded[key].order&&pself.loaded[key].order.length){
					pself.loaded[key].current=pself.loaded[key].order[0];
					var item=pself.loaded[key].list[pself.loaded[key].order[0]];
					if(item&&item.info){
						name=item.info.name;
						pic=item.info.pic;
						email=item.info.email;
					}
					dropdown=true;
				}else{
					name='Add Google Drive Account';
				}
				var button=new _ui.button({
		            template:'drivebutton',
		            data:{
		                corner:{tl:1,bl:1,tr:1,br:1},
		                name:name,
		                pic:pic,
		                email:email,
		                dropdown:dropdown
		            }
		        })
				ele.find('.contentarea').render({
					template:'formbuilder_drive_selector',
					append:false,
					data:{
						button:button.getTemplate()
					},
					binding:function(tele){
						//bind dropdown menu!
						if(!dropdown){
							tele.find('.driveadd').hide();
						}else{
							tele.find('.driveadd').render({
								template:'formbuilder_drive_input',
								binding:function(ele){
									pself.loaded[key].search=new modules.search({
					                    input:ele.find('input'),
					                    allowAdd:false,
					                    scroller:self.getScroller(),
					                    // searchOffsetTop:(self.isWebLayout())?-80:0,
					                    // searchOffsetLeft:(self.isWebLayout())?125:0,
					                    web_inline:(self.isWebLayout())?1:0,
					                    disableLoading:false,
					                    noMinHeight:true,
					                    searchWidth:'400px',
					                    endpoint:app.sapiurl+'/module/drive/load',
					                    endpointData:{
					                    	oauth_id:pself.loaded[key].current,
					                    	api:1
					                    },
					                    allowBlank:true,
					                    renderOpts:{
					                    	icons:modules.drive_preview.icons,
					                    	base:modules.drive_preview.previewbase
					                    },
					                    searchEle:self.ele.find('.mainsearchresults'),
					                    renderTemplate:'formbuilder_drive_item',
					                    keyUpOnFocus:true,
					                    fitSearch:true,
					                    inline:true,
					                    cancelEle:ele.find('.tagcancel'),
					                    onKeyUp:function(val){
					                    },
					                    onSelect:function(id,item){//might want or need full item
					                    	item.oid=pself.loaded[key].current;
					                    	//check permissions here?
					                    	options.current[opts.form.saveto]=item;
					                        self.onUpdate();
											pself.render(key,opts,1);
					                    }
					                });
								}
							})
						}
						button.bind(tele,{
				            onClick:function(bele){
				            	if(pself.loaded[key].order&&pself.loaded[key].order.length){
				            		var menu=[];
				            		$.each(pself.loaded[key].order,function(i,v){
				            			var item=pself.loaded[key].list[v];
				            			menu.push({
				            				id:item.id,
				            				name:item.info.name,
				            				pic:item.info.pic
				            			})
				            		})
				            		menu.push({
			            				id:'add',
			            				name:'Add Google Drive Account'
			            			})
					                var alt=modules.alertdelegate({
					                    display:{
					                        ele:bele,
					                        container:self.ele,
					                        locations:['topleft']
					                    },
					                    menu:menu,
					                    onSelect:function(id){
					                        if(id=='add'){
					                        	pself.addAccount(ele,key,opts);
					                        }else{
					                        	pself.selectAccount(ele,key,opts,id);
					                        }
					                    }
					                })
					                alt.show();
					            }else{
					            	pself.addAccount(ele,key,opts);
					            }
				            }
				        });
					}
				})
			},
			loaded:{},
			renderItem:function(ele,key,opts){
				var pself=this;
				ele.find('.contentarea').render({
					template:'formbuilder_drive_item',
					append:false,
					data:{
						data:pself.getCurrent(key,opts),
						opts:{
							icons:modules.drive_preview.icons,
					        base:modules.drive_preview.previewbase
						},
						selected:true
					},
					binding:function(tele){
						tele.find('.x_setperms').stap(function(){
							var menu=[];
							menu.push({
								id:'reader',
								name:'Anyone can <b>Read</b>'
							})
							menu.push({
								id:'commenter',
								name:'Anyone can <b>Comment</b>'
							})
							menu.push({
								id:'writer',
								name:'Anyone can <b>Edit</b>'
							})
							var alt=modules.alertdelegate({
			                    display:{
			                        ele:$(this),
			                        container:self.ele,
			                        locations:['topleft']
			                    },
			                    menu:menu,
			                    onSelect:function(id){
			                        //set permission!
			                        pself.setPermission(id,key,opts);
			                    }
			                })
			                alt.show();
			            },1,'tapactive')
						tele.find('.x_clear').stap(function(){
							if(options.current[opts.form.saveto]) delete options.current[opts.form.saveto];
	                        self.onUpdate();
	                        pself.loaded[key]=false;
							pself.render(key,opts,1);
						},1,'tapactive')
					}
				})
			},
			setPermission:function(perm,key,opts){
				var pself=this;
				var current=pself.getCurrent(key,opts);
				modules.api({
		            url:app.sapiurl+'/module/drive/setpermissions',
		            data:{
		            	id:current.id,
		            	oauth_id:current.oid,
		            	role:perm
		            },
		            success:function(resp){
		            	if(resp.success){
		            		modules.toast({
		            			content:'Successfully updated permissions!'
		            		})
		            	}else{
		            		modules.toast({
		            			content:'Error setting permissions: '+resp.error
		            		})
		            	}
		            }
		        });
			},
			binding:function(ele,key,opts){
				var pself=this;
				var current=pself.getCurrent(key,opts);
				if(!current.name){
					if(!pself.loaded[key]){
						pself.loadAccounts(ele,key,opts);
					}else{//render!
						pself.renderAccounts(ele,key,opts);
					}
				}else{
					//bind remove
					pself.renderItem(ele,key,opts);
				}
				pself.loaded[key]=1;
			}
		},
		uploadfile:{
			render:function(key,opts,replace){
				var pself=this;
				if(replace){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						force:true,
						template:(opts.template)?opts.template:'formbuilder_uploadfile',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_uploadfile',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(opts.form.saveto){
					if(opts.form.linkedTo&&options.current[opts.form.linkedTo]=='upload'){
						var c=options.current[opts.form.saveto];
						if(c) return c;
						else return {};
					}else{
						return {};
					}
				}else{
					console.warn('Invalid Data SaveTo');
				}
			},
			isUploading:function(){
				var pself=this;
				var toreturn=false;
				if(app.size(pself.uploader)){
					$.each(pself.uploader,function(i,v){
						if(v.isUploading()) toreturn=true;
					})
				}
				return toreturn;
			},
			binding:function(ele,key,opts){
				var pself=this;
				var current=pself.getCurrent(key,opts);
				if(!current.name){
					if(!pself.uploader) pself.uploader={}
					pself.uploader[key]=new modules.fileuploader({
			            ele:ele.find('.x_upload'),
			            //module:'video',
			            data:{
			                path:'/file/'
			            },
			            //previewOnly:true,
			            allowedExtensions:(opts.form.filetypes)?opts.form.filetypes:['pdf'],//other formats comming soon. issue is with transcoding
			            onSubmit:function(){
			                pself.uploader[key].uploading=true;
			            },
			            onPreviewReady:function(src,fileobj){
			            	ele.find('.contentarea').render({
			            		template:'formbuilder_uploadfile_item',
			            		data:{
			            			ext:fileobj.ext,
			            			name:fileobj.name
			            		},
			            		append:false,
			            		binding:function(ele){
			            			ele.find('.x_cancel').stap(function(){
			            				if(pself.uploader[key].uploading){
			            					pself.uploader[key].abort();
			            				}else{
			            					//destroy!
			            					if(options.current[opts.form.saveto]) delete options.current[opts.form.saveto];
			            					pself.render(key,opts,1);
			            				}
			            			},1,'tapactive');
			            		}
			            	})
			            },
			            onProgress:function(p){//happening in bg
			            	ele.find('.progbar').css('width',p+'%')
			            },
			            onAbort:function(){
			                pself.uploader[key].uploading=false;
			                //clear out and reset!
			                pself.render(key,opts,1);
			            },
			            onError:function(err,fileobj){
			                pself.uploader[key].uploading=false;
			                modules.toast({
			                	content:err
			                })
			            },
			            onComplete:function(obj, response){
			                pself.uploader[key].uploading=false;
			                ele.find('.progarea').hide();
			                var file={
			                 	ext:response.ext,
			                 	name:response.name,
			                 	path:response.path
			                }
			                options.current[opts.form.saveto]=file;
			                pself.uploader[key].destroy();
			            }
			        });
				}else{
					ele.find('.contentarea').render({
	            		template:'formbuilder_uploadfile_item',
	            		data:{
	            			ext:options.current[opts.form.saveto].ext,
	            			name:options.current[opts.form.saveto].name,
	            			uploaded:true
	            		},
	            		append:false,
	            		binding:function(ele){
	            			ele.find('.x_cancel').stap(function(){
	            				if(options.current[opts.form.saveto]) delete options.current[opts.form.saveto];
	            				pself.render(key,opts,1);
	            			},1,'tapactive');
	            		}
	            	})
				}
			}
		},
		button:{
			render:function(key,opts,replace){
				var pself=this;
				if(replace){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						force:true,
						template:(opts.template)?opts.template:'formbuilder_button',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_button',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]){
					var list=opts.form.options.list;
					var cur=options.current[key];
					var d='';
					$.each(list,function(i,v){
						if(v.value==cur) d=v;
					})
					if(d){
						return d;
					}else return '';
				}
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			getData:function(opts){
				var data=[];
				$.each(opts.form.options.order,function(i,v){
					data.push(opts.form.options.list[v]);
				})
				return data;
			},
			setToggleState:function(key,opts){
				var pself=this;
				if(opts.form.toggle){
					var current=pself.getCurrent(key,opts);
					if(current&&current.value){
						var t=opts.form.toggle[current.value];
						if(t){
							if(t.on.length){
								$.each(t.on,function(i,v){
									self.ele.find('[data-key='+v+']').show();
									self.ele.find('[data-group='+v+']').show();
								})
							}
							if(t.off.length){
								$.each(t.off,function(i,v){
									self.ele.find('[data-key='+v+']').hide();
									self.ele.find('[data-group='+v+']').hide();
								})
							}
						}
					}else{
						var t=opts.form.toggle.default;
						if(t){
							if(t.on.length){
								$.each(t.on,function(i,v){
									self.ele.find('[data-key='+v+']').show();
									self.ele.find('[data-group='+v+']').show();
								})
							}
							if(t.off.length){
								$.each(t.off,function(i,v){
									self.ele.find('[data-key='+v+']').hide();
									self.ele.find('[data-group='+v+']').hide();
								})
							}
						}
					}
				}
			},
			binding:function(ele,key,opts){
				var pself=this;
				pself.setToggleState(key,opts);
				ele.find('.formbutton').stap(function(){
					var id=$(this).attr('data-id');
					options.current[key]=id;
					ele.find('.formbutton').removeClass('selected')
					$(this).addClass('selected')
					self.onUpdate();
					pself.setToggleState(key,opts);
				},1,'tapactive');
			}
		},
		select:{
			render:function(key,opts,replace){
				var pself=this;
				if(replace){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						force:true,
						template:(opts.template)?opts.template:'formbuilder_select',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_select',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				var cv=options.current[key];
				if(!cv) cv= opts.form.default;
				if(cv){
					var list=opts.form.options.list;
					var cur=cv;
					var d='';
					$.each(list,function(i,v){
						if(v.value==cur) d=v;
					})
					if(d){
						return d;
					}else return '';
				}
				return '';//best guess default!
			},
			getData:function(opts){
				var data=[];
				$.each(opts.form.options.order,function(i,v){
					data.push(opts.form.options.list[v]);
				})
				return data;
			},
			setToggleState:function(key,opts){
				var pself=this;
				if(opts.form.toggle){
					var current=pself.getCurrent(key,opts);
					if(current&&current.value){
						var t=opts.form.toggle[current.value];
						if(t){
							if(t.on.length){
								$.each(t.on,function(i,v){
									self.ele.find('[data-key='+v+']').show();
									self.ele.find('[data-group='+v+']').show();
								})
							}
							if(t.off.length){
								$.each(t.off,function(i,v){
									self.ele.find('[data-key='+v+']').hide();
									self.ele.find('[data-group='+v+']').hide();
								})
							}
						}
					}else{
						var t=opts.form.toggle.default;
						if(t){
							if(t.on.length){
								$.each(t.on,function(i,v){
									self.ele.find('[data-key='+v+']').show();
									self.ele.find('[data-group='+v+']').show();
								})
							}
							if(t.off.length){
								$.each(t.off,function(i,v){
									self.ele.find('[data-key='+v+']').hide();
									self.ele.find('[data-group='+v+']').hide();
								})
							}
						}
					}
				}
			},
			binding:function(ele,key,opts){
				var pself=this;
				pself.setToggleState(key,opts);
				function select(id,data){
					options.current[key]=id;
					self.onUpdate();
					pself.setToggleState(key,opts);
					pself.render(key,opts,1);
				}
				ele.find('.x_selectitemselect').stap(function(){
					self.showInput(ele,{
						notitle:(self.isWebLayout())?true:false,
						noselect:(self.isWebLayout())?true:false,
						title:opts.name
					},function(ele){
						//render!
						ele.render({
							template:'formbuilder_select_items',
							data:{
								menu:pself.getData(opts),
								current:pself.getCurrent(key,opts)
							},
							binding:function(ele){
								ele.find('.buttonitem').stap(function(){
									var id=$(this).attr('data-id');
									var item=opts.form.options.list[id];
									$(this).addClass('selected');
									select(id,item);
									if(self.inputarea){
										self.inputarea.destroy();
									}else{
										self.hideInput();
									}
								},1,'tapactive')
							}
						})
					},function(ele,cb){//on select
						var sel=ele.find('.buttonitem.selected').attr('data-id');
						if(sel){
							var item=opts.form.options.list[id];
							select(id,item);
						}
						cb();
					})
				},1,'tapactive');
			}
		},
		buttonselect:{
			render:function(key,opts,replace){
				var pself=this;
				//set up default
				if(!options.current[key]&&opts.form.default){
					options.current[key]=opts.form.default;
				}
				if(replace){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						force:true,
						template:(opts.template)?opts.template:'formbuilder_buttonselect',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_buttonselect',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]){
					var list=opts.form.options.list;
					var cur=options.current[key];
					var d='';
					$.each(list,function(i,v){
						if(v.value==cur) d=v;
					})
					if(d){
						return d;
					}else return '';
				}
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			getData:function(opts){
				var data=[];
				$.each(opts.form.options.order,function(i,v){
					data.push(opts.form.options.list[v]);
				})
				return data;
			},
			setToggleState:function(key,opts){
				var pself=this;
				if(opts.form.toggle){
					var current=pself.getCurrent(key,opts);
					if(current&&current.value){
						var t=opts.form.toggle[current.value];
						if(t){
							if(t.on.length){
								$.each(t.on,function(i,v){
									self.ele.find('[data-key='+v+']').show();
									self.ele.find('[data-group='+v+']').show();
								})
							}
							if(t.off.length){
								$.each(t.off,function(i,v){
									self.ele.find('[data-key='+v+']').hide();
									self.ele.find('[data-group='+v+']').hide();
								})
							}
						}
					}else{
						var t=opts.form.toggle.default;
						if(t){
							if(t.on.length){
								$.each(t.on,function(i,v){
									self.ele.find('[data-key='+v+']').show();
									self.ele.find('[data-group='+v+']').show();
								})
							}
							if(t.off.length){
								$.each(t.off,function(i,v){
									self.ele.find('[data-key='+v+']').hide();
									self.ele.find('[data-group='+v+']').hide();
								})
							}
						}
					}
				}
			},
			binding:function(ele,key,opts){
				var pself=this;
				pself.setToggleState(key,opts);
				function select(id,data){
					options.current[key]=id;
					self.onUpdate();
					pself.setToggleState(key,opts);
					pself.render(key,opts,1);
				}
				ele.stap(function(){
					self.showInput(ele,{
						notitle:(self.isWebLayout())?true:false,
						noselect:(self.isWebLayout())?true:false,
						title:opts.name
					},function(ele){
						//render!
						ele.render({
							template:'formbuilder_buttonselect_items',
							data:{
								menu:pself.getData(opts)
							},
							binding:function(ele){
								ele.find('.buttonitem').stap(function(){
									var id=$(this).attr('data-id');
									var item=opts.form.options.list[id];
									$(this).addClass('selected');
									select(id,item);
									if(self.inputarea){
										self.inputarea.destroy();
									}else{
										self.hideInput();
									}
								},1,'tapactive')
							}
						})
					},function(ele,cb){//on select
						var sel=ele.find('.buttonitem.selected').attr('data-id');
						if(sel){
							var item=opts.form.options.list[id];
							select(id,item);
						}
						cb();
					})
				},1,'tapactive');
			}
		},
		multiselect:{
			render:function(key,opts,replace,cb){
				var pself=this;
				var data=$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key});
				if(options.extendSchema&&options.extendSchema[key]){
					data=$.extend(true,data,options.extendSchema[key]);
				}
				if(replace){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						force:true,
						template:(opts.template)?opts.template:'formbuilder_multiselect',
						data:data,
						binding:function(ele){
							pself.binding(ele,key,opts);
							if(cb) cb(ele);
						}
					})
				}else{

					return $.fn.render({//returntemplateurn template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_multiselect',
						data:data
					})
				}
			},
			getCurrent:function(key,opts){
				var pself=this;
				if(options.extendSchema&&options.extendSchema[key]){
					opts=$.extend({},opts,options.extendSchema[key]);
				}
				if(options.current[key]){
					var list=opts.form.options.list;
					var cur=options.current[key];
					var ret={
						values:[],
						order:[],
						list:{}
					}
					var map={}
					$.each(list,function(i,v){
						map[v.value]=i;
					})
					$.each(cur,function(i,v){
						if(map[v]){
							ret.order.push(map[v]);
							ret.list[map[v]]=list[map[v]];
							ret.values.push(v);
						}
					})
					if(ret.order.length){
						return ret;
					}else return '';
				}
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			getData:function(key,opts){
				var pself=this;
				var data=[];
				if(options.extendSchema&&options.extendSchema[key]){
					opts=$.extend({},opts,options.extendSchema[key]);
				}
				$.each(opts.form.options.order,function(i,v){
					data.push(opts.form.options.list[v]);
				})
				return data;
			},
			getValid:function(key,opts){
				var pself=this;
				var data=[];
				if(options.extendSchema&&options.extendSchema[key]){
					opts=$.extend({},opts,options.extendSchema[key]);
				}
				$.each(opts.form.options.list,function(i,v){
					data.push(v.tag);
				})
				return data;
			},
			handleAction:function(ele,key,opts,action,actionOpts){
		    	var pself=this;
		    	var valid=pself.getValid(key,opts);
		    	//only allow valid updates to make a change!
		    	if(valid.indexOf(actionOpts.id)==-1) return console.warn('the id ['+actionOpts.id+'] is not found in this select list!');
		    	switch(action){
		    		case 'add':
		    			if(!options.current[key]) options.current[key]=[];
		    			if(!options.current[opts.form.info]) options.current[opts.form.info]={};
		    			//only add if its valid to add!
		    			options.current[key].push(actionOpts.id);
		    			options.current[opts.form.info][actionOpts.id]=actionOpts.data;
		    		break;
		    		case 'remove':
		    			if(options.current[key].indexOf(actionOpts.id)>=0) options.current[key].splice(options.current[key].indexOf(actionOpts.id),1);
		    			if(options.current[opts.form.info]&&options.current[opts.form.info][actionOpts.id]) delete options.current[opts.form.info][actionOpts.id];
		    		break;
		    		default:
		    			console.warn('invalid handleAction');
		    			return false;
		    		break;
		    	}
		    	pself.render(key,opts,1,function(ele){
				});
		    },
			binding:function(ele,key,opts){
				var pself=this;
				ele.stap(function(){
					self.showInput(ele,{
						notitle:false,
						noselect:(self.isWebLayout())?true:false,
						title:opts.name,
						done:'Done'
					},function(ele){
						//render!
						ele.render({
							template:(opts.form.template)?opts.form.template:'formbuilder_mulitselect_items',
							data:{
								max:(opts.form.max)?opts.form.max:0,
								menu:pself.getData(key,opts),
								current:pself.getCurrent(key,opts)
							},
							binding:function(ele){
								var max=(opts.form.max)?opts.form.max:10000;
								ele.find('.multibuttonitem').stap(function(){
									var id=$(this).attr('data-id');
									var item=opts.form.options.list[id];
									if($(this).hasClass('selected')){
										$(this).removeClass('selected');
										var ci=options.current[key].indexOf(id);
										if(ci>=0) options.current[key].splice(ci,1);
										self.onUpdate();
										pself.render(key,opts,1,function(ele){
											if(self.inputarea&&self.inputarea.updatePlacement) self.inputarea.updatePlacement(ele);
										});
										if(opts.form.linkTo){
											self.handleLinkAction(opts.form.linkTo,'remove',{
												id:item.tag
											});
										}
									}else{
										if(!options.current[key]) options.current[key]=[];
										if(options.current[key].length<max){
											$(this).addClass('selected');
											options.current[key].push(id);
											self.onUpdate();
											pself.render(key,opts,1,function(ele){
												if(self.inputarea&&self.inputarea.updatePlacement) self.inputarea.updatePlacement(ele);
											});
											if(opts.form.linkTo){
												self.handleLinkAction(opts.form.linkTo,'add',{
													id:item.tag,
													data:{
														id:item.tag,
														name:item.display
													}
												});
											}
										}else{
											modules.toast({
												content:'You can only select a maximum of '+max
											})
										}
									}
									//re-place
									
								},1,'tapactive')
							}
						})
					},function(ele,cb){//on select
						cb();
					})
				},1,'tapactive');
			}
		},
		date:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_date',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key,timezone:pself.getTimeZone(key,opts)}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_date',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key,timezone:pself.getTimeZone(key,opts)})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]&&options.current[key]!='[unset]') return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			getTimeZone:function(key,opts){
				if(opts.form.timezoneField&&options.current[opts.form.timezoneField]&&options.current[opts.form.timezoneField]){
					return options.current[opts.form.timezoneField];
				}else{
					return 'America/Denver'
				}
			},	
			renderDate:function(ele,key,opts){
				var pself=this;
				var current=pself.getCurrent(key,opts);
				var dateobj=new Date();
				//dont allow things in past
				if(!opts.form.linkedTo){
					var min=new Date(dateobj.getFullYear(),dateobj.getMonth(),dateobj.getDate(),dateobj.getHours());
				}else{
					if(options.current[opts.form.linkedTo]){
						var min=new Date((options.current[opts.form.linkedTo])*1000);
					}else{
						var min=new Date(dateobj.getFullYear(),dateobj.getMonth(),dateobj.getDate(),dateobj.getHours());
					}
				}
				if(!current){
	                current=new Date(dateobj.getFullYear(),dateobj.getMonth(),dateobj.getDate(),dateobj.getHours());
	                pself.tempval=Math.floor(current.getTime()/1000);
	            }else{
	            	pself.tempval=current;
	            	current=current*1000;
	            }
	            var tz=pself.getTimeZone(key,opts)
	            if(tz!=_.getTimeZone()){
	            	var diff=modules.moment.getTimezoneDiff(tz,_.getTimeZone());
	            	current+=diff*1000;
	            }
				ele.mobiscroll().datetime({
					dataTimezone: 'utc',
                    animate:true,
                    rows:4,
                    display:'inline',
                    dateWheels: '|D M d|',
                    steps:{
                        minute:5
                    },
                    defaultValue:new Date(current),
                    min:min,
                    onChange:function(event){
                        var ct=new Date(event.valueText);
                        pself.tempval=Math.floor(ct.getTime()/1000);//php time!
                        //apply offset!
                        var tz=pself.getTimeZone(key,opts)
			            if(tz!=_.getTimeZone()){
			            	var diff=modules.moment.getTimezoneDiff(tz,_.getTimeZone());
			            	pself.tempval-=diff;
			            }
                        //set min of End Time!
                        // tele.find('.endtime').mobiscroll('option',{
                        //     min:ct
                        // })
                    }
                })
			},
			getVal:function(){
				var pself=this;
				return pself.tempval;
			},
			binding:function(ele,key,opts){
				var pself=this;
				ele.stap(function(){
					if(modules.keyboard_global) modules.keyboard_global.hide();
					self.showInput(ele,{
						title:opts.name,
						canClear:(opts.form.canClear)?1:0
					},function(ele){
						pself.renderDate(ele,key,opts);
					},function(ele,cb){
						var v=pself.getVal();
						options.current[key]=v;
						if(opts.form.ensureOnSet){
							if(options.current[opts.form.ensureOnSet]){
								if(options.current[key]>options.current[opts.form.ensureOnSet]){
									options.current[opts.form.ensureOnSet]='';//clear!
									pself.render(opts.form.ensureOnSet,options.schema.fields[opts.form.ensureOnSet],1);
								}
							}
						}
						self.onUpdate();
						pself.render(key,opts,1);
						cb();
					},function(ele,cb){//clear function
						options.current[key]='[unset]';
						self.onUpdate();
						pself.render(key,opts,1);
						cb();
					})
				},1,'tapactive');
			}
		},
		url_name:{
			render:function(key,opts){
				var pself=this;
				return $.fn.render({//return template
					returntemplate:true,
					template:(opts.template)?opts.template:'formbuilder_url_name',
					data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
				})
			},
			setCurrentValue:function(ele,key,opts){
				var pself=this;
				var current=pself.getCurrent(key,opts);
				if(current){
					ele.find('.currentvalue').html(current);
				}else{
					ele.find('.currentvalue').html('enter_url_path');
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				return '';//best guess default!
			},
			checkUrl:function(ele,key,opts,val){
				ele.find('.iconarea').html('<i class="icon-refresh animate-spin" style="color:#888"></i>');
				ele.find('.response').render({
					template:'formbuilder_url_response',
					append:false,
					data:{
						loading:true
					}
				})
				modules.api({
		            url:app.sapiurl+'/url_name',
		            data:{
		            	check:1,
		            	path:val,
		            	page:options.current.id
		            },
		            success:function(resp){
		            	if(resp.success){
			                if(options.current[key]==val){
			                	if(resp.valid){
			                		ele.find('.response').render({
										template:'formbuilder_url_response',
										append:false,
										data:{
											response:true,
											valid:true
										}
									})
									ele.find('.iconarea').html('<i class="icon-check-1" style="color:green"></i>');
			                	}else{
			                		ele.find('.response').render({
										template:'formbuilder_url_response',
										append:false,
										data:{
											response:true,
											valid:false,
											message:resp.msg
										}
									})
									ele.find('.iconarea').html('<i class="icon-cantgo" style="color:#f02"></i>');
			                	}
							}else{
								console.warn('changed in middle of request');
							}
						}else{
							//show warning sign but enable
							ele.find('.iconarea').html('<i class="icon-warning-sign" style="color:#FF8C00"></i>');
							ele.find('.response').render({
								template:'formbuilder_url_response',
								append:false,
								data:{
									error:resp.error
								}
							})
						}
		            }
		        });
			},
			binding:function(ele,key,opts){
				var pself=this;
				pself.setCurrentValue(ele,key,opts);
				ele.find('input').on('keyup',function(){
					var v=$(this).val();
					v=v.getTagId();
					$(this).val(v);
					options.current[key]=v;
					pself.setCurrentValue(ele,key,opts);
					//check it!
					pself.checkUrl(ele,key,opts,v);
					self.onUpdate();
				})
			}
		},
		textarea_fancy:{
			render:function(key,opts){
				var pself=this;
				var rdata=$.extend(true,{},opts.form,pself.getCurrent(key,opts));
				return $.fn.render({//return template
					returntemplate:true,
					template:(opts.template)?opts.template:'formbuilder_textarea_fancy',
					data:{
						opts:opts,
						key:key,
						rdata:rdata
					}
				})
			},
			getCurrent:function(key,opts){
				var keys=(opts.form.associatedKeys)?opts.form.associatedKeys:false;
				var d={};
				if(keys){
					$.each(keys,function(i,v){
						d[v]=options.current[v];
					})
				}
				if(!d[key]) d[key]=options.current[key];
				return d;
			},
			binding:function(ele,key,opts){
				self.modules[key]=new modules.textarea({
					ele:ele,
					scroller:self.getScroller(),
					searchEle:self.ele.find('.mainsearchresults'),
					format:opts.form.format,
					onUpdate:function(d){
						$.each(d,function(i,v){
							if(i=='message'){
								options.current[key]=v;
							}else{
								options.current[i]=v;
							}
						})
						self.onUpdate();
					}
				});//register!
			},
		},
		textarea:{
			render:function(key,opts){
				var pself=this;
				return $.fn.render({//return template
					returntemplate:true,
					template:(opts.template)?opts.template:'formbuilder_textarea',
					data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
				})
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default){
					options.current[key]=opts.form.default;
					self.onUpdate();
					return opts.form.default;
				}
				return '';//best guess default!
			},
			update:function(ele,key,opts,tv){
				var oval=tv;
				var pv='';
				if(opts.form.format){
					switch(opts.form.format){
						case 'tag':
							pv=tv=tv.getTagId();
						break;
						case 'discount':
							pv=tv=tv.getTagId().toUpperCase();
						break;
						case 'percent':
							tv=tv.replace(/[^\d.-]/g,'');
							if(tv){
								var ftv=parseFloat(tv);
								if(ftv<0) tv=0;
								if(ftv>100) tv=100;
								pv=tv+'%';
							}else{
								pv='';
							}
						break;
					}
				}else{
					pv=tv;
				}
				options.current[key]=tv;
				//if(tv!=oval){
				ele.find('textarea').val(tv);
				//}
				ele.find('.renderedcontent').html(tv);
				var h=$(this).parent().outerHeight();
				ele.find('.renderedcontent').css({height:h});
				ele.find('.inputheight').css({height:h});
				if(options.current[key].length){
					ele.addClass('hasvalue');
				}else{
					ele.removeClass('hasvalue');
				}
				self.onUpdate();
			},
			binding:function(ele,key,opts){
				var pself=this;
				ele.find('.autosize').autosize({
					onresize:function(old_height,height){
						if(height) ele.find('.inputheight').css('height',height);
					},
					getScroller:function(){
						if(!self.getScroller()) return false;
                        return self.getScroller().scroller
                    }
				});
				if(opts.form.maxlength){
					ele.find('.maxlengtharea').maxlength({
						counterContainer:ele.find('.counterarea')
					});
				}
				ele.find('textarea').on('keyup input paste',function(){
					var tv=$(this).val();
					pself.update(ele,key,opts,tv);
				});
			}
		},
		input:{
			render:function(key,opts){
				var pself=this;
				return $.fn.render({//return template
					returntemplate:true,
					template:(opts.template)?opts.template:'formbuilder_input',
					data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
				})
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			binding:function(ele,key,opts){
				ele.find('input').on('keyup input paste',function(){
					var tv=$(this).val();
					var oval=tv;
					if(opts.form.format){
						switch(opts.form.format){
							case 'tag':
								tv=tv.getTagId();
							break;
						}
					}
					options.current[key]=tv;
					if(tv!=oval){
						$(this).val(tv);
					}
					if(options.current[key].length){
						ele.addClass('hasvalue');
					}else{
						ele.removeClass('hasvalue');
					}
					self.onUpdate();
				})
			}
		},
		rating:{
			render:function(key,opts){
				var pself=this;
				return $.fn.render({//return template
					returntemplate:true,
					template:(opts.template)?opts.template:'formbuilder_rating',
					data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
				})
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			binding:function(ele,key,opts){
				var toptions = {
					min_value: opts.bounds[0],
				    max_value: opts.bounds[1],
				    step_size: opts.form.step
				}
				ele.find('.rating').rate(toptions).on("change", function(ev, data){
				    options.current[key]=data.to;
				    self.onUpdate();
				});
			}
		},
		price:{
			render:function(key,opts){
				var pself=this;
				return $.fn.render({//return template
					returntemplate:true,
					template:(opts.template)?opts.template:'formbuilder_price',
					data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
				})
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			binding:function(ele,key,opts){

			}
		},
		phone:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_phone',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_phone',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			renderPhoneNumber:function(oele,key,opts){
				var pself=this;
				var current=pself.getCurrent(key,opts);
				oele.render({
		            template:'formbuilder_phone_input',
		            data:{
		            	name:opts.name
		            },
		            binding:function(ele){
		            	pself.phonenumber=new modules.phonenumber({
		                    ele:ele.find('.phoneinput'),
		                    phone:current,
		                    onUpdate:function(){

		                    }
		                });
		            }
		        });
			},
			binding:function(ele,key,opts){
				var pself=this;
				if(opts.form.inline){
					pself.renderPhoneNumber(ele.find('.phonebox'),key,opts);
				}else{
					ele.stap(function(){
						if(modules.keyboard_global) modules.keyboard_global.hide();
						self.showInput(ele,{
							title:'Phone Number'
						},function(ele){
							pself.renderPhoneNumber(ele,key,opts);
						},function(ele,cb){
							options.current[key]=pself.phonenumber.getNumber();
							self.onUpdate();
							pself.render(key,opts,1);
							cb()
						})
					},1,'tapactive');
				}
			}
		},
		onoff:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_onoff',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_onoff',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			setToggleState:function(key,opts){
				var pself=this;
				if(opts.form.toggle){
					var current=pself.getCurrent(key,opts);
					var cv=(current)?'1':'0';
					var t=opts.form.toggle[cv];
					if(t){
						if(t.on.length){
							$.each(t.on,function(i,v){
								self.ele.find('[data-key='+v+']').show();
								self.ele.find('[data-group='+v+']').show();
							})
						}
						if(t.off.length){
							$.each(t.off,function(i,v){
								self.ele.find('[data-key='+v+']').hide();
								self.ele.find('[data-group='+v+']').hide();
							})
						}
					}
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]||options.current[key]===false||options.current[key]===0||options.current[key]==='') return options.current[key];
				if(opts.form.default){
					options.current[key]=opts.form.default;
					return opts.form.default;
				}
				return '';//best guess default!
			},
			binding:function(ele,key,opts){
				var pself=this;
				_ui.register(key,{
					onClick:function(val){
						options.current[key]=val;
						self.onUpdate();
						pself.setToggleState(key,opts)
					}
				})
				pself.setToggleState(key,opts)
			}
		},
		url:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_url',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_url',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			renderWebsite:function(oele,key,opts){
				var pself=this;
				var current=pself.getCurrent(key,opts);
				oele.render({
		            template:'formbuilder_url_input',
		            data:{
		            	current:current,
		            	name:opts.name
		            },
		            binding:function(ele){
		            	pself.ele=ele;
		            	ele.find('input').on('keyup paste',function(){
		            		ele.find('.x_error').html('').hide();
		            	})
		            }
		        });
			},
			getInputVal:function(){
				var pself=this;
				return pself.ele.find('input').val();
			},
			validate:function(val,cb){
				var pself=this;
				self.inputLoading();
				modules.api({
		            url:app.sapiurl+'/module/links/validate',
		            data:{
		            	url:val
		            },
		            success:function(resp){
		                self.inputDone();
		                if(resp.valid){
		                	cb(true);
		                }else{
		                	pself.invalid(cb);
		                }
		            }
		        });
			},
			invalid:function(cb){
				var pself=this;
				pself.ele.find('.x_error').show();
				pself.ele.find('.x_error').render({
					template:'formbuilder_url_error',
					append:false,
					binding:function(ele){
						ele.find('.x_continue').stap(function(){
							cb(false);
						},1,'tapactive')
					}
				})
			},
			binding:function(ele,key,opts){
				var pself=this;
				ele.stap(function(){
					if(modules.keyboard_global) modules.keyboard_global.hide();
					self.showInput(ele,{
						title:opts.name
					},function(ele){
						pself.renderWebsite(ele,key,opts);
					},function(ele,cb){
						var d=pself.getInputVal();
						if(opts.form.validate){
							if(d){
								pself.validate(d,function(isValid){
									if(isValid){
										options.current[key]=d;
										self.onUpdate();
										pself.render(key,opts,1);
										cb();
									}else{
										options.current[key]=d;
										if(!options.current._validateOpts) options.current._validateOpts={};
										options.current._validateOpts[key]={
											dontCheckURL:1
										}
										pself.render(key,opts,1);
										cb();
									}
								});
							}else{
								cb();
							}
						}else{
							options.current[key]=d;
							self.onUpdate();
							pself.render(key,opts,1);
							cb();
						}
					})
				},1,'tapactive');
			}
		},
		page:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_page',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_page',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			endpointFns:{
				getScopes:function(opts){
					var v=modules.tools.dotGet(opts.key,options.current);
					if(!v) return false;
					else return {pages:[v]};
				}
			},
			setToggleState:function(key,opts){
				var pself=this;
				if(opts.form.toggle){
					var current=pself.getCurrent(key,opts);
					if(current){
						if(opts.form.toggle.set){
							var t=opts.form.toggle.set;
							if(t){
								if(t.on.length){
									$.each(t.on,function(i,v){
										self.ele.find('[data-key='+v+']').show();
										self.ele.find('[data-group='+v+']').show();
									})
								}
								if(t.off.length){
									$.each(t.off,function(i,v){
										self.ele.find('[data-key='+v+']').hide();
										self.ele.find('[data-group='+v+']').hide();
									})
								}
							}
						}
					}else{
						if(opts.form.toggle.unset){
							var t=opts.form.toggle.unset;
							if(t){
								if(t.on.length){
									$.each(t.on,function(i,v){
										self.ele.find('[data-key='+v+']').show();
										self.ele.find('[data-group='+v+']').show();
									})
								}
								if(t.off.length){
									$.each(t.off,function(i,v){
										self.ele.find('[data-key='+v+']').hide();
										self.ele.find('[data-group='+v+']').hide();
									})
								}
							}
						}
					}
				}
			},
			binding:function(ele,key,opts){
				var pself=this;
				pself.setToggleState(key,opts);
				if(pself.getCurrent(key,opts)){
					ele.find('.x_remove').stap(function(){
						options.current[key]='';
						self.onUpdate();
						pself.render(key,opts,1);
					},1,'tapactive')
				}else{
					pself.searchbar=new modules.search({
	                    input:ele.find('.pageinput'),
	                    allowAdd:false,
	                    scroller:self.getScroller(),
	                    keyUpOnFocus:((opts.form.endpointOpts&&opts.form.endpointOpts.page_permission)||opts.form.keyUpOnFocus)?1:0,
	                    allowBlank:((opts.form.endpointOpts&&opts.form.endpointOpts.page_permission)||opts.form.keyUpOnFocus)?1:0,
	                    // searchOffsetTop:(self.isWebLayout())?-80:0,
	                    // searchOffsetLeft:(self.isWebLayout())?125:0,
	                    web_inline:(self.isWebLayout())?1:0,
	                    disableLoading:(self.isWebLayout())?1:0,
	                    endpoint:self.getEndpoint(opts.form.endpoint),
	                    endpointData:(opts.form.endpointOpts)?opts.form.endpointOpts:{},
	                    searchEle:self.ele.find('.mainsearchresults'),
	                    renderTemplate:opts.form.template,
	                    fitSearch:true,
	                    inline:true,
	                    cancelEle:ele.find('.tagcancel'),
	                    getEndpointFormData:function(){
	                    	if(opts.form.endpointFns){
	                    		var ret={};
	                    		$.each(opts.form.endpointFns,function(i,v){
	                    			if(ret){//if one fails, all fail
	                    				if(pself.endpointFns&&pself.endpointFns[v.fn]){
	                    					ret[i]=pself.endpointFns[v.fn](v.opts);
	                    					if(!ret[i]) ret=false;
	                    				}else{
	                    					ret=false;
	                    				}
	                    			}
	                    		})
	                    		return ret;
	                    	}else{
	                    		return true;
	                    	}
	                    },
	                    onKeyUp:function(val){
	                    },
	                    onSelect:function(id,item){//might want or need full item.
	                    	if(!item._type) item._type='page';
	                    	if(item._type=='people') item._type='user';
	                    	options.current[key]={
	                    		id:id,
	                    		type:item._type,
	                    		data:item
	                    	}
	                    	pself.setToggleState(key,opts);
	                        self.onUpdate();
							pself.render(key,opts,1);
	                    }
	                });
				}
			}
		},
		general_person:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_general_person',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_general_person',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			renderAddArea:function(ele,key,opts){
				var pself=this;
				var c=pself.getCurrent(key,opts);
				ele.find('.general_person_add').render({
					template:'formbuilder_general_person_add',
					append:false,
					data:{
						form:opts.form,
						current:c
					},
					binding:function(aele){
						if(c.type){
							if(!c.id){
								if(c.type=='user'){
									pself.searchbar=new modules.search({
					                    input:aele.find('.taginput'),
					                    allowAdd:false,
					                    scroller:self.getScroller(),
					                    // searchOffsetTop:(self.isWebLayout())?-80:0,
					                    // searchOffsetLeft:(self.isWebLayout())?125:0,
					                    web_inline:(self.isWebLayout())?1:0,
					                    disableLoading:(self.isWebLayout())?1:0,
					                    endpoint:self.getEndpoint(opts.form.endpoint),
					                    endpointData:(opts.form.endpointOpts)?opts.form.endpointOpts:{},
					                    searchEle:self.ele.find('.mainsearchresults'),
					                    renderTemplate:opts.form.template,
					                    fitSearch:true,
					                    inline:true,
					                    cancelEle:ele.find('.tagcancel'),
					                    onKeyUp:function(val){
					                    },
					                    onSelect:function(id,item){//might want or need full item.
					                    	if(!item._type) item._type='person';
					                    	options.current[key].id=id;
					                    	options.current[key].data=item;
					                        self.onUpdate();
											pself.render(key,opts,1);
					                    }
					                });
					                setTimeout(function(){
					                	aele.find('.taginput').focus();
					                },100)
								}
							}
							if(c.type!='user'){
								ele.find('input').on('change keyup input',function(){
									var v=$(this).val();
									if(!options.current[key].data) options.current[key].data={};
									options.current[key].data[$(this).attr('data-id')]=v;
									self.onUpdate();
								})
							}
							ele.find('.x_remove').stap(function(){
								options.current[key]='';
								self.onUpdate();
								pself.renderAddArea(ele,key,opts);
							},1,'tapactive')
						}else{
							ele.find('.x_select').stap(function(){
								var id=$(this).attr('data-id');
								options.current[key]={
									type:id
								}
								self.onUpdate();
								pself.renderAddArea(ele,key,opts);
							},1,'tapactive');
						}
					}
				});
			},
			binding:function(ele,key,opts){
				var pself=this;
				pself.renderAddArea(ele,key,opts);
			}
		},
		person:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_page',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_page',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			binding:function(ele,key,opts){
				var pself=this;
				if(pself.getCurrent(key,opts)){
					ele.find('.x_remove').stap(function(){
						options.current[key]='';
						self.onUpdate();
						pself.render(key,opts,1);
					},1,'tapactive')
				}else{
					pself.searchbar=new modules.search({
	                    input:ele.find('.pageinput'),
	                    allowAdd:false,
	                    scroller:self.getScroller(),
	                    // searchOffsetTop:(self.isWebLayout())?-80:0,
	                    // searchOffsetLeft:(self.isWebLayout())?125:0,
	                    web_inline:(self.isWebLayout())?1:0,
	                    disableLoading:(self.isWebLayout())?1:0,
	                    endpoint:self.getEndpoint(opts.form.endpoint),
	                    endpointData:(opts.form.endpointOpts)?opts.form.endpointOpts:{},
	                    searchEle:self.ele.find('.mainsearchresults'),
	                    renderTemplate:opts.form.template,
	                    fitSearch:true,
	                    inline:true,
	                    cancelEle:ele.find('.tagcancel'),
	                    onKeyUp:function(val){
	                    },
	                    onSelect:function(id,item){//might want or need full item.
	                    	if(!item._type) item._type='person';
	                    	options.current[key]={
	                    		id:id,
	                    		type:item._type,
	                    		data:item
	                    	}
	                        self.onUpdate();
							pself.render(key,opts,1);
	                    }
	                });
				}
			}
		},
		tags:{
			render:function(key,opts){
				var pself=this;
				return $.fn.render({//return template
					returntemplate:true,
					template:(opts.template)?opts.template:'formbuilder_tags',
					data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
				})
			},
			ensureTagHeight:function(ele,opts){
		        //set proper padding on tag input
		        // var p1=ele.find('.tagrender_bottom').find('.tagcursor').position();
		        // var p3={top:(p1.top),left:(p1.left+45)};
		        if(opts.form.icon){
		        	var pl=45;
		        }else{
					var pl=5;
				}
		        var pt=5;
		        ele.find('.taginput').css({paddingLeft:pl,paddingTop:pt});
		        //ele.find('.taginput').css({paddingLeft:p3.left,paddingTop:p3.top});
		        //set height
		        var h=ele.find('.tagrender_top').outerHeight()+5;
		        ele.find('.tagbox').css({height:h});
		    },
		    handleAction:function(ele,key,opts,action,actionOpts){
		    	var pself=this;
		    	switch(action){
		    		case 'add':
		    			if(!options.current[key]) options.current[key]=[];
		    			if(!options.current[opts.form.info]) options.current[opts.form.info]={};
		    			options.current[key].push(actionOpts.id);
		    			options.current[opts.form.info][actionOpts.id]=actionOpts.data;
		    		break;
		    		case 'remove':
		    			if(options.current[key].indexOf(actionOpts.id)>=0) options.current[key].splice(options.current[key].indexOf(actionOpts.id),1);
		    			if(options.current[opts.form.info]&&options.current[opts.form.info][actionOpts.id]) delete options.current[opts.form.info][actionOpts.id];
		    		break;
		    		default:
		    			console.warn('invalid handleAction');
		    			return false;
		    		break;
		    	}
		    	pself.renderAddSelectedTags(ele,pself.getCurrent(key,opts),key,opts);
                self.onUpdate();
		    },
		    renderAddSelectedTags:function(renderTo,current,key,opts){
		    	var pself=this;
		        renderTo.find('.tagrender_top').render({
		            template:'formbuilder_tagadd',
		            data:{
		                top:true,
		                name:opts.name,
		                tags:current,
		                tag_info:(options.current[opts.form.info])?options.current[opts.form.info]:{},
		                render_template:opts.form.template,
		                form:opts.form
		            },
		            append:false,
		            binding:function(ele){
		                ele.find('.x_remove').stap(function(){
		                    var id=$(this).attr('data-id');
		                    options.current[key].splice(options.current[key].indexOf(id),1);
		                    $(this).parent().fadeOut(500,function(){
		                        renderTo.find('[data-tag='+id+']').remove();
		                        pself.ensureTagHeight(renderTo,opts); 
		                        self.onUpdate();
		                    })
		                    if(opts.form.linkTo){
								self.handleLinkAction(opts.form.linkTo,'remove',{
									id:id
								});
							}
							pself.searchbar.remove(id);
		                },1,'tapactive')
		            }
		        })
		        renderTo.find('.tagrender_bottom').render({
		            template:'formbuilder_tagadd',
		            data:{
		                top:false,
		                name:opts.name,
		                tag_info:(options.current[opts.form.info])?options.current[opts.form.info]:{},
		                tags:current,
		                render_template:opts.form.template,
		                form:opts.form
		            },
		            append:false
		        })
		        pself.ensureTagHeight(renderTo,opts);
		    },
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return [];//best guess default!
			},
			parseEndpointOpts:function(eOpts,key,opts){
				var opts={};
				for(var key in eOpts){
					opts[key]=_.parseString(eOpts[key],options.current);
				}
				return opts;
			},
			binding:function(ele,key,opts){
				var pself=this;
				pself.searchbar=new modules.search({
                    input:ele.find('.taginput'),
                    allowAdd:(opts.form.allowAdd)?true:false,
                    scroller:self.getScroller(),
                    // searchOffsetTop:(self.isWebLayout())?-80:0,
                    // searchOffsetLeft:(self.isWebLayout())?125:0,
                    format:(opts.form.format)?opts.form.format:'',
                    web_inline:(self.isWebLayout())?1:0,
                    disableLoading:(self.isWebLayout())?1:0,
                    exclude:(opts.form.noexclude)?[]:$.extend(true,[],pself.getCurrent(key,opts)),
                    noExclude:(opts.form.noexclude)?1:0,
                    endpoint:self.getEndpoint(opts.form.endpoint,opts.form),
	               	endpointData:(opts.form.endpointOpts)?pself.parseEndpointOpts(opts.form.endpointOpts,key,opts):{},
                    searchEle:self.ele.find('.mainsearchresults'),
                    renderTemplate:opts.form.template,
                    inline:true,
                    multiple:true,
                    fitSearch:true,
                    cancelEle:ele.find('.tagcancel'),
                    onKeyUp:function(val){
                        if(val==''){
                            ele.find('.tagcursor').show();
                        }else{
                            ele.find('.tagcursor').hide();
                        }
                    },
                    onSelect:function(id,item){//might want or need full item.
                    	if(!options.current[key]) options.current[key]=[];
                        options.current[key].push(id);
                        if(opts.form.info){
                        	if(!options.current[opts.form.info]) options.current[opts.form.info]={};
                        	options.current[opts.form.info][id]=item;
                        }
                        pself.renderAddSelectedTags(ele,pself.getCurrent(key,opts),key,opts);
                        // self.setTagHash();
                        self.onUpdate();
                        if(opts.form.linkTo){
							self.handleLinkAction(opts.form.linkTo,'add',{
								id:id,
								data:item
							});
						}
                    }
                });
                pself.renderAddSelectedTags(ele,pself.getCurrent(key,opts),key,opts);
			}
		},
		tag:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_tag',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),info:pself.getInfo(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_tag',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),info:pself.getInfo(key,opts),key:key})
					})
				}
			},
			ensureTagHeight:function(ele,opts){
		        //set proper padding on tag input
		        // var p1=ele.find('.tagrender_bottom').find('.tagcursor').position();
		        // var p3={top:(p1.top),left:(p1.left+45)};
		        if(opts.form.icon){
		        	var pl=45;
		        }else{
					var pl=5;
				}
		        var pt=5;
		        ele.find('.taginput').css({paddingLeft:pl,paddingTop:pt});
		        //ele.find('.taginput').css({paddingLeft:p3.left,paddingTop:p3.top});
		        //set height
		        var h=ele.find('.tagrender_bottom').find('.tagaddbox').outerHeight()+10;
		        ele.find('.tagbox').css({height:h});
		    },
			renderAddSelectedTags:function(renderTo,current,key,opts){
		    	var pself=this;
		        renderTo.find('.tagrender_top').render({
		            template:'formbuilder_tagadd',
		            data:{
		                top:true,
		                name:opts.name,
		                tags:current,
		                tag_info:(options.current[opts.form.info])?options.current[opts.form.info]:{},
		                render_template:opts.form.template,
		                form:opts.form
		            },
		            append:false,
		            binding:function(ele){
		                ele.find('.x_remove').stap(function(){
		                    var id=$(this).attr('data-id');
		                    options.current[key].splice(options.current[key].indexOf(id),1);
		                    $(this).parent().fadeOut(500,function(){
		                        renderTo.find('[data-tag='+id+']').remove();
		                        pself.ensureTagHeight(renderTo,opts); 
		                        self.onUpdate();
		                    })
		                    if(opts.form.linkTo){
								self.handleLinkAction(opts.form.linkTo,'remove',{
									id:id
								});
							}
		                },1,'tapactive')
		            }
		        })
		        renderTo.find('.tagrender_bottom').render({
		            template:'formbuilder_tagadd',
		            data:{
		                top:false,
		                name:opts.name,
		                tag_info:(options.current[opts.form.info])?options.current[opts.form.info]:{},
		                tags:current,
		                render_template:opts.form.template,
		                form:opts.form
		            },
		            append:false
		        })
		        pself.ensureTagHeight(renderTo,opts);
		    },
		    handleAction:function(ele,key,opts,action,actionOpts){
		    	var pself=this;
		    	switch(action){
		    		case 'add':
		    			if(!options.current[key]) options.current[key]=[];
		    			if(!options.current[opts.form.info]) options.current[opts.form.info]={};
		    			options.current[key].push(actionOpts.id);
		    			options.current[opts.form.info][actionOpts.id]=actionOpts.data;
		    		break;
		    		case 'remove':
		    			if(options.current[key].indexOf(actionOpts.id)>=0) options.current[key].splice(options.current[key].indexOf(actionOpts.id),1);
		    			if(options.current[opts.form.info]&&options.current[opts.form.info][actionOpts.id]) delete options.current[opts.form.info][actionOpts.id];
		    		break;
		    		default:
		    			console.warn('invalid handleAction');
		    			return false;
		    		break;
		    	}
		    	pself.render(key,opts,1);
                self.onUpdate();
		    },
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default&&typeof options.current[key]=='undefined'){//if default set
					options.current[key]=opts.form.default;
					if(opts.form.default_info){
						options.current[opts.form.info]=opts.form.default_info;
					}
					return opts.form.default;
				}
				return ''//best guess default!
			},
			getInfo:function(key,opts){
				if(options.current[opts.form.info]) return options.current[opts.form.info];
				return {}//best guess default!
			},
			setToggleState:function(key,opts){
				var pself=this;
				if(opts.form.toggle){
					var current=pself.getCurrent(key,opts);
					if(current){
						var t=opts.form.toggle.set;
						if(t){
							if(t.on.length){
								$.each(t.on,function(i,v){
									self.ele.find('[data-key='+v+']').show();
									self.ele.find('[data-group='+v+']').show();
								})
							}
							if(t.off.length){
								$.each(t.off,function(i,v){
									self.ele.find('[data-key='+v+']').hide();
									self.ele.find('[data-group='+v+']').hide();
								})
							}
						}
					}else{
						var t=opts.form.toggle.default;
						if(t){
							if(t.on.length){
								$.each(t.on,function(i,v){
									self.ele.find('[data-key='+v+']').show();
									self.ele.find('[data-group='+v+']').show();
								})
							}
							if(t.off.length){
								$.each(t.off,function(i,v){
									self.ele.find('[data-key='+v+']').hide();
									self.ele.find('[data-group='+v+']').hide();
								})
							}
						}
					}
				}
			},
			parseEndpointOpts:function(eOpts,key,opts){
				var opts={};
				for(var key in eOpts){
					opts[key]=_.parseString(eOpts[key],options.current);
				}
				return opts;
			},
			binding:function(ele,key,opts){
				var pself=this;
				pself.setToggleState(key,opts);//init with opts
				if(pself.getCurrent(key,opts)){
					ele.find('.x_remove').stap(function(){
						options.current[opts.form.info]=false;
						options.current[key]='';
						pself.render(key,opts,1);
	                    self.onUpdate();
	                    if(opts.form.onSet&&opts.form.onSet.clear){
	                    	self.handleLinkAction(opts.form.onSet.clear.linkTo,opts.form.onSet.clear.action,{
							});
	                    }
	                    pself.setToggleState(key,opts);//init with opts
					},1,'tapactive')
				}else{
					pself.searchbar=new modules.search({
	                    input:ele.find('.taginput'),
	                    allowAdd:(opts.form.allowAdd)?true:false,
	                    scroller:self.getScroller(),
	                    format:(opts.form.format)?opts.form.format:'',
	                    // searchOffsetTop:(self.isWebLayout())?-80:0,
	                    // searchOffsetLeft:(self.isWebLayout())?125:0,
	                    keyUpOnFocus:((opts.form.endpointOpts&&opts.form.endpointOpts.page_permission)||opts.form.keyUpOnFocus)?1:0,
	                    allowBlank:((opts.form.endpointOpts&&opts.form.endpointOpts.page_permission)||opts.form.keyUpOnFocus)?1:0,
	                    web_inline:(self.isWebLayout())?1:0,
	                    disableLoading:(self.isWebLayout())?1:0,
	                    exclude:$.extend(true,[],[pself.getCurrent(key,opts)]),
	                    endpoint:self.getEndpoint(opts.form.endpoint),
		               	endpointData:(opts.form.endpointOpts)?pself.parseEndpointOpts(opts.form.endpointOpts,key,opts):{},
	                    searchEle:self.ele.find('.mainsearchresults'),
	                    renderTemplate:opts.form.template,
	                    inline:true,
	                    multiple:false,
	                    fitSearch:true,
	                    cancelEle:ele.find('.tagcancel'),
	                    onKeyUp:function(val){
	                        if(val==''){
	                            ele.find('.tagcursor').show();
	                        }else{
	                            ele.find('.tagcursor').hide();
	                        }
	                    },
	                    onSelect:function(id,item){//might want or need full item.
	                        options.current[key]=id;
	                        if(opts.form.info){
	                        	options.current[opts.form.info]=item;
	                        }
	                        //pself.renderAddSelectedTags(ele,pself.getCurrent(key,opts),key,opts);
	                        // self.setTagHash();
	                        pself.render(key,opts,1);
	                        self.onUpdate();
	                        if(opts.form.linkTo){
								self.handleLinkAction(opts.form.linkTo,'add',{
									id:id,
									data:item
								});
							}
							if(opts.form.onSet&&opts.form.onSet.set){
		                    	self.handleLinkAction(opts.form.onSet.set.linkTo,opts.form.onSet.set.action,{
		                    		data:modules.tools.dotGet(opts.form.onSet.set.dataKey,item)
								});
		                    }
		                    pself.setToggleState(key,opts);//init with opts
	                    }
	                });
	                pself.renderAddSelectedTags(ele,pself.getCurrent(key,opts),key,opts);
				}
			}
		},
		redactor:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_redactor',
						data:$.extend(true,{},opts,{minToolbar:pself.isMinToolbar(key,opts),current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					if(!options.current[key]&&opts.form.default){
						options.current[key]=opts.form.default;
						self.onUpdate();
					}
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_redactor',
						data:$.extend(true,{},opts,{minToolbar:pself.isMinToolbar(key,opts),current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default){
					options.current[key]=opts.form.default;
					self.onUpdate();
					return opts.form.default;
				}
				return '';//best guess default!
			},
			getMatches:function(content){
			    var regex=/\[.*?\]/g;
			    var txt=content;
			    var matches=txt.match(regex);
			    return matches;
			},
			handleAction:function(ele,key,opts,action,actionOpts){
		    	var pself=this;
		    	switch(action){
		    		case 'variables_set':
		    			var ct=ele.find('.redactorcontent').redactor('source.getCode');
		    			var current=$('<div>'+ct+'</div>');
		    			var matches=pself.getMatches(ct);
		    			var newset=actionOpts.data;//default
		    			if(matches&&matches.length) $.each(matches,function(i,v){
		    				if(newset.indexOf(v)==-1){
		    					current.find('span:contains('+v+')').remove();
		    				}
		    			})
		    			options.current[key]=current.html();
		    			//remove any variables that are not supported!
		    			//destroy current instance!
		    			pself.render(key,opts,1);
		    		break;
		    		case 'variables_clear':
		    			var ct=ele.find('.redactorcontent').redactor('source.getCode');
		    			var current=$('<div>'+ct+'</div>');
		    			var matches=pself.getMatches(ct);
		    			var newset=opts.form.variables;//default
		    			if(matches&&matches.length) $.each(matches,function(i,v){
		    				if(newset.indexOf(v)==-1){
		    					current.find('span:contains('+v+')').remove();
		    				}
		    			})
		    			options.current[key]=current.html();
		    			pself.render(key,opts,1);
		    		break;
		    		default:
		    			console.warn('invalid handleAction ['+action+']');
		    			return false;
		    		break;
		    	}
		    	pself.render(key,opts,1,function(ele){
				});
		    },
		    isMinToolbar:function(key,opts){
		    	if(opts.form.nohtml&&opts.form.variables){
		    		return true;
		    	}else{
		    		return false;
		    	}
		    },
			binding:function(ele,key,opts){
				var pself=this;
				var topts={}
				opts=$.extend(true,{},opts);//ensure writting doesnt effect
				if(opts.form.plugins) topts.plugins=opts.form.plugins
				if(opts.form.variables){
					if(!topts.plugins) topts.plugins=[];
					if(topts.plugins.indexOf('variable')==-1) topts.plugins.push('variable');
					if(options.current.system_id&&options.current.system_info){
						topts.variables=options.current.system_info.variables;
					}else{
						topts.variables=opts.form.variables;
					}
				}
				if(!topts.variables&&topts.plugins&&topts.plugins.indexOf('variable')>=0){//if we dont have variables, dont show it!
					topts.plugins.splice(topts.plugins.indexOf('variable'),1);
				}
				if(!topts.plugins) topts.plugins=[];
				if(!opts.form.singleLine) topts.plugins.push('alignment');
				topts.callbacks={
			        synced: function(html){
			        	if(opts.form.nohtml){
			        		options.current[key]=$('<div>'+html+'</div>').text();
			        	}else{
			            	options.current[key]=html;
			            }
			            if(opts.form.autosave){
			            	var save={};
			            	save[key]=html;
			            	save[opts.form.autosave.versionField]=(options.current[opts.form.autosave.versionField])?options.current[opts.form.autosave.versionField]:'';
			            	self.autoSave(save,opts.form.autosave.versionField);
			            }
			            self.getScroller().setPosition(ele.find('.redactor-in'),ele);
			            self.onUpdate();
			        },
			        focus:function(){
			        	self.getScroller().setPosition(ele.find('.redactor-in'),ele);
			        },
			        keydown:function(){
			        	if(self.scroller){
			        		self.scroller.setPosition(ele.find('.redactor-in'),ele.find('.redactor-box'));
			        	}
			        }
			    }
			    topts.toolbarFixedTarget=self.getScroller().scroller;
			    topts.imageResizable=true;
			    topts.imagePosition=true;
			    if(options.getTransformOffset){
			    	topts.getTransformOffset=options.getTransformOffset;
			    }
			    topts.buttonsHide=['html','deleted'];
			    if(opts.form.buttonsHide){
			    	for (var i = opts.form.buttonsHide.length - 1; i >= 0; i--) {
			    		var item=opts.form.buttonsHide[i];
			    		topts.buttonsHide.push(item);
			    		if(topts.plugins&&topts.plugins.indexOf(item)>=0){
			    			topts.plugins.splice(topts.plugins.indexOf(item),1);
			    		}
			    	}
			    }
			    if(opts.form.buttons) topts.buttons=opts.form.buttons;
			    //for push notificaitions.
			    if(opts.form.singleLine||(opts.form.checkData&&options.current[opts.form.checkData.key]==opts.form.checkData.value)){
				    //topts.paragraphize=false;
				    // topts.singleline=true;//remove BR
				    topts.breakline=true;
				    topts.preventNewLine=true;
				}
				if(pself.isMinToolbar(key,opts)){
					topts.toolbarExternal=ele.find('.min_toolbar');
				}
				if(opts.form.dontParseLinks){
					topts.autoparseLinks=false;
				}
				if(opts.form.maxlength&&!opts.form.singleLine){
					topts.plugins.push('limiter');
					topts.plugins.push('counter');
					topts.limiter=opts.form.maxlength;
				}
				// if(!topts.plugins||!topts.plugins.length){
				if(opts.form.noToolbar){
					topts.toolbar=false;
				}
				if(options.redactor&&options.redactor.toolbarFixedTopOffset){
					topts.toolbarFixedTopOffset=options.redactor.toolbarFixedTopOffset;
				}
				if(opts.form.redactorOpts){
					topts=$.extend(true,{},topts,opts.form.redactorOpts)
				}
			    //topts.toolbarFixedTopOffset=70
			    console.log($.extend(true,{},topts))
			    if(options.current.complex&&topts.breakline) delete topts.breakline 
			    console.log(topts)
				ele.find('.redactorcontent').redactor(topts);
			}
		},
		image:{
			render:function(key,opts){
				var pself=this;
				return $.fn.render({//return template
					returntemplate:true,
					template:(opts.template)?opts.template:'formbuilder_image',
					data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
				})
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			isProcessing:function(){
				var pself=this;
				return pself.count;
			},
			count:0,
			croppers:[],
			binding:function(ele,key,opts){
				var pself=this;
				if(opts.form.multi){

				}else{
					if(opts.form.crop){
						pself.croppers.push(new modules.cropuploader($.extend(true,{
							btn:ele.find('.x_upload'),
							onSuccess:function(data,cself){
								cself.saving();
								cself.destroy();
								// alert(opts.form.crop)
								// alert(modules.tools.getImg(data,opts.form.crop))
								ele.find('.coverimg').css('backgroundImage','url('+modules.tools.getImg(data,opts.form.crop)+')');
								ele.find('.notuploaded').hide();
								options.current[key]=data;
		                        self.onUpdate();
							}
						},self.getCropData(opts.form.crop))))
					}else{
						ele.find('.x_upload').bindUploader({
		                    apiurl:app.uploadurl,
		                    data:{
		                        sizes:['full','small'],
		                        path:'/img/',
		                        site:'nectar'
		                    },
		                    radial:true,
		                    growl:false,
		                    phoneType:'both',
		                    exts:(opts.form.exts)?opts.form.exts:false,//default
		                    onError:function(msg,obj){
		                    	pself.count--;
		                    	//ele.find('.indicator').remove();
		                    	ele.find('.coverimg').css('backgroundImage','');
		                    	ele.find('.notuploaded').show();
		                        modules.toast({
		                            content:'Error: '+msg,
		                            remove:2500,
		                            icon:'icon-warning-sign'
		                        });
		                    },
		                    onPreviewReady:function(data,fileobj){//render preview
		                    	ele.find('.coverimg').css('backgroundImage','url('+data+')');
		                    	if(opts.form.display=='fitWidth'){
		                    		var i = new Image(); 
									i.onload = function(){
										var ar=i.width/i.height;
										var h=modules.tools.getImgHeight({ar:ar},{width:'body',fitWidth:1,units:'%'});
		                        		ele.find('.x_upload').css('height',h+'px');
									};
									i.src = data; 
		                        }
		                    },
		                    onProgress:function(p,fileobj,force){
		            //              var rele=ele.find('.indicator');
						        // var indicator=rele.data('radialIndicator');
						        // if(indicator){
						        //     if(p==-1){
						        //         indicator.stop();
						        //     }else{
						        //         if(!force) p=p*.95;//give more room for uploading...
						        //         indicator.animate(p,1);
						        //     }
						        // }
			                        re.find('.uploadnumber').html(p);
			                        re.find('.progbar').width(p+'%');
		                    },
		                    onUploadStart:function(options){
		                    	pself.count++;
		                    	ele.find('.notuploaded').hide();
		                    	// ele.find('.coverimg').append('<div class="sfit indicator" style="background: rgba(55,55,55,.3);z-index: 10"></div>');
		                    	// ele.find('.indicator').radialIndicator({
			                    //     barColor: '#0e345e',
			                    //     barWidth: 5,
			                    //     initValue: 0,
			                    //     roundCorner : true,
			                    //     radius:20,
			                    //     percentage: false,
			                    //     displayNumber:false,
			                    //     onAnimationComplete:function(cur_p){
			                    //         if(cur_p==100){//set to done!
			                    //             ele.find('.indicator').fadeOut(500,function(){
			                    //                 $(this).remove();
			                    //             })
			                    //         }
			                    //     }
			                    // });
			                    // ele.find('.indicator').find('canvas').css({position:'absolute',left:'50%',top:'50%',marginLeft:'-25px',marginTop:'-25px'})
		                    },
		                    onSuccess:function(data,resp,fileobj){  
		                    	pself.count--;
		                    	this.onProgress(100,fileobj,1);
		                        var img={
		                            path:resp.path,
		                            ext:resp.ext,
		                            ar:resp.ar
		                        };
		                        if(opts.form.display=='fitWidth'){
		                        	var h=modules.tools.getImgHeight(img,{width:'body',fitWidth:1,units:'%'});
		                        	ele.find('.x_upload').css('height',h+'px');
		                        }
		                        options.current[key]=img;
		                        self.onUpdate();
		                    }
		                })
					}
				}
			}
		},
		video:{
			hasBackgroundUpload:function(){
				if(this.hasVideo) return true;
				return false;
			},	
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_video',
						data:$.extend(true,{},opts,{webLayout:modules.tools.isWebLayout(),current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
						returntemplate:true,
						template:(opts.template)?opts.template:'formbuilder_video',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			binding:function(ele,key,opts){
				var pself=this;
				if(this.video) this.video.destroy();
				if(pself.getCurrent(key,opts)){
					pself.renderPreviewVideo(ele,key,opts)
				}else{
			        this.video=new modules.video({
			            ele:ele.find('.x_addvideo'),
			            transcode:{},//transcode settings!
			            data:{
			                path:'/video/'
			            },
			            onProgress:function(p,fileobj){
			                //self.postele.find('.progbar').css('width',(p*.95)+'%');
			            },
			            onClick:function(){
			                modules.keyboard_global.hide();
			            },
			            onError:function(fileobj,err){
			                //if(app.isdev) _alert(err);
			                modules.toast({
			                    content:err,
			                    icon:'icon-warning-sign',
			                    remove:3000
			                });
			            },
			            onUploadStart:function(){
			                //_alert('uploadstart')
			                // self.postele.find('.mediaselector').hide();
			            },
			            onPreviewReady:function(data,fileobj){
			            	//console.log('PREVEIWW',data,fileobj)
			               	var videodata={};
			               	pself.uri=data;
			                videodata.type='video';
			                //_alert('previewready')
			                videodata.data={
			                    uri:data,
			                    ext:fileobj.ext
			                };
			                options.current[key]=videodata;
			                pself.render(key,opts,1);
			                self.onUpdate();
			                pself.hasVideo=true;
			            },
			            onSuccess:function(data,resp,fileobj){
			                
			            }
			        });
			    }
			},
			renderPreviewVideo:function(ele,key,opts){
				var pself=this;
				var file=$.extend(true,{},pself.getCurrent(key,opts).data);
		        //if(editing) file.editing=true;
		        //file.editing=true;//always eidting
		        //file.processed=(self.cpost.id)?1:0;
		        file.processed=1;
		        file.height='200px';
		        file.container={
		            width:ele.width(),
		            height:200
		        }
		        ele.find('.videopreviewarea').html(modules.video_preview.render(file));
		        this.videoplayer=new modules.video_player({
		            ele:ele.find('.videopreviewarea').find('video')
		        })
		        //bindings!
		        ele.find('.x_remove').stap(function(){
		            if(pself.video) pself.video.abort();
		            options.current[key]=false;
	                pself.render(key,opts,1);
	                self.onUpdate();
		        },1,'tapactive');
			}
		},
		icon:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_icon',
						data:$.extend(true,{},opts,{webLayout:modules.tools.isWebLayout(),current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
					returntemplate:true,
					template:(opts.template)?opts.template:'formbuilder_icon',
					data:$.extend(true,{},opts,{webLayout:modules.tools.isWebLayout(),current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			ensureIcons:function(cb){
				if(window._iconCache){
					cb(1);
				}else{
					modules.api({
			            url:app.sapiurl+'/icons',
			            data:{},
			            timeout:5000,
			            callback:function(resp){
			               if(resp.success){
			               		window._iconCache=resp.icons;
			               		cb(1)
			               }else{
			               		cb(0,resp.error);
			               }
			            }
			        });
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			search:{},
			loadIcons:function(ele,key,opts){
				var pself=this;
				pself.ensureIcons(function(success,error){
					if(success){
						ele.find('.iconlist').render({
							template:'formbuilder_iconcontent',
							append:false,
							data:{
								icons:window._iconCache,
								search:(pself.search[key])?pself.search[key]:''
							},
							binding:function(tele){
								ele.find('.iconitem').stap(function(){
									var icon=$(this).attr('data-icon');
									options.current[key]=icon;
                                    self.onUpdate();
                                    pself.render(key,opts,1);
                                    $.fn.alert.closeAlert();
								},1,'tapactive');
							}
						})
					}else{
						modules.loadError({
			                ele:ele.find('.iconlist'),
			                error:error,
			                onRetry:function(){
			                    pself.loadIcons(ele,key,opts);
			                }
			            })
					}
				})
			},
			binding:function(ele,key,opts){
				var pself=this;
				ele.find('.x_select').stap(function(){
					//body alert!
					$('body').alert({
						icon:false,
						image:false,
						buttons:false,
						template:'formbuilder_iconpicker',
						width:800,
						binding:function(ele){
							ele.find('.x_search').on('input',function(){
								pself.search[key]=$(this).val();
								pself.loadIcons(ele,key,opts);
							})
							pself.loadIcons(ele,key,opts);
						}
					})
				},1,'tapactive')
			}
		},
		location:{
			render:function(key,opts,rerender){
				var pself=this;
				if(rerender){
					self.ele.find('[data-key='+key+']').render({
						replace:true,
						template:(opts.template)?opts.template:'formbuilder_location',
						data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key}),
						binding:function(ele){
							pself.binding(ele,key,opts);
						}
					})
				}else{
					return $.fn.render({//return template
					returntemplate:true,
					template:(opts.template)?opts.template:'formbuilder_location',
					data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
					})
				}
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return {};//best guess default!
			},
			renderLocationSelector:function(oele,key,opts,clear){
				var pself=this;
				var current=pself.getCurrent(key,opts);
				oele.render({
		            template:'formbuilder_address',
		            data:{
		            	data:(clear)?{}:current,
		            	apt:(opts.nomore)?0:1,
		            	name:opts.name
		            },
		            append:false,
		            binding:function(ele){
		            	ele.find('.x_apt').on('input',function(){
							options.current[key].more=$(this).val();
						})
						ele.find('.x_clearinput').stap(function(){
							self.clear();
						},1,'tapactive')
						ele.find('.x_clear').stap(function(){
							options.current[key]={};
							self.onUpdate();
							pself.render(key,opts,1);
							if(self.inputarea) self.inputarea.destroy();
							self.hideInput();
						},1,'tapactive')
						ele.find('.x_removecity').stap(function(){
							//options.current[key]={};
							self.onUpdate();
							pself.renderLocationSelector(oele,key,opts,1);
						},1,'tapactive')
						ele.find('.addressinput').on('keyup input paste',function(){
							if(!$(this).val()){
								ele.find('.resultslist').html('');
								return false;
							}
							ele.find('.resultslist').html('<div style="padding:20px;text-align:center;font-size:16px;"><i class="icon-refresh animate-spin"></i> Searching</div>');
							var types=(opts&&opts.types)?opts.types:['poi','place','address'];
							var val=$(this).val();
							modules.geocode.search(val,{types: types},function(res){//'(cities)'
								ele.find('.resultslist').render({
									template:'input_address_list',
									append:false,
									data:{
										data:res,
										text:val
									},
									binding:function(ele){
										ele.find('.searchrow').stap(function(){
											var index=$(this).attr('data-index');
											if(index=='text'){
												options.current[key]={
		                                    		text:val
		                                    	}
		                                    	if(self.inputarea) self.inputarea.destroy();
												self.hideInput();
												pself.render(key,opts,1);
												self.onUpdate();
											}else{
												var v=res[parseInt(index,10)];
												options.current[key]={
		                                    		id:v.id,
		                                    		data:v
		                                    	}
		                                    	pself.renderLocationSelector(oele,key,opts);
		                                    	//may want more address
		                                    	self.onUpdate();
		                                    }
										},1,'tapactive');
									}
								})
		            		});
						})
						setTimeout(function(){
							ele.find('.addressinput').focus();
						},50)
		            }
		        });
			},
			binding:function(ele,key,opts){
				var pself=this;
				ele.stap(function(){
					if(modules.keyboard_global) modules.keyboard_global.hide();
					self.showInput(ele,{
						title:'Select Location'
					},function(ele){
						pself.renderLocationSelector(ele,key,opts);
					},function(ele,cb){
						var v=pself.getCurrent(key,opts);
						options.current[key]=v;
						self.onUpdate();
						pself.render(key,opts,1);
						cb();
					})
				},1,'tapactive');
			}
		},
		link:{
			render:function(key,opts){
				var pself=this;
				return $.fn.render({//return template
					returntemplate:true,
					template:(opts.template)?opts.template:'formbuilder_link',
					data:$.extend(true,{},opts,{current:pself.getCurrent(key,opts),key:key})
				})
			},
			getCurrent:function(key,opts){
				if(options.current[key]) return options.current[key];
				if(opts.form.default) return opts.form.default;
				return '';//best guess default!
			},
			binding:function(ele,key,opts){

			}
		}
	}
	this.isProcessing=function(){
		var processing=0;
		$.each(self.types,function(i,v){
			if(v.isProcessing) processing+=v.isProcessing();
		})
		if(processing) return true;
		else return false;
	}
	this.validateData=function(type,field,opts){
		var ret=false;
		switch(type){
			case 'match':
				if(opts.field){
					if(options.current[opts.field]&&options.current[field]&&options.current[opts.field]==options.current[field]){
						ret=true;
					}
				}
			break;
			case 'email':
				if(self.tests.email(options.current[field])){
					ret=true;
				}
			break;
			default:
				ret=true;
			break;
		}
		return ret;
	}
	this.tests={
		email:function(email) {
		  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
		}
	}
	this.loc=function(key,data){
		var locs={
			missing_field:'Missing Data: [field]',
			invalid_email:'Please enter a valid email',
			emails_must_match:'Your email addresses must match'
		}
		if(locs[key]) return _.parseString(locs[key],data);
		return key
	}
	this.getValidationErrors=function(){
		var ret=[];
		var missing=self.getMissing();
		$.each(options.schema.fields,function(i,v){
			if(missing.indexOf(i)>=0){
				ret.push(self.loc('missing_field',{field:v.name}));
			}else{
				if(v.form&&v.form.validate){
					//console.log(v.form.validate)
					if(typeof v.form.validate=='object') $.each(v.form.validate,function(ti,tv){
						if(!self.validateData(ti,i,tv)){
							ret.push(self.loc(tv.error));
						}
					})
				}
			}
		});
		return ret;
	}
	self.init();
}