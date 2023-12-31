modules.admin_infastructure=function(options){
	var self=this;
	this.show=function(){
		options.ele.render({
			uid:'admin_infastructure',
			force:1,
			template:'admin_infastructure',
			binding:function(ele){
				self.ele=ele;
			}
		})
	}
    this.hide=function(){
        self.ele.hide();
    }
	this.destroy=function(){
		self.ele.remove();
    }
}