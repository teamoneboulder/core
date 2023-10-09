var app={
    ver:1,
    appid:'2344d44c84409765d9a5ab39ae8cabcd',//web appid
	init:function(vars){
		if(vars) $.each(vars,function(i,v){
            if(i!='modules') app[i]=v;
        });
		$('#wrapper').show();
       	$('#wrapper').render({
    		append:false,
    		template:'home',
    		data:{},
    		binding:function(ele){
    			$('#redactor').redactor({})
    		}
    	});
    },
};