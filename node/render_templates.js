//START simple way to get data from php
var data=process.argv[2];
var opts=JSON.parse(new Buffer(data, 'base64').toString());
//END simple way to get data from php
var ejs= require('ejs');
var fs = require('fs');
var cheerio = require('cheerio');
var async = require('async');
var queue = async.queue(function (opts, fin) {
    getTemplate(opts.file,fin);
}, 100);
global.templatetext='';
global.templates={};
var st=new Date().getTime();
var $={};
$.each=function(obj,fn){
    for (var key in obj) {
        fn(key,obj[key]);
    }
}
function getIndexByKey(list,key,index){
    var keys=getKeys(list,index);
    return (keys.indexOf(key)!=-1)?keys.indexOf(key):false;
}
function getKeys(obj,index){
    var k=[];
    if(obj&&obj.length) $.each(obj,function(i,v){
        if(index){
            k.push(v[index]);
        }else{
            if(v.id) k.push(v.id);
            else if(v._id) k.push(v._id);
        }
    })
    return k;
}
global.dotGet=function(key,obj){
    var keys=key.split('.');
    var last=obj;
    for (var i = 0; i < keys.length; i++) {
        var tkey=keys[i];
        if(last){
            if(last[tkey]){
                last=last[tkey];
            }else{
                last=false;
            }
        }
    }
    return last;
}
global.getMatches=function(content){
    var regex=/\[.*?\]/g;
    var txt=content;
    var matches=txt.match(regex);
    return matches;
}
global.fixContent=function(content){
    var matches=global.getMatches(content);
    if(matches&&matches.length){
        for (var i = 0; i < matches.length; i++) {
            var match=matches[i];
            var lookfor=match.replace('[','').replace(']','');
            var transform='';
            if(lookfor){
                if(lookfor.indexOf('firstname')>=0){
                    lookfor=lookfor.replace('firstname','name');
                    transform='firstname';
                }
                var data=global.dotGet(lookfor,opts.vars);
                if(data){
                    //apply transforms!
                    if(transform=='firstname'){
                        data=global.toFirstName(data);
                    }
                    content=content.replace(match,data);
                }
            }
        }
    }
    return content;
}
global.getImg=function(obj,type){
    if(opts.vars&&opts.vars.nointernet) return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAMAAAAoyzS7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA2ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowNDgwMTE3NDA3MjA2ODExODcxRkM0QjZGODNDNTdCMiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpERkY3NzNEMjdFQTcxMUUxQjE1NkNGQTI0MjlCQUUwOSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpERkY3NzNEMTdFQTcxMUUxQjE1NkNGQTI0MjlCQUUwOSIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IE1hY2ludG9zaCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkM1Rjc4OTU0MjkyMDY4MTE4NzFGQzRBOUVCOEZBRDk0IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjA0ODAxMTc0MDcyMDY4MTE4NzFGQzRCNkY4M0M1N0IyIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+wgFJrQAAAAZQTFRF6+nkAAAApT0hTwAAAAxJREFUeNpiYAAIMAAAAgABT21Z4QAAAABJRU5ErkJggg==';
	var s3=opts.s3;
    var out='';
    if(typeof obj=='object'){
        if(!obj.path){
            out='';
        }else{
            if(type) out=s3+obj.path+'/'+type+'.'+obj.ext;
            else out=s3+obj.path+'/full.'+obj.ext;
        }
    }else{
        if(type=='folder'&&!obj&&obj!='undefined') out='';
        else if(obj&&obj.indexOf('http://')==-1&&obj.indexOf('https://')==-1&&obj.indexOf('www')==-1) out=s3+obj;
        else out=obj;
    }
    return out;
}
global.toFirstName=function(name){
    var np=name.split(' ');
    return np[0].charAt(0).toUpperCase() + np[0].slice(1);
}
var modules={};
modules.tools={
    getQsVars:function(url){//parseings
        var q=url.split('?');
        var queryString=q[1];
        if(!queryString) return {};
        var query = {};
        var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
        return query;
    },
    isQS:function(type){
        var opts=modules.tools.getQsVars(window.location.href);
        return opts[type];
    },
    getQsVar:function(url,item){
        if(!url) url=window.location.href;
        var opts=modules.tools.getQsVars(window.location.href);
        if(opts[item]) return opts[item];
        return false;
    },
    getByKey:function(list,value,index){
        var keys=modules.tools.getKeys(list,index);
        return list[keys.indexOf(value)];},
    getIndexByKey:function(list,key,index){
        var keys=modules.tools.getKeys(list,index);
        return (keys.indexOf(key)!=-1)?keys.indexOf(key):false;},
    getKeys:function(obj,index){
        var k=[];
        if(obj&&obj.length) $.each(obj,function(i,v){
            if(index){
                k.push(v[index]);
            }else{
                if(v.id) k.push(v.id);
                else if(v._id) k.push(v._id);
            }
        })
        return k;
    }
}
global.receipt={
    getSavings:function(){
        var info=global.receipt.getPlanInfo();
        var receipt={};
        receipt.accounts=global.receipt.getAccounts();
        var active=0;
        if(info.active){
            receipt.accounts[0].active=true;//peronsal
            if(!info.lifetime) active++;
        }
        if(info.pages&&info.pages.length){
            $.each(info.pages,function(i,v){
                var ind=modules.tools.getIndexByKey(receipt.accounts,v,'id');
                receipt.accounts[ind].active=true;
                if(!receipt.accounts[ind].lifetime) active++;
            })
        }
        return (active*10);
    },
    getPlan:function(){
        var self=this;
        return self.resp.data.plan_info;
    },
    getPlanInfo:function(){
        var self=this;
        return self.resp.data.status;
    },
    getAccounts:function(){
        var self=this;
        return self.resp.data.accounts;
    },
    get2:function(resp){
        var self=this;
        self.payload={};//not needed but keeps code the same
        self.resp={
            data:resp
        };
        var receipt={};
        receipt.type=self.resp.data.status.cycle;
        var app=global.receipt;
        receipt.accounts=app.getAccounts();
        //add in current subscription
        //add current information
        var planinfo=app.getPlanInfo();
        var dayThreshold=26;//special logic
        if(planinfo.active){
            if(planinfo.trial){
                var tendays=(60*60*24*dayThreshold);//give a larger threshold to ensure because their membership may not be aligned with invoice time..
                var cuspcheck=self.resp.now+tendays;
                //determine if it is about to become active and if we have their card on file
                if(planinfo.freeUntil<cuspcheck&&planinfo.freeUntil>self.resp.now){//about to charge!
                    receipt.starting=true;
                    if(planinfo.trial) planinfo.trial=false;
                    receipt.hasCard=(self.resp.subscription_info&&self.resp.subscription_info.plan.amount==0)?0:1;//if a plan has a cost it has to have had a card to start
                    receipt.accounts[0].active=true;//peronsal
                }else if(planinfo.freeUntil<self.resp.now){
                    receipt.overdue=true;
                    receipt.accounts[0].active=true;//peronsal
                }else{
                    receipt.starting=false;
                }
            }else if(planinfo.prepaid){
                var tendays=(60*60*24*dayThreshold);
                var cuspcheck=self.resp.now+tendays;
                //determine if it is about to become active and if we have their card on file
                if(planinfo.freeUntil<cuspcheck&&planinfo.freeUntil>self.resp.now){//about to charge!
                    receipt.starting=true;
                    receipt.hasCard=0;//if a plan has a cost it has to have had a card to start
                    receipt.accounts[0].active=true;//peronsal
                }else if(planinfo.freeUntil<self.resp.now){
                    receipt.overdue=true;
                    receipt.accounts[0].active=true;//peronsal
                }else{
                    receipt.starting=false;
                }
            }else{
                receipt.hasCard=true;
                receipt.accounts[0].active=true;//peronsal
            }
        }
        ///should be same here below
        if(planinfo.active){
            receipt.accounts[0].active=true;//peronsal
        }
        if(planinfo.pages&&planinfo.pages.length){
            $.each(planinfo.pages,function(i,v){
                var ind=modules.tools.getIndexByKey(receipt.accounts,v,'id');
                receipt.accounts[ind].active=true;
            })
        }
        //make changes
        $.each(receipt.accounts,function(i,v){
            if(opts.add&&opts.add.id==v.id){
                receipt.accounts[i].active=true;
            }
            if(opts.remove&&opts.remove.id==v.id){
                receipt.accounts[i].active=false;
                receipt.accounts[i].stop=true;
            }
            if(app.resp.data.page_data&&app.resp.data.page_data[v.id]&&app.resp.data.page_data[v.id].stopped){
                receipt.accounts[i].stopped=true;
            }
        });
        receipt.total=0;
        var defaultCost=(receipt.type=='monthly')?5:50;
        $.each(receipt.accounts,function(i,v){
            if(v.active){
                if(v.lifetime){
                    receipt.accounts[i].cost=0;
                    receipt.accounts[i].lifetime=true;
                }else{
                    if(self.resp.data.plan_info.intro_special){
                        receipt.accounts[i].cost=self.resp.data.plan_info.price;
                        receipt.total+=self.resp.data.plan_info.price;
                    }else{
                        receipt.accounts[i].cost=defaultCost;
                        receipt.total+=defaultCost;
                    }
                }
            }else{
                receipt.accounts[i].trial=true;
            }
        })
        receipt.lifetime=planinfo.lifetime;
        if(!receipt.accounts[0].active){
            receipt.warning='will_remove_page_subscriptions';
            receipt.total=0;
            receipt.stop=true;
            if(receipt.type=='yearly'){
                receipt.refund=true;
                self.payload.refund=1;//cancel!
            }
            self.payload.cancel=1;//cancel!
        }
        if(opts.remove&&receipt.type=='yearly'){
            receipt.refund=true;
            self.payload.refund=1;//cancel!
        }
        if(app.resp.data.subscription_info&&app.resp.data.subscription_info.current_period_end&&!app.resp.data.subscription_info.canceled_at&&!planinfo.free){
            receipt.nextCycle=app.resp.data.subscription_info.current_period_end;
        }else{
            receipt.nextCycle=false;
        }
        receipt.plan=self.getPlan(receipt.type,receipt.accounts);
        self.payload.plan=receipt.plan;
        if(!self.payload.plan) self.payload.cancel=1;//cancel
        if(self.resp.data.plan_info.intro_special){
            receipt.special=true;
        }
        //console.log(receipt);
        return receipt;
    },
    get:function(resp){
        var self=this;
        self.resp={
            data:resp
        };
        var receipt={};
        if(self.resp.plan_data&&self.resp.plan_data.pollinator) receipt.pollinator=true;
        else receipt.pollinator=false;
        receipt.type=self.resp.data.status.cycle;
        receipt.accounts=global.receipt.getAccounts();
        //add in current subscription
        //add current information
        var planinfo=global.receipt.getPlanInfo();
        var dayThreshold=26;
        if(planinfo.active){
            if(planinfo.trial){
                var tendays=(60*60*24*dayThreshold);//give a larger threshold to ensure because their membership may not be aligned with invoice time..
                var cuspcheck=self.resp.data.now+tendays;
                //determine if it is about to become active and if we have their card on file
                if(planinfo.freeUntil<cuspcheck&&planinfo.freeUntil>self.resp.data.now){//about to charge!
                    receipt.starting=true;
                    if(planinfo.trial) planinfo.trial=false;
                    receipt.hasCard=(self.resp.data.subscription_info&&self.resp.data.subscription_info.plan.amount==0)?0:1;//if a plan has a cost it has to have had a card to start
                    receipt.accounts[0].active=true;//peronsal
                }else if(planinfo.freeUntil<self.resp.data.now){
                    receipt.overdue=true;
                    receipt.accounts[0].active=true;//peronsal
                }else{
                    receipt.starting=false;
                }
            }else if(planinfo.prepaid){
                var tendays=(60*60*24*dayThreshold);
                var cuspcheck=self.resp.data.now+tendays;
                //determine if it is about to become active and if we have their card on file
                if(planinfo.freeUntil<cuspcheck&&planinfo.freeUntil>self.resp.data.now){//about to charge!
                    receipt.starting=true;
                    receipt.hasCard=0;//if a plan has a cost it has to have had a card to start
                    receipt.accounts[0].active=true;//peronsal
                }else if(planinfo.freeUntil<self.resp.data.now){
                    receipt.overdue=true;
                    receipt.accounts[0].active=true;//peronsal
                }else{
                    receipt.starting=false;
                }
            }else{
                receipt.hasCard=true;
                receipt.accounts[0].active=true;//peronsal
            }
        }
        if(planinfo.pages&&planinfo.pages.length){
            $.each(planinfo.pages,function(i,v){
                var ind=getIndexByKey(receipt.accounts,v,'id');
                receipt.accounts[ind].active=true;
            })
        }
        //make changes
        $.each(receipt.accounts,function(i,v){
            if(self.resp.data.page_data&&self.resp.data.page_data[v.id]&&self.resp.data.page_data[v.id].stopped){
                receipt.accounts[i].stopped=true;
            }
        });
        receipt.total=0;
        var defaultCost=(receipt.type=='monthly')?5:50;
        $.each(receipt.accounts,function(i,v){
            if(v.active){
                if(!v.lifetime){
                     if(self.resp.data.plan_info.intro_special){
                        receipt.accounts[i].cost=self.resp.data.plan_info.price/100;
                        receipt.total+=self.resp.data.plan_info.price/100;
                    }else{
                        receipt.accounts[i].cost=defaultCost;
                        receipt.total+=defaultCost;
                    }
                }else{
                    receipt.accounts[i].cost=0;
                }
            }else{
                receipt.accounts[i].trial=true;
            }
        })
        // if(!receipt.accounts[0].active){
        //     receipt.warning='will_remove_page_subscriptions';
        //     receipt.total=0;
        //     receipt.stop=true;
        //     //self.payload.cancel=1;//cancel!
        // }
        // if(self.resp.data.subscription_info&&self.resp.data.subscription_info.current_period_end){
        //     receipt.nextCycle=self.resp.data.subscription_info.current_period_end;
        //     var tendays=(60*60*24*10);
        //     var tendaysfromnow=self.resp.data.now+tendays;
        //     if(self.resp.subscription_info.trial_end){
        //         if(tendaysfromnow>self.resp.data.subscription_info.trial_end){
        //             //about to become active
        //         }else{
        //             receipt.total=0;
        //             receipt.trial=true;
        //         }
        //     }else{

        //     }
        // }else{
        //     receipt.nextCycle=false;
        // }
        if(planinfo.prepaid){
            receipt.prepaid=true;
        }
        if(planinfo.lifetime){
            receipt.lifetime=true;
        }
        if(planinfo.overdue){
            receipt.overdue=1;
        }
        if(planinfo.trial&&!receipt.starting) receipt.trial=true;
        if(planinfo.freeUntil) receipt.freeUntil=planinfo.freeUntil;
        //console.log(receipt)
        //receipt.plan=self.getPlan(receipt.type,receipt.accounts);
        //self.payload.plan=receipt.plan;
        //if(!self.payload.plan) self.payload.cancel=1;//cancel
        //console.log(receipt);
        //console.log(planinfo)
        return receipt;
    }
}
Number.prototype.formatDate=String.prototype.formatDate=function(onlyrel){
    var st=this;
    var date=new Date(parseInt(st.toString()+'000',10));
    var year=date.getFullYear();
    var month=date.getMonth()+1;
    var day=date.getDate();
    return month+'/'+day+'/'+year;
}
Number.prototype.formatTime=String.prototype.formatTime=function(onlyrel){
    var st=this;
    if(st.length==13){
        st=parseInt(st,10);
        st=st/1000;
    }
    var ct=Math.floor(new Date().getTime()/1000);
    var td=ct-st;
    if(td>=0){
        var d=Math.floor((td/(3600*24)));
        var tr=td-(d*3600*24);
        var h=Math.floor((tr/3600));
        tr=td-(3600*h);
        var m=Math.floor((tr/60));
        var s=tr-(60*m);
        var tpl='';
        var lsd=(new Date(parseInt(st.toString()+'000')).toString().split(' '));
        var th=new Date(parseInt(st.toString()+'000')).getHours();
        var lst=lsd[4].split(':');
        var tp=' am';
        lst[0]=parseInt(th);
        if(lst[0]>=12){
            if(lst[0]>12) lst[0]=lst[0]-12;
            tp=' pm';
        }
        if(lst[0] ==0) lst[0]=12;
        var time=lst[0]+':'+lst[1]+tp;
        var rel='';
        if(d > 0){
            if(d==1) rel=d+' day ago';
            else rel=d+' days ago';
        }else if(h > 0){
            if(h==1) rel=h+' hour ago';
            else rel=h+' hours ago';
        }else{
            if(m==1) rel=m+' min ago';
            else if(m==0) rel='just now';
            else rel=m+' mins ago';
        }
        if(onlyrel) return rel;
        else return time+ ' ('+rel+')';
    }else{
        td=Math.abs(td);
        var d=Math.floor((td/(3600*24)));
        var tr=td-(d*3600*24);
        var h=Math.floor((tr/3600));
        tr=td-(3600*h);
        var m=Math.floor((tr/60));
        var s=tr-(60*m);
        var tpl='';
        var lsd=(new Date(parseInt(st.toString()+'000')).toString().split(' '));
        var th=new Date(parseInt(st.toString()+'000')).getHours();
        var lst=lsd[4].split(':');
        var tp=' am';
        lst[0]=parseInt(th);
        if(lst[0]>=12){
            if(lst[0]>12) lst[0]=lst[0]-12;
            tp=' pm';
        }
        if(lst[0] ==0) lst[0]=12;
        var time=lst[0]+':'+lst[1]+tp;
        var rel='';
        if(d > 0){
            if(d==1) rel='in '+d+' day';
            else rel='in '+d+' days';
        }else if(h > 0){
            if(h==1) rel='in '+h+' hour';
            else rel='in '+h+' hours';
        }else{
            if(m==1) rel='in '+ m+' min';
            else if(m==0) rel='Happening Now';
            else rel='in '+m+' mins';
        }
        if(onlyrel) return rel;
        else return time+ ' ('+rel+')';
    }
};
queue.drain = function() {
	loadTemplate(global.templatetext);
	//render!!!
    opts.vars.css={
        'btn':"text-decoration: none;display: inline-block;padding: 4px 10px 4px;margin-bottom: 0;font-size: 13px;line-height: 18px;color: #333333;text-align: center;text-shadow: 0 1px 1px rgba(255, 255, 255, 0.75);vertical-align: middle;background-color: #f5f5f5;background-image: -moz-linear-gradient(top, #ffffff, #e6e6e6);background-image: -ms-linear-gradient(top, #ffffff, #e6e6e6);background-image: -webkit-gradient(linear, 0 0, 0 100%, from(#ffffff), to(#e6e6e6));background-image: -webkit-linear-gradient(top, #ffffff, #e6e6e6);background-image: -o-linear-gradient(top, #ffffff, #e6e6e6);background-image: linear-gradient(top, #ffffff, #e6e6e6);background-repeat: repeat-x;filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#ffffff', endColorstr='#e6e6e6', GradientType=0);border-color: #e6e6e6 #e6e6e6 #bfbfbf;border-color: rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.25);filter: progid:DXImageTransform.Microsoft.gradient(enabled = false);border: 1px solid #ccc;border-bottom-color: #bbb;-webkit-border-radius: 4px;-moz-border-radius: 4px;border-radius: 4px;-webkit-box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05);-moz-box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05);box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05);cursor: pointer;",
        'btn-primary':"text-decoration: none;display: inline-block;padding: 4px 10px 4px;margin-bottom: 0;font-size: 13px;line-height: 18px;color: #333333;text-align: center;text-shadow: 0 1px 1px rgba(255, 255, 255, 0.75);vertical-align: middle;background-color: #f5f5f5;background-image: -moz-linear-gradient(top, #ffffff, #e6e6e6);background-image: -ms-linear-gradient(top, #ffffff, #e6e6e6);background-image: -webkit-gradient(linear, 0 0, 0 100%, from(#ffffff), to(#e6e6e6));background-image: -webkit-linear-gradient(top, #ffffff, #e6e6e6);background-image: -o-linear-gradient(top, #ffffff, #e6e6e6);background-image: linear-gradient(top, #ffffff, #e6e6e6);background-repeat: repeat-x;filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#ffffff', endColorstr='#e6e6e6', GradientType=0);border-color: #e6e6e6 #e6e6e6 #bfbfbf;border-color: rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.25);filter: progid:DXImageTransform.Microsoft.gradient(enabled = false);border: 1px solid #ccc;border-bottom-color: #bbb;-webkit-border-radius: 4px;-moz-border-radius: 4px;border-radius: 4px;-webkit-box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05);-moz-box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05);box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.05);cursor: pointer;text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.25);color: #ffffff; background-color: #006dcc;background-image: -moz-linear-gradient(top, #0088cc, #0044cc);background-image: -ms-linear-gradient(top, #0088cc, #0044cc);background-image: -webkit-gradient(linear, 0 0, 0 100%, from(#0088cc), to(#0044cc));background-image: -webkit-linear-gradient(top, #0088cc, #0044cc);background-image: -o-linear-gradient(top, #0088cc, #0044cc);background-image: linear-gradient(top, #0088cc, #0044cc);background-repeat: repeat-x;filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#0088cc', endColorstr='#0044cc', GradientType=0);border-color: #0044cc #0044cc #002a80;border-color: rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.25);filter: progid:DXImageTransform.Microsoft.gradient(enabled = false);",
        's-corner-all':"-moz-border-radius-topleft: 7px !important; -webkit-border-top-left-radius: 7px !important; -khtml-border-top-left-radius: 7px !important; border-top-left-radius: 7px !important;-moz-border-radius-topright: 7px !important; -webkit-border-top-right-radius: 7px !important; -khtml-border-top-right-radius: 7px !important; border-top-right-radius: 7px !important;-moz-border-radius-bottomleft: 7px !important; -webkit-border-bottom-left-radius: 7px !important; -khtml-border-bottom-left-radius: 7px !important; border-bottom-left-radius: 7px !important;-moz-border-radius-bottomright: 7px !important; -webkit-border-bottom-right-radius: 7px !important; -khtml-border-bottom-right-radius: 7px !important; border-bottom-right-radius: 7px !important;",
        'l-corner-all':"-moz-border-radius-topleft: 15px !important; -webkit-border-top-left-radius: 15px !important; -khtml-border-top-left-radius: 15px !important; border-top-left-radius: 15px !important;-moz-border-radius-topright: 15px !important; -webkit-border-top-right-radius: 15px !important; -khtml-border-top-right-radius: 15px !important; border-top-right-radius: 15px !important;-moz-border-radius-bottomleft: 15px !important; -webkit-border-bottom-left-radius: 15px !important; -khtml-border-bottom-left-radius: 15px !important; border-bottom-left-radius: 15px !important;-moz-border-radius-bottomright: 15px !important; -webkit-border-bottom-right-radius: 15px !important; -khtml-border-bottom-right-radius: 15px !important; border-bottom-right-radius: 15px !important;",
        'm-corner-all':"-moz-border-radius-topleft: 11px !important; -webkit-border-top-left-radius: 11px !important; -khtml-border-top-left-radius: 11px !important; border-top-left-radius: 11px !important;-moz-border-radius-topright: 11px !important; -webkit-border-top-right-radius: 11px !important; -khtml-border-top-right-radius: 11px !important; border-top-right-radius: 11px !important;-moz-border-radius-bottomleft: 11px !important; -webkit-border-bottom-left-radius: 11px !important; -khtml-border-bottom-left-radius: 11px !important; border-bottom-left-radius: 11px !important;-moz-border-radius-bottomright: 11px !important; -webkit-border-bottom-right-radius: 11px !important; -khtml-border-bottom-right-radius: 11px !important; border-bottom-right-radius: 11px !important;",
        'l-corner-top':"-moz-border-radius-topleft: 15px !important; -webkit-border-top-left-radius: 15px !important; -khtml-border-top-left-radius: 15px !important; border-top-left-radius: 15px !important;-moz-border-radius-topright: 15px !important; -webkit-border-top-right-radius: 15px !important; -khtml-border-top-right-radius: 15px !important; border-top-right-radius: 15px !important;",
        'l-corner-bottom':"-moz-border-radius-bottomleft: 15px !important; -webkit-border-bottom-left-radius: 15px !important; -khtml-border-bottom-left-radius: 15px !important; border-bottom-left-radius: 15px !important;-moz-border-radius-bottomright: 15px !important; -webkit-border-bottom-right-radius: 15px !important; -khtml-border-bottom-right-radius: 15px !important; border-bottom-right-radius: 15px !important;",
        'bluebtn':'background:#243E7D;padding:5px 10px;margin:15px 0px;display:inline-block;color:white;text-align:center;',
        'pinkbtn':'background:#f09;padding:5px 10px;margin:15px 0px;display:inline-block;color:white;text-align:center;',
        'bluecolor':"color:#243E7D;",
        'pinkcolor':"color:#f09;",
        "a":"text-decoration: none;color:#0193be;"
    }
	if(opts.container&&global.templates[opts.container]){
        $ = cheerio.load(global.templates[opts.container](opts.vars));
        if(opts.vars&&opts.vars.embed) for (var item in opts.vars.embed) {
            //console.log(opts.vars.embed[item])
            if(opts.vars.embed[item]){
                $('#'+item).html(opts.vars.embed[item]);
                $('#'+item).css('display','block')
            }
        };
		console.log($.html());
	}else{
		console.log('no container');
	}
	process.exit(0);
}
function getTemplate(file,fin){
	fs.readFile(file, 'utf8', function (err,data) {
	  if (err) {
	  	console.log(err)
	   	process.exit(0);
	  }
	  global.templatetext+=data;
	  fin();
	});
}
function loadTemplate(templs){
	var templates={};
	if(templs){
    	var tpls=templs.split('@@@');
        var cn='';
        for (var i = 1; i <= tpls.length-1; i++) {
            if(i>0){
                if(i%2==1){ //name
                    cn=tpls[i];
                }else{
                    global.templates[cn]=ejs.compile(tpls[i])//new EJS({text:tpls[i]});
                }
            }
        };
    }
	   
}
//load template files
if(opts.templatefiles) for (var i = 0; i < opts.templatefiles.length; i++) {
	var tf=opts.templatefiles[i];
	queue.push({
		file:tf
	})
};