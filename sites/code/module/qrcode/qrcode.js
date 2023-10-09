modules.qrcode={
	scanner:{
		show:function(opts){
			var self=this;
			if(!isPhoneGap()&&!app.isdev){
				return app.comingSoon('QR code scanning will be available in web shortly');
			}
			self.lastStatus=phone.statusBar.getCurrent()
			self.opts=opts;
			self.scanstarted=false;
			self.lighton=0;
			self.currentPage='';
			self.scannerele=opts.ele;
			if(isPhoneGap()){
				self.load();
			}else{
				phone.background.clear();
			}
		},
		hide:function(){
			var self=this;
			// self.scannerele.find('#scanoverlay').show();
			phone.statusBar.set(self.lastStatus);
			if(isPhoneGap()) phone.background.reset();
			if(self.scanTimeout) clearTimeout(self.scanTimeout);
			if(window.QRScanner) QRScanner.destroy(function(status){
			  //console.log(status);
			});
		},
		load:function(){
			var self=this;
			if(isPhoneGap()){
				if(!window.QRScanner){
					_alert('QRScanner doesnt exist');
					return false;
				}
				QRScanner.prepare(function(err,status){
					 if (err) {
					 	_alert(err);
					   // here we can handle errors and clean up any loose ends.
					   console.error(err);
					  }
					  if (status.authorized) {
					  	self.authorized=true;
					    // W00t, you have camera access and the scanner is initialized.
					    // QRscanner.show() should feel very fast.
					  } else if (status.denied) {
					  	self.error='denied';
					   // The video preview will remain black, and scanning is disabled. We can
					   // try to ask the user to change their mind, but we'll have to send them
					   // to their device settings with `QRScanner.openSettings()`.
					  } else {
					  	self.error='invalid_permissions';
					    // we didn't get permission, but we didn't get permanently denied. (On
					    // Android, a denial isn't permanent unless the user checks the "Don't
					    // ask again" box.) We can ask again at the next relevant opportunity.
					  }
					  self.prepared=true;
					  phone.background.clear();
					  modules.qrcode.scanner.start();
				}); // show the prompt
			}else{

			}
		},
		start:function(retry){
			var self=this;
			self.scanstarted=true;
			phone.statusBar.set('light');
			if(isPhoneGap()){
				if(self.prepared){
					if(self.authorized){
						// self.scannerele.find('#scanoverlay').fadeOut(500,function(){
						// })
						QRScanner.show();
						self.scan();
					}else{
						_alert('Error: '+self.error);
					}
				}else{
					if(retry<40){//2 sec
						setTimeout(function(){
							if(!retry) retry=0;
							retry++
							self.start(retry)
						},50);
					}else{
						_alert('Unable to load!');
					}
				}
			}else{
				// self.scannerele.find('#scanoverlay').fadeOut(500,function(){
				// })
			}
		},
		stop:function(){
			var self=this;
			this.scanActive=false;
			if(self.scanTimeout) clearTimeout(self.scanTimeout)
		},
		onSuccess:function(scan){
			//display
			var self=this;
			if(self.scannerele) self.scannerele.find('.successarea').render({
				template:self.opts.templates.success,
				data:{
					data:scan
				},
				binding:function(ele){
					setTimeout(function(){
						ele.fadeOut(500,function(){
							$(this).remove();
						})
					},5000);
				}
			})
		},
		onError:function(msg){
			var self=this;
			if(self.scannerele) self.scannerele.find('.successarea').render({
				template:self.opts.templates.fail,
				data:{
					error:msg
				},
				binding:function(ele){
					setTimeout(function(){
						ele.fadeOut(500,function(){
							$(this).remove();
						})
					},5000);
				}
			})
		},
		test:function(id){
			var self=this;
			if(self.opts&&self.opts.onScan) self.opts.onScan(id);
		    self.validate(id,function(success,scan){
		    	if(success){
		    		console.log(scan)
		    		self.onSuccess(scan);
		    	}
		    })
		},
		validate:function(ticket_id,cb){
			var self=this;
            //could validate another way too like cache? this might want to be 
            //_alert('validate '+ticket_id)
            if(self.opts.validateUrl){
	            app.api({
	                url:self.opts.validateUrl,
	                data:{
	                    ticket:ticket_id
	                },
	                timeout:5000,
	                callback:function(resp){
	                	//_alert(JSON.stringigy(resp));
	                	if(resp.success){
		                	if(resp.valid){
		                		cb(true,resp.scan);
		                	}else{
		                		cb(false);
		                	}
		                }else{
		                	self.onError('Error: '+resp.error);
		                	cb(false);
		                }
	                }
	            });
	        }else{
	        	cb(true,{
	        		ticket:{
	        			name:'Manual Scan: '+ticket_id
	        		}
	        	});
	        }
        },
		onScan:function(text){
			var self=this;
			// The scan completed, display the contents of the QR code:
		    if(self.opts&&self.opts.onScan) self.opts.onScan(text);
		    //self.scan();
		    self.validate(text,function(success,scan){
		    	if(success){
		    		self.onSuccess(scan);
		    	}
		    })
		},
		scan:function(){
			var self=this;
			this.scanActive=true;
			QRScanner.scan(function(err,text){
				if(!self.scanActive) return false;
		  		 if(err){
				    // an error occurred, or the scan was canceled (error code `6`)
				  } else {
				  	self.onScan(text);
				    self.scanTimeout=setTimeout(function(){//give a bit of delay for the scanner to get back
				    	self.scan();
				    },1500);
				  }
		  	});
		}
	},
	drawGuide:function(c,success){
        if(!c) return console.warn('no canvas passed');
        c.width=$('body').width()
        c.height=$('body').height()
        var ctx = c.getContext("2d");
        //always start by clearing it out!
        ctx.clearRect(0, 0, $('body').width(), $('body').height());
        ctx.beginPath();
        ctx.rect(0, 0, $('body').width(), $('body').height());
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fill();
        ctx.save();
        function roundRect(ctx, x, y, width, height, radius) {
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + width - radius, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
          ctx.lineTo(x + width, y + height - radius);
          ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
          ctx.lineTo(x + radius, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
            ctx.globalCompositeOperation = 'destination-out'
            ctx.fill();
        }
        function drawCorners(ctx, x, y, width, height, radius,padding) {
            var fill='#BB0000';
            if(success) fill='#4BB543';
            //tr
            ctx.beginPath();
            ctx.lineWidth=5;
            ctx.moveTo(x + width-radius-padding, y);
            ctx.lineTo(x + width-radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y+radius+padding);
            ctx.lineCap="round";
            ctx.strokeStyle=fill
            ctx.fillStyle =fill;
            ctx.stroke();
            ctx.closePath();
            //br
            ctx.beginPath();
            ctx.lineWidth=5;
            ctx.moveTo(x + width, y+height-radius-padding);
            ctx.lineTo(x + width, y+height-radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + width-radius-padding, y+height);
            ctx.lineCap="round";
            ctx.strokeStyle=fill
            ctx.fillStyle =fill;
            ctx.stroke();
            ctx.closePath();
            //bl
            ctx.beginPath();
            ctx.lineWidth=5;
            ctx.moveTo(x + padding+radius, y+height);
            ctx.lineTo(x +radius, y+height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y+height-radius-padding);
            ctx.lineCap="round";
            ctx.strokeStyle=fill
            ctx.fillStyle =fill;
            ctx.stroke();
            ctx.closePath();
            //tl
            ctx.beginPath();
            ctx.lineWidth=5;
            ctx.moveTo(x, y+radius+padding);
            ctx.lineTo(x,y+radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.lineTo(x + padding+radius, y);
            ctx.lineCap="round";
            ctx.strokeStyle=fill
            ctx.fillStyle =fill;
            ctx.stroke();
            ctx.closePath();
        }
        var size=250;
        if($('body').height()>$('body').width()){
            var size=$('body').width()*.5;//try to fill 80% of the screen
        }else{
            var size=$('body').height()*.5;//try to fill 80% of the screen
        }
        if(size<200) size=200;//min size of 250x250
        if(size>500) size=350;//max of 500x500
        var hh=$('body').height()/2;
        var hw=$('body').width()/2;
        var y=hh-size/2
        var width=size;
        var x=hw-size/2;
        var height=size;
        var radius=15
        var padding=size/10;
        roundRect(ctx,x,y,width,height,radius);
        ctx.restore();
        drawCorners(ctx,x,y,width,height,radius,padding);
    },
	ensure:function(cb){//create canvas!
		var self=this;
		if(!self.ele){
			$('body').render({
				template:'qrcode',
				binding:function(ele){
					self.ele=ele;
					cb();
				}
			})
		}else{
			cb();
		}
	},
	getBase64:function(content,cb){
		var self=this;
		self.ensure(function(){
			if(!self.qrcode){
				self.qrcode=new QRCode(self.ele[0], {
					text: content,
					width: 300,
					height: 300,
					colorDark : "#000000",
					colorLight : "#ffffff",
					correctLevel : QRCode.CorrectLevel.H
				});
			}else{
				self.qrcode.clear();
				self.qrcode.makeCode(content);
			}
			var data=self.ele.find('canvas')[0].toDataURL();
			//self.ele.children().remove();
			cb(data);
		});	
	}
}