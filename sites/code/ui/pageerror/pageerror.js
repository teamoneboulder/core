;window._ui.pageerror={
	render:function(opts,ele,replace){
		if(!opts) opts={};
		opts=Object.assign({},{
			feed:false
		},opts);
		if(ele){
			ele.render({
				template:'ui_pageerror',
				data:opts,
				append:(replace)?false:true
			})
		}else{
			return $.fn.render({//return template
				returntemplate:true,
				template:'ui_pageerror',
				data:opts
			})
		}
	}
};