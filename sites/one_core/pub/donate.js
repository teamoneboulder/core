var app={
    ver:2,
    appid:'2344d44c84409765d9a5ab39ae8cabcd',//web appid
	init:function(vars){
		if(vars) $.each(vars,function(i,v){
            if(i!='modules') app[i]=v;
        });
        modules.prefs.load();
        app.render();
    },
    render:function(){
        $('body').append('<div id="growlarea" style="position:absolute;bottom:5px;left:5px;z-index: 100000;"></div>');
        var urlp=window.location.pathname.split('?');
        var url=(app.scheme+urlp[0]).replace('///','//').replace('donate','event');
        //window.open(url,'_self');
    	phi.render($('#wrapper'),{
    		append:false,
            context:app,
    		template:'home',
    		data:{
                event:(_eventinfo&&_eventinfo.data)?_eventinfo.data:false
            },
    		binding:function(ele){
                app.ele=ele;
                if((_eventinfo&&_eventinfo.data)){
                    app.ele.find('.ticketitem').each(function(i,v){
                        app.makeTicketSelect($(v),app.getTicketById($(this).attr('data-id')),$(this).attr('data-type'));
                    })
                    app.ensureTicketButtons();
                }
                app.doneLoaing();
    		}
    	})
    },
    navigateTo:function(){
        modules.navigateTo(_eventinfo.data.location.data.place_name,modules.geocode.getLoc(_eventinfo.data.location.data));
    },
    view:function(){
        $('body').render({
            template:'tickets_view',
            data:{
                qrs:modules.prefs.get('qrs.'+_eventinfo.data.id)
            },
            binding:function(ele){
                app.vele=ele;
                ele.find('.x_closer').stap(function(){
                    app.hideTickets();
                },1,'tapactive')
                TweenLite.set(app.vele.find('.pane'),{y:'100%'})
                //render
                setTimeout(function(){
                    TweenLite.to(app.vele,.3,{background:'rgba(55,55,55,.3)'})
                    TweenLite.to(app.vele.find('.pane'),.3,{y:'0%',onComplete:function(){
                        //if(cb) cb();
                    }})
                },50)
            }
        })
    },
    hideTickets:function(){
        setTimeout(function(){
            TweenLite.to(app.vele,.5,{background:'rgba(55,55,55,0)'})
            TweenLite.to(app.vele.find('.pane'),.5,{y:'100%',onComplete:function(){
                setTimeout(function(){
                    app.vele.remove()
                },50);
            }})
        },50)
    },
    purchase:function(e,container,target,data){
        app.buyTickets();
    },
    doneLoaing:function(){
        $('#wrapper').show()
        $('#splash').hide()
    	$('.page-loader').fadeOut(500,function(){
    		$(this).remove();
    	})
    },
    buyTickets:function(topts){
        if(!topts) topts={};
        var tickets=app.getTickets();
        if(tickets.length){//just ensure...
            app.checkout=new modules.ticket_checkout($.extend(true,{},{
                tickets:tickets,
                noLogin:1,
                showQrs:true,
                //fundraiser:(_eventinfo.data.fundraiser)?1:0,
                event:_eventinfo.data,
                onPost:function(post_resp,anon){
                    if(anon){
                        if(app.eventfeed) app.eventfeed.addPost(post_resp.data);
                    }
                },
                onSuccess:function(data){
                    //re-render things!
                    //console.log(data)
                    if(data.qrs){
                        var c=modules.prefs.get('qrs.'+_eventinfo.data.id,[]);
                        $.each(data.qrs,function(i,v){
                            c.push(v);
                        })
                        modules.prefs.set('qrs.'+_eventinfo.data.id,c);
                        //rerender home!
                        app.render()
                    }
                },
                to:_eventinfo.data.id//event itself, could be different
            },topts),app);
            app.checkout.show();
            //clear out input counts!
        }else{
            modules.toast({
                content:'Please select some tickets'
            })
        }
    },
    getTicketById:function(id){
        return _eventinfo.data.ticket.tickets.list[id]
    },
    getTickets:function(){
        var items=[];
        var data=app.ticketInput;
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
        })
        return items;
    },
    ensureTicketButtons:function(){
        if(_eventinfo.data.ticket&&_eventinfo.data.ticket.tickets&&_eventinfo.data.ticket.tickets.order.length){
            var tickets=app.getTickets();
            //determin if there are any tickets still available
            if(tickets.length){
                app.ele.find('.x_gettickets').removeClass('disabled');
            }else{
                app.ele.find('.x_gettickets').addClass('disabled');
            }
            var ticketCount=0;
            $.each(_eventinfo.data.ticket.tickets.list,function(i,ticket){
                var total=ticket.quantity;
                if(ticket.all) total-=ticket.all;
                if(total){
                    ticketCount+=total;
                    app.ele.find('[data-id='+ticket.id+']').removeClass('soldout');
                }else{// set to sold out!
                    app.ele.find('[data-id='+ticket.id+']').addClass('soldout');
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
        var data=app.ticketInput;
        var options=[];
        var menu=[]
        if(_eventinfo.data.ticket.tickets.order.length==1){
            var val=1;
            var c=1;
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
        var id=Math.uuid(12);
        var html='<select id="'+id+'">';
        for (var i = 0; i < options.length; i++) {
            var opt=options[i];
            html+='<option value="'+opt.value+'" '+((opt.selected)?'selected':'')+'>'+opt.display+'</option>'
        }
        html+='<select>';
        ele.find('.ticket_quantity').html(html);
        ele.find('.ticket_quantity').find('#'+id).on('change',function(){
             app.ensureTicketButtons();
        })
        data[ticket.id]={
            getCurrent:function(){
                return ele.find('.ticket_quantity').find('select').val();
            }
        }
    }
};