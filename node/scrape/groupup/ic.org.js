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
	export:function(){
		datacoll.find().forEach(function(err,doc){
			//console.log(doc)
			if(doc&&doc.loc){

				var marker={
					_id:'communities_'+doc._id,
					loc:doc.loc,
					layer:'sacral',
					sub_layer:'fic',
					name:doc.name,
					description:(doc.description)?doc.description:'',
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
	export2:function(){
		var self=this;
		var obj=[];
		var headers=['name','contact_name','phone','members','website','city','state','country','profile_page'];
		obj.push(self.makeCsvRow(headers))
		datacoll.find().forEach(function(err,doc){
			//console.log(doc)
			if(doc&&doc.members>20&&doc.website&&(doc.country=='United States'||doc.country=='District of Columbia')){//only give more than 20 member groups, if they have a website they are more credible
				var data={
					name:(doc.name)?doc.name.replace(/,/g,'+'):'',
					contact_name:(doc.contact_name)?doc.contact_name.replace(/,/g,'+'):'',
					phone:(doc.phone)?doc.phone.replace(/,/g,'+'):'',
					members:doc.members,
					website:doc.website,
					city:doc.city,
					state:doc.state,
					country:doc.country,
					profile_page:'http://www.ic.org/directory/'+doc.slug+'/'
				}
				obj.push(self.makeCsvRow(headers,data))
			}
		})
		setTimeout(function(){//give it 3 seconds...
			tools.saveFile('/var/www/root/node/tempdata/ic.csv',obj.join("\r\n"),function(){
				console.log('successfully saved ['+obj.length+'] to csv');
				process.exit(0);
			});
		},3000);
	},
	makeCsvRow:function(headers,data){
		if(data){
			var rowinfo=[];
			for (var i = 0; i < headers.length; i++) {
				var h=headers[i];
				rowinfo.push(((data[h])?data[h]:''));
			};
			return rowinfo.join(',');
		}else{
			return headers.join(',');
		}
	},
	init:function(){
		var self=this;
		if(process.argv[2]){
			if(process.argv[2]=='1') return self.export();
			if(process.argv[2]=='2') return self.export2();
		}
		self.starttime=new Date().getTime();
		self.async = require('async');
		self.geocoder = require('geocoder');
		self.urltemplate='http://www.ic.org/wp-json/v1/directory/entries/?page={page}';
		self.cheerio=require('cheerio');
		//return self.testPage();
		self.queue = self.async.queue(function (opts, fin) {
		    self.loadData(opts,fin);
		}, 10);
		self.queue.drain = function(){
		    tools.log('Done Loading Data',self.debug);
		    //process.exit(0);
		    
		}
		self.prepare();
		self.queue2 = self.async.queue(function (opts, fin) {
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
		 	self.canexit=1
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
	loadData:function(opts,fin){
		var self=this;
		tools.get(opts.url,function(resp){//use this to calculate all pages to get
			var data=JSON.parse(resp);
			for (var i = 0; i < data.listings.length; i++) {
				var item=data.listings[i];
				item._id=item.id;
				self.queue2.push({
					_id:item._id,
					url:'http://www.ic.org/directory/'+item.slug+'/'
				})
				self.queue3.push({
					_id:item._id,
					city:item.city,
					state:item.state,
					country:item.country
				})
				datacoll.save(item,function(){
					//tools.log('successfully saved!',self.debug);
				})
			};
			setTimeout(function(){
				fin();//ok if it ends a bit early...
			},1000)
		})
	},
	testPage:function(){
		var self=this;
		var url='http://www.ic.org/directory/40th-avenue-cohousing/';
		self.loadData2({url:url});
	},
	loadData2:function(opts,fin){
		var self=this;
		tools.get(opts.url,function(resp){//use this to calculate all pages to get
			var $ = self.cheerio.load(resp);
			var data={};
			var ti=$('.listing-status').find('li');
			for (var i = 0; i < ti.length; i++) {
				var item=ti[i];
				if($(item).text().indexOf('Website address')>=0){
					data.website=$(item).find('a').attr('href')
				}
				if($(item).text().indexOf('Facebook')>=0){
					data.facebook=$(item).find('a').attr('href')
				}
				if($(item).text().indexOf('Contact Name')>=0){
					var d=$(item).html().split('</b>')
					data.contact_name=d[1].trim();
				}
				if($(item).text().indexOf('Phone')>=0){
					var d=$(item).html().split('</b>')
					data.phone=d[1];
				}
			};
			var ti=$('#Membership').next().find('li');
			for (var i = 0; i < ti.length; i++) {
				var item=ti[i];
				if($(item).text().indexOf('Adult Members:')>=0){
					data.members=parseInt($(item).text().replace('Adult Members:',''),10)
				}
				if($(item).text().indexOf('Visitors accepted:')>=0){
					data.visitors=($(item).text().indexOf('Yes'))?1:0;
				}
				if($(item).text().indexOf('Open to new Members:')>=0){
					data.new_members=($(item).text().indexOf('Yes'))?1:0;
				}
			}
			data.description=$('.cmtydescription-import').html();
			if(fin){
				//do geocoding here too!
				datacoll.update({_id:opts._id},{$set:data},function(){
						//tools.log('successfully saved!',self.debug);
					fin();
				})	
			}else{
				console.log(data);
			}		
		})
	},
	prepare:function(){
		var self=this;
		tools.get(tools.parseTemplate(self.urltemplate,{page:1}),function(resp){//use this to calculate all pages to get
			var data=JSON.parse(resp);
			var perpage=data.listings.length;
			var total=data.totalCount;
			self.totalItems=total;
			var pages=Math.ceil(total/perpage);
			tools.log('loading ['+pages+'] pages',self.debug)
			var cp=1;
			while(cp<=pages){
			//while(cp<=1){
				self.queue.push({
					url:tools.parseTemplate(self.urltemplate,{page:cp})
				})
				cp++;
			}
		})
	}
}
module.init();
