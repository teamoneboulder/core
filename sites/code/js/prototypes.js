if(!window.modules) window.modules={};
/**
 * Determine whether the file loaded from PhoneGap or not
 */
function isPhoneGap(){
    if ((document.URL.indexOf('http://') === -1) && (document.URL.indexOf('https://') === -1)) {
        return true;
    }else{
        return false;
    }
};
window.isSafari=(navigator.userAgent.indexOf("Safari")>-1&&navigator.userAgent.indexOf("Chrome")==-1&&!isPhoneGap())?1:0;
function mobileCheck() {
    if( navigator.userAgent.match(/Android/i)
     || navigator.userAgent.match(/webOS/i)
     || navigator.userAgent.match(/iPhone/i)
     || navigator.userAgent.match(/iPad/i)
     || navigator.userAgent.match(/iPod/i)
     || navigator.userAgent.match(/BlackBerry/i)
     || navigator.userAgent.match(/Windows Phone/i)
     ){
        return true;
      }
     else {
        return false;
      }
};
window.isMobile=mobileCheck();
window._alert=function(msg,cb,title,button){
    if(window.notification){
        if(!cb) cb=function(){};
        if(!title) window.notification.alert(msg,cb,'Groupup');
        else if(title && !button) window.notification.alert(msg,cb,title);
        else if(title && button) window.notification.alert(msg,cb,title,button);
    }else{
        alert(msg);
    }};
function stripslashes(str) {
  return (str + '')
    .replace(/\\(.?)/g, function(s, n1) {
      switch (n1) {
        case '\\':
          return '\\';
        case '0':
          return '\u0000';
        case '':
          return '';
        default:
          return n1;
      }
    });
}
String.prototype.toURL=function(){
    return this.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
};
String.prototype.toURL2=function(){
    return this.replace(/[^a-zA-Z0-9_]/g, '');
};
String.prototype.stringToHex=function() {
    var tmp=this;
    var str = '',
        i = 0,
        tmp_len = tmp.length,
        c;
 
    for (; i < tmp_len; i += 1) {
        c = tmp.charCodeAt(i);
        str += c.toString(16);
    }
    return str;
}
String.prototype.hexToString=function(tmp) {
    var tmp=this;
        str = '',
        i = 0,
        arr_len = tmp.length,
        c;
    for (var i = 0; i <= tmp.length-2; i=i+2) {
        var c=tmp[i]+tmp[i+1];
        str+=String.fromCharCode(parseInt(c, 16));
        };
    return str;
}
Array.prototype.intersect=function(b){
    var a=this;
    return a.filter(value => b.includes(value));
}
RegExp.escape = function(string) {
    if(!string) return string;
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
};
if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    var el = this;

    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}
String.prototype.getMatches = function(string)
{
    var str=this;
    var re=new RegExp(RegExp.escape(string),'g');
    var matches=this.match(re);
    if(matches&&matches.length){
        var searchStrLen = string.length;
        if (searchStrLen == 0) {
            return [];
        }
        var startIndex = 0, index, indices = [];
        while ((index = str.indexOf(string, startIndex)) > -1) {
            indices.push({
                start:index,
                end:index + searchStrLen
            });
            startIndex = index + searchStrLen;
        }
        return indices;
    }else{
        return false;
    }
}
$.fn.relativeOffset=function(parent){
    var to=$(this).offset();
    var po=parent.offset();
    return {
        top:(to.top-po.top+parent.scrollTop()),
        left:(to.left-po.left)
    }
}
$.fn.deparam=function(params,coerce){
  var obj = {},
      coerce_types = { 'true': !0, 'false': !1, 'null': null };
    
    // Iterate over all name=value pairs.
    $.each( params.replace( /\+/g, ' ' ).split( '&' ), function(j,v){
      var param = v.split( '=' ),
        key = decodeURIComponent( param[0] ),
        val,
        cur = obj,
        i = 0,
        
        // If key is more complex than 'foo', like 'a[]' or 'a[b][c]', split it
        // into its component parts.
        keys = key.split( '][' ),
        keys_last = keys.length - 1;
      
      // If the first keys part contains [ and the last ends with ], then []
      // are correctly balanced.
      if ( /\[/.test( keys[0] ) && /\]$/.test( keys[ keys_last ] ) ) {
        // Remove the trailing ] from the last keys part.
        keys[ keys_last ] = keys[ keys_last ].replace( /\]$/, '' );
        
        // Split first keys part into two parts on the [ and add them back onto
        // the beginning of the keys array.
        keys = keys.shift().split('[').concat( keys );
        
        keys_last = keys.length - 1;
      } else {
        // Basic 'foo' style key.
        keys_last = 0;
      }
      
      // Are we dealing with a name=value pair, or just a name?
      if ( param.length === 2 ) {
        val = decodeURIComponent( param[1] );
        
        // Coerce values.
        if ( coerce ) {
          val = val && !isNaN(val)            ? +val              // number
            : val === 'undefined'             ? undefined         // undefined
            : coerce_types[val] !== undefined ? coerce_types[val] // true, false, null
            : val;                                                // string
        }
        
        if ( keys_last ) {
          // Complex key, build deep object structure based on a few rules:
          // * The 'cur' pointer starts at the object top-level.
          // * [] = array push (n is set to array length), [n] = array if n is 
          //   numeric, otherwise object.
          // * If at the last keys part, set the value.
          // * For each keys part, if the current level is undefined create an
          //   object or array based on the type of the next keys part.
          // * Move the 'cur' pointer to the next level.
          // * Rinse & repeat.
          for ( ; i <= keys_last; i++ ) {
            key = keys[i] === '' ? cur.length : keys[i];
            cur = cur[key] = i < keys_last
              ? cur[key] || ( keys[i+1] && isNaN( keys[i+1] ) ? {} : [] )
              : val;
          }
          
        } else {
          // Simple key, even simpler rules, since only scalars and shallow
          // arrays are allowed.
          
          if ( $.isArray( obj[key] ) ) {
            // val is already an array, so push on the next value.
            obj[key].push( val );
            
          } else if ( obj[key] !== undefined ) {
            // val isn't an array, but since a second value has been specified,
            // convert val into an array.
            obj[key] = [ obj[key], val ];
            
          } else {
            // val is a scalar.
            obj[key] = val;
          }
        }
        
      } else if ( key ) {
        // No value was defined, so set something meaningful.
        obj[key] = coerce
          ? undefined
          : '';
      }
    });
    
    return obj;

}
Storage.prototype.setObject = function(key, value,onload) {
    this.setItem(key, JSON.stringify(value));
};
Storage.prototype.getObject = function(key,ret) {
    return (this.getItem(key))?JSON.parse(this.getItem(key)):(!ret)?{}:[];
};
Storage.prototype.getVar = function(key) {
    var val=this.getItem(key);
    if(val==='true') return true;
    if(val==='false') return false;
    else return val;
};
Storage.prototype.setVar = function(key, value,onload) {
    this.setItem(key, value);
};
window.clog=function(msg){
    console.log(msg);
}
window.jsons=function(obj){
    return JSON.stringify(obj);
}
String.prototype.isJson=function(){
    try {
        JSON.parse(this.toString());
    } catch (e) {
        return false;
    }
    return true;
}
window.stopEvent = function(e){
    if(e.stopImmediatePropagation){
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
    }
}
String.prototype.parseStack = function(version){
    var str=this;
    var str=str.replace(/(\r\n|\n|\r)/gm,'&');
    var lp=str.split('&');
    var text='';
    for (var i = 0; i < lp.length; i++) {
        var line=lp[i];
        line=line.replace('<anonymous>','anonymous');
        var url='';
        var skip=false;
        if(line.indexOf('app.html')!=-1){//starts off blank because there is no "file" being referenced
            var p=line.split(':')
            var skip=true;
            if(!version) version='1.653';//testing
            var conf={
                url:'current.js',
                version:version,
                line:p[2],
                column:p[3]
            }
            var link="<span class='x_viewerror' style='font-weight:bold;margin-left:5px' data-conf='"+JSON.stringify(conf)+"'>View</span>";
        }else if(line.indexOf('(anonymous:1')!=-1){//new combine loader detection
            var p=line.split(':');
            var skip=true;
            if(!version) version='1.653';//testing
            var conf={
                url:'current.dna',
                version:version,
                line:p[1],
                column:p[2].replace(')','')
            }
            var link="<span class='x_viewerror' style='font-weight:bold;margin-left:5px' data-conf='"+JSON.stringify(conf)+"'>View</span>";
        }else if(line.indexOf('@')!=-1||line.indexOf('file')===0){//stacktrack
            if(line.indexOf('@')!=-1){
                var line1=line.replace('@','- ');
                var atext=$('<div>'+anchorme(line1,{
                    exclude: function(urlObj){
                        urlObj.encoded = urlObj.encoded.replace(/%25/g, '%');
                        return false;
                      }
                })+'</div>');
                var url='';
                if(atext.find('a').length) $.each(atext.find('a'),function(i,v){
                    var e=$(v);
                    if(e.attr('href').indexOf('file://')==-1) url=e.attr('href');
                });
            }
        }else{
            var line1=line;
            var atext=$('<div>'+anchorme(line1,{
                exclude: function(urlObj){
                    urlObj.encoded = urlObj.encoded.replace(/%25/g, '%');
                    return false;
                  }
            })+'</div>');
            var url='';
            if(atext.find('a').length) $.each(atext.find('a'),function(i,v){
                var e=$(v);
                if(e.attr('href').indexOf('file://')==-1) url=e.attr('href');
            });
            // var url=line1.match(re)[1]
            // var matches = line1.match(/\bhttps?::\/\/\S+/gi);
        }
        if(!skip){
            if(url&&url.indexOf('?')>=0){
                var urlp=url.split('?');
                var u1=urlp[0].split('/');
                var file=u1[u1.length-1];
                var tapp=u1[u1.length-4];
                var p=urlp[1].split(':');
                //var pts=p[0].split('&');
                //var qs={};
                // for (var i = 0; i < pts.length; i++) {
                //     var tp=pts[i].split('=');
                //     qs[tp[0]]=tp[1];
                // }
                var conf={
                    url:urlp[0],
                    line:p[1],
                    column:p[2]
                }
                var link="<span class='x_viewerror' style='font-weight:bold;margin-left:5px' data-conf='"+JSON.stringify(conf)+"'>View</span>";
            }else{
                var link='';
            }
        }
        var paddingLeft=0;
        if(i!=0) var paddingLeft=5;
        text+='<div style="padding-left:'+paddingLeft+'px">'+line+link+'</div>';
    }
    return text;
}
String.prototype.wrapJson=Number.prototype.wrapJson=function(){
    if(!this) return '';
    var text=this.toString();
    if(!text) return '';
    var si=text.indexOf('{');
    var ei=text.lastIndexOf('}');//get last one
    var si2=text.indexOf('[');
    var ei2=text.lastIndexOf(']');//get last one
    var l=text.length;
    if(si>=0&&ei>=0&&si2!=0){
        var s=text.substr(0,si);
        var json=text.substr(si,ei+1);
        if(json.isJson()){
            json=JSON.stringify(JSON.parse(json), null, 4);
            var f=text.substr(ei+1,l);
            text=s+'<pre style="white-space:pre-wrap;">'+json+'</pre>'+f;
        }
    }else if(si2==0&&ei2>0){
        var s=text.substr(0,si2);
        var json=text.substr(si2,ei2+1);
        if(json.isJson()){
            json=JSON.stringify(JSON.parse(json), null, 4);
            var f=text.substr(ei2+1,l);
            text=s+'<pre>'+json+'</pre>'+f;
        }
    }
    text=text.replace(/\n/g,'<br/>');
    return text;
}
String.prototype.toPercent=Number.prototype.toPercent=function(dec){
    var s=parseFloat(this);
    return (s*100).toFixed(dec);
};
String.prototype.toTime=Number.prototype.toTime=function(){
    var s=parseFloat(this);
    var h=Math.floor(s/3600);
    var rs=s-h*3600;
    var m=Math.floor(rs/60);
    var rs=Math.floor(rs-m*60);
    if(m<10) m='0'+m;
    if(rs<10) rs='0'+rs;
    if(h==0) return m+':'+rs;
    return h+':'+m+':'+rs
};
Number.prototype.isNumeric=String.prototype.isNumeric=function(n) {
    var n=this.toString();
    function testit(val){
        if(!isNaN(parseFloat(val)) && isFinite(val)) return val;
        else{
            var newest=val.substr(0,val.length-1);
            if(newest=='') return '';
            val=testit(newest);
            return val;
        }
    }
    var val=testit(n); 
    return val;
}
Number.prototype.toPhoneNumber=String.prototype.toPhoneNumber=function(plain){
    var st=this.toString();
    //if(st=='()'||st=='') return '';
    var text=st.replace(/\(/g,'').replace(/\)/g,'').replace(/-/g,'').replace(/ /g,'').isNumeric().substr(0,10);
    if(plain) return text;
    if(text=='') return '';
    var l=text.length;
    var r='';
    switch(true){
        case l>0&&l<=3:
            r=text;
        break;
        case l<=6:
            r='('+text.substr(0,3)+') '+text.substr(3,(l-3));
        break;
        case l<=10:
            r='('+text.substr(0,3)+') '+text.substr(3,3)+'-'+text.substr(6,(l-6));
        break;
    }
    return r;
}
Number.prototype.formatTime=String.prototype.formatTime=function(onlyrel,seconds){
    var st=this;
    if(st.length==13){
        st=parseInt(st,10);
        st=st/1000;
    }
    if(st.length==24){//mongo time!!!!! conver to UTS WOOT!
        st=parseInt(st.substring(0, 8), 16);
    }
    var ct=new Date().getTime()/1000;
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
        if(seconds){
            var ts=new Date(parseInt(st.toString()+'000')).getSeconds();
            if(ts<10) ts='0'+ts;
            var time=lst[0]+':'+lst[1]+':'+ts+tp;
        }else{
            var time=lst[0]+':'+lst[1]+tp;
        }
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
        if(seconds){
            var ts=new Date(parseInt(st.toString()+'000')).getSeconds();
            if(ts<10) ts='0'+ts;
            var time=lst[0]+':'+lst[1]+':'+ts+tp;
        }else{
            var time=lst[0]+':'+lst[1]+tp;
        }
        var rel='';
        if(d > 0){
            if(d==1) rel='in '+d+' day';
            else rel='in '+d+' days';
        }else if(h > 0){
            if(h==1) rel='in '+h+' hour';
            else rel='in '+h+' hours';
        }else{
            if(m==1) rel='in '+ m+' min';
            else if(m==0) rel='Just Now';
            else rel='in '+m+' mins';
        }
        if(onlyrel) return rel;
        else return time+ ' ('+rel+')';
    }
};
String.prototype.ensureSpaces=function(index,count) {
    return this.replace(/\s\s+/g, ' ');
}
Number.prototype.getRating=String.prototype.getRating=function() {
    var v=parseFloat(this);
    return v.toFixed(1);
}
String.prototype.deleteAt=function(index,count) {
    return this.slice(0, index) + this.slice(index+count);
}
String.prototype.insertAt=function(index, string) { 
  return this.substr(0, index) + string + this.substr(index);
}
String.prototype.replaceString=function(start, end, replace) { 
  return this.substr(0, start) + replace + this.substr(end);
}
String.prototype.getTagId=function(){
    var nval=this.trim().replace(/ /g,'_').replace(/[^0-9a-z_ ]/gi, '').toLowerCase();
    return nval;
}
Array.prototype.shuffle=function() {
    var array=this;
  for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};
Number.prototype.displayTime=String.prototype.displayTime=function(dateonly){
    var t=this.toString();
    if(t.length==10) t=t+'000';//php time
    if(dateonly){
        if(dateonly==1) var rt=moment(parseInt(t,10)).format("MMMM Do YYYY");
        if(dateonly==2) var rt=moment(parseInt(t,10)).format("MM/DD/YYYY");
    }else var rt=moment(parseInt(t,10)).format("MMMM Do YYYY, h:mm a");
    return rt;
}
String.prototype.safeURL=function(){
    return this.replace(/[^a-z0-9_]/gi, '').toLowerCase();
}
String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
String.prototype.capitalize = function() {
    return this.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}
String.prototype.firstName=function(){
    var str=this.trim();
    var sp=this.split(' ');
    var f='';
    for (var i = 0; i < sp.length; i++) {//crazy thing..dont ask
        var l=sp[i];
        if(l&&!f) f=l;
    }
    return f;
}
String.prototype.limitlength = function(length) {
    var len = this.length;
    var tlen = length - 3;
    if(len > tlen) return this.toString().substr(0, tlen) + '...';
    else return this.toString();
}
Array.prototype.clean = function(deleteValue) {
      for (var i = 0; i < this.length; i++) {
        if (this[i] == deleteValue) {         
          this.splice(i, 1);
          i--;
        }
      }
  return this;
};
String.prototype.addCommas=Number.prototype.addCommas=function(){
    if(this.toString().indexOf('.')>=0){
        var sp=this.toString().split('.');
        return sp[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")+'.'+sp[1];
    }else{
        return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }
}
Number.prototype.toMoney =String.prototype.toMoney = function(format){
    var val=this.toString();
    var testit=function(val){
        var reg = /^-?\d*\.?\d*$/i;
        var q = new RegExp(reg);
        var r=val.search(q);
        if(r==-1){//try to fix
            var newest=val.substr(0,val.length-1);
            val=testit(newest);
        }
        return val;
    }
    var tval=testit(val);
    //only allow 2 dp
    var dp=tval.indexOf('.');
    if(tval.indexOf('.')!=-1){
        var l=tval.length-1;
        if(l>3){
            tval=tval.substring(0,(dp+3));
        }
    }
    if(!format) return tval;
    else if(tval) return parseFloat(tval).toFixed(2);
    else return 0;
}