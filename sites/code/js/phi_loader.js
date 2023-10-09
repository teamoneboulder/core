window.modules={};
window.phi={
	call:function(method){
		var args=arguments;
		setTimeout(function(){
			console.log('waiting for phi to load!');
			phi.call.apply(phi,args);
		},50);
	}
};