//make standards son
//common header and settings/modules
var tools=require('groupup.js');
var async = require('async');
var months=['january','february','march','april','may','june','july','august','september','august','november','december'];
//initialize
tools.init();

//specific module, should ge generalized framework for getting content from sites
var module={
    init:function(){
        var self=this;
        self.startime=new Date().getTime();
        self.events=[];
        self.timezoneoffset=(60*1000*60)*(6);//MDT=6
        self.queue = async.queue(function (opts, fin) {
            self.getContent(opts,fin);
        }, 100);
        self.queue.drain = function() {
            //export data
            self.endtime=new Date().getTime();
            var diff=Math.floor((self.endtime-self.starttime)/1000);
            console.log(JSON.stringify(self.events))
        }
        self.pageLoader();
    },
    getContent:function(opts,fin){
        var self=this;
        // (function(opts,self){
            //console.log(opts.url)
            tools.get(opts.url,function(body){
                //console.log(body)
                var $ = tools.getJquery(body);
                var l=$('.linkout').attr('href');
                var url=false;
                if(l){
                    var p=l.split('url=');
                    var url=p[1]
                }
                var start='';
                var end='';
                var p=$('#datelist').text().split('-');//Monday, Feb 29, 2016 8 pm to var d=new Date("Feb 29, 2016 20:00:00")
                var start=self.parseTime(p[0]);
                if(p[1]){
                    if(p[1].length<10){
                        var finish=self.parseTime(start.date+p[1]);
                    }else{
                        var finish=self.parseTime(p[1]);
                    }
                }else var finish='';
                var save={
                    title:$('h1').html(),
                    date:$('#datelist').text(),
                    start:start.ts,
                    url:url,
                    tag:opts.cal,
                    description:$($('hr')[1]).next('p').text()
                }
                //console.log(save)
                if(finish.ts&&!isNaN(finish.ts)){
                    save.end=finish.ts;
                    //save.diff=save.end-save.start;
                }
                if(save.end&&(save.end-save.start)>(1000*60*60*24*7)){//noting more than 7 days
                    delete save.end;
                }
                self.events.push(save)
                fin();
            })
        // })(opts,self);
    },
    parseTime:function(string){
        var self=this;
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
        var ttime=d.getTime()+self.timezoneoffset;
        return {
            date:td[0]+','+td[1]+', '+year,
            ts:ttime
        };
    },
    pageLoader:function(){
        var self=this;
        var categories=['arts-and-entertainment'];
        var start='05-01-2017';//'05-01-2016';
        var end='08-01-2017';//'06-24-2016';
        var calendars={
            default:'https://www.boulderdowntown.com/_templates/_bbq_results.pxp?bbqparam='+start+'-to-'+end+'/arts-and-entertainment',
            CTGsjZYYup:'https://www.boulderdowntown.com/_templates/_bbq_results.pxp?bbqparam='+start+'-to-'+end+'/workshops-and-meetings',
            CTrTk53VAw:'https://www.boulderdowntown.com/_templates/_bbq_results.pxp?bbqparam='+start+'-to-'+end+'/festivals',
            CTJICkMM0M:'https://www.boulderdowntown.com/_templates/_bbq_results.pxp?bbqparam='+start+'-to-'+end+'/live-music'
        }
        for (cal in calendars) {
            (function(opts){
                tools.get(opts.url, function (body) {
                    var $=tools.getJquery(body);
                    $('a').each(function(i,v){
                        var link=$(v).attr('href');
                        if(link.indexOf('/do/')==0){
                            //console.log(link)
                            self.queue.push({
                                cal:opts.cal,
                                url:'https://www.boulderdowntown.com'+link,
                            })
                        }
                    })
                });
            })({
                url:calendars[cal],
                cal:cal
            })
        };
    }
}
module.init();