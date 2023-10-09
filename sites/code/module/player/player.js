modules.player=function(options){
	var self=this;
	self.options=options;
	this.init=function(){

	}
	this.destroy=function(){
		if(self.timer) self.timer.stop();
		if(self.media) self.media.pause();
		//destroy it!
		if(self.getPlayType()=='native'){
			self.media.release();
			if(window.MusicControls) MusicControls.destroy();
		}else{
			delete self.media;
		}
	}
	this.onPositionChange=function(current){
		if(self.options.onPositionChange) self.options.onPositionChange(current);
		if(isPhoneGap()&&!self.audioOpts.stream){
			if(self.hasControls){
				MusicControls.updateElapsed({
					elapsed: current.position, // seconds
					isPlaying: true
				});
			}
		}
	}
	this.ensureMediaControls=function(count){
		if(self.getPlayType()=='native'){
			if(self.media.getDuration()==-1){
				if(!count) count=0;
				if(count<200){
					setTimeout(function(){
						self.ensureMediaControls(count);
					},10)
				}else{
					_alert('Error initalizing media')
				}
			}else{
				self.media.getCurrentPosition(
			        // success callback
			        function (position) {
			        	self.onPositionChange({
		            		position:position,
		            		duration:self.media.getDuration()
		            	});
		            	self.setMediaControls({
		            		position:position,
		            		duration:self.media.getDuration()
		            	});
			        },
			        function (e) {
			            console.log("Error getting pos=" + e);
			        }
			    );
			}
		}else{
			if(self.audioOpts.stream){
				self.setMediaControls({
	        		position:0,
	        		duration:0
	        	});
			}else if(self.media){
				if(!self.media.duration){
					if(!count) count=0;
					if(count<200){
						setTimeout(function(){
							self.ensureMediaControls(count);
						},10)
					}else{
						_alert('Error initalizing media')
					}
				}else{
					self.onPositionChange({
			        	position:Math.floor(self.media.currentTime),
			        	duration:Math.floor(self.media.duration)
			        });
				}
			}
		}
	}
	this.getDuration=function(){
		return (self.getPlayType()=='native')?self.media.getDuration():Math.floor(self.media.duration)
	}
	this.setAudioSource=function(opts){
		self.audioOpts=opts;
		if(self.getPlayType()=='native'){
			self.media=new Media(opts.src,function(){
			},function(){
			},function(status){
				if(status==Media.MEDIA_RUNNING){
					// if(!opts.stream){
					// 	self.ensureMediaControls();
					// }else{
					// 	self.setMediaControls();
					// }
				}
			});
			if(!self.audioOpts.stream){
				//self.media.play();
				self.media.play();//do this to load
				self.int=setInterval(function(){
					if(!self.playing) self.media.pause();//do this to load
				},20);
				setTimeout(function(){
					clearInterval(self.int);
				},1500);
				self.ensureMediaControls();
			}else{
				self.setMediaControls();
			}
		}else{
			self.media=new Audio(opts.src);
			self.ensureMediaControls();
			self.media.addEventListener('timeupdate', (event) => {
	            if(self.media) self.onPositionChange({
		        	position:Math.floor(self.media.currentTime),
		        	duration:Math.floor(self.media.duration)
		        });
	        }, false);
		}
	}
	this.getAlbumCover=function(){
		if(self.audioOpts.pic) return _.getImg(self.audioOpts.pic,'square')
		if(self.audioOpts.album_info&&self.audioOpts.album_info.pic) return _.getImg(self.audioOpts.album_info.pic,'square')
		return _.getImg(self.audioOpts.cover,'square');
	}
	this.setMediaControls=function(source_info){
		if(!isPhoneGap()) return false;//do different logic for web
		if(!window.MusicControls) return console.warn('MusicControls not found!');
		MusicControls.create({
			track       : self.audioOpts.title?self.audioOpts.title:'',		// optional, default : ''
			artist      : (self.audioOpts.artist&&self.audioOpts.artist.data)?self.audioOpts.artist.data.name:'',						// optional, default : ''
			album       : (self.audioOpts.album_info&&self.audioOpts.album_info)?self.audioOpts.album_info.name:'',     // optional, default: ''
		 	cover       : self.getAlbumCover(),		// optional, default : nothing
			// cover can be a local path (use fullpath 'file:///storage/emulated/...', or only 'my_image.jpg' if my_image.jpg is in the www folder of your app)
			//			 or a remote url ('http://...', 'https://...', 'ftp://...')
			isPlaying   : true,							// optional, default : true
			dismissable : false,							// optional, default : false

			// hide previous/next/close buttons:
			hasPrev   : false,		// show previous button, optional, default: true
			hasNext   : false,		// show next button, optional, default: true
			hasClose  : false,		// show close button, optional, default: false

			// iOS only, optional
			
			duration : (source_info&&source_info.duration)?source_info.duration:0, // optional, default: 0
			elapsed : (source_info&&source_info.position)?source_info.position:0, // optional, default: 0
		  	hasSkipForward : false, //optional, default: false. true value overrides hasNext.
		  	hasSkipBackward : false, //optional, default: false. true value overrides hasPrev.
		  	skipForwardInterval : 0, //optional. default: 0.
			skipBackwardInterval : 0, //optional. default: 0.
			hasScrubbing : (self.audioOpts.stream)?false:true, //optional. default to false. Enable scrubbing from control center progress bar 

			// Android only, optional
			// text displayed in the status bar when the notification (and the ticker) are updated
			ticker	  : 'Now playing "'+self.audioOpts.title+'"',
			//All icons default to their built-in android equivalents
			//The supplied drawable name, e.g. 'media_play', is the name of a drawable found under android/res/drawable* folders
			playIcon: 'media_play',
			pauseIcon: 'media_pause',
			prevIcon: 'media_prev',
			nextIcon: 'media_next',
			closeIcon: 'media_close',
			notificationIcon: 'notification'
		}, function(){
			//alert('success')
		}, function(){
			//alert('error')
		});
		self.hasControls=true;
		function events(action) {
			const message = JSON.parse(action).message;
			switch(message) {
				case 'music-controls-next':
					// Do something
				break;
				case 'music-controls-previous':
					// Do something
					break;
				case 'music-controls-pause':
					// Do something
					self.pause();
				break;
				case 'music-controls-play':
					// Do something
					self.play()
				break;
				case 'music-controls-destroy':
					// Do something
					break;

				// External controls (iOS only)
		    	case 'music-controls-toggle-play-pause' :
					// Do something
					break;
		    	case 'music-controls-seek-to':
					self.seekTo(parseFloat(JSON.parse(action).position));
					// Do something
					break;

				// Headset events (Android only)
				// All media button events are listed below
				case 'music-controls-media-button' :
					// Do something
					break;
				case 'music-controls-headset-unplugged':
					// Do something
					break;
				case 'music-controls-headset-plugged':
					// Do something
					break;
				default:
					break;
			}
		}

		// Register callback
		MusicControls.subscribe(events);

		// Start listening for events
		// The plugin will run the events function each time an event is fired
		MusicControls.listen();
	}
	this.getState=function(){
		return {
			playing:self.playing
		}
	}
	this.getPlayType=function(){
		if(isPhoneGap()&&app.device=='iOS') return 'native';
		return 'html5';
	}
	this.play=function(){
		self.media.play();
		if(self.getPlayType()=='native'){
			//use native timer!
			self.timer = new window.nativeTimer();
			self.timer.onTick=function(){
				self.forceCurrentPosition=false;
				self.media.getCurrentPosition(
			        // success callback
			        function (position) {
			            if (position > -1) {
			            	if(!self.forceCurrentPosition){
				            	self.onPositionChange({
				            		position:position,
				            		duration:self.media.getDuration()
				            	});
				            }
			            }
			        },
			        // error callback
			        function (e) {
			            console.log("Error getting pos=" + e);
			        }
			    );
			}
			self.timer.start(0,1000,
			  function() {
			    // invoked after successful start
			  },
			  function(errorMessage) {
			    // invoked after unsuccessful start
			  });
			// self.timer = setInterval(function () {
		 //    // get media position
			//     self.media.getCurrentPosition(
			//         // success callback
			//         function (position) {
			//             if (position > -1) {
			//             	if(self.options.onPositionChange) self.options.onPositionChange({
			//             		curent:position,
			//             		duration:self.media.getDuration()
			//             	});
			//             }
			//         },
			//         // error callback
			//         function (e) {
			//             console.log("Error getting pos=" + e);
			//         }
			//     );
			// }, 1000);
		}
		self.playing=1;
		if(app.device=='Android'){
			if(window.MusicControls) MusicControls.updateIsPlaying(true); 
		}
		if(self.options.onPlay) self.options.onPlay()
	}
	this.pause=function(){
		self.options.onPause();
		self.media.pause()
		if(self.timer) self.timer.stop()
		self.playing=0;
		if(app.device=='Android'){
			if(window.MusicControls) MusicControls.updateIsPlaying(false); 
		}
		if(self.options.onPause) self.options.onPause()
	}
	this.setProgress=function(progress){
		var position=(progress/100)*self.getDuration();
		self.forceCurrentPosition=true;
		if(window.MusicControls) MusicControls.updateElapsed({
			elapsed: position,
			isPlaying: true
		});
		if(self.getPlayType()=='native'){
			self.media.seekTo(position*1000);//in MS
		}else{
			self.media.currentTime=position;
		}
	}
	this.seekTo=function(position){
		//onerror('seekto! '+position);
		self.forceCurrentPosition=true;
		if(window.MusicControls) MusicControls.updateElapsed({
			elapsed: position,
			isPlaying: true
		});
		if(self.getPlayType()=='native'){
			self.media.seekTo(position*1000);//in MS
		}else{
			self.media.currentTime=position;
		}
	}
	this.init();
}