$.fn.nectarFeedback = function(settings) {
	$.fn.nectarFeedback.cele='';
	var log=function(msg){
		//console.log('NECTARFEEDBACK::'+msg);
	}
	var animation='';
	if(!$.fn.nectarFeedback.ele){
		//render feedback template to body
		var conf={
			radius:100,
			size:60,
			list:modules.feed_global.reactions.list,
			order:modules.feed_global.reactions.order
		}
		function __checkMousePosition(e){
			__throttle('bounds',function(){
				var pos={
					x:e.clientX,
					y:e.clientY
				}
				__checkBounds(pos)
			})
		}
		$('body').render({
			template:'modules_nectarfeedback_selector',
			data:conf,
			binding:function(ele){
				//render the 
				log('initial render');
				$.fn.nectarFeedback.ele=ele;
				if(app.isWebLayout()){
					ele.stap(function(e){
						if($.fn.nectarFeedback.currenthover=='center'){
							var isLiked = $.fn.nectarFeedback.currentele.attr("data-emoji-class");
							if(isLiked){
								//clear!
								if(settings.onChange) settings.onChange($.fn.nectarFeedback.currentele.attr('data-unique-id'),'');
								$.fn.nectarFeedback.currentele.attr("data-emoji-class","");	
								log('clear');
								//_select(e,$.fn.nectarFeedback.ele.find('[data-emoji-value='+modules.feed_global.reactions.default+']'),_this);
							}else{
								if(settings.onChange) settings.onChange($.fn.nectarFeedback.currentele.attr('data-unique-id'),modules.feed_global.reactions.default);
								$.fn.nectarFeedback.currentele.attr("data-emoji-class", modules.feed_global.reactions.default);					
								$.fn.nectarFeedback.ele.find('.nectar_hover').removeClass('nectar_hover');
								log('set default');
							}
							//set timeout for when it can be selected again
						}else if($.fn.nectarFeedback.currenthover){
							_select(e,$.fn.nectarFeedback.ele.find('[data-emoji-value='+$.fn.nectarFeedback.currenthover+']'),$.fn.nectarFeedback.cele,1);
							// if(settings.onChange) settings.onChange($.fn.nectarFeedback.currentele.attr('data-unique-id'),$.fn.nectarFeedback.currenthover);
							// $.fn.nectarFeedback.currentele.attr("data-emoji-class", $.fn.nectarFeedback.currenthover);					
							// $.fn.nectarFeedback.ele.find('.nectar_hover').removeClass('nectar_hover');
						}else{
							console.log('nothing here.')
						}
						__hide(1,1);
					},1,'tapactive');
				}
			}
		})
	} 
	var throttles={};
	function __throttle(key,fn){
		if(fn){
			if(!throttles[key]){
				throttles[key]=setTimeout(function(){
					throttles[key]=false;
					fn();
				},50);
			}
		}else{
			if(throttles[key]) clearTimeout(throttles[key]);
			throttles[key]=false;
		}
	}
	// function __mouseMove(e){
	// 	//if(showing){
	// 		var pos={
	// 			x:e.clientX,
	// 			y:e.clientY
	// 		}
	// 		__throttle('bounds',function(){
	// 			__checkBounds(pos)
	// 		});
	// 	//}
	// }
	function __hide(web,selected) {
		log('hide');
		showing=false;
		if(!isMobile) $('body').off('mousemove',__checkMousePosition);
		$.fn.nectarFeedback.currentele.find('.nectar_hover').removeClass('nectar_hover')
		$.fn.nectarFeedback.ele.hide();		
		$.fn.nectarFeedback.ele.removeClass('ov_visi');
		if(web){
			var to=(selected)?1000:500;
			setTimeout(function(){
				$.fn.nectarFeedback.currentele.removeClass('open');
				$.fn.nectarFeedback.ele.attr('data-status', 'hidden');
			},to);
		}else{
			$.fn.nectarFeedback.currentele.removeClass('open');
			$.fn.nectarFeedback.ele.attr('data-status', 'hidden');
		}	
	}
	function __checkBounds(pos){
		log('check bounds');
		$.each($.fn.nectarFeedback._bounds,function(i,v){
			if(_isInside(pos,v)){
				v.ele.addClass('nectar_hover');
				v.hover=true;
				$.fn.nectarFeedback.currenthover=i;
			}else{
				if(v.hover){
					v.ele.removeClass('nectar_hover');
				}	
				v.hover=false;
				if(i==$.fn.nectarFeedback.currenthover) $.fn.nectarFeedback.currenthover=false;
			}
		});
		if(app.isWebLayout()){//also check bounds
			if(!_isInside(pos,$.fn.nectarFeedback._containerBounds)){
				__hide(1)
			}
		}
	}
	function _isInside(pos,bounds){
		var inx=false;
		var iny=false;
		if(pos.x>bounds.topleft.x&&pos.x<bounds.bottomright.x){
			inx=true;
		}
		if(pos.y>bounds.topleft.y&&pos.y<bounds.bottomright.y){
			iny=true;
		}
		if(inx&&iny) return true;
		return false;
	}
	function __mouseover(){
		if($.fn.nectarFeedback.to) clearTimeout($.fn.nectarFeedback.to);
	}
	function __mouseout(){
		$.fn.nectarFeedback.to=setTimeout(function(){
			__hide();
		},50)
	}
	function _select(e,base,ele,web){
		//console.log(ele)
		log('_select');
		if(e.target !== e.currentTarget&&!web){
			console.warn('invalid')
			return;	
		}
		//console.log('SEELCT')
		var move_emoji =base;
		move_emoji.removeClass('nectar_hover');
		// on complete reaction
		emoji_value = move_emoji.data('emoji-value');
		emoji_name = move_emoji.data('emoji-name');
		var offset=move_emoji.offset();
		if (move_emoji) {
			var cloneemoji = move_emoji.clone().addClass('clone').css({
				'top':(offset.top+25)+'px',
				'left':(offset.left+25)+'px',
				'opacity': '0.9',
				'position': 'absolute',
				'zIndex': '99',
				'transform':'scale(1.8)'
			}).appendTo($('body'))
			.animate({
					'top': ele.offset().top,
					'left': ele.offset().left + 3,
					'width': 30,
					'height': 30,
					'transform':'scale(1)'
			}, 300, 'easeInBack');
			cloneemoji.animate({
				'width': 30,
				'height': 30
			},100, function () {
				var _imgicon = $(this);
				ele.attr("data-emoji-class", emoji_value);
				_imgicon.fadeOut(100, function(){ 
					_imgicon.detach(); 
					 // add icon class
					 base.removeClass('nectar_hover')
					// change text
					//base.find('span').html(emoji_name);
					if(settings.onChange) settings.onChange(ele.attr("data-unique-id"),emoji_value);
				});
			});
		}
	}
	_bounds={};
	$.fn.nectarFeedback._bounds={};
	return this.each(function() {
		var _this = $(this);
		window.tmr;
		window.selector = _this.get(0).className;
		var to=false;
		var showing=0;
		var hideOnShow=false;
		var isShowing=0;
		var hto=0;
		var hasmoved=0;
		var tint='';
		log('Bind');
		$(this).on('touchstart mousedown',function(e){
			var obj=this;
			if(tint){
				clearInterval(tint);
				tint=false;
			}
			log('touchstart');
			showing=true;
			to=setTimeout(function(){
				if(hto) clearTimeout(hto);
				__show(_this,1);
				if(settings.onMobileMenuShow) settings.onMobileMenuShow();
			},100);
			hasmoved=1;
			tint=setInterval(function(){
				if(!hasmoved){
					console.log('==========HIDE!!!!!');
					if(to) clearTimeout(to);
					__hide(_this);
					__throttle('bounds');//stop the bound checking, dont want this happening after touchend
					if(tint){
						clearInterval(tint);
						tint=false;
					}
					if(settings.onMobileMenuHide) settings.onMobileMenuHide();
					$.fn.nectarFeedback.currenthover=false;
				}
				hasmoved=0;
			},250);
			// if(e.type=='mousedown'){
			// 	$('body').on('mousemove',__mouseMove);
			// 	$('body').on('mouseup',__mouseUp);
			// }
			e.preventDefault();//prevent selecting of image
		}).on('touchmove',function(e){
			phi.stop(e);//stop it!
			hasmoved=1;
			log('touchmove');
			if(to) clearTimeout(to);
			var pos={
				x:e.originalEvent.touches[0].pageX,
				y:e.originalEvent.touches[0].pageY
			}
			__throttle('bounds',function(){
				__checkBounds(pos)
			});
		}).on('touchend',function(e){
			log('touchend');
			if(tint){
				clearInterval(tint);
				tint=false;
			}
			__throttle('bounds');//stop the bound checking, dont want this happening after touchend
			if(to) clearTimeout(to);
			// if(isShowing){
			// 	hideOnShow=true;
			// }else{
			// 	__touchEnd(e)
			// }
			if(animation){
				if(to) clearTimeout(to);
				__hide(_this);
				animation.kill();
				animation=false;
			}else{
				__touchEnd(e)
			}
		})
		$(this).stap(function(e) {
			if(to) clearTimeout(to);
			if(e.target !== e.currentTarget) return;	
			var isLiked = $(this).attr("data-emoji-class");
			var control_id = $(this).attr("data-unique-id");
			$(this).html(settings.defaultText);	
			if(isLiked)
			{					
				$(this).attr("data-emoji-class", "");
				if(settings.onChange) settings.onChange(control_id,"");
			}
			else
			{				
				$.fn.nectarFeedback.currenthover=modules.feed_global.reactions.default;
				$(this).attr("data-emoji-class", modules.feed_global.reactions.default);					
				if(settings.onChange) settings.onChange(control_id,modules.feed_global.reactions.default);
			}
		},1,'tapactive');
		
		if(app.isWebLayout()&&!isMobile){
			$(this).on('mousemove',function (){
				if ( _this.hasClass("emoji") ){
					return false;
				}
				
				if(_this.hasClass("open") === true)
				{
					clearTimeout(window.tmr);
					return false;
				}
				if( $.fn.nectarFeedback.ele.attr('data-status') != 'active' ) {	
					$.fn.nectarFeedback.ele.attr('data-status','active');			
					var te=$(this);
					$.fn.nectarFeedback.wait=true;
					setTimeout(function(){
						__show(te,1);
						setTimeout(function(){
							$.fn.nectarFeedback.wait=false;
						},150);
					},250)
				}
			});
		}
		
		// functions
		function __touchEnd(e){
			if(to) clearTimeout(to);
			if(showing){
				//$.fn.nectarFeedback.ele.find('[data-emoji-value='+currenthover+']').stap();
				if($.fn.nectarFeedback.currenthover) _select(e,$.fn.nectarFeedback.ele.find('[data-emoji-value='+$.fn.nectarFeedback.currenthover+']'),_this);
				hto=setTimeout(function(){
					__hide(_this)
				},100)
				if(settings.onMobileMenuHide) settings.onMobileMenuHide();
				$.fn.nectarFeedback.currenthover=false;
				showing=false;
			}
		}
		// function __mouseUp(e){
		// 	//unbind
		// 	$('body').off('mouseup',__mouseUp);
		// 	$('body').off('mousemove',__mouseMove);
		// 	setTimeout(function(){
		// 		__touchEnd(e);
		// 	},10)
		// }
		function _isInside(pos,bounds){
			var inx=false;
			var iny=false;
			if(pos.x>bounds.topleft.x&&pos.x<bounds.bottomright.x){
				inx=true;
			}
			if(pos.y>bounds.topleft.y&&pos.y<bounds.bottomright.y){
				iny=true;
			}
			if(inx&&iny) return true;
			return false;
		}
		function __show(_this,box) {
			log('show');
			$.fn.nectarFeedback.cele=_this;
			clearTimeout(window.tmr);			
			$.fn.nectarFeedback.ele.attr('data-status', 'active');
			
			$.fn.nectarFeedback.ele.addClass('ov_visi');
			
			$(_this).addClass("open");
			
			// vertical or horizontal
			$.fn.nectarFeedback.currentele=_this;
			var pos=_this.offset();
			var left=(pos.left+(_this.width()/2));
			var top=(pos.top+(_this.height()/2));
			var height=$.fn.nectarFeedback.ele.height();
			var maxtop=top-height/2;
			var maxbottom=top+height/2;
			var spos=settings.scroller.offset();
			var stop=spos.top;
			var sbottom=stop+settings.scroller.height();
			var shift=0;
			if(maxtop<stop){
				shift=stop-maxtop;
			}
			if(maxbottom>sbottom){
				shift=-(maxbottom-sbottom);
			}
			top+=shift;
			$.fn.nectarFeedback.ele.css({top:top+'px',left:left+'px'});
			$.fn.nectarFeedback.ele.find('.nectar_hover').removeClass('nectar_hover');
			TweenLite.set($.fn.nectarFeedback.ele,{opacity:.3,scale:.3});
			$.fn.nectarFeedback.ele.show();
			var coffset=$.fn.nectarFeedback.ele.offset();
			$.fn.nectarFeedback._containerBounds={};
			var margin=120;
			var padding=40;
			//var padding=0;
			var containerWidth=$.fn.nectarFeedback.ele.outerWidth()+2*padding;
			var containerHeight=$.fn.nectarFeedback.ele.outerHeight()+2*padding;
			$.fn.nectarFeedback._containerBounds.topleft={
				x:coffset.left-margin,
				y:coffset.top-margin
			}
			$.fn.nectarFeedback._containerBounds.bottomright={
				x:coffset.left+containerWidth,
				y:coffset.top+containerHeight
			}
			isShowing=true;
			animation=TweenLite.to($.fn.nectarFeedback.ele,.1,{opacity:1,scale:1,onComplete:function(){
				animation=false;
				isShowing=false;
				if(hideOnShow){
					hideOnShow=false;
					return __hide();
				}
				if(box){
					//iterate over each emoticon and calc bounding box!
					$.fn.nectarFeedback.ele.find('.emoji_container').each(function(i,v){
						var emoji=$(v);
						var pos=emoji.offset();
						var type=emoji.data('emoji-value');
						$.fn.nectarFeedback._bounds[type]=_bounds[type]={
							ele:emoji,
							topleft:{
								y:pos.top,
								x:pos.left
							},
							bottomright:{
								y:pos.top+emoji.outerHeight(),
								x:pos.left+emoji.outerWidth(),
							}
						}
					})
					if(false){
						$('body').render({
							content:'<div id="checker" style="z-index:10000;position:absolute;top:'+$.fn.nectarFeedback._containerBounds.topleft.y+'px;left:'+$.fn.nectarFeedback._containerBounds.topleft.x+'px;height:'+containerHeight+'px;width:'+containerWidth+'px;border:3px solid red;"></div>'
						})
					}
				}
				if(!isMobile){
					$('body').on('mousemove',__checkMousePosition);
					$.fn.nectarFeedback.currenthover='center';
				}
			}});
		}
	});
}
