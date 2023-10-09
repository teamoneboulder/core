$(function(){
	;window._ui.togglecheck={
		render:function(opts){
			return $.fn.render({//return template
				returntemplate:true,
				template:'togglecheck',
				data:opts
			})
		},
		bindings:[{
			type:'click',
			scrollable:true,
			selector:'.togglecheck',
			binding:function(){
				var cur=$(this).hasClass('checked');
				if(cur){
					$(this).removeClass('checked');
					cur=false;
				}else{
					$(this).addClass('checked');
					cur=true;
				}
				if($(this).attr('id')&&window._ui.events&&window._ui.events[$(this).attr('id')]&&window._ui.events[$(this).attr('id')].onChange){
					window._ui.events[$(this).attr('id')].onChange(cur);
				}else{
					console.warn('no binding!')
				}
			}
		}]
	};
})