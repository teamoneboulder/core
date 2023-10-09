if(!window.modules) window.modules={};
modules.log_api=function(object){
	app.api({
        url:app.sapiurl+'/log',
        data:{
        	message:object
        },
        success:function(resp){
            console.log(resp)
        }
    });
}
modules.log=function(msg,type){
    if(type){
        switch(type){
            case 'navigation':
                var s='background:purple;color:white';
            break;
            case 'socket':
                var s='background:green;color:white';
            break;
            case 'cookie':
                var s='background:#f02;color:white';
            break;
            case 'stats':
                var s='background:orange;color:white';
            break;
            case 'file':
                var s='background:blue;color:white';
            break;
            case 'keyboard':
                var s='background:aqua;color:white';
            break;
            default:
                var s='background:black;color:white';
            break;
        }
        console.log('%c'+msg,s);
    }else{
        console.log('%c'+msg,'background:black;color:white')
    }
}