if(!window.modules) window.modules={};
modules.multiimage=function(options){
  var self=this;
  this.addBlob=function(blob){
      self.uploader._addFiles([{
        blob:blob,
        name:'Pasted Image'
      }]);
  }
  this.isProcessing=function(){
    if(self.uploader){
      return self.uploader._active;
    }else{
      return self.processing;
    }
  }
    var queue = async.queue(function (task, callback) {
      self.processing=1;
        uploadimg(task,callback);
    }, 4);//max of 4 at a time
    // assign a callback
    queue.drain = function(){
      self.processing=0;
        if(options.onAllUploadsComplete) options.onAllUploadsComplete();
    }
    function uploadimg(task,callback){
        var imageURI=task.imageURI;
        var opts=task.opts;
        var fileobj=task.fileobj;
        var cb=task.cb;
        var options = new FileUploadOptions();
        options.fileKey="file";
        options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
        options.mimeType="image/jpeg";
        options.params = $.extend(true,{},opts.data);
        options.chunkedMode = false;
        var ft = new FileTransfer();
        // var progcent=opts.ele.find('.uploadsize');
        // var progbar=opts.ele.find('.progbar');
        // progbar.css('width','0%');
        var aborted=false;
        ft.onprogress = function(progressEvent) {
            if (progressEvent.lengthComputable) {
                var p=parseInt((progressEvent.loaded / progressEvent.total)*100,10);
                // progbar.css('width',p+'%');
                // progcent.html(p+'%');
                //app.core.log('Upload progress ['+p+'%]',1);
                if(opts.onProgress) opts.onProgress(p,fileobj);
                if(p==100){
                    
                }
            }
        };
        if(opts.onProcessStart) opts.onProcessStart(fileobj,function(){//cancel upload and move to next
            ft.abort();//will trigger the error in upload
        });
        var s=$.extend(true,[],options.params.sizes);
        options.params.sizes=s.join(',');
        ft.upload(imageURI, app.uploadurl+'/upload/image/submit', function(success){
            //app.core.log(success,1);
            var r=JSON.parse(success.response);
            //_alert(JSON.stringify(r))
            if(r&&r.path){
                cb({
                    path:r.path,
                    ext:r.ext,
                    ar:parseFloat(r.ar)
                },fileobj)
                callback();
            }else{//error
                cb(false,fileobj);
                callback();
            }
        }, function(fail){
            //alert('Error uploading image');
            cb(false,fileobj);
            callback();
        }, options);
    }
    this.destroy=function(){
      if(self.uploader) self.uploader.destroy();
    }
    self.checkPermissions=function(){
      var ct=new Date().getTime();
      if(!self.checkStart) self.checkStart=ct;
      var diff=(ct-self.checkStart)/1000;
      if(diff<30){
        setTimeout(function(){
           window.cordova.plugins.imagegallery.hasReadPermission(
            function(result) {
              // if this is 'false' you probably want to call 'requestReadPermission' now
              if(result){
                self.checkStart=false;
                pickImages();
              }else{
                self.checkPermissions();
              }
            }
          )
        },500);
      }else{
        self.checkStart=false;
      }
    }
    function pickImages(){
        if(app.device=='iOS') phone.statusBar.set('dark');
        window.cordova.plugins.imagegallery.get(
            function(results) {
                phone.statusBar.set();//back to default
                //if(app.device=='iOS') window.StatusBar.styleLightContent();
                if(app.device=='Android'){//when permission is first given for photo access
                  if(results=='OK'){//andriod
                    if(!self.checkStart) self.checkPermissions();//for next 30 seconds, see if the response changes!
                    return false;
                  }
                }
                for (var i = 0; i < results.length; i++) {
                    var id='I'+Math.uuid(10);//unique for each image uploaded
                    var fileobj={id:id};
                    var data=results[i];
                    if(options.onUploadStart) options.onUploadStart(options);//to show prog bar 
                    queue.push({
                        imageURI:data,
                        opts:options,
                        fileobj:fileobj,
                        cb:function(resp,fileobj){
                            if(resp){
                                if(options.onSuccess) options.onSuccess(data,resp,fileobj);
                            }else{
                                if(options.onError) options.onError(fileobj);
                                else _alert('error!')
                            }
                        }
                    });
                    if(options.onPreviewReady) options.onPreviewReady(data,fileobj);
                }
            }, function (error) {
                if(app.device=='iOS') phone.statusBar.set();//back to default
                //_alert('error')
                console.log('Error: ' + error);
            }, {
                maximumImagesCount: 10
            }
        );
    }
	if(isPhoneGap()){
        if(options.ele){
      		  options.ele.stap(function(){
                  if(options.onClick) options.onClick();
                  //if(app.device=='iOS') window.StatusBar.styleDefault();
                  pickImages();
      		  },1,'tapactive')
        }else{
            pickImages();
        }
	}else{
    if(app.isdev){
      if(isPhoneGap()){
        _alert('imagePicker doesnt exist')
      }
    }
        var exts= ['jpg', 'jpeg', 'png']
        var dopts={
              button: options.ele[0], // file upload button
              url: app.uploadurl+'/upload/image/submit', // server side handler
              name: 'file', // upload parameter name        
              responseType: 'jsonp',
              progressUrl: app.uploadurl+'/upload/image/progress',
              cors:true,
              multiple:1,
              allowedExtensions:exts,
              hoverClass:'hover',
              maxSize: 1000000, // kilobytes
              onSubmit: function(obj) {
                  if(options.onClick&&options.onClick()===false){
                    return false;
                  }else{
                    obj.mbsize=(obj.size/(1000)).toFixed(1);
                    if(options.onSubmit) options.onSubmit(obj);
                    if(options.onUploadStart) options.onUploadStart(options);//to show prog bar 
                  }
              },
              onProgress:function(p,fileobj){
                if(options.onProgress) options.onProgress(p,fileobj);
              },
              onQueue:function(obj){
                if(exts.indexOf(obj.ext.toLowerCase())>=0){
                  $.fn.bindUploader.localUrl(obj.file,function(timg){
                      if(options.onPreviewReady) options.onPreviewReady(timg,obj);
                  });
                }
              },
              onSizeError:function(obj){
                  options.onError('Invalid File Size',obj)
              },
              onExtError:function(obj){
                  options.onError('Invalid File Type',obj)
              },
              onComplete: function(obj, response) {
                  if(options.onSuccess){
                    var resp=JSON.parse(response);
                    options.onSuccess(obj,resp,obj);
                  }
              }
          };
          dopts.data=$.extend(true,{},options.data);
          self.uploader= new ss.SimpleUpload(dopts);
	}
}