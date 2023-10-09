if(!window.modules) window.modules={};
modules.video_global={
    current:'',
    isUploading:0
}
modules.video_preview={
	render:function(media){
		var self=this;
        // console.log('=====')
        // console.log(media)
		return $.fn.render({template:'video_preview',data:{media:media},returntemplate:true});
	},
    bind:function(ele,player){
        var self=this;
        if(!ele||!ele[0]){
            onerror('Video element doesnt exists to bind');
            return false;
        }
        ele[0].addEventListener("webkitendfullscreen", function(){
            self.endFullScreen(ele,player);
        }, false);
    },
    endFullScreen:function(ele,player){
         //check if an element is currently full screen
        if(document.fullScreenElement || document.webkitIsFullScreen == true || document.mozFullScreen || document.msFullscreenElement ){
            //player.muted=false;
        } else {
            phone.statusBar.ensure();
        }
    }
}
modules.video_player=function(options){
    var self=this;
    if(!options.opts) options.opts={};
    var nativeIos=true;
    //var nativeIos=false;
    self.unique_id=Math.uuid(12);
    if(nativeIos) options.opts.fullscreen={ enabled: true, fallback: true, iosNative: true };
    if(options.embed) options.opts.fullscreen=false;
    if(modules.tools.isWebLayout()){
        options.opts.controls=['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'pip', 'airplay', 'fullscreen'];
    }else{
        options.opts.controls=['play-large', 'play', 'progress', 'current-time', 'volume', 'settings','fullscreen'];
    }
    options.opts.settings=['quality', 'speed']
    if(isPhoneGap()&&options.embed){
        if((window.YoutubeVideoPlayer)&&options.youtube_id&&app.isdev){
            options.opts.fullscreen={
                callback:function(plyr){
                    if(window.YoutubeVideoPlayer) YoutubeVideoPlayer.openVideo(options.youtube_id, function(result) {
                        if(result!='error') _alert('YoutubeVideoPlayer result = ' + result); 
                    });
                }
            }
        }else{
            options.opts.controls.splice(options.opts.controls.indexOf('fullscreen'),1);
        }
    }
    options.opts.playsinline=true;
    //options.opts.muted=false;//apparently, it caches audio state...if autoplay, it will automatically mute
    self.init=function(){
        //return false;
        self.player=new Plyr(options.ele[0],options.opts);
        $(self.player.elements.container).on('touchmove',function(e){
            phi.preventSwipe=1;
        }).on('touchend',function(){
            phi.preventSwipe=0;
        })
        if(nativeIos&&app.device=='iOS'){
            modules.video_preview.bind(options.ele,self.player);
        }
        self.playTime=0;
        self.player.on('timeupdate',function(e){
            var ct=self.player.currentTime;
            if(!self.lastTime||Math.abs(self.lastTime-self.player.currentTime)<2){
                if(self.lastTime) self.playTime+=Math.abs(self.lastTime-self.player.currentTime);
                if(options.onTimeUpdate) options.onTimeUpdate({
                    duration:self.player.duration,
                    currenTime:self.player.currentTime,
                    playTime:self.playTime//seconds person has been watching
                });
            }
            self.lastTime=self.player.currentTime;
        })
        self.player.on('ready',function(){
            if(options.embed) $(self.player.elements.container).parents('.videocontainer').height($(self.player.elements.container).height())
        })
        self.player.on('enterfullscreen',function(){
            setTimeout(function(){
                phone.orientation.unlock();
                phone.statusBar.hide();
            },5000)
        })
        self.player.on('exitfullscreen',function(){
            phone.orientation.lock();
            phone.statusBar.show();
        })
        self.player.on('play',function(){
            if(modules.video_global.current) modules.video_global.current.pause();
            modules.video_global.current=self;
        })
        self.player.on('pause',function(){
            if(modules.video_global.current&&modules.video_global.current.unique_id==self.unique_id) modules.video_global.current=false;
        })
    }
    self.pause=function(){
        if(self.player.playing){
            self.player.pause()
        }
    }
    self.autoplay=function(){
        if(!self.player.playing){
            self.player.muted=true;
            self.player.play();//try
            self.player.autoplay=true;//if not ready, autoplay
        }
    }
    self.play=function(){
        if(!self.player.playing){
            self.player.play()
        }
    }
    self.destroy=function(){
        if(modules.video_global.current&&modules.video_global.current.unique_id==self.unique_id) modules.video_global.current=false;
        if(self.player) self.player.destroy();
    }
    self.init();
}
modules.video_view=function(media){
    var self=this;
    this.init=function(){
        phone.orientation.unlock();
        $('body').render({
            template:'video_view',
            data:{
                media:media
            },
            binding:function(ele){
                phone.statusBar.hide()
                TweenLite.to(ele.find('.bg'),.3,{opacity:1,onComplete:function(){
                    //self.video=videojs(ele.find('video')[0],{});
                    //modules.video_preview.bind(ele.find('video'));
                    self.video=new modules.video_player({
                        ele:ele.find('video')
                    })
                    self.video.play();
                }})
                ele.find('.x_close').stap(function(){
                    phone.orientation.lock();
                    phone.statusBar.show()
                    setTimeout(function(){
                        self.video.pause();
                        ele.fadeOut(500,function(){
                            self.video.destroy();
                            ele.remove()
                        })
                    },100)
                },1,'tapactive');
            }
        })
    }
    self.init();
}
modules.video=function(options){
	var self=this;
	self.options=options;
    self.uploading=false;
	if(isPhoneGap()){
		options.ele.stap(function(){
			if(self.options.onClick) self.options.onClick();
            var menu=[];
            var dv=parseInt(window.device.version.split('.')[0]);
            if(app.device=='iOS'&&!modules.version.min('5.0.0')&&dv==13){
            }else{
                menu.push({
                    id:'upload',
                    name:'Upload a video',
                    icon:'icon-upload'
                })
            }
            // menu.push({
            //     id:'take',
            //     name:'Take a Video',
            //     icon:'icon-video-frame'
            // })
            var alert2=new modules.mobilealert({
                menu:menu,
                onSelect:function(id){
                    if(id=='upload'){
                        self.mobileUpload()
                    }else{
                        app.ensureAndroidPerms('CAMERA',function(){
                            app.ensureAndroidPerms('RECORD_AUDIO',function(){
                                app.ensureAndroidPerms('READ_EXTERNAL_STORAGE',function(){
                                    navigator.device.capture.captureVideo(function(mediaFiles){//success
                                        var path = mediaFiles[0].fullPath;
                                        self.cpath=path;
                                        //upload!
                                        var id=Math.uuid();//unique for each image uploaded
                                        var fileobj={id:id};
                                        self.fileobj=fileobj;
                                        //this.setFileSizeBox(tele.find('.uploadsize')[0]); // designate this element as file size container
                                        //tele.find('.uploadsize').html(obj.mbsize+' MB');
                                        var pp=path.split('/');
                                        var lpp=pp[pp.length-1];
                                        var cp=lpp.split('.');
                                        var ext=cp[1].toLowerCase();
                                        if(self.options.onPreviewReady) self.options.onPreviewReady(path,fileobj);
                                        if(options.immediateUpload){
                                            if(self.options.onUploadStart) self.options.onUploadStart();//to show prog bar 
                                            self.upload_background(path,$.extend(true,{},self.options),fileobj,function(resp){
                                                if(resp){
                                                    if(self.options.onSuccess) self.options.onSuccess(path,resp,fileobj);
                                                }else{
                                                    if(self.options.onError) self.options.onError();
                                                    else _alert('error!')
                                                }
                                            })
                                        }
                                    }, function(){//error
                                        if(self.options.onError) self.options.onError();
                                        else _alert('error!')
                                    }, {});
                                });
                            })
                        });
                    }
                }
            });
            alert2.show();
		},1,'tapactive')
	}else{
		var filestats={};
        self.medialist={
            order:[],
            list:{}
        };
        self.uploader=new modules.fileuploader({
            ele:options.ele,
            module:'video',
            data:{
                path:'/video/'
            },
            previewOnly:true,
            allowedExtensions:['mp4'],//other formats comming soon. issue is with transcoding
            onSubmit:function(){
                self.uploading=true;
            	if(self.options.onUploadStart) self.options.onUploadStart();//to show prog bar 
            },
            onPreviewReady:self.options.onPreviewReady,
            onLoadingPreview:self.options.onLoadingPreview,
            onProgress:function(p){//happening in bg
                if(self.growlele) self.growlele.find('.progress').css('width',p+'%');
                //$('#uploadtray').find('.progress').css('width',p+'%');
            },
            onClick:self.options.onClick,
            onAbort:function(){
                self.uploading=false;
            },
            onError:function(err,fileobj){
                self.uploading=false;
                self.options.onError(fileobj,err);
            },
            onComplete:function(obj, response){
                growl({
                    id:'uploading_'+self.gid,
                    icon:'icon-thumbs-up',
                    remove:5000,
                    content:'Done Uploading Video'
                })
                if(!_.isWebLayout()){
                    self.growlele.remove();
                    $('body').removeClass('isUploading');
                }
                self.uploading=false;
                 //$('#uploadtray').html('');
                //TweenLite.to($('#mainview'),.2,{bottom:0})
            	self.options.onSuccess(obj, response);
                self.uploader.destroy();
            }
        });
	}
    this.mobileUpload=function(){
        if(app.device=='iOS') phone.statusBar.set('dark');
        if(modules.version.min('5.0.0')){
            self.mediapicker=new modules.mediapicker({
                galleryOpts:{
                    maximumImagesCount: 1,
                    maxDuration:(60*60*2),
                    mode:'VideoOnly'
                },
                onPick:function(uris){
                   // _alert('uris: '+JSON.stringify(uris))
                    var path=uris[0];
                    self.cpath=path;
                    var id=Math.uuid();//unique for each image uploaded
                    var fileobj={id:id};
                    self.fileobj=fileobj;
                    if(self.options.onPreviewReady) self.options.onPreviewReady(path,fileobj);
                    if(options.immediateUpload){
                        if(self.options.onUploadStart) self.options.onUploadStart();//to show prog bar 
                        self.upload_background(path,$.extend(true,{},self.options),fileobj,function(resp){
                            if(resp){
                                if(self.options.onSuccess) self.options.onSuccess(path,resp,fileobj);
                            }else{
                                if(self.options.onError) self.options.onError();
                                else _alert('error!')
                            }
                        })
                    }
                }
            });
        }else{
           // _.ensureAndroidPerms(['READ_EXTERNAL_STORAGE'],function(){
                navigator.camera.getPicture(function(path){
                    _alert('path:'+path)
                    if(app.device=='iOS') phone.statusBar.set();
                     if(app.device=='Android'){
                        path='file://'+path;
                        //if(app.isdev) _alert(path)
                    }
                    self.cpath=path;
                    var id=Math.uuid();//unique for each image uploaded
                    var fileobj={id:id};
                    self.fileobj=fileobj;
                    if(self.options.onPreviewReady) self.options.onPreviewReady(path,fileobj);
                    if(options.immediateUpload){
                        if(self.options.onUploadStart) self.options.onUploadStart();//to show prog bar 
                        self.upload_background(path,$.extend(true,{},self.options),fileobj,function(resp){
                            if(resp){
                                if(self.options.onSuccess) self.options.onSuccess(path,resp,fileobj);
                            }else{
                                if(self.options.onError) self.options.onError();
                                else _alert('error!')
                            }
                        })
                    }
                    }, function(message) {
                        if(app.device=='iOS') phone.statusBar.set();
                    }, {
                    quality: 80,
                    destinationType: Camera.DestinationType.FILE_URI,
                    sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                    mediaType:Camera.MediaType.VIDEO,
                    correctOrientation:1
                });
            //});
        }
    }
    this.getPreviewImage=function(){//todo
        var canvas = document.getElementById('canvas');
        var video = document.getElementById('video');
        canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    }
    this.shouldTranscode=function(){
        //return false;
        if(self.options.transcode){
            return true;
        }else{
            return false;
        }
    }
    this.process=function(obj){
        $('body').alert({
            template:'uploader_prompt_web',
            closer:false,
            icon:'icon-upload',
            image:false,
            buttons:[{
                btext:'Got It!',
                bclass:'x_closer'
            }],
            tempdata:{
            },
            binding:function(ele){
            }
        });
        if(!self.options.data) self.options.data={};
        if(obj){
            var data=$.extend(true,{},self.options.data,{
                data:obj,
                appid:app.appid,
                token:app.user.token
            });
        }else{
            var data=$.extend(true,{},self.options.data,{
                appid:app.appid,
                token:app.user.token
            });
        }
        self.gid=Math.uuid(12);
        if(_.isWebLayout()){
            self.growlele=growl({
                id:'uploading_'+self.gid,
                icon:'icon-refresh animate-spin',
                progress:true,
                remove:false,
                content:'Uploading Video...',
                onCancel:function(){
                    self.abort();
                }
            })
        }else{
            if(!$('#uploadtray').length){
                $('body').render({
                    template:'video_upload_tray',
                    binding:function(ele){
                        self.growlele=ele
                    }
                })
            }
            $('body').addClass('isUploading');
            modules.video_global.isUploading=true;
            $('#uploadtray').render({
                template:'video_progress',
                binding:function(ele){
                    ele.find('.x_cancel').stap(function(){
                        self.abort();
                        $('#uploadtray').html('');
                        $('body').removeClass('isUploading');
                        modules.video_global.isUploading=false;
                    },1,'tapactive');
                }
            });
        }
        self.uploading=true;
        //_alert(self.cpath)
        setTimeout(function(){
            //alert('video: '+self.cpath)
            if(window.VideoEditor&&self.shouldTranscode()){//app.device=='iOS'
                // parameters passed to transcodeVideo
                var name=Math.uuid(12);
                $('#progresstype').html('1/2 Transcoding');
                window.plugins.insomnia.keepAwake()
                VideoEditor.transcodeVideo(
                    function(res){
                        window.plugins.insomnia.allowSleepAgain()
                        $('#progresstype').html('2/2 Uploading');
                        $('#uploadtray').find('.progress').css('width','0%');
                        self.upload_background(res,$.extend(true,{},self.options,{data:data,onProgress:function(p){
                            $('#uploadtray').find('.progress').css('width',p+'%');
                        }}),self.fileobj,function(resp){
                            $('#uploadtray').html('');
                            $('body').removeClass('isUploading');
                            modules.video_global.isUploading=false;
                            // if(resp){
                            //     if(self.options.onSuccess) self.options.onSuccess(path,resp,fileobj);
                            // }else{
                            //     if(self.options.onError) self.options.onError();
                            //     else _alert('error!')
                            // }
                        })
                    }, // success cb
                    function(){

                    }, // error cb
                    {
                        fileUri: self.cpath, // the path to the video on the device
                        outputFileName: name, // the file name for the transcoded video
                        outputFileType: VideoEditorOptions.OutputFileType.MPEG4, // android is always mp4
                        optimizeForNetworkUse: VideoEditorOptions.OptimizeForNetworkUse.YES, // ios only
                        saveToLibrary: false, // optional, defaults to true
                        deleteInputFile: false, // optional (android only), defaults to false
                        maintainAspectRatio: true, // optional (ios only), defaults to true
                        //width: 640, // optional, see note below on width and height
                        //height: 640, // optional, see notes below on width and height
                        videoBitrate: 3000000, // optional, bitrate in bits, defaults to 1 megabit (1000000)
                        fps: 24, // optional (android only), defaults to 24
                        audioChannels: 2, // optional (ios only), number of audio channels, defaults to 2
                        audioSampleRate: 44100, // optional (ios only), sample rate for the audio, defaults to 44100
                        audioBitrate: 128000, // optional (ios only), audio bitrate for the video in bits, defaults to 128 kilobits (128000)
                        progress: function(info) {
                            if(app.device=='Android'){
                                info=info*100;
                            }
                            $('#uploadtray').find('.progress').css('width',info+'%');
                            //console.log('info: ',info)
                        } // info will be a number from 0 to 100
                    }
                );
            }else{
                $('#progresstype').html('Uploading');
                //alert('video: '+self.cpath)
                self.upload_background(self.cpath,$.extend(true,{},self.options,{data:data,onProgress:function(p){
                    //_alert('progress: '+p)
                    $('#uploadtray').find('.progress').css('width',p+'%');
                }}),self.fileobj,function(resp){
                    $('#uploadtray').html('');
                    $('body').removeClass('isUploading');
                    modules.video_global.isUploading=false;
                    // if(resp){
                    //     if(self.options.onSuccess) self.options.onSuccess(path,resp,fileobj);
                    // }else{
                    //     if(self.options.onError) self.options.onError();
                    //     else _alert('error!')
                    // }
                })
            }
        },2000)
    }
    this.abort=function(){
        if(isPhoneGap()){
            if(self.canBgUpload()){
                if(self.uploading){
                    phone.bg_uploader.abort(self.cur_id);
                }else if(self.transcoding){

                }else{
                    self.clearVideo();
                }
            }else{
                self.ft.abort();
            }
        }else{
            self.uploader.abort();
            if(_.isWebLayout()){
                if(self.growlele) self.growlele.fadeOut(300,function(){
                    $(this).remove()
                });
            }
        }
        self.uploading=false;
    }
    this.isUploading=function(){
        if(self.canBgUpload()){
            return phone.bg_uploader.isUploading();
        }else{
            return self.uploading;
        }
    }
    this.canBgUpload=function(){
        if(window.FileTransferManager){
            return true;
            // if(app.isdev) return true;
            // if(app.device=='Android') return true;
            // return false;
        }else return false;
    }
    this.upload_background=function(imageURI,opts,fileobj,cb){
        if(self.uploader){
            self.uploader.uploader.processUpload(opts.data);
        }else{
            self.cur_id=fileobj.id;
            if(self.canBgUpload()){//finish!
                opts.module='video';
                phone.bg_uploader.queue(imageURI,opts,fileobj,cb);
            }else{
                self.upload(imageURI,opts,fileobj,cb);//fallback!
            }
        }
    }
    this.clearVideo=function(){
        self.cpath=false;
    }
    this.hasVideo=function(){
        if(self.canBgUpload()){
            if(self.cpath) return true;
            else return false;
        }else if(isPhoneGap()){
            if(self.cpath) return true;
            else return false;
        }else{
            return self.uploader.hasVideo();
        }
    }
    this.checkUpload=function(opts,cb){
        if(self.isUploading()){
            $('body').alert({
                template:'uploader_prompt',
                tempdata:{
                    data:opts
                },
                buttons:[{
                    btext:'Continue',
                    bclass:'submit'
                }],
                binding:function(ele){
                    ele.find('.submit').stap(function(){
                        $.fn.alert.closeAlert();
                        cb();
                    },1,'tapactive')
                }
            })
        }else{
            cb();
        }
    }
    this.destroy=function(){
        if(self.uploader&&self.uploader.destroy&&!self.uploading) self.uploader.destroy();
    }
	this.upload=function(imageURI,opts,fileobj,cb){
        var options = new FileUploadOptions();
        options.fileKey="file";
        options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
        options.mimeType="video/quicktime";
        options.params = opts.data;
        options.params.appid=app.appid;
        options.params.token=app.user.token;
        options.chunkedMode = true;//was false!?
        self.uploading=true;
        self.ft = new FileTransfer();
        // var progcent=opts.ele.find('.uploadsize');
        // var progbar=opts.ele.find('.progbar');
        // progbar.css('width','0%');
        self.ft.onprogress = function(progressEvent) {
            if (progressEvent.lengthComputable) {
                var p=parseInt((progressEvent.loaded / progressEvent.total)*100,10);
                // progbar.css('width',p+'%');
                // progcent.html(p+'%');
                //app.core.log('Upload progress ['+p+'%]',1);
                if(opts.onProgress) opts.onProgress(p,fileobj);
                if(opts.bindOnProgress) opts.bindOnProgress(p,fileobj);
                if(p==100){       
                }
            }
        };
        self.ft.upload(imageURI, app.uploadurl+'/upload/video/submit', function(success){
            app.core.log(success,1);
            var r=JSON.parse(success.response);
            //_alert(JSON.stringify(r))
            if(r&&r.path){
                self.uploading=false;
                cb({
                    path:r.path,
                    ar:r.ar,
                    ext:r.ext,
                    poster:r.poster,
                    length:r.length
                })
            }else{//error
                self.uploading=false;
                cb(false);
            }
        }, function(fail){
            //alert('Error uploading image');
            self.uploading=false;
            cb(false);
        }, options);
	}
}