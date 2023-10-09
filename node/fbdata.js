var fbscrape = require('fbscrape.js');//testing
fbscrape.init({
	access_token:process.argv[2],
	uid:process.argv[3],
	onPost:function(data){
		console.log(data)
	},
	onAttachment:function(id,data){
		console.log(id)
		console.log(data)
	}
});