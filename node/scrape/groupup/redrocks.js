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
         //    var l=$('.linkout').attr('href');
         //    var url=false;
         //    if(l){
    	    //     var p=l.split('url=');
    	    //     var url=p[1]
    	    // }
            function parseTime(string){
                var td=string.split(',');
                if(!td[1]) return {};
                var year=td[1].substr(1,5);
                var time=td[2];
                if(time&&time!=' '){
                    var tp=time.split(' ');
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
                    if(tm==0||tm=='0') tm='00';
                    var time=td[0]+', '+year+' '+th+':'+tm+':00';
                }else{
                    var time=td[0]+', '+year+' 00:00:00';
                }
                var d=new Date(time);//to ms
                var ttime=d.getTime();
                var ttime=d.getTime()-timezoneoffset;
                return {
                    date:td[0]+','+td[1]+', '+year,
                    ts:ttime
                };
            }
         //    var start='';
         //    var end='';
         //    var p=$('#datelist').text().split('-');//Monday, Feb 29, 2016 8 pm to var d=new Date("Feb 29, 2016 20:00:00")
         //    var start=parseTime(p[0]);
         //    if(p[1]){
         //        if(p[1].length<10){
         //            var finish=parseTime(start.date+p[1]);
         //        }else{
         //            var finish=parseTime(p[1]);
         //        }
         //    }else var finish='';
         //    // console.log('start:'+start.ts)
         //    // if(finish.ts) console.log('finish:'+finish.ts)
         //    // console.log(d.getTime())
         //    // console.log(d.getTime()+timezoneoffset)
         //    // console.log('end:'+end)
         //    //console.log(opts.cal)
         var htmls=$('.post_dates').find('.date_time').html().replace(/\n/g,'').replace(/\t/g,'').replace('</h1>','');
         htmls=htmls.replace('<h1><p>','')
         var html=htmls.split('</p>');
         var tt=$('.post_time').find('.date_time').html().replace(/\n/g,'').replace(/\t/g,'').replace('</h1>','');
         tts=tt.replace('<h1>','');
         var tsts=tts.split('<p>');
         var tst=tsts[0].toLowerCase();
         var st=html[1]+', '+tst;
         var start=parseTime(st);
         //console.log(st);
            var save={
                url:opts.url,
                title:$('h2').text(),
                date:$('.date_time').text().replace(/\n/g,'').replace(/\t/g,''),
                start:start.ts,
                url:opts.url,
                tag:opts.cal,
                pic:$('.post_image').find('img').attr('src'),
                description:$('.fc_txt.fullpage').html().replace(/\n/g,'').replace(/\t/g,'')
            }
         //    if(finish.ts&&!isNaN(finish.ts)){
         //        save.end=finish.ts;
         //        //save.diff=save.end-save.start;
         //    }
         //    if(save.end&&(save.end-save.start)>(1000*60*60*24*7)){//noting more than 7 days
         //        delete save.end;
         //    }
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
var months=['january','february','march','april','may','june','july','august','september','august','november','december'];
var categories=['arts-and-entertainment'];
var calendars={
    default:[//ents or somethin
        '3994%7C4167%7C4041%7C4000%7C4001%7C4019',
        '4050%7C4057%7C3995%7C4061%7C4106%7C4030%7C4034%7C4067%7C4085%7C4100%7C3977%7C3980%7C4031%7C3986%7C4036%7C3987%7C4023%7C4024%7C4025%7C4051%7C4083%7C4107%7C4037%7C4169%7C4059%7C3996%7C4116%7C4015%7C4016%7C4032%7C4079%7C4003',
        '4031%7C3986%7C4036%7C3987%7C4023%7C4024%7C4025%7C4051%7C4083%7C4107%7C4037%7C4169%7C4059%7C3996%7C4116%7C4015%7C4016%7C4032%7C4079%7C4003',
        '4059%7C3996%7C4116%7C4015%7C4016%7C4032%7C4079%7C4003'
    ],
    CTJgzqrXUD:[
        '4110%7C4110%7C4014%7C4014%7C4092%7C4092',
    ],
    CTJQG9sBA3:[
        '4041%7C4041%7C4061%7C4061%7C4043%7C4043%7C4026%7C4026'
    ],
    CTOncMuIuX:[
        '4035%7C4035%7C3976%7C3976%7C3983%7C3983%7C4048%7C4048%7C3984%7C3984%7C4002%7C4002%7C4066%7C4066%7C4020%7C4020%7C4055%7C4055%7C4022%7C4022%7C3993%7C3993%7C4067%7C4067%7C4010%7C4010%7C4011%7C4011%7C4101%7C4101%7C4102%7C4102%7C4103%7C4103%7C4068%7C4068%7C4039%7C4039%7C4027%7C4027%7C4173%7C4173%7C4137%7C4137%7C4138%7C4138%7C4132%7C4132%7C4104%7C4104%7C4105%7C4105%7C4082%7C4082%7C4086%7C4086',
    ],
    CTV3r4cvkU:[
        '4035%7C4035%7C3976%7C3976%7C3983%7C3983%7C4048%7C4048%7C3984%7C3984%7C4002%7C4002%7C4066%7C4066%7C4020%7C4020%7C4055%7C4055%7C4022%7C4022%7C3993%7C3993%7C4067%7C4067%7C4010%7C4010%7C4011%7C4011%7C4101%7C4101%7C4102%7C4102%7C4103%7C4103%7C4114%7C4114%7C4115%7C4115%7C4068%7C4068%7C4039%7C4039%7C4027%7C4027%7C4173%7C4173%7C4137%7C4137%7C4138%7C4138%7C4132%7C4132%7C4104%7C4104%7C4105%7C4105%7C4082%7C4082%7C4086%7C4086'
    ],
    CTdna52GVo:[
        '4065%7C4065%7C4066%7C4066%7C4020%7C4020%7C4106%7C4106%7C4081%7C4081%7C4083%7C4083%7C4116%7C4116'
    ],
    CTGPqzCPuv:[
        '4168%7C4168%7C4167%7C4167%7C4160%7C4160%7C4161%7C4161%7C4162%7C4162%7C4136%7C4136%7C4163%7C4163%7C4164%7C4164%7C4165%7C4165%7C4166%7C4166'
    ],
    CTAPGDqQnv:['4017%7C4017%7C4066%7C4066%7C4020%7C4020%7C4080%7C4080%7C4014%7C4014%7C4081%7C4081%7C4083%7C4083%7C4060%7C4060%7C4082%7C4082%7C4188%7C4188'],
    CTFF9f7bLj:['4167%7C4167%7C4160%7C4160%7C4161%7C4161%7C4061%7C4061%7C4162%7C4162%7C4085%7C4085%7C4163%7C4163%7C4164%7C4164%7C4165%7C4165%7C4166%7C4166'],
    CT1fS1ICcH:['3992%7C3992%7C4050%7C4050%7C4057%7C4057%7C3998%7C3998%7C4117%7C4117%7C4015%7C4015%7C4032%7C4032']
}
// var page=1;
// while(page<=9){
//     (function(page){
//         var tp=base+url+'?page='+page;
for (cal in calendars) {
    for (var i = 0; i < calendars[cal].length; i++) {
        var frag=calendars[cal][i];
        (function(opts){
            request(opts.url, function (err, response, body) {
                if (err) throw err;
                var $ = cheerio.load(body);
                $('.redrocks').each(function(i,v){
                    var link=$(v).find('.post_image').find('a').attr('href');
                    queue.push({
                        cal:opts.cal,
                        url:link,
                    })
                })
            });
        })({
            url:'http://redrocksonline.com/embed/event-load/'+frag,
            cal:cal
        })
    };
}
//     })(page);
// 	page++;
// }