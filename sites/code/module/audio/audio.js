modules.audio_global={
	isWebAudioUnlocked:false,
	isHTMLAudioUnlocked:false,
	stream:function(title){
		var self=modules.audio_global;
		if(isPhoneGap()){
		    var silenceDataURL = "data:audio/mp3;base64,//MkxAAHiAICWABElBeKPL/RANb2w+yiT1g/gTok//lP/W/l3h8QO/OCdCqCW2Cw//MkxAQHkAIWUAhEmAQXWUOFW2dxPu//9mr60ElY5sseQ+xxesmHKtZr7bsqqX2L//MkxAgFwAYiQAhEAC2hq22d3///9FTV6tA36JdgBJoOGgc+7qvqej5Zu7/7uI9l//MkxBQHAAYi8AhEAO193vt9KGOq+6qcT7hhfN5FTInmwk8RkqKImTM55pRQHQSq//MkxBsGkgoIAABHhTACIJLf99nVI///yuW1uBqWfEu7CgNPWGpUadBmZ////4sL//MkxCMHMAH9iABEmAsKioqKigsLCwtVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVV//MkxCkECAUYCAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
		    if(!self.tag){
		    	self.tag = document.createElement("audio");
			    self.tag.controls = false;
			    self.tag.preload = "auto";
			    self.tag.loop = true;
			}
		    self.tag.src = silenceDataURL;
			self.tag.title=title;
		    self.tag.play();
		}
	},
	stop:function(){
		var self=modules.audio_global;
		if(self.tag){
			if(isPhoneGap()){
				self.tag.pause();
				self.tag.src='';
			}
		}
	}
}
modules.audio=function(options){
	var self=this;
	self.options=options;
	self.id=Math.uuid(12);
	self.usePhonegap=false
	this.init=function(){
        if(self.usePhonegap){
        	//$('body').append('<audio id="'+self.id+'" src="'+self.options.src+'"></audio>')
        	self.media = new Media(self.options.src, function(){
        		if(options.onSuccess) options.onSuccess();
        	}, function(){
        		if(options.onError) options.onError();
        	});
        }else{
        	self.media = new Howl({
              src: [self.options.src]
            });
        }
	}
	this.play=function(){
		if(self.usePhonegap){
			self.media.seekTo(0);
			self.media.play();
			self.media.setVolume('1.0');
        }else{
        	self.media.play();
        }
	}
	this.stop=function(){
		if(self.usePhonegap){
			self.media.stop();
        }else{
        	self.media.stop();
        }
	}
	this.pause=function(){
		if(self.usePhonegap){
			self.media.pause();
        }else{
        	self.media.pause();	
        }
	}
	this.destroy=function(){
		if(self.usePhonegap){
			self.media.release();
		}
	}
	self.init();
}