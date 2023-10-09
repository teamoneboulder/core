/*Genneral Set-Up*/
var tools = require('groupup.js');
tools.init();
//START simple way to get data from php
var opts=tools.getBase64(process.argv[2]);

//tools.set('debug',1);//set debug mode
tools.fixContent(opts.content,function(content){
	console.log(tools.toBase64({content:content}));
	process.exit(0);
})