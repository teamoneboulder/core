_ui.button=function(options){
	var self=this;
	self.options=options;
	self.uid=Math.uuid(12);
	self.template=(options.template)?options.template:'button';
	this.bind=function(ele,actions){
		ele.find('[data-'+self.template+'='+self.uid+']').stap(function(){
			if(actions.onClick) actions.onClick($(this));
			else console.warn('No onClick action')
		},1,'tapactive');
	}
	this.getTemplate=function(){
		return $.fn.render({
			template:self.template,
			data:{
				_tid:self.uid,
				data:options.data
			},
			returnhtml:true
		})
	}
}