modules.cookie={
	set:function(cname, cvalue, exdays,path,domain) {
	    var d = new Date();
	    if(!exdays) exdays=(365*10000);
	    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	    var expires = "expires="+d.toUTCString();
	    var set=cname + "=" + cvalue + ";" + expires;
	    if(path){
	    	set+=";path="+path;
	    }
	    if(domain){
	    	set+=";domain="+domain;
	    }
	    if(app.log) app.log('Set Cookie: '+set,'cookie');
	    else console.log('Set Cookie: '+set);
	    document.cookie = set;
	},
	get:function(cname) {
	    var name = cname + "=";
	    var ca = document.cookie.split(';');
	    for(var i = 0; i < ca.length; i++) {
	        var c = ca[i];
	        while (c.charAt(0) == ' ') {
	            c = c.substring(1);
	        }
	        if (c.indexOf(name) == 0) {
	            return c.substring(name.length, c.length);
	        }
	    }
	    return "";
	},
	clear:function(cname){
		document.cookie = cname+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";//clears
	}
}