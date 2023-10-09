modules.report=function(options){
	var self=this;
	self.options=options;
	this.show=function(){
		var rele=(options.renderTo)?options.renderTo:$('body');
		rele.render({
			template:(options.template)?options.template:'report_page',
			data:$.extend(true,{},{title:'Report Content'},options),
			binding:function(ele){
				self.ele=ele;
				ele.find('.x_closer').stap(function(){
					self.hide();
				},1,'tapactive')
				ele.find('.x_send').stap(function(){
					self.send();
				},1,'tapactive')
				ele.find('.autosize').autosize();
				ele.find('textarea').on('keyup input paste',function(){
					self.options.report=$(this).val();
				})
				ele.find('.immediate').stap(function(){
					if($(this).hasClass('toggled')){
						$(this).removeClass('toggled');
						self.options.immediate='';
					}else{
						$(this).addClass('toggled');
						self.options.immediate=1;
					}
				},1,'tapactive')
				ele.find('.x_link').stap(function(){
					_.openLink({
						intent:'https://docs.google.com/document/d/1gpYjk16RCvMTxuTNiWw9ZAfLXv59u-MCl_jpH8OW9IQ/edit?usp=sharing'
					})
				},1,'tapactive')
				self.dragger=Draggable.create(ele.find('.swiper'), {
			        type:"y",
			        bounds:{minX:0,maxX:0,minY:0,maxY:300},
			        lockAxis:true,
			        throwProps:true,
			        force3D:true,
			        cursor:'defualt',
			        edgeResistance:1,
			        onDrag:function(){
			        	TweenLite.set(ele.find('.swiper'),{y:0});
			        	TweenLite.set(ele.find('.pane'),{y:this.y});
			        },
			        onDragStart:function(e){
			        },
			        onDragEnd:function(e) {
			        	if(this.endY>80){
			        		self.hide();
			        	}else{
			        		TweenLite.to(ele.find('.pane'),.3,{y:0});
			        	}
			        }
			    });
			    modules.keyboard_global.overrides={
					onKeyboardWillShow:function(h){
						TweenLite.to(self.ele.find('.content'),.3,{bottom:h})
					},
					onKeyboardWillHide:function(){
						TweenLite.to(self.ele.find('.content'),.3,{bottom:0})
					}
				}
			    TweenLite.set(ele.find('.pane'),{y:'100%'})
			    //render
				setTimeout(function(){
					TweenLite.to(ele,.3,{background:'rgba(55,55,55,.3)'})
					TweenLite.to(ele.find('.pane'),.3,{y:'0%'})
				},50)
			}
		})
	}
	this.send=function(){
		if(!self.options.report||!self.options.report.length){
			modules.toast({
				content:'Please enter a reason for why this is being reported.'
			})
			return false;
		}
		var ct=self.ele.find('.x_send').find('.content').html();
		self.ele.find('.x_send').find('.content').html('<i class="icon-refresh animate-spin"></i>');
		modules.api({
			url:app.sapiurl+'/module/report/send',
			data:self.options,
			callback:function(resp){
				self.ele.find('.x_send').find('.content').html(ct);
				if(resp.success){
					modules.toast({
						content:'Successfully Submitted Report!'
					})
					self.hide();
				}else{
					modules.toast({
						content:'Error Saving: '+resp.error
					})
				}
			}
		})
	}
	this.hide=function(){
		modules.keyboard_global.hide();
		setTimeout(function(){
			TweenLite.to(self.ele,.5,{background:'rgba(55,55,55,0)'})
			TweenLite.to(self.ele.find('.pane'),.5,{y:'100%',onComplete:function(){
				setTimeout(function(){
					self.destroy();
				},50);
			}})
		},50)
	}
	this.destroy=function(){
		modules.keyboard_global.overrides=false;
		if(self.dragger) self.dragger[0].kill();
		self.ele.remove();
		delete self;
	}
}