//urlt=http://www.ic.org/wp-json/v1/directory/entries/?page=X
var tools=require('groupup.js');
var mongojs = require('mongojs');
var datadb = mongojs('data');
var datacoll=datadb.collection('intentional_communities');//only get collection once.
var markerdb = mongojs('groupup');
var markercoll=markerdb.collection('map_markers');//only get collection once.
//initialize
tools.init();
var module={
	debug:1,
	export:function(){
		datacoll.find().forEach(function(err,doc){
			//console.log(doc)
			if(doc&&doc.loc){

				var marker={
					_id:'intentional_communities_'+doc._id,
					loc:doc.loc,
					type:'intentional_communities',
					name:doc.name,
					via:'fic',
					links:[{
						name:'FIC Profile',
						url:'http://www.ic.org/directory/'+doc.slug+'/'
					}]
				}
				//add links
				if(doc.website){
					marker.links.push({
						name:'Website',
						url:doc.website
					})
				}
				markercoll.save(marker)
			}
		})
		setTimeout(function(){//give it 3 seconds...
			console.log('successfully exported to marker collection');
			process.exit(0);
		},3000);
	},
	init:function(){
		var self=this;
		if(process.argv[2]){
			return self.export();
		}
		self.starttime=new Date().getTime();
		self.async = require('async');
		self.geocoder = require('geocoder');
		self.urltemplate='https://www.bcorporation.net/community/find-a-b-corp?search=&field_state=&field_city=&field_country=&field_industry=&page={page}';
		self.cheerio=require('cheerio');
		self.queue = self.async.queue(function (opts, fin) {
		    self.loadData(opts,fin);
		}, 10);
		self.queue.drain = function(){
		    tools.log('Done Loading Data',self.debug);
		    //process.exit(0);
		    
		}
		self.prepare();
		self.queue2 = self.async.queue(function (opts, fin) {
			self.canexit=0
		    self.loadData2(opts,fin);
		}, 10);
		self.queue2.drain = function(){
		    //export data
		    self.endtime=new Date().getTime();
		    var diff=Math.floor((self.endtime-self.starttime)/1000);
		 	if(self.canexit){
		 		tools.log('loaded ['+self.totalItems+'] items in ['+diff+']s',self.debug);
		 		process.exit(0);
		 	}   
		 	self.canexit=1;
		}
		self.queue3 = self.async.queue(function (opts, fin) {
		    self.getLatLng(opts,fin);
		}, 2);
		self.queue3.drain = function(){
		    //export data
		    if(self.canexit){
		    	self.endtime=new Date().getTime();
			    var diff=Math.floor((self.endtime-self.starttime)/1000);
		 		tools.log('loaded ['+self.totalItems+'] items in ['+diff+']s',self.debug);
		 		process.exit(0);
		 	}
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
		self.geocoder.geocode(opts.location, function ( err, data ) {
			if(opts.cleared) return false; 
			if(opts.timeout) clearTimeout(opts.timeout);
			self.geocodecount++;
			tools.log('Done Geocoding '+self.geocodecount+'/'+self.totalItems,self.debug);
		  	if(err||!data.results||!data.results[0]){
		  		//console.log('error loading ['+opts.city+', '+opts.state+', '+opts.country+']')
		  		return fin();
		  	}
		  	if(data.results[0]){
			  	var marker={
			  		_id:tools.getId(opts.data.page),
			  		name:opts.data.name,
			  		description:opts.data.description,
			  		loc:data.results[0].geometry.location,
			  		type:'bcorp',
			  		via:'bcorp',
			  		links:[{
			  			name:'B Corp Profile',
			  			url:opts.data.page
			  		}]
			  	}
			  	if(opts.data.website){
			  		marker.links.push({
			  			name:'Website',
			  			url:opts.data.website
			  		})
			  	}
			  	markercoll.save(marker,function(){
					fin();
				})
			  }else{
			  	fin();
			  }
		});
	},
	loadData:function(opts,fin){
		var self=this;
		tools.get(opts.url,function(resp){//use this to calculate all pages to get
			var $ = self.cheerio.load(resp);
			$('.view-content').find('.views-row').each(function(i,v){
				self.queue2.push({
					url:'https://www.bcorporation.net'+$(v).find('a').attr('href')
				})
			})
		})
	},
	loadData2:function(opts,fin){
		var self=this;
		tools.get(opts.url,function(resp){//use this to calculate all pages to get
			var $ = self.cheerio.load(resp);
			var data={};
			var wb=$('.company-desc-inner').find('a').attr('href');
			data.website=wb;
			var loc='';
			$('.company-desc-inner').children().each(function(i,v){
				if($(v).prop("tagName")=='P'){
					loc+=$(v).text()+ ' ';
				}
			})
			data.name=$('.page-title').text();
			data.description=$('.field-item').text();
			data.page=opts.url;
			//geocode!
			if(loc){
				self.queue3.push({
					location:loc,
					data:data
				})
			}
			fin();
		})
	},
	prepare:function(){
		var self=this;
		tools.get(tools.parseTemplate(self.urltemplate,{page:0}),function(resp){//use this to calculate all pages to get
			var $ = self.cheerio.load(resp);
			var val=$('.bcorp-count').text();
			var p=val.split(' of ');
			var total=parseInt(p[1].replace(' results', ''));
			var perpage=21;
			var pages=Math.ceil(total/perpage)-1;//because first page starts at 0!
			self.totalItems=pages*perpage;
			tools.log('loading ['+pages+'] pages',self.debug)
			var cp=0;
			while(cp<=pages){
			//while(cp<=0){
				self.queue.push({
					url:tools.parseTemplate(self.urltemplate,{page:cp})
				})
				cp++;
			}
		})
	}
}
module.init();
