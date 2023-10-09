$(function(){
	;window._ui.radio={
		render:function(opts){
			return $.fn.render({//return template
				returntemplate:true,
				template:(opts.template)?opts.template:'radio',
				data:opts
			})
		},
		bindings:[{
			type:'fn',
			binding:function(ele){
				var id=ele.attr('id');
				ele.find('.radioitem').stap(function(){
					var m=$(this).attr('data-multiple');
					var ut=$(this).attr('data-dontuntoggle');
					if(m){
						if($(this).hasClass('selected')&&ut) return false;
						$(this).toggleClass('selected');
						if(id&&window._ui.events&&window._ui.events[id]&&window._ui.events[id].onChange){
							var cur=[];
							ele.find('.radioitem.selected').each(function(i,v){
								cur.push($(this).attr('data-id'));
							})
							window._ui.events[id].onChange(cur);
						}else{
							console.warn('no binding!')
						}
					}else{
						if($(this).hasClass('selected')) return false;
						ele.find('.radioitem').removeClass('selected');
						$(this).addClass('selected');
						var cur=$(this).attr('data-id');
						if(id&&window._ui.events&&window._ui.events[id]&&window._ui.events[id].onChange){
							window._ui.events[id].onChange(cur);
						}else{
							console.warn('no binding!')
						}
					}
				},1,'tapactive');
			}
		}]
	};
})