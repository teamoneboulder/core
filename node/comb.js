var uglify = require("uglify-js");
var fs = require("fs");
var files=JSON.parse(process.argv[2]);
var map=(process.argv[3])?1:0;
if(files.length){
	//var result=uglify.minify(files,{warnings:false,mangle:true});
	var tominify={};
	for (var i = 0; i < files.length; i++) {
		var f=files[i];
		var fp=f.split('/');
		tominify[f]=fs.readFileSync(f, "utf8");
		if(!tominify[f]){
			console.log('issue with '+f);
			process.exit(0);
		}
	};
	if(map){
		var result=uglify.minify(tominify,{
			compress:{},
			mangle:false,
			sourceMap: {
		        filename: "js.js"
		    }
		});
		if(result.error){
			console.log(result.error);
		}else{
			var out=result.code+'*****'+result.map;
			console.log(out);
		}
	}else{
		var result=uglify.minify(tominify,{
			compress:{},
			mangle:true
		});
		if(result.error){
			console.log(result.error);
		}else{
			var out=result.code;
			console.log(out);
		}
	}
}else{
	console.log(JSON.stringify({"error":"No Files"}));
}