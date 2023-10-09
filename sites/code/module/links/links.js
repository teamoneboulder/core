if(!window.modules) window.modules={};
modules.links_global={
	render:function(media,container){
		var self=this;
        var type=self.checkLink(media);
        if(type=='link'){
		  return $.fn.render({template:'module_links_preview',data:{media:media,container:(container)?container:false},returntemplate:true});
        }
	},
    checkLink:function(media){
        var self=this;
        if(media.url){
            // if(self.isPlayable(media.url)){
            //     return 'embed';
            // }
        }
        return 'link';
    },
    view:function(url){
        var self=this;
        if(self.isPlayable(url)&&false){
            var d=self.getEmbedUrl(url);
            if(d.type=='spotify_track'){
                if(app.user.profile.creds&&app.user.profile.creds.spotify&&app.user.profile.creds.spotify.access_token){
                    var Spotify = window.cordova.plugins.SpotifyPlugin;
                    Spotify.auth(app.user.profile.creds.spotify.access_token,"7c3c2f7dd3db4894b693364bf242d506",function(){
                        _alert('auth!')
                    });
                    // cordova.plugins.spotify.play(d.spotify_id, { 
                    //   clientId: "7c3c2f7dd3db4894b693364bf242d506",
                    //   token: app.user.profile.creds.spotify.access_token
                    // }).then(
                    //     function(data){console.log(data)},
                    //     function(data){console.log(data)}
                    // );
                    // cordova.plugins.spotify.getEventEmitter()
                    //   .then(emitter => emitter.on('playbackevent', eventName => {
                    //     switch (eventName) {
                    //       case 'PlaybackNotifyPlay':
                    //         console.log("Playback was started");
                    //          break;
                    //       case 'PlaybackNotifyPause':
                    //         console.log("Playback was paused");
                    //         break;
                    //       default:
                    //         console.log("Some other event was raised:", eventName);
                    //         break;
                    //     }
                    //   }))
              }else{
                // var config = {
                //   clientId: "7c3c2f7dd3db4894b693364bf242d506",
                //   redirectUrl: app.sapiurl+'/oauth2/',
                //   scopes: ["streaming"], // see Spotify Dev console for all scopes
                //   tokenExchangeUrl: "<URL OF TOKEN EXCHANGE HTTP ENDPOINT>",
                //   tokenRefreshUrl: "<URL OF TOKEN REFRESH HTTP ENDPOINT>",
                // }
                // cordova.plugins.spotifyAuth.authorize(config)
                //   .then(({ accessToken, expiresAt }) => {
                //     console.log(`Got an access token, its ${accessToken}!`);
                //     console.log(`Its going to expire in ${expiresAt - Date.now()}ms.`);
                //   });
                modules.oauth({
                    payload:{
                        provider:'spotify',
                        uid:app.user.profile.id,
                        app:'nectar',
                        //queuejob:'loadfriends',
                        //process:'loadfb'
                    },
                    scope:'streaming'
                },{
                    onAuthOpen:function(){
                        //cur.removeClass('submitting')
                    },
                    onSuccess:function(){
                        //shownextpage!
                        app.user.loadCreds(['spotify'],function(){
                            if(app.user.profile.creds&&app.user.profile.creds.spotify&&app.user.profile.creds.spotify.access_token){
                                self.view(url);//try again now...
                            }
                        })
                    },
                    onError:function(data){
                        $('body').alert({
                            icon:'icon-warning-sign',
                            content:data.error
                        })
                    }
                });
              }
            }
        }else{
            if((url.indexOf(app.siteurl)>=0||url.indexOf('https://app.oneboulder.one')>=0)){
                if(app.history){
                    if(url.indexOf(app.siteurl)>=0){
                        var parts=url.split(app.siteurl);
                    }else if(url.indexOf('https://app.oneboulder.one')>=0){
                        var parts=url.split('https://app.oneboulder.one');
                    }
                    //try to route internally!
                    app.history.go(parts[1],function(){
                        _.openLink(e,events,1);
                    })
                    return false;
                }
            }
            modules.tools.openLink({
                intent:modules.tools.wrapExternalLink(url),
                type:'external'
            })
        }
    },
	bind:function(ele,media,options,reload){
		var self=this;
        if(!reload){
    		if(!media.url&&!media.loading){
    			ele.stap(function(e){
    				phi.stop(e)
    			},1,'tapactive')
    			ele.find('input').on('paste',function(){
    				setTimeout(function(){
    					var v=ele.find('input').val();
    					var links=self.getLinks(v);
    					if(links.length){
    						var link=links[0];
    						if(options.onLink) options.onLink(link);
    					}else{
    						//invalid
    						if(options.onInvalid) options.onInvalid();
    					}
    				},20)
    			})
    		}
        }
		if(media.load){
            if(options.onGetLink) options.onGetLink();
			self.get(media.load,function(data){
				if(data.success){
					if(options.onLinkData) options.onLinkData(data.data);
				}else{
					$('body').alert({
                        icon:'icon-info-circled-alt',
                        content:'<div style="font-size:18px;">Error loading link: '+data.error+'</div>',
                        buttons:[{
                            btext:'<i class="icon-refresh"></i> Retry',
                            bclass:'x_retry'
                        },{
                            btext:'Clear',
                            bclass:'x_clear'
                        }],
                        binding:function(ele){
                            ele.find('.x_clear').stap(function(){
                                if(options.onClear) options.onClear();
                                setTimeout(function(){
                                    $.fn.alert.closeAlert();
                                },500)
                            },1,'tapactive');
                            ele.find('.x_retry').stap(function(){
                                $(this).find('i').addClass('animate-spin');
                                self.bind(ele,media,options,1);
                                setTimeout(function(){
                                    $.fn.alert.closeAlert();
                                },100)
                            },1,'tapactive');
                        }
                    })
				}
			})
		}
	},
	getLinks:function(text){
		text=text.replace('>http','> http');//ensure that there is a space between
        var text=$('<div>'+anchorme(text)+'</div>');
      	var links=[];
        if(text.find('a').length) $.each(text.find('a'),function(i,v){
            var e=$(v);
            var src=e.attr('href');
            links.push(src);
        });
        return links;
	},
    fixRichContent:function(text,opts){
        if(!opts) opts={};
        //return text;
        if(!text) return '';
        text=text.replace('>http','> http');//ensure that there is a space between
        // var text=$('<div>'+anchorme(text,{
        //     exclude: function(urlObj){
        //         urlObj.encoded = urlObj.encoded.replace(/%25/g, '%');
        //         return false;
        //       }
        // })+'</div>');
        // if(!opts.classes) opts.classes='';
        var text=$('<div>'+text+'</div>');
        if(!opts.maxlength) opts.maxlength=100;
        if(text.find('a').length) $.each(text.find('a'),function(i,v){
            var e=$(v);
            var src=e.attr('href');
            if(src.indexOf('mailto:')>=0){
                var srctext=src.replace('mailto:','').limitlength(opts.maxlength)
            }else{
                var srctext=src.replace('www','').limitlength(opts.maxlength);
            }
            e.replaceWith('<span class="'+opts.classes+' linknav" link="'+src+'">'+srctext+'</span>')
        });
        var t=text.html();
        if(opts.addSpacing){
            t=t.replace(/(\r\n|\n\r|\r|\n)/g, '<br/><div style="height:5px"></div>');
        }
        return t.trim();
    },
	fixContent:function(text,opts){
		if(!opts) opts={};
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
            e.replaceWith('<span class="'+opts.classes+' linknav" link="'+src+'">'+srctext+'</span>')
        });
        var t=text.html();
        if(opts.addSpacing){
            t=t.replace(/(\r\n|\n\r|\r|\n)/g, '<br/><div style="height:5px"></div>');
        }
        return t.trim();
	},
	get:function(url,cb){
		modules.api({
            url: app.sapiurl+'/module/links/get', 
            data:{
                url:encodeURIComponent(url)
            },
            timeout:10000,
            callback:function(resp){
            	cb(resp);
            }
        });
	},
    testLinks:[
        'https://www.youtube.com/watch?v=umqvYhb3wf4',
        'https://vimeo.com/109949064',
        'http://www.ted.com/talks/johann_hari_everything_you_think_you_know_about_addiction_is_wrong',
        'https://www.youtube.com/watch?v=YbYWhdLO43Q&feature=youtu.be',
        'https://open.spotify.com/track/6cimfLS3U8WhZrGA9nqArq?si=e6MjsSmKQ4yoO0VNDZI9ug',
        'https://www.facebook.com/AllPeopleAreAwesome/videos/901999979849181/',
        'https://www.facebook.com/video.php?v=787810701267023'
    ],
    test:function(){
        var self=this;
        var out={};
        $.each(self.testLinks,function(i,v){
            out[v]=self.getEmbedUrl(v);
            out[v].isPlayable=self.isPlayable(v);
        });
        console.log(out,1);
    },
    testPlay:function(i){
        this.load(this.testLinks[(i)?i:0]);
    },
    load:function(){
    	console.warn('coming soon')
    },
    queue:{
        add:function(){

        },
        remove:function(){

        },
        showMore:function(){

        },
        closeAll:function(){

        }
    },
    getEmbedUrl:function(link){
        if(!link) return {};
        if(link.indexOf('youtube.com')>=0){
            //get video id
            qs=_.getqs(link);
            var videoid='';
            if(qs.v) videoid=qs.v;
            if(videoid) return {
                src:'https://www.youtube.com/embed/'+videoid+'?autoplay=1&showinfo=0&modestbranding=1',
                id:videoid,
                progressive:1,
                embed_base:'https://www.youtube.com/embed/'+videoid,
                provider:'youtube'
            }
            else return false;
        }
        if(link.indexOf('youtu.be')>=0){
            var urlp=link.split('youtu.be/');
            videoid=urlp[1];
            if(videoid) return {
                src:'https://www.youtube.com/embed/'+videoid+'?autoplay=1&showinfo=0&modestbranding=1',
                id:videoid,
                progressive:1,
                embed_base:'https://www.youtube.com/embed/'+videoid,
                provider:'youtube'
            }
            else return false;
        }
        if(link.indexOf('vimeo.com')>=0){
            //get video id
            var lp=link.split('vimeo.com/');
            var id=lp[1];
            if(id) return {
                src:'https://player.vimeo.com/video/'+id+'?autoplay=1',
                id:id,
                provider:'vimeo'
            }
            else return false;
        }
        if(link.indexOf('ted.com')>=0){
            var lp=link.split('ted.com/talks/');
            var id=lp[1];
            if(id) return {
                src:'https://embed-ssl.ted.com/talks/'+id+'.html?autoplay=1',
                id:id,
                provider:'vimeo'
            }
            else return false;   
        }
        if(link.indexOf('player.groupup.me')>=0||link.indexOf('player.groupupdev.me')>=0){
            return {
                src:link,
                type:'groupup'
            }
        }
        if(link.indexOf('open.spotify.com')>=0){
            if(link.indexOf('/track/')>=0){
                var lp=link.split('/track/');
                var lp2=lp[1].split('?');
                return {
                    src:'https://open.spotify.com/embed/track/'+lp2[0],
                    spotify_id:"spotify:track:"+lp2[0],
                    type:'spotify_track'
                }
            }
        }
        if(link.indexOf('facebook.com')>=0){
            if(link.indexOf('/videos/')>=0){
                var lp=link.split('/videos/');
                // return {
                //     src:'https://www.facebook.com/video/embed?video_id='+lp[1]+'&autoplay=1',
                //     type:'facebook'
                // }
                return {
                    src:link,
                    type:'facebook'
                }
            }else if(link.indexOf('video.php')){//invalid video url
                // var qs=app().getqs(link);
                // if(qs.v){
                //     return {
                //         src:link,
                //         type:'facebook'
                //     }
                // }
            }
        }
        return {};
    },
    isPlayable:function(url){
        //has to happen within first 15 chars
        if(!url) return false;
        if(isPhoneGap()){
            var urlschemes=['youtu.be','youtube.com/watch','vimeo.com/','youtu.be/'];
        }else{
            var urlschemes=[
                'youtube.com/watch',
                'vimeo.com/',
                //'ted.com/talks',
                'youtu.be',
                //'facebook.com/*/videos/',
                //'facebook.com/video.php',
                //'player.groupup.me'
            ];
        }
        var notplayable=[
            'developer.vimeo.com'
        ];
        var ret=0;
        var not=0;
        for (var j=0; j<urlschemes.length; j++) {
            if (url&&url.indexOf(urlschemes[j])>=0&&url.indexOf(urlschemes[j])<30) ret=1;
            if(urlschemes[j].indexOf('*')>=0){
                var urlp=urlschemes[j].split('*');
                if (url.indexOf(urlp[0])>=0&&url.indexOf(urlp[1])>=0) ret=1;
            }
        }
        for (var j=0; j<notplayable.length; j++) {
            if (url&&url.indexOf(notplayable[j])>=0&&url.indexOf(notplayable[j])<30) not=1;
        }
        if(not) return false;
        else return ret;
    }
}