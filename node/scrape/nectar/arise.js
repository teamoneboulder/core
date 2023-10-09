var tools=require('./tools.js');
var cache_id='arise_2019';

tools.init();
tools.db.init(tools.conf.project,['web_scrape_cache','uploads'],function(db){
	scraper.db=db;
	scraper.init();
});
var async=require('async');
var cheerio=require('cheerio');
const phantom = require('phantom');
var scraper={
	data:{
		order:[],
		list:{}
	},
	init:function(){
		var pages=[{
			url:'https://arisefestival.com/2019-music-lineup/',
			type:'music',
		},{
			url:'https://arisefestival.com/wisdom-village/',
			type:'healing-village'
		},{
			url:'https://arisefestival.com/childrens-village/',
			type:'childrens-village'
		},{
			url:'https://arisefestival.com/2019-vendors/',
			type:'vendor'
		},{
			url:'https://arisefestival.com/yoga/',
			type:'yoga'
		},{
			url:'https://arisefestival.com/bigsunrisedome/',
			type:'dome'
		},{
			url:'https://arisefestival.com/workshops/',
			type:'workshops'
		},{
			url:'https://arisefestival.com/2019-performance-art/',
			type:'performance'
		},{
			url:'https://arisefestival.com/artists-art-installations/',
			type:'art'
		}]
		// var pages=[{
		// 	url:'https://arisefestival.com/2019-music-lineup/'
		// }];
		var queue = async.queue(function (opts, fin) {
		    scraper.loadPage(opts,fin);
		},1);
		var pagequeue = async.queue(function (opts, fin) {
		    scraper.loadSecondaryPage(opts,fin);
		},1);
		queue.drain=function(){
			for (var i = 0; i < scraper.data.order.length; i++) {
				var id=scraper.data.order[i];
				var item=scraper.data.list[id];
				pagequeue.push({
					data:item,
					id:id,
					index:i,
					total:scraper.data.order.length
				})
			}
			console.log('Done!');
		}
		pagequeue.drain=function(){
			//console.log(scraper.data);
			//save data!
			scraper.db.web_scrape_cache.update({id:cache_id},{$set:{data:scraper.data}},{upsert:true},function(err){
				if(err){
					console.log('Error Saving!');
					process.exit(0);
				}else{
					console.log('Saved!');
					process.exit(0);
				}
			})
		}
		for (var i = 0; i < pages.length; i++) {
			var page=pages[i];
			queue.push(page);
		}
	},
	loadPage:function(opts,fin){
		console.log('Loading [' +opts.url+']');
		 scraper.scraper.load({
			url:opts.url,
			waitfor:'.mainul',
   	 		jquery:true,
   	 		onSuccess:function(page,phantom){
   	 			page.evaluate(function(){
   	 				//UUID
					(function(){var e="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");Math.uuid=function(t,n){var r=e,i=[],s;n=n||r.length;if(t){for(s=0;s<t;s++)i[s]=r[0|Math.random()*n]}else{var o;i[8]=i[13]=i[18]=i[23]="-";i[14]="4";for(s=0;s<36;s++){if(!i[s]){o=0|Math.random()*16;i[s]=r[s==19?o&3|8:o]}}}return i.join("")};Math.uuidFast=function(){var t=e,n=new Array(36),r=0,i;for(var s=0;s<36;s++){if(s==8||s==13||s==18||s==23){n[s]="-"}else if(s==14){n[s]="4"}else{if(r<=2)r=33554432+Math.random()*16777216|0;i=r&15;r=r>>4;n[s]=t[s==19?i&3|8:i]}}return n.join("")};Math.uuidCompact=function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){var t=Math.random()*16|0,n=e=="x"?t:t&3|8;return n.toString(16)})}})();
   	 				var data={
   	 					order:[],
   	 					list:{}
   	 				}
   	 				$('.mainul').find('li').each(function(i,v){
   	 					var ele=$(v);
   	 					var id=Math.uuid(12);
   	 					data.order.push(id);
   	 					data.list[id]={
   	 						id:id,
   	 						name:ele.find('.eg-henryharrison-element-1').html(),
   	 						url:ele.find('.eg-invisiblebutton').attr('href'),
   	 						pic:ele.find('.esg-media-poster').attr('src')
   	 					}
   	 				})
   	 				return data;
   	 			}).then(function(resp){
   	 				phantom.exit();
   	 				if(resp.order){
   	 					for (var i = 0; i < resp.order.length; i++) {
   	 						var id=resp.order[i];
   	 						var item=resp.list[id];
   	 						scraper.data.order.push(id);
   	 						scraper.data.list[id]=item;
   	 						scraper.data.list[id].type=opts.type;
   	 					}
   	 				}
   	 				console.log('Loaded ['+resp.order.length+'] items');
   	 				fin();
   	 			});
   	 		},
   	 		onFail:function(phantom){
   	 			phantom.exit();
   	 			console.log('fail')
   	 			fin();
   	 		}
   	 	});
	},
	scraper:{
		load:function(opts){
			var self=this;
			const phantom = require('phantom');
			phantom.create()
		    .then(instance => {
		        phInstance = instance;
		        return instance.createPage();
		    })
		    .then(page => {
			// use page
				page.open(opts.url).then(function(){
					if(opts.debug) page.on('onConsoleMessage', function (message) {
		                 console.log('page: '+message)
		            })
					self.waitfor(0,page,10000,function(page,fcb){
				    	 page.evaluate(function(waitfor) {
				    	 	if(!window.$&&!window.$loading){
				    	 		var script = document.createElement('script');  
				    	 		script.crossOrigin = 'anonymous';
					            script.setAttribute('src','https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js');
					            document.head.appendChild(script);
				    	 		window.$loading=1;
				    	 		console.log('load!');
				    	 		return 0;
				    	 	}else if($){
				    	 		console.log('hasjquery')
					        	return $(waitfor).length;
					        }else{
					        	console.log('waiting for jquery')
					        	return 0;
					        }
					    },opts.waitfor).then(function(issuccess){
					        if(issuccess){
					        	opts.onSuccess(page,phInstance);
					        }else{
					        	fcb();
					        }
					    });
				    },function(){
				    	opts.onFail(phInstance);
				    })
				})
		    })
		    .catch(error => {
		        console.log(error);
		        phInstance.exit();
		    });
		},
		waitfor:function(start,page,maxtimeOutMillis,testFx,onFail){
			if(!start) start=new Date().getTime();
			var self=this;
            if ( (new Date().getTime() - start < maxtimeOutMillis) ) {
                testFx(page,function(success){
                	//do next!
                	setTimeout(function(){
                		self.waitfor(start,page,maxtimeOutMillis,testFx,onFail)
                	},50);
                });
            } else {
                onFail();
            }
		}
	},
	loadSecondaryPage:function(opts,fin){
		console.log('Loading [' +opts.data.url+'] ['+opts.index+'/'+opts.total+']');
		 scraper.scraper.load({
			url:opts.data.url,
			waitfor:'#cs-content',
   	 		onSuccess:function(page,phantom){
   	 			page.evaluate(function(){
   	 				var col1=$('#x-section-1').find('.x-container').find('.x-column').first();
   	 				var col2=col1.next();
   	 				var pic=col1.find('img').attr('src');
   	 				var content=col2.text();
   	 				var links=[];
   	 				col1.find('a').each(function(i,v){
   	 					var l=$(v).attr('href');
   	 					if(l) links.push(l);
   	 				})
   	 				var data={
   	 					pic:pic,
   	 					content:content,
   	 					links:links
   	 				}
   	 				return data;
   	 			}).then(function(resp){
   	 				phantom.exit();
   	 				//console.log(resp)
   	 				scraper.data.list[opts.id].pic2=resp.pic;
   	 				scraper.data.list[opts.id].content=resp.content;
   	 				fin();
   	 			});
   	 		},
   	 		onFail:function(phantom){
   	 			phantom.exit();
   	 			console.log('fail')
   	 			fin();
   	 		}
   	 	});
	}
}
