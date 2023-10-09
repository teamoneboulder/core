modules.bg_upload=function(){
	var self=this;
	this.init=function(){
		if(window.FileTransferManager){
			//alert('init!!')
			if(modules.version.min('7.0.0')){
				self.uploader=FileTransferManager.init({},function(event){
					 // if (event.state == 'UPLOADED') {
				  //       console.log("upload: " + event.id + " has been completed successfully");
				  //       console.log(event.statusCode, event.serverResponse);
				  //   } else if (event.state == 'FAILED') {
				  //       if (event.id) {
				  //           console.log("upload: " + event.id + " has failed");
				  //       } else {
				  //           console.error("uploader caught an error: " + event.error);
				  //       }
				  //   } else if (event.state == 'UPLOADING') {
				  //       console.log("uploading: " + event.id + " progress: " + event.progress + "%");
				  //   }
				  console.log(event)
				  	var upload=event;
			    	switch(event.state){
			    		case 'UPLOADED':
			    			var data=self.data[upload.id];
					    	if(data){
						    	try{
						    		if(app.device=='Android'){
							         var r=JSON.parse(upload.serverResponse);
							     	}else if(app.device=='iOS'){
							     		var r=upload.serverResponse;
							     	}
							     	//_alert(JSON.stringify(r));
							         if(r.success){
							            data.cb({
							                path:r.path,
							                ar:r.ar,
							                ext:r.ext,
							                poster:r.poster,
							                length:r.length
							            });
							         }else{
							         	if(app.isdev){
							         		_alert(JSON.stringify(r));
							         	}
							            console.log(r);
							            data.cb(false);
							         }
							     }catch(e){
							     	console.log(e);
							     	data.cb(false);
							     }
							 }
					    	self.clear(upload.id);//done!
			    		break;
			    		case 'UPLOADING':
				    		var data=self.data[upload.id];
					        //console.log(data.fileobj)
					        if(data){
						        var p=upload.progress;
						        if(data.opts&&data.opts.onProgress) data.opts.onProgress(p,data.fileobj);
						        if(data.opts&&data.opts.bindOnProgress) data.opts.bindOnProgress(p,data.fileobj);
						        if(p==100){
						        }
						    }
			    		break;
			    		case 'FAILED':
					    	var data=self.data[event.id];
					         if (event.id) {
					             console.log("upload: " + event.id + " has failed:"+event.error);
					             var msg="upload: " + event.id + " has failed:"+JSON.stringify(event)
					         } else {
					             console.error("uploader caught an error: " + event.error);
					             var msg="uploader caught an error: " + event.error;
					         }
					         if(app.isdev){
					         	_alert(msg);
					         }
					         data.cb(false);
			    		break;
			    	}
				});
				//console.log(self.uploader)
			    // self.uploader.on('event', function(event) {
			    // 	var upload=event.upload;
			    // 	switch(event.state){
			    // 		case 'success':
			    // 			var data=self.data[upload.id];
					  //   	if(data){
						 //    	try{
						 //    		if(app.device=='Android'){
							//          var r=JSON.parse(upload.serverResponse);
							//      	}else if(app.device=='iOS'){
							//      		var r=upload.serverResponse;
							//      	}
							//      	//_alert(JSON.stringify(r));
							//          if(r.success){
							//             data.cb({
							//                 path:r.path,
							//                 ar:r.ar,
							//                 ext:r.ext,
							//                 poster:r.poster,
							//                 length:r.length
							//             });
							//          }else{
							//          	if(app.isdev){
							//          		_alert(JSON.stringify(r));
							//          	}
							//             console.log(r);
							//             data.cb(false);
							//          }
							//      }catch(e){
							//      	console.log(e);
							//      	data.cb(false);
							//      }
							//  }
					  //   	self.clear(upload.id);//done!
			    // 		break;
			    // 		case 'progress':
				   //  		var data=self.data[upload.id];
					  //       //console.log(data.fileobj)
					  //       if(data){
						 //        var p=upload.progress;
						 //        if(data.opts&&data.opts.onProgress) data.opts.onProgress(p,data.fileobj);
						 //        if(data.opts&&data.opts.bindOnProgress) data.opts.bindOnProgress(p,data.fileobj);
						 //        if(p==100){
						 //        }
						 //    }
			    // 		break;
			    // 		case 'error':
				   //  		if(typeof uploadException=='string'){
					  //   		_alert(uploadException);
					  //   	}else{
						 //    	var data=self.data[uploadException.id];
						 //         if (uploadException.id) {
						 //             console.log("upload: " + uploadException.id + " has failed:"+uploadException.error);
						 //             var msg="upload: " + uploadException.id + " has failed:"+JSON.stringify(uploadException)
						 //         } else {
						 //             console.error("uploader caught an error: " + uploadException.error);
						 //             var msg="uploader caught an error: " + uploadException.error;
						 //         }
						 //         if(app.isdev){
						 //         	_alert(msg);
						 //         }
						 //         data.cb(false);
						 //     }
			    // 		break;
			    // 	}
			    // });
			}else{
				self.uploader=FileTransferManager.init();
			    self.uploader.on('success', function(upload) {
			    	var data=self.data[upload.id];
			    	if(data){
				    	try{
				    		if(app.device=='Android'){
					         var r=JSON.parse(upload.serverResponse);
					     	}else if(app.device=='iOS'){
					     		var r=upload.serverResponse;
					     	}
					     	//_alert(JSON.stringify(r));
					         if(r.success){
					            data.cb({
					                path:r.path,
					                ar:r.ar,
					                ext:r.ext,
					                poster:r.poster,
					                length:r.length
					            });
					         }else{
					         	if(app.isdev){
					         		_alert(JSON.stringify(r));
					         	}
					            console.log(r);
					            data.cb(false);
					         }
					     }catch(e){
					     	console.log(e);
					     	data.cb(false);
					     }
					 }
			    	self.clear(upload.id);//done!
			    });
			    self.uploader.on('progress', function(upload) {
			        //console.log("uploading: " + upload.id + " progress: " + upload.progress + "%");
			        var data=self.data[upload.id];
			        //console.log(data.fileobj)
			        if(data){
				        var p=upload.progress;
				        if(data.opts&&data.opts.onProgress) data.opts.onProgress(p,data.fileobj);
				        if(data.opts&&data.opts.bindOnProgress) data.opts.bindOnProgress(p,data.fileobj);
				        if(p==100){
				        }
				    }
			    });
			    self.uploader.on('error', function(uploadException) {
			    	if(typeof uploadException=='string'){
			    		_alert(uploadException);
			    	}else{
				    	var data=self.data[uploadException.id];
				         if (uploadException.id) {
				             console.log("upload: " + uploadException.id + " has failed:"+uploadException.error);
				             var msg="upload: " + uploadException.id + " has failed:"+JSON.stringify(uploadException)
				         } else {
				             console.error("uploader caught an error: " + uploadException.error);
				             var msg="uploader caught an error: " + uploadException.error;
				         }
				         if(app.isdev){
				         	_alert(msg);
				         }
				         data.cb(false);
				     }
			    });
			}
		}else{
			self.uploader=false;
		}
	}
	this.isUploading=function(){
		return self.uploading;
	}
	this.clear=function(id){
		if(self.data[id]) delete self.data[id];
		self.uploading=false;
	}
	this.abort=function(id){
		self.uploading=false;
		self.uploader.removeUpload(id, function(){
            self.clear(id);
        }, function(err){
            //could abort the upload
        });
	}
	this.queue=function(imageURI,opts,fileobj,cb){
		self.data[fileobj.id]={
         	fileobj:fileobj,
         	opts:opts,
         	cb:cb
         }
         if(typeof opts.data=='object') opts.data={_base64:btoa(JSON.stringify(opts.data))};
		var payload = {
             "id": fileobj.id,
             "filePath": imageURI,
             "fileKey": "file",
             "serverUrl": app.uploadurl+'/upload/'+opts.module+'/submit',
             "headers": {
             },
             "parameters": opts.data
         };
         //_alert(JSON.stringify(payload))
        // _alert(JSON.stringify(payload));
         self.uploading=true;
         self.uploader.startUpload(payload);
	}
	self.data={};
	self.init();
}