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
	getOpts:function(page){
		return {
			take:10,
			skip:10*page,
			page:page,
			pageSize:10,
			pageIndex:page,
			languages:'',
			location:'USA',
			keyword:'',
			schoolSortType:0,
			sortDirection:0,
			SearchNear:{
				centerCoordinates:{
					Latitude:37.09024,
					Longitude:-95.71289100000001
				},
				northEastCoordinates:{
					Latitude:49.38,
					Longitude:-66.94,
				},
				southWestCoordinates:{
					Latitude:25.82,
					Longitude:-124.38999999999999,
				},
				isExactAddress:false,
				googleAddress:'USA',
				country:'United States',
				countryShortName:'US',
				city:'',
				postalCode:'',
				types:['country','political'],
				hasTypes:true,
				isCountry:false,
				isState:false,
				isCity:false,
				isSublocality:false,
				isPostalCode:false,
				isSearchNotByCountryOrState:false,
				distance:5000,
			},
			SearchRadius:100000
		}
	},
	init:function(){
		var self=this;
		self.async = require('async');
		markercoll
		tools.post('https://www.yogaalliance.org/DesktopModules/YAServices/API/SchoolDirectory/SearchSchools',module.getOpts(1),{
			'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
			'Origin':'https://www.yogaalliance.org',
			'Referer':'https://www.yogaalliance.org/Directory-Registrants?type=School',
			'x-newrelic-id':'VQcDU1NUDxABV1NVAAcHUA==',
			'x-requested-with':'XMLHttpRequest'
		},1,function(data){
			//prepared,
			module.totalpages=Math.ceil(data.TotalCount/10);
			console.log('loading ['+module.totalpages+'] pages')
			self.parseData(1,data);
			self.loadPages();
		})
		self.queue = self.async.queue(function (opts, fin) {
		    self.loadData(opts,fin);
		}, 10);
		self.queue.drain = function(){
		    tools.log('Done Loading Data',self.debug);
		    process.exit(0);
		}
		// take:10
		// skip:10
		// page:2
		// pageSize:10
		// pageIndex:1
		// languages:
		// location:USA
		// keyword:
		// schoolSortType:0
		// sortDirection:0
		// SearchNear[centerCoordinates][Latitude]:37.09024
		// SearchNear[centerCoordinates][Longitude]:-95.71289100000001
		// SearchNear[northEastCoordinates][Latitude]:49.38
		// SearchNear[northEastCoordinates][Longitude]:-66.94
		// SearchNear[southWestCoordinates][Latitude]:25.82
		// SearchNear[southWestCoordinates][Longitude]:-124.38999999999999
		// SearchNear[isExactAddress]:false
		// SearchNear[googleAddress]:USA
		// SearchNear[country]:United States
		// SearchNear[countryShortName]:US
		// SearchNear[state]:
		// SearchNear[stateShortName]:
		// SearchNear[city]:
		// SearchNear[postalCode]:
		// SearchNear[types][]:country
		// SearchNear[types][]:political
		// SearchNear[hasTypes]:true
		// SearchNear[isCountry]:true
		// SearchNear[isState]:false
		// SearchNear[isCity]:false
		// SearchNear[isSublocality]:false
		// SearchNear[isPostalCode]:false
		// SearchNear[isSearchNotByCountryOrState]:false
		// SearchNear[distance]:3442
		// SearchRadius:50
		return false;
		// if(process.argv[2]){
		// 	return self.export();
		// }
		// self.starttime=new Date().getTime();
		// self.async = require('async');
		// self.geocoder = require('geocoder');
		// self.urltemplate='https://www.yogaalliance.org/DesktopModules/YAServices/API/SchoolDirectory/SearchSchools';
		// self.cheerio=require('cheerio');
		// self.queue = self.async.queue(function (opts, fin) {
		//     self.loadData(opts,fin);
		// }, 10);
		// self.queue.drain = function(){
		//     tools.log('Done Loading Data',self.debug);
		//     //process.exit(0);
		    
		// }
		// self.prepare();
		// self.queue2 = self.async.queue(function (opts, fin) {
		// 	self.canexit=0
		//     self.loadData2(opts,fin);
		// }, 10);
		// self.queue2.drain = function(){
		//     //export data
		//     self.endtime=new Date().getTime();
		//     var diff=Math.floor((self.endtime-self.starttime)/1000);
		//  	if(self.canexit){
		//  		tools.log('loaded ['+self.totalItems+'] items in ['+diff+']s',self.debug);
		//  		process.exit(0);
		//  	}   
		//  	self.canexit=1;
		// }
		// self.queue3 = self.async.queue(function (opts, fin) {
		//     self.getLatLng(opts,fin);
		// }, 2);
		// self.queue3.drain = function(){
		//     //export data
		//     if(self.canexit){
		//     	self.endtime=new Date().getTime();
		// 	    var diff=Math.floor((self.endtime-self.starttime)/1000);
		//  		tools.log('loaded ['+self.totalItems+'] items in ['+diff+']s',self.debug);
		//  		process.exit(0);
		//  	}
		// }
	},
	loadPages:function(){
		var c=2;
		while(c<=module.totalpages){
		//while(c<=3){
			module.queue.push({
				page:c
			})
			c++;
		}
	},
	parseData:function(page,data,fin){
		console.log('successfully loaded page ['+page+']/['+module.totalpages+']')
		if(data&&data.Result){
			try{
				var size=data.Result.length;
				var added=0;
				for (var i = 0; i < size; i++) {
					var item=data.Result[i];
					var marker={
						_id:'ya_'+item.SchoolId,
						loc:{
							lat:parseFloat(item.Coordinates.Latitude),
							lng:parseFloat(item.Coordinates.Longitude)
						},
						name:item.SchoolName,
						description:'',
						layer:'root',
						sub_layer:'yoga',
						via:'ya',
						links:[{
							url:'https://www.yogaalliance.org/SchoolPublicProfile?sid='+item.SchoolId,
							name:'Yoga Alliance Profile'
						}]
					};
					if(item.WebsiteUrl){
						marker.links.push({
							url:item.WebsiteUrl,
							name:'Website'
						})
					}
					markercoll.save(marker,function(){
						added++;
						module.loaded++;
						console.log('loaded ['+module.loaded+']');
						if(added==size){
							if(fin) fin()
						}
					})
				};
			}catch(e){
				console.log('error: '+e.message)
				fin();
			}
		}else{
			console.log('bad data for page ['+page+']')
			if(fin) fin()
		}
	},
	loaded:0,
	loadData:function(opts,fin){
		tools.post('https://www.yogaalliance.org/DesktopModules/YAServices/API/SchoolDirectory/SearchSchools',module.getOpts(opts.page),{
			'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
			'Origin':'https://www.yogaalliance.org',
			'Referer':'https://www.yogaalliance.org/Directory-Registrants?type=School&location=USA',
			'x-newrelic-id':'VQcDU1NUDxABV1NVAAcHUA==',
			'x-requested-with':'XMLHttpRequest'
		},1,function(data){
			module.parseData(opts.page,data,fin);
		})
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
	prepare:function(){
		var self=this;
		tools.get('',function(resp){//use this to calculate all pages to get
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
