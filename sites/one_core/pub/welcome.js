var app={
    ver:1,
    appid:'2344d44c84409765d9a5ab39ae8cabcd',//web appid
	init:function(vars){
        $('body').append('<div id="growlarea" style="position:absolute;bottom:5px;left:5px;z-index: 100000;"></div>');
		if(vars) $.each(vars,function(i,v){
            if(i!='modules') app[i]=v;
        });
        if(window.mobiscroll) mobiscroll.settings = {
            theme: 'ios'
        };
        if(window._page){
            app.renderPage();
        }else{
            app.render();
        }
    },
    showOnepassSuccess:function(cb){
        $('body').alert({
            template:'onepass_success',
            image:false,
            icon:false,
            buttons:false,
            onExit:function(){
                if(cb) cb()
            }
        })
    },
    renderPage:function(){
        if(window.location.href.indexOf('/plans')>=0){
            app.renderPlans();
            app.doneLoaing();
            return false;
        }
        $('#wrapper').render({
            append:false,
            template:'home_page',
            data:{
                page:_page
            },
            binding:function(ele){
                app.ele=ele;
                if(window._page){
                    app.bindForm({
                        id:_page.id,
                        pic:_page.pic,
                        name:_page.name
                    })
                }else if(window._refered_by){
                    app.bindForm(window._refered_by)
                }
                ele.find('.x_checkin').stap(function(){
                    app.checkin()
                },1,'tapactive');   
                ele.find('.x_getapp').stap(function(){
                    app.downloadAppLink()
                },1,'tapactive')
                ele.find('.x_goback').stap(function(){
                    app.ele.find('#buttonarea').show();
                    app.ele.find('#createarea').hide();
                },1,'tapactive')
                ele.find('.x_create').stap(function(){
                    app.ele.find('#buttonarea').hide();
                    app.ele.find('#createarea').show();
                },1,'tapactive')
                ele.find('.x_onepass').stap(function(){
                    $('#wrapper').render({
                        append:true,
                        data:{},
                        template:'home_page_cover',
                        binding:function(ele){
                            ele.find('.x_cancel').stap(function(){
                                ele.remove();
                            },1,'tapactive')
                        }
                    })
                },1,'tapactive')
                app.doneLoaing();
            }
        });
    },
    checkin:function(){
        var path=window.location.href.split('/welcome/');
        window.open(app.scheme+'welcome/'+path[1]+'/supress','_self');
    },
    showQrs:function(){
        $('#wrapper').render({
            append:false,
            template:'home_qrs',
            data:app.successData,
            binding:function(ele){
                app.ele=ele;
                ele.find('.x_next').stap(function(){
                    app.next();
                },1,'tapactive')
                ele.find('.x_go').stap(function(){
                    app.saveToken();
                },1,'tapactive');
                app.bindStripe();
            }
        });
    },
    renderPlans:function(){
        var selected=(window.location.href.indexOf('onepass')>=0)?'onepass':'player';
        $('#wrapper').render({
            append:false,
            template:'home_plans',
            data:$.extend(true,{
                selected:selected,
            },{img:'https://s3.amazonaws.com/one-light/static/flatirons_icon.jpg'}),
            binding:function(ele){
                app.ele=ele;
                ele.find('.x_goto').stap(function(){
                    app.goto($(this).attr('data-to'))
                },1,'tapactive');
                app.goto(selected);
                ele.find('.x_next').stap(function(){
                    app.next();
                },1,'tapactive')
                ele.find('.x_go').stap(function(){
                    app.saveToken();
                },1,'tapactive');
                app.bindStripe();
            }
        });
    },
    goto:function(page){
        if(page=='onepass'){
            app.onePassMode=true;
        }else{
            app.onePassMode=false;
        }
        app.ele.find('.x_goto').removeClass('selected');
        app.ele.find('[data-to='+page+']').addClass('selected');
        app.ele.find('.page').hide();
        app.ele.find('[data-page='+page+']').show();
    },
    next:function(msg){
        window.location.href=app.siteurl+'/download?disableopen=1&message='+((msg)?msg:'If youd like to play with us, download our app below!')
    },
    downloadAppLink:function(){
        window.location.href=app.siteurl+'/download?disableopen=1&message=If youd like to play with us, download our app below!';
    },
    startPlan:function(){
        var self=app;
        var settings={
            plans:{
                one_boulder:'player'
            },
            source:app.cardresp.card_id
        }
        if(app.onePassMode){
            settings.plans['one_pass']='basic';
        }
        modules.api({
            url:app.sapiurl.replace('/one_core','/')+'stripe/one_core/updatesubscription',
            data:{
                appid:app.appid,
                token:app.token,
                settings:settings
            },
            timeout:15000,
            callback:function(resp){
                self.submitting=false
                if(resp.success){
                    if(app.onePassMode){
                        app.showOnepassSuccess(self.next)
                    }else{
                        self.next();
                    }
                }else{
                    self.ele.find('.submittext').html(self.ctext);
                    modules.toast({
                        content:'Error Saving: '+resp.error
                    })
                }
            }
        })
    },
    save:function(token){
        var self=app;
        modules.api({
            url:app.sapiurl.replace('/one_core','/')+'stripe/one_core/addcard',
            data:$.extend(true,{},{
                appid:app.appid,
                token:app.token,
                stripe_token:token,
            }),
            callback:function(resp){
                if(resp.success){
                    app.cardresp=resp;
                    app.startPlan()
                }else{
                    self.submitting=false
                    self.ele.find('.submittext').html(self.ctext);
                    modules.toast({
                        content:'Error Saving: '+resp.error
                    })
                }
            }
        })
    },
    saveToken:function(){
        var self=app;
        if(self.submitting) return false;
        self.submitting=true;
        self.ctext=app.ele.find('.submittext').html();
        self.ele.find('.submittext').html('<i class="icon-refresh animate-spin"></i> Saving...')
        self.stripe.createToken(self.card).then(function(result) {
          if (result.error) {
            // Inform the user if there was an error.
            var errorElement = document.getElementById('card-errors');
            errorElement.textContent = result.error.message;
            self.ele.find('.submittext').html(self.ctext);
            self.submitting=false
          } else {
            // Send the token to your server.
            self.save(result.token.id);
          }
        });
    },
    loadStripe:function(){
        app.promise=new Promise(function(resolve, reject) {
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
    },
    bindStripe:async function(){
        app.loadStripe();
        await app.promise;
        var self=app;
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
    },
    updateTotal:function(){
        if(app.onboard){
            app.ele.find('.x_include').show()
        }else{
            app.ele.find('.x_include').hide()
        }
        var receipt=app.getReceipt();
        app.ele.find('.x_fees').html('$'+_.toMoney(receipt.fee))
        app.ele.find('.x_pfees').html('$'+_.toMoney(receipt.platformFee))
        app.ele.find('.x_total').html('$'+_.toMoney(receipt.total))
        app.ele.find('.x_original_total').html('$'+_.toMoney(receipt.original_total))
        app.ele.find('.number_input').html('$'+_.toMoney(receipt.donationAmount))
    },
    submitTicketToken:function(){
        if(app.submitting) return false;
        //if(self.currentToken) return app.submitTicketPurchase(self.currentToken);
        app.submitting=true;
        app.ctext=app.ele.find('.submittext').html();
        app.ele.find('.submittext').html('<i class="icon-refresh animate-spin"></i>');
        app.stripe.createToken(app.card).then(function(result) {
            app.submitting=false
          if (result.error) {
            // Inform the user if there was an error.
            var errorElement = document.getElementById('card-errors');
            errorElement.textContent = result.error.message;
            app.ele.find('.submittext').html(app.ctext);
          } else {
            // Send the token to your server.
            //self.currentToken=result.token.id;
            app.submitTicketPurchase(result.token.id);
          }
        });
    },
    reserveTickets:function(cb){
        if(app.sending) return false;
        if(!app.cv){
            app.cv=app.ele.find('.submittext').html();
            app.ele.find('.submittext').html('<i class="icon-refresh animate-spin"></i>');
        }
        app.sending=true;
        var data={
            event:_eventinfo.data.id,
            tickets:app.getTickets()
        }
        modules.api({
            url:app.sapiurl+'/module/ticket_checkout/reserve',
            data:data,
            timeout:20000,
            callback:function(data){
                app.ele.find('.submittext').html(app.cv);
                app.sending=false;
                if(data.success){
                    app.reserveResp=data;
                    cb();
                }else{
                    app.cv=false;
                    modules.toast({
                        content:'Error: '+data.error
                    })
                }
            }
        })
    },
    submitTicketPurchase:function(token){
        if(app.sending) return false;
        app.sending=true;
        var data={
            receipt:app.getReceipt(),
            event:_eventinfo.data.id,
            welcome:1,
            reservation:app.reserveResp.data.id
        }
        data.stripe_token=token;
        if(app.onboard){
            data.onboard=1;
        }
        modules.api({
            url:app.sapiurl+'/module/ticket_checkout/send',
            data:data,
            timeout:20000,
            callback:function(data){
                app.ele.find('.submittext').html(app.cv);
                app.sending=false;
                if(data.success){
                    app.successData=data;
                    app.showQrs();
                    //app.next('Purchase Complete! If youd like to play with us, download our app below!');
                }else{
                    app.cv=false;
                    modules.toast({
                        content:'Error: '+data.error
                    })
                }
            }
        })
    },
    isDonationBased:function(){
        var is=false;
        for(var key in _eventinfo.data.ticket.tickets.list){
            var item=_eventinfo.data.ticket.tickets.list[key];
            if(item.available_to&&item.available_to.length&&item.available_to.indexOf('explorer')>=1){
                if(item.type=='donation') is=true;
            }
        }
        return is;
    },
    getReceipt:function(){
        var total=0;
        var discount=0;
        var total_discount=0;
         $.each(app.getTickets(),function(i,v){
            if(v.quantity&&v.data.price){
                total+=(v.quantity*v.data.price);
            }
        });

        var original_total=total;
        if(app.donationAmount){
            total+=app.donationAmount;
        }
        // if(app.onboard){
        //     total-=1100;
        //     total_discount+=1100;
        // }
        if((_eventinfo.data.ticket_settings&&_eventinfo.data.ticket_settings.absorb_fees)||app.isDonationBased()){
            var fee=0;
            var pfee=0;
        }else{
            var pfee=modules.tools.calcPlatformFee(total);
            var fee=modules.tools.calcStripeFee(total+pfee);
        }
        total+=fee;
        total+=pfee;
        return {
            donationAmount:(app.donationAmount)?app.donationAmount:0,
            original_total:original_total,
            total:total,
            platformFee:pfee,
            total_discount:total_discount,
            discount:discount,
            fee:fee,
            onboard:(app.onboard)?1:0,
            // to:options.to,
            tickets:app.getTickets(),
            event:_eventinfo.data.id
        }
    },
    renderTeam:function(){
        $('#wrapper').render({
            append:false,
            template:'home_team',
            data:{},
            binding:function(ele){
                
            }
        });
    },
    renderTickets:function(){
        $('#wrapper').render({
            append:false,
            template:'home_tickets',
            data:{},
            binding:function(ele){
                app.ele=ele;
                new modules.input({
                    allowWebInput:true,
                    container:ele.find('.scrollY'),
                    ele:ele.find('.x_donate'),
                    //clickEle:ele.find('.x_donate'),
                    type:'number',
                    title:'Enter Donation Amount',
                    data:{
                        current:0
                    },
                    noperms:1,
                    onSet:function(data){
                        ele.find('.x_donate').html('$'+_.toMoney(data.current*100))
                        app.donationAmount=data.current*100;
                        //pself.updateTotal()
                    },
                    formatData:function(data){
                        return '$'+_.toMoney(data.current*100);
                    }
                })
                new modules.input({
                    ele:ele.find('.number_input'),
                    container:ele,
                    clickEle:ele.find('.number_input_click'),
                    type:'number',
                    title:'Enter Donation Amount',
                    data:{
                        current:0
                    },
                    noperms:1,
                    onSet:function(data){
                        ele.find('.number_input').html('$'+_.toMoney(data.current*100))
                        app.donationAmount=data.current*100;
                        app.updateTotal()
                    },
                    formatData:function(data){
                        return '$'+_.toMoney(data.current*100);
                    }
                })
                app.ele.find('.ticketitem').each(function(i,v){
                    //console.log($(v),app.getTicketById($(this).attr('data-id')),$(this).attr('data-type'))
                    app.makeTicketSelect($(v),app.getTicketById($(this).attr('data-id')),$(this).attr('data-type'));
                })
                app.ensureTicketButtons();
                app.updateTotal()
                app.user={
                    getId:function(){
                        return 1;
                    }
                }
                ele.find('.x_toggleplayer').stap(function(){
                    if(ele.find('.x_toggleplayer').hasClass('selected')){
                        ele.find('.x_toggleplayer').removeClass('selected');
                        ele.find('.x_toggleplayer').find('i').addClass('icon-check-empty').removeClass('icon-check');
                        app.onboard=0;
                    }else{
                        ele.find('.x_toggleplayer').addClass('selected')
                        ele.find('.x_toggleplayer').find('i').removeClass('icon-check-empty').addClass('icon-check');
                        app.onboard=1;
                    }
                    app.updateTotal()
                },1,'tapactive');
                ele.find('.x_terms').stap(function(){
                    if($(this).hasClass('checked')){
                        $(this).removeClass('checked');
                        $(this).find('.checker').addClass('icon-check-empty').removeClass('icon-check');
                    }else{
                        $(this).addClass('checked');
                        $(this).find('.checker').removeClass('icon-check-empty').addClass('icon-check');
                    }
                    //app.ensureButton();
                },1,'tapactive');
                ele.find('.x_viewterms').stap(function(e){
                    phi.stop(e);
                    $('body').alert({
                        image:false,
                        icon:false,
                        width:600,
                        zIndex:100000,
                        content:'<div style="padding:20px;text-align:left">'+window._ticketTerms+'</div>'
                    })
                },1,'tapactive')
                app.bindStripe();
                app.ele.find('.x_send').stap(function(){
                    app.reserveTickets(function(){
                        app.submitTicketToken()
                    })
                },1,'tapactive')
            }
        });
    },
    bindForm:function(defaultSelection){
        app.searchbar=new modules.search({
            input:app.ele.find('#referedby'),
            allowAdd:false,
            renderTemplate:'modules_search_user',
            exclude:[],
            endpoint:app.sapiurl+'/search/players',
            showNoResults:true,
            allowBlank:true,
            noExclude:true,
            defaultSelection:defaultSelection,
            searchEle:app.ele.find('.searchele'),
            cancelEle:app.ele.find('.x_cancel'),
            keyUpOnFocus:true,
            appendData:{
                list:{
                    one_boulder:{
                        id:'one_boulder',
                        name:'ONE|Boulder',
                        pic:'https://s3.amazonaws.com/one-light/static/flatirons_icon.jpg'
                    }
                },
                order:['one_boulder']
            },
            onKeyUp:function(val){
            },
            onSelect:function(id,item){//might want or need full item.
                app.ele.find('.searcharea').hide()
                app.ele.find('.searcharea').find('.prettyinput3').removeClass('hasvalue');
                app.ele.find('.resultareacontent').render({
                    template:'modules_search_user',
                    append:false,
                    data:{
                        canRemove:true,
                        exclude:false,
                        data:item
                    }
                })
                app.ele.find('.resultareacontent').find('.remove').stap(function(){
                    app.refered_by='';
                    app.ele.find('.searcharea').show();
                    app.ele.find('.resultarea').hide();
                },1,'tapactive');
                app.refered_by=id;
                app.ele.find('.resultarea').show()
            },
            scrollStart:function(){
                //modules.keyboard_global.hide()
            }
        });
        app.ele.find('#reset').stap(function(){
            app.send();
        },1,'tapactive')
        app.ele.find('.x_toggle').on('click',function(){
            if($(this).hasClass('toggled')){
                $(this).removeClass('toggled')
                $(this).find('i').addClass('icon-check-empty').removeClass('icon-check-1');
            }else{
                $(this).addClass('toggled');
                $(this).find('i').removeClass('icon-check-empty').addClass('icon-check-1');
            }
            return true;
        })
        app.ele.find('.prettyinput').find('input').on('keyup',function(e){
            if($(this).val().length){
                $(this).parents('.prettyinput').addClass('hasvalue')
            }else{
                $(this).parents('.prettyinput').removeClass('hasvalue')
            }
            $('#response').html('').hide();
            if(e.which==13){
                app.send();
            }
        })
    },
    render:function(){
        if(window.location.href.indexOf('/plans')>=0){
            app.renderPlans();
            app.doneLoaing();
            return false;
        }
        if(window.location.href.indexOf('/tickets')>=0){
            app.renderTickets();
            app.doneLoaing();
            return false;
        }
        if(window.location.href.indexOf('/team/view')>=0){
            app.renderTeam();
            app.doneLoaing();
            return false;
        }
    	$('#wrapper').render({
    		append:false,
    		template:'home',
    		data:$.extend(true,{},{img:'https://s3.amazonaws.com/one-light/static/flatirons_icon.jpg'}),
    		binding:function(ele){
                app.ele=ele;
                ele.find('.x_team').stap(function(){
                    app.renderTeam();
                },1,'tapactive');
                ele.find('.x_donate').stap(function(){
                    window.open('https://venmo.com/code?user_id=3216755325403136507','_self');
                },1,'tapactive');
                ele.find('.x_open').stap(function(){
                    if(isMobile){
                        var path=window.location.href.split('/welcome/');
                        window.open(app.scheme+'welcome/'+path[1]+'/supress','_self');
                    }else{
                         var path=window.location.href.split('/welcome/');
                        window.open(app.siteurl+'/'+path[1],'_self');
                    }
                },1,'tapactive')
                if(window._eventinfo){
                    app.bindForm({
                        id:_eventinfo.data.page.id,
                        pic:_eventinfo.data.page.data.pic,
                        name:_eventinfo.data.page.data.name
                    })
                    
                }else if(window._refered_by){
                    app.bindForm(window._refered_by)
                }else{
                    app.bindForm()
                }
                app.doneLoaing();
    			// ele.preload('https://one-light.s3.amazonaws.com/static/background_complex2.jpg',1,function(){
    			// 	app.doneLoaing();
    			// })
    		}
    	})
    },
    send:function(){
        //require waivers!!!!
        var waivers=[];
        app.ele.find('.waiver').each(function(i,v){
            if($(v).hasClass('toggled')) waivers.push($(v).attr('data-waiver'))
        });
        var data={
            name:$('#name').val(),
            email:$('#email').val(),
            refered_by:app.refered_by
        }
        $('#response').html('').hide();
        if(!data.name){
            $('#response').html('Please provide a name 🙏').show().shake();
            return false;
        }
        if(!data.email){
            $('#response').html('Please provide an email 🙏').show().shake();
            return false;
        }
        if(!data.refered_by){
            $('#response').html('Please select the player, regenerator, or steward who refered you').show().shake();
            return false;
        }
        // if(waivers.length!=3){
        //     $('#response').html('Please agree to all of our waivers 🙏').show().shake();
        //     return false;
        // }
        if(app.saving) return false;
        app.cb=app.ele.find('#reset').html();
        app.ele.find('#reset').html('<i class="icon-refresh animate-spin"></i> Saving...');
        app.saving=true;
        data.pic={
            "path":"/static/blank_user",
            "ext":"jpg",
            "ar":1
        }
        data.source='visit';
        data.level='explorer';
        data.verified=1;//we have seen them in person
        data.waivers=app.waivers;
        data.email_notifications=($('#notifications').hasClass('toggled'))?1:0;
        var send={
            appid:'2366d44c84409765d9a00619aea4c1234',
            data:data
        }
        if(window._checkin){
            send.checkin=window._checkin;
        }
        modules.api({
            url:app.sapiurl+'/user/create',
            data:send,
            callback:function(data){
                app.ele.find('#reset').html(app.cb);
                if(data.success){
                    app.token=data.profile._id;
                    if(window._eventinfo){
                        app.renderTickets()
                    }else{
                        app.renderPlans();
                    }
                }else{
                    app.saving=0;
                    app.ele.find('#response').show()
                    modules.toast({
                        ele:app.ele.find('#response'),
                        remove:false,
                        closeable:false,
                        width:'',
                        icon:'icon-warning-sign',
                        content:modules.formbuilder_global.getError(data)
                    });
                }
            }
        })
        //alert('send!')
        //window.location.href='https://app.oneboulder.one/download'
        //modules.api();
    },
    getTicketById:function(id){
        return _eventinfo.data.ticket.tickets.list[id]
    },
    getTickets:function(){
        var items=[];
        var data=app.webTicketInput;
        $.each(data,function(i,v){
            if(v.getValue){
                var tv=v.getValue();
                if(tv.values[0]&&parseInt(tv.values[0],10)){
                    items.push({
                        id:i,
                        data:app.getTicketById(i),
                        quantity:parseInt(tv.values[0],10)
                    })
                }
            }
            if(v.getCurrent){
                var tv=parseInt(v.getCurrent(),10);
                if(tv){
                    items.push({
                        id:i,
                        data:app.getTicketById(i),
                        quantity:tv
                    })
                }
            }
        });
        if(_eventinfo.data.ticket&&_eventinfo.data.ticket.tickets&&_eventinfo.data.ticket.tickets.order.length){
            $.each(_eventinfo.data.ticket.tickets.list,function(i,v){
                if(v.type=='donation'){
                    if((v.available_to&&v.available_to.length&&v.available_to.indexOf('explorer')>=0)||(!v.available_to||!v.available_to.length)){
                        items.push({
                            id:i,
                            data:app.getTicketById(i),
                            quantity:1
                        })
                    }
                }
            })
        }
        return items;
    },
    ensureTicketButtons:function(){
        if(_eventinfo.data.ticket&&_eventinfo.data.ticket.tickets&&_eventinfo.data.ticket.tickets.order.length){
            var tickets=app.getTickets();
            //determin if there are any tickets still available
            // if(tickets.length){
            //     app.ele.find('.x_gettickets').removeClass('disabled');
            // }else{
            //     app.ele.find('.x_gettickets').addClass('disabled');
            // }
            var ticketCount=0;
            $.each(_eventinfo.data.ticket.tickets.list,function(i,ticket){
                if(ticket.quantity){
                    var total=ticket.quantity;
                    if(ticket.all) total-=ticket.all;
                    if(total){
                        ticketCount+=total;
                        app.ele.find('[data-id='+ticket.id+']').removeClass('soldout');
                    }else{// set to sold out!
                        app.ele.find('[data-id='+ticket.id+']').addClass('soldout');
                    }
                }else{
                    app.ele.find('[data-id='+ticket.id+']').removeClass('soldout');
                }
            })
            if(ticketCount){
                app.ele.find('.x_gettickets').show();
                //app.ele.find('.x_soldout').hide();
            }else{
                app.ele.find('.x_gettickets').hide();
                //app.ele.find('.x_soldout').show();
            }
        }
    },
    makeTicketSelect:function(ele,ticket,type){
        var max=10;//hardcoded but will eventually be in ticket conf
        var available=ticket.quantity;//will also be returned from api
        if(ticket.all) available-=ticket.all;
        if(available<max) max=available;
        if(!app.ticketInput) app.ticketInput={};
        if(!app.webTicketInput) app.webTicketInput={};
        var data=app.webTicketInput;
        var options=[];
        var c=1;
        var menu=[]
        if(_eventinfo.data.ticket.tickets.order.length==1){
            var val=1;
        }else{
            var val=0;
            var c=0;
        }
        while(c<=max){
            options.push({
                display:c,
                value:c
            });
            var n=(c==1)?'Ticket':'Tickets';
            var v={
                id:c,
                name:c+' '+n
            }
            if(val==c){
                v.selected=true;
            }
            menu.push(v)
            c++;
        }
        var wheels=[];
        var html='<select>';
        for (var i = 0; i < options.length; i++) {
            var opt=options[i];
            html+='<option value="'+opt.value+'" '+((opt.selected)?'selected':'')+'>'+opt.display+'</option>'
        }
        html+='<select>';
        ele.find('.ticket_quantity').html(html);
        ele.find('.ticket_quantity').find('select').on('change',function(){
            app.updateTotal()
        })
        data[ticket.id]={
            getCurrent:function(){
                return ele.find('.ticket_quantity').find('select').val();
            }
        }
    },
    doneLoaing:function(){
        $('#wrapper').show()
        $('#splash').hide()
    	$('.page-loader').fadeOut(500,function(){
    		$(this).remove();
    	})
    }
};