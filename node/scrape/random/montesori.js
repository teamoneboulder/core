/*Genneral Set-Up*/
var tools = require('groupup.js');
tools.init();
var force=(process.argv[2])?1:0;
var starttime=new Date().getTime();
var app={
	csv:'/var/www/root/sites/test/conscious/montesori.csv',
	data:[],
	init:function(){
		var self=this;
		self.async = require('async');
		self.cheerio = require('cheerio');
		self.progressbar=require('progress');
		app.scraper.load({
			url:'http://www.montessori-namta.org/School-Directory',
			waitfor:'.Schools a',
   	 		jquery:false,
   	 		onSuccess:function(page){
   	 			page.evaluate(function() {
   	 				var urls=[];
   	 				$('.Schools').find('a').each(function(i,v){
   	 					urls.push($(v).attr('href'));
   	 				})
			        return urls;
			    }).then(function(data){
			    	var root='http://www.montessori-namta.org';
			    	var queue = self.async.queue(function (opts, fin) {
					    self.loadSendaryPage(opts,fin);
					}, 10);
					console.log('loading... '+data.length)
					queue.drain = function() {
						console.log('Processing Data')
						//generate csv
						var header=['name','email','phone','administrator','website','address_line_1','address_line_2','address_line_3'];
						var savedata=[];
						savedata.push(header.join(','));
						for (var i = 0; i < app.data.length; i++) {
							var v=app.data[i];
							var row=[];
							for (var ti = 0; ti < header.length; ti++) {
								var tv=header[ti]
								if(v[tv]) row.push(v[tv]);
								else row.push('');
							};
							savedata.push(row.join(','))
						};
						// $.each(app.data,function(i,v){
						// 	var row=[];
						// 	$.each(header,function(ti,tv){
						// 		if(v[tv]) row.push(v[tv]);
						// 		else row.push('');
						// 	})
						// 	savedata.push(row.join(','))
						// })
						savedata=savedata.join('\r\n');
						tools.saveFile(self.csv,savedata,function(){
							//process data and write file
							var finishtime=new Date().getTime();
							var diff=(finishtime-starttime)/1000;
							console.log('ran in : '+diff.toFixed(2));
							process.exit(0);
						})
					}
					var l=(true)?data.length:10;
					app.bar = new self.progressbar('Processing Links [:bar] :percent :etas', { cur:0,total: l,renderThrottle:10 });
					for (var i = 0; i < data.length; i++) {
						if(i<=l){
							queue.push({
								url:root+data[i]
							})
						}
					};
			    });
   	 		},
   	 		onFail:function(){
   	 			console.log('FAIL!!!')
   	 		}
   	 	})
	},
	loadSendaryPage:function(opts,cb){
		var self=this;
		tools.get(opts.url,function(data){
			var $=self.cheerio.load(data);
			var d={
	        	name:$('.Article').find('h1').text(),
	        };
	        $('.Article').find('h1').remove();
	       	var html=$('.Article').html().replace(/\n/g,'').replace(/\r/g,'').replace(/\t/g,'');
	        var htmld=html.split('<br>');
	        //console.log(htmld)
	        d.address_line_1=htmld[1];
	        d.address_line_2=htmld[2];
	        d.address_line_3=htmld[3];
	        var c=4;
	        while(htmld[c]){
	        	if(htmld[c].indexOf('Administrator')>=0) d.administrator=htmld[c].replace('Administrator: ','');
	        	if(htmld[c].indexOf('Email')>=0) d.email=$(htmld[c].replace('Email: ','')).text();
	        	if(htmld[c].indexOf('Website')>=0) d.website=$(htmld[c].replace('Website: ','')).text();
	        	if(htmld[c].indexOf('Phone')>=0) d.phone=htmld[c].replace('Phone: ','');
	        	c++;
	        }
	        app.data.push(d);
	        app.bar.tick();
	        cb()
		})
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
					self.waitfor(0,page,5000,function(page,fcb){
				    	 page.evaluate(function(waitfor) {
					        return $(waitfor).length;
					    },opts.waitfor).then(function(issuccess){
					        if(issuccess){
					        	opts.onSuccess(page);
					        }else{
					        	fcb();
					        }
					    });
				    },function(){
				    	opts.onFail();
				    })
				});
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
	}
}
app.init();