modules.oneBrowser=function(){
	window.oneBrowser={
		data:{},//to be filled in!
		api:function(opts){
			try{
			// Set up our HTTP request
				var xhr = new XMLHttpRequest();
				//Send the proper header information along with the request
				xhr.timeout = (opts.timeout)?opts.timeout:0;
				// Setup our listener to process completed requests
				xhr.onload = function(){
					// Process our return data
					if(xhr.status>=400){
						if(opts.error) opts.error('api_issue');
						return false;
					}
					if(opts.json){
						try{
							var json=JSON.parse(xhr.responseText);
							setTimeout(function(){//this ensures the code executed in future will not be part of this try-catch;
								if(json.error){
									if(opts.error) opts.error('api_error',JSON.stringify(json.error));
								}else{
									opts.success(json);
								}
							},1)
						}catch (err){
							if(opts.error) opts.error();
						}
					}else{
						if(opts.success) opts.success(xhr.responseText);
					}
				};
				xhr.onerror=function(){
					if(opts.error) opts.error();
				}
				xhr.ontimeout = function (e) {
				  	if(opts.error) opts.error('timeout');
				};
				// Create and send a GET request
				// The first argument is the post type (GET, POST, PUT, DELETE, etc.)
				// The second argument is the endpoint URL
				if(!opts.data) opts.data={};
				if(window.oneBrowser.data.token) opts.data.token=window.oneBrowser.data.token;
				if(window.oneBrowser.data.appid) opts.data.appid=window.oneBrowser.data.appid;
				opts.data.oneBrowser=1;
				if(opts.data&&opts.type=='POST'){
					xhr.open('POST', opts.url,true);
					xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
					xhr.send(window.oneBrowser.serialize(opts.data));
				}else{
					xhr.open('GET', opts.url);
					xhr.send();
				}
			}catch(e){
				if(opts.error) opts.error('bad_url');
			}
		},
		serialize:function(obj, prefix) {
		  var str = [],
		    p;
		  for (p in obj) {
		    if (obj.hasOwnProperty(p)) {
		      var k = prefix ? prefix + "[" + p + "]" : p,
		        v = obj[p];
		      str.push((v !== null && typeof v === "object") ?
		        oneBrowser.serialize(v, k) :
		        encodeURIComponent(k) + "=" + encodeURIComponent(v));
		    }
		  }
		  return str.join("&");
		}
	}
}