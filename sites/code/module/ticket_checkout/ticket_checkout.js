modules.ticket_checkout=function(options,instance){
	var oself=self=this;
	self.options=options;
	this.show=function(){
		async.parallel([self.showLoading,self.reserve],function(){
            self.onViewReady();
        })
	}
	this.reserve=function(cb){
		_ui.pageloader.render({theme:false,themeClass:'lds-ellipsis-black'},self.ele.find('.pagepane'),1);
		modules.api({
			url:app.sapiurl+'/module/ticket_checkout/reserve',
			data:{
				event:options.event.id,
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
			switch(self.reserveResp.error){
				case 'ticket_sales_closed':
					self.ele.find('.pagepane').render({
						template:'ticket_checkout_closed',
						append:false,
						data:{
							message:(self.reserveResp.message)?self.reserveResp.message:''
						}
					})
				break;
				case 'questionaire_awaiting_response':
					self.ele.find('.pagepane').render({
						template:'ticket_questionaire_awaiting_response',
						append:false,
						data:{
						}
					})
				break;
				case 'questionaire_required':
					self.ele.find('.pagepane').render({
						template:'ticket_questionaire_required',
						append:false,
						data:{
						},
						binding:function(ele){
							ele.find('.x_respond').stap(function(){
								var schema={
					                order:[],
					                fields:{}
					            };
					            if(self.reserveResp.questions&&self.reserveResp.questions.list){
					                $.each(self.reserveResp.questions.order,function(i,v){
					                    var item=self.reserveResp.questions.list[v];
					                    schema.order.push(item.id);
					                    schema.fields[item.id]={
					                        type:'text',
					                        name:item.description,
					                        required:true,
					                        form:{
					                            placeholder_full:item.description,
					                            type:'textarea',
					                            placeholder:'Response',
					                            minHeight:30
					                        }
					                    }
					                })
					                schema.endpoint='[apiurl]/module/event/'+options.event.id+'/saveresponses';
					                if(self.reserveResp.settings.approval_donation){//add form elements for donation
							            schema.order.push('donation');
							            var donation='';
							            if(self.reserveResp.settings.approval_donation_min&&!self.reserveResp.settings.approval_donation_max){
							                donation='<span style="font-size:11px">(Suggested donation minimum: $'+_.toMoney(self.reserveResp.settings.approval_donation_min,1,false,1)+')</span>';
							            }else if(self.reserveResp.settings.approval_donation_min&&self.reserveResp.settings.approval_donation_max){
							                 donation='<span style="font-size:11px">(Suggested donation: $'+_.toMoney(self.reserveResp.settings.approval_donation_min,1,false,1)+' - $'+_.toMoney(self.reserveResp.settings.approval_donation_max,1,false,1)+')</span>';
							            }
							            schema.fields.donation={
							                id:'donation',
							                name:'My Donation to Attend<sup>*</sup> '+donation,
							                subText:'<div style="padding:10px;font-size:12px;margin-top:-5px"><sup>*</sup>You will only be charged if/when your application is approved.  You will receive an email and app notification when you are approved.</div>',
							                type:'int',
							                required:true,
							                form:{
							                    placeholder:"Donation Amount",
							                    type:"money",
							                    min:0
							                }
							            }
							            //select card
							            schema.order.push('payment')
							            schema.fields.payment={
							                id:"payment",
							                name:"Payment Method",
							                type:'string',
							                required:true,
							                form:{
							                    type:'payment'
							                }
							            }
							        }
					            }else{
					            	_alert('questions not configured');
					            }
								phi.registerView('add',{
			                        renderTo:$('body'),
			                        zIndex:10000,
			                        onSuccess:function(data){
			                            //_alert('success');
			                            //reload the page!
			                            self.reserve(function(){
			                            	self.onViewReady();
			                            })
			                        },
			                        data:{
			                            mobileLayout:1,
			                            schema:schema,
			                            title:'Questions',
			                            action:'Submit!',
			                            current:{
			                                eid:options.event.id,
			                                user:{
			                                    id:app.user.getId(),
			                                    type:'user',
			                                    data:{
			                                        id:app.user.getId(),
			                                        name:app.user.profile.name,
			                                        pic:app.user.profile.pic
			                                    }
			                                }
			                            }
			                        }
			                    });
							},1,'tapactive');
						}
					})
				break;
				case 'questionaire_require_login':
					self.ele.find('.pagepane').render({
						template:'ticket_questionaire_login_required',
						append:false,
						data:{
						},
						binding:function(ele){
							 ele.find('.x_login').stap(function(){
		                        phi.registerView('login',{
		                            renderTo:$('body')[0],
		                            onComplete:function(){
		                            	self.reserve(function(){
					                        self.onViewReady();
					                    });
		                            }
		                        });
		                    },1,'tapactive')
							 var opts={}
							 if(_.isWebLayout()) opts={
                                display:'page_overlay_web'
                            }
		                    ele.find('.x_create').stap(function(){
		                        phi.registerView('onboard',{
		                            renderTo:$('body')[0],
		                            showOptions:opts,
		                            onComplete:function(){
		                            	self.reserve(function(){
					                        self.onViewReady();
					                    });
		                            }
		                        });
		                    },1,'tapactive')
						}
					})
				break;
				default:
					modules.loadError({
		                ele:self.ele.find('.pagepane'),
		                error:self.reserveResp.error,
		                onRetry:function(){
		                    self.reserve(function(){
		                        self.onViewReady();
		                    });
		                }
		            })
				break;
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
	this.login=function(){

		app.user.load(self.successData.created,function(){
	    	phi.restart(1);
	    },true);
	}
	this.getTemplate=function(tpl){
		if(self.reserveResp&&self.reserveResp.advanced&&self.reserveResp.advanced.fundraiser){
			return tpl+'_fundraiser';
		}else{
			return tpl;
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
			template:(options.template)?options.template:'ticket_checkout_page',
			data:options,
			binding:function(ele){
				oself.ele=self.ele=ele;
				ele.find('.x_closer').stap(function(){
					self.hide();
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
		if(app.user&&app.user.getId()){
			return ['payment','thanks'];//could be other or special order
		}else{
			return ['login','payment','thanks'];//could be other or special order
		}
	}
	this.loadStripe=function(){
	    self.promise=new Promise(function(resolve, reject) {
	        if(window.Stripe){
	            return resolve();
	        }else{
	            var script = document.createElement('script');  
	            script.setAttribute('src','https://js.stripe.com/v3/');
	            script.onload=function(){
	                resolve();
	            }
	            script.timeout=4000;
	            script.ontimeout=function(){
	                reject();
	            }
	            script.onerror=function(){
	                reject();
	            }
	            document.head.appendChild(script);
	        }
	    })
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
	this.isDonationBased=function(){
		if(options.tickets[0]&&options.tickets[0].data&&options.tickets[0].data.type=='donation') return true;
		return false;
	}
	this.getReceipt=function(){
		var total=0;
		var discount=0;
		var total_discount=0;
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
			total_discount=discount=self.getDiscountOfOrder(total);
			if(discount){
				total=total-discount;
			}
		}
		// if(self.onboard){
		// 	total-=1100;
		// 	total_discount+=1100;
		// }
		if(self.donationAmount){
			total+=self.donationAmount;
		}
		if(self.reserveResp.absorb_fees||self.isDonationBased()){
			var fee=0;
			var pfee=0;
		}else{
			var pfee=modules.tools.calcPlatformFee(total,self.reserveResp.platformFeeCalculation);
			var fee=modules.tools.calcStripeFee(total+pfee);
		}
		total+=fee;
		total+=pfee;
		return {
			donate_amount:(options.donation)?options.donation:'',
			original_total:original_total,
			total:total,
			total_discount:total_discount,
			platformFee:pfee,
			discount:discount,
			donationAmount:(self.donationAmount)?self.donationAmount:0,
			fee:fee,
			onboard:(self.onboard)?1:0,
			to:options.to,
			tickets:options.tickets,
			event:options.event
		}
	}
	this.pages={
		cart:{
			render:function(){
				var pself=this;
				if(!pself.ele){
					self.ele.find('.pagepane').render({
						template:self.getTemplate('ticket_checkout_cart'),
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
		            loadtemplate:'ticket_checkout_addcard',
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
    			modules.api({
    				url:app.sapiurl.replace('/one_core','')+'/stripe/one_core/addcard',
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
		    					var ind=_.getIndexByKey(oself.methodresp.data.methods,v.id,'id');
		    					var obj={
		    						id:v.id,
		    						type:'card',
		    						data:v
		    					}
		    					if(ind!==false){
		    						oself.methodresp.data.methods[ind]=v
		    					}else{
		    						oself.methodresp.data.methods.unshift(v);
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
    		this.loadStripe=function(){
			    self.promise=new Promise(function(resolve, reject) {
			        if(window.Stripe){
			            return resolve();
			        }else{
			            var script = document.createElement('script');  
			            script.setAttribute('src','https://js.stripe.com/v3/');
			            script.onload=function(){
			                resolve();
			            }
			            script.timeout=4000;
			            script.ontimeout=function(){
			                reject();
			            }
			            script.onerror=function(){
			                reject();
			            }
			            document.head.appendChild(script);
			        }
			    })
			}
			this.bindStripe=async function(){
			    self.loadStripe();
			    await self.promise;
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
						template:self.getTemplate('ticket_checkout_login'),
						data:{
							left:self.getLeft('login'),
							login:(options.noLogin)?0:1,
							resp:self.reserveResp
						},
						binding:function(ele){
							pself.ele=ele;
							pself.scroller=new modules.scroller(ele.find('.scroller'));
							pself.form=new modules.formbuilder({
                                ele:ele.find('.content'),
                                current:{
                                	eid:options.event.id,
                                	referal:options.event.page
                                },//passed as a refernce
                                schema:self.reserveResp.ticket_anon,
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
                            		var errs=pself.form.getValidationErrors();
                            		if(errs.length){
                            			modules.toast({
                            				content:modules.formbuilder_global.getValidationError(errs)
                            			})
                            		}
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
	                                    	self.currentPage--;
	                                    	//clear out
	                                    	self.ele.find('.pagepane').html('')
	                                    	self.nextPage();
	                                    },true);
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
						template:self.getTemplate('ticket_checkout_payment'),
						data:{
							left:self.getLeft('payment'),
							resp:self.reserveResp,
							receipt:self.getReceipt(),
							mode:(options.mode)?options.mode:'',
							donationBased:self.isDonationBased(),
							onboard:(self.reserveResp.settings&&self.reserveResp.settings.onboard&&(self.anon||app.token||(app.user.profile.level&&app.user.profile.level=='explorer')))?1:0,
							//fundraiser_for:(self.reserveResp&&self.reserveResp.advanced&&self.reserveResp.advanced.fundraiser_for)?self.reserveResp.advanced.fundraiser_for:''
						},
						binding:function(ele){
							pself.ele=ele;
							if(options.mode=='donation'){
								new modules.input({
									allowWebInput:true,
									container:pself.ele.find('.scrollY'),
									ele:ele.find('.x_donate'),
									//clickEle:ele.find('.x_donate'),
									type:'number',
									title:'Enter Donation Amount',
									data:{
										current:0
									},
									noperms:1,
									onSet:function(data){
										console.log(data)
										ele.find('.x_donate').html('$'+_.toMoney(data.current*100))
										self.donationAmount=data.current*100;
										//pself.updateTotal()
									},
									formatData:function(data){
										return '$'+_.toMoney(data.current*100);
									}
								})
							}
							ele.find('.x_toggleplayer').stap(function(){
								if(ele.find('.x_toggleplayer').hasClass('selected')){
									ele.find('.x_toggleplayer').removeClass('selected');
									ele.find('.x_toggleplayer').find('i').addClass('icon-check-empty').removeClass('icon-check');
									self.onboard=0;
								}else{
									ele.find('.x_toggleplayer').addClass('selected')
									ele.find('.x_toggleplayer').find('i').removeClass('icon-check-empty').addClass('icon-check');
									self.onboard=1;
								}
								pself.updateTotal()
							},1,'tapactive');
							if(self.anon||self.options.simpleCard) pself.loadAnonMethods();
							else pself.loadMethods();
							if(!options.fundraiser){
								pself.renderDiscount();
							}
							pself.renderDonation();
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
							pself.updateTotal();
						}
					})
				}
			},
			renderDonation:function(){
				var pself=this;
				// if(app.isdev||app.user.getRoles().indexOf('steward')>=0){

				// }else{
				// 	return false;
				// }
				pself.ele.find('.donationarea').render({
					template:'ticket_checkout_add_donation',
					append:false,
					data:{
						//discount:(self.discount)?self.discount:''
					},
					binding:function(ele){
						new modules.input({
							//ele:ele.find('.number_input'),
							container:pself.ele.find('.scrollY'),
							clickEle:ele.find('.number_input_click'),
							type:'number',
							title:'Enter Donation Amount',
							data:{
								current:0
							},
							noperms:1,
							onSet:function(data){
								ele.find('.number_input').html('$'+_.toMoney(data.current*100))
								self.donationAmount=data.current*100;
								pself.updateTotal()
							},
							formatData:function(data){
								return '$'+_.toMoney(data.current*100);
							}
						})
						// ele.find('.x_remove').stap(function(){
						// 	self.discount='';
						// 	pself.code='';
						// 	pself.renderDiscount();
						// 	pself.updateTotal();
						// },1,'tapactive')
						// ele.find('.x_discount').on('input keyup change',function(){
						// 	var v=$(this).val().getTagId().toUpperCase();
						// 	pself.code=v;
						// 	$(this).val(v);
						// })
						// ele.find('.x_discount_send').stap(function(){
						// 	pself.checkDiscount();
						// },1,'tapactive');
					}
				})
			},
			checkDiscount:function(){
				var pself=this;
				if(pself.sending) return false;
				pself.sending=true;
				pself.cv=pself.ele.find('.x_discount_send').html();
				pself.ele.find('.x_discount_send').html('<div style="padding:2px"><i class="icon-refresh animate-spin"></i></div>');
				modules.api({
					url:app.sapiurl+'/module/ticket_checkout/checkdiscount',
					data:{
						event:options.event.id,
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
				if(receipt.total_discount){
					pself.ele.find('.x_total_discount_row').show();
					pself.ele.find('.x_total_discount').html(modules.tools.toMoney(receipt.total_discount,1));
				}else{
					pself.ele.find('.x_total_discount_row').hide();
				}
			},
			renderDiscount:function(){
				var pself=this;
				pself.ele.find('.discountarea').render({
					template:'ticket_checkout_discount',
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
							content:'Please agree to our terms before purchasing tickets.'
						})
					}
					return false;
				}
				var receipt=self.getReceipt();
				if(receipt.total){
					if(self.anon||self.options.simpleCard){
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
							pself.ele.find('.scrollY').animate({ 
							   scrollTop: pself.ele.find('.scrollcontent').height()-pself.ele.find('.scrollY').height()}, 
							   500, 
							   "easeOutQuint"
							);
							return false;
						}else{
							return false;
						}
					}
				}
				if(silent) return true;
				return cb();
			},
			renderMethods:function(){
				var pself=this;
				//console.log(oself.methodresp)
				pself.ele.find('.methodarea').render({
					template:'ticket_checkout_methods',
					append:false,
					data:{
						resp:oself.methodresp
					},
					binding:function(ele){
						ele.find('.x_addcard').stap(function(){
							var p=new self.pages.addCard({
								onReturn:function(){
									pself.ensureButton()
								}
							});
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
					template:'ticket_checkout_anonmethods',
					append:false,
					data:{
					},
					binding:async function(ele){
						self.loadStripe();
			    		await self.promise;
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
					template:'ticket_checkout_methods_loading'
				})
				pself.loading=true;
				modules.api({
					url:app.sapiurl+'/module/ticket_checkout/methods',
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
				pself.ele.find('.x_sendtext').html('<i class="icon-refresh animate-spin"></i> Processing...');
				self.stripe.createToken(self.card).then(function(result) {
		          if (result.error) {
		            // Inform the user if there was an error.
		            var errorElement = document.getElementById('card-errors');
		            errorElement.textContent = result.error.message;
		            self.submitting=false
		            pself.ele.find('.x_sendtext').html(self.cv);
		          } else {
		            // Send the token to your server.
		            pself.sendPayment(cb,result.token.id);
		          }
		        });
			},
			sendPayment:function(cb,token){
				var pself=this;
				var receipt=self.getReceipt();
				if((self.anon||self.options.simpleCard)&&!token) return pself.sendAnonPayment(cb);
				if(pself.sending) return false;
				if(!pself.method&&!token&&receipt.total){
					modules.toast({
						content:'Please add or select a payment method'
					});
					//scroll to bottom
					pself.ele.find('.scrollY').animate({ 
					   scrollTop: pself.ele.find('.scrollcontent').height()-pself.ele.find('.scrollY').height()}, 
					   500, 
					   "easeOutQuint"
					);
					return false;
				}
				if(!self.cv){
					self.cv=pself.ele.find('.x_sendtext').html();
					pself.ele.find('.x_sendtext').html('<i class="icon-refresh animate-spin"></i> Processing...');
				}
				pself.sending=true;
				var data={
					receipt:receipt,
					event:options.event.id,
					reservation:self.reserveResp.data.id
				}
				if(self.anon){
					data.stripe_token=token;
					data.anon=self.anon.id;
				}else if(self.options.simpleCard){
					data.stripe_token=token;
				}else{
					data.method=pself.method;
				}
				if(self.discount){
					data.discount=self.discount.id;
				}
				if(self.onboard){
					data.onboard=1;
				}
				modules.api({
					url:app.sapiurl+'/module/ticket_checkout/send',
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
						template:'ticket_checkout_donation',
						data:{
							left:self.getLeft('donation'),
							event:options.event
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
						template:self.getTemplate('ticket_checkout_thanks'),
						data:{
							left:self.getLeft('thanks'),
							content:self.successData.content,
							event:options.event,
							renderdata:(self.successData.renderdata)?self.successData.renderdata:{},
							created:(self.onboard&&!app.user.getId())?1:0,
							qrs:self.successData.qrs,
							showQrs:1,//(options.showQrs)?1:0,
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
										id:app.user.getId()
									}
								}
								var post={
	                            	message:c,
	                            	by:by,
	                            	perms:['public'],
	                                page:{
	                                    type:'event',
	                                    static:true,
	                                    id:options.event.id,
	                                    data:options.event
	                                }
                                };
                                var cv=ele.find('.x_share').html();
                                ele.find('.x_share').html('<i class="icon-refresh animate-spin"></i>');
                                modules.api({
                                	url:app.sapiurl+'/module/feed/post',
						            data:{
						            	channel:'feed_'+options.event.id,
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
							if(self.onboard&&(!app.user||!app.user.getId())){
								ele.find('.x_done').stap(function(){
									window.location.href=app.siteurl+'/download';
								},1,'tapactive')
							}else{
								ele.find('.x_done').stap(function(){
									self.hide();
								},1,'tapactive')
							}
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
		self.ele.remove();
		delete self;
	}
}