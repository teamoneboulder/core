if(!window.modules) window.modules={};
modules.moment={
    months:{
        0:{
            short:'Jan'
        },
        1:{
            short:'Feb'
        },
        2:{
            short:'Mar'
        },
        3:{
            short:'Apr'
        },
        4:{
            short:'May'
        },
        5:{
            short:'Jun'
        },
        6:{
            short:'Jul'
        },
        7:{
            short:'Aug'
        },
        8:{
            short:'Sep'
        },
        9:{
            short:'Oct'
        },
        10:{
            short:'Nov'
        },
        11:{
            short:'Dec'
        }
    },
    getTimezoneAbr:function(zone){
        return moment().tz(zone).zoneAbbr();
    },
	getTs:function(ts,php){
        var sts=ts+'';
        if(ts['$oid']) sts=ts['$oid'];//monglo
        if(ts.day&&ts.month){
            return parseInt(moment().set('date',ts.day).set('month',ts.month-1).set('hour',12).set('minute',0).format('x'),10);
        }else if(sts.length==24){//mongo time!!!!! conver to UTS WOOT!
            if(sts.indexOf('.000Z')>=0){ //mongo date obj
                ts=new Date(ts).getTime();
            }else{//mongo ID
                ts=parseInt(sts.substring(0, 8), 16)*1000;
                ts=ts-(1000*30);//move to 30 seconds in past
            }
        }else if(ts['$date']){//try to create a date obj, TSU from PHP
            if(ts['$date']['$numberLong']){
                ts=parseInt(ts['$date']['$numberLong'],10);
            }else{
                ts=parseInt(ts['$date'],10);
            }
        }else if(php) ts=ts*1000;//convert to javascript time{
        else {
            ts=new Date(ts).getTime();
            if(!ts){
                console.warn('invalid ts');
                return false;
            }
        }
        return ts;
    },
    parse:function(string){
        return Math.floor(Date.parse(string)/1000);
    },
    getAge:function(ts,php){
        var self=this;
        if(ts){
            ts=self.getTs(ts,php);
            if(!ts) return false;
        }else{
            return '';
        }
        return moment().diff(new Date(ts), 'years');
    },
    getDiff:function(ts,php,type){
        var self=this;
        if(ts){
            ts=self.getTs(ts,php);
            if(!ts) return false;
        }else{
            return '';
        }
        return moment().diff(new Date(ts), type);
    },
    getTimezoneDiff:function(zone1,zone2){
        var now = moment().tz(zone1)
        var localOffset = now.utcOffset();
        now.tz(zone2); // your time zone, not necessarily the server's
        var centralOffset = now.utcOffset();
        var diffInMinutes = localOffset - centralOffset;
        return diffInMinutes*60;//return in seconds
    },
    format:function(ts,type,end,php,timezone){
        var self=this;
        if(ts){
            ts=self.getTs(ts,php);
            if(!ts) return false;
        }else{
            return '';
        }
        if(timezone){
            //conver local clock to GMT
            var diff=new Date().getTimezoneOffset()*60*1000;
            //conver GMT to timezone
            diff+=moment.tz(moment.utc(), timezone).utcOffset()*1000*60;//in JS Time
            if(end){
                var em=moment(self.getTs(end,php)+diff);
            }
            var m=moment(ts+diff);
        }else{//assume local timezone
            timezone=_.getTimeZone();
            if(end){
                var em=moment(self.getTs(end,php));
            }
            var m=moment(ts);
        }
        var str='';
        switch(type){
            case 'simplerelative':
                str=m.fromNow();
            break;
            case 'birthday':
                str=m.format('MMM Do');
            break;
            case 'birthday_full':
                str=m.format('MMM Do YYYY');
            break;
            case 'short':
                str=m.short();//1m, 1h, 23h, 5d
            break;
            case 'mstime':
                str=str=m.format('h:mm:ss:SSSS');//Sun Jun 24th
            break;
            case 'ago':
                str=m.fromNow();//2 hours ago...12 days ago...
            break;
            case 'ago_day':
                //today, yesterday, 2/22/18
                var daysdiff=m.startOf('day').diff(moment().startOf('day'), 'days');
                if(daysdiff==0) str='Today';
                else if(daysdiff==-1) str='Yesterday';
                else if(daysdiff==1) str='Tomorrow';
                else{
                    if(Math.abs(daysdiff)<=31){
                        if(daysdiff>0){
                            str='in '+daysdiff+' days';
                        }else{
                            str=Math.abs(daysdiff)+' days ago';
                        }
                    }else{
                        var monthdiff=m.diff(moment(), 'months');
                        if(Math.abs(monthdiff)==1){
                            if(monthdiff>0){
                                str='in '+monthdiff+' month';
                            }else{
                                str=Math.abs(monthdiff)+' month ago';
                            }
                        }else{
                            if(monthdiff>0){
                                str='in '+monthdiff+' months';
                            }else{
                                str=Math.abs(monthdiff)+' months ago';
                            }
                        }
                    }
                }
            break;
            case 'start_of_day':
                str=m.startOf('day').format('x');
            break;
            case 'ts':
                str=parseFloat(m.format('x'));//Unix TS in JS
            break;
            case 'comment':
                str=m.short();//1m 2h 5d,...jan 12 1918
            break;
            case 'chat_ago':
                var diff=Math.abs(m.diff(new Date().getTime()));
                var hours=diff/(60*60*1000);
                var days=diff/(60*60*24*1000);
                if(hours<24){
                    str=m.format('h:mm a');
                }else if(days<4){
                    str=m.format('ddd');
                }else{
                    str=m.format('MMM Do');//Sun Jun 24th
                }
            break;
            case 'chat':
                var diff=Math.abs(m.diff(new Date().getTime()));
                var days=diff/(60*60*24*1000);
                if(days>1){
                    str=m.format('h:mm a ddd MMM Do');//6:31pm Sun Jun 24th
                }else{
                    str=m.format('h:mm a')+' ('+m.fromNow()+')';
                }
            break;
            case 'nicedate':
                str=m.format('dddd MMMM Do');
            break;
            case 'date':
                str=m.format('l');
            break;
            case 'prettydate':
                str=m.format('ddd MMM Do');//Sun Jun 24th
            break;
            case 'birthday':
                str=m.format('MMM Do, YYYY');//Jun 24th, 1989
            break;
            case 'news':
                str=m.format('ddd, MMM Do') +' &middot; '+ m.short();//Sun Jun 24th
            break;
            case 'timerange':
                str=m.format('h:mm a');
                if(em){
                    str+=' - '+em.format('h:mm a');
                }else{
                    str+=' - ???';
                }
            break;
            case 'day':
                str=m.format('D');
            break;
            case 'month':
                str=m.format('MMM');
            break;
            case 'event':
                str=m.format('h:mm a MMM Do');//4:43 pm Aug 23rd
            break;
            case 'event_time':
                str=m.format('h:mm a');//4:43 pm Aug 23rd
            break;
            case 'eventheader':
                str=m.format('dddd, MMM Do');
            break;
            case 'times':
                 str=m.format('h:mm a');//Saturday, Jan 26 at 7:30pm - 8:30pm
                 if(em){
                    str+=' - '+em.format('h:mm a');
                }
            break;
            case 'event_full':
                 str=m.format('dddd, MMM Do')+' at ';
                 if(em){
                    str+=m.format('h:mm a');//Saturday, Jan 26 at 7:30pm - 8:30pm
                    if(m.dayOfYear()!=em.dayOfYear()){
                        str+=' - '+em.format('dddd, MMM Do')+ ' at '+ em.format('h:mm a z');
                    }else{
                        str+=' - '+em.format('h:mm a')+ ' '+moment.tz.zone(timezone).abbr(360);
                    }
                }else{
                    str+=m.format('h:mm a z')+ ' '+moment.tz.zone(timezone).abbr(360);//Saturday, Jan 26 at 7:30pm - 8:30pm
                }
            break;
            case 'full':
                 str=m.format('dddd, MMM Do YYYY')+' at '+m.format('h:mm a');//Saturday, Jan 26 at 7:30pm - 8:30pm
                 if(em){
                    str+=' - '+em.format('h:mm a');
                }
            break;
            case 'event_full_short':
                 str=m.format('ddd, MMM Do')+' at ';
                 if(em){
                    str+=m.format('h:mm a');//Sat, Jan 26 at 7:30pm
                    //if day is same
                    if(m.format('MMM Do, YYYY')==em.format('MMM Do, YYYY')){
                        str+=' - '+em.format('h:mm a')+ ' '+moment.tz.zone(timezone).abbr(360);
                    }else{
                        str+=' - '+em.format('ddd, MMM Do')+ ', '+em.format('h:mm a')+ ' '+moment.tz.zone(timezone).abbr(360);
                    }
                }else{
                    str+=m.format('h:mm a')+ ' '+moment.tz.zone(timezone).abbr(360);;//Sat, Jan 26 at 7:30pm
                }
                str=str.replace(/:00/g,'');
            break;
            case 'meditate':
                str=m.format('Do of MMMM (dddd)');//4th of January (tuesday)
            break;
            case 'prettyevent':
                str=m.format('h:mm');
                if(em){
                    str+=' to '+em.format('h:mm a');
                }
                str+=' '+em.format('ddd MMM Do');
            break;
            case 'time'://9:00 am
                str=m.format('h:mm a');
            break;
            case 'lastdate':
                str=m.format('M-D-YY');
            break;
            case 'simpledate':
                //today, yesterday, 2/22/18
                var ct=moment();
                if(timezone) ct.tz(timezone);
                var today=ct.format('M/D/YY');
                var yesterday=ct.subtract(1, 'days').format('M/D/YY');
                str=m.format('M/D/YY');
                if(str==today) str='Today'
                if(str==yesterday) str='Yesterday';
            break;
            default:
                str=m.format('LLL');
            break;
        }
        return str;
    }
}