$(function(){
	;window._ui.dropdown={
		render:function(opts){
			return $.fn.render({//return template
				returntemplate:true,
				template:(opts.template)?opts.template:'ui_dropdown',
				data:opts
			})
		},
		bindings:[{
			type:'fn',
			binding:function(ele){
				//set horizontal scroller
				ele.find('.currentselection,.dropdownicon').stap(function(e){//toggle
					phi.stop(e);
					if(ele.find('.dropdownlist').is(':visible')){
						TweenLite.to(ele.find('.dropdowndata'),.2,{marginTop:'-125%',onComplete:function(){
							ele.find('.dropdownlist').hide();
						}})
						TweenLite.to(ele.find('.dropdownicon'),.2,{rotation:'0deg'})
					}else{
						ele.find('.dropdownlist').show();
						TweenLite.to(ele.find('.dropdowndata'),.2,{marginTop:0})
						TweenLite.to(ele.find('.dropdownicon'),.2,{rotation:'90deg'})
					}
				},1,'tapactive');
				ele.find('.dropdownitem').stap(function(){
					if(!$(this).hasClass('selected')){
						var cur=$(this).attr('data-id');
						var name=$(this).attr('data-name');
						ele.find('.currentselection').html(name);
						ele.find('.dropdownitem').removeClass('selected');
						$(this).addClass('selected')
						if(ele.attr('id')&&window._ui.events&&window._ui.events[ele.attr('id')]&&window._ui.events[ele.attr('id')].onSelect){
							window._ui.events[ele.attr('id')].onSelect(cur);
						}else{
							console.warn('no event binding!')
						}
					}
					//close
					setTimeout(function(){
						TweenLite.to(ele.find('.dropdowndata'),.2,{marginTop:'-125%',onComplete:function(){
							ele.addClass('hasselection');
							ele.find('.dropdownlist').hide();
						}})
						TweenLite.to(ele.find('.dropdownicon'),.2,{rotation:'0deg'})
					},100)
				},1,'tapactive')
			}
		}]
	};
});