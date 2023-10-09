modules.admin_finances=function(options){
	var self=this;
	this.show=function(){
		options.ele.render({
			uid:'admin_finances',
			force:1,
			template:'admin_finances',
			binding:function(ele){
				self.ele=ele;
                self.updateBalance();
                 self.ele.find('.x_setpage').stap(function(){
                    self.setPage($(this).attr('data-page'));
                 });
                 self.ele.find('.x_addinvoice').stap(function(){
                    self.addInvoice();
                 });
                // self.ele.find('.x_refresh').stap(function(){
                //     self.ele.find('.x_refresh').find('i').addClass('animate-spin')
                //     self.load();
                // },1,'tapactive');
                self.setPage((options.page)?options.page:'cashflow',1);
                app.user.startSocket('admin_balance', self.onMessage);
			}
		});
	}
    this.onMessage=function(msg){
        if(msg.type=='balance'){
            self.updateBalance();
        }
        //self.getBalance();
    }
    this.getBalance=function(data,type,currency){
        var balance=0;
        if(type=='available'){
            $.each(data.available,function(i,v){
                if(v.currency==currency){
                    balance=v.amount;
                }
            })
        }
        return balance;
    }
    this.updateBalance=function(){
        self.ele.find('.x_balance').html('$....');
         modules.api({
            url:app.sapiurl+'/finances/balance',
            data:{
            },
            callback:function(resp){
                if(resp.success){
                    //self.ele.find('.x_balance').html('$'+_.toMoney(self.getBalance(resp.data,'available','usd'),1));
                    self.ele.find('.x_balance_stripe').html('$'+_.toMoney(resp.data.stripe.balance_current,1));
                    self.ele.find('.x_balance_ob').html('$'+_.toMoney(resp.data.one_boulder.balance_current,1));
                    self.ele.find('.x_pending_stripe').html('$'+_.toMoney(resp.data.stripe.balance_pending,1));
                    self.ele.find('.x_pending_ob').html('$'+_.toMoney(resp.data.one_boulder.balance_pending,1));
                }
            }
        })
    }
    this.addInvoice=function(){
        phi.register('admin_add',{
            ele:$('#wrapper'),
            title:'Create Invoice',
            action:'Save!',
            data:{
                schema:'invoice'
            },
            onSave:function(resp){
                self.show();
            },
            onRegister:function(instance){
                instance.component.show();
            }
        });
    }
    this.setPage=function(page,init){
        self.ele.find('.x_setpage').removeClass('selected');
        self.ele.find('.x_setpage[data-page='+page+']').addClass('selected')
        self.page=page;
        self.load();
        self.options.page=page;
    }
    this.load=function(){
        self.renderPage();
    }
    this.renderPage=function(){
        if(self.bindings[self.page]&&self.bindings[self.page].load){
            self.bindings[self.page]&&self.bindings[self.page].load(function(){
                self.ele.find('#dashboardcontent').render({
                    template:'admin_finances_'+self.page,
                    append:false,
                    binding:function(ele){
                        if(self.bindings[self.page].binding){
                           self.bindings[self.page].binding(ele); 
                        }else{
                            console.log('no binding in place');
                        }
                    }
                })
            })
        }
        self.ele.find('#dashboardcontent').render({
            template:'admin_finances_'+self.page,
            append:false,
            binding:function(ele){
                if(self.bindings[self.page].binding){
                   self.bindings[self.page].binding(ele); 
                }else{
                    console.log('no binding in place');
                }
            }
        })
    }
    this.getDefaultOpts=function(){
        return {
            chart: {
                animation: false,
                marginTop:30,
                backgroundColor: 'white',
                type: 'spline'
            },
            title: {
                text: ''
            },
            subtitle: {
                text: ''
            },
            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: { // don't display the dummy year
                    second:'%l:%M:%S %P',
                    hour:'%l %P',
                    minute:'%l:%M %P',
                    day:'%l %P<br/><b>%a %m/%e</b>',
                    month:'<b>%m/%e</b>',
                    year: '%b'
                },
                title: {
                    text: null
                }
            },
            yAxis: {
                labels:{
                    formatter:function(){
                        return '$'+this.value/100;
                    }
                },
                min: 0
            },
            plotOptions: {
                spline: {
                    animation: false,
                    tooltip:{
                        dateTimeLabelFormats:{
                            hour:'%l:%M %P %m/%e/%Y',
                            minute:'%l:%M %P %m/%e/%Y',
                            day:'%l:%M %P %m/%e/%Y',
                            week:'%l:%M %P %m/%e/%Y'
                        }
                    },
                    marker: {
                        enabled: false
                    }
                }
            },
            credits:{
                enabled:false
            },
            legend:{
                enabled:true
            }
        };
    }
    this.bindings={
        cashflow:{
            loadData:function(cb){
                var pself=this;
                var drp = pself.ele.find('#dashboardselector').data('daterangepicker');
                var range={
                    start:drp.startDate.unix(),
                    end:drp.endDate.unix()
                }
                modules.api({
                    url:app.sapiurl+'/finances/cashflow2',
                    data:{
                        range:range
                    },
                    callback:function(resp){
                        pself.ele.find('.x_refresh').find('i').removeClass('animate-spin')
                        pself.resp=resp;
                        //console.log(pself.resp)
                        cb()
                    }
                })
            },
            refresh:function(){
                var pself=this;
                pself.ele.find('#listarea').render({
                    template:'admin_finances_cashflow_list',
                    append:false,
                    data:{
                        invoice:(pself.resp.data.invoice)?pself.resp.data.invoice:false,
                        items:pself.resp.data.total.data.stats,
                        all:pself.resp.data,
                        data:pself.resp.data.total.data.data
                    }
                });
                var opts=$.extend(true,{},self.getDefaultOpts());
                //pself.ele.find('.usergraph').css('height',300);
                opts.chart.renderTo=pself.ele.find('#grapharea')[0];
                opts.yAxis.title={
                    text:'Sales'
                }
                opts.tooltip={
                    formatter: function() {
                        return '<div>'+moment(this.x).format('MM/DD/YYYY')+'<br/></div><div><b>$'+_.toMoney(this.y,1,false,1)+'</b></div>'
                    }
                }
                opts.series=[];
                $.each(pself.resp.data.total.data.graph.data,function(i,v){
                    opts.series.push(self.getSeries(v.data,v.name,1));
                })
                $.each(pself.resp.data.event_ticket.data.graph.data,function(i,v){
                    opts.series.push(self.getSeries(v.data,v.name,1));
                })
                $.each(pself.resp.data.subscription.data.graph.data,function(i,v){
                    opts.series.push(self.getSeries(v.data,v.name,1));
                })
                $.each(pself.resp.data.donation_page.data.graph.data,function(i,v){
                    opts.series.push(self.getSeries(v.data,v.name,1));
                })
                $.each(pself.resp.data.fundraiser.data.graph.data,function(i,v){
                    opts.series.push(self.getSeries(v.data,v.name,1));
                })
                if(pself.resp.data.total.data.opts){
                    opts=$.extend(true,{},opts,pself.resp.data.total.data.opts);
                }
                pself.graph=new Highcharts.Chart(opts);
            },
            binding:function(ele){
                this.ele=ele;
                var pself=this;
                ele.find('.x_refresh').stap(function(){
                    ele.find('.x_refresh').find('i').addClass('animate-spin')
                     pself.loadData(function(){
                        ele.find('.x_refresh').find('i').removeClass('animate-spin')
                        pself.refresh()
                    })
                },1,'tapactive')
                ele.find('#dashboardselector').daterangepicker({
                    "opens": "left",
                    ranges: {
                       'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                       'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                       'This Month': [moment().startOf('month'), moment().endOf('month')],
                       'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
                       'Last 3 Months': [moment().subtract(3, 'month'),moment()]
                    },
                    "startDate": moment().subtract(30,'day').format('MM/DD/YYYY'),
                    "endDate": moment().format('MM/DD/YYYY')//today
                }, function(start, end, label) {
                    pself.loadData(function(){
                        pself.refresh()
                    })
                });
                this.loadData(function(){
                    pself.refresh();
                })
            }
        },
        payments:{
            binding:function(ele){
                var pself=this;
               this.inf=new modules.infinitescroll({
                    ele:ele.find('.itemlist'),
                    scroller:ele.find('.scroller'),
                    endpoint:app.sapiurl+'/data/load',
                    loaderClass:'lds-ellipsis-black',
                    offset:'200%',
                    listen:true,
                    checkNextPage:true,
                    context:self,
                    datakey:'_id',
                    onInterval:{
                        time:3000,
                        callback:function(){
                            //pself.updateTimes();
                        }
                    },
                    opts:{
                        filter:'payment_info',
                        query:'',
                        type:'full'
                    },
                    max:10,
                    template:'admin_finances_payment_info',
                    nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>No data here yet.</div></div>',
                    onPageReady:function(ele){
                        // ele.find('.x_edit').stap(function(e){
                        //     var item=self.inf.getById($(this).attr('data-iid'));
                        //     //edit it!
                        //     phi.register('admin_add',{
                        //         ele:$('#wrapper'),
                        //         title:'Edit',
                        //         action:'Save!',
                        //         data:{
                        //             schema:self.ele.find('#datacollselect').val(),
                        //             current:item
                        //         },
                        //         onSave:function(resp){
                        //             self.inf.onEmitData(resp.data);
                        //         },
                        //         onRegister:function(instance){
                        //             instance.component.show();
                        //         }
                        //     });
                        // })  
                    },
                    scrollBindings:{
                        scrollStart:function(){
                        },
                        scroll:function(obj){
                        }
                    }
                });
           }
        },
        subscriptions:{
            binding:function(ele){
               this.inf=new modules.infinitescroll({
                    ele:ele.find('.itemlist'),
                    scroller:ele.find('.scroller'),
                    endpoint:app.sapiurl+'/data/load',
                    loaderClass:'lds-ellipsis-black',
                    offset:'200%',
                    listen:true,
                    checkNextPage:true,
                    context:self,
                    datakey:'_id',
                    onInterval:{
                        time:3000,
                        callback:function(){
                            //pself.updateTimes();
                        }
                    },
                    opts:{
                        filter:'current_subscription_info',
                        query:'',
                        type:'full'
                    },
                    max:10,
                    template:'admin_finances_subscription_info',
                    nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>No data here yet.</div></div>',
                    onPageReady:function(ele){
                    },
                    scrollBindings:{
                        scrollStart:function(){
                        },
                        scroll:function(obj){
                        }
                    }
                });
           }
        },
        invoices:{
            processing:{},
            payInvoice:function(invoice){
                var pself=this;
                if(pself.processing[invoice.id]) return false;
                pself.processing[invoice.id]=1;
                var cv=pself.ele.find('.x_payinvoice[data-invoice='+invoice._id+']').html();
                pself.ele.find('.x_payinvoice[data-invoice='+invoice._id+']').html('<i class="icon-refresh animate-spin"></i>');
                 modules.api({
                    url:app.sapiurl.replace('/one_admin','/')+'stripe/one_admin/payinvoice',
                    data:{
                        invoice_id:invoice.id
                    },
                    timeout:5000,
                    callback:function(resp){
                        pself.processing[invoice.id]=0;
                        pself.ele.find('.x_payinvoice[data-invoice='+invoice._id+']').html(cv);
                        if(resp.success){
                            pself.inf.add(resp.data,1);
                            modules.toast({
                                content:'Successfully sent!'
                            })
                        }else{
                            modules.toast({
                                content:resp.error
                            })
                        }
                    }
                });
            },
            retry:function(invoice){
                var pself=this;
                if(pself.processing[invoice.id]) return false;
                pself.processing[invoice.id]=1;
                var cv=pself.ele.find('.x_retry[data-invoice='+invoice._id+']').html();
                pself.ele.find('.x_retry[data-invoice='+invoice._id+']').html('<i class="icon-refresh animate-spin"></i>');
                 modules.api({
                    url:app.sapiurl.replace('/one_admin','/')+'stripe/one_admin/retrylink',
                    data:{
                        id:invoice.page.id
                    },
                    timeout:5000,
                    callback:function(resp){
                        pself.processing[invoice.id]=0;
                        pself.ele.find('.x_retry[data-invoice='+invoice._id+']').html(cv);
                        if(resp.success){
                            invoice.page.stripe=resp.data;
                            pself.inf.add(invoice,1);
                            modules.toast({
                                content:'Successfully linked account!'
                            })
                        }else{
                            modules.toast({
                                content:resp.error
                            })
                        }
                    }
                });
            },
            request:function(invoice){
                var pself=this;
                if(pself.processing[invoice.id]) return false;
                pself.processing[invoice.id]=1;
                var cv=pself.ele.find('.x_request[data-invoice='+invoice._id+']').html();
                pself.ele.find('.x_request[data-invoice='+invoice._id+']').html('<i class="icon-refresh animate-spin"></i>');
                 modules.api({
                    url:app.sapiurl.replace('/one_admin','/')+'stripe/one_admin/requestlink',
                    data:{
                        invoice:invoice.id
                    },
                    timeout:5000,
                    callback:function(resp){
                        pself.processing[invoice.id]=0;
                        pself.ele.find('.x_request[data-invoice='+invoice._id+']').html(cv);
                        if(resp.success){
                            //pself.inf.add(resp.data,1);
                            modules.toast({
                                content:'Successfully sent!'
                            })
                        }else{
                            modules.toast({
                                content:resp.error
                            })
                        }
                    }
                });
            },
            binding:function(ele){
                var pself=this;
                pself.ele=ele;
               this.inf=new modules.infinitescroll({
                    ele:ele.find('.itemlist'),
                    scroller:ele.find('.scroller'),
                    endpoint:app.sapiurl+'/data/load',
                    loaderClass:'lds-ellipsis-black',
                    offset:'200%',
                    listen:true,
                    checkNextPage:true,
                    context:self,
                    datakey:'_id',
                    onInterval:{
                        time:3000,
                        callback:function(){
                            //pself.updateTimes();
                        }
                    },
                    opts:{
                        filter:'invoice',
                        query:'',
                        type:'full'
                    },
                    max:10,
                    template:'admin_finances_invoice_info',
                    nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>No data here yet.</div></div>',
                    onPageReady:function(ele){
                        ele.find('.x_payinvoice').stap(function(e){
                            var item=pself.inf.getById($(this).attr('data-invoice'));
                            pself.payInvoice(item);
                        },1,'tapactive');
                        ele.find('.x_request').stap(function(e){
                            var item=pself.inf.getById($(this).attr('data-invoice'));
                            pself.request(item);
                        },1,'tapactive');
                        ele.find('.x_retry').stap(function(e){
                            var item=pself.inf.getById($(this).attr('data-invoice'));
                            pself.retry(item);
                        },1,'tapactive');
                        // ele.find('.x_edit').stap(function(e){
                        //     var item=self.inf.getById($(this).attr('data-iid'));
                        //     //edit it!
                        //     phi.register('admin_add',{
                        //         ele:$('#wrapper'),
                        //         title:'Edit',
                        //         action:'Save!',
                        //         data:{
                        //             schema:self.ele.find('#datacollselect').val(),
                        //             current:item
                        //         },
                        //         onSave:function(resp){
                        //             self.inf.onEmitData(resp.data);
                        //         },
                        //         onRegister:function(instance){
                        //             instance.component.show();
                        //         }
                        //     });
                        // })  
                    },
                    scrollBindings:{
                        scrollStart:function(){
                        },
                        scroll:function(obj){
                        }
                    }
                });
           }
        }
    }
    this.refund=function(id,cb,refund_amount){
        modules.toast({
                icon:'icon-refresh animate-spin',
                content:'Refunding...',
                id:'sendemail',
                remove:false
            })
            modules.api({
                url:app.sapiurl+'/finances/refundsubscription',
                data:{
                    id:id,
                    refund_amount:(refund_amount)?refund_amount:''
                },
                timeout:10000,
                callback:function(resp){
                    if(resp.success){
                        modules.toast({
                            id:'sendemail',
                            icon:'icon-thumbs-up',
                            content:'Successfully refunded'
                        })
                       if(cb) cb(true);
                    }else{
                        modules.toast({
                            id:'sendemail',
                            icon:'icon-warning-sign',
                            content:'Error: '+resp.error
                        })
                        if(cb) cb(false);
                    }
                }
            });
    }
    this.refundSubscription=function(e,container,target,data){
        var item=self.bindings.payments.inf.getById(data.id);
        var refund=new modules.alertdelegate({
            display:{
                alert:{
                    content:'Are you sure you want to <b>fully</b> refund this order?'
                }
            },
             menu:[{
                id:'partial',
                name:'Give Partial Refund',
            },{
                id:'no',
                name:'No',
            },{
                id:'yes',
                name:'Yes'
            }],
            onSelect:function(type){
                if(type=='yes'){
                    self.refund(item.id,function(){
                        self.bindings.payments.inf.reload();
                    });
                }
                if(type=='partial'){
                    $('body').alert({
                        template:'admin_finances_refund_partial',
                        icon:false,
                        buttons:[{
                            btext:'Issue partial refund',
                            bclass:'button1 x_done'
                        }],
                        binding:function(ele){
                            self.refundAmount=0;
                            ele.find('.x_done').stap(function(){
                                if(!self.refundAmount) return modules.toast({
                                    icon:'icon-warning-sign',
                                    content:'Please enter an ammount to refund.'
                                });
                                if($(this).hasClass('sending')) return false;
                                $(this).addClass('sending');
                                var te=$(this);
                                var cv=$(this).html();
                                $(this).html('<i class="icon-refresh animate-spin"></i>');
                                self.refund(item.id,function(success){
                                    te.removeClass('sending');
                                    if(success){
                                        self.bindings.payments.inf.reload();
                                        $.fn.alert.closeAlert()
                                    }else{
                                        te.html(cv);
                                    }
                                },self.refundAmount);
                            },1,'tapactive')
                            new modules.input({
                                allowWebInput:true,
                                container:ele,
                                ele:ele.find('.x_amount'),
                                //clickEle:ele.find('.x_donate'),
                                type:'number',
                                format:'decimal',
                                title:'Enter Amount',
                                data:{
                                    current:0
                                },
                                noperms:1,
                                onSet:function(data){
                                    //console.log(data)
                                    //ele.find('.x_amount').html('$'+_.toMoney(data.current*100))
                                    self.refundAmount=data.current*100;
                                    //pself.updateTotal()
                                },
                                formatData:function(data){
                                    return '$'+_.toMoney(data.current*100);
                                }
                            })
                        }
                        //closer:false
                    })
                }
            }
        })
        refund.show();
    }
    this.getSeries=function(data,name,shift){
        //console.log(data)
        var tdata={
            name:name,
            data:[]
        };
        if(shift){
            tshift=0;
            var toffset = ((new Date().getTimezoneOffset())*1000*60-1)*2;//once for Date() and once for highcharts...
        }else var toffset=0;
        $.each(data,function(i,v){
            var ts=self.getTime(v._id,toffset);
            if(v.max!=null){
                tdata.data.push([ts,parseFloat(v.max,10)]);
            }else if(v.count!=null){
                tdata.data.push([ts,parseFloat(v.count,10)]);
            }

        })
        return tdata;
    }
    this.getTime=function(_id,offset){
        var date = new Date(_id.year, 0);
        if(_id.minute){
            date.setDate(_id.day);
            date.setHours(_id.hour);
            return new Date(date.setMinutes(_id.minute)).getTime()-offset;
        }else if(_id.hour){
            date.setDate(_id.day)
            return new Date(date.setHours(_id.hour)).getTime()-offset;
        }else return new Date(date.setDate(_id.day)).getTime()-offset; // add the number of days
    }
    this.refresh=function(){
    }
	this.hide=function(){
		self.ele.hide();
	}
	this.destroy=function(){
        app.user.stopSocket('admin_balance', self.onMessage);
		self.ele.remove();
    }
}