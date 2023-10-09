modules.cropuploader=function(options){
	var self=this;
	self.options=options;
	if(options.btn&&options.btn.length){
		options.btn.stap(function(e){
			phi.stop(e);
			if(options.onClick) options.onClick()
			self.show();
		},1,'tapactive');
	}
	if(options.btns&&options.btns.length){
		$.each(options.btns,function(i,v){
			v.stap(function(e){
				if(options.onClick) options.onClick()
				phi.stop(e);
				self.show();
			},1,'tapactive')
		})
	}
	this.getCroppedPicture=function(){
		//set canvas with info about cropped info
		if(self.cropdata[options.returnCropKey]){
			self.cropper.setData(self.cropdata[options.returnCropKey]);
		}
		self.cropper.getCroppedCanvas().toBlob(function(blob){
			var imageUrl = URL.createObjectURL(blob);
			if(options.onCropReady) options.onCropReady(imageUrl);
			if(options.disableBodyScroll){
				self.bound=false;
				$('html,body').removeClass('preventScroll');
				$('html,body').off('ontouchend',self.onScroll)
			}
			self.view.hide();
		});
	}
	this.ensureButtons=function(){
		var l=self.options.data.crops.length-1;
		if(self.cimg){
			if(l==self.cIndex){
				self.ele.find('.finishbuttons').show();
				self.ele.find('.stepbuttons').hide();
				self.ele.find('.changebar').show();
			}else{
				self.ele.find('.stepbuttons').show();
				self.ele.find('.finishbuttons').hide();
				self.ele.find('.changebar').show();
			}
			if(self.cIndex==0){
				self.ele.find('.x_back').hide();
			}else{
				self.ele.find('.x_back').show();
			}
		}else{
			self.ele.find('.stepbuttons').hide();
			self.ele.find('.finishbuttons').hide();
			//self.ele.find('.changebar').show();
			self.ele.find('.changebar').hide();
		}
		// if(self.cimg){
		// 	self.ele.find('.x_save').removeClass('disabled');
		// }else{
		// 	self.ele.find('.x_save').addClass('disabled');
		// }
	}
	this.saving=function(){
		self.cv=self.ele.find('.x_save').html();
		self.ele.find('.x_save').html('<i class="icon-refresh animate-spin"></i>');
	}
	this.onSaveError=function(){
		self.ele.find('.x_save').html(self.cv);
	}
	this.destroy=function(){
		self.img=false;
		if(self.cropper) self.cropper.destroy();
		self.cropper=false;
		self.cropdata={};//clear out
		if(self.view) self.view.hide();
		if(options.disableBodyScroll&&self.bound){
			self.bound=false;
			$('html,body').removeClass('preventScroll');
			$('html,body').off('ontouchend',self.onScroll)
		}
		if(options.onExit) options.onExit();
	}
	this.getAr=function(cropper){
		var data=options.data.crops[self.cIndex];
		if(cropper&&data.responsiveCrop) return false;
		return data.width/data.height;
	}
	this.cacheCropping=function(){
		if(self.cropper){
			var data=options.data.crops[self.cIndex];
			self.cropdata[data.cropKey]=self.cropper.getData();
		}
	}
	this.setCropping=function(imgdata){
		if(imgdata){
			self.ele.find('.x_upload.initial').hide();
			self.ele.find('.croparea').show();
			self.ele.find('.cropimg').attr('src',imgdata);
			self.cimg=true;
		}
		var d=self.options.data.crops[self.cIndex];
		if(self.cropper){
			if(self.getAr(1)) self.cropper.setAspectRatio(self.getAr(1));
			var data=(self.cropdata[d.cropKey])?self.cropdata[d.cropKey]:false;
			if(data){
				self.cropper.setData(data);
			}
		}else{
			self.cropper = new Cropper(self.ele.find('.cropimg')[0], {
				viewMode:1,
				dragMode:'move',
				data:(self.cropdata[d.cropKey])?self.cropdata[d.cropKey]:false,
			  	aspectRatio: (self.getAr(1))?self.getAr(1):null,
			  	autoCropArea:1,
			  	crop:function(data){
			  		var d=self.options.data.crops[self.cIndex];
			  		self.cropdata[d.cropKey]=data.detail;
			  	}
			});
		}
		//if(d.title) self.ele.find('.title').html(d.title);
		if(d.title&&self.ele){
			self.ele.find('.pagesubtitle').html(d.title);
		}		
		self.ensureButtons();
	}
	this.cropdata={};
	this.back=function(){
		//self.cacheCropping();
		self.cIndex--;
		self.setCropping();
	}
	this.next=function(finish){
		//self.cacheCropping();
		if(finish){
			self.processUpload();
		}else{
			self.cIndex++;
			self.setCropping();
		}
	}
	this.clearUploadProcess=function(){
		if(self.isSaving){
			self.isSaving=false;
			self.ele.find('.x_back').show();
            self.ele.find('.progbar').hide();
			self.onSaveError();
		}
	}
	this.processUpload=function(){
		if(self.isSaving) return false;
		//alert(JSON.stringify(self.cropdata))
		self.uploader.processUpload(self.cropdata);
		self.saving();
		self.isSaving=true;
	}
	this.bind=function(){
		self.ensureButtons()
		self.uploader=new modules.imageuploader({
			ele:self.ele.find('.x_upload'),
            apiurl:app.uploadurl,
            uploadOnClick:true,
            directUpload:(options.directUpload)?1:0,
            data:{
                sizes:options.sizes,
                path:'/upload/'
            },
            onExit:function(force,no_action){
            	//_alert('action '+no_action)
            	if(self.hasPreview()&&!no_action){
            		self.destroy();
            	}
            },
            onError:function(msg,obj){
                modules.toast({
                	content:msg,
                    remove:2500,
                    icon:'icon-warning-sign'
                });
                self.clearUploadProcess();
            },
            onPreviewReady:function(data,obj){//render preview
            	if(self.showPreviewArea) self.showPreviewArea();
            	if(self.cropper){
            		self.cropper.destroy();
            		self.cropper=false;
            	}
            	self.cIndex=0;
             	self.setCropping(data);
            },
            onProgress:function(p,obj){
                self.ele.find('.prog').css('width',p+'%');
                if(options.onProgress) options.onProgress(p);
            },
            onClick:function(){
            	//self.ensureHide();
            },
            onUploadStart:function(){
            	if(options.uploadInBackground){
            		self.getCroppedPicture();
            	}else{
            		self.ele.find('.x_back').hide();
            		self.ele.find('.progbar').show();
            		self.ele.find('.changebar').hide();
            	}
            },
            onSuccess:function(obj,resp){
            	var img={
                    path:resp.path,
                    ext:resp.ext,
                    ar:resp.ar,
                    v:resp.v
                };
                self.cimg=false;
                if(self.options.onSuccess) self.options.onSuccess(img,self)
            }
        })
		//ele.find('.x_upload').bindUploader(opts);
		self.ele.find('.x_cancel').stap(function(e){
			phi.stop(e);
			if(self.uploader.isUploading()){
				self.uploader.abort();
			}
			self.view.hide();
			self.destroy();
		},1,'tapactive')
		self.ele.find('.x_save').stap(function(){
			self.next(1);
		},1,'tapactive')
		self.ele.find('.x_next').stap(function(){
			self.next();
		},1,'tapactive')
		self.ele.find('.x_back').stap(function(){
			self.back();
		},1,'tapactive')
	}
	this.isUploading=function(){
		return self.uploader.isUploading()
	}
	this.onScroll=function(e){
		e.preventDefault();
		return false;
	}
	this.hasPreview=function(){
		return false;//disable until extensive testing is done!
		if(isPhoneGap()||!isMobile){
			return true;
		}
		return false;
	}
	this.show=function(){
		self.isSaving=false;
		self.cIndex=0;
		var availWidth=700-40;
		var bw=$('body').width();
		if(bw<availWidth) availWidth=bw-40;
		var ar=self.getAr();
		if(!ar){
			ar=1.5;
			availWidth=availWidth*.3;
		}else{
			if(ar<1.5){
				availWidth=availWidth*.3;
			}
		}
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
				if(self.options.data.crops[self.cIndex].title){
					if(self.ele) self.ele.find('.pagesubtitle').html(self.options.data.crops[self.cIndex].title);
				}
			},
			templates:{
				alert:'cropuploader',
				page:'cropuploader_mobile'
			},
			hasPreview:function(){
				return self.hasPreview()
			},
			preview:function(showView){
				self.showPreviewArea=showView;
				//showView();
			},
			data:{
				data:options.data,
				availWidth:availWidth,
				ar:ar
			},
			binding:function(ele){
				self.ele=ele;
				self.bind();
			}
		})
		self.view.show();
		if(options.disableBodyScroll){
			self.bound=true;
			$('html,body').addClass('preventScroll');
			$('html,body').on('ontouchend',self.onScroll)
		}
	}
}