window.TweenLite={
	set:function(ele,opts){
		window.TweenLite.to(ele,false,opts);
	},
	to:function(ele,time,opts){
		var action={
			targets:ele[0],
			duration:(time)?(time*1000):0
		}
		if(opts.x){
			action.translateX=opts.x
			delete opts.x;
		}
		if(opts.y){
			action.translateY=opts.y
			delete opts.y;
		}
		if(opts.onComplete){
			opts.complete=opts.onComplete;
			delete opts.onComplete;
		}
		if(opts.onUpdate){
			opts.update=opts.onUpdate;
			delete opts.onUpdate;
		}
		action=Object.assign({},action,opts);
		action.easing='linear'
		anime(action);
	}
}