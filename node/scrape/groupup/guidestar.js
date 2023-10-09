//urlt=http://www.ic.org/wp-json/v1/directory/entries/?page=X
var tools=require('groupup.js');
var mongojs = require('mongojs');
var datadb = mongojs('data');
var datacoll=datadb.collection('intentional_communities');//only get collection once.
var markerdb = mongojs('groupup');
var markercoll=markerdb.collection('map_marker');//only get collection once.
//initialize
tools.init();
var count=0;
var module={
	debug:1,
	getOpts:function(page){
		return {
			CurrentPage:page,
			SearchType:'org',
			GroupExemption:'',
			AffiliateOrgName:'',
			SelectedCityNav:['Boulder'],
			SelectedCountyNav:[],
			Eins:'',
			ul:'',
			Keywords:'',
			FirstName:'',
			LastName:'',
			State:'Colorado',
			ZipRadius:'Zip Only',
			City:'',
			CityNav:'Boulder',
			Participation:'',
			PeopleZipRadius:'Zip Only',
			PeopleCity:'',
			PeopleRevenueRangeLow:'$50000',
			PeopleRevenueRangeHigh:'max',
			PeopleAssetsRangeLow:'$50000',
			PeopleAssetsRangeHigh:'max'
		}
	},
	count:0,
	init:function(){
		var self=this;
		self.async = require('async');
		self.cheerio = require('cheerio');
		markercoll
		tools.post('http://www.guidestar.org/search/SubmitSearch',module.getOpts(1),{
			'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
			'Host':'www.guidestar.org',
			'Origin':'http://www.guidestar.org',
			'Referer':'http://www.guidestar.org/search',
			'Cookie':'ASP.NET_SessionId=rrq0ya54a1xiazqi3nowd5xh; D_SID=98.245.126.179:xCfk8O79HVa1xls5dhsEM1BOliCoKNluUgcjoYTPESs; messagesUtk=e2d86e62c297a92edc064dc46abb0c3d; _dc_gtm_UA-946060-8=1; __atuvc=3%7C45; __atuvs=5a07a93d1c87e9d8000; _vwo_uuid_v2=30F8DC93C91B53D3023C03066BB86CAA|a6b7165e5b62b571c29810ee149054b2; _ga=GA1.2.1803825464.1510357908; _gid=GA1.2.174834512.1510451396; ki_t=1510357908742%3B1510451396361%3B1510451532235%3B2%3B20; ki_r=; _bizo_bzid=e0744fcc-4568-4fa6-b01b-c7df40a789f6; _bizo_cksm=00C9DA6B0831DE9C; __hstc=126119634.e2d86e62c297a92edc064dc46abb0c3d.1510357908754.1510357908754.1510451396373.2; __hssrc=1; __hssc=126119634.4.1510451396373; hubspotutk=e2d86e62c297a92edc064dc46abb0c3d; D_IID=857B5E81-F673-364A-A5FF-E41103F357B4; D_UID=06D36A24-5116-3579-AE6C-FC867A98B67E; D_ZID=4CC77922-3BD7-3F8D-919F-27C425430C57; D_ZUID=E939F5A9-5728-3B15-8F63-9880D4BE4F36; D_HID=3F5DE7CA-DA12-3B65-B7D1-4FEB6BE3F0F2; mp_5d9e4f46acaba87f5966b8c0d2e47e6e_mixpanel=%7B%22distinct_id%22%3A%20%22anonymous_user%22%2C%22%24search_engine%22%3A%20%22google%22%2C%22%24initial_referrer%22%3A%20%22https%3A%2F%2Fwww.google.com%2F%22%2C%22%24initial_referring_domain%22%3A%20%22www.google.com%22%2C%22__mps%22%3A%20%7B%7D%2C%22__mpso%22%3A%20%7B%7D%2C%22__mpus%22%3A%20%7B%7D%2C%22__mpa%22%3A%20%7B%7D%2C%22__mpu%22%3A%20%7B%7D%2C%22__mpap%22%3A%20%5B%5D%7D; mp_mixpanel__c=0',
			'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',
			'X-Distil-Ajax':'becuuuwfdrxdttxacfxtvwawuvwf',
			'X-Requested-With':'XMLHttpRequest'
		},false,function(data){
			module.totalpages=Math.ceil(data.TotalHits/data.NumHits);
			self.loadPages();
		})
		self.queue = self.async.queue(function (opts, fin) {
		    self.loadData(opts,fin);
		}, 2);
		self.queue.drain = function(){
		    tools.log('Done Loading Data API DATA');
		}
		self.queue2 = self.async.queue(function (opts, fin) {
		    self.loadPage(opts,fin);
		}, 1);
		self.queue2.drain = function(){
		    tools.log('Done Loading ['+self.count+'] items',self.debug);
		    process.exit(0);
		}
		return false;
	},
	loadPages:function(){
		var c=1;
		//while(c<=module.totalpages){
		while(c<=3){
			module.queue.push({
				page:c
			})
			c++;
		}
	},
	parseData:function(page,data,fin){
		console.log('successfully loaded page ['+page+']/['+module.totalpages+']')
		if(data&&data.Hits){
			try{
				var size=data.Hits.length;
				var added=0;
				for (var i = 0; i < size; i++) {
					var item=data.Hits[i];
					var marker={
						_id:'gs_'+item.Ein,
						name:item.OrgName,
						description:'',
						layer:'heart',
						sub_layer:'nonprofit',
						via:'gs',
						links:[{
							url:'http://www.guidestar.org/profile/'+item.Ein,
							name:'Guidestar Profile'
						}]
					};
					if(count<1){
					module.queue2.push({url:'https://www.guidestar.org/profile/'+item.Ein,marker:marker});
					count++;
					}
				};
				if(fin) fin()
			}catch(e){
				console.log('error: '+e.message)
				fin();
			}
		}else{
			console.log('bad data for page ['+page+']')
			if(fin) fin()
		}
	},
	loadPage:function(opts,fin){
		console.log(opts.url)
		tools.get(opts.url,function(data){
			console.log(data)
			var $ = module.cheerio.load(data);
			var marker=opts.marker;
			console.log($('.url-container').find('a').attr('src'))
			console.log($('.yw-account-nav-height-a-webform').text())
			if($('.url-container').find('a').attr('src')){
				marker.links.push({
					name:'Website',
					url:$('.url-containe').find('a').attr('src')
				})
			}
			fin();
		})
	},
	loaded:0,
	loadData:function(opts,fin){
		tools.post('http://www.guidestar.org/search/SubmitSearch',module.getOpts(opts.page),{
			'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
			'Host':'www.guidestar.org',
			'Origin':'http://www.guidestar.org',
			'Referer':'http://www.guidestar.org/search',
			'Cookie':'ASP.NET_SessionId=rrq0ya54a1xiazqi3nowd5xh; D_SID=98.245.126.179:xCfk8O79HVa1xls5dhsEM1BOliCoKNluUgcjoYTPESs; messagesUtk=e2d86e62c297a92edc064dc46abb0c3d; _dc_gtm_UA-946060-8=1; __atuvc=3%7C45; __atuvs=5a07a93d1c87e9d8000; _vwo_uuid_v2=30F8DC93C91B53D3023C03066BB86CAA|a6b7165e5b62b571c29810ee149054b2; _ga=GA1.2.1803825464.1510357908; _gid=GA1.2.174834512.1510451396; ki_t=1510357908742%3B1510451396361%3B1510451532235%3B2%3B20; ki_r=; _bizo_bzid=e0744fcc-4568-4fa6-b01b-c7df40a789f6; _bizo_cksm=00C9DA6B0831DE9C; __hstc=126119634.e2d86e62c297a92edc064dc46abb0c3d.1510357908754.1510357908754.1510451396373.2; __hssrc=1; __hssc=126119634.4.1510451396373; hubspotutk=e2d86e62c297a92edc064dc46abb0c3d; D_IID=857B5E81-F673-364A-A5FF-E41103F357B4; D_UID=06D36A24-5116-3579-AE6C-FC867A98B67E; D_ZID=4CC77922-3BD7-3F8D-919F-27C425430C57; D_ZUID=E939F5A9-5728-3B15-8F63-9880D4BE4F36; D_HID=3F5DE7CA-DA12-3B65-B7D1-4FEB6BE3F0F2; mp_5d9e4f46acaba87f5966b8c0d2e47e6e_mixpanel=%7B%22distinct_id%22%3A%20%22anonymous_user%22%2C%22%24search_engine%22%3A%20%22google%22%2C%22%24initial_referrer%22%3A%20%22https%3A%2F%2Fwww.google.com%2F%22%2C%22%24initial_referring_domain%22%3A%20%22www.google.com%22%2C%22__mps%22%3A%20%7B%7D%2C%22__mpso%22%3A%20%7B%7D%2C%22__mpus%22%3A%20%7B%7D%2C%22__mpa%22%3A%20%7B%7D%2C%22__mpu%22%3A%20%7B%7D%2C%22__mpap%22%3A%20%5B%5D%7D; mp_mixpanel__c=0',
			'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36',
			'X-Distil-Ajax':'becuuuwfdrxdttxacfxtvwawuvwf',
			'X-Requested-With':'XMLHttpRequest'
		},true,function(data){
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
