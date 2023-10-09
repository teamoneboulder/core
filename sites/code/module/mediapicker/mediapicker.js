if(!window.modules) window.modules={};
modules.mediapicker=function(options){
  var self=this;
  this.addBlob=function(blob){
      self.uploader._addFiles([{
        blob:blob,
        name:'Pasted Image'
      }]);
  }
    var queue = async.queue(function (task, callback) {
        uploadimg(task,callback);
    }, 4);//max of 4 at a time
    // assign a callback
    queue.drain = function(){
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
        console.log('UPLOAD: '+imageURI);
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
    self.checkPermissions=function(){
      var ct=new Date().getTime();
      if(!self.checkStart) self.checkStart=ct;
      var diff=(ct-self.checkStart)/1000;
      if(diff<30){
        setTimeout(function(){
           if(true||window.cordova.plugins.imagegallery.hasReadPermission) window.cordova.plugins.imagegallery.hasReadPermission(
            function(result) {
              // if this is 'false' you probably want to call 'requestReadPermission' now
              if(result){
                self.checkStart=false;
                pickImages();
              }else{
                self.checkPermissions();
              }
            }
          );
          else {
            self.checkStart=false;
            pickImages();
          }
        },500);
      }else{
        self.checkStart=false;
      }
    }
    function pickImages(){
        phone.statusBar.set('dark');
        if(app.device=='Android'&&(options.galleryOpts.mode=='Video'||options.galleryOpts.mode=='VideoOnly')){
          //_alert('here');
          //options.galleryOpts.mode='Video'
          // window.cordova.plugins.imagegallery.get(
          //     function(results) {
          //         phone.statusBar.set();//back to default
          //         //if(app.device=='iOS') window.StatusBar.styleLightContent();
          //         if(app.device=='Android'){//when permission is first given for photo access
          //           if(results=='OK'){//andriod
          //             if(!self.checkStart) self.checkPermissions();//for next 30 seconds, see if the response changes!
          //             return false;
          //           }
          //         }
          //         if(options.onPick) options.onPick(results);
          //         else if(app.isdev){
          //           _alert('invalid options, no onPick')
          //         }
          //     }, function (error) {
          //         phone.statusBar.set();//back to default
          //         //_alert('error')
          //         if(options.onExit) options.onExit();
          //         if(error=='Closed') return false;
          //         if(app.isdev){
          //           _alert('Error: ' + error)
          //         }else{
          //           window.onerror('Error: ' + error);
          //         }
          //     }, options.galleryOpts.mode
          // );
          window.AdvancedImagePicker.present({
              mediaType:'VIDEO',
              scrollIndicatorDateFormat:"MM/DD/YYYY",
              showCameraTile:false,
              showTitle:true,
              startOnScreen:'Video',
              title:'Select Video',
              max:1
          }, function(success) {
            var uris=[];
            $.each(success,function(i,v){
              uris.push(v.src);//.replace('content://','file://')
            })
            window.FilePath.resolveNativePath(uris[0], function(result) {
              if(options.onPick) options.onPick([result]);
            });
          }, function (error) {
              if(options.onExit) options.onExit();
          });
        }else{
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
                  if(options.onPick) options.onPick(results);
                  else if(app.isdev){
                    _alert('invalid options, no onPick')
                  }
              }, function (error) {
                  phone.statusBar.set();//back to default
                  //_alert('error')
                  if(options.onExit) options.onExit();
                  if(error=='Closed') return false;
                  if(app.isdev){
                    _alert('Error: ' + error)
                  }else{
                    window.onerror('Error: ' + error);
                  }
              }, options.galleryOpts
          );
        }
    }
	if(isPhoneGap()){
        if(options.ele){
      		  options.ele.stap(function(){
                  if(options.onClick) options.onClick();
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
                if(exts.indexOf(obj.ext)>=0){
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