$(function(){
	;window._ui.toggle={
		render:function(opts){
			return $.fn.render({//return template
				returntemplate:true,
				template:'ui_toggle',
				data:opts
			})
		},
		bindings:[{
			type:'click',
			scrollable:true,
			binding:function(e){
				phi.stop(e)
				var cur=$(this).hasClass('selected');
				if(cur){
					$(this).removeClass('selected');
					cur='';
				}else{
					$(this).addClass('selected');
					cur=1;
				}
				if($(this).attr('id')&&window._ui.events&&window._ui.events[$(this).attr('id')]&&window._ui.events[$(this).attr('id')].onClick){
					window._ui.events[$(this).attr('id')].onClick(cur);
				}
				if($(this).attr('data-id')&&window._ui.events&&window._ui.events[$(this).attr('data-id')]&&window._ui.events[$(this).attr('data-id')].onClick){
					window._ui.events[$(this).attr('data-id')].onClick(cur);
				}
				if($(this).attr('data-type')&&window._ui.events&&window._ui.events[$(this).attr('data-type')]&&window._ui.events[$(this).attr('data-type')].onClick){
					window._ui.events[$(this).attr('data-type')].onClick(cur,$(this).attr('data-id'));
				}
			}
		}],
		// bind:function(ele){
		// 	ele.find('.onoffbox').wire(window._ui.toggle.bindings,{});
		// }
	};
})