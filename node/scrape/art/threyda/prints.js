/*Genneral Set-Up*/
var tools = require('groupup.js');
var force=(process.argv[2])?1:0;
tools.init();
tools.setVar('debug',1);//set debug mode
tools.setVar('protocol','https://');//set debug mode
tools.setVar('imageopts',{
	sizes:['small','thumb','full','cover'],
	path:'/sites/threyda/prints/',
	force:1
})
var cheerio = require('cheerio'), async = require('async');
var starttime=new Date().getTime();
var global={//put everything to save in save
    save:{},
    count:0,
    total:0,
};//store everything in out, its a global


var savepath='/var/www/root/node/tempdata/threyda_prints_2.json';
var odata=tools.getFile(savepath,1);
if(!odata) odata={};
global.save=odata;//include old data in save, if update
var queue = async.queue(function (opts, fin) {
    getInfo(opts,fin);
}, 100);
queue.drain = function() {
	tools.processImages(global.images,function(map){
		for(var k in global.save){
			var item=global.save[k];
			if(map[item.src]){
				global.save[k].img=map[item.src];
			}
		}
		var endtime=new Date().getTime();
		var diff=Math.floor((endtime-starttime)/1000);
		var size=tools.size(global.save);
		tools.log('Completed loading ['+size+'] prints in ['+diff+'] seconds');
		// tools.log(JSON.stringify(global.save),1);
	 //    process.exit(0)
	 //    console.log(global.save)
	    tools.saveFile(savepath,JSON.stringify(global.save),function(){
	        tools.log('done')
	        process.exit(0);
	    })
	},global.ids)
}
/*CUSTOM BIT TO SCRAPE*/

function getInfo(opts,fin){
	tools.get(base+opts.link, function (resp) {
	    var $ = cheerio.load(resp);
	    //try to get artist too :)
		global.count++;
		tools.log('['+global.count+'/'+global.total+'] ['+opts.link+']',1);
		var artists=false;
		var ta=opts.name.split(' by ');
		var name=ta[0];
		if(ta[1]){
			if(ta[1].indexOf(', ')>=0){
				var artists=[];
				var tats=ta[1].split(', ');
				for (var i = 0; i < tats.length; i++) {
					if(i<tats.length-1){
						artists.push(tats[i]);
					}else{
						if(tats[i].indexOf('&')>=0){
							var m=tats[i].split(' & ');
							artists.push(m[0]);
							artists.push(m[1]);
						}else if(tats[i].indexOf('and')>=0){
							var m=tats[i].split(' and ');
							artists.push(m[0]);
							artists.push(m[1]);
						}
					}
				};
			}
			else if(ta[1].indexOf('&')>=0){
				artists=ta[1].split(' & ');
			}else if(ta[1].indexOf('and')>=0){
				artists=ta[1].split(' and ');
			}else{
				artists=[ta[1]];
			}
		}
		for (var i = 0; i < artists.length; i++) {
			artists[i]=tools.toURL(artists[i]);
		};
		//get print sizes
		if(!global.images) global.images=[];
		if(!global.ids) global.ids=[];
		var img=tools.fixUrl($(".product_gallery").find('li').first().attr('data-thumb'),1);
		global.images.push(img);
		global.ids.push(opts._id);
	    var obj={
	    	name:name,
	    	artists:artists,
	    	src:img,
	    	_id:opts._id
	    }
	    global.save[opts.link]=obj;
	    setTimeout(function(){
	    	fin();
	    },1000);
	});
}
var base='https://www.threyda.com'
var url = '/collections/art-and-goods/';
var page=1;
while(page<=7){
	tools.get(base+url+'?page='+page, function (resp) {
	    var $ = cheerio.load(resp);
	    $('.products').find('.thumbnail').each(function () {
	    	var o=$(this);
	    	var link=o.find('a').first().attr('href');
		    var name=o.find('.title').text().trim()
	    	if(link&&name){
		    	var ln=link.split('/');
		    	var url=ln[ln.length-1];
		    	global.total++;
		    	queue.push({
		    		_id:tools.toURL(name),
		    		name:name,
		    		url:url,
		    		link:link
		    	})
			}
	    });
	});
	page++;
}