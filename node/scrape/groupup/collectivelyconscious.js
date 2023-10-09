var request = require('request')
  , cheerio = require('cheerio')
  , async = require('async');
var debug=0;
var out={
	order:[],
	list:{}
};
var outartists={};
var starttime=new Date().getTime();
function logs(msg,force){
	//var debug=0;
	if(debug||force) console.log(msg);
}
function writefile(path,data,cb){
	var fs = require('fs');
	fs.writeFile(path, data, function(err) {
	    if(err) {
	        console.log(err);
	    } else {
	        console.log("The file was saved!");
	    }
	    if(cb) cb();
	});
}
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
var events=[];
var queue = async.queue(function (opts, fin) {
    getContent(opts,fin);
}, 100);
var timezoneoffset=(60*1000*60)*(-7);
function getContent(opts,fin){
    (function(opts){
        request(opts.url, function (err, response, body) {
            if (err) throw err;
            var $ = cheerio.load(body);
            var l=$('.linkout').attr('href');
            var url=false;
            if(l){
    	        var p=l.split('url=');
    	        var url=p[1]
    	    }
            function parseTime(string){
                var td=string.split(',');
                if(!td[1]) return {};
                var year=td[2].substr(1,5);
                var time=td[2].replace(/\n/g,'').substr(5,td[2].length);
                if(time&&time!=' '){
                    var tt=time.split(';');
                    var tp=tt[0].split(' ');
                    var hm=tp[1].split(':');
                    var th=parseInt(hm[0],10);
                    var tm=(hm[1])?parseInt(hm[1],10):'00';
                    //convert to 24 hour clock
                    if(tp[2]=='am'&&th==12){
                        th=0;
                    }
                    if(tp[2]=='pm'){//add 12
                        th=th+12;
                    }
                    var time=td[1]+', '+year+' '+th+':'+tm+':00';
                }else{
                    var time=td[1]+', '+year+' 00:00:00';
                }
                var d=new Date(time);//to ms
                var ttime=d.getTime();
                //var ttime=d.getTime()+timezoneoffset;
                return {
                    date:td[0]+','+td[1]+', '+year,
                    ts:ttime
                };
            }
            var start='';
            var end='';
            var p=$('#datelist').text().split('-');//Monday, Feb 29, 2016 8 pm to var d=new Date("Feb 29, 2016 20:00:00")
            var start=parseTime(p[0]);
            if(p[1]){
                if(p[1].length<10){
                    var finish=parseTime(start.date+p[1]);
                }else{
                    var finish=parseTime(p[1]);
                }
            }else var finish='';
            // console.log('start:'+start.ts)
            // if(finish.ts) console.log('finish:'+finish.ts)
            // console.log(d.getTime())
            // console.log(d.getTime()+timezoneoffset)
            // console.log('end:'+end)
            //console.log(opts.cal)
            var save={
                title:$('h1').html(),
                date:$('#datelist').text(),
                start:start.ts,
                url:url,
                tag:opts.cal,
                description:$($('hr')[1]).next('p').text()
            }
            if(finish.ts&&!isNaN(finish.ts)){
                save.end=finish.ts;
                //save.diff=save.end-save.start;
            }
            if(save.end&&(save.end-save.start)>(1000*60*60*24*7)){//noting more than 7 days
                delete save.end;
            }
            events.push(save)
            fin();
        });
    })(opts);
}
queue.drain = function() {
	//export data
	//logs(allparticipants)
	var endtime=new Date().getTime();
	var diff=Math.floor((endtime-starttime)/1000);
    console.log(JSON.stringify(events))
}
var load='http://collectivelyconscious.net/documentaries-archives/spiritual-documentaries/';
request(load, function (err, response, body) {
    if (err) throw err;
    var $ = cheerio.load(body);
    var sections={};
    var links=[];
    var get=[0,2,3];
    $('#navbox2').find('li').each(function(ti,tv){
        if(get.indexOf(ti)>=0){
            $(tv).find('a').each(function(i,v){
                if(i>1) links.push($(v).attr('href'))
            });
        }
    });
    console.log(links)
});

//     })(page);
// 	page++;
// }