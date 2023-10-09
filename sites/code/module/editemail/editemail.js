modules.editemail=function(options){
	var self=this;
	this.show=function(){
		self.view=new modules.present({
			display:{
				alert:{
					width:400,
					icon:false,
					closer:false,
					buttons:false
				}

			},
			onBeforeShow:function(){
				if(options.onBeforeShow) options.onBeforeShow();
			},
			templates:{
				alert:'editemail',
				page:'editemail_mobile'
			},
			data:{
				data:{
					email:''
				}
			},
			binding:function(ele){
				self.ele=ele;
				ele.find('.x_cancel').stap(function(){
					self.view.hide()
				},1,'tapactive')
				ele.find('.x_next').stap(function(){
					self.next();
				},1,'tapactive');
				ele.find('.x_change').stap(function(){
					self.ele.find('.emailinput').show();
					self.ele.find('.emailconfirmbox').hide();
					self.ele.find('.emailconfirmedbox').hide();
					ele.find('input').val('');
					self.tosave='';
					self.confirmed1=0;
					self.confirmed2=0;
					ele.find('[data-id=email]').parent().parent().removeClass('hasvalue')
					ele.find('[data-id=email]').focus()
					setTimeout(function(){
						ele.find('[data-id=email]').focus()
					},200)
				},1,'tapactive');
				ele.find('.x_hidekeyboard').stap(function(){
					self.ensureHide();
				},1,'tapactive')
				ele.find('.x_report').stap(function(){
					app.sendEmail({
                        to:'love@nectar.earth',
                        subject:'Unable to find email for '+self.tosave
                    })
				},1,'tapactive');
				ele.find('input').on('keyup',function(){
					var v=$(this).val();
					if($(this).attr('data-id')=='email'){
						v=v.toLowerCase();
						if(v.length){
							$(this).parent().parent().addClass('hasvalue')
						}else{
							$(this).parent().parent().removeClass('hasvalue')
						}
						self.tosave=v;
					}
				});
			}
		})
		self.view.show();
	}
	this.ensureHide=function(){
		modules.keyboard_global.clearPreventHide();
		modules.keyboard_global.hide();
		modules.keyboard_global.onKeyboardWillHide();//trigger anyways
		self.ensureHideSet=1;
		setTimeout(function(){
			self.ensureHideSet=0;
		},250);
	}
	this.confirmCode=function(){
		if(self.validating) return false;
		self.validating=true;
		var cv=self.ele.find('.x_next').html();
		self.ele.find('.x_next').html('<i class="icon-refresh animate-spin" style="font-size:26px"></i>');
		app.api({
			url:app.sapiurl+'/user/confirmemail',
			data:{
				email:self.tosave,
				code:self.ele.find('#confirmcode').val(),
				save:1
			},
            timeout:5000,
			callback:function(resp){
				self.validating=false;
				self.ele.find('.x_next').html(cv);
				if(resp.success){
					self.confirmed2=1;
					// self.ele.find('.emailinput').hide();
					// self.ele.find('.emailconfirmbox').hide();
					// self.ele.find('.emailconfirmedbox').show();
					self.next();
				}else{
					modules.toast({
                        content:resp.error,
                        remove:2500,
                        icon:'icon-warning-sign'
                    });
				}
			}
		})
	}
	this.next=function(){
		if(!self.confirmed1){
			self.validateEmail();
			return false;
		}
		if(!self.confirmed2){
			self.confirmCode();
			return false;
		}
		self.save()
	}
	this.save=function(){
		options.onSaved(self.tosave)
		self.view.hide();
	}
	this.validateEmail=function(){
		if(self.validating) return false;
		self.validating=true;
		var cv=self.ele.find('.x_next').html();
		self.ele.find('.x_next').html('<i class="icon-refresh animate-spin" style="font-size:26px;"></i>');
		app.api({
			url:app.sapiurl+'/user/emailcheck',
			data:{
				email:self.tosave
			},
            timeout:5000,
			callback:function(resp){
				self.validating=false;
				self.ele.find('.x_next').html(cv);
				if(resp.valid){
					self.confirmed1=1;
					self.ele.find('.curemail').html(self.tosave);
					self.ele.find('.emailinput').hide();
					self.ele.find('.emailconfirmbox').show();
					//self.ele.find('.emailconfirmbox').find('input').focus();
				}else if(resp.success&&!resp.valid){
					modules.toast({
                        content:'Email Address In Use!',
                        remove:2500,
                        icon:'icon-warning-sign'
                    });
				}else{
					modules.toast({
                        content:resp.error,
                        remove:2500,
                        icon:'icon-warning-sign'
                    });
				}
			}
		})
	}
}