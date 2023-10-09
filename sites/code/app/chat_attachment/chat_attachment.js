modules.chat_attachment_global={
	render:function(attachment,preview,container){
		if(!attachment.preview){//could be passed directly
			if(preview) attachment.preview=true;
			else attachment.preview=false;
		}
		attachment.container=container;
		if(attachment.data){
			switch(attachment.type){
				case 'post':
					return $.fn.render({template:'chat_attachment_post',data:attachment,returntemplate:true});
				break;
				case 'connection':
					return $.fn.render({template:'chat_attachment_connection',data:attachment,returntemplate:true});
				break;
				case 'rideshare':
					return $.fn.render({template:'chat_attachment_rideshare',data:attachment,returntemplate:true});
				break;
				case 'event':
					return $.fn.render({template:'chat_attachment_event',data:attachment,returntemplate:true});
				break;
				case 'page':
					return $.fn.render({template:'chat_attachment_page',data:attachment,returntemplate:true});
				break;
				default:
					return 'invalid_attachment_type';
				break;
			}
		}else{
			console.warn('attachment not found')
		}
	},
	bind:function(ele){

	}
}
modules.chat_attachment=function(options){
    var self=this;
	this.options=options;
	var bw=$('body').width();
	var bh=$('body').height();
	options.container={
		width:(bw>600)?600:bw,
		height:bh
	}
	this.show=function(){
		$('body').render({
			template:'chat_attachment_view',
			data:options,
			binding:function(ele){
				self.ele=ele;
				//render infifinitescroller!
				//console.log(self.options.current)
				new modules.scroller(ele.find('.scroller'),{
					forceNative:true
				});
				ele.find('.textarea').autosize({
					getScroller:function(){
                        return ele.find('.scroller');
                    }
				});
				TweenLite.set(self.ele.find('.pane'),{y:self.ele.find('.pane').height()});
				ele.find('.x_close').stap(function(){
					self.hidePicker()
				},1,'tapactive');
				ele.find('.x_send').stap(function(){
					self.send()
				},1,'tapactive');
				setTimeout(function(){
					TweenLite.to(self.ele.find('.bg'),.3,{opacity:.3})
					TweenLite.to(self.ele.find('.pane'),.3,{y:0});
				},100);
			}
		})
	}
	this.send=function(){
		if(!app.onlyMembers()) return false;
		if(self.sending) return false;
		var m=self.ele.find('.textarea').val();
		if(!m){
			modules.toast({
	            content:'Please enter a message before sending.',
	            remove:2500,
	            type:'warning',
	            icon:'icon-warning-sign'
	        })
			return false;
		}
		self.sending=true;
		self.ele.find('.x_send').find('i').removeClass('icon-send').addClass('icon-refresh animate-spin');
		app.api({
            url:app.sapiurl+'/module/chat_attachment/send',
            data:{
            	message:m,
            	attachment:options.attachment,
            	to:options.to.id
            },
            success:function(resp){
            	self.sending=false;
            	self.ele.find('.x_send').find('i').addClass('icon-send').removeClass('icon-refresh animate-spin');
               	if(resp.success){
               		modules.toast({
			            content:'Successfully Sent!',
			            remove:2500,
			            icon:'icon-thumbs-up'
			        });
			        self.hidePicker()
               	}else{
               		modules.toast({
			            content:'Error saving ['+resp.error+'], please try again.',
			            remove:2500,
			            type:'warning',
			            icon:'icon-warning-sign'
			        })
               	}
            }
        });
	}
	this.hidePicker=function(cb){
		self.hiding=true;
		TweenLite.to(self.ele.find('.bg'),.3,{opacity:0})
		TweenLite.to(self.ele.find('.pane'),.3,{y:self.ele.find('.pane').height(),onComplete:function(){
			self.ele.remove();
			self.hiding=false;
			if(self.onHide) self.onHide();
			self.onHide=false;
			if(cb) cb();
		}})
	}
}