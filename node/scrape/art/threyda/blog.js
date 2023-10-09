/*Genneral Set-Up*/
var tools = require('groupup.js');
var force=(process.argv[2])?1:0;
tools.init();
tools.setVar('debug',1);//set debug mode
tools.setVar('imageopts',{
    sizes:['small','full'],
    path:'/sites/threyda/blogs/',
    force:0,
    preview:1
})
var cheerio = require('cheerio'), async = require('async');
var starttime=new Date().getTime();
var global={//put everything to save in save
    save:{},
    count:0,
    total:0,
};//store everything in out, its a global


var savepath='/var/www/root/node/tempdata/threyda_blog_2.json';
var odata=tools.getFile(savepath,1);
if(!odata) odata={};
global.save=odata;//include old data in save, if update
var queue = async.queue(function (opts, fin) {
    getContent(opts,fin);
}, 100);
queue.drain = function() {
	var endtime=new Date().getTime();
	var diff=Math.floor((endtime-starttime)/1000);
	var size=tools.size(global.save);
	tools.log('Completed loading ['+size+'] blogs in ['+diff+'] seconds');
	//tools.log(JSON.stringify(global.save),1);
    //process.exit(0);
    tools.saveFile(savepath,JSON.stringify(global.save),function(){
        tools.log('done')
        process.exit(0);
    })
}
/*CUSTOM BIT TO SCRAPE*/
var base='https://www.threyda.com';
function fixContent(content,cb){
    var $ = cheerio.load(content);
    var imgs=[];
    $('img').each(function(){
        var o=$(this);
        imgs.push(o.attr('src'));
    })
    if(imgs.length){
        tools.processImages(imgs,function(map){
            for(img in map){
                var nimg=map[img].url;
                img='src=\"'+img+'\"';
                content=content.replace(img,'src="'+nimg+'"');
            }
            cb(content,map);
        })
    }else cb(content);
}
function getContent(opts,fin){
    tools.get(base+opts.page, function (resp) {
        var $ = cheerio.load(resp);
        var meta=$('.blog_meta');
        var co=meta;
        var content='';
        while(!co.next().hasClass('clear')){
            co=co.next();
            content+=$.html(co);
        }
        fixContent(content,function(content,map){
            var obj={
                _id:tools.toURL($('.headline').html()),
                title:$('.headline').html(),
                content:content,
                date:$('.blog_meta span:nth-child(2)').html(),
                map:map
            };
            global.count++;
            tools.log('['+global.count+'/'+global.total+'] ['+opts.page+']');
            if(map&&tools.size(map)){//try to grab first image
                var k=Object.keys(map);
                var src=k[0];
                var img={
                    path:map[src].path,
                    ext:map[src].ext
                }
                obj.img=img;
                src=tools.fixUrl(src);
                tools.log('Saving Thumbnail ['+src+']',1);
                tools.saveImage({
                    img:src,
                    size:'thumb'
                },function(){
                    tools.log('Saved Thumbnail! ['+src+']',1);
                    global.save[opts.page]=obj
                    fin();
                })
                //save thumb!
            }else{
                global.save[opts.page]=obj
                fin();
            }
        })
    });
}
var url = '/blogs/threyda';
var page=1;
while(page<=3){
    (function(page){
        var tp=base+url+'?page='+page;
    	tools.get(tp, function (resp) {
    	    var $ = cheerio.load(resp);
    	    $('.article').each(function () {
    	    	var o=$(this);
                var page=o.find('h2').find('a').attr('href');
                if(odata[page]&&!force){
                    tools.log('['+page+'] already loaded!');
                }else{
                    if(page){
                        global.total++;
                        //pc++;
            	    	queue.push({
                            page:page
            	    	})
                    }
                }
    	    });
    	});
    })(page);
	page++;
}