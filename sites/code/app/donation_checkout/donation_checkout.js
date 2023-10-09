modules.donation_checkout=function(options,instance){
	var oself=self=this;
	self.options=options;
	this.show=function(){
		async.parallel([self.showLoading,self.reserve],function(){
            self.onViewReady();
        })
	}
	this.reserve=function(cb){
		_ui.pageloader.render({theme:false,themeClass:'lds-ellipsis-black'},self.ele.find('.pagepane'),1);
		app.api({
			url:app.sapiurl+'/module/donation_checkout/reserve',
			data:{
				fundraiser:options.fundraiser.id,
				tickets:options.tickets,
				uuid:window.uuid//temp
			},
    		callback:function(resp){
    			self.reserveResp=resp;
    			cb();
    		}
    	});
	}
	this.onViewReady=function(){
		if(self.reserveResp.error){
			if(self.reserveResp.error=='ticket_sales_closed'){
				self.ele.find('.pagepane').render({
					template:'donation_checkout_closed',
					append:false,
					data:{
						message:(self.reserveResp.message)?self.reserveResp.message:''
					}
				})
			}else{
				modules.loadError({
	                ele:self.ele.find('.pagepane'),
	                error:self.reserveResp.error,
	                onRetry:function(){
	                    self.reserve(function(){
	                        self.onViewReady();
	                    });
	                }
	            })
			}
			return false;
		}
		self.ele.find('.pagepane').html('');
		self.ensurePage();
		var length=(60*10);
		if(!options.fundraiser){
			self.startCountdown({
				onFrame:function(diff){
					var remaining=length-diff;
					var time=remaining.toTime();
					self.ele.find('.timeremaining').html(time);
				},
				onComplete:function(){
	               //show retry
	            }, 
	            max:length
			});
		}
	}
	this.cancelCountdown=function(){
        self.start=false;
        window.cancelAnimationFrame(self.ani);
    }
	this.startCountdown=function(opts){
		self.countdownopts=opts;
		self.ani=window.requestAnimationFrame(self.count);
	}
	this.count=function(timestamp){
        if (!self.start) self.start = timestamp;
        var diff=(timestamp-self.start)/1000;
        if(app.isdev) diff*=20;//make it 20x faster in dev
        if(diff<self.countdownopts.max){
	        if(self.countdownopts.onFrame) self.countdownopts.onFrame(diff);
            self.ani=window.requestAnimationFrame(self.count);
        }else{
            self.cancelCountdown();
            if(self.countdownopts.onComplete) self.countdownopts.onComplete(diff);
        }
    }
	this.showLoading=function(cb){
		var rele=(options.renderTo)?options.renderTo:$('body');
		rele.render({
			template:(options.template)?options.template:'donation_checkout_page',
			data:options,
			binding:function(ele){
				oself.ele=self.ele=ele;
				ele.find('.x_closer').stap(function(){
					self.hide();
				},1,'tapactive')
				self.dragger=Draggable.create(ele.find('.swiper'), {
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
			    TweenLite.set(ele.find('.pane'),{y:'100%'})
			    //render
				setTimeout(function(){
					TweenLite.to(ele,.3,{background:'rgba(55,55,55,.3)'})
					TweenLite.to(ele.find('.pane'),.3,{y:'0%',onComplete:function(){
						cb();
					}})
				},50)
			}
		})
	}
	this.currentPage=0;
	this.getPages=function(){
		if(app.user.profile&&app.user.profile.id&&!app.forceAnon){
			if((options.donation===0||options.donation)&&!modules.tools.isWebLayout()){
				return ['donation','payment','thanks'];//could be other or special order
			}else{
				return ['payment','thanks'];//could be other or special order
			}
		}else{
			if((options.donation===0||options.donation)&&!modules.tools.isWebLayout()){
				return ['login','donation','payment','thanks'];//could be other or special order
			}else{
				return ['login','payment','thanks'];//could be other or special order
			}
		}
	}
	this.nextPage=function(){
		self.currentPage++;
		self.ensurePage();
	}
	this.prevPage=function(){
		self.currentPage--;
		self.ensurePage();
	}
	this.getLeft=function(page){
		return self.getPages().indexOf(page)*100;
	}
	this.getDiscountOfOrder=function(total){
		var ret=0;
		if(self.discount.discount_percent){
			//apply to tickets..
			ret=Math.floor(total*(parseFloat(self.discount.discount_percent)/100));
		}
		return ret;
	}
	this.getReceipt=function(){
		var total=0;
		var discount=0;
		if(options.donation){
			total=options.donation;
		}else{
			$.each(options.tickets,function(i,v){
				if(v.quantity&&v.data.price){
					total+=(v.quantity*v.data.price);
				}
			});
		}
		var original_total=total;
		if(self.discount){
			discount=self.getDiscountOfOrder(total);
			if(discount){
				total=total-discount;
			}
		}
		if(self.reserveResp.absorb_fees){
			var fee=0;
		}else{
			var fee=modules.tools.calcStripeFee(total);
		}
		total+=fee;
		return {
			donate_amount:(options.donation)?options.donation:'',
			original_total:original_total,
			total:total,
			discount:discount,
			fee:fee,
			to:options.to,
			tickets:options.tickets,
			fundraiser:options.fundraiser
		}
	}
	this.pages={
		cart:{
			render:function(){
				var pself=this;
				if(!pself.ele){
					self.ele.find('.pagepane').render({
						template:'donation_checkout_cart',
						data:{
							tickets:options.tickets,
							left:self.getLeft('cart')
						},
						binding:function(ele){
							pself.ele=ele;
							ele.find('.x_next').stap(function(){
									self.nextPage();
							},1,'tapactive');
						}
					})
				}
			}
		},
		addCard:function(opts){
    		var self=this;
    		self.opts=opts;
    		this.show=function(replace){
    			oself.ele.find('.pagepane').subpage({
		            loadtemplate:'donation_checkout_addcard',
		            data:{
		            },
		            onPageRendered:function(ele){
		            	self.ele=ele;
		            },
		            onPageReady:function(ele,onback){
		            	self.bindStripe();
		            	self.onback=onback;
		            	ele.find('.goback').stap(function(){
		            		self.onback();
		            	},1,'tapactive')
		            	ele.find('.x_submit').stap(function(){
		            		self.addCard();
		            	},1,'tapactive')
		            },
		            onPageReturn:function(){
		            	if(opts.onReturn) opts.onReturn();
		            }
		        });
    		}
    		this.saveCard=function(token){
    			app.api({
    				url:app.sapiurl.replace('/nectar','')+'/stripe/nectar/addcard',
    				data:{
    					stripe_token:token,
    					uuid:window.uuid
    				},
		    		callback:function(resp){
		    			if(resp.success){
		    				modules.toast({
		    					content:'Successfully Saved Card!'
		    				});
		    				if(!oself.methodresp.data) oself.methodresp.data={};
		    				if(!oself.methodresp.data.methods) oself.methodresp.data.methods=[];
		    				$.each(resp.cards.data,function(i,v){
		    					var ind=app.getIndexByKey(oself.methodresp.data.methods,v.id,'id');
		    					var obj={
		    						id:v.id,
		    						type:'card',
		    						data:v
		    					}
		    					if(ind!==false){
		    						oself.methodresp.data.methods[ind]=obj
		    					}else{
		    						oself.methodresp.data.methods.unshift(obj);
		    						if(oself.methodresp.data.methods.length==1){//first
		    							oself.methodresp.data.preferred=obj.id;
										oself.pages.payment.method=oself.methodresp.data.preferred;
									}
		    					}
		    				})
		    				oself.pages.payment.renderMethods();
		    				self.onback();
		    			}else{
		    				modules.toast({
		    					content:'Error Saving: '+resp.error
		    				})
		    			}
		    			self.ele.find('.submittext').html(self.ctext);
		            	self.submitting=false
		    		}
    			})
    		}
    		this.addCard=function(){
    			if(self.submitting) return false;
    			self.submitting=true;
    			self.ctext=self.ele.find('.submittext').html();
    			self.ele.find('.submittext').html('<i class="icon-refresh animate-spin"></i>');
    			self.stripe.createToken(self.card).then(function(result) {
		          if (result.error) {
		            // Inform the user if there was an error.
		            var errorElement = document.getElementById('card-errors');
		            errorElement.textContent = result.error.message;
		            self.ele.find('.submittext').html(self.ctext);
		            self.submitting=false
		          } else {
		            // Send the token to your server.
		            self.saveCard(result.token.id);
		          }
		        });
    		}
    		this.bindStripe=function(){
			    if(!self.ele.find('#card-element').length) return false;
			    self.stripe = Stripe(app.stripe_token);
			    // Create an instance of Elements.
			    var elements = self.stripe.elements();
			    // Custom styling can be passed to options when creating an Element.
			    // (Note that this demo uses a wider set of styles than the guide below.)
			    var style = {
			      base: {
			        color: '#32325d',
			        lineHeight: '18px',
			        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
			        fontSmoothing: 'antialiased',
			        fontSize: '16px',
			        '::placeholder': {
			          color: '#aab7c4'
			        }
			      },
			      invalid: {
			        color: '#fa755a',
			        iconColor: '#fa755a'
			      }
			    };
			    // Create an instance of the card Element.
			    self.card = elements.create('card', {style: style});

			    // Add an instance of the card Element into the `card-element` <div>.
			   // console.log($('#card-element'))
			    self.card.mount('#card-element');

			    // Handle real-time validation errors from the card Element.
			    self.card.addEventListener('change', function(event) {
			      var displayError = document.getElementById('card-errors');
			      if (event.error) {
			        displayError.textContent = event.error.message;
			      } else {
			        displayError.textContent = '';
			      }
			    });
    		}
    	},
    	login:{
    		render:function(){
				var pself=this;
				if(!pself.ele){
					self.ele.find('.pagepane').render({
						template:'donation_checkout_login',
						data:{
							left:self.getLeft('login')
						},
						binding:function(ele){
							pself.ele=ele;
							pself.scroller=new modules.scroller(ele.find('.scroller'));
							pself.form=new modules.formbuilder({
                                ele:ele.find('.content'),
                                current:{
                                	eid:options.fundraiser.id,
                                	referal:options.fundraiser.page
                                },//passed as a refernce
                                schema_type:'ticket_anon',
                                inline:true,
                                scroller:pself.scroller,
                                onUpdate:function(current){
                                    //pself.ele.addClass('showsave')
                                    var m=pself.form.getMissing();
                                    if(m.length){
                                    	pself.ele.find('.x_next').addClass('disabled');
                                    }else{
                                    	pself.ele.find('.x_next').removeClass('disabled');
                                    }
                                }
                            });
                            ele.find('.x_next').stap(function(){
                            	if($(this).hasClass('disabled')){

                            	}else{
                            		var errs=pself.form.getValidationErrors();
                            		if(errs.length){
                            			modules.toast({
                            				content:modules.formbuilder_global.getValidationError(errs)
                            			})
                            		}else{
	                            		var cd='';
	                            		pself.form.save(function(loadstate){
	                            			if(loadstate){
	                            				ele.find('.x_next').html(cd);
	                            			}else{
	                            				cd=ele.find('.x_next').html();
	                            				ele.find('.x_next').html('<i class="icon-refresh animate-spin"></i> Saving...');
	                            			}
	                            		},function(resp){//success
	                            			self.anon=resp.data;
	                            			self.nextPage();
	                            		})
	                            	}
                            	}
                            },1,'tapactive');
                            ele.find('.x_back').stap(function(){
                            	ele.find('.loginboxarea').hide();
                            	ele.find('.guestarea').show();
                            	ele.find('.loginarea').html('');
                            },1,'tapactive');
                            ele.find('.x_login').stap(function(){
                            	ele.find('.loginboxarea').show();
                            	ele.find('.guestarea').hide();
                            	var login=new modules.login({
	                                ele:ele.find('.loginarea'),
	                                prettyClass:'prettyinput3',
	                                noPlaceholder:true,
	                                onLogin:function(data){
	                                    app.user.load(data,function(){
	                                    	self.nextPage();
	                                    },true);
	                                    console.log(data);
	                                }
	                            });
                            },1,'tapactive');
						}
					})
				}
			},
    	},
		payment:{
			render:function(){
				var pself=this;
				if(!pself.ele){
					self.ele.find('.pagepane').render({
						template:'donation_checkout_payment',
						data:{
							left:self.getLeft('payment'),
							receipt:self.getReceipt(),
							fundraiser_for:(self.reserveResp&&self.reserveResp.advanced&&self.reserveResp.advanced.fundraiser_for)?self.reserveResp.advanced.fundraiser_for:''
						},
						binding:function(ele){
							pself.ele=ele;
							if(self.anon) pself.loadAnonMethods();
							else pself.loadMethods();
							ele.find('.x_terms').stap(function(){
								if($(this).hasClass('checked')){
									$(this).removeClass('checked');
									$(this).find('.checker').addClass('icon-check-empty').removeClass('icon-check');
								}else{
									$(this).addClass('checked');
									$(this).find('.checker').removeClass('icon-check-empty').addClass('icon-check');
								}
								pself.ensureButton();
							},1,'tapactive');
							ele.find('.x_viewterms').stap(function(e){
								phi.stop(e);
								$('body').alert({
									image:false,
									icon:false,
									width:600,
									zIndex:100000,
									content:'<div style="padding:20px;text-align:left">'+self.reserveResp.terms+'</div>'
								})
							},1,'tapactive')
							ele.find('.x_next').stap(function(){
								pself.check(function(){
									pself.sendPayment(function(success,resp){
										// modules.toast({
										// 	content:'Success!'
										// })
										if(self.options.onSuccess) self.options.onSuccess(resp);
										//self.hide();
										self.nextPage();
									});
								});
							},1,'tapactive');
						}
					})
				}
			},
			checkDiscount:function(){
				var pself=this;
				if(pself.sending) return false;
				pself.sending=true;
				pself.cv=pself.ele.find('.x_discount_send').html();
				pself.ele.find('.x_discount_send').html('<div style="padding:2px"><i class="icon-refresh animate-spin"></i></div>');
				app.api({
					url:app.sapiurl+'/module/donation_checkout/checkdiscount',
					data:{
						fundraiser:options.fundraiser.id,
						code:pself.code
					},
					callback:function(resp){
						pself.sending=false;
						pself.ele.find('.x_discount_send').html(pself.cv);
						if(resp.success){
							self.discount=resp.data;
							pself.renderDiscount();
							pself.updateTotal();
						}else{
							modules.toast({
								content:'Error: '+resp.error
							})
						}
					}
				});
			},
			updateTotal:function(){
				var pself=this;
				var receipt=self.getReceipt();
				pself.ele.find('.x_total').html(modules.tools.toMoney(receipt.total,1));
				pself.ele.find('.x_processing').html(modules.tools.toMoney(receipt.fee,1));
				pself.ele.find('.x_discount_total').html(modules.tools.toMoney(receipt.discount,1));
			},
			renderDiscount:function(){
				var pself=this;
				pself.ele.find('.discountarea').render({
					template:'donation_checkout_discount',
					append:false,
					data:{
						discount:(self.discount)?self.discount:''
					},
					binding:function(ele){
						ele.find('.x_remove').stap(function(){
							self.discount='';
							pself.code='';
							pself.renderDiscount();
							pself.updateTotal();
						},1,'tapactive')
						ele.find('.x_discount').on('input keyup change',function(){
							var v=$(this).val().getTagId().toUpperCase();
							pself.code=v;
							$(this).val(v);
						})
						ele.find('.x_discount_send').stap(function(){
							pself.checkDiscount();
						},1,'tapactive');
					}
				})
			},
			ensureButton:function(){
				var pself=this;
				if(pself.check(false,true)){
					pself.ele.find('.x_next').removeClass('disabled');
				}else{
					pself.ele.find('.x_next').addClass('disabled');
				}
			},
			check:function(cb,silent){
				var pself=this;
				var checked=pself.ele.find('.x_terms').hasClass('checked');
				if(!checked){
					if(!silent){
						modules.toast({
							content:'Please agree to our terms before sending payments.'
						})
					}
					return false;
				}
				if(self.anon){
					if(silent) return true;
					return cb();
				}else if(pself.method){
					if(silent) return true;
					return cb();
				}else{
					if(!silent){
						modules.toast({
							content:'Please add a payment method'
						});
					}else{
						return false;
					}
				}

			},
			renderMethods:function(){
				var pself=this;
				pself.ele.find('.methodarea').render({
					template:'donation_checkout_methods',
					append:false,
					data:{
						resp:oself.methodresp
					},
					binding:function(ele){
						ele.find('.x_addcard').stap(function(){
							var p=new self.pages.addCard({});
							p.show();
						},1,'tapactive')
						ele.find('.accountitem').stap(function(){
							ele.find('.accountitem').removeClass('selected');
							$(this).addClass('selected');
							pself.method=$(this).attr('data-id');
							pself.ensureButton();
						},1,'tapactive')
					}
				})
			},
			loadAnonMethods:function(){
				var pself=this;
				pself.ele.find('.methodarea').render({
					template:'donation_checkout_anonmethods',
					append:false,
					data:{
					},
					binding:function(ele){
						if(!ele.find('#card-element').length) return false;
					    self.stripe = Stripe(app.stripe_token);
					    // Create an instance of Elements.
					    var elements = self.stripe.elements();
					    // Custom styling can be passed to options when creating an Element.
					    // (Note that this demo uses a wider set of styles than the guide below.)
					    var style = {
					      base: {
					        color: '#32325d',
					        lineHeight: '18px',
					        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
					        fontSmoothing: 'antialiased',
					        fontSize: '16px',
					        '::placeholder': {
					          color: '#aab7c4'
					        }
					      },
					      invalid: {
					        color: '#fa755a',
					        iconColor: '#fa755a'
					      }
					    };
					    // Create an instance of the card Element.
					    self.card = elements.create('card', {style: style});

					    // Add an instance of the card Element into the `card-element` <div>.
					   // console.log($('#card-element'))
					    self.card.mount('#card-element');

					    // Handle real-time validation errors from the card Element.
					    self.card.addEventListener('change', function(event) {
					      var displayError = document.getElementById('card-errors');
					      if (event.error) {
					        displayError.textContent = event.error.message;
					      } else {
					        displayError.textContent = '';
					      }
					    });
							}
						})
			},
			loadMethods:function(){
				var pself=this;
				if(pself.loading) return false;
				pself.ele.find('.methodarea').render({
					template:'donation_checkout_methods_loading'
				})
				pself.loading=true;
				app.api({
					url:app.sapiurl+'/module/donation_checkout/methods',
					data:{
					},
					callback:function(resp){
						pself.loading=false;
						if(resp.success){
							oself.methodresp=self.methodresp=resp;
							if(oself.methodresp.data.preferred){
								//ensur it exists!
								if(app.getByKey(resp.data.methods,oself.methodresp.data.preferred,'id')){
									pself.method=oself.methodresp.data.preferred
									pself.ensureButton();
								}
							}
							pself.renderMethods();
						}else{
							//retry button!
							modules.loadError({
				                ele:pself.ele.find('.content'),
				                error:resp.error,
				                onRetry:function(){
				                    pself.loadMethods();
				                }
				            })
						}
					}
				})
			},
			sendAnonPayment:function(cb){
				var pself=this;
				self.cv=pself.ele.find('.x_sendtext').html();
				pself.ele.find('.x_sendtext').html('<i class="icon-refresh animate-spin"></i> Sending');
				self.stripe.createToken(self.card).then(function(result) {
		          if (result.error) {
		            // Inform the user if there was an error.
		            var errorElement = document.getElementById('card-errors');
		            errorElement.textContent = result.error.message;
		            self.submitting=false
		          } else {
		            // Send the token to your server.
		            pself.sendPayment(cb,result.token.id);
		          }
		        });
			},
			sendPayment:function(cb,token){
				var pself=this;
				if(self.anon&&!token) return pself.sendAnonPayment(cb);
				if(pself.sending) return false;
				if(!pself.method&&!token){
					modules.toast({
						content:'Please add or select a payment method'
					})
					return false;
				}
				if(!self.cv){
					self.cv=pself.ele.find('.x_sendtext').html();
					pself.ele.find('.x_sendtext').html('<i class="icon-refresh animate-spin"></i> Sending');
				}
				pself.sending=true;
				var data={
					receipt:self.getReceipt(),
					fundraiser:options.fundraiser.id,
					reservation:self.reserveResp.data.id
				}
				if(self.anon){
					data.stripe_token=token;
					data.anon=self.anon.id;
				}else{
					data.method=pself.method;
				}
				if(self.discount){
					data.discount=self.discount.id;
				}
				app.api({
					url:app.sapiurl+'/module/donation_checkout/send',
					data:data,
					timeout:20000,
					callback:function(data){
						pself.ele.find('.x_sendtext').html(self.cv);
						pself.sending=false;
						if(data.success){
							self.successData=data;
							cb(true,data);
						}else{
							self.cv=false;
							modules.toast({
								content:'Error: '+data.error
							})
						}
					}
				})
			}
		},
		donation:{
			render:function(){
				var pself=this;
				if(!pself.ele){
					self.ele.find('.pagepane').render({
						template:'donation_checkout_donation',
						data:{
							left:self.getLeft('donation'),
							fundraiser:options.fundraiser
						},
						binding:function(ele){
							pself.ele=ele;
							pself.form=new modules.formbuilder({
                                ele:ele.find('.content'),
                                mobileLayout:1,
                                current:{
                                },//passed as a refernce
                                schema:{
                                	order:['amount'],
                                	fields:{
                                		amount:{
                                			type:'int',
                                			required:true,
                                			form:{
                                				placeholder:'Donation Amount',
                                				type:'money',
                                				min:100
                                			}
                                		}
                                	}
                                },
                                inline:true,
                                scroller:pself.scroller,
                                onUpdate:function(current){
                                    
                                }
                            });
							ele.find('.x_next').stap(function(){
								var e=pself.form.getCurrent();
								if(!e.amount||e.amount<100){
									modules.toast({
										content:'Please enter at least $1'
									})
								}else{
									options.donation=e.amount;
									self.nextPage();
								}
							},1,'tapactive')
							ele.find('.x_learnmore').stap(function(){
								ele.find('.x_learnmore').find('.textcontent').html('<i class="icon-refresh animate-spin"></i>')
								self.learnMore();
							},1,'tapactive')
						}
					})
				}
			}
		},
		thanks:{
			render:function(){
				var pself=this;
				if(!pself.ele){
					self.cancelCountdown();
					self.ele.find('.timeremaining').html('');
					self.ele.find('.pagepane').render({
						template:'donation_checkout_thanks',
						data:{
							left:self.getLeft('thanks'),
							content:self.successData.content,
							fundraiser:options.fundraiser,
							anon:(self.anon)?1:0
						},
						binding:function(ele){
							pself.ele=ele;
							if(modules.keyboard_global) modules.keyboard_global.overrides={
								onKeyboardWillShow:function(h){
									ele.find('.condensedonly').hide();
									TweenLite.to(ele.find('.pagecontent'),.3,{bottom:h-50})
								},
								onKeyboardWillHide:function(){
									ele.find('.condensedonly').show();
									TweenLite.to(ele.find('.pagecontent'),.3,{bottom:0})
								}
							}
							pself.scroller=new modules.scroller(ele.find('.scroller'));
							ele.find('.autosize').autosize({
								scroller:pself.scroller.getScroller()
							})
							ele.find('.x_share').stap(function(){
								if(pself.saving) return false;
								pself.saving=true;
								var c=ele.find('.x_sharecontent').val()
								if(!c){
									modules.toast({
										content:'Please enter a message to share'
									})
									return false;
								}
								if(self.anon){
									var by={
										type:'ticket_anon',
										id:self.anon.id
									}
								}else{
									var by={
										type:'user',
										id:app.user.profile.id
									}
								}
								var post={
	                            	message:c,
	                            	by:by,
	                            	perms:['public'],
	                                page:{
	                                    type:'fundraiser',
	                                    static:true,
	                                    id:options.fundraiser.id,
	                                    data:options.fundraiser
	                                }
                                };
                                var cv=ele.find('.x_share').html();
                                ele.find('.x_share').html('<i class="icon-refresh animate-spin"></i>');
                                modules.api({
                                	url:app.sapiurl+'/module/feed/post',
						            data:{
						            	channel:'feed_'+options.fundraiser.id,
						                post:post,
						                context:'post'
						            },
						            callback:function(resp){
						            	pself.saving=false;
						            	ele.find('.x_share').html(cv);
						            	if(resp.success){
						            		modules.toast({
						            			content:'Successfully Save Message!'
						            		});
						            		//clear out!
						            		ele.find('.x_sharecontent').val('');
						            		if(options.onPost) options.onPost(resp,self.anon);
						            		self.hide();
						            	}else{
						            		modules.toast({
						            			content:'Error Saving: '+resp.error
						            		})
						            	}
						            }
                                })
							},1,'tapactive');
							ele.find('.x_sharefb').stap(function(){
								app.shareTo(instance.getUrl(),'facebook');
							},1,'tapactive');
							ele.find('.x_done').stap(function(){
								self.hide();
							},1,'tapactive')
							ele.find('.x_learnmore').stap(function(){
								ele.find('.x_learnmore').find('.textcontent').html('<i class="icon-refresh animate-spin"></i>')
								self.learnMore();
							},1,'tapactive')
						}
					})
				}
			}
		}
	}
	this.learnMore=function(){
		window.location.href=app.domain+'/c/'+self.anon.id;
	}
	this.ensurePage=function(){
		self.pages[self.getPages()[self.currentPage]].render();
		//animate to proper page!
		TweenLite.to(self.ele.find('.pagepane'),.5,{x:'-'+(self.currentPage*100)+'%',onComplete:function(){

		}})
	}
	this.hide=function(){
		self.cancelCountdown();
		modules.keyboard_global.hide();
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
		modules.keyboard_global.overrides=false;
		if(self.dragger) self.dragger[0].kill();
		self.ele.remove();
		delete self;
	}
}