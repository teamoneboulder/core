if(!window.modules) window.modules={};
modules.call=function(number){
	if(isPhoneGap()){
		if(window.plugins.CallNumber){
			window.plugins.CallNumber.callNumber(function(){
				console.log('success')
			}, function(){
				console.log('fail')
			}, number, true);
		}else{
			_alert('calling not available on this platform')
		}
	}else{
		_alert('calling not available on this platform')
	}
}