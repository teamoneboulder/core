//UUID
;(function(){var e="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");Math.uuid=function(t,n){var r=e,i=[],s;n=n||r.length;if(t){for(s=0;s<t;s++)i[s]=r[0|Math.random()*n]}else{var o;i[8]=i[13]=i[18]=i[23]="-";i[14]="4";for(s=0;s<36;s++){if(!i[s]){o=0|Math.random()*16;i[s]=r[s==19?o&3|8:o]}}}return i.join("")};Math.uuidFast=function(){var t=e,n=new Array(36),r=0,i;for(var s=0;s<36;s++){if(s==8||s==13||s==18||s==23){n[s]="-"}else if(s==14){n[s]="4"}else{if(r<=2)r=33554432+Math.random()*16777216|0;i=r&15;r=r>>4;n[s]=t[s==19?i&3|8:i]}}return n.join("")};Math.uuidCompact=function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){var t=Math.random()*16|0,n=e=="x"?t:t&3|8;return n.toString(16)})}})();
//EJS
(function(){var rsplit=function(string,regex){var result=regex.exec(string),retArr=new Array(),first_idx,last_idx,first_bit;while(result!=null){first_idx=result.index;last_idx=regex.lastIndex;if((first_idx)!=0){first_bit=string.substring(0,first_idx);retArr.push(string.substring(0,first_idx));string=string.slice(first_idx)}retArr.push(result[0]);string=string.slice(result[0].length);result=regex.exec(string)}if(!string==""){retArr.push(string)}return retArr},chop=function(string){return string.substr(0,string.length-1)},extend=function(d,s){for(var n in s){if(s.hasOwnProperty(n)){d[n]=s[n]}}};EJS=function(options){options=typeof options=="string"?{view:options}:options;this.set_options(options);if(options.precompiled){this.template={};this.template.process=options.precompiled;EJS.update(this.name,this);return }if(options.element){if(typeof options.element=="string"){var name=options.element;options.element=document.getElementById(options.element);if(options.element==null){throw name+"does not exist!"}}if(options.element.value){this.text=options.element.value}else{this.text=options.element.innerHTML}this.name=options.element.id;this.type="["}else{if(options.url){options.url=EJS.endExt(options.url,this.extMatch);this.name=this.name?this.name:options.url;var url=options.url;var template=EJS.get(this.name,this.cache);if(template){return template}if(template==EJS.INVALID_PATH){return null}try{this.text=EJS.request(url+(this.cache?"":"?"+Math.random()))}catch(e){}if(this.text==null){throw ({type:"EJS",message:"There is no template at "+url})}}}var template=new EJS.Compiler(this.text,this.type);template.compile(options,this.name);EJS.update(this.name,this);this.template=template};EJS.prototype={render:function(object,extra_helpers){object=object||{};this._extra_helpers=extra_helpers;var v=new EJS.Helpers(object,extra_helpers||{});return this.template.process.call(object,object,v)},update:function(element,options){if(typeof element=="string"){element=document.getElementById(element)}if(options==null){_template=this;return function(object){EJS.prototype.update.call(_template,element,object)}}if(typeof options=="string"){params={};params.url=options;_template=this;params.onComplete=function(request){var object=eval(request.responseText);EJS.prototype.update.call(_template,element,object)};EJS.ajax_request(params)}else{element.innerHTML=this.render(options)}},out:function(){return this.template.out},set_options:function(options){this.type=options.type||EJS.type;this.cache=options.cache!=null?options.cache:EJS.cache;this.text=options.text||null;this.name=options.name||null;this.ext=options.ext||EJS.ext;this.extMatch=new RegExp(this.ext.replace(/\./,"."))}};EJS.endExt=function(path,match){if(!path){return null}match.lastIndex=0;return path+(match.test(path)?"":this.ext)};EJS.Scanner=function(source,left,right){extend(this,{left_delimiter:left+"%",right_delimiter:"%"+right,double_left:left+"%%",double_right:"%%"+right,left_equal:left+"%=",left_comment:left+"%#"});this.SplitRegexp=left=="["?/(\[%%)|(%%\])|(\[%=)|(\[%#)|(\[%)|(%\]\n)|(%\])|(\n)/:new RegExp("("+this.double_left+")|(%%"+this.double_right+")|("+this.left_equal+")|("+this.left_comment+")|("+this.left_delimiter+")|("+this.right_delimiter+"\n)|("+this.right_delimiter+")|(\n)");this.source=source;this.stag=null;this.lines=0};EJS.Scanner.to_text=function(input){if(input==null||input===undefined){return""}if(input instanceof Date){return input.toDateString()}if(input.toString){return input.toString()}return""};EJS.Scanner.prototype={scan:function(block){scanline=this.scanline;regex=this.SplitRegexp;if(!this.source==""){var source_split=rsplit(this.source,/\n/);for(var i=0;i<source_split.length;i++){var item=source_split[i];this.scanline(item,regex,block)}}},scanline:function(line,regex,block){this.lines++;var line_split=rsplit(line,regex);for(var i=0;i<line_split.length;i++){var token=line_split[i];if(token!=null){try{block(token,this)}catch(e){throw {type:"EJS.Scanner",line:this.lines}}}}}};EJS.Buffer=function(pre_cmd,post_cmd){this.line=new Array();this.script="";this.pre_cmd=pre_cmd;this.post_cmd=post_cmd;for(var i=0;i<this.pre_cmd.length;i++){this.push(pre_cmd[i])}};EJS.Buffer.prototype={push:function(cmd){this.line.push(cmd)},cr:function(){this.script=this.script+this.line.join("; ");this.line=new Array();this.script=this.script+"\n"},close:function(){if(this.line.length>0){for(var i=0;i<this.post_cmd.length;i++){this.push(pre_cmd[i])}this.script=this.script+this.line.join("; ");line=null}}};EJS.Compiler=function(source,left){this.pre_cmd=["var ___ViewO = [];"];this.post_cmd=new Array();this.source=" ";if(source!=null){if(typeof source=="string"){source=source.replace(/\r\n/g,"\n");source=source.replace(/\r/g,"\n");this.source=source}else{if(source.innerHTML){this.source=source.innerHTML}}if(typeof this.source!="string"){this.source=""}}left=left||"<";var right=">";switch(left){case"[":right="]";break;case"<":break;default:throw left+" is not a supported deliminator";break}this.scanner=new EJS.Scanner(this.source,left,right);this.out=""};EJS.Compiler.prototype={compile:function(options,name){options=options||{};this.out="";var put_cmd="___ViewO.push(";var insert_cmd=put_cmd;var buff=new EJS.Buffer(this.pre_cmd,this.post_cmd);var content="";var clean=function(content){content=content.replace(/\\/g,"\\\\");content=content.replace(/\n/g,"\\n");content=content.replace(/"/g,'\\"');return content};this.scanner.scan(function(token,scanner){if(scanner.stag==null){switch(token){case"\n":content=content+"\n";buff.push(put_cmd+'"'+clean(content)+'");');buff.cr();content="";break;case scanner.left_delimiter:case scanner.left_equal:case scanner.left_comment:scanner.stag=token;if(content.length>0){buff.push(put_cmd+'"'+clean(content)+'")')}content="";break;case scanner.double_left:content=content+scanner.left_delimiter;break;default:content=content+token;break}}else{switch(token){case scanner.right_delimiter:switch(scanner.stag){case scanner.left_delimiter:if(content[content.length-1]=="\n"){content=chop(content);buff.push(content);buff.cr()}else{buff.push(content)}break;case scanner.left_equal:buff.push(insert_cmd+"(EJS.Scanner.to_text("+content+")))");break}scanner.stag=null;content="";break;case scanner.double_right:content=content+scanner.right_delimiter;break;default:content=content+token;break}}});if(content.length>0){buff.push(put_cmd+'"'+clean(content)+'")')}buff.close();this.out=buff.script+";";var to_be_evaled="/*"+name+"*/this.process = function(_CONTEXT,_VIEW) { try { with(_VIEW) { with (_CONTEXT) {"+this.out+" return ___ViewO.join('');}}}catch(e){e.lineNumber=null;throw e;}};";try{eval(to_be_evaled)}catch(e){if(typeof JSLINT!="undefined"){JSLINT(this.out);for(var i=0;i<JSLINT.errors.length;i++){var error=JSLINT.errors[i];if(error.reason!="Unnecessary semicolon."){error.line++;var e=new Error();e.lineNumber=error.line;e.message=error.reason;if(options.view){e.fileName=options.view}throw e}}}else{throw e}}}};EJS.config=function(options){EJS.cache=options.cache!=null?options.cache:EJS.cache;EJS.type=options.type!=null?options.type:EJS.type;EJS.ext=options.ext!=null?options.ext:EJS.ext;var templates_directory=EJS.templates_directory||{};EJS.templates_directory=templates_directory;EJS.get=function(path,cache){if(cache==false){return null}if(templates_directory[path]){return templates_directory[path]}return null};EJS.update=function(path,template){if(path==null){return }templates_directory[path]=template};EJS.INVALID_PATH=-1};EJS.config({cache:true,type:"<",ext:".ejs"});EJS.Helpers=function(data,extras){this._data=data;this._extras=extras;extend(this,extras)};EJS.Helpers.prototype={view:function(options,data,helpers){if(!helpers){helpers=this._extras}if(!data){data=this._data}return new EJS(options).render(data,helpers)},to_text:function(input,null_text){if(input==null||input===undefined){return null_text||""}if(input instanceof Date){return input.toDateString()}if(input.toString){return input.toString().replace(/\n/g,"<br />").replace(/''/g,"'")}return""}};EJS.newRequest=function(){var factories=[function(){return new ActiveXObject("Msxml2.XMLHTTP")},function(){return new XMLHttpRequest()},function(){return new ActiveXObject("Microsoft.XMLHTTP")}];for(var i=0;i<factories.length;i++){try{var request=factories[i]();if(request!=null){return request}}catch(e){continue}}};EJS.request=function(path){var request=new EJS.newRequest();request.open("GET",path,false);try{request.send(null)}catch(e){return null}if(request.status==404||request.status==2||(request.status==0&&request.responseText=="")){return null}return request.responseText};EJS.ajax_request=function(params){params.method=(params.method?params.method:"GET");var request=new EJS.newRequest();request.onreadystatechange=function(){if(request.readyState==4){if(request.status==200){params.onComplete(request)}else{params.onComplete(request)}}};request.open(params.method,params.url);request.send(null)}})();EJS.Helpers.prototype.date_tag=function(C,O,A){if(!(O instanceof Date)){O=new Date()}var B=["January","February","March","April","May","June","July","August","September","October","November","December"];var G=[],D=[],P=[];var J=O.getFullYear();var H=O.getMonth();var N=O.getDate();for(var M=J-15;M<J+15;M++){G.push({value:M,text:M})}for(var E=0;E<12;E++){D.push({value:(E),text:B[E]})}for(var I=0;I<31;I++){P.push({value:(I+1),text:(I+1)})}var L=this.select_tag(C+"[year]",J,G,{id:C+"[year]"});var F=this.select_tag(C+"[month]",H,D,{id:C+"[month]"});var K=this.select_tag(C+"[day]",N,P,{id:C+"[day]"});return L+F+K};EJS.Helpers.prototype.form_tag=function(B,A){A=A||{};A.action=B;if(A.multipart==true){A.method="post";A.enctype="multipart/form-data"}return this.start_tag_for("form",A)};EJS.Helpers.prototype.form_tag_end=function(){return this.tag_end("form")};EJS.Helpers.prototype.hidden_field_tag=function(A,C,B){return this.input_field_tag(A,C,"hidden",B)};EJS.Helpers.prototype.input_field_tag=function(A,D,C,B){B=B||{};B.id=B.id||A;B.value=D||"";B.type=C||"text";B.name=A;return this.single_tag_for("input",B)};EJS.Helpers.prototype.is_current_page=function(A){return(window.location.href==A||window.location.pathname==A?true:false)};EJS.Helpers.prototype.link_to=function(B,A,C){if(!B){var B="null"}if(!C){var C={}}if(C.confirm){C.onclick=' var ret_confirm = confirm("'+C.confirm+'"); if(!ret_confirm){ return false;} ';C.confirm=null}C.href=A;return this.start_tag_for("a",C)+B+this.tag_end("a")};EJS.Helpers.prototype.submit_link_to=function(B,A,C){if(!B){var B="null"}if(!C){var C={}}C.onclick=C.onclick||"";if(C.confirm){C.onclick=' var ret_confirm = confirm("'+C.confirm+'"); if(!ret_confirm){ return false;} ';C.confirm=null}C.value=B;C.type="submit";C.onclick=C.onclick+(A?this.url_for(A):"")+"return false;";return this.start_tag_for("input",C)};EJS.Helpers.prototype.link_to_if=function(F,B,A,D,C,E){return this.link_to_unless((F==false),B,A,D,C,E)};EJS.Helpers.prototype.link_to_unless=function(E,B,A,C,D){C=C||{};if(E){if(D&&typeof D=="function"){return D(B,A,C,D)}else{return B}}else{return this.link_to(B,A,C)}};EJS.Helpers.prototype.link_to_unless_current=function(B,A,C,D){C=C||{};return this.link_to_unless(this.is_current_page(A),B,A,C,D)};EJS.Helpers.prototype.password_field_tag=function(A,C,B){return this.input_field_tag(A,C,"password",B)};EJS.Helpers.prototype.select_tag=function(D,G,H,F){F=F||{};F.id=F.id||D;F.value=G;F.name=D;var B="";B+=this.start_tag_for("select",F);for(var E=0;E<H.length;E++){var C=H[E];var A={value:C.value};if(C.value==G){A.selected="selected"}B+=this.start_tag_for("option",A)+C.text+this.tag_end("option")}B+=this.tag_end("select");return B};EJS.Helpers.prototype.single_tag_for=function(A,B){return this.tag(A,B,"/>")};EJS.Helpers.prototype.start_tag_for=function(A,B){return this.tag(A,B)};EJS.Helpers.prototype.submit_tag=function(A,B){B=B||{};B.type=B.type||"submit";B.value=A||"Submit";return this.single_tag_for("input",B)};EJS.Helpers.prototype.tag=function(C,E,D){if(!D){var D=">"}var B=" ";for(var A in E){if(E[A]!=null){var F=E[A].toString()}else{var F=""}if(A=="Class"){A="class"}if(F.indexOf("'")!=-1){B+=A+'="'+F+'" '}else{B+=A+"='"+F+"' "}}return"<"+C+B+D};EJS.Helpers.prototype.tag_end=function(A){return"</"+A+">"};EJS.Helpers.prototype.text_area_tag=function(A,C,B){B=B||{};B.id=B.id||A;B.name=B.name||A;C=C||"";if(B.size){B.cols=B.size.split("x")[0];B.rows=B.size.split("x")[1];delete B.size}B.cols=B.cols||50;B.rows=B.rows||4;return this.start_tag_for("textarea",B)+C+this.tag_end("textarea")};EJS.Helpers.prototype.text_tag=EJS.Helpers.prototype.text_area_tag;EJS.Helpers.prototype.text_field_tag=function(A,C,B){return this.input_field_tag(A,C,"text",B)};EJS.Helpers.prototype.url_for=function(A){return'window.location="'+A+'";'};EJS.Helpers.prototype.img_tag=function(B,C,A){A=A||{};A.src=B;A.alt=C;return this.single_tag_for("img",A)};
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

Storage.prototype.setObject = function(key, value,onload) {
	if(typeof value=='array'||typeof value=='object'){
    	this.setItem(key, JSON.stringify(value));
    }else{
    	this.setItem(key, value);
    }
};
Storage.prototype.getObject = function(key,ret) {//handles both strings and objects now!
	try{
		var d=this.getItem(key);
		if(d){
			if(d.indexOf('{')>=0||d.indexOf('[')>=0){//json
				return JSON.parse(this.getItem(key));
			}else{
				var d=this.getItem(key);
				if(d==='false') d=false;
				if(d==='null') d=null;
				return d;
			}
		}else{
			if(ret==='') return '';
			if(ret===false) return false;
			return (!ret)?{}:[];
		}
    }catch(e){
    	console.log(e.message);
    	return false;
    }
};
String.prototype.stripslashes=function() {
    var str=this;
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
window.modules={};
window.bindings={};
window.bootloader=function(){
	var self=this;
	this.version=4;
	this.splashDisabled=1;
	this.log=function(msg){
		console.log('BOOTLOADER  ===> '+msg);
		self.logs.push(msg);
	}
	this.logs=[];
this.submitLog=function(cb){
		self.loadUrl({
			url:'https://'+window.app_conf.api+'/user/log',
			type:'POST',
			timeout:5000,
			data:{
				obj:{
					text:self.logs.join('\r\n')+'\r\n ======== End BOOTLOADER log ======='
				},
				appid:self.appid,
				token:window.uuid
			},
			error:function(){
				if(cb) cb(false);
			},
			success:function(resp){
				self.log('🔶'+JSON.stringify(resp));
				if(cb) cb(true);
			}
		})
	}
	this.enableOfflineCache=function(){
		self.settings.allowOfflineCache=1;
		self.store.set('bootloader.settings',self.settings,function(success){
				if(success) self.log('🔹 successfully saved bootloader.settings!');
				else self.log('⚠️ Error saving bootloader.settings!');
			})
	}
	this.disableOfflineCache=function(){
		self.settings.allowOfflineCache=0;
		self.store.set('bootloader.settings',self.settings,function(success){
				if(success) self.log('🔹 successfully saved bootloader.settings!');
				else self.log('⚠️ Error saving bootloader.settings!');
			})
	}
	this.getLang=function(){
		var language = window.navigator.userLanguage || window.navigator.language;
		if(!language) language='en';
		var lang=language.split('-');
		var uselang=lang[0];
		if(self.language) uselang=self.language;
		if(!window.app_conf.locs[uselang]) uselang='en';//force to english if we dont have a loc for their lang
		return uselang;
	}
	this.loc=function(key,data){
		var string=window.app_conf.locs[self.getLang()][key];
		if(data){
			for(var ti in data){
				string.replace('['+ti+']',data[ti]);
			}
		}
		return string;
	}
	this.loadUrl=function(opts){
		try{
			// Set up our HTTP request
			var xhr = new XMLHttpRequest();
			//Send the proper header information along with the request
			xhr.timeout = (opts.timeout)?opts.timeout:0;
			// Setup our listener to process completed requests
			xhr.onload = function(){
				// Process our return data
				if(xhr.status>=400){
					if(opts.error) opts.error('api_issue');
					self.log('⚠️ HTTPS => error code: '+xhr.status);
					return false;
				}
				if(opts.json){
					try{
						var json=JSON.parse(xhr.responseText);
						setTimeout(function(){//this ensures the code executed in future will not be part of this try-catch;
							if(json.error){
								if(opts.error) opts.error('api_error',JSON.stringify(json.error));
							}else{
								opts.success(json);
							}
						},1)
					}catch (err){
						self.log(err.message);
						self.log('⚠️ HTTPS => Bad JSON request from ['+opts.url+']');
						if(opts.error) opts.error();
					}
				}else{
					if(opts.success) opts.success(xhr.responseText);
				}
			};
			xhr.onerror=function(){
				if(opts.error) opts.error();
			}
			xhr.ontimeout = function (e) {
			  	if(opts.error) opts.error('timeout');
			};
			// Create and send a GET request
			// The first argument is the post type (GET, POST, PUT, DELETE, etc.)
			// The second argument is the endpoint URL
			if(opts.data&&opts.type=='POST'){
				xhr.open('POST', opts.url,true);
				xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
				xhr.send(self.serialize(opts.data));
			}else{
				xhr.open('GET', opts.url);
				xhr.send();
			}
		}catch(e){
			self.log('catch for loadUrl: '+e.message)
			if(opts.error) opts.error('bad_url');
		}
	}
	this.serialize=function(obj, prefix) {
	  var str = [],
	    p;
	  for (p in obj) {
	    if (obj.hasOwnProperty(p)) {
	      var k = prefix ? prefix + "[" + p + "]" : p,
	        v = obj[p];
	      str.push((v !== null && typeof v === "object") ?
	        self.serialize(v, k) :
	        encodeURIComponent(k) + "=" + encodeURIComponent(v));
	    }
	  }
	  return str.join("&");
	}
	this.setSplashFile=function(data,cb){
		var splashfile=self.store.set('splashfile',data,cb);
	}
	this.loadCache=function(cb){
		var toload=[{
			key:'uuid',
			load:function(uuid){
				window.uuid=uuid;
				self.log('➡️ UUID from local store:'+window.uuid);
			},
			default_value:''
		},{
			key:'udid',
			load:function(udid){
				window.udid=udid;
				self.log('➡️ Device ID ['+udid+']');
			},
			default_value:''
		},{
			key:'lang',
			load:function(lang){
				self.language=lang;
				self.log('➡️ Set language to ['+self.language+']');
			},
			default_value:''
		},{
			key:'bootloader.settings',
			load:function(settings){
				self.settings=settings;
				self.log('➡️ Set settings to ['+JSON.stringify(settings)+']');
			},
			default_value:{
				enableKenBurns:1,
				allowOfflineCache:0
			}
		},{
			key:'bootloader.versions',
			load:function(versions){
				self.versions=versions;
				self.log('➡️ Loaded with versions ['+JSON.stringify(versions)+']');
			},
			default_value:{}
		},{
			key:'bootloader.publicconf',
			load:function(publicconf){
				self.publicconf=publicconf;
			},
			default_value:false
		},{
			key:'bootloader.flowerinfo',
			load:function(flowerinfo){
				self.flowerinfo=flowerinfo;
			},
			default_value:self.getDefaultFlowerInfo()
		},{
			key:'splashfile',
			load:function(file){
				self.log('➡️ Loading Splash File: ['+file+']');
				self.splash=file;
				self.splashStart()
			},
			default_value:''
		}];
		var loaded=0;
		var total=toload.length;
		self.log('🔹 Loading data from NativeStore');
		for (var i = 0; i < toload.length; i++) {
			var item=toload[i];
			self.store.get(item.key,function(data,loadFn){
				loadFn(data);
				loaded++;
				if(loaded==total){
					self.log('🔹 Done Loading data from NativeStore');
					cb();
				}
			},item.default_value,item.load);
		}
	}
	this.getDefaultFlowerInfo=function(){
		return {
			flower_id:window.app_conf.flower_id,
			branch:'master'
		}
	}
	this.init=function(){
		//bindings
		self.init_time=new Date().getTime();
		self.log('=====	BOOTLOADER INIT ======');
		if(window.cordova&&cordova.plugins&&cordova.plugins.DeviceMeta&&cordova.plugins.DeviceMeta.getDeviceMeta){
        cordova.plugins.DeviceMeta.getDeviceMeta(function(device_info){
            if(device_info.debug){
            	self.isSandbox=true;//is sandbox/testflight mode
            	self.log('⌛️ Sandbox Mode !!!');
            }else{
            	self.log('⌛️ NON Sandbox Mode !!!');
            	self.isSandbox=false;
            }
        })
    }else{
    		self.log('⌛️ NON Sandbox Mode !!!');
        self.isSandbox=false;
    }
		self.file.init();//for web!
		if(!isPhoneGap()){
			self.addClass(document.getElementById('splashlogo'),'kenburns');
		}
		self.loadCache(function(){
			self.bind();
			// new way, fallback for if we lost store.
	        if(!window.uuid) {
	            window.uuid=Math.uuid(20,16);
                self.store.set('uuid',window.uuid,function(){
                    self.log('➡️ No UUID loaded from store. Created and saving new uuid of '+window.uuid);
                });
	        }
	        if(window.app_conf.load_library){//phonegap method that allows caching

	        // -> hash, md5 of the file
					// -> key, key to store/cache
					// -> url, url to load combined data from
					// -> urls, css:[] and js:[] files to load for dev
					// -> length: file length for cache check
					// -> type: [jsonp,app]
					// -> templates, dev way of loading templates, they wil
					self.log('🔹 [CACHE] Loading libraries from app distribution');
	        	self.addConf({
	        		key:'libraries',
	        		urls:{
	        			css:['dist/libraries.css'],
	        			js:['dist/libraries.js'],
	        			font:['dist/libraries_font.css']
	        		}
	        	},false,function(){
	        		//if not
	        		self.log('✅ [CACHE] loaded libraries from app distribution');
	        		if(self.publicconf&&self.publicconf.loader&&self.versions&&self.versions.conf&&self.versions.conf[self.publicconf.loader.key]||!self.publicconf.combined){
	        			self.loadConf({
			            	error:self.showErrorScreen,
			            	success:function(){
			            		if(self.publicconf.app) self.addConf(self.publicconf.app,false,function(success){
				            			if(success) self.cachePublicConf();
				            		});
				            		else{
				            			if(window.one_core) one_core.init();
				            		}
			            	}
			            });
	        		}else{
	        				self.log('🔹 [CACHE] Loading core from app distribution');
		        			self.addConf({
				        		key:'core',
				        		urls:{
				        			css:['dist/core.css'],
				        			js:['dist/core.js','dist/core_templates.js'],
				        			font:['dist/core_font.css']
				        		}
				        	},false,function(){
				        		self.log('✅ [CACHE] loaded core from app distribution');
				        		self.coreLoaded=1;
				        		self.loadConf({
				            	error:self.showErrorScreen,
				            	success:function(){
				            		if(self.publicconf.app) self.addConf(self.publicconf.app,false,function(success){
				            			if(success) self.cachePublicConf();
				            		});
				            		else{
				            			if(window.one_core) one_core.init();
				            		}
				            	}
				            });
				        	});
		        	}
	        	})
	        }else{
		        self.loadConf({
	            	error:self.showErrorScreen,
	            	success:function(){
	            		if(self.publicconf.app) self.addConf(self.publicconf.app,false,function(success){
	            			if(success) self.cachePublicConf();
	            		});
	            		else{
	            			if(window.one_core) one_core.init();
	            		}
	            	}
	            });
		    }
		})
	}
	this.bind=function(){
		/*Load in settings*/
        window.version=window.app_conf.version;
        if(window.app_conf.isdev){
            window.devpush=1;
            window.isDev=true;
        }
        self.appid=window.app_conf.appid;
        if(window.device) document.body.className+=' isPhoneGap '+device.platform+'_app'
        //keep status bar on android loading or it jumps around
        if(window.StatusBar&&window.device.platform ==='iOS') window.StatusBar.hide(); 
		if(!self.bound){
			// if(window.app_conf && window.app_conf.theme_color){
			// 	document.body.style.backgroundColor='#'+window.app_conf.theme_color
			// }
			document.getElementById('freezeretry').addEventListener('click',function(){
				window.location.href=window.location.href+'?reload';
	            return false;
			})
			document.getElementById('freezecontact').addEventListener('click',function(){
				if(!self.hasClass(document.getElementById('freezecontact'),'sent')&&!self.hasClass(document.getElementById('freezecontact'),'sending')){
					document.getElementById('freezecontacterror').innerHTML='';
					document.getElementById('freezecontacterror').style.display='none';
					document.getElementById('freezecontactbutton').innerHTML=self.loc('freeze_bad_app_sending');
					self.addClass(document.getElementById('freezecontact'),'sending');//only allow sending once
					self.submitLog(function(success){
						self.removeClass(document.getElementById('freezecontact'),'sending');//only allow sending once
						if(success){
							self.addClass(document.getElementById('freezecontact'),'sent');//only allow sending once
							document.getElementById('freezecontact').innerHTML=self.loc('freeze_bad_app_submit');
						}else{
							document.getElementById('freezecontactbutton').innerHTML='<u>'+self.loc('freeze_bad_app_contact')+'</u>';
							document.getElementById('freezecontacterror').style.display='block';
							document.getElementById('freezecontacterror').innerHTML=self.loc('freeze_bad_app_submit_error');
						}	
					});
				}
			})
			// document.getElementById('freezecontactemail').addEventListener('click',function(){
			// 	//show mail contact
			// 	window.plugins.socialsharing.shareViaEmail(
	  //             ' ', // can contain HTML tags, but support on Android is rather limited:  http://stackoverflow.com/questions/15136480/how-to-send-html-content-with-image-through-android-default-email-client
	  //             'App load issue ('+window.uuid+')',
	  //             [window.app_conf.app_contact_email],//[email1,email2]
	  //             null, // CC: must be null or an array
	  //             null, // BCC: must be null or an array
	  //             null, // FILES: can be null, a string, or an array
	  //             function(){
	  //               self.log('email sent ok');
	  //             }, // called when sharing worked, but also when the user cancelled sharing via email (I've found no way to detect the difference)
	  //             function(){
	  //               self.log('email plugin failed');
	  //             } 
	  //           );
	  //           return false;
	  //       });
			self.bound=true;
		}
	}
	this.setCSS=function(ele,style){
		Object.assign(ele.style, style);
	}
	this.webSplash=function(){

	}
	this.splashStart=function(){
				if(self.splashDisabled) return console.log('=====Splash Disabled');
        if(isPhoneGap()){
	        if(self.splash&&self.splash.id){//mobile app--but not on first boot.  Only happens if there is a saved splash file.
	        	if(!self.splash.delay) self.splash.delay=2;
	            self.log('Using Replacement Splash.  Delay is '+self.splash.delay,1);
	            document.getElementById('splashlogo').style.backgroundImage='url('+self.splash.src+')';
	            document.getElementById('splashlogo').style.display='block';
	            if(self.splash&&self.splash.kenburns){
		        	if(self.settings.enableKenBurns) self.addClass(document.getElementById('splashlogo'),'kenburns');
		        }
	        }else{//no self splash info saved yet.  This is the mobile app on first boot or web before fetching image    
	            self.log('First Boot Splash',1);
	             //new builds will use splash as init screen, no need for default_splash 
	            document.getElementById('splashlogo').style.backgroundImage='url("dist/default_splash.jpg")';
	            if(window.app_conf && window.app_conf.splash_style=='cover') {
	            	self.addClass(document.getElementById('splashlogo'),'coverimg');
	            	self.removeClass(document.getElementById('splashlogo'),'containimg');
	            	document.getElementById('splashlogo').style.bottom=0;
	            }
	            document.getElementById('splashlogo').style.display='block';
	            if(self.settings.enableKenBurns) self.addClass(document.getElementById('splashlogo'),'kenburns');
	        }
	        self.hideSplash();
	    }
    }
    this.hideSplash=function(){
        if(window.navigator.splashscreen){
            setTimeout(function(){
                window.navigator.splashscreen.hide();
            },300);
        }
    }
    this.hidePhotoSplash=function(){
    	if(document.getElementById('splash')) document.getElementById('splash').style.display='none';
    }
    this.reloadCorePassively=function(cb,ecb){
    	self.log('🔹 Reloading core Passively');
			self.loadConf({
				force:1,
				cacheOnly:1,
				success:function(){
					//load app too!!!
					if(self.publicconf.app) self.loadFile(self.publicconf.app,function(){
						self.log('🔹 Successfully cached [app]');
						self.cachePublicConf();
						if(cb) cb();
					})
				},
				error:ecb
			})
    }
    //load_conf_settings.force, //bypass public conf cache
    //load_conf_settings.cacheOnly //do not load code to DOM or call loader after code is loaded!
    //load_conf_settings.success //successfully cached code callback
    //load_conf_settings.error //error callback
	this.loadConf=function(load_conf_settings){
		self.log('🔹 loadConf');
		if(!load_conf_settings) load_conf_settings={};
		//if we already have the public conf, try to load cached code!
		if(self.publicconf&&self.publicconf.vars&&self.publicconf.combined&&!load_conf_settings.force&&self.settings.allowOfflineCache){//disable this for now,
			self.log('✅ Loading Public Conf from Cache!!!');
			return self.processConf(load_conf_settings);
		}
		var url=self.getUrl();
		self.startTime=new Date().getTime();
		self.log('🔹 Loading conf url ['+url+']');
		self.loadUrl({
			url:url,
			timeout:25000,//for offline first mode, just give plenty of time to load
			json:1,
			error:function(err,reason){
				//show load error!
				if(reason) self.log(reason);
				if(load_conf_settings.error) load_conf_settings.error(err,reason);
			},
			success:function(resp){
				//check response
				self.log('🔹 Loaded Public Conf');
				self.publicconf=resp;
				//we need to cache the response!!!
				self.processConf(load_conf_settings);
			}
		})
	}
	this.setFlowerInfo=function(info,cb){
		self.store.set('bootloader.flowerinfo',info,function(success){
			if(success){
				self.flowerinfo=info;
				if(cb) cb()
			}else{
				alert('error saving flowerinfo');
			}
		});
	}
	this.clearPublicConf=function(){
		self.store.delete('bootloader.publicconf',function(success){
			if(success) self.log('🔹 Successfully deleted bootloader.publicconf');
			else self.log('⚠️ error deleted bootloader.publicconf');
		});
	}
	this.cachePublicConf=function(){
		if(!self.settings.allowOfflineCache){
			self.log('🔹 cachePublicConf Disabled for now');
			return false;
		}
		if(self.publicconf.combined) self.store.set('bootloader.publicconf',self.publicconf,function(success){
			if(success) self.log('🔹 Successfully saved bootloader.publicconf');
			else self.log('⚠️ Error saving bootloader.publicconf');
		});
	}
	//data object for bootloader.versions
	/*
		{
			conf:{
				[key]:{
					hash:<hash>,// this is the loaded hash version reflective of the hash of the currently stored file
					filelength:<file string length>
				},
				...
			},
			hash:{ // this is the latest hash, it can be set in a ping in app.js.  This is compared on the next reload.
				[key]:<hash> //a change to this is compared against conf.key.hash.  if 
			}
		}
	*/
	// examples: 'conf',{key:'loader',conf:{...}},cb
	// examples: 'hash',{<key> loader:'<hash>',<key> app:'<hash>'} //give ability to set multiple hashes at a time
	// examples: 'delete',false,function(){} //used to drop the entire bootloader cache, files will eventually overwrite, no need to delete
	this.setVersionInfo=function(type,conf,cb){
		if(type=='delete'){
			//delete files referenced???
			self.store.delete('bootloader.versions',cb);
		}else{
			self.store.get('bootloader.versions',function(versions){
				if(type=='clear'){
					//remove file??
					if(versions.conf&&versions.conf[conf.key]) delete versions.conf[conf.key];
					if(versions.hash&&versions.hash[conf.key]) delete versions.hash[conf.key];
				}
				if(type=='hash'){
					if(!versions.hash) versions.hash={}
					Object.assign(versions.hash, conf);
					self.log('🔹 Set bootloader.versions.hash to ['+JSON.stringify(versions.hash)+']');
				}
				if(type=='conf'){
					if(!versions.conf) versions.conf={};
					if(!versions.hash) versions.hash={}
					versions.conf[conf.key]=conf.data;
					versions.hash[conf.key]=conf.data.hash;
					self.log('🔹 Set bootloader.versions.conf.'+conf.key+' to ['+JSON.stringify(conf.data)+'] hash ['+conf.data.hash+']');
				}
				self.versions=versions;
				self.store.set('bootloader.versions',versions,function(success){
					if(success) self.log('🔹 successfully saved bootloader.versions!');
					else self.log('⚠️ Error saving bootloader.versions!');
					if(cb) cb(success);
				})
			},{})
		}
	}
	//this.addedConfs=[];
	this.addConf=function(conf,ip_address,cb){
		if(!conf){
			self.log('⚠️ Blank Conf!');
			if(ip_address.indexOf('localhost')>=0){
				self.showErrorScreen('blank_conf','Invalid Conf. Is your local serve-flower running?');
			}else{
				self.showErrorScreen('blank_conf','Invalid Conf.');
			}
			return false;
		}
		//if(self.addedConfs.indexOf(conf.key)>=0) return cb(true);//already loaded this code
		self.loadFile(conf,function(code,err){
			if(code){
				if(conf.combined){
					self.log('🔹 Got ['+conf.key+'], try to load it!');
					//add code to dom now!
					self.loadCode(conf.key,code,conf,function(success,err){
						if(success){
							self.log('🔹 Successfully Loaded Code for ['+conf.key+']');
							//load in additional info!
							if(conf.entry) window[conf.entry.scope][conf.entry.function]();
							else if(conf.appEntry){
								if(window.phi) phi.init(conf.appEntry);
								else self.log('⚠️ PHI not available to register app!');
							}else{
								self.log('⚠️ No Entry methods found for ['+conf.key+']');
							}
							//self.addedConfs.push(conf.key);
							cb(true);
						}else{
							self.log('⚠️ Error loading code for ['+conf.key+']');
							cb(false);
							//thow into error state
						}
					})
				}else{//we already have code
					self.log('🔹 Successfully Loaded Code for ['+conf.key+']');
					if(conf.entry) window[conf.entry.scope][conf.entry.function]();
					else if(conf.appEntry){
						if(window.phi) phi.init(conf.appEntry);
						else self.log('⚠️ PHI not available to register app!');
					}else{
						self.log('⚠️ No Entry methods found for ['+conf.key+']');
					}
					//self.addedConfs.push(conf.key);
					cb(true);
				}
			}else{
				//alert(err);
				self.log('⚠️ Error loading code for ['+conf.key+'] ['+err+']');
				cb(false);
			}
		},ip_address);
	}
	this.processConf=function(load_conf_settings,libraries_processed){
		if(self.publicconf.libraries&&!libraries_processed){
			self.loadFile(self.publicconf.libraries,function(code,err,templates){
				if(load_conf_settings.cacheOnly){
					self.processConf(load_conf_settings,1);
				}else{
					if(code){
						if(self.publicconf.combined){
							self.log('🔹 Got [libraries], try to load it!');
							//add code to dom now!
							self.loadCode('libraries',code,self.publicconf.libraries,function(success,err){
								if(success){
									self.log('🔹 Successfully Loaded Code for [libraries]');
									//load in additional info!
									if(self.publicconf.libraries.entry){
										if(window[self.publicconf.libraries.entry.scope]) window[self.publicconf.libraries.entry.scope][self.publicconf.libraries.entry.function](self.publicconf.vars);
										else self.log('⚠️ Entry methods found for ['+self.publicconf.libraries.key+'] invalid ['+self.publicconf.libraries.entry.scope+']');
									}else{
										self.log('⚠️ No Entry methods found for ['+self.publicconf.libraries.key+']');
									}
									self.processConf(load_conf_settings,1);
									//if(load_conf_settings.success) load_conf_settings.success();
								}else{
									self.log('⚠️ Error loading code for [libraries]');
									//thow into error state
									if(load_conf_settings.error) load_conf_settings.error(err);
								}
							})
						}else{//we already have code
							self.log('🔹 Successfully Loaded Code for [libraries]');
							if(self.publicconf.libraries.entry) window[self.publicconf.libraries.entry.scope][self.publicconf.libraries.entry.function](self.publicconf.vars,self.publicconf.templates);
							self.processConf(load_conf_settings,1);
							//if(load_conf_settings.success) load_conf_settings.success();
						}
					}else{
						self.showErrorScreen(err);
					}
				}
			})
		}else if(!self.coreLoaded&&self.publicconf.core){
			self.log('🔹 Load [core]');
			self.loadFile(self.publicconf.core,function(code,err,templates){
				if(load_conf_settings.cacheOnly){
					if(load_conf_settings.success) load_conf_settings.success();
				}else{
					if(code){
						if(self.publicconf.combined){
							self.log('🔹 Got [core], try to load it!');
							//add code to dom now!
							self.loadCode('core',code,self.publicconf.core,function(success,err){
								if(success){
									self.log('🔹 Successfully Loaded Code for [core]');
									//load in additional info!
									if(self.publicconf.core.entry){
										if(window[self.publicconf.core.entry.scope]) window[self.publicconf.core.entry.scope][self.publicconf.core.entry.function](self.publicconf.vars);
										else self.log('⚠️ Entry methods found for ['+self.publicconf.core.key+'] invalid ['+self.publicconf.core.entry.scope+']');
									}else{
										self.log('⚠️ No Entry methods found for ['+self.publicconf.core.key+']');
									}
									if(load_conf_settings.success) load_conf_settings.success();
								}else{
									self.log('⚠️ Error loading code for [core]');
									//thow into error state
									if(load_conf_settings.error) load_conf_settings.error(err);
								}
							})
						}else{//we already have code
							self.log('🔹 Successfully Loaded Code for [core]');
							if(self.publicconf.core.entry) window[self.publicconf.core.entry.scope][self.publicconf.core.entry.function](self.publicconf.vars,self.publicconf.templates);
							if(load_conf_settings.success) load_conf_settings.success();
						}
					}else{
						self.showErrorScreen(err);
					}
				}
			});
		}else if(self.publicconf.loader){
			self.loadFile(self.publicconf.loader,function(code,err,templates){
				if(load_conf_settings.cacheOnly){
					if(load_conf_settings.success) load_conf_settings.success();
				}else{
					if(code){
						if(self.publicconf.combined){
							self.log('🔹 Got [loader], try to load it!');
							//add code to dom now!
							self.loadCode('loader',code,self.publicconf.loader,function(success,err){
								if(success){
									self.log('🔹 Successfully Loaded Code for [loader]');
									//load in additional info!
									if(self.publicconf.loader.entry){
										if(window[self.publicconf.loader.entry.scope]) window[self.publicconf.loader.entry.scope][self.publicconf.loader.entry.function](self.publicconf.vars);
										else self.log('⚠️ Entry methods found for ['+self.publicconf.loader.key+'] invalid ['+self.publicconf.loader.entry.scope+']');
									}else{
										self.log('⚠️ No Entry methods found for ['+self.publicconf.loader.key+']');
									}
									if(load_conf_settings.success) load_conf_settings.success();
								}else{
									self.log('⚠️ Error loading code for [loader]');
									//thow into error state
									if(load_conf_settings.error) load_conf_settings.error(err);
								}
							})
						}else{//we already have code
							self.log('🔹 Successfully Loaded Code for [loader]');
							if(self.publicconf.loader.entry) window[self.publicconf.loader.entry.scope][self.publicconf.loader.entry.function](self.publicconf.vars,self.publicconf.templates);
							else self.log('⚠️ No Entry methods found for ['+self.publicconf.loader.key+']');
							if(load_conf_settings.success) load_conf_settings.success();
						}
					}else{
						self.showErrorScreen(err);
					}
				}
			});
		}else{
			load_conf_settings.success();//we already have libraries, loader, and/or core loaded
		}
	}
	this.onCodeError=function(key,err,e){
		if(e) console.warn(e);
		self.log('⚠️ Error in code ['+key+'] ['+err+']');
		//self.submitLog();
		if(self.codeCallbacks[key]) self.codeCallbacks[key](false,'code');
		self.setVersionInfo('clear',{
			key:key
		},function(success){
			if(success) self.log('🔹 Successfully cleared bootloader.versions.conf.'+key+' and bootloader.versions.hash.'+key);
			else self.log('⚠️ Error clearing bootloader.versions.conf/hash ['+key+'] ['+err+']');
		})
	}
	this.onCodeSuccess=function(key,data){
		if(self.codeCallbacks[key]) self.codeCallbacks[key](data);
	}
	this.loadCode=function(key,data,fileconf,cb){
		//check hash
		//register callback!
		self.codeCallbacks[key]=cb;
		if(fileconf.type=='jsonp'){//we know there is a callback, add to dom and let it hanlde itself
			if(!data){
				self.log('⚠️ Error loading code ['+key+'] - no string to add!');
				return self.onCodeError(key);
			}
			//add JS
			var head = document.getElementsByTagName('head')[0];
	        var script = document.createElement('script');
	        script.type = 'text/javascript';
	        script.text = 'try{'+data+';\r\nwindow._bootloader.onCodeSuccess("'+key+'",1)}catch(err){window._bootloader.onCodeError("'+key+'",err.message,err)}';
			head.appendChild(script);
		}else if(fileconf.type=='dna'){
			try{
				var dataparts=data.split('~~~~~');//code separator
				var codeobj={};
				for (var i = 0; i < dataparts.length; i++){
					if(i>=1){
						if(i%2==1){
							var name=dataparts[i];
						}else{
							codeobj[name]=dataparts[i];
						}
					}
				}
				delete dataparts;//memory saving!
				//now add to dom!
				if(codeobj.templates) self.processTemplates(codeobj.templates);
				if(codeobj.font){
					self.loadSource({type:'css',text:codeobj.font});
				}
				if(codeobj.cachedFont){
					self.loadSource({type:'css',text:codeobj.cachedFont});
				}
				if(codeobj.css){
					self.loadSource({type:'css',text:codeobj.css});
				}
				if(codeobj.js){
					var head = document.getElementsByTagName('head')[0];
	        		var script = document.createElement('script');
	        		script.type = 'text/javascript';
			        script.text = 'try{'+codeobj.js+';\r\nwindow._bootloader.onCodeSuccess("'+key+'",1)}catch(err){window._bootloader.onCodeError("'+key+'",err.message,err)}';
					head.appendChild(script);
				}else{//case we are not loading JS
					self.onCodeSuccess(key,1);
				}
			}catch(err){
				self.onCodeError(key,err.message);
			}
		}else if(fileconf.type=='json'){
			try{
				if(typeof data=='object'){
					var codeobj=data;//its already been parsed!!!
				}else{
					var codeobj=JSON.parse(data);
				}
				//now add to dom!
				if(codeobj.font){
					self.loadSource({type:'css',text:codeobj.font});
				}
				if(codeobj.css){
					self.loadSource({type:'css',text:codeobj.css});
				}
				if(codeobj.js){
					var head = document.getElementsByTagName('head')[0];
	        		var script = document.createElement('script');
	        		script.type = 'text/javascript';
			        script.text = 'try{'+codeobj.js+';\r\nwindow._bootloader.onCodeSuccess("'+key+'",1)}catch(err){window._bootloader.onCodeError("'+key+'",err.message,err)}';
					head.appendChild(script);
				}else{//case we are not loading JS
					self.onCodeSuccess(key,1);
				}
			}catch(err){
				self.onCodeError(key,err.message);
			}
		}
	}
	this.codeCallbacks={};
	this.counts={}
	//✅🔶⚠️
	// file conf will have
	// -> hash, md5 of the file
	// -> key, key to store/cache
	// -> url, url to load combined data from
	// -> urls, css:[] and js:[] files to load for dev
	// -> length: file length for cache check
	// -> type: [jsonp,app]
	// -> templates, dev way of loading templates, they will be returned in conf.  As we may or may not have app/ejs loaded, we will return the tempaltes in callback to handle
	this.loadFile=function(fileconf,cb,ip_address,retry){
		if(fileconf.combined){
			var conf=(self.versions&&self.versions.conf&&self.versions.conf[fileconf.key])?self.versions.conf[fileconf.key]:false;
			var hash=(self.versions&&self.versions.hash&&self.versions.hash[fileconf.key])?self.versions.hash[fileconf.key]:false;
			self.log('🔹 fileconf.hash ['+fileconf.hash+'], bootloader.versions.hash.'+fileconf.key+' ['+hash+'], bootloader.versions.conf.'+fileconf.key+' == '+JSON.stringify(conf));
			if(conf&&conf.hash&&conf.hash==fileconf.hash&&conf.hash==hash){//we have file stored locally and we havent incrimented hash
				self.file.get(fileconf.key+'.txt',function(data,err){
					if(data){
						//compare length!!! basic check
						if(conf.filelength==data.length){
							self.log('✅ [CACHE] Got File ['+fileconf.key+'], load it!');
							cb(data);
						}else{
							self.log('⚠️ File ['+fileconf.key+'.txt'+'] length didnt match!!');
							//this is immediately retryable, clear our cache and retry via network

							self.setVersionInfo('clear',{
								key:fileconf.key
							},function(success){
								if(success){
									self.log('🔹 Successfully cleared bootloader.versions.conf.'+fileconf.key+' and bootloader.versions.hash.'+fileconf.key);
									if(!retry) self.loadFile(fileconf,cb,1);//possibility for endless loop here!!!!! only do once before fail!
									else cb(false);
								}else{
									self.log('⚠️ Error clearing bootloader.versions.conf/hash ['+fileconf.key+']');
									cb(false);
								}
							})
							// self.store.delete('bootloader.'+fileconf.key,function(success){
							// 	if(success){
							// 		self.loadFile(fileconf,cb);//possibility for endless loop here!!!!! only do once before fail!
							// 	}else{
							// 		self.showErrorScreen('store.delete failed!');
							// 	}
							// })
						}
					}else{
						self.log('⚠️ Error getting file ['+fileconf.key+'.txt'+'] ['+err+']');
						//this is immediately retryable, clear our cache and retry via network
						self.versions.conf[fileconf.key]=false;
						self.versions.hash[fileconf.key]=false;//clear out local version to force update!
						self.setVersionInfo('clear',{
								key:fileconf.key
							},function(success){
								if(success){
									self.log('🔹 Successfully cleared bootloader.versions.conf.'+fileconf.key+' and bootloader.versions.hash.'+fileconf.key);
									if(!retry) self.loadFile(fileconf,cb,1);//possibility for endless loop here!!!!! only do once before fail!
									else cb(false);
								}else{
									self.log('⚠️ Error clearing bootloader.versions.conf/hash ['+fileconf.key+']');
									cb(false);
								}
							})
						// self.store.delete('bootloader.'+fileconf.key,function(success){
						// 	if(success){
						// 		self.loadFile(fileconf,cb);
						// 	}else{
						// 		self.showErrorScreen('store.delete failed!');
						// 	}
						// })
					}
				})
			}else{//we dont have up-to-date code, load via URL
				self.loadUrl({
					url:fileconf.url,
					timeout:(fileconf.timeout)?fileconf.timeout:25000,
					error:function(err){
						//show load error!
						self.log('⚠️ [TIMEOUT] loading['+fileconf.url+']');
						cb(false,err);
					},
					success:function(resp){
						self.log('✅ [NETWORK] Successfully loaded ['+fileconf.key+']');
						if(fileconf.filelength&&fileconf.filelength!=resp.length){//whoa there 
							self.log('⚠️ Whoa there, we just recieved a file with a length not what we were expecting.  Dont let it load!');
							cb(false,'code');
						}else{
							cb(resp);
							//try to cache, this is passive because the rest of the load isnt dependant on this
							self.file.set(fileconf.key+'.txt',resp,function(saved,err){
								if(saved){
									//once it is cached, set nativeStore with cached info!
									self.setVersionInfo('conf',{
										key:fileconf.key,
										data:{
											hash:fileconf.hash,//for checking from server
											filelength:resp.length//pre-check on client
										}
									})
								}else{
									self.log('⚠️ Error saving file ['+fileconf.key+'.txt'+'] ['+err+']');
									//passive, if this fails, we should still be able to load alright
									//self.submitLog();
								}
							})
						}
					}
				})
			}
		}else{//dev mode
			self.log('🔹 Load Non-combined file conf ['+fileconf.key+']');
			if(fileconf.code){
				if(fileconf.code.js) self.loadSource({type:'js', text:fileconf.code.js});
				if(fileconf.code.css) self.loadSource({type:'css', text:fileconf.code.css});
				self.processTemplates(fileconf.code.templates);
				self.log('🔹 LOADING ALL DONE!');
			    cb(true,false);//in the unlikely event we dont have any js files to load
			}else{
				if(fileconf.urls.font&&fileconf.urls.font.length) fileconf.urls.font.map((src)=>self.loadSource({type:'css', src:((ip_address)?ip_address+'/':'')+src+'?t='+new Date().getTime()}));
				if(fileconf.urls.css&&fileconf.urls.css.length) fileconf.urls.css.map((src)=>self.loadSource({type:'css', src:((ip_address)?ip_address+'/':'')+src+'?t='+new Date().getTime()}));
				if(fileconf.urls.templates&&fileconf.urls.templates.length) fileconf.urls.templates.map((src)=>self.loadSource({type:'template', src:((ip_address)?ip_address+'/':'')+src+'?t='+new Date().getTime()}));
				self.counts[fileconf.key]={
			    	total:fileconf.urls.js.length,
			    	count:0
			    }
				if(fileconf.urls.js&&fileconf.urls.js.length){
					Promise.all(fileconf.urls.js.map(function(src){
						self.log('🔹 loading JS: '+((ip_address)?ip_address+'/':'')+src+'?t='+new Date().getTime());
						return self.loadSource({type:'js', src:((ip_address)?ip_address+'/':'')+src+'?t='+new Date().getTime()}).then(function(){
						self.counts[fileconf.key].count++;
			            self.log('🔹 finished adding JS ('+self.counts[fileconf.key].count+'/'+self.counts[fileconf.key].total+')- '+src);
			            //self.log('🔹 LOADER: finished adding JS ('+self.counts[fileconf.key].count+'/'+self.counts[fileconf.key].total+')- '+src);
					})})).then(e=>{
						self.processTemplates(fileconf.templates);
		                self.log('🔹 LOADING ALL DONE!');
			            cb(true,false);//in the unlikely event we dont have any js files to load
		            }).catch((e)=>function(){
		            	console.log(e);
		            	self.log('⚠️ Error loading dev file!');
						cb(false,'timeout');
		            })
			    }else{
			    	cb(true,false);//in the unlikely event we dont have any js files to load
			    }
			}
		}
	}
	this.processTemplates=function(templates,force){
		self.log('🔹 Processing templates!');
		if(!templates) return true;
		if(!window.templates) window.templates={};
		var tpls=templates.split('@@@');
        var cn='';
        for (var i = 1; i <= tpls.length-1; i++) {
            if(i>0){
                if(i%2==1){ //name
                    cn=tpls[i];
                }else{
                	if(!window.templates[cn]||force){
                		try{
                			window.templates[cn]=new EJS({text:tpls[i].stripslashes()});
                		}catch(e){
                			console.log('⚠️ Error with template ['+cn+']');
                			console.log(tpls[i].stripslashes())
                			console.warn(e);
                		}
                	}else console.warn('⚠️ The template name ['+cn+'] is already in use!')
                }
            }
        };
	}
	this.callbacks={};
	this.loadSource=function(obj,cb){
		var request_timeout='';
	    if(obj.type=='css'){
	        var oHead = document.getElementsByTagName('head')[0];
	        if(obj.src){
		        var tag = document.createElement('link');
		        tag.type = 'text/css';
		        tag.rel='stylesheet';
		        tag.href = obj.src;
		    }
	        if(obj.text){
	        	var tag = document.createElement('style');
	        	tag.type = 'text/css';
	        	tag.appendChild(document.createTextNode(obj.text));
	        }
	        oHead.appendChild(tag);
	    }
	    if(obj.type=='js'){
	        return new Promise(function (resolve, reject) {
                let script = document.createElement('script');
                script.type = 'text/javascript';
                if(obj.text){
	        		script.appendChild(document.createTextNode(obj.text));
	        		document.head.appendChild(script);
                	resolve();
                }else if(obj.src){
	                script.src = obj.src;
	                script.async = false;
	                script.onload = resolve;
	                script.onerror = reject;
	                setTimeout(function(){
	                	reject();
	                },10000);
	                document.head.appendChild(script);
	            }
            });
	    }
	    if(obj.type=='js_module'){
	        return new Promise(function (resolve, reject) {
                let script = document.createElement('script');
                script.type = 'module';
                //script.src = obj.src;
                script.async = false;
                script.onerror = reject;
                var uid=Math.uuid(8);
                if(obj.importAs.length==1){
                	script.appendChild(document.createTextNode('import '+obj.importAs[0]+' from "'+obj.src+'";window["'+obj.importAs[0]+'"]='+obj.importAs[0]+';_bootloader.jsModuleHooks["'+uid+'"]()'));
                }else{
                	script.appendChild(document.createTextNode('import {'+obj.importAs.join(',')+'} from "'+obj.src+'"'));
                }
                self.jsModuleHooks[uid]=resolve;
                document.head.appendChild(script);
                setTimeout(function(){
                	reject();
                },10000);

            });
	    }
	}
	this.jsModuleHooks={};
	this.hasClass=function(ele,cls) {
		if(!ele||!ele.className) return false;
	  return !!ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
	}

	this.addClass=function(ele,cls) {
		if(!ele||!ele.className) return false;
	  if (!self.hasClass(ele,cls)) ele.className += " "+cls;
	}
	this.setClass=function(ele,cls) {
		if(!ele||!ele.className) return false;
	  ele.className =cls;
	}
	this.removeClass=function(ele,cls) {
	  if (self.hasClass(ele,cls)) {
	    var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
	    ele.className=ele.className.replace(reg,' ');
	  }
	}
	this.showErrorScreen=function(err,msg){
		self.log('🔶 show error screen ['+err+'] ['+msg+']');
		if(err=='timeout'){
			document.getElementById('appalert').innerHTML='<div style="font-size:13px;" class="top_padding">'+self.loc('freeze_bad_internet_title')+'</div>';
			//self.setClass(document.getElementById('freezeicon'),'icon2-tower');
			document.getElementById('freezemaincallout').innerHTML=self.loc('freeze_bad_internet_main');
			document.getElementById('freezesecondarycallout').innerHTML=self.loc('freeze_bad_internet_secondary');
			document.getElementById('freezebutton').innerHTML=self.loc('freeze_retry');
			document.getElementById('freezeretry').style.display='block';
			document.getElementById('freezecontact').style.display='none';
		}else{
			document.getElementById('appalert').innerHTML='<div style="font-size:13px;" class="top_padding">'+self.loc('freeze_bad_app_load_main')+'</div>';
			//self.addClass(document.getElementById('freezeicon'),'icon2-warning-sign');
			document.getElementById('freezemaincallout').innerHTML=self.loc('freeze_bad_app_load_main');
			document.getElementById('freezesecondarycallout').innerHTML=self.loc('freeze_bad_app_load_secondary')+((msg)?'<br/><br/>MSG: '+msg:'');
			document.getElementById('freezecontactbutton').innerHTML='<u>'+self.loc('freeze_bad_app_contact')+'</u>';
			document.getElementById('freezebutton').innerHTML=self.loc('freeze_retry');
			document.getElementById('freezecontact').style.display='block';
		}
		if(err=='code'){//also clear out public conf
			self.log('🔶 Problem was with either loader or app code!  clear out publicconf so we know the reload will always get the latest publicconf/versions');
			self.store.delete('bootloader.publicconf',function(success){//force getting from URL
    			self.publicconf=false;
    			if(success) self.log('🔶🔶🔶 successfully cleared publicconf');
    			else self.log('⚠️⚠️⚠️ Error clearing publicconf BAD!!!!');
    		})
		}
		document.getElementById('freezecontactemail').innerHTML=self.loc('need_help')+ ' '+window.app_conf.app_contact_email;
		if(window.StatusBar) window.StatusBar.show();
		document.getElementById('appfreeze').style.display='block';
		document.getElementById('appalert').style.display='block';
		if(self.splash&&self.splash.fallback) document.getElementById('required_icon').innerHTML=self.splash.fallback;
        window.setTimeout(function(){
        	self.removeClass(document.getElementById('freeze_refresh_icon'),'animate-spin')
        },1000);
        self.addClass(document.body,'systemmessage');
        if(window.navigator.splashscreen) {
        	self.log('hide splash screen');
            window.navigator.splashscreen.hide();
        }
        document.getElementById('splash').style.display='none';
	}
	this.hideErrorScreen=function(){
		self.removeClass(document.body,'systemmessage');
		document.getElementById('appfreeze').style.display='none';
		document.getElementById('appalert').style.display='none';
	}
	this.getUrl=function(){
		var url='https://'+window.app_conf.api+'/conf/'+((window.app_conf.core)?window.app_conf.core:window.app_conf.id);
		var qs={};
		qs.appid=self.appid;
        qs.token=window.uuid;
        qs.lang=self.getLang();
        qs.bootloader=self.version;
        qs.mobile=1;
        qs.phonegap=(isPhoneGap())?1:0;
        qs.clientWidth=document.body.clientWidth;
        qs.clientHeight=document.body.clientHeight;
        if(self.flowerinfo&&self.flowerinfo.flower_id){
        	qs.flower_id=self.flowerinfo.flower_id;
        	qs.flower_branch=self.flowerinfo.branch;
        }
        if(window.preview) qs.mobile=1;
        var params=[];
        for(var key in qs){
        	params.push(key+'='+qs[key]);
        }
        url+='?'+params.join('&');
        return url;
	}
	this.store={
		set:function(key,data,cb){
			if(!cb) cb=function(){}
			//if(!window.NativeStorage) return cb(false);
			if(window.NativeStorage){
				NativeStorage.setItem(key,data, function(){
					cb(true);
				}, function(error){
					self.log('⚠️ NativeStorage: Error setting ['+key+'] ['+error.code+']'+error.exception);
					cb(false);
				});
			}else{
				localStorage.setObject(key,data);
				cb(true);
			}
		},
		get:function(key,cb,default_value,loadFn){
			if(!cb) cb=function(){}
			if(window.NativeStorage){
				NativeStorage.getItem(key,function(data){
					if(!data) data=default_value;
					cb(data,loadFn);
				}, function(error){
					//error code 2 is that it doesnt exist
					if(error.code!=2) self.log('⚠️ NativeStorage: Error getting ['+key+'] ['+error.code+']'+error.exception);
					cb(default_value,loadFn);
				});
			}else{
				var d=localStorage.getObject(key,default_value);
				if(!d||!Object.keys(d).length) d=default_value;
				return cb(d,loadFn);
			}
		},
		delete:function(key,cb){
			if(!cb) cb=function(){}
			if(window.NativeStorage){
				NativeStorage.remove(key, function(){
					cb(true);
				}, function(){
					cb(false);
				});
			}else{//fallback to local storage!
				localStorage.setObject(key,false);
				return cb(true);
			}
		}
	}
	this.file={
		init:function(){
			if(!isPhoneGap()&&window.Dexie){
				self.file.db = new Dexie("boot");
		        self.file.db.version(1).stores({
		              files: 'id,content'
		        });
			}
		},
		set:function(filename, content, ncb){ 
            if(!window.requestFileSystem || !LocalFileSystem){
            	if(self.file.db){
            		self.file.db.files.put({id:filename,content:content}).then(function(){
            			ncb(true);
            		}).catch(function(){
            			ncb(false);
            		})
            		return false;
            	}else return self.file.onError('File feature not supported',ncb);
            }
            if(typeof content=='object') content=JSON.stringify(content);
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
                    fileSystem.root.getDirectory("cache", {create: true}, function(dirEntry){
                        dirEntry.getFile(filename, {create: true, exclusive: false}, function(fileEntry){
                            fileEntry.createWriter(function(writer){
                                var size=content.length*2;
                                writer.onerror = function (e) {
                                    self.file.onError('setFile failed '+filename+' [2]:'+JSON.stringify(e),ncb);
                                };
                                var written = 0;
                                var c=0;
                                  var BLOCK_SIZE = 1*1024*1024; // write 1M every time of write
                                  function writeNext(cbFinish) {
                                    var sz = Math.min(BLOCK_SIZE, size - written);
                                    var sub = content.slice(written, written+sz);
                                    writer.write(sub);
                                    written += sz;
                                    writer.onwrite = function(evt) {
                                        c++;
                                      if (written < size)
                                        writeNext(cbFinish);
                                      else
                                        cbFinish();
                                    };
                                  }
                                  writeNext(function(){
                                        if(typeof ncb==='function') ncb(true);
                                  });
                               // writer.write(content);
                            }, function(e){
                                 self.file.onError('setFile failed to write '+filename+' [2]:'+JSON.stringify(e),ncb);
                            });
                        }, function(e){
                            return self.file.onError('Failed to get directory '+filename+' [1]',ncb);
                        });
                    })
                },function(){//failed to get file system
                    return self.file.onError('Failed to get file system '+filename+' [1]',ncb);
                })                  
        },
        get:function(filename,ncb){
            if(!window.requestFileSystem || !LocalFileSystem){
            	if(self.file.db){
            		self.file.db.files.get({id:filename}).then(function(data){
            			if(data&&data.content){
            				ncb(data.content);
            			}else{
            				ncb(false);
            			}
            		}).catch(function(){
            			ncb(false);
            		})
            		return false;
            	}else return self.file.onError('File feature not supported',ncb);
            }
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
                fileSystem.root.getDirectory("cache", {}, function(dirEntry){
                    dirEntry.getFile(filename, null, function(fileEntry){
                        fileEntry.file(function(file){
                            var reader = new FileReader();
                            reader.onloadend = function(evt) {
                                var content=evt.target.result;
                                if(filename.indexOf('.json')>=0&&content){
                                    try{
                                        content=JSON.parse(content);
                                    }catch(e){//catches bad json parsing...
                                        self.file.onError('Error parsing during getFile '+filename+' [1].');
                                        this.deleteFile(filename,function(){
                                            return self.file.onError('Error parsing during getFile, and then error deleting the file '+filename+' [1].',ncb);
                                        })
                                    }
                                }
                                if(typeof ncb==='function') ncb(content);
                            };
                            reader.readAsText(file);
                        }, function(e){
                            return self.file.onError('Error on getFile '+filename+' [1]:'+JSON.stringify(e),ncb);
                        });
                    }, function(e){
                        return self.file.onError('Failed to fetch '+filename+' [1]',ncb);
                    });
                },function(){
                    return self.file.onError('Failed to get directory '+filename+' [1]',ncb);
                });
            },function(){
                return self.file.onError('Failed to get file system '+filename+' [1]',ncb);
            });         
        },
        delete:function(filename,ncb){
            if(!window.requestFileSystem || !LocalFileSystem){
            	if(self.file.db){
            		self.file.db.files.put({id:filename,content:''}).then(function(){
            			ncb(true);
            		}).catch(function(){
            			ncb(false);
            		})
            		return false;
            	}else return self.file.onError('File feature not supported',ncb);
            }
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
                fileSystem.root.getDirectory("cache", {}, function(dirEntry){
                    dirEntry.getFile(filename, null, function(fileEntry){
                        fileEntry.remove(function(){
                            if(typeof ncb==='function') return ncb(true)
                        },function(){
                            return self.file.onError('Error deleting '+filename,ncb);
                        })
                    },function(e){
                        return self.file.onError('Failed to fetch '+filename,ncb);
                    })
                },function(){
                    //not really an error - could happen on first load
                    return self.file.onError('Failed to get directory for '+filename,ncb);
                })
            },function(){
                return self.file.onError('Failed to get file system for '+filename,ncb);
            });             
        },
        onError: function (error,ncb) {
            self.log(error);
            if(typeof ncb==='function') ncb(null,error); //always do the callback, null returned if failed or empty along with a message
            return null;
        }
    }
}