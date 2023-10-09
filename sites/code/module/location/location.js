modules.location=function(options){
	var self=this;
	self.options=$.extend(true,{
		timeout:30000,
		maxAccuracy:10000,
		sampleTime:false
	},options);
    this.get=function(){
        if(self.locating){
            return false;
        }else{
        	self.bestLocation={};
        	self.error='';
            self.locating=true;
            self.startTime=new Date().getTime();
            self.locate();
            if(self.nto) clearTimeout(self.nto);
            self.nto=setTimeout(function(){
               	self.error='We could not find your location'
            },self.options.timeout);
            if(self.options.sampleTime){
            	 self.sto=setTimeout(function(){
            	 	self.error='We could not find your location';
	               	self.locateCallback();
	            },self.options.sampleTime);
            }
        }
    }
    this.bestLocation={};
    this.locateCallback=function(){
        if(self.bestLocation.lat){
            if(self.options.onLocation) self.options.onLocation(self.bestLocation);
        }else{
        	if(self.options.onError) self.options.onError(self.error);
        }
        if(self.sto) clearTimeout(self.sto);
        if(self.nto) clearTimeout(self.nto);
        self.locating=false;
    }
    this.locate=function(){
    	console.log('trying to get location');
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(function(position){
                //override
                if(position.coords){
                	console.log('accuracy: '+position.coords.accuracy)
                    if(position.coords.accuracy < self.options.maxAccuracy){
                    	if(self.options.sampleTime){
                    		if(self.bestLocation&&self.bestLocation.accuracy&&self.bestLocation.accuracy>position.coords.accuracy){
                    			self.bestLocation={lat:position.coords.latitude,lng:position.coords.longitude,accuracy:position.coords.accuracy};
                    		}else if(!self.bestLocation.accuracy){
                    			self.bestLocation={lat:position.coords.latitude,lng:position.coords.longitude,accuracy:position.coords.accuracy};
                    		}
                    		if((new Date().getTime()-self.startTime)>self.options.sampleTime){
                    			//self.locateCallback(self.bestLocation);
                    		}else{
                    			self.locate();
                    		}
                    	}else{
                    		self.bestLocation={lat:position.coords.latitude,lng:position.coords.longitude,accuracy:position.coords.accuracy};
                        	self.locateCallback()
                        }
                    }else{
                    	self.error='We could not find your location';
                    }
                }
               	self.error='We could not find your location'
            },function(){
            	self.error='We could not find your location';
            });
        }else{
            cb(false,'We could not find your location');
        }
    }
}