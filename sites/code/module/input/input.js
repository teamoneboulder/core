modules.input=function(options){
	var self=this;
	if(!options.render_template) options.render_template='modules_mobilealert_item';
	if(!options.data) options.data={};
	self.options=options;
	self.enabled=true;
	this.init=function(){
		//render placeholder
		self.renderPlaceholder();
	}
	this.enable=function(){
		self.enabled=true;
	}
	this.disable=function(){
		self.enabled=false;
	}
	this.renderPlaceholder=function(){
		if(options.allowWebInput&&_.isWebLayout()){
			self.webLayout=true;
			switch(options.type){
				case 'number':
					options.ele.render({
						replace:true,
						template:'input_number_web',
						binding:function(ele){
							ele.find('input').on('keyup',function(e){
								if(options.format=='decimal'){
									if(parseFloat(this.value.replace(/[^0-9.]/g, ''))<1000){
										if (this.value != '$'+this.value.replace(/[^0-9.]/g, '')) {
									       this.value = '$'+(this.value.replace(/[^0-9.]/g, ''));
									    }
									    self.lastValue=this.value;
									}else{
										if(this.value.replace(/[^0-9.]/g, '')!=''){
											this.value=self.lastValue;
										}
									}
									options.data={
										current:parseFloat(this.value.replace(/[^0-9.]/g, ''))
									}
									if(options.onSet) options.onSet(options.data,options);
								}else{
									if(parseFloat(this.value.replace(/[^0-9]/g, ''))<1000){
										if (this.value != '$'+this.value.replace(/[^0-9]/g, '')) {
									       this.value = '$'+(this.value.replace(/[^0-9]/g, ''));
									    }
									    self.lastValue=this.value;
									}else{
										if(this.value.replace(/[^0-9]/g, '')!=''){
											this.value=self.lastValue;
										}
									}
									options.data={
										current:parseFloat(this.value.replace(/[^0-9]/g, ''))
									}
									if(options.onSet) options.onSet(options.data,options);
								}
							})
						}
					});
				break;
				default:
					console.warn('Invalid options.type for webinput');
				break;
			}
		}else{
			if(options.ele){
				options.ele.render({
					template:'input_area',
					append:false,
					data:{
						inline:(options.inlineDisplay)?1:0,
						keepPlaceholder:(options.placeholder)?1:0,
						type:options.type,
						value:self.getValue(1),
						placeholder:options.title
					},
					binding:function(ele){
						if(options.clickArea){
							if(!self.clickAreaBound){
								options.clickArea.stap(function(){
									if(self.enabled) self.show();
								},1,'tapactive')
							}
							self.clickAreaBound=true;
						}else{
							ele.stap(function(){
								if(self.enabled) self.show();
							},1,'tapactive')
						}
					}
				})
			}
			if(options.clickEle){
				options.clickEle.stap(function(){
					if(self.enabled) self.show();
				},1,'tapactive')
			}
		}
	}
	this.getPermissonIcon=function(val){
		var icon='';
		if(!val) val=options.data.perm;
		switch(val){
			case 'public':
				icon='icon-globe';
			break;
			case 'friends':
				icon='icon-friend-check';
			break;
			case 'private':
				icon='icon-lock';
			break;
		}
		return '<i class="'+icon+'"></i>';
	}
	this.getValue=function(formatted){
		var ret='';
		var showPerm=(options.noperms||(options.opts&&options.opts.noperms))?0:1;
		switch(options.type){
			case 'select':
				if(formatted) ret=options.formatData(options.data);
				else ret=options.data;
			break;
			case 'number':
				if(formatted) ret=options.formatData(options.data);
				else ret=options.data;
			break;
			case 'gender':
				if(formatted){
					if(options.data.gender){
						ret=app.loc(options.data.gender)+((options.data.more)?' + '+options.data.more.limitlength(14):'')+((showPerm)?'<span style="float:right;" class="onboardcolor">'+self.getPermissonIcon()+'</span>':'');
					}else{
						ret='';
					}
				}else{
					ret=options.data;
				}
			break;
			case 'birthday':
				if(formatted){
					if(options.data.birthday&&options.data.sign){
						ret=modules.moment.format(modules.moment.parse(options.data.birthday),'birthday',false,1)+ '<span style="font-size:12px;margin-left:8px">(<i class="icon-sun-'+options.data.sign+'"></i> '+modules.zodiac.map[options.data.sign].name+')</span>'+((showPerm)?'<span style="float:right;" class="onboardcolor">'+self.getPermissonIcon()+'</span>':'');
					}else if(options.data.sign){
						ret=modules.zodiac.map[options.data.sign].name+((showPerm)?'<span style="float:right;" class="onboardcolor">'+self.getPermissonIcon()+'</span>':'');
					}else{
						ret='';
					}
				}else{
					ret=options.data;					
				}
			break;
			case 'phone':
				if(formatted){
					if(options.data.number){
						ret='<div class="iti-flag '+options.data.iso2+'" style="display:inline-block"></div> +'+options.data.code+' '+options.data.number.toPhoneNumber()+((showPerm)?'<span style="float:right;" class="onboardcolor">'+self.getPermissonIcon()+'</span>':'');
					}else{
						ret='';
					}
				}else{
					ret=$.extend(true,{},self.phonenumber.getNumber(),{perm:options.data.perm})
				}
			break;
			case 'address':
				if(formatted){
					if(options.data.id){
						var line2='';
						if(options.data.apt){
							line2=' ('+options.data.apt+')';
						}
						ret='<table style="width:100%;color:#888;margin-bottom:3px"><tr><td><div style="font-size:16px;">'+app.location.getName(options.data.info,'simple')+line2+'</div></td>'+((showPerm)?'<td style="width:30px;text-left:center;font-size:22px;vertical-align:bottom;" class="onboardcolor">'+self.getPermissonIcon()+'</td>':'')+'</tr></table>';
					}else{
						ret='';
					}
				}else{
					ret=options.data
				}
			break;
			case 'email':
				if(formatted){
					if(options.data.email){
						ret=options.data.email+((showPerm)?'<span style="float:right;" class="onboardcolor">'+self.getPermissonIcon()+'</span>':'');					
					}else{
						ret='';
					}
				}else{
					ret=options.data
				}
			break;
			default:
				_alert('invalid input type');
			break;
		}
		if(!formatted&&!options.data.perm&&!(options.noperms||(options.opts&&options.opts.noperms))){
			modules.toast({
				content:'Please set your permissions before saving.',
				icon:'icon-warning-sign'
			});
			ret=false;
		}
		if(formatted&&ret){
			return '<span class="onboardcolor">'+ret+'</span>';
		}
		return ret;
	}
	this.show=function(){
		if(_.isWebLayout()){
			if(options.alert){
				self.inputarea=new modules.webalert({
					display:{
						alert:{
							template:'input_page_alert',
							tempdata:options
						}
					},
					binding:function(ele){
						self.ele=ele;
						ele.find('.x_closer').stap(function(){
							self.inputarea.destroy();
						},1,'tapactive')
						ele.find('.x_set').stap(function(){
							self.set();
							self.inputarea.destroy();
						},1,'tapactive');
						self.renderInput();
					}
				})
				self.inputarea.show();
			}else{
				self.inputarea=new modules.webcontext({
					contentTemplate:'input_page_web',
					data:options,
					binding:function(ele){
						self.ele=ele;
						ele.find('.x_closer').stap(function(){
							self.inputarea.destroy();
						},1,'tapactive')
						ele.find('.x_set').stap(function(){
							self.set();
							self.inputarea.destroy();
						},1,'tapactive');
						self.renderInput();
					},
					disableMouseOff:true,
					display:{
						ele:(options.clickEle)?options.clickEle:options.ele,
						container:options.container,
						offset:{
						},
						locations:['topright','topleft']
					}
				})
				self.inputarea.show();
			}
		}else{
			var rele=(options.renderTo)?options.renderTo:$('body');
			rele.render({
				template:(options.template)?options.template:'input_page',
				data:options,
				binding:function(ele){
					self.ele=ele;
					ele.find('.x_closer').stap(function(){
						self.hide();
					},1,'tapactive')
					ele.find('.x_set').stap(function(){
						self.set();
					},1,'tapactive')
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
				        		self.hide();
				        	}else{
				        		TweenLite.to(ele.find('.pane'),.3,{y:0});
				        	}
				        }
				    });
				    var hideviews=['address','gender'];
				    if(modules.keyboard_global) modules.keyboard_global.overrides={
						onKeyboardWillShow:function(h){
							if(hideviews.indexOf(options.type)>=0) self.ele.addClass('condense')
							TweenLite.to(self.ele.find('.content'),.3,{bottom:h})
						},
						onKeyboardWillHide:function(){
							if(hideviews.indexOf(options.type)>=0) self.ele.removeClass('condense')
							TweenLite.to(self.ele.find('.content'),.3,{bottom:0})
						}
					}
				    TweenLite.set(ele.find('.pane'),{y:'100%'})
				    //render
				    self.renderInput();
					setTimeout(function(){
						TweenLite.to(ele,.3,{background:'rgba(55,55,55,.3)'})
						TweenLite.to(ele.find('.pane'),.3,{y:'0%'})
					},50)
				}
			})
		}
	}
	this.set=function(){
		if(options.validate&&!options.validate(options.data)) return (options.onValidationError)?options.onValidationError(options):console.warn('Validation Error: impliment onValidationError');
		var c=self.getValue();
		if(!c) return false;
		if(options.onSet) options.onSet(c,options);
		//re-render input!
		options.data=c;
		self.renderPlaceholder();
		self.hide();
	}
	this.clear=function(){
		if(options.onSet) options.onSet({},options);
		//re-render input!
		options.data={};
		self.renderPlaceholder();
		self.hide();
	}
	this.getPerm=function(){
		if(options.data.perm) return options.data.perm;
		if(options.defaultPerm) return options.defaultPerm;
		return false;
	}
	this.renderInput=function(){
		switch(options.type){
			case 'select':
				self.ele.find('.inputarea').render({
					template:(options.template)?options.template:'input_select',
					data:{
					},
					append:false,
					binding:function(ele){
						 ele.find('.scroller').mobiscroll().scroller({
					        theme: 'ios',
					        width: 150,
					        display:'inline',
					        wheels: [options.wheels],
					        onChange:function(event,inst){
					        	options.data.values[event.index]=event.valueText;
					        }
					    })
						if(options.data.values){
						 	ele.find('.scroller').mobiscroll('setArrayVal',options.data.values);
						 }
						ele.find('.x_clearinput').stap(function(){
							self.clear();
						},1,'tapactive')
					}
				})
			break;
			case 'number':
				self.ele.find('.inputarea').render({
					template:(options.template)?options.template:'input_number',
					data:{
					},
					append:false,
					binding:function(ele){
						 self.curinstance=ele.mobiscroll().numpad({ 
				            theme: mobiscroll.settings.theme,
				            preset: 'decimal',
				            scale:0,
				            display:'inline',
				            min: 0,
				            max:(options.data.max)?options.data.max:1000,
				           	//deleteIcon:'',
				            prefix: '$',
				            onClose:function(){
				               
				            }
				        });
						self.curinstance.change(function (ev) {
        					options.data.current =ele.mobiscroll('getVal')
        				})
				        //add back button
				        // ele.append('<div class="x_delete" style="text-align:center;position:absolute;bottom:5px;right:0px;width:33%;padding:10px;z-index:99999" class="truebox"><i class="icon-level-up" style="font-size:30px;color:black"></i></div>')
				        // ele.find('.x_delete').stap(function(){
				        //     var cv=ele.mobiscroll('getArrayVal');
				        //     if(cv&&cv.length){
				        //         cv.splice(cv.length-1,1);
				        //         condense.log(cv);
				        //         ele.mobiscroll('setVal',parseFloat(cv.join()));
				        //     }
				        // },1,'tapactive')
				        if(options.data.current){
				        	ele.mobiscroll('setVal',options.data.current);
				        }
					}
				})
			break;
			case 'gender':
				self.ele.find('.inputarea').render({
					template:'input_gender',
					data:{
						description:(options.data.more)?options.data.more:'',
						perms:(options.noperms||(options.opts&&options.opts.noperms))?0:1
					},
					append:false,
					binding:function(ele){
						ele.find('textarea').on('keyup',function(){
							options.data.more=$(this).val();
						})
						ele.find('.autosize').autosize();
						ele.find('.maxlengthbox').maxlength();
						ele.find('.x_gender').stap(function(){
							if($(this).hasClass('selected')) return false;
							ele.find('.x_gender').removeClass('selected highlightcolor');
							$(this).addClass('selected highlightcolor');
							options.data.gender=$(this).attr('data-type');
						},1,'tapactive');
						if(options.data.gender){
							ele.find('[data-type='+options.data.gender+']').addClass('selected highlightcolor');
						}
						ele.find('.x_perm').stap(function(){
							if($(this).hasClass('selected')) return false;
							ele.find('.x_perm').removeClass('selected highlightcolor');
							$(this).addClass('selected highlightcolor');
							options.data.perm=$(this).attr('data-perm');
						},1,'tapactive');
						var perm=self.getPerm();
						if(perm){
							ele.find('[data-perm='+perm+']').addClass('selected highlightcolor');
							options.data.perm=perm;
						}
						ele.find('.x_clearinput').stap(function(){
							self.clear();
						},1,'tapactive')
					}
				})
			break;
			case 'address':
				self.renderAddress();
			break;
			case 'email':
				self.ele.find('.inputarea').render({
		            template:'input_email',
		            data:{
		            	email:(options.data.email)?options.data.email:''
		            },
		            binding:function(ele){
		            	ele.find('input').on('keyup input paste',function(){
		            		options.data.email=$(this).val().toLowerCase();
		            		$(this).val(options.data.email)
		            	})
		                ele.find('.x_perm').stap(function(){
							if($(this).hasClass('selected')) return false;
							ele.find('.x_perm').removeClass('selected highlightcolor');
							$(this).addClass('selected highlightcolor');
							options.data.perm=$(this).attr('data-perm');
						},1,'tapactive');
						var perm=self.getPerm();
						if(perm){
							ele.find('[data-perm='+perm+']').addClass('selected highlightcolor');
							options.data.perm=perm;
						}
						ele.find('.x_clearinput').stap(function(){
							self.clear();
						},1,'tapactive')
		            }
		        });
			break;
			case 'phone':
				self.ele.find('.inputarea').render({
		            template:'input_phone',
		            data:{
		            	perms:(options.noperms||(self.options.opts&&self.options.opts.noperms))?0:1
		            },
		            binding:function(ele){
		            	self.phonenumber=new modules.phonenumber({
		                    ele:ele.find('.phoneinput'),
		                    phone:self.options.data
		                });
		               	ele.find('.x_perm').stap(function(){
							if($(this).hasClass('selected')) return false;
							ele.find('.x_perm').removeClass('selected highlightcolor');
							$(this).addClass('selected highlightcolor');
							options.data.perm=$(this).attr('data-perm');
						},1,'tapactive');
						var perm=self.getPerm();
						if(perm){
							ele.find('[data-perm='+perm+']').addClass('selected highlightcolor');
							options.data.perm=perm;
						}
						ele.find('.x_clearinput').stap(function(){
							self.clear();
						},1,'tapactive')
		            }
		        });
			break;
			case 'birthday':
				var nav=[
					{_id:'birthday',name:'Birthday',selected:((options.data.sign&&!options.data.birthday))?false:true},
					{_id:'or',name:' or ',notselectable:true},
					{_id:'sunonly',name:'Sun Sign Only',selected:(options.data.sign&&!options.data.birthday)?true:false}
				];
				if(!options.data.birthday) options.data.tempbirthday='06/24/1989';
		        if(!options.data.sign) options.data.tempsign='cancer';
				self.ele.find('.inputarea').render({
		            template:'input_birthday',
		            data:{
		            	//nav:nav,
		            	selected_sign:(options.data.sign)?options.data.sign:options.data.tempsign,
		            	signs:{
		            		order:modules.zodiac.order,
		            		list:modules.zodiac.map
		            	}
		            },
		            binding:function(ele){
		            	window._ui.register('birthdaynav',{
		                    onNavSelect:function(cur,rele){
		                       	self.ele.find('.pages').hide();
								self.ele.find('[data-page='+cur+']').show();
								self.page=cur;
		                    }
		                }) 
		      			ele.find('.x_perm').stap(function(){
							if($(this).hasClass('selected')) return false;
							ele.find('.x_perm').removeClass('selected highlightcolor');
							$(this).addClass('selected highlightcolor');
							options.data.perm=$(this).attr('data-perm');
						},1,'tapactive');
						var perm=self.getPerm();
						if(perm){
							ele.find('[data-perm='+perm+']').addClass('selected highlightcolor');
							options.data.perm=perm;
						}
		                ele.find('.signitem').stap(function(){
		                	if($(this).hasClass('highlightcolor')) return false;
		                	ele.find('.signitem').removeClass('highlightcolor');
		                	$(this).addClass('highlightcolor');
		                	//store!
		                	options.data.sign=$(this).attr('data-id');
		                	if(options.data.birthday) delete options.data.birthday;
		                },1,'tapactive');
		            	ele.find('.birthday').mobiscroll().date({
							display:'inline',
							defaultValue:new Date((options.data.birthday)?options.data.birthday:options.data.tempbirthday),
							onChange:function(e,i){
								options.data.birthday=e.valueText;
								options.data.sign=modules.zodiac.getSign(e.valueText);
								// self.ele.find('.zodiac').render({
								// 	template:'input_birthday_zodiac',
								// 	append:false,
								// 	data:{
								// 		sign:modules.zodiac.map[options.data.sign]
								// 	}
								// })
							}
					    });
					 //    self.ele.find('.zodiac').render({
						// 	template:'input_birthday_zodiac',
						// 	append:false,
						// 	data:{
						// 		sign:(options.data.sign)?modules.zodiac.map[options.data.sign]:modules.zodiac.map.cancer
						// 	}
						// })
						if(options.data.sign&&!options.data.birthday){
							self.ele.find('.pages').hide();
							self.ele.find('.swipenavitem').removeClass('selected');
							self.ele.find('[data-nav=sunonly]').addClass('selected')
							self.ele.find('[data-page=sunonly]').show();
							self.page='sunonly';
						}else{
							self.ele.find('.pages').hide();
							self.ele.find('.swipenavitem').removeClass('selected');
							self.ele.find('[data-nav=birthday]').addClass('selected')
							self.ele.find('[data-page=birthday]').show();
							self.page='birthday';
						}
						if(!options.data.birthday&&!options.data.sign){
							options.data.birthday=options.data.tempbirthday;
							options.data.sign=options.data.tempsign;
						}
						ele.find('.x_clearinput').stap(function(){
							self.clear();
						},1,'tapactive')
		            }
		        });
			break;
			default:
				_alert('invalid input type');
			break;
		}
	}
	this.renderAddress=function(){
		self.ele.find('.inputarea').render({
            template:'input_address',
            data:{
            	data:options.data,
            	perms:(options.noperms||(self.options.opts&&self.options.opts.noperms))?0:1,
            	apt:(options.noapt||(self.options.opts&&self.options.opts.noapt))?0:1
            },
            append:false,
            binding:function(ele){
            	ele.find('.x_apt').on('input',function(){
					options.data.apt=$(this).val();
				})
				if(ele.find('.x_perm').length){
					ele.find('.x_perm').stap(function(){
						if($(this).hasClass('selected')) return false;
						ele.find('.x_perm').removeClass('selected highlightcolor');
						$(this).addClass('selected highlightcolor');
						options.data.perm=$(this).attr('data-perm');
					},1,'tapactive');
					var perm=self.getPerm();
					if(perm){
						ele.find('[data-perm='+perm+']').addClass('selected highlightcolor');
						options.data.perm=perm;
					}
				}
				ele.find('.x_clearinput').stap(function(){
					self.clear();
				},1,'tapactive')
				ele.find('.x_removecity').stap(function(){
					options.data.id='';
					options.data.apt='';
					options.data.info={};
					self.renderAddress();
				},1,'tapactive')
				ele.find('.addressinput').on('keyup',function(){
					if(!$(this).val()){
						self.ele.find('.resultslist').html('');
						return false;
					}
					self.ele.find('.resultslist').html('<div style="padding:20px;text-align:center;font-size:16px;"><i class="icon-refresh animate-spin"></i> Searching</div>');
					var types=(self.options.opts&&self.options.opts.types)?self.options.opts.types:[];
					modules.geocode.search($(this).val(),{types: types},function(res){//'(cities)'
            			if(res&&res.length){
            				self.ele.find('.resultslist').html('');
	                        $.each(res,function(i,v){
	                            self.ele.find('.resultslist').render({
	                                template:'input_address_search',
	                                data:{data:v},
	                                bindings:[{
	                                    type:'click',
	                                    binding:function(){
	                                    	options.data.id=v.id;
	                                    	options.data.info=v;
	                                        self.renderAddress();
	                                    }
	                                }]
	                            })
	                        })
            			}else{
            				self.ele.find('.resultslist').html('<div style="padding:20px;text-align:center;font-size:16px;"><i class="icon-warning-sign"></i> No Results</div>');
            			}
            		});
				})
            }
        });
	}
	this.hide=function(){
		if(self.webLayout) return false;
		if(modules.keyboard_global) modules.keyboard_global.hide();
		setTimeout(function(){
			TweenLite.to(self.ele,.5,{background:'rgba(55,55,55,0)'})
			TweenLite.to(self.ele.find('.pane'),.5,{y:'100%',onComplete:function(){
				setTimeout(function(){
					self.destroy();
				},50);
			}})
		},50)
	}
	this.destroy=function(){
		if(modules.keyboard_global) modules.keyboard_global.overrides=false;
		if(self.dragger) self.dragger[0].kill();
		if(self.phonenumber) self.phonenumber.destroy();
		self.ele.remove();
		delete self;
	}
	this.init();
}