modules.webalert=function(options){
	var self=this;
	self.options=options;
	this.show=function(){
		var opts={
			closer:(options.closer)?true:false,
			icon:false,
			img:false,
			width:(options.display&&options.display.width)?options.display.width:350,
            buttons:self.getButtons(),
            binding:function(ele){
            	self.ele=ele;
            	if(options.steps){
            		self.cstep=0;
					self.ensurePage();
					ele.find('.x_next').stap(function(){
						self.nextStep()
					},1,'tapactive')
					ele.find('.x_back').stap(function(){
						self.prevStep()
					},1,'tapactive')
				}else{
	                ele.find('.x_button').stap(function(){
	                    self.selected=$(this).attr('data-id');
	                    self.onSelect();
	                },1,'tapactive')
	            }
	            if(options.binding) options.binding(ele);
            }
		}
		if(options.display.alert.closer){
			opts.closer=true;
		}
		if(options.display.alert.template){
			opts.template=options.display.alert.template
		}else if(options.display.alert.content){
			opts.content='<div style="margin-top:10px;padding:20px;text-align:left;font-size:24px;color:#888">'+options.display.alert.content+'</div>'
		}
		if(options.display.alert&&options.display.alert.tempdata){
			opts.tempdata=options.display.alert.tempdata;
		}
		$('body').alert(opts)
	}
	this.ensurePage=function(){
		var step=options.steps[self.cstep];
		options.renderStep(self.ele,step);
		//
		TweenLite.to(self.ele.find('.tpane'),.3,{x:(self.cstep*100)+'%',onComplete:function(){

		}});
		self.ele.find('.currentstep').html(self.cstep+1);
		self.ele.find('.steptotal').html(options.steps.length);
		self.ele.find('.stepdescription').html(step.description);
		if(self.cstep==0){
			self.ele.find('.x_back').hide();
		}else{
			self.ele.find('.x_back').show();
		}
		if(self.cstep==options.steps.length-1){
			//turn next into finish
			self.ele.find('.x_next').html('Finish');
		}else{
			self.ele.find('.x_next').html('Next');
		}
	}
	this.nextStep=function(){
		if(options.steps[self.cstep+1]){
			self.cstep++;
			self.ensurePage();
		}else{//finish!
			if(options.onSubmit){
				var cv=self.ele.find('.x_next').html()
				self.ele.find('.x_next').html('<i class="icon-refresh animate-spin"></i>');
				options.onSubmit(function(success){
					self.ele.find('.x_next').html(cv);
					if(success){
						self.destroy()
					}
				})
			}else{
				self.destroy();
			}
		}
	}
	this.prevStep=function(){
		if(self.cstep>0){
			self.cstep--;
			self.ensurePage();
		}
	}
	this.hide=function(){
		self.destroy();
	}
	this.onSelect=function(){
		if(self.options.onEndAnimationSelect){
			if(self.selected){
				self.options.onEndAnimationSelect(self.selected,self.getData(self.selected));
			}
		}
		if(self.options.onEndAnimationSubSelect){
			if(self.subselected){
				self.options.onEndAnimationSubSelect(self.subselected,self.getData(self.subselected.parent));
			}
		}
		if(self.options.onSelect){
			self.options.onSelect(self.selected,self.getData(self.selected));
		}
		self.destroy();
	}
	this.destroy=function(){
		$.fn.alert.closeAlert();
	}
	this.getData=function(selected){
		var data={};
		if(self.options.menu){
			$.each(self.options.menu,function(i,v){
				if(v.id==selected) data=v;
			})
		}
		return data;
	}
	this.getButtons=function(){
		var buttons=[]
		if(options.menu) $.each(options.menu,function(i,v){
			var text='';
			if(v.icon) text+='<i class"'+v.icon+'"></i>';
			buttons.push({
				btext:text+v.name,
				bclass:'x_button',
				id:v.id
			})
		})
		if(!buttons.length) buttons=false;
		return buttons;
	}
}