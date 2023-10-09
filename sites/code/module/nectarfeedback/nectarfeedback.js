modules.nectarfeedback=function(options){
	var self=this;
	self.options=options;
	self.debug=true;
	self.conf={
		radius:100,
		size:60,
		default:'love',
        list:{
            love:{
                name:'Love',
                svg:'https://s3.amazonaws.com/wearenectar/emojis/pink_heart.svg?v=23',
                dark_svg:'https://s3.amazonaws.com/wearenectar/emojis/heart-empty-grey.svg?v=23'
            },
            riseup:{
                name:'Rise Up',
                svg:'https://s3.amazonaws.com/wearenectar/emojis/riseup.svg?v=23'
            },
            wisdom:{
                name:'Wisdom',
                svg:'https://s3.amazonaws.com/wearenectar/emojis/wisdom.svg?v=23'
            },
            inspiring:{
                name:'Inspiring',
                svg:'https://s3.amazonaws.com/wearenectar/emojis/magic.svg?v=23'
            },
            beautiful:{
                name:'Beautiful',
                svg:'https://s3.amazonaws.com/wearenectar/emojis/flower.svg?v=23'
            },
            funny:{
                name:'Funny',
                svg:'https://s3.amazonaws.com/wearenectar/emojis/haha.svg?v=23'
            },
            hands:{
                name:'Blessings',
                svg:'https://s3.amazonaws.com/wearenectar/emojis/hands.svg?v=23'
            },
            angry:{
                name:'Angry',
                svg:'https://wearenectar.s3.amazonaws.com/emojis/angry.svg?v=23'
            },
            sad:{
                name:'Sad',
                svg:'https://wearenectar.s3.amazonaws.com/emojis/sad.svg?v=23'
            },
            hug:{
                name:'Hugs',
                svg:'https://wearenectar.s3.amazonaws.com/emojis/hug.svg?v=23'
            },
            wow:{
                name:'Wow',
                svg:'https://wearenectar.s3.amazonaws.com/emojis/wow.png?v=24'
            }
        },
        order:['hug','sad','funny','angry','wow','hands','wisdom','riseup','beautiful','love','inspiring'],
		placeholder:'love'
	}
	this.log=function(msg){
		if(self.debug) console.log('nectarfeedback ===> '+msg);
	}
	this.ensureRender=function(cb){
		$('body').render({
			template:'modules_nectarfeedback_selector',
			data:self.conf,
			binding:function(ele){
				//render the 
				self.log('initial render');
				self.ele=ele;
				if(modules.tools.isWebLayout()){
					ele.stap(function(e){
						if(self.currenthover=='center'){
							var isLiked = options.ele.attr("data-emoji-class");
							if(isLiked){
								//clear!
								if(options.onChange) options.onChange(options.ele.attr('data-unique-id'),'');
								options.ele.attr("data-emoji-class","");	
								self.log('clear');
							}else{
								if(options.onChange) options.onChange(options.ele.attr('data-unique-id'),self.conf.placeholder);
								options.ele.attr("data-emoji-class", self.conf.placeholder);					
								self.ele.find('.nectar_hover').removeClass('nectar_hover');
								self.log('set default');
							}
						}else if(self.currenthover){
							self.select(e,self.ele.find('[data-emoji-value='+self.currenthover+']'),1);
						}else{
							self.log('nothing here');
						}
						self.hide(1,1);
					},1,'tapactive');
				}
				setTimeout(function(){
					cb();
				},10);
			}
		})
	}
	this.init=function(){
		if(modules.tools.isWebLayout()&&!isMobile){
			options.ele.on('mousemove',function (e){
				phi.stop(e);
				if(self.showing) return false;
				// if ( options.ele.hasClass("emoji") ){
				// 	self.log('hasEmoji: dont show');
				// 	return false;
				// }
				
				// if(options.ele.hasClass("open") === true){
				// 	self.log('OPEN: dont show');
				// 	return false;
				// }
				if(!self.wto){		
					self.wto=setTimeout(function(){
						self.show();
					},100)
				}
			}).on('mouseout',function(){
				if(self.wto) clearTimeout(self.wto);
				self.wto=false;
			})
			options.ele.stap(function(e) {
				self.onClick(e);
			},1,'tapactive');
		}
		options.ele.on('touchstart',function(e){
			self.log('touchstart');
			var obj=this;
			if(isPhoneGap()){
				self.willShow=true;
				self.to=setTimeout(function(){
					self.to=false;
					self.willShow=false;
					self.show(1);
					if(options.onMobileMenuShow) options.onMobileMenuShow();
				},100);
			}
			self.hasmoved=1;
			self.startpos=_.touchEvent.getCoords(e);
			self.lastpos=self.startpos;
			self.tint=setInterval(function(){
				if(!self.hasmoved){
					if(self.to) clearTimeout(self.to);
					self.hide();
					self.throttle('bounds');//stop the bound checking, dont want this happening after touchend
					if(self.tint){
						clearInterval(self.tint);
						self.tint=false;
					}
					if(options.onMobileMenuHide) options.onMobileMenuHide();
					self.currenthover=false;
				}
			},250);
		}).on('touchmove',function(e){
			self.log('touchmove');
			phi.stop(e);//stop it!
			self.hasmoved=1;
			if(self.to) clearTimeout(self.to);
			self.to=false;
			var pos={
				x:e.originalEvent.touches[0].pageX,
				y:e.originalEvent.touches[0].pageY
			}
			self.lastpos=_.touchEvent.getCoords(e);
			self.throttle('bounds',function(){
				self.checkBounds(pos);
			});
		}).on('touchend',function(e){
			self.log('touchend');
			if(self.willShow){
				var info=_.touchEvent.getInfo(self.startpos,self.lastpos);
				if(info.dist<10){
					self.onClick();
				}
			}
			self.willShow=false;
			if(self.tint){
				clearInterval(self.tint);
				self.tint=false;
			}
			self.throttle('bounds');//stop the bound checking, dont want this happening after touchend
			if(self.to) clearTimeout(self.to);
			self.to=false;
			if(self.showing){
				if(self.animation){
					self.animation.kill();
					self.animation=false;
					self.animating=false;
				}
				if(self.currenthover) self.select(e,self.ele.find('[data-emoji-value='+self.currenthover+']'));
				self.hto=setTimeout(function(){
					self.hide()
				},100)
				if(options.onMobileMenuHide) options.onMobileMenuHide();
			}
			self.currenthover=false;
		})
	}
	this.onClick=function(e){
		if(self.to) clearTimeout(self.to);
		self.to=false;
		if(e&&e.target !== e.currentTarget) return;	
		var isLiked = options.ele.attr("data-emoji-class");
		var control_id = options.ele.attr("data-unique-id");
		//options.ele.html(options.defaultText);	
		if(isLiked){					
			options.ele.attr("data-emoji-class", "");
			if(options.onChange) options.onChange(control_id,"");
		}else{				
			options.ele.attr("data-emoji-class", self.conf.placeholder);					
			if(options.onChange) options.onChange(control_id,self.conf.placeholder);
		}
		if(self.showing){
			self.hide();
		}
	}
	this.checkBounds=function(pos){
		//return false;
		if(self.animating) return false;
		self.log('checkBounds');
		if(app.size(self.bounds)) $.each(self.bounds,function(i,v){
			if(self.isInside(pos,v)){
				if(self.currenthover!=i){
					v.ele.addClass('nectar_hover');
					self.currenthover=i;
				}
			}else{
				if(i==self.currenthover){
					v.ele.removeClass('nectar_hover');
					self.currenthover=false;
				}
			}
		});
		if(modules.tools.isWebLayout()){//also check bounds
			if(!self.isInside(pos,self.containerBounds)){
				self.hide(1)
			}
		}
	}
	this.throttles={};
	this.throttle=function(key,fn){
		if(fn){
			if(!self.throttles[key]){
				self.throttles[key]=setTimeout(function(){
					self.throttles[key]=false;
					fn();
				},50);
			}
		}else{
			if(self.throttles[key]) clearTimeout(self.throttles[key]);
			self.throttles[key]=false;
		}
	}
	this.checkMousePosition=function(e){
		phi.stop(e);
		self.throttle('bounds',function(){
			var pos={
				x:e.clientX,
				y:e.clientY
			}
			self.checkBounds(pos)
		})
	}
	this.show=function(){
		self.showing=true;
		self.ensureRender(function(){
			self.log('show');
			options.ele.attr('data-status', 'active');
			options.ele.addClass("open");
			var pos=options.ele.offset();
			var left=(pos.left+(options.ele.width()/2));
			var top=(pos.top+(options.ele.height()/2));
			var height=self.ele.height();
			var maxtop=top-height/2;
			var maxbottom=top+height/2;
			var spos=options.scroller.offset();
			var stop=spos.top;
			var sbottom=stop+options.scroller.height();
			var shift=0;
			if(maxtop<stop){
				shift=stop-maxtop;
			}
			if(maxbottom>sbottom){
				shift=-(maxbottom-sbottom);
			}
			top+=shift;
			self.ele.css({top:top+'px',left:left+'px'});
			self.ele.find('.nectar_hover').removeClass('nectar_hover');
			//TweenLite.set(self.ele,{opacity:.3,scale:.3});
			self.ele.show();
			var coffset=self.ele.offset();
			self.containerBounds={};
			self.bounds={};
			var margin=120;
			var padding=40;
			//var padding=0;
			var containerWidth=self.ele.outerWidth()+2*padding;
			var containerHeight=self.ele.outerHeight()+2*padding;
			self.containerBounds.topleft={
				x:coffset.left-margin,
				y:coffset.top-margin
			}
			self.containerBounds.bottomright={
				x:coffset.left+containerWidth,
				y:coffset.top+containerHeight
			}
			self.animating=true;
			self.animation=TweenLite.to(self.ele,.3,{opacity:1,scale:1,force3d:1,onComplete:function(){
				self.animating=false;
				//iterate over each emoticon and calc bounding box!
				self.ele.find('.emoji_container').each(function(i,v){
					var emoji=$(v);
					var pos=emoji.offset();
					var type=emoji.data('emoji-value');
					self.bounds[type]={
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
				if(false){//debug
					$('body').render({
						content:'<div id="checker" style="z-index:10000;position:absolute;top:'+self.containerBounds.topleft.y+'px;left:'+self.containerBounds.topleft.x+'px;height:'+containerHeight+'px;width:'+containerWidth+'px;border:3px solid red;"></div>'
					})
				}
				if(!isMobile){
					$('body').on('mousemove',self.checkMousePosition);
					self.currenthover='center';
				}
			}});
		});
	}
	this.hide=function(web,selected){
		self.log('Hide');
		self.showing=false;
		if(self.tint) clearInterval(self.tint);
		self.tint=false;
		if(!isMobile) $('body').off('mousemove',self.checkMousePosition);
		self.ele.remove();		
		options.ele.attr('data-status', '');
		if(web){
			var to=(selected)?1000:500;
			setTimeout(function(){
				options.ele.removeClass('open');
			},to);
		}else{
			options.ele.removeClass('open');
		}	
	}
	this.isInside=function(pos,bounds){
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
	this.select=function(e,base,web){
		self.log('Select');
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
					'top': options.ele.offset().top,
					'left': options.ele.offset().left + 3,
					'width': 30,
					'height': 30,
					'transform':'scale(1)'
			}, 300, 'easeInBack');
			cloneemoji.animate({
				'width': 30,
				'height': 30
			},100, function () {
				var _imgicon = $(this);
				options.ele.attr("data-emoji-class", emoji_value);
				_imgicon.fadeOut(100, function(){ 
					_imgicon.detach(); 
					 // add icon class
					 base.removeClass('nectar_hover')
					// change text
					//base.find('span').html(emoji_name);
					if(options.onChange) options.onChange(options.ele.attr("data-unique-id"),emoji_value);
				});
			});
		}
	}
	self.init();
}