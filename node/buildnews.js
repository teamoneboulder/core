var tools=require('./tools.js');
var buildnews = require('./build_news.js');
tools.init();
tools.db.init('one',['news_source','news'],function(db){
	buildnews.init(db,tools,'news',false,function(){
		process.exit(0);
	},{
		//sources:['positivenews']
		//sources:['GM9H3KZDR5UP6']
	});//news,import
})