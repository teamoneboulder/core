/*!
 @package Facebook-Reactions-JS - A jQuery Plugin to generate Facebook Style Reactions. 
 @version version: 1.0
 @developer github: https://github.com/99points/Facebook-Reactions-JS
 
 @developed by: Zeeshan Rasool. [Founder @ http://www.99points.info & http://wallscriptclone.com]
 
 @license Licensed under the MIT licenses: http://www.opensource.org/licenses/mit-license.php
*/

(function($) {

	$.fn.facebookReactions = function(options) {
     	var default_icon=modules.feed_global.reactions.list[modules.feed_global.reactions.default];
		var settings = $.extend( {
			postUrl: false, // once user will select an emoji, lets save this selection via ajax to DB.
			defaultText: default_icon.name, // default text for button
			default_icon:modules.feed_global.reactions.default
		}, options);
		
		var emoji_value;
		if(!$.fn.facebookReactions.loaded){
			var _react_html = '<div style="position:absolute; z-index: 1;" class="_bar" data-status="hidden"><div class="_inner">'; 
			var faces='';
			$.each(modules.feed_global.reactions.order,function(i,v){
				var item=modules.feed_global.reactions.list[v];
				faces+='<div class="emoji_container" data-emoji-value="'+v+'" data-emoji-name="'+item.name+'"><div class="infobar l-corner-all">'+item.name+'</div><img src="'+item.svg+'" class="emoji" style="" /></div>';
			})
			_react_html = _react_html + faces;
			
			_react_html = _react_html + '<br clear="all" /></div></div>';
			
			$(_react_html).appendTo($('body'));
			$.fn.facebookReactions.loaded=1;
		}
		
		var _bar = $('._bar');
		var _inner = $('._inner');
		var _bounds={};
		_bar.find('.emoji').stap(function (e) {
			_select(e,$(this));
			return false;
		},1,'tapactive');
		function _select(e,ele){
			//console.log(ele)
			if(e.target !== e.currentTarget) return;	
			//console.log('SEELCT')
			var base =ele.parent().parent().parent();
			var move_emoji =ele.first();
			move_emoji.removeClass('react_hovering');
			// on complete reaction
			emoji_value = move_emoji.data('emoji-value');
			emoji_name = move_emoji.data('emoji-name');
			
			if (move_emoji) {
				var cloneemoji = move_emoji.clone().offset({
					top: move_emoji.offset().top,
					left: move_emoji.offset().left
				}).css({
					'height': '50px',
					'width': '50px',
					'opacity': '0.9',
					'position': 'absolute',
					'z-index': '99',
					'transform':'scale(1.5)'
				}).appendTo($('body'))
				.animate({
						'top': base.offset().top,
						'left': base.offset().left + 3,
						'width': 30,
						'height': 30,
						'transform':'scale(.5)'
				}, 300, 'easeInBack');
				cloneemoji.animate({
					'width': 30,
					'height': 30
				},100, function () {
					var _imgicon = $(this);
					_imgicon.fadeOut(100, function(){ 
						_imgicon.detach(); 
						 // add icon class
						 base.find('.react_hovering').removeClass('react_hovering')
						base.attr("data-emoji-class", emoji_value);
						// change text
						base.find('span').html(emoji_name);
						if(settings.onChange) settings.onChange(base.attr("data-unique-id"),emoji_value);
					});
				});
			}
		}
		return this.each(function() {
			
			var _this = $(this);
			window.tmr;
			window.selector = _this.get(0).className;
			var to=false;
			var showing=0;
			var currenthover=false;
			$(this).find('span').on('touchstart mousedown',function(e){
				var obj=this;
				to=setTimeout(function(){
					showing=true;
					__show(_this,1);
					if(settings.onMobileMenuShow) settings.onMobileMenuShow();
				},100);
				if(e.type=='mousedown'){
					$('body').on('mousemove',__mouseMove);
					$('body').on('mouseup',__mouseUp);
				}
			}).on('touchmove',function(e){
				phi.stop(e);//stop it!
				if(to) clearTimeout(to);
				if(showing){
					var pos={
						x:e.originalEvent.touches[0].pageX,
						y:e.originalEvent.touches[0].pageY
					}
					__throttle('bounds',function(){
						__checkBounds(pos)
					});
				}
			}).on('touchend',function(e){
				__touchEnd(e)
			})
			$(this).find('span').stap(function(e) {
				if(to) clearTimeout(to);
				if(e.target !== e.currentTarget) return;	
				var isLiked = $(this).parent().attr("data-emoji-class");
				var control_id = $(this).parent().attr("data-unique-id");
				$(this).html(settings.defaultText);	
				if(isLiked)
				{					
					$(this).parent().attr("data-emoji-class", "");
					if(settings.onChange) settings.onChange(control_id,"");
				}
				else
				{				
					var currenthover=settings.default_icon;
					$(this).parent().attr("data-emoji-class", settings.default_icon);					
					if(settings.onChange) settings.onChange(control_id,settings.default_icon);
				}
			},1,'tapactive');
			
			if(false) $(this).hover(function (){
							
				if ( $(this).hasClass("emoji") ){
					return false;
				}
				
				if($(this).hasClass("open") === true)
				{
					clearTimeout(window.tmr);
					return false;
				}
					
				$('.'+window.selector).each(function() {
						 
					__hide(this);
				});
				
				if( _bar.attr('data-status') != 'active' ) {
					
					__show(this);
				}
			},function ()
				{  
					var _this = this;
					
					window.tmr = setTimeout( function(){
					   
					   __hide(_this); 
					   
					}, 1000);
				}
			);
			
			// functions
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
				}
			}
			function __touchEnd(e){
				if(to) clearTimeout(to);
				if(showing){
					//_bar.find('[data-emoji-value='+currenthover+']').stap();
					if(currenthover) _select(e,_bar.find('[data-emoji-value='+currenthover+']'));
					setTimeout(function(){
						__hide(_this)
					},100)
					if(settings.onMobileMenuHide) settings.onMobileMenuHide();
					currenthover=false;
					showing=false;
				}
			}
			function __mouseMove(e){
				if(to) clearTimeout(to);
				if(showing){
					var pos={
						x:e.clientX,
						y:e.clientY
					}
					__throttle('bounds',function(){
						__checkBounds(pos)
					});
				}
			}
			function __mouseUp(e){
				//unbind
				$('body').off('mouseup',__mouseUp);
				$('body').off('mousemove',__mouseMove);
				setTimeout(function(){
					__touchEnd(e);
				},10)
			}
			function __hide(_this) {
				
				_bar.attr('data-status', 'hidden');
				
				_bar.hide();
				
				$('.open').removeClass("open");
				
				_inner.removeClass('ov_visi');
			}
			function __checkBounds(pos){
				$.each(_bounds,function(i,v){
					if(_isInside(pos,v)){
						v.ele.addClass('react_hovering');
						v.hover=true;
						currenthover=i;
					}else{
						if(v.hover){
							v.ele.removeClass('react_hovering');
						}	
						v.hover=false;
						if(i==currenthover) currenthover=false;
					}
				})
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
			function __show(_this,box) {
				
				clearTimeout(window.tmr);
				
				$(_this).append(_bar.fadeIn());
				
				_bar.attr('data-status', 'active');
				
				_inner.addClass('ov_visi');
				
				$(_this).addClass("open");
				
				// vertical or horizontal
				var position = $(_this).data('reactions-type');
				
				if( position == 'horizontal' )
				{
					_inner.css('width', '300px');
					// Set main bar position top: -50px; left:0px;
					_bar.css({'top': '-50px', 'left': '10px', 'right': 'auto' });
				}
				else
				{
					_inner.css('width', '41px');
					_bar.css({'top': '-6px', 'right': '-48px', 'left': 'auto' });
				}
				if(box){
					//iterate over each emoticon and calc bounding box!
					_bar.find('.emoji_container').each(function(i,v){
						var emoji=$(v);
						var pos=emoji.offset();
						var type=emoji.data('emoji-value');
						_bounds[type]={
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
				}
			}
		});
	};

})(jQuery);
