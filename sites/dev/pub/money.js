var app={
	store:{},
	init:function(vars){
		if(vars) $.each(vars,function(i,v){
            if(i!='modules') app[i]=v;
        });
		phi.render($('#wrapper'),{
			template:'money_home',
			binding:function(ele){
				app.ele=ele
				ele.find('.x_apply').stap(function(){
					app.apply();
				})
				ele.find('.x_toggle').stap(function(){
					if($(this).hasClass('selected')){
						$(this).removeClass('selected')
						app.isExact=0;
					}else{
						$(this).addClass('selected')
						app.isExact=1;
					}
				})
				//add infinite loader!
				app.inf=new modules.infinitescroll({
	                ele:app.ele.find('.itemlist'),
	                scroller:app.ele.find('.scroller'),
	                endpoint:app.sapiurl+'/feed',
	                loaderClass:'lds-ellipsis-black',
	                offset:'200%',
	                listen:true,
	                checkNextPage:true,
	                context:app,
	                datakey:'_id',
	                onInterval:{
	                	time:3000,
	                	callback:function(){
	                		//pself.updateTimes();
	                	}
	                },
	                opts:{
	                },
	                max:10,
	                template:'money_item',
	                nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>No data here yet.</div></div>',
	                onPageReady:function(ele){
	                    // ele.find('.x_edit').stap(function(e){
	                    //     var item=app.inf.getById($(this).attr('data-iid'));
	                    //     //edit it!
	                    //     phi.register('admin_add',{
	                    //         ele:$('#wrapper'),
	                    //         title:'Edit',
	                    //         action:'Save!',
	                    //         data:{
	                    //             schema:self.ele.find('#datacollselect').val(),
	                    //             current:item,
	                    //             excludeFields:['pass']
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
				app.doneLoaing()
			}
		})
	},
	blacklist:function(e,target,container,data){
		$('body').confirm({
			icon:'icon-question-mark',
			content:'Blacklist this exchange?',
			buttons:[{
            btext:'Yes, Blacklist',
	            bclass:'yesbtn'
	        },{
	            btext:'Cancel',
	            bclass:'cancelbtn'
	        }],
			cb:function(success){
				if(success){
					modules.api({
						url:app.sapiurl+'/blacklist',
						data:{
							id:data.id
						},
						callback:function(resp){
							app.ele.find('[data-domain="'+data.id+'"]').fadeOut(500,function(){
								$(this).remove();
								app.inf.updateHeight()
							})
						}
					})
				}
			}
		})
	},
	apply:function(){
		var filter={
			tokens:app.ele.find('#tokens').val(),
			volume:app.ele.find('#volume').val(),
			exact:app.isExact
		}
		app.inf.options.opts=filter;
		app.inf.reload();
		console.log(filter)
	},
	doneLoaing:function(){
        $('#wrapper').show()
        $('#splash').hide()
    	$('.page-loader').fadeOut(500,function(){
    		$(this).remove();
    	})
    }
}