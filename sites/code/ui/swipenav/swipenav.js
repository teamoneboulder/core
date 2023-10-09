$(function(){
	;window._ui.swipenav={
		render:function(opts){
			return $.fn.render({//return template
				returntemplate:true,
				template:(opts.template)?opts.template:'ui_swipenav',
				data:opts
			})
		},
		resize:function(ele){
			var w=0;
			$.each(ele.find('.x_swipenavitem'),function(i,v){
				w+=$(v).outerWidth(true);//true incliude
			})
			w+=10;
			ele.find('.swipenavcontainer').css('width',w);
		},
		bindings:[{
			type:'click',
			selector:'.x_swipenavitem',
			scrollable:true,
			binding:function(e){
				phi.stop(e);
				var pid=$(this).parents('.swipenav');
				var eid=pid.attr('id');
				if(($(this).hasClass('selected')||$(this).hasClass('notselectable'))&&!window._ui.events[eid].allowMultiClick) return false;
				pid.find('.x_swipenavitem').removeClass('selected');
				$(this).addClass('selected')
				var nid=$(this).attr('data-nav');
				if(eid&&window._ui.events&&window._ui.events[eid]&&window._ui.events[eid].onNavSelect){
					window._ui.events[eid].onNavSelect(nid,$(this));
				}else{
					console.warn('no onNavSelect binding')
				}
			}
		},{
			type:'fn',
			binding:function(ele){
				//set horizontal scroller
				window._ui.swipenav.resize(ele);
				new modules.scroller(ele,{eventPassthrough: true, scrollX: true, scrollY: false,forceJS:true})
			}
		}]
	};
});