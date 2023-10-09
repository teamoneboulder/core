modules.audio_preview={
	render:function(media){
		var self=this;
		return $.fn.render({template:'feed_audiopreview',data:{media:media},returntemplate:true});
	}
}
modules.media_capture=function(options){
	var self=this;
	self.options=options;
	this.init=function(){
		if(isPhoneGap()){

		}else{
			var filestats={};
	        self.medialist={
	            order:[],
	            list:{}
	        };
		}
	}
	this.show=function(){
		if(options.ele){
			options.ele.render({
				template:'audio_window',
				data:{
					editing:true
				},
				binding:function(ele){
					self.ele=ele;
					self.bind();
				}
			})
		}else{
			self.view=new modules.present({
				display:{
					alert:{
						width:700,
						icon:false,
						closer:false,
						buttons:false
					}
				},
				onBeforeShow:function(){
					if(options.onBeforeShow) options.onBeforeShow();
				},
				templates:{
					alert:'media_capture_alert',
					page:'media_capture_page'
				},
				data:{
					data:options.data
				},
				binding:function(ele){
					self.ele=ele;
					self.bind();
				}
			})
			self.view.show();
		}
	}
	this.onAudioInputError=function(evt){
		console.log(evt)
	}
	this.onAudioInput=function(evt){
		self.audioChunks = self.audioChunks.concat(evt.data);
		console.log( "Audio data received: " + evt.data.length + " samples" );
	}
	this.getDir=function(){
		if(app.device=='iOS'){
			return cordova.file.tempDirectory;
		}else{
			return cordova.file.externalRootDirectory;
		}
	}
	this.getFileUrl=function(){
		if(app.device=='iOS'){
			return self.audioUrl.replace('file://','/private');;
		}else{
			return self.audioUrl;
		}
	}
	this.onAudioInputFinishedCB=function(evt){
		// self.audioUrl=evt.file;
        window.resolveLocalFileSystemURL(self.getDir(), function (dir) {
		    dir.getFile(self.cfile, { exclusive: false }, function (fileEntry) {
		        fileEntry.file(function(file){
		        	var reader = new FileReader();
			        reader.onloadend = function(evt) {
			            self.audio_array=evt.target.result;
			            self.onStop();
			        };
			        reader.readAsArrayBuffer(file);
		        }, function(){
		        	_alert('filesystem error:3')
		        });
		        self.audioUrl=fileEntry.toURL();
		        self.cpath=self.getFileUrl();
		    }, function(){
		    	_alert('filesystem error:2')
		    });

		},function(){
			_alert('filesystem error:1')
		});
	}
	this.onAudioInputFinished=function(evt){
		var encoder = new WavAudioEncoder(window.audioinput.getCfg().sampleRate, window.audioinput.getCfg().channels);
        encoder.encode([self.audioChunks]);
        var blob = encoder.finish("audio/wav");
       	window.resolveLocalFileSystemURL(self.getDir(), function (dir) {
            self.cfile = Math.uuid(12) + ".wav";
            dir.getFile(self.cfile, {create: true}, function (file) {
                file.createWriter(function(fileWriter) {
                	fileWriter.write(blob);
                    // self.audioUrl=file.toURL();
                    // self.cpath=self.getFileUrl();
                    self.onAudioInputFinishedCB({});
		        	// var reader = new FileReader();
			        // reader.onloadend = function(evt) {
			        // 	self.et=new Date().getTime();
				      	// self.recordTime=(self.et-self.st)/1000;
			        //     self.audio_array=evt.target.result;
			        //     console.log(evt)
			        //     self.onStop();
			        // };
			        // reader.readAsArrayBuffer(blob);
                }, function () {
                    _alert("FileWriter error!");
                });
            });
        });
	}
	this.startRecord=function(){
		self.st=new Date().getTime();
		if(options.voiceRecognition){
			self.mediaInt=setInterval(function(){
				self.mediaRecorder.getCurrentAmplitude(function(amp){
					if(self.siriwave) self.siriwave.setAmplitude(amp*2);
				})
			},20);
		}else if(self.nativeRecorder()){
			if(window.audioinput&&self.realTime()){
				self.format='wav';
				// First check whether we already have permission to access the microphone.
				window.requestFileSystem(window.TEMPORARY, 5*1024*1024, function(fs) {
				    fileSystem = fs;
				    self.cfile=Math.uuid(12)+'.wav';
				    // Now you can initialize audio, telling it about the file system you want to use.
				    var captureCfg = {
				    	bufferSize: 8192,
				    	//fileUrl: self.getDir()+self.cfile,
				    	debug:1
				    };
				    if(!self.realTime()) captureCfg.fileUrl=self.getDir()+self.cfile;
				    // Initialize the audioinput plugin.
				    window.audioinput.initialize(captureCfg, function() {	
						// Now check whether we already have permission to access the microphone.
						self.audioChunks=[];
						window.audioinput.checkMicrophonePermission(function(hasPermission) {
						    if (hasPermission) {
								console.log("Already have permission to record.");
								window.audioinput.start(captureCfg);
								window.addEventListener( "audioinput", self.onAudioInput, false );
								window.addEventListener("audioinputerror",self.onAudioInputError,false);
								window.addEventListener( "audioinputfinished", self.onAudioInputFinishedCB, false );
						    } 	
						    else {	        
							    // Ask the user for permission to access the microphone
								window.audioinput.getMicrophonePermission(function(hasPermission, message) {
								    if (hasPermission) {
										console.log("User granted permission to record.");
										window.audioinput.start(captureCfg);
										window.addEventListener( "audioinput", self.onAudioInput, false );
										window.addEventListener("audioinputerror",self.onAudioInputError,false);
										window.addEventListener( "audioinputfinished", self.onAudioInputFinishedCB, false );
								    } else {
										console.warn("User denied permission to record.");
								    }
								});
						    }
						});
				    });
				}, function (e) {
					console.log("Couldn't access file system: " + e.message)
				});
			}else{
				if(app.device=='iOS'){
					var file = Math.uuid(12)+".m4a";
					self.format='m4a';
					var loc=LocalFileSystem.TEMPORARY;
				}else{
					var file = Math.uuid(12)+".aac";
					self.format='aac';
					var loc=cordova.file.externalRootDirectory;
				}
				self.mediaInt=setInterval(function(){
					self.mediaRecorder.getCurrentAmplitude(function(amp){
						if(self.siriwave) self.siriwave.setAmplitude(amp*2);
					})
				},20);
				console.log("recordAudio():Start "+file);
			    self.mediaRecorder = new Media(file,
			        // success callback
			        function() {
			        	if(self.mediaInt) clearInterval(self.mediaInt);
			            console.log("recordAudio():Audio Success");
			            self.et=new Date().getTime();
				      	self.recordTime=(self.et-self.st)/1000;
			            //self.audioUrl='documents://'+self.audioUrl;
			            window.requestFileSystem(loc, 0, function (fs) {
						    fs.root.getFile(file, { exclusive: false }, function (fileEntry) {
						        // var blob = new Blob([new Uint8Array()], { type: "audio/m4a" });
						        // self.audioUrl=window.URL.createObjectURL(blob);
						        fileEntry.file(function(file){
						        	var reader = new FileReader();
							        reader.onloadend = function(evt) {
							            console.log("Read as data URL");
							            console.log(evt.target.result);
							            self.audio_array=evt.target.result;
							            self.onStop();
							        };
							        reader.readAsArrayBuffer(file);
						        }, function(){
						        	_alert('file error2')
						        });
						        self.audioUrl=fileEntry.toURL();
						        self.cpath=self.cpath=self.getFileUrl();
						    }, function(){
						    	_alert('file error')
						    });

						},function(){
							_alert('filesystem error')
						});
			        },

			        // error callback
			        function(err) {
			        	if(self.mediaInt) clearInterval(self.mediaInt);
			        	if(app.isdev) _alert("recordAudio():Audio Error: "+ err.code)
			            console.log("recordAudio():Audio Error: "+ err.code);
			        });
			    // Record audio
			    self.mediaRecorder.startRecord();
			}
		}else{
			self.format='wav';
			//request permission
			_.ensureAndroidPerms(['RECORD_AUDIO'],function(){
				navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream){
					self.st=new Date().getTime();
					var AudioContext = window.AudioContext || window.webkitAudioContext;
					self.audioContext = new AudioContext;
					var analyser = self.audioContext.createAnalyser();
					var input = self.audioContext.createMediaStreamSource(stream);
					var javascriptNode = self.audioContext.createScriptProcessor(2048, 1, 1);
					analyser.smoothingTimeConstant = 0.8;
					  analyser.fftSize = 1024;

					  input.connect(analyser);
					  analyser.connect(javascriptNode);
					  javascriptNode.connect(self.audioContext.destination);
					  javascriptNode.onaudioprocess = function() {
					      var array = new Uint8Array(analyser.frequencyBinCount);
					      analyser.getByteFrequencyData(array);
					      var values = 0;

					      var length = array.length;
					      for (var i = 0; i < length; i++) {
					        values += (array[i]);
					      }

					      var average = values / length;
					    	var normalized=(average/100)*2;
					    	if(self.siriwave) self.siriwave.setAmplitude(normalized);
					    // colorPids(average);
					  }
				    /* Create the Recorder object and configure to record mono sound (1 channel) Recording 2 channels will double the file size */
				    self.rec = new Recorder(input, {
				        numChannels: 1
				    }) 
				    //start the recording process 
				    self.rec.record()
				    self.gumStream=stream;
				  //   self.mediaRecorder = new MediaRecorder(stream);
				  //   self.mediaRecorder.start();
				  //   self.audioChunks = [];

				  //   self.mediaRecorder.addEventListener("dataavailable", event => {
				  //     self.audioChunks.push(event.data);
				  //     console.log(event.data);
				  //   });
				  //   self.mediaRecorder.addEventListener("stop", () => {
				  //     self.audioBlob = new Blob(self.audioChunks,{ type: "audio/"+self.format });
				  //     self.audioUrl = URL.createObjectURL(self.audioBlob);
				  //     self.et=new Date().getTime();
				  //     self.recordTime=(self.et-self.st)/1000;
				  //     stream.getTracks().forEach(function(track) {
						//   track.stop();
						// });
				  //     //self.audioUrl = new Blob(self.audioChunks);
				  //     self.onStop();
				  //   });
				  }).catch(function(e){
				  	_alert('error! '+e.message)
				  });
				})
		}
		self.ele.find('.x_recording').show();
		self.siriwave=new SiriWave({
	        container:self.ele.find('.audio_siriwave')[0],
	    	cover:true,
	    	autostart:true,
	    	amplitude:0.1,
	    	color:'#888'
	    });
	    self.int=setInterval(function(){
	    	self.setTime();
	    },200);
		self.setTime();
		self.ele.find('.x_start_recording').hide();
		self.recording=1;
		if(options.onStart) options.onStart();
	}
	this.setTime=function(){
		var ct=new Date().getTime();
		var ts=Math.floor((ct-self.st)/1000);
		self.ele.find('.audio_record_time').html(ts.toTime());
	}
	this.nativeRecorder=function(){
		if(app.device=='iOS') return true;
		return false;
	}
	this.pause=function(){
		if(self.nativeRecorder()){
			self.audio.stop();
		}else{
			self.audio.pause();
		}
		self.ele.find('.x_playing').hide();
		self.ele.find('.x_not_playing').show();
	}
	this.seek=function(milliseconds){
		if(self.nativeRecorder()){
			self.audio.seekTo(milliseconds);
		}else{
			self.audio.currentTime = milliseconds/1000;
		}
	}
	this.play=function(){
		self.player.play();
		// if(self.nativeRecorder()){
		// 	self.audio = new Media(url,
		//         // success callback
		//         function () {
		//             console.log("playAudio():Audio Success");
		//         },
		//         // error callback
		//         function (err) {
		//             console.log("playAudio():Audio Error: " + err);
		//         }
		//     );
		//     // Play audio
		//     self.audio.play();
		// }else{
		// 	self.audio = new Audio(self.audioUrl);
  //     		self.audio.play();
  //     		self.audio.onended=function(){
  //     			self.seek(0);
  //     			self.ele.find('.x_playing').hide();
		// 		self.ele.find('.x_not_playing').show();
  //     		}
		// }
		self.ele.find('.x_playing').show();
		self.ele.find('.x_not_playing').hide();
		self.ele.find('.x_recording').hide();
		self.ele.find('.x_start_recording').hide();
	}
	this.realTime=function(){
		return 0;
	}
	this.stopRecord=function(destroy){
		if(!self.recording) return false;
		if(self.nativeRecorder()){
			if(window.audioinput&&self.realTime()){
				window.audioinput.stop();
				if(!destroy&&self.realTime()) self.onAudioInputFinished();
			}else{
				self.mediaRecorder.stopRecord();
			}
		}else{
			//self.mediaRecorder.stop();
			if(self.rec&&self.rec.stop) self.rec.stop();//issue with this line!?
			if(self.gumStream&&self.gumStream.getAudioTracks()&&self.gumStream.getAudioTracks()[0]) self.gumStream.getAudioTracks()[0].stop();
			self.audioContext.close();
			if(!destroy){
			    //create the wav blob and pass it on to createDownloadLink 
			    self.rec.exportWAV(function(blob){
			    	self.audioBlob = blob;
			    	self.audioUrl = URL.createObjectURL(blob);
				    self.et=new Date().getTime();
				    self.recordTime=(self.et-self.st)/1000;
				    self.onStop();
			    });
			}
		}
		self.ele.find('.x_recording').hide();
		self.ele.find('.x_done_recording').show();
		self.clearInterval();
		self.recording=false;
	}
	this.clearInterval=function(){
		if(self.int){
			clearInterval(self.int);
			self.int=false;
		}
	}
	this.onStop=function(){
		if(!window.Player){
			_alert('missing audio player code')
			return false;
		}
		self.player=new Player(self.ele.find('.audiobox'),[{
		    file:self.audioUrl,
		    audio_array:self.audio_array,
		    format:self.format,
		    title:'',
		    howl: null,
		    recordTime:self.recordTime,
		    onSave:function(){
		    	self.hide();
		    	self.process(options.getProcessData());
		    }
		  }]);
		self.player.load();
	}
	this.bind=function(){
		self.ele.find('.x_close').stap(function(){
			self.destroy();
		},1,'tapactive')
		self.ele.find('.x_start').stap(function(e){
			self.startRecord();
		},1,'tapactive')
		self.ele.find('.x_stop').stap(function(e){
			self.stopRecord();
		},1,'tapactive')
		// self.ele.find('.x_play').stap(function(e){
		// 	self.play();
		// },1,'tapactive')
		// self.ele.find('.x_pause').stap(function(e){
		// 	self.pause();
		// },1,'tapactive')
		self.ele.find('.x_cancel').stap(function(e){
			phi.stop(e);
			// if(self.uploader.isUploading()){
			// 	self.uploader.abort();
			// }
			self.view.hide();
			self.destroy();
		},1,'tapactive')
		self.ele.find('.x_save').stap(function(){
			//self.next(1);
		},1,'tapactive')
		self.ele.find('.x_recording').hide();
		self.ele.find('.x_start_recording').show();
		self.ele.find('.x_done_recording').hide();
		if(!self.canBgUpload()){
			self.uploader=new modules.fileuploader({
		        ele:self.ele.find('.x_upload'),
		        module:'audio',
		        noPreview:true,
		        data:{
		            path:'/audio/'
		        },
		        previewOnly:true,
		        allowedExtensions:['m4a','mp3','wav'],//other formats comming soon. issue is with transcoding
		        onSubmit:function(){
		            self.uploading=true;
		        	if(self.options.onUploadStart) self.options.onUploadStart();//to show prog bar 
		        },
		        onProgress:function(p){//happening in bg
		            if(_.isWebLayout()) self.growlele.find('.progressbar').css('width',p+'%');
		            else $('#uploadtray').find('.progress').css('width',p+'%');
		        },
		        onClick:function(){
		        	if(options.onClick) options.onClick();
		        },
		        onAbort:function(){
		            self.uploading=false;
		        },
		        onError:function(err,fileobj){
		        	if(modules.tools.isWebLayout()){
			            self.growlele=growl({
			                id:'uploading_'+self.gid,
			                icon:'icon-warning-sign',
			                progress:false,
			                remove:2000,
			                content:'Error: '+err
			            })
			        }else{
			        	$('body').removeClass('isUploading');
			        	self.uploadele.remove();
			        }
		            self.uploading=false;
		            if(self.options.onError) self.options.onError(fileobj,err);
		        },
		        onComplete:function(obj, response){
		            if(modules.tools.isWebLayout()){
			            self.growlele=growl({
			                id:'uploading_'+self.gid,
			                icon:'icon-thumbs-up',
			                progress:false,
			                remove:2000,
			                content:'Success!'
			            })
			        }else{
			        	$('body').removeClass('isUploading');
			        	self.uploadele.remove();
			        }
		        }
		    });
		}
	}
	this.hide=function(){
		if(self.view) self.view.hide();
		if(options.onHide) options.onHide();
		self.clearInterval();
	}
	this.destroy=function(){
		if(self.recording){
			self.stopRecord(1);
		}
		if(self.mediaInt) clearInterval(self.mediaInt);
		if(self.player) self.player.destroy();
		if(self.uploader) self.uploader.destroy();
		self.clearInterval();
		self.ele.remove();
		if(window.AudioToggle) AudioToggle.setAudioMode(AudioToggle.EARPIECE);
		if(options.onDestroy) options.onDestroy();
	}
	this.process=function(obj){
        // $('body').alert({
        //     template:'uploader_prompt_web',
        //     closer:false,
        //     buttons:[{
        //         btext:'Got It!',
        //         bclass:'x_closer'
        //     }],
        //     tempdata:{
        //     },
        //     binding:function(ele){
                
        //     }
        // });
        if(obj.data.media&&obj.data.media.data&&obj.data.media.data.uri) delete obj.data.media.data.uri;
        var data=$.extend(true,{},self.options.data,{
            post:JSON.stringify(obj),
            appid:app.appid,
            token:app.user.token
        });
        self.gid=Math.uuid(12);
        if(modules.tools.isWebLayout()){
            self.growlele=growl({
                id:'uploading_'+self.gid,
                icon:'icon-refresh animate-spin',
                progress:true,
                remove:false,
                content:'Uploading Audio...',
                onCancel:function(){
                	self.abort();
                	self.growlele.fadeOut(500,function(){
                		$(this).remove();
                	})
                }
            })
        }else{
            if(!$('#uploadtray').length){
                $('body').render({
                    template:'video_upload_tray',
                    binding:function(ele){
                       
                    }
                })
            }
            $('body').addClass('isUploading');
            modules.video_global.isUploading=true;
            $('#uploadtray').render({
                template:'audio_progress',
                binding:function(ele){
                	self.uploadele=ele
                    ele.find('.x_cancel').stap(function(){
                        self.abort();
                        $('#uploadtray').html('');
                        $('body').removeClass('isUploading');

                    },1,'tapactive');
                }
            });
        }
        self.fileobj={
        	id:Math.uuid(12),
        	name:'audio_upload.'+self.format
        }
        self.uploading=true;
        self.upload_background(self.cpath,$.extend(true,{},self.options,{data:data,onProgress:function(p){
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
    this.abort=function(){
        if(isPhoneGap()){
            if(self.canBgUpload()){
                if(self.uploading){
                    phone.bg_uploader.abort(self.cur_id);
                }else{
                    self.clearVideo();
                }
            }else{
                self.ft.abort();
            }
        }else{
            self.uploader.abort();
        }
        self.uploading=false;
        modules.video_global.isUploading=false;
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
        if(!self.canBgUpload()){
        	var reader = new FileReader();
          reader.onload = function(event){
            var URLObj = window.URL || window.webkitURL;
             self.uploader.uploader.addBlob(event.target.result,self.format);
             opts.data.format=self.format;
             opts.data.base64=1;
             self.uploader.uploader.processUpload(opts.data)
            }; // data url!
          reader.readAsDataURL(self.audioBlob);
        }else{
            self.cur_id=fileobj.id;
            if(self.canBgUpload()){//finish!
            	opts.module='audio';
            	opts.data.format=self.format;
            	opts.data.path='/audio/';
            	if(app.device=='Android'){
            		window.resolveLocalFileSystemURL(self.getDir(), function (dir) {
			            self.cfile = Math.uuid(12) + ".wav";
			            dir.getFile(self.cfile, {create: true}, function (file) {
			                file.createWriter(function(fileWriter) {
			                	var reader = new FileReader();
					          		reader.onload = function(event){
					            	var URLObj = window.URL || window.webkitURL;
					            	fileWriter.onerror = function (e) {
							            _alert("Failed file write: " + e.toString());
							        };
					            	fileWriter.onwriteend = function() {
							            opts.data.format='base64_wav';
					             	 	phone.bg_uploader.queue(file.toURL(),opts,fileobj,cb);
							        };
					            	fileWriter.write(event.target.result);
					            	//_alert(event.target.result);
					            }; // data url!
					          reader.readAsDataURL(self.audioBlob);
			                    // self.audioUrl=file.toURL();
			                    // self.cpath=self.getFileUrl();
			                   // _alert(file.toURL());
					        	// var reader = new FileReader();
						        // reader.onloadend = function(evt) {
						        // 	self.et=new Date().getTime();
							      	// self.recordTime=(self.et-self.st)/1000;
						        //     self.audio_array=evt.target.result;
						        //     console.log(evt)
						        //     self.onStop();
						        // };
						        // reader.readAsArrayBuffer(blob);
			                }, function () {
			                    _alert("FileWriter error!");
			                });
			            });
			        });
            	}else{
                	phone.bg_uploader.queue(imageURI,opts,fileobj,cb);
                }
            }else{
                self.upload(imageURI,opts,fileobj,cb);//fallback!
            }
        }
        if(options.onSave) options.onSave();
    }
    this.clearVideo=function(){
        self.cpath=false;
    }
	this.init();
}