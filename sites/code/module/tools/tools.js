/** SHORT NAMESPACE HELPERS  **/
/**
* METHOD df
* @version: 1.3
* Deep Object Fetcher/Tester
*
* This function safely checks to make sure that a namespace exists within an object and returns it
* Use instead when attempting to access deeply spaced variables that may or may not exist.
* Pass object and a string dot notated namespace
*
* Example:
*
*        app.doFunction(df(summaryData,'visitors.graphs.active',{}));
*
*   or with [] like this
*
*       df(obj,"myvar[1].k");
*
* WARNING:  more than one [] in a row is not currently suppored.  e.g. stats["+kind+"]["+elem_id+"]["+field+"] will only get stats[kind].
*
* @param multi tobj - associatve array object to test
* @param namespace - string with dot notation to test. 
* @param default - default value to return if there is nothing at this location.
* @return false, or the object value at this namespace if one exists
*
*/
window.df=function(tobj,namespace,def){ 
    if(typeof namespace==='undefined') return (typeof tobj !== 'undefined') ? tobj : (typeof def!=='undefined'?def:false);
    namespace = namespace.split('.')
    var cKey = namespace.shift();

    function get(pObj, pKey) {
        var bracketStart, bracketEnd, o;
        if (typeof(pObj) === 'undefined' || pObj===null || pObj===false ) {
            return typeof def!=='undefined'?def:false;
        }
        bracketStart = pKey.indexOf("[");
        if (bracketStart > -1) { //check for nested arrays
            bracketEnd = pKey.indexOf("]");
            var arrIndex = pKey.substr(bracketStart + 1, bracketEnd - bracketStart - 1);
            pKey = pKey.substr(0, bracketStart);
            var n = pObj[pKey];
            o = n? n[arrIndex] : undefined;
        } else {
            o = pObj[pKey];
        }
        return o;
    }

    var obj = get(tobj, cKey);
    while (typeof obj!== 'undefined' && namespace.length) {
        obj = get(obj, namespace.shift());
    }
    return (typeof obj !== 'undefined') ? obj : (typeof def!=='undefined'?def:false);
};
/**
* METHOD ds
* @version: 1.0
* Deep Object Setter
*
* This function safely checks to make sure that a namespace exists within an object before setting it.
* Use instead when attempting to access deeply spaced variables that may or may not exist.
* Pass object and a string dot notated namespace
*
* Example:
*
*  ds(summaryData,'visitors.graphs.active.count',101)); 
*
*   or with [] like this
*
*       ds(obj,"myvar[1].k",102);
*
* WARNING:  more than one [] in a row is not currently suppored.  e.g. stats["+kind+"]["+elem_id+"]["+field+"] will only get stats[kind].
*
* @param multi tobj - associatve array object to test
* @param namespace - string with dot notation to test. 
* @param value - value to set
* @return multi obj - last parent object (element below where value is being set)
*
*/
window.ds=function(tobj,namespace,val){ 
    var i;
    //var existed=df(tobj,namespace,'~-99~');
    namespace = namespace.split('.');
    var cobj=tobj;
    for (i = 0; i <= namespace.length - 1; i++){
        if(namespace[i+1]){
            if(!cobj[namespace[i]]){
                cobj[namespace[i]]={}
            }
            cobj=cobj[namespace[i]]
        }else{
            cobj[namespace[i]] = val;
        }
    }
    return tobj;
};
window._=modules.tools={
    version:2,
    dotGet:function(key,obj){
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
        //if(!last) last='';
        return last;
    },
    intersect:function(arr1,arr2){
        return arr1.filter(function(n) {
            return arr2.indexOf(n) !== -1;
        })
    },
    setInterval:function(id,func,ts){
        modules.tools.intervals[id]=setInterval(func,ts);
    },
    clearIntervals:function(){
        $.each(modules.tools.intervals,function(i,v){
            clearInterval(v);
        })
    },
    ids:[],
    scrollers:{

    },
    log:function(msg,type){
        if(type){
            switch(type){
                case 'navigation':
                    var s='background:purple;color:white';
                break;
                case 'socket':
                    var s='background:green;color:white';
                break;
                case 'time':
                case 'cookie':
                    var s='background:#f02;color:white';
                break;
                case 'stats':
                    var s='background:orange;color:white';
                break;
                case 'file':
                    var s='background:blue;color:white';
                break;
                case 'keyboard':
                    var s='background:aqua;color:white';
                break;
                default:
                    var s='background:black;color:white';
                break;
            }
            console.log('%c'+msg,s);
        }else{
            console.log('%ctest','background:black;color:white')
        }
    },
    getUniqueId:function(){
        var id=Math.uuid(6);
        if(modules.tools.ids.indexOf(id)>=0) return modules.tools.getUniqueId();
        return id;
    },
    loadScrollCache:function(){
        console.log('load',localStorage.getObject('tools.scrollers'))
        this.scrollers=localStorage.getObject('tools.scrollers');
    },
    cacheScrollPosition:function(key,ele,get){
        if(!get){
            if(!this.scrollers) this.scrollers={};
            if(ele=='document'){
                this.scrollers[key]=document.documentElement.scrollTop;
            }else{
                this.scrollers[key]=ele.scrollTop();
            }
        }
        if(!this.scrollers[key]){
            this.scrollers[key]=0;//init to 0
        }
        console.log(this.scrollers);
        localStorage.setObject('tools.scrollers',this.scrollers);
        return this.scrollers[key];
    },
    getScrollPosition:function(){

    },
    size:function(obj){
        if(typeof(obj) =='object'){
            if(Object.keys(obj).length) return Object.keys(obj).length;
            else return 0;
        }else if(typeof(obj) == 'array'){
            if(obj.length) return obj.length;
            else return 0;
        }else{
            return 0;
        }
    },
    intervals:{},
    timers:{},
    isWebLayout:function(){
        if(isPhoneGap()) return false;
        if($('body').width()>=802) return true;
        return false;
    },
    setFaviconCount:function(count,flash) {
        var self=this;
        if(self.fto) clearTimeout(self.fto);
        if(count!=0){
            self.fto=setTimeout(function(){
                self.setFaviconCount(0,1);
            },2000);
        }
        if(flash&&self.badgeCount){
            self.fto=setTimeout(function(){
                self.setFaviconCount(self.badgeCount,1);
            },3000);
        }
        if(!flash){
            self.badgeCount=count;
        }
        var link = document.createElement('link'),
         oldLink = document.getElementById('dynamic-favicon');
         link.id = 'dynamic-favicon';
         link.rel = 'shortcut icon';
         var src=app.imgurl+'/favicon/'+count
         src+='?nocache=1';
         link.href = src;
         if (oldLink) {
          document.head.removeChild(oldLink);
         }
         document.head.appendChild(link);
    },
    touchEvent:{
        getCoords:function(e){
            if(e.originalEvent.touches){//mobile
                var ev=e.originalEvent.touches[0];
                return {
                    clientY:ev.clientY,
                    clientX:ev.clientX
                };
            }else{//web
                return {
                    clientY:e.clientY,
                    clientX:e.clientX
                };
            }
        },
        getInfo:function(c1,c2){
            var dy=Math.abs(c2.clientY-c1.clientY);
            var dx=Math.abs(c2.clientX-c1.clientX);
            var dist=Math.sqrt((dy*dy+dx*dx));
            return {
                dir:(dy>dx)?'scroll':'swipe',
                dy:(c2.clientY-c1.clientY),
                dx:(c2.clientX-c1.clientX),
                dist:dist
            }
        }
    },
    trimContent:function(text,length){
        if(text.indexOf('</p>')>=0){
           text=text.replace(/(<([^>]+)>)/gi, "");
        }
        return text.limitlength(length)
    },
    getObjectDiff:function(obj1,obj2){
        var diff={};
        if(_.size(obj1)) for(var key in obj1){
            if(obj2[key]){//check changes
                if(JSON.stringify(obj2[key])!=JSON.stringify(obj1[key])){
                    diff[key]={
                        type:'change',
                        from:obj1[key],
                        to:obj2[key]
                    }
                }
            }else{
                diff[key]={
                    type:'remove'
                }
            }
        }
        if(_.size(obj1)) for(var key in obj1){//check for additions
            if(!obj1[key]){
                diff[key]={
                    type:'add'
                }
            }
        }
        return diff;
    },
    getTimeZone:function(){
        if(window.Intl&&Intl.DateTimeFormat&&Intl.DateTimeFormat().resolvedOptions&&Intl.DateTimeFormat().resolvedOptions().timeZone){
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        }else{
            onerror('Timezone not found!?!');
            return 'America/Denver'
        }
    },
    fixContent:function(text,opts){
        if(!opts) opts={};
        if(!text) return '';
        if(opts.stripHtml) return $('<p>'+text+'</p>').text();
        if(text.indexOf('</p>')>=0||opts.redactor){
            text=text.replace('>http','> http');//ensure that there is a space between
            var text=$('<div>'+text+'</div>');//anchors should already be wrapped!
            if(opts.fontColor){
                text.find('ul,li,div').css('color',opts.fontColor);
            }
            if(opts.fontSize){
                text.find('ul,li,div').css('font-size',opts.fontSize);
            }
            if(!opts.classes) opts.classes='';
            if(!opts.maxlength) opts.maxlength=30;
            if(text.find('a').length) $.each(text.find('a'),function(i,v){
                var e=$(v);
                var src=e.attr('href');
                if(src){
                    if(src.indexOf('mailto:')>=0){
                        var srctext=src.replace('mailto:','').limitlength(opts.maxlength)
                    }else{
                        var srctext=src.replace('www.','').limitlength(opts.maxlength);
                    }
                    e.replaceWith('<span class="'+opts.classes+' linknav" data-type="external" data-intent="'+src+'" link="'+src+'">'+e.html()+'</span>')
                }
            });
            if(text.find('iframe').length) $.each(text.find('iframe'),function(i,v){
                var e=$(v);
                var src=e.attr('src');
                if(src.indexOf('//')===0){
                    e.attr('src','https:'+src);
                }
            });
            if(opts.truncate){
                var t=text.html();
                t=_.trimContent(t,opts.truncate);
            }else{
                var t=text.html();
            }
            return t;//dealing with redactor content. already rich
        }
        if(!text) return '';
        text=text.replace('>http','> http');//ensure that there is a space between
        var text=$('<div>'+anchorme(text,{
            exclude: function(urlObj){
                urlObj.encoded = urlObj.encoded.replace(/%25/g, '%');
                return false;
              }
        })+'</div>');
        if(!opts.classes) opts.classes='';
        if(!opts.maxlength) opts.maxlength=30;
        if(text.find('a').length) $.each(text.find('a'),function(i,v){
            var e=$(v);
            var src=e.attr('href');
            if(src.indexOf('mailto:')>=0){
                var srctext=src.replace('mailto:','').limitlength(opts.maxlength)
            }else{
                var srctext=src.replace('www.','').limitlength(opts.maxlength);
            }
            e.replaceWith('<span class="'+opts.classes+' linknav" data-type="external" data-intent="'+src+'" link="'+src+'">'+srctext+'</span>')
        });
        var t=text.html();
        //if(opts.addSpacing){
        t=t.replace(/(\r\n|\n\r|\r|\n)/g, '<br/><div style="height:5px"></div>');
        //}
        return t.trim();
    },
    location:{
        start:function(){
            var self=this;
            self.loadIpLocation();
        },
        data:{
            ip:false,
            geo:false
        },
        getName:function(data,type){
            var s='';
            if(!data) return false;
            data.info=modules.geocode.getText(data);
            switch(type){
                case 'simple'://general
                    s=data.place_name;
                break;
                case 'city_simple':
                    if(data.info.text) s+=data.info.text;
                break;
                case 'city':
                    if(data.info.text) s+=data.info.text;
                    if(data.info.region) s+=', '+data.info.region;
                    else if(data.info.country) s+=', '+data.info.country;
                break;
                case 'city_full':
                    if(data.info.text) s+=data.info.text;
                    if(data.info.region) s+=', '+data.info.region;
                    if(data.info.country) s+=', '+data.info.country;
                break;
                default:
                    s=data.info.text;
                break;
            }
            return s;
        },
        getNearestLocation:function(){
            var self=this;
            if(self.data.geo) return self.data.geo;//best
            if(self.data.ip) return self.data.ip;//second best
            //return user city preference?
            return false;
        },
        init:function(retry){
            var self=this;
            if(self.initd){
                console.trace();
                return false;
            } 
            if(isPhoneGap()){
                self.get(function(data){
                    self.data.geo=data;
                    self.initd=true;
                    //console.log('===>initial location set');
                },function(){
                    setTimeout(function(){
                        self.init(1);//keep on trying
                    },10000)
                })
            }
        },
        loadIpLocation:function(){
            var self=this;
            modules.api({
                url:app.site_apiurl+'/iplocation',
                data:{},
                success:function(resp){
                    if(resp.success){
                        self.data.ip=resp.data;
                    }else{
                        console.warn('error loading iplocation information');
                    }
                }
            });
        },
        get:function(cb,fcb){
            var self=this;
            if(self.locating){
                return false;
            }else{
                self.locating=true;
                self.locate(function(pos,err){
                    if(pos){
                        self.current=pos;
                        cb(self.current);
                    }else{
                       fcb();
                    }
                    self.locating=false;
                })
            }
        },
        locate:function(cb){
            var self=this;
            if(navigator.geolocation){
                self.nto=setTimeout(function(){
                    if(!self.geoloaded){
                       cb(false,'We could not find your location');
                    }
                },5000);
                self.geoloaded=0;
                navigator.geolocation.getCurrentPosition(function(position){
                    //override
                    if(self.nto) clearTimeout(self.nto);
                    self.geoloaded=1;
                    if(position.coords){
                        if(position.coords.accuracy < 1000){
                            app.currentLocation={lat:position.coords.latitude,lng:position.coords.longitude};
                            return cb({lat:position.coords.latitude,lng:position.coords.longitude})
                        }
                    }
                    return cb(false,'We could not find your location');
                });
            }else{
                cb(false,'We could not find your location');
            }
        }
    },
    deepCompare:function(){
        var i, l, leftChain, rightChain;

        function compare2Objects (x, y) {
            var p;

            // remember that NaN === NaN returns false
            // and isNaN(undefined) returns true
            if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
                 return true;
            }

            // Compare primitives and functions.     
            // Check if both arguments link to the same object.
            // Especially useful on the step where we compare prototype
            if (x === y) {
                return true;
            }

            // Works in case when functions are created in constructor.
            // Comparing dates is a common scenario. Another built-ins?
            // We can even handle functions passed across iframes
            if ((typeof x === 'function' && typeof y === 'function') ||
               (x instanceof Date && y instanceof Date) ||
               (x instanceof RegExp && y instanceof RegExp) ||
               (x instanceof String && y instanceof String) ||
               (x instanceof Number && y instanceof Number)) {
                return x.toString() === y.toString();
            }

            // At last checking prototypes as good as we can
            if (!(x instanceof Object && y instanceof Object)) {
                return false;
            }

            if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
                return false;
            }

            if (x.constructor !== y.constructor) {
                return false;
            }

            if (x.prototype !== y.prototype) {
                return false;
            }

            // Check for infinitive linking loops
            if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
                 return false;
            }

            // Quick checking of one object being a subset of another.
            // todo: cache the structure of arguments[0] for performance
            for (p in y) {
                if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                    return false;
                }
                else if (typeof y[p] !== typeof x[p]) {
                    return false;
                }
            }

            for (p in x) {
                if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                    return false;
                }
                else if (typeof y[p] !== typeof x[p]) {
                    return false;
                }

                switch (typeof (x[p])) {
                    case 'object':
                    case 'function':

                        leftChain.push(x);
                        rightChain.push(y);

                        if (!compare2Objects (x[p], y[p])) {
                            return false;
                        }

                        leftChain.pop();
                        rightChain.pop();
                        break;

                    default:
                        if (x[p] !== y[p]) {
                            return false;
                        }
                        break;
                }
            }

            return true;
        }

        if (arguments.length < 1) {
            return true; //Die silently? Don't know how to handle such case, please help...
            // throw "Need two or more arguments to compare";
        }

        for (i = 1, l = arguments.length; i < l; i++) {

              leftChain = []; //Todo: this can be cached
              rightChain = [];

              if (!compare2Objects(arguments[0], arguments[i])) {
                  return false;
              }
        }

        return true;
    },
    kGetSort:function(obj,count){
        return Object.keys(obj).sort();
    },
    arsort:function(obj,id){
        obj.sort(function(a, b){
            return (a.sort > b.sort) ? -1 : 1
        });
        var ret=[];
        $.each(obj,function(i,v){
            ret.push(v[id]);
        })
        return ret;
    },
    ksort:function(obj){
      var keys = Object.keys(obj).sort()
        , sortedObj = {};
      for(var i in keys) {
        sortedObj[keys[i]] = obj[keys[i]];
      }
      return sortedObj;
    },
    keepFields:function(obj,fields){
        var out={};
        $.each(obj,function(i,v){
            if(fields.indexOf(i)>=0){
                out[i]=v;
            }
        })
        return out;
    },
    audioContext:{
        current:false,
        get:function(){
            var self=this;
            if (app.device=='iOS') {
                // Safari 11 or newer automatically suspends new AudioContext's that aren't
                // created in response to a user-gesture, like a click or tap, so create one
                // here (inc. the script processor)
                return self.current
            }else{
                return false;
            }
        }, 
        release:function(){
            var self=this;
            if(self.current) self.current.close();
        },
        set:function(){
            var self=this;
            if (app.device=='iOS') {
                if(self.current) self.current.close();
                // Safari 11 or newer automatically suspends new AudioContext's that aren't
                // created in response to a user-gesture, like a click or tap, so create one
                // here (inc. the script processor)
                var AudioContext =window.AudioContext || window.webkitAudioContext;
                self.current = new AudioContext();
            }else{
            }
        }
    },  
    getInjectCode:function(functionname,wrapfunctionname,browserapi){
        if(typeof functionname=='string'){
            var code=self[functionname].toString();
        }else{
            var code=functionname.toString();
        }
        if(wrapfunctionname){
            var splitcode=code.split('\n');
            splitcode[0]=splitcode[0].replace('function(','window.'+wrapfunctionname+'=function(').replace('function (','window.'+wrapfunctionname+'=function(');
        }else{
            var splitcode=code.split('\n');
            delete splitcode[0];
            delete splitcode[splitcode.length-1];
        }
        if(browserapi){//add extra data
            splitcode.push('window.oneBrowser.data='+JSON.stringify({
                sapiurl:app.sapiurl,
                appid:app.appid,
                token:app.user.token
            }));
        }
        var returncode=splitcode.join('\n');
        // if(wrapfunctionname){
        //  returncode='function '+wrapfunctionname+'()'
        // }
        return returncode;//ensures one line and no issues with colons
        // console.log(splitcode)
        // code=code.replace('function(){','')
        // code=code.replace('function() {','')
        // code=code.substring(0,code.length-2);
        // return code;
    },
    ensureAndroidPerms:function(types,cb,iteration){
        if(!iteration) iteration=0;
        if(window.cordova&&cordova.plugins&&cordova.plugins.permissions&&app.device=='Android'){
            var permissions = cordova.plugins.permissions;
            if(types[iteration]){
                permissions.checkPermission(permissions[types[iteration]], function(status){
                    if(status.hasPermission){
                        iteration++;
                        _.ensureAndroidPerms(types,cb,iteration)
                    }else{
                        permissions.requestPermission(permissions[types[iteration]], function(status){
                            //_alert(JSON.stringify(status))
                            if(!status.hasPermission){
                                _alert('Error Setting Permission ['+types[iteration]+'] [1].')
                            }else{
                                iteration++;
                                _.ensureAndroidPerms(types,cb,iteration)
                            }
                        }, function(){
                            _alert('Error Setting Permission ['+types[iteration]+'] [2].')
                        })
                    }
                }, function(){
                    _alert('Error Setting Permission ['+types[iteration]+'] [3].')
                });
            }else{
                cb();
            }
        }else return cb();
    },
    openLink:function(e,events,skip){
        //alert('open: '+JSON.stringify(e))
        var isevent=false;
        if(e.reload){
            //app.onstatechange(false,true);//just trigger and allow reload
            return false;
        }
        if(!e.intent&&!e.length){
            if($(this).attr('href')){
                var o={
                    intent:$(this).attr('href'),
                    type:'external'
                }
            }else{
                var o={
                    intent:$(this).attr('data-intent'),
                    type:$(this).attr('data-type'),
                    opts:$(this).attr('data-opts'),
                    title:$(this).attr('data-title')
                }
            }
            isevent=true;
        }else if(!e.length) o=e;
        else {
            var o={
                intent:e.attr('data-intent'),
                type:e.attr('data-type'),
                opts:e.attr('data-opts'),
                title:e.attr('data-title')
            }
        }
        if(o.intent.indexOf('http')>=0){
            o.original=_.unwrapExternalLink(o.intent);
        }
        if((o.intent.indexOf('https://')===0||o.intent.indexOf('http://')===0)&&!o.type) o.type='external';
        if(o.original&&o.original.indexOf('https://venmo.com/code')===0) o.type='self';
        if(!o.intent) return false;
        if(!skip&&(o.intent.indexOf(app.siteurl)>=0||o.intent.indexOf('https://app.oneboulder.one')>=0)){
            if(app.history){
                if(o.intent.indexOf(app.siteurl)>=0){
                    var parts=o.intent.split(app.siteurl);
                }else if(o.intent.indexOf('https://app.oneboulder.one')>=0){
                    var parts=o.intent.split('https://app.oneboulder.one');
                }
                //try to route internally!
                app.history.go(parts[1],function(){
                    _.openLink(e,events,1);
                })
                return false;
            }
        }
        if(o.type=='self'){
            if(isPhoneGap()){
                if(cordova.InAppBrowser){
                    var ref=cordova.InAppBrowser.open(o.intent,'_system');
                    //add listeners!
                }else{
                    onerror('InAppBrowser not installed')
                    window.open(o.intent,'_self')
                }
            }else window.open(o.intent,'_self')
        }else if(o.type=='inappbrowser'){
            if(!cordova.InAppBrowser){
                _alert('In App Browser Not Installed. This action can not be completed.')
                return false;
            }
            var opts='location=no,toolbarcolor=#FFFFFF,toolbarposition=top,hidespinner=no';
            if(app.device=='Android'){
                opts='location=no,toolbarcolor=#FFFFFF';
            }
            //var opts='location=no,toolbarposition=top'
            var ref=cordova.InAppBrowser.open(o.intent,'_blank',opts);
            ref.addEventListener('loadstop', function(params) {
                if(e.injectBrowser){
                    ref.executeScript({
                        code:_.getInjectCode(modules.oneBrowser)
                    }, function(){});
                }
                if(events&&events.load){
                    $.each(events.load,function(i,v){
                        v(params,ref);
                    })
                }
                //onerror('loadstop: '+params.url)
            });
            ref.addEventListener('message', function(params) {
                if(events.onMessage) events.onMessage(params);
            })
        }else if(o.type=='external'||(o.type=='inappbrowser'&&isPhoneGap())){
            if(isPhoneGap()){
                if(o.intent.indexOf('mailto:')>=0){
                    var link=o.intent.replace('mailto:','');
                    //try to get subject
                    linkinfo=link.split('?');
                    var to=linkinfo[0];
                    var qs=modules.tools.getqs(o.intent);
                    var subject='';
                    if(qs&&qs['subject']) subject=qs['subject'];
                    _.sendEmail({
                        to:[to],
                        subject:subject
                    })
                }else{
                    //hide Status Bar
                    //var color=app.themeColor;
                    // var tc=new tinycolor(app.themeColor);
                    // var color=tc.darken(5).toString();
                    //iterate over events and "register"
                    if(!events) events={};
                    events=Object.assign({},{
                        opened:[],
                        load:[],
                        closed:[]
                    },events);
                    events.closed.push(function(){
                        setTimeout(function(){
                            if(app.device=='iOS'){
                                _.openLink({
                                    intent:'https://app.oneboulder.one/blank.html',
                                    hidden:true
                                })
                            }
                        },50);
                        phone.statusBar.set();//back to deafult
                    })
                    if(e.authCallback){
                        app.applinkreturn=function(t){
                            phone.statusBar.set();//back to default theme
                            e.authCallback(t);
                        }
                    }
                    var opts={}
                    //if(color.indexOf('#')!==0) color='#'+color;
                    var color='#FFFFFF';
                    if(app.device=='iOS'){
                        opts={
                            url: o.intent,
                            hidden: false, // default false. You can use this to load cookies etc in the background (see issue #1 for details).
                            animated: true, // default true, note that 'hide' will reuse this preference (the 'Done' button will always animate though)
                            transition: 'slide', // (this only works in iOS 9.1/9.2 and lower) unless animated is false you can choose from: curl, flip, fade, slide (default)
                            enterReaderModeIfAvailable: false, // default false
                           // tintColor: color, // default is ios blue
                            barColor: color, // on iOS 10+ you can change the background color as well
                            controlTintColor: "#000000" // on iOS 10+ you can override the default tintColor
                          }
                    }
                    if(o.hidden) opts.hidden=true;
                    if(app.device=='Android'){
                        opts={
                            url:o.intent,
                            toolbarColor:color,
                            animated:false
                        }
                    }
                    //if(!o.hidden) phone.statusBar.set('light');
                    if(!o.hidden) app.browserShowing=true;
                    SafariViewController.show(opts,
                      // this success handler will be invoked for the lifecycle events 'opened', 'loaded' and 'closed'
                      function(result) {
                        //onerror('event:'+result.event)
                        if (result.event == 'opened') {
                            if(events.opened.length){
                              $.each(events.opened,function(i,v){
                                v(result);
                              })
                            }
                        } else if (result.event == 'loaded') {
                            if(events.load.length){
                              $.each(events.load,function(i,v){
                                v(result);
                              })
                            }
                        } else if (result.event == 'closed') {
                            app.browserShowing=false;
                            if(events.closed.length){
                              $.each(events.closed,function(i,v){
                                v(result);
                              });
                              //set to blank page to clear out any
                              // app.openLink({
                              //   intent:'https://google.com'
                              // })
                          }
                        }
                      },
                      function(msg) {
                        app.browserShowing=false;
                        //try again but force inappbrowser?!?!
                        _.openLink({
                            intent:o.intent,
                            type:'inappbrowser'
                        })
                        //_alert(JSON.stringify(msg))
                      })
                }
            }else{
                window.open(o.intent,'_blank');
            }
        }else{//internal
            if(app.history) app.history.go(o.intent)
            else console.warn('history not enabled');
        }
    },
    getIntent:function(data){
        if(data.id){
            switch(data.id[0]){
                case 'U':
                    return '/profile/'+data.id;
                break;
                default:
                    return '/page/'+data.id;
                break;
            }
        }
        return '';
    },
    fitContent:function(el){
        var max = parseInt(el.getAttribute("data-max"),10);
        var debug = (el.getAttribute('data-debug')) ? 1 : 0;
        var center = (el.getAttribute('data-center')) ? 1 : 0;
        var height = (el.getAttribute('data-height')) ? parseFloat(el.getAttribute('data-height')) : 0;
        if(center&&!height) height = el.clientHeight;
        var min = (el.getAttribute('data-min')) ? parseInt(el.getAttribute('data-min'),10) : 9;
        var incriment = parseInt(el.getAttribute('data-incriment'),10);
        if(!incriment) incriment=1;
       // var debug=true;//force debugging
        var font_size = max;
        if (height) {
            if(debug) console.log("initial sizing", "style height = " + el.clientHeight)
            while (font_size >= min) {
                el.style.fontSize = font_size+"px";
                if(!el.firstChild||typeof el.firstChild =="string") return console.warn('wrap the content in a div! <div></div>');
                if (el.firstChild.clientHeight <= height) {
                    if(debug) console.log("breaking loop","font_size = " + font_size, "height = " + height, "style height = " + el.clientHeight);
                    break;
                }
                font_size=font_size-incriment;
                //font_size--;
            }
        } else {
            var width = (el.getAttribute('data-width')) ? parseFloat(el.getAttribute('data-width')) : ($(el).parent().width()-10); //no need to create this var unless it's needed
            el.style.whiteSpace = "nowrap";
            if(debug) console.log("initial sizing", "style width = " + el.clientWidth+' max= '+width)
            while (font_size >= min) {
                el.style.fontSize = font_size+"px";
                if (debug) {
                    console.log(font_size + ' ' + width + ' ' + el.clientWidth, 1);
                }
                if (el.clientWidth <= width) {
                    if(center){
                        var parent=$(el).parent();
                        var h=parent.outerHeight();
                        var p=parseInt(parent.css('padding'),10);
                        var mid=h/2;
                        var t=mid-(font_size/1.5)
                       // var pt=t-p;
                       // console.log(pt);
                        parent.css('paddingTop',t);
                    }
                    if(debug) console.log("breaking loop", "font_size = " + font_size, "width = " + width);
                    break;
                }
                font_size=font_size-incriment;
                //font_size--;
            }
        }
    },
    addFiles:{
        loaded:[],
        time:2500,
        load:function(conf,cb){
            var self=this;
            var toload=[];
            if(conf.js){
                $.each(conf.js,function(i,v){
                    toload.push(async.apply(function(url,callback){
                        _.addFiles.js(url,_.addFiles.time,function(){
                            callback();
                        },function(){
                            console.log('failed')
                            callback();
                        })
                    },v))
                })
            }
            if(conf.css){
                $.each(conf.css,function(i,v){
                    toload.push(async.apply(function(url,callback){
                        _.addFiles.css(url,_.addFiles.time,function(){
                            callback();
                        },function(){
                            console.log('failed')
                            callback();
                        })
                    },v))
                })
            }
            if(toload.length){
                async.parallel(toload,function(){
                    cb();
                })
            }else{
                cb();
            }
        },
        css:function(url,time,scb,fcb){
            var self=this;
            if(self.loaded.indexOf(url)>=0) return scb();
            $.ajax({
                url : url,
                dataType: "text",
                timeout:time,
                success : function (data) {
                    $('head').append('<style>'+data+'</style>');
                    self.loaded.push(url);
                    scb();
                },
                error:function(){
                    fcb();
                }
            });
        },
        js:function(url,time,scb,fcb){
            var self=this;
            if(self.loaded.indexOf(url)>=0) return scb();
            var lto=setTimeout(function(){
                fcb();
            },time);
            var oHead = document.getElementsByTagName('head')[0];
            var oScript = document.createElement('script');
            oScript.type = 'text/javascript';
            oScript.src = url;//+'?ts='+new Date().getTime();//cache buster
            oScript.async = false;
            oScript.onload = function(){
                if(lto) clearTimeout(lto);
                self.loaded.push(url);
                scb();
            }
            // IE 6 & 7
            oScript.onreadystatechange = function() {
                if (this.readyState == 'complete') {
                    if(lto) clearTimeout(lto);
                    self.loaded.push(url);
                    scb();
                }
            }
            oHead.appendChild(oScript);
        }
    },
    throttle:function(id,time,cb,noclear){
        var self=this;
        if(time===false){
            if(self.timers[id]){
                clearTimeout(self.timers[id]);
                self.timers[id]=false;
            }
            return false;
        }
        if(!time){
            return self.timers[id];
        }
        if(self.timers[id]&&!noclear){
            clearTimeout(self.timers[id]);
            self.timers[id]=false;
        }
        if(!self.timers[id]){
            self.timers[id]=setTimeout(function(){
                self.timers[id]=false;
                cb();
            },time)
        }
    },
    share:function(opts){
        var options=$.extend(true,{},opts);
        console.log(options)
        if(isPhoneGap()){
            window.plugins.socialsharing.shareWithOptions(options, function(){}, function(){});
        }else{
            modules.clipboard.copy(options.url,function(){
                modules.toast({
                    id:'magic',
                    icon:'icon-thumbs-up',
                    content:'Successfully copied link!',
                }) 
            },function(){
                modules.toast({
                    id:'magic',
                    icon:'icon-warning-sign',
                    content:'Error getting link!',
                }) 
            })
        }
    },
    sendEmail:function(opts){
        if(isPhoneGap()&&window.plugins&&window.plugins.socialsharing){
            var to=[];
            to.push(opts.to);
            if(!opts.content) opts.content='';
            if(!opts.subject) opts.subject=''
            window.plugins.socialsharing.shareViaEmail(
              opts.content, // can contain HTML tags, but support on Android is rather limited:  http://stackoverflow.com/questions/15136480/how-to-send-html-content-with-image-through-android-default-email-client
              opts.subject,
              to,//[email1,email2]
              null, // CC: must be null or an array
              null, // BCC: must be null or an array
              null, // FILES: can be null, a string, or an array
              function(){
                //app.log('success',1);
              }, // called when sharing worked, but also when the user cancelled sharing via email (I've found no way to detect the difference)
              function(){
                //app.log('error',1);
              } // called when sh*t hits the fan
            );
        }else{
            _.openLink({
                intent:'mailto:'+opts.to+'?subject='+encodeURIComponent(opts.subject),
                type:'self'
            })
        }
    },
    getImgHeight:function(obj,sizes,html){
        if(sizes.height&&sizes.width){
            if(html) return 'width:'+sizes.width+'px;height:'+sizes.height+'px;';//setting directly
            else return sizes.height;
        }
        if(obj.ar){
            if(sizes.units=='ar'){
                if(!sizes.container){
                    console.warn('no container set!')
                    console.trace();
                    return 200;
                }
                var h=sizes.container.width/sizes.ar;
                if(html) return 'height:'+h+'px;';
                else return h;
            }else if(sizes.units=='%'){
                if(modules.tools.isWebLayout()&&sizes.container){
                   var mh=sizes.container.height*sizes.maxHeight/100;
                   var mw=sizes.container.width*sizes.maxWidth/100;
                }else{
                    var mh=(Math.max(document.documentElement.clientHeight, window.innerHeight || 0)*sizes.maxHeight)/100;
                    var mw=(Math.max(document.documentElement.clientWidth, window.innerWidth || 0)*sizes.maxWidth)/100;
                }
            }else if(sizes.units=='px'){
                var mh=sizes.maxHeight;
                var mw=sizes.maxWidth;
            }else{
                console.warn('no units set!')
            }
            var ar=parseFloat(obj.ar);
            if(sizes.fitWidth){
                if(sizes.height){
                    var w=Math.ceil(ar*sizes.height);
                    if(sizes.maxWidth&&w>sizes.maxWidth) w=sizes.maxWidth;
                    if(html) return 'width:'+w+'px;height:100%;';
                    else return w;
                }else if(sizes.width=='body'){
                    var w=document.documentElement.clientWidth;
                    var h=w/ar;
                    if(sizes.maxHeight&&h>sizes.maxHeight){
                        h=sizes.maxHeight;
                        w=Math.ceil(ar*h);
                    }
                    if(html) return 'width:100%;height:'+h+'px;';
                    else return h;
                }else if(sizes.width){
                    var w=sizes.width;
                    var h=sizes.width/ar;
                    if(sizes.maxHeight&&h>sizes.maxHeight){
                        h=sizes.maxHeight;
                        w=Math.ceil(ar*h);
                    }
                    if(html) return 'width:'+w+'px;height:'+h+'px;';
                    else return w;
                }
            }else if(sizes.fitHeight){
                var w=mh*ar;
                if(w>mw){
                    w=mw;
                    h=mw/ar;
                    if(html) return 'width:'+w+'px;height:'+h+'px;';
                    else return w;
                }else{
                    if(html) return 'width:'+w+'px;height:'+mh+'px;';
                    else return w;
                }
            }else{
                var mar=mw/mh;
                if(mar>ar){
                    //console.log('use height')
                    var height=mh;
                    if(html) return 'height:100%;'
                }else{
                   // console.log('use width');
                    var height=mw/ar;
                    if(html) return 'width:100%;'
                }
                return height;
            }
        }else{
            if(html){
                return 'height:100%;width:100%';
            }else{
                return document.documentElement.clientHeight/2;//show anything
            }
            onerror('no image AR set');
        }
    },
    getLinkDomain:function(url){
        url=url.replace('https://','').replace('http://','');
        var urlp=url.split('/');
        return urlp[0];
    },
    wrapExternalLink:function(url){
        return app.sapiurl+'/externallink?u='+encodeURIComponent(url);
    },
    unwrapExternalLink:function(url){
        if(!url) return url;
        var qd=modules.tools.getqs(url);
        if(qd&&qd.u) return decodeURIComponent(qd.u);
        return url;
    },
    getqs:function(url){//parseings
        if(url.indexOf('?')>=0){
            var q=url.split('?');
            var queryString=q[1];
            var query = {};
            var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i].split('=');
                query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
            }
            return query;
        }else{
            return {};
        }
    },
    isFullImage:function(obj,sizes){
        if(obj.ar){
            if(sizes.units=='%'){
                if(modules.tools.isWebLayout()){
                    if(sizes.container){
                        var mh=sizes.container.height*sizes.maxHeight/100;
                        var mw=sizes.container.width*sizes.maxWidth/100;
                    }else{
                        var mh=400;
                        var mw=300;
                    }
                }else{
                    var mh=(Math.max(document.documentElement.clientHeight, window.innerHeight || 0)*sizes.maxHeight)/100;
                    var mw=(Math.max(document.documentElement.clientWidth, window.innerWidth || 0)*sizes.maxWidth)/100;
                }
            }
            var mar=mw/mh;
            var ar=parseFloat(obj.ar);
            if(mar>ar){
                var height=mh;
            }else{
                var height=mw/ar;
            }
            var acualh=(1/ar)*mw;
            if(height<acualh){
                return 0;
            }else{
                return 1;
            }
        }else{
            onerror('no image AR set');
            return 0;
        }
    },
    getUserImg:function(uid,type){
        var url=app.imgurl+'/user/one/'+uid+'/'+type;
        return url;
    },
    getImg:function(obj,type,forcegroot){
        if(app.nointernet) return app.cdot;
        var s3=(typeof obj=='obj'&&obj.s3)?obj.s3:app.s3;//hack!!!;
        //if(forcegroot) s3='https://s3-us-west-2.amazonaws.com/groot';//for mapping stuff
        if(!obj) return '';
        var out='';
        if(typeof obj=='object'){
            if(obj.url){
                if(obj.url.indexOf('http')==-1){
                    return app.siteurl+obj.url;
                }else{
                    return obj.url;
                }
            }else if(!obj.path){
                out='https://s3.amazonaws.com/one-light/static/blank_user.jpg';
            }else{
                if(type=='background'&&!obj.v) type='small';//fallback
                if(type=='profile'&&!obj.v) type='small';//fallback
                if(type=='square'&&!obj.v) type='square';//fallback
                if(type=='header'&&!obj.v) type='small';//fallback
                if(type) out=s3+obj.path+'/'+type+'.'+obj.ext;
                else out=s3+obj.path+'/full.'+obj.ext;
            }
        }else{
            if(obj&&obj.indexOf('http://')==-1&&obj.indexOf('https://')==-1&&obj.indexOf('www')==-1) out=s3+obj;
            else if(obj.indexOf(app.s3)>=0) out=obj;
            else{
                if(obj.indexOf('https://')!=-1) out=obj.replace(/ /g,'%20');//allow for remote sites using https
                else out=app.apiurl+'/proxy/image?img='+encodeURIComponent(obj);
            }
        }
        return out;
    },
    displayLoadTime:function(){
        if(window._pageLoadTime){
            var diff=((new Date().getTime()-window._pageLoadTime)/1000).toFixed(1);
            _.log('++++ PAGE LOAD IN '+diff+' seconds +++++++','time');
        }else{
            console.warn('_pageLoadTime doesnt exist');
        }
    },
    getLink:function(data,prefix){
        if(!prefix){
            prefix='';
        }
//        console.log(data)
        if(data.type){
            switch(data.type){
                case 'user':
                    return prefix+'/profile/'+data.id;
                break;
                default:
                    return prefix+'/'+data.type+'/'+data.id;
                break;
            }
        }else{
            if(data&&data.id){
                switch(data.id[0]){
                    case 'U':
                        return prefix+'/profile/'+data.id;
                    break;
                    case 'G':
                        return prefix+'/page/'+data.id;
                    break;
                    case 'E':
                        return prefix+'/event/'+data.id;
                    break;
                    default://pages are only items right now with custom ids...this may change
                        return prefix+'/page/'+data.id;
                    break;
                }
            }
        }
        return '';
    },
    getProcessTime:function(data){
        if(data&&data.info&&data.info.processTime) return data.info.processTime;
        return '';
    },
    loc:function(key,rdata,complex){
        if(!rdata) rdata={};
        if(app.localizations&&app.localizations[key]&&app.localizations[key].content){
            if(complex){
                return '<div data-loc="'+key+'" data-complex="1" class="locinfo">'+_.fixContent(_.parseString(app.localizations[key].content,rdata),{redactor:1})+'</div>';
            }else{
                return '<span data-loc="'+key+'" class="locinfo">'+_.fixContent(_.parseString(app.localizations[key].content,rdata),{redactor:1})+'</span>';
            }   
        }else{
            if(key!='Network Timeout') onerror('missing loc for ['+key+']');
            if(complex){
                return '<div data-loc="'+key+'" data-complex="1" class="locinfo">'+key+'</div>';
            }else{
                return '<span data-loc="'+key+'" class="locinfo">'+key+'</span>';
            }
        }
    },
    dotSet:function(key,set,obj){
        obj=ds(obj,key,set);
        return obj;
    },
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
    stripTags:function(content){
        var e=$('<div>'+content+'</div>');
        return e.text();
    },
    onHover:function(eles,cb){
        if(isPhoneGap()||isMobile) return false;//no onHover event for mobile
        eles.each(function(i,v){
            $(v).on('mouseover',function(){
                var te=$(this);
                te.data('to',setTimeout(function(){
                    cb(te);
                },400));
            }).on('mouseout',function(){
                if($(this).data('to')) clearTimeout($(this).data('to'));
            })
        })
    },
    fromMoney:function(str){
    	return Math.floor(parseFloat(str)*100);
    },
    calcPlatformFee:function(amount,string){
        if(amount>200){
            if(string){
                return Math.floor(eval(_.parseString(string,{
                    total:amount
                })).toFixed(2))
            }else{
                return 100;//$1 for now but can be different later!
            }
        }else{
            return 0;
        }
    },
    calcStripeFee:function(amount){
        if(!amount) return 0;//if its free, no need to charge a card!
        return Math.ceil(((amount+30)/(1-.029))-amount)
    	return Math.ceil((0.029*amount)+ 30);
    },
    highlightString:function(str,search,spanClass){
    	var re = new RegExp(search,'ig');
    	return str.replace(re, function replace(match) { 
		    if(spanClass) return '<span class="'+spanClass+'">' + match + '</span>';
		    else return '<span>' + match + '</span>';
		});
    },
    parseString:function(string,data){
        if(!string) return '';
        if(typeof string !='string') return string;
        return string.replace(/\[+([^\][]+)]+/g,function(match){
            match=match.replace('[','').replace(']','');
            return _.dotGet(match,data);
        });
        //return string;
    },
    iframe:{
        sendChild:function(iframe,data,url){
            if(!url) url='*';
            //console.log(iframe,data,url)
            if(iframe&&iframe.contentWindow) iframe.contentWindow.postMessage(data,url);
        },
        sendParent:function(data){
            if(window.parent&&window.parent.postMessage) window.parent.postMessage(data, '*');
        },
        listenChild:function(cb){
            window.addEventListener("message", function(e){
                cb(e);
            }, false);
        },
        listenParent:function(cb){
            window.addEventListener("message", function(e){
                cb(e);
            }, false);
        }
    },  
    downloadFile:function(url){
        var hiddenIFrameID = 'hiddenDownloader_'+Math.uuid(12),
            iframe = document.getElementById(hiddenIFrameID);
        if (iframe === null) {
            iframe = document.createElement('iframe');
            iframe.id = hiddenIFrameID;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
        }
        iframe.src = url;
        setTimeout(function(){
            $('#'+hiddenIFrameID).remove();
        },10000);
    },
    toMoney:function(val,commas,add,strip_zeros){
        if(!val) return 0;
    	if(add) val+=add;
    	var str=(val/100).toFixed(2)
    	if(!commas){
            var strp=str.split('.');
            if(strip_zeros&&strp[1]=='00') return strp[0];
            return str;
        }
    	var strp=str.split('.');
    	strp[0]=strp[0].addCommas();
        if(strip_zeros&&strp[1]=='00') return strp[0];
    	return strp.join('.');
    },
    getMime:function(ext){
        var mime='';
        switch(ext){
            // case 'mov':
            //     mime='video/quicktime';
            // break;
            case 'mov':
            case 'mp4':
                mime='video/mp4';
            break;
            // case 'mkv':
            //     mime='video/mkv';
            // break;
            default:
                mime='';
            break;
        }
        return mime;
    },
    getMoneyColor:function(val,transaction,me,isPositive){
        if(transaction.refund) return '#DAA520';
    	var red='#f02';
    	var black='black';
    	var green='green';
    	if(typeof isPositive!='undefined'){
    		if(isPositive) return green;
    		else return red;
    	}
    	if(transaction){
    		if(transaction.from.id==me){
    			return red;
    		}else{
    			return green;
    		}
    	}else{
	    	if(val>0){
	    		return green;
	    	}else if(val==0){
	    		return black;
	    	}else{
	    		return red;
	    	}
	    }
    },
    getMoneySign:function(val,transaction,me,isPositive){
    	if(typeof isPositive!='undefined'){
    		if(isPositive) return '+';
    		else return '-'
    	}
    	if(transaction){
    		if(transaction.from.id==me){
    			return '-';
    		}else{
    			return '+';
    		}
    	}else{
	    	if(val>0){
	    		return '+';
	    	}else if(val==0){
	    		return '';
	    	}else{
	    		return '-';
	    	}
	    }
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
    },
    graphList:function(resp,opts){
        if(resp.data&&resp.data.list){
            for(var key in resp.data.list){
                 for (var i = 0; i < opts.length; i++) {
                    var thing=opts[i];
                    _.dotSet(thing.key,thing.fn(resp.data.list[key]),resp.data.list[key]);
                }
            }
        }
        return resp;
    },
    graph:function(data,opts){
        for (var i = 0; i < opts.length; i++) {
            var thing=opts[i];
            _.dotSet(thing.key,thing.fn(data),data);
        }
        return data;
    },
    isEmojiString:function(string){
    	if(string.length&&string.length<20){
    		if(window.GraphemeSplitter){
	    		var splitter = new GraphemeSplitter();
	    		var graphemes = splitter.splitGraphemes($.trim(string));
	    		var total=graphemes.length;
	    		var emoji=0;
	    		$.each(graphemes,function(i,v){
	    			if(modules.tools.isEmoji(v)) emoji++;
	    		})
	    		if(emoji==total) return true;
	    		return false;
	    	}else{
	    		if(app.isdev) _alert('missing GraphemeSplitter');
	    		onerror('missing GraphemeSplitter');
	    	}
    	}else{
    		return false;
    	}
    },
    getPlanInfo:function(user,status){
    	if(!status) return false;
    	if(!data||!info) return false;
		var planinfo={};
        
        return planinfo;
        //////////
		if(!user.active){
			if(user.trial){
				planinfo.free=1;
			}else if(user.overdue){
				planinfo.overdue=1;
			}
		}else{
			// if(self.data.subscription_info){
			// 	if(self.data.now<self.data.subscription_info.current_period_end){
			// 		planinfo.overdue=false;
			// 		planinfo.validUntil=self.data.subscription_info.current_period_end;
			// 	}else{
			// 		planinfo.overdue=1;
			// 	}
			// }else{
			// 	planinfo.free=true;
			// 	planinfo.trial=true;
			// }
			// planinfo.free=true;
			// planinfo.trial=true;
			if(data.freeUntil&&data.freeUntil>app.time){
				planinfo.free=true;
				planinfo.trial=true;
			}else{
				planinfo.active=true;
			}
		}
		if(info.length==12){
			planinfo.yearly=true;
			planinfo.base=5000;
			planinfo.breakdown=12;
		}else{
			planinfo.monthly=true;
			planinfo.base=500;
			planinfo.breakdown=1;
		}
		planinfo.validPages=0;
		if(data.freeUntil) planinfo.freeUntil=data.freeUntil;
		if(info.lifetime){
			planinfo.lifetime=1;
			planinfo.overdue=false;
			planinfo.free=false;
			planinfo.payout='';//????
		}
		if(info.active&&!planinfo.trial){
			planinfo.validPages++;
			planinfo.active=1;
		}
		if(data.pages&&data.pages.length) planinfo.validPages+=(data.pages.length);
		if(planinfo.active){
			planinfo.payoutMoney='<span style="font-size:18px">$'+modules.tools.toMoney(Math.floor((planinfo.base*planinfo.validPages*status.percent)/planinfo.breakdown))+'</span>';
			planinfo.payout='<span style="color:green;" class="bold">Active!</span>';
		}else{
			planinfo.payout='Free Trial';
		}
		if(info.settings_title){
			planinfo.name=info.settings_title
		}else if(app.time<planinfo.freeUntil){
			planinfo.name=info.settings_title_free
		}else{
			planinfo.name=info.settings_title_paid
		}
		return planinfo;
	},
    getFile:function(obj,type){
        if(app.nointernet) return app.cdot;
        var s3=(typeof obj=='obj'&&obj.s3)?obj.s3:app.s3;//hack!!!;
        if(!obj) return '';
        var out='';
        if(typeof obj=='object'){
            if(!type) type='media_full';
            out=s3+obj.path+'/'+type+'.'+obj.ext;
        }
        return out;
    },
    wrapContent:function(text,length,start_expanded){
        if(text&&text.length>length){
            //look for <a </a> to determin "no go" breakpoints
            //include BR tags in this too
            var starts={
                span:modules.tools.getIndicesOf(text,"<span "),
                div:modules.tools.getIndicesOf(text,"<div ")
            }
            var ends={
                span:modules.tools.getIndicesOf(text,"</span>"),
                div:modules.tools.getIndicesOf(text,"</div>")
            }
            var content=$('<div>'+text+'</div>');
            var htmls=content.find('span,div');
            var list=[];
            var invisible=0;
            var tosearch=[];
            var counts={
                span:0,
                div:0,
                br:0
            }
            $.each(htmls,function(i,v){
                switch($(v).prop('tagName').toLowerCase()){
                    case 'div':
                        var start=starts.div[counts.div]
                        var end=ends.div[counts.div]
                        var textLength=$(v).text().length;
                        counts.div++;
                    break;
                    case 'span':
                        var start=starts.span[counts.span]
                        var end=ends.span[counts.span]
                        var textLength=$(v).text().length;
                        counts.span++;
                    break;
                    case 'br':
                        var start=starts.br[counts.br]
                        var end=ends.br[counts.br]
                        var textLength=0;
                        counts.br++;
                    break;
                }
                var item={
                    start:start,
                    end:end,
                    stringLength:textLength,
                    actualStart:start-invisible,
                    actualEnd:((start-invisible)+textLength)
                }
                list.push(item);
                invisible+=((item.end-item.start)-item.stringLength);
            })
            if(list.length){//figure out where to break!
                var actuallength=0;
                var actualbreaks=[];
                var actuallength=text.length-invisible;
                if(actuallength>length){
                    var tbreak=length;
                    var extra=0;
                    //check agains list to ensure its not a "bad" breakpoint
                    $.each(list,function(i,v){
                        if(tbreak>=v.actualStart&&tbreak<=(v.actualEnd+3)){//break just befores this
                            tbreak=v.actualStart;
                        }else{
                            if(v.actualStart<tbreak){
                                extra+=(v.end-v.start-v.stringLength);
                            }
                        }
                    })
                    tbreak=tbreak+extra;
                    var tpl='<div class="wrappedcontent '+((start_expanded)?'showtext':'')+'"><div class="truncatedtext readmore">'+text.limitlength(tbreak)+' <span class="readmore normalicon bluehighlighttext">Read More</span></div><div class="fulltext">'+text+' <br/><br/><span class="showless normalicon bluehighlighttext">Show Less</span></div></div>';
                    return tpl;
                }else{//dont need to do anything
                    return text;
                }
            }else{
                var tpl='<div class="wrappedcontent '+((start_expanded)?'showtext':'')+'"><div class="truncatedtext readmore">'+text.limitlength(length)+' <span class="readmore normalicon bluehighlighttext">Read More</span></div><div class="fulltext">'+text+' <br/><br/><span class="showless normalicon bluehighlighttext">Show Less</span></div></div>';
            }
            return tpl;
            // if(starts.length) $.each(starts,function(i,v){
            //     if(length<ends[i]&&length>v){
            //         length=v;//move to 1 behind beinginning
            //     }
            // })
            // var tpl='<div class="wrappedcontent"><div class="truncatedtext">'+text.limitlength(length)+' <span class="readmore normalicon bluehighlighttext">Read More</span></div><div class="fulltext">'+text+' <span class="showless normalicon bluehighlighttext">Show Less</span></div></div>';
            // return tpl;
        }else return text;
    },
    getIndicesOf:function(str,searchStr,caseSensitive){
        var searchStrLen = searchStr.length;
        if (searchStrLen == 0) {
            return [];
        }
        var startIndex = 0, index, indices = [];
        if (!caseSensitive) {
            str = str.toLowerCase();
            searchStr = searchStr.toLowerCase();
        }
        while ((index = str.indexOf(searchStr, startIndex)) > -1) {
            indices.push(index);
            startIndex = index + searchStrLen;
        }
        return indices;
    },
    isEmoji:function(char){
    	var regex='(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c\ude32-\ude3a]|[\ud83c\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])';
    	var re = new RegExp(regex);
    	if(re.test(char)){
    		return true;
    	}
    	return false;
    }
}