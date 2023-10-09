modules.getInput=function(options){
	var self=this;
	self.options=options;
	this.show=function(){
		if(app.isWebLayout()){
			$('body').alert({
				template:'getinput_container',
				width:500,
				icon:false,
				image:false,
				buttons:[{
					btext:'Save',
					bclass:'x_save'
				}],
				binding:function(ele){
					self.ele=ele;
					var scroller=ele.data('scroller');
					ele.find('.x_save').stap(function(){
						var missing=self.form.getMissing();
						if(!missing.length){
							if($(this).hasClass('saving')){
								return console.warn('already saving');
							}
							var c=self.form.getCurrent();
							$(this).addClass('saving');
							if(options.onSave) options.onSave(c);
						}else{
							modules.toast({
								content:'Missing Fields ['+missing.join(',')+']'
							})
						}
					},1,'tapactive')
					self.form=new modules.formbuilder({
						inline:true,
	                    ele:ele.find('.formcontent'),
	                    current:options.current,//passed as a refernce
	                    schema:$.extend(true,{},options.schema),
	                    scroller:scroller,
	                    onUpdate:function(current){
	                       //console.log(current)
	                    }
	                });
				}
			})
		}else{
			var returnTheme=app.statusBar.getCurrent();
			$('body').page({
	            template:'getinput_mobile',
	            beforeClose:function(ele,cb){//eliminate all animation/timing/etc
	                //self.scroller.destroy();
	                app.statusBar.set(returnTheme);
	                setTimeout(function(){
	                    cb();
	                },50)
	            },
	            overlay:true,
	            onClose:function(){
	                
	            },
	            pageType:'static',
	            data:{
	                name:(options.name)?options.name:' ',
	            },
	            onPageRendered:function(ele,cb){
	                self.ele=ele;
	                ele.find('.x_done').stap(function(){
	                    $.fn.page.close();
	                },1,'tapactive');
	            },
	            onShow:function(ele){
	                app.statusBar.set('dark');
	                ele.find('.x_save').stap(function(){
						var missing=self.form.getMissing();
						if(!missing.length){
							if($(this).hasClass('saving')){
								return console.warn('already saving');
							}
							var c=self.form.getCurrent();
							$(this).addClass('saving');
							if(options.onSave) options.onSave(c);
						}else{
							modules.toast({
								content:'Missing Fields ['+missing.join(',')+']'
							})
						}
					},1,'tapactive')
					self.form=new modules.formbuilder({
	                    ele:ele.find('.formcontent'),
	                    current:options.current,//passed as a refernce
	                    schema:$.extend(true,{},options.schema),
	                    onUpdate:function(current){
	                       //console.log(current)
	                    }
	                });
	            }
	        });
		}
	}
	this.spin=function(){
		self.lv=self.ele.find('.x_save').html();
		self.ele.find('.x_save').html('<i class="icon-refresh animate-spin"></i>')
	}
	this.stop=function(){
		self.ele.find('.x_save').html(self.lv).removeClass('saving');
	}
	this.hide=function(){
		if(app.isWebLayout()){
			$.fn.alert.closeAlert();
		}else{
			$.fn.page.close();
		}
	}
}