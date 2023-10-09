$(function(){
	;window._ui.themepicker={
		render:function(opts,ele){
			if(opts.id) window._ui.opts[opts.id]=opts;
			if(!ele){
				return $.fn.render({//return template
					returntemplate:true,
					template:'themepicker',
					data:$.extend(true,{},{data:opts})
				});
			}else{
				ele.render({
					replace:1,
					template:'themepicker',
					data:$.extend(true,{},{data:opts}),
					bindings:window._ui.themepicker.bindings
				})
			}
		},
		rerender:function(id,pele,current){
			var opts=window._ui.opts[id];
			opts.current=current;
			window._ui.themepicker.render(opts,pele);
		},
		bindings:[{
			type:'click',
			scrollable:true,
			binding:function(){
				if($(this).attr('data-id')&&window._ui.events&&window._ui.events[$(this).attr('data-id')]&&window._ui.events[$(this).attr('data-id')].onClick){
					// window._ui.events[$(this).attr('data-id')].onClick($(this).attr('data-id'));
					window._ui.themepicker.showPicker($(this).attr('data-id'),$(this));
				}else{
					console.warn('no binding!')
				}
			}
		}],
		showPicker:function(id,ele){
			var opts=window._ui.opts[id];
			var alert2=new modules.mobilealert({
                template:'mobilealert_picker',
                opts:opts,
                onEndAnimationSelect:function(tid){
                	if(tid=='color'){
                		window._ui.themepicker.showColorPicker(id,ele);
                	}
                	if(tid=='reset'){
                		if(window._ui.events[id].onSet('')){
                			var current=window._ui.events[id].onSet();
                			window._ui.themepicker.rerender(id,ele,current);
                		}
                	}
                	if(tid=='image'){
                		console.log('img')
                	}
                }
            });
            alert2.show();
		},
		showColorPicker:function(id,pele){
			var opts=window._ui.opts[id];
			var alert3=new modules.mobilealert({
                template:'mobilealert_colorpicker',
                opts:opts,
                disableTouch:true,
                binding:function(ele){
                	// ele.find('.pickcontainer').on('touchstart',function(e){
                	// 	phi.stop(e);
                	// }).on('touchmove',function(e){
                	// 	phi.stop(e);
                	// })
                	ele.find('.x_closer').stap(function(){
                		alert3.hide();
                	},1,'tapactive')
                	ele.find('.x_set').stap(function(){
                		var v=ele.find('.x_picker').val();
                		if(window._ui.events[id].onSet){
                			window._ui.events[id].onSet({color:'#'+v});
                		}
                		//rerender!
                		window._ui.themepicker.rerender(id,pele,{color:'#'+v});
                		alert3.hide();
                	},1,'tapactive')
                	ele.find('.x_picker').on('change',function(){
                		//console.log($(this).val())
                	})
                	window.jscolor(ele.find('.x_picker')[0],{
                		container:ele.find('.area')[0],
                		showOnClick:false
                	});
                }
            });
            alert3.show();
		}
	};
})