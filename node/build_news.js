module.exports = {
	posts:[],
	links:[],
	processed:0,
	counted:0,
	init:function(db,tools,type,debug,onDone,debugOpts){
		var self=this;
		self.db=db;
		self.tools=tools;
		self.tools.dblog('Starting News Scrape');
		self.start=new Date().getTime();
		self.maxsockets=3;
		if(tools.settings.isdev){
			self.maxsockets_internal=1;
		}else{
			self.maxsockets_internal=5;
		}
		self.rssparser = require('rss-parser');
		self.progressbar = require('progress');
		self.striptags = require('striptags');
		self.parser = new self.rssparser();
		self.async=require('async');
		self.queue = self.async.queue(function (opts, fin) {
		    self.loadFeed(opts,fin);
		}, self.maxsockets);
		self.queue.drain=function(){
			//console.log(self.links)
			console.log('done processing rss feeds!');
			//self.bar2=new self.progressbar('Loading Links [:bar] :percent :etas', { cur:0,total: self.links.length,renderThrottle:10 });
			self.bar3=new self.progressbar('Processed Links [:bar] :percent :etas', { cur:0,total: self.links.length,renderThrottle:10 });
			for (var i = 0; i < self.links.length; i++) {
				var opts=self.links[i];
				self.linkqueue.push(opts);
			}
		}
		self.linkqueue = self.async.queue(function (opts, fin) {
		    self.checkLink(opts,fin);
		}, self.maxsockets_internal);
		self.linkqueue.drain=function(){
			//batch update!
			if(self.posts.length){
				//console.log(self.posts);
				self.tools.db.batchUpdate(self.db,'news',self.posts,function(){
					console.log('done processing links, added ['+self.posts.length+'] links!');
					if(onDone) onDone();
				})
			}else{
				console.log('No links to process!');
				if(onDone) onDone();
			}
		}
		// self.testRSS();
		// return false;
		if(type=='news'){
			//console.log('loading news sources')
			db.news_source.find({},{},function(err,data){
				//var list=[];
				//console.log('got news sources')
				data.count(function(err,total){
					if(!self.tools.vars.debug) self.bar = new self.progressbar('Loading Feeds [:bar] :percent :etas', { cur:0,total: total,renderThrottle:10 });
					data.forEach(function(item,index){
						if(item.feed_urls){
							for (var i = 0; i < item.feed_urls.length; i++) {
								var furl=item.feed_urls[i];
								item.feed_url=furl;
								if(debugOpts&&debugOpts.sources){
									if(debugOpts.sources.indexOf(item.id)>=0){
										self.queue.push(item);
									}
								}else{
									self.queue.push(item);
								}
							}
						}else{
							if(debugOpts&&debugOpts.sources){
								if(debugOpts.sources.indexOf(item.id)>=0){
									self.queue.push(item);
								}
							}else{
								self.queue.push(item);
							}
						}
					})
				})
				// for (var i = 0; i < list.length; i++) {
				// 	var item=list[i];
				// 	self.queue.push(item);
				// };
			})
		}
		if(type=='import'){
			self.import();
		}
	},
	testRSS:function(){
		var self=this;
		self.loadFeed({
			feed_url:'https://hnrss.org/frontpage'
		},false,function(data){
			console.log(data);
		})
	},
	checkLink:function(opts,fin){
		var self=this;
		var entry=opts.entry;
		var id=self.tools.db.getId({
			url:entry.link
		},'link');
		self.db.news.findOne({id:id},function(err,data){
			if(data){
				//console.log('Link found, no need to re-process');
				if(!self.tools.vars.debug) self.bar3.tick(1);
				fin();
			}else{
				self.processLink(opts,fin);
			}
		})
	},
	processLink:function(opts,fin){
		var self=this;
		//if(!self.tools.vars.debug) self.bar2.tick(1);
		var entry=opts.entry;
		var oopts=opts.opts;
		if(entry.pubDate){
			var d = new Date(entry.pubDate);
		}else{
			var d=new Date();
		}
		//get link info!?
		var url=self.tools.settings.protocol+self.tools.settings.api+'/one_core/module/links/get';
		var send={
			token:self.tools.settings.admin_token,
			url:entry.link,
			force:1
		}
		self.tools.post(url,send,false,1,function(resp,oresp){
			var tags=[];
			if(!self.tools.vars.debug) self.bar3.tick(1);
			if(resp.error){
				console.log('error loading ['+entry.link+'] ['+JSON.stringify(resp)+']');
				return fin();
			}
			if(!resp.data.image){//only allow links with pictures!
				console.log('No image for ['+entry.link+'] skipping');
				return fin();
			}
			if(entry.categories&&entry.categories.length){
				for (var i = 0; i < entry.categories.length; i++) {
					var tagid=self.tools.getTagId(entry.categories[i]);
					if(tags.indexOf(tagid)==-1) tags.push(tagid);
				}
			}
			if(resp.tags){
				//console.log(resp.tags);
				for (var i = 0; i < resp.tags.length; i++) {
					if(tags.indexOf(resp.tags[i])==-1) tags.push(resp.tags[i]);
				}
			}else{
				//console.log('no tags');
			}
			//console.log(tags);
			self.posts.push({
				created_ts:Math.floor(d.getTime()/1000),
				_id:self.tools.db.toId(self.tools.db.objectIdFromDate(d)),
				id:resp.mid,//should still be unique
				page:{
					id:oopts.id,
					type:(oopts.type)?oopts.type:'news_source'
				},
				tags:tags,
				media:{
					type:'media',
					id:resp.mid
				}
			});
			fin();
		});
	},
	import:function(){
		var self=this;
		var url='https://api.groupup.me/groupup/links';
		self.tools.get(url,function(data){
			var data=JSON.parse(data);
			var limit=data.data.length;
			//limit=20;
			//self.bar2=new self.progressbar('Loading Links [:bar] :percent :etas', { cur:0,total: limit,renderThrottle:10 });
			self.bar3=new self.progressbar('Processed Links [:bar] :percent :etas', { cur:0,total: limit,renderThrottle:10 });
			for (var i = 0; i < limit; i++) {
				var link=data.data[i];
				var opts={
					opts:{
						id:'one_core'
					},
					entry:{
						pubDate:1545804059087,//1 yr ago
						link:link
					}
				}
				self.linkqueue.push(opts);
			}
		})
	},
	testLink:function(){
		var self=this;
		var url=self.tools.settings.protocol+self.tools.settings.api+'/one_core/module/links/get';
		var send={
			token:self.tools.settings.admin_token,
			url:'https://trendulus.com/',
			force:1
		}
		self.tools.post(url,send,false,1,function(resp,oresp){
			console.log(resp);
			process.exit(0);
		});
	},
	loadFeed:function(opts,fin,cb){
		var self=this;
		if(opts.feed_url){
			self.parser.parseURL(opts.feed_url,function(err, parsed) {
				if(cb) return cb(parsed);
				if(!self.tools.vars.debug) self.bar.tick(1);
				if(parsed&&parsed.items){
					parsed.items.forEach(function(entry) {
						self.links.push({
							entry:entry,
							opts:opts
						})
					})
					fin();
				}else{
					console.log(parsed)
					console.log(err)
					console.log('Error loading feed: '+opts.url);
					fin();
				}
			})
		}else{
			if(!self.tools.vars.debug) self.bar.tick(1);
			fin();
		}
	},
	loadReddit:function(opts,fin){//fuck you reddit!
		var self=this;
		var p=opts.url.split('~')
		if(p[2]){
			var url='https://www.reddit.com/r/'+p[1]+'/search.json?q='+encodeURIComponent(p[2])
			url+='&sort='+top;
			url+='&t=day';
		}else{
			var url='https://reddit.com/r/'+p[1]+'/top.json';
			url+='?t=day';
		}
		self.get(url,function(data){
			console.log(data)
		})
		//fin()
	}
}