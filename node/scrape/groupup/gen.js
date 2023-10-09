//urlt=http://www.ic.org/wp-json/v1/directory/entries/?page=X
var tools=require('groupup.js');
var mongojs = require('mongojs');
var datadb = mongojs('data');
var datacoll=datadb.collection('intentional_communities');//only get collection once.
var markerdb = mongojs('groupup');
var markercoll=markerdb.collection('map_marker');//only get collection once.
//initialize
tools.init();
var module={
	debug:1,
	init:function(){
		var self=this;
		if(process.argv[2]){
			return self.export();
		}
		self.starttime=new Date().getTime();
		self.async = require('async');
		self.geocoder = require('geocoder');
		self.urltemplate='https://ecovillage.org/wp-json/gen/v1/archive_loop_html/?list_type=archive_gen_project&next_page={page}&last_post_type=gen_project&param-post_type=gen_project';
		self.cheerio=require('cheerio');
		self.queue = self.async.queue(function (opts, fin) {
			self.canexit=0;
		    self.loadData(opts,fin);
		}, 10);
		self.queue.drain = function(){
		    tools.log('Done Loading Data',self.debug);
		    //process.exit(0);
		    self.canexit=1;
		}
		self.prepare();
		self.queue2 = self.async.queue(function (opts, fin) {
		    self.loadData2(opts,fin);
		}, 10);
		self.queue2.drain = function(){
		    //export data
		    if(self.canexit){
			    self.endtime=new Date().getTime();
			    var diff=Math.floor((self.endtime-self.starttime)/1000);
		 		tools.log('loaded ['+self.loaded+'] items in ['+diff+']s',self.debug);
		 		process.exit(0);
		 	}
		}
		self.queue3 = self.async.queue(function (opts, fin) {
		    self.getLatLng(opts,fin);
		}, 2);
		self.queue3.drain = function(){
		    //export data
		    self.endtime=new Date().getTime();
		    var diff=Math.floor((self.endtime-self.starttime)/1000);
		 	if(self.canexit){
		 		tools.log('loaded ['+self.totalItems+'] items in ['+diff+']s',self.debug);
		 		process.exit(0);
		 	}   
		 	self.canexit=1
		}
	},
	geocodecount:0,
	getLatLng:function(opts,fin){
		var self=this;
		//tools.log('Geocoding ['+opts.city+', '+opts.state+', '+opts.country+']',self.debug);
		opts.timeout=setTimeout(function(){
			opts.cleared=true;
			tools.log('cleared from timeout',self.debug);
			fin();
		},5000);
		self.geocoder.geocode(opts.city+', '+opts.state+', '+opts.country, function ( err, data ) {
			if(opts.cleared) return false; 
			if(opts.timeout) clearTimeout(opts.timeout);
			self.geocodecount++;
			tools.log('Done Geocoding '+self.geocodecount+'/'+self.totalItems,self.debug);
		  	if(err||!data.results||!data.results[0]){
		  		//console.log('error loading ['+opts.city+', '+opts.state+', '+opts.country+']')
		  		return fin();
		  	}
		  	datacoll.update({_id:opts._id},{$set:{loc:data.results[0].geometry.location}},function(){
				fin();
			})
		});
	},
	links:{},
	loadData:function(opts,fin,retry){
		var self=this;
		tools.get(opts.url,function(resp){//use this to calculate all pages to get
			try{
				var data=JSON.parse(resp);
				var $ = self.cheerio.load('<body>'+data.html+'</body>');
				$('a').each(function(i,v){
					var url=$(v).attr('href');
					if(!self.links[url]){
						self.links[url]=1;
						var urlp=url.split('/')
						self.queue2.push({
							_id:tools.getId(url),
							url:url
						})
					}
				});
				setTimeout(function(){
					fin()
				},5000)
			}catch(e){
				if(!retry) retry=2;
				retry--;
				if(retry>=0){
					console.log('retrying ['+opts.url+']')
					setTimeout(function(){
						self.loadData(opts,fin,retry)
					},5000)
				}else{
					console.log('skipping ['+opts.url+']')
					fin();
				}
			}		
		})
	},
	loaded:0,
	loadData2:function(opts,fin){
		var self=this;
		tools.get(opts.url,function(resp){//use this to calculate all pages to get
			console.log('success ['+opts.url+']')
			try{
				var $ = self.cheerio.load(resp);
				if($('#gen-post-map-2').length){
					var l=$('#gen-post-map-2').find('a').attr('href');
					var lp=l.split('/')
					var gps=lp[5];
					gpsp=gps.split(',');
					var marker={
						_id:'gen_'+opts._id,
						loc:{
							lat:parseFloat(gpsp[0]),
							lng:parseFloat(gpsp[1])
						},
						name:$('.entry-title-primary').text(),
						description:$('.entry-content').text(),
						layer:'sacral',
						sub_layer:'gen',
						via:'gen',
						links:[{
							url:opts.url,
							name:'GEN Profile'
						}]
					};
					self.loaded++;
					console.log('loaded ['+self.loaded+']');
					markercoll.save(marker,function(){
						setTimeout(function(){
							fin()
						},10000)
					})
				}else{
					console.log('no gps data')
					setTimeout(function(){
						fin()
					},10000)
				}		
			}catch(e){
				console.log('skipping: '+opts.url)
				setTimeout(function(){
					fin()
				},10000);
			}
		})
	},
	prepare:function(){
		var self=this;
		tools.get(tools.parseTemplate(self.urltemplate,{page:1}),function(resp){//use this to calculate all pages to get
			var data=JSON.parse(resp);
			var pages=data.max_num_pages;
			tools.log('loading ['+pages+'] pages',self.debug)
			var cp=1;
			while(cp<=pages){
			// while(cp<=5){
				self.queue.push({
					url:tools.parseTemplate(self.urltemplate,{page:cp})
				})
				cp++;
			}
		})
	}
}
module.init();
