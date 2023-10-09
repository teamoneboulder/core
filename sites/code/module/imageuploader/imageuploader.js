if(isPhoneGap()){
  if(window.cordova.plugins.imagegallery) window.cordova.plugins.imagegallery.get=function(success,fail,opts){
      if(window.cordova.plugins.imagegallery.ensurePermissions&&app.device=='iOS'){
          window.cordova.plugins.imagegallery.ensurePermissions(function(resp){
            if(resp=='success'||resp=='authorized'){
              window.cordova.plugins.imagegallery.show(success,fail,opts);
            }else{
              navigator.notification.confirm(
                  'Please update your photo settings to "All Photos" to uploaded photos.', // message
                   function(index){
                      if(index==1) cordova.plugins.diagnostic.switchToSettings(function(){}, function(){});
                   },            // callback to invoke with index of button pressed
                  'Settings Update Needed',           // title
                  ['Go To Settings','Close']     // buttonLabels
              );
            }
          })
      }else{
          window.cordova.plugins.imagegallery.show(success,fail,opts);
      }
  };
}
modules.imageuploader=function(opts){
  var self=this;
  self.options=opts;
  self.uploaders={};
  self.uploadlist=[]
  this.isUploading=function(){
    if(self.uploading) return true;
    return false;
  }
  this.abort=function(){
    if(isPhoneGap()){
      if(self.ft) self.ft.abort();
    }else{
      $('#'+self.currentUploader).trigger('click');
    }
    self.uploading=false;
  }
  this.destroy=function(){
    if(!isPhoneGap()){
      $.each(self.uploadlist,function(i,v){
        var up=self.uploaders[v];
        up.destroy();
      })
    }
  }
  this.uploadimg=function(imageURI,opts,fileobj,cb){
        // var imageURI=task.imageURI;
        // var opts=task.opts;
        // var fileobj=task.fileobj;
        // var cb=task.cb;
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
        //console.log('UPLOAD: '+imageURI);
        ft.upload(imageURI, app.uploadurl+'/upload/image/submit', function(success){
            //app.core.log(success,1);
            var r=JSON.parse(success.response);
            //_alert(JSON.stringify(r))
            if(r&&r.path){
                cb({
                    path:r.path,
                    ext:r.ext,
                    ar:parseFloat(r.ar),
                    v:(r.v)?parseFloat(r.v):0
                },fileobj)
            }else{//error
              if(app.isdev) alert(success.response)
                cb(false,fileobj);
            }
        }, function(fail){
            //alert('Error uploading image');
            cb(false,fileobj);
        }, options);
        return ft;
    }
  this.processUpload=function(crop){
    if(isPhoneGap()){
      if(opts.onUploadStart) opts.onUploadStart();//to show prog bar 
      var qsdata=$.extend(true,{},opts);
      if(crop) qsdata.data.crop=JSON.stringify(crop);
      self.uploading=true;
      self.ft=self.uploadimg(self.data,qsdata,self.fileobj,function(resp){
        self.uploading=false;
          if(resp){
              if(opts.onSuccess) opts.onSuccess(self.fileobj,resp,self.fileobj);
          }else{
              if(opts.onError) opts.onError('Upload aborted');
              else _alert('error!')
          }
      })
    }else{
      if(!self.uploaders[self.currentUploader]._opts.data) self.uploaders[self.currentUploader]._opts.data={};
      self.uploaders[self.currentUploader]._opts.data=$.extend(true,{},self.uploaders[self.currentUploader]._opts.data,{crop:crop});
      //self.uploaders[self.currentUploader]._opts.submitOnClick=false;//enable upload to ahppen
      self.uploaders[self.currentUploader].processUpload();
    }
  }
  this.pickFile=function(){
    if(isPhoneGap()){
      self.getPhonePicture();
    }else{
      var u=self.uploaders[self.uploadlist[0]];
      $(u._input).on('blur',function(){
        console.log('blur!')
        self.lastBlur=new Date().getTime();
        var diff=self.lastBlur-self.lastFocus;
        if(diff<2000){
          console.log('setpicking '+diff);
          self.picking=true;
        }else{
          console.log(diff)
        }
      }).on('focus',function(){
        console.log('focus')
        self.lastFocus=new Date().getTime();
        if(self.picking){
          console.log('clearpicking');
          setTimeout(function(){
            if(!u._queue.length){//return empty!
              if(opts.onExit) opts.onExit();
            }
          },100)
          self.picking=false;
        }
      })
      $(u._input).click();
      $(u._input).focus()
    }
  }
  this.getPhonePicture=function(e){
    if(opts.onClick) opts.onClick(e);
    if(opts.phoneType=='camera'){
       phone.camera.getPicture({
          type:opts.phoneType,
          body:opts.body,
          theme:opts.theme,
          cb:function(data){
            var id=Math.uuid();//unique for each image uploaded
            var fileobj={id:id};
            if(opts.onUploadStart) opts.onUploadStart();//to show prog bar 
            if(opts.onPreviewReady) opts.onPreviewReady(data,fileobj);
            self.uploadimg(data,$.extend(true,{},opts),fileobj,function(resp){
                if(resp){
                    if(opts.onSuccess) opts.onSuccess(fileobj,resp,fileobj);
                }else{
                    if(opts.onError) opts.onError();
                    else _alert('error!')
                }
            })
        }
      });
      return false;
    }
    //if type=='library'
    window.cordova.plugins.imagegallery.get(
    function(results) {
      if(results=='OK'){//andriod
        return self.getPhonePicture(e);
      }
      for (var i = 0; i < results.length; i++) {
        console.log('Image URI: ' + results[i]);
      }
      var data=results[0];
      var id=Math.uuid();//unique for each image uploaded
      var fileobj={id:id};
      self.data=data;
      self.fileobj=fileobj
      if(opts.onPreviewReady) opts.onPreviewReady(self.data,self.fileobj);
      if(opts.uploadOnClick){

      }else{
        self.currentUploader=id;
        self.processUpload();
      }
    }, function (error) {
      console.log('Error: ' + error);
    }, {
      maximumImagesCount: 1,
      mode:'LibraryAndCamera',
    }
  );
    // self.getPicture({
    //     type:opts.phoneType,
    //     body:opts.body,
    //     theme:opts.theme,
    //     onExit:(opts.onExit)?opts.onExit:function(){},
    //     cb:function(data){
    //       var id=Math.uuid();//unique for each image uploaded
    //       var fileobj={id:id};
    //       self.data=data;
    //       self.fileobj=fileobj
    //       if(opts.onPreviewReady) opts.onPreviewReady(self.data,self.fileobj);
    //       if(opts.uploadOnClick){

    //       }else{
    //         self.currentUploader=id;
    //         self.processUpload();
    //       }
    //   }
    // });
  }
  this.init=function(){
    $.each(opts.ele,function(i,v){
      var ele=$(v);
      var tid=Math.uuid(12);
      if(isPhoneGap()){
          ele.stap(function(e){
              phi.stop(e)
               self.getPhonePicture(e);
        },'tapactive',1);
      }else{
        function setProgress(p,obj,force){
          if(opts.radial){
            var rele=ele.find('.indicator');
            var indicator=rele.data('radialIndicator');
            if(indicator){
                if(p==-1){
                    indicator.stop();
                }else{
                    if(!force) p=p*.95;//give more room for uploading...
                    indicator.animate(p,1);
                }
            }
          }
        }
        var exts= (opts.exts)?opts.exts:['jpg', 'jpeg', 'png']
        var dopts={
            button: ele[0], // file upload button
            url: opts.apiurl+'/upload/image/submit', // server side handler
            name: 'file', // upload parameter name        
            responseType: 'jsonp',
            progressUrl: opts.apiurl+'/upload/image/progress',
            cors:true,
            multiple:(opts.multiple)?1:0,
            allowedExtensions:exts,
            hoverClass:'hover',
            submitOnClick:(opts.uploadOnClick)?1:0,
            maxSize: 1000000, // kilobytes
            onSubmit: function(obj) {
              self.uploading=true;
                obj.mbsize=(obj.size/(1000)).toFixed(1);
                if(opts.onSubmit) opts.onSubmit(obj);
                if(opts.radial){
                ele.css('position','relative');
                ele.render({
                  template:'imageuploader_circle',
                  binding:function(ele){
                      ele.radialIndicator({
                          barColor: '#0e345e',
                          barWidth: 5,
                          initValue: 0,
                          roundCorner : true,
                          radius:20,
                          percentage: false,
                          displayNumber:false,
                          onAnimationComplete:function(cur_p){
                              if(cur_p==100){//set to done!
                                  ele.fadeOut(500,function(){
                                      $(this).remove();
                                  })
                              }
                          }
                      });
                      ele.find('canvas').css({position:'absolute',left:'50%',top:'50%',marginLeft:'-25px',marginTop:'-25px'})
                  }
                })
              }
              if(opts.onUploadStart) opts.onUploadStart();
            },
            onAbort:function(){
                opts.onError('Upload Aborted');
            },
            onQueue:function(obj){
              self.currentUploader=tid;//last queued
              //if(opts.uploadOnClick) self.clear();//ensure queue is cleared
              if(exts.indexOf(obj.ext.toLowerCase())>=0){
                $.fn.bindUploader.localUrl(obj.file,function(timg){
                    if(opts.onPreviewReady) opts.onPreviewReady(timg,obj);
                });
              }
            },
            onSizeError:function(obj){
              self.uploading=false;
                opts.onError('Invalid File Size',obj)
            },
            onExtError:function(obj){
              self.uploading=false;
                opts.onError('Sorry, we can only accept '+exts.join(', ')+ ' files.  Please use one of those and try again.',obj)
            },
            onComplete: function(obj, response) {
              //console.log(obj,response)
              self.uploading=false;
                setProgress(100,obj,1);
                if(opts.onSuccess){
                  var resp=JSON.parse(response);
                  opts.onSuccess(obj,resp,obj);
                }
            }
        };
        var topts=dopts;
        if(opts) topts=$.extend(true,{},dopts,opts);
        topts.onProgress=function(p,obj){
          setProgress(p,obj);
          if(opts.onProgress) opts.onProgress(p,obj);
        }
        var uploader=new ss.SimpleUpload(topts);
        $('body').append('<div id="'+tid+'"></div>')
        uploader.setAbortBtn($('#'+tid)[0]);
        self.uploaders[tid]=uploader;
        self.uploadlist.push(tid);
      }
    });
    if(self.options.directUpload){
        self.pickFile();
      }
  }
  self.init();
}
$.fn.bindUploader=function(opts){
    var ele=this;
    this.each(function(i,v){
      var ele=$(v);
        if(isPhoneGap()){
            ele.stap(function(e){
                phi.stop(e)
                if(opts.onClick) opts.onClick(e);
                 self.getPicture({
                  type:opts.phoneType,
                  body:opts.body,
                  theme:opts.theme,
                  cb:function(data){
                    var id=Math.uuid();//unique for each image uploaded
                    var fileobj={id:id};
                    if(opts.onUploadStart) opts.onUploadStart();//to show prog bar 
                    if(opts.onPreviewReady) opts.onPreviewReady(data,fileobj);
                    self.uploadimg(data,$.extend(true,{},opts),fileobj,function(resp){
                        if(resp){
                            if(opts.onSuccess) opts.onSuccess(fileobj,resp,fileobj);
                        }else{
                            if(opts.onError) opts.onError();
                            else _alert('error!')
                        }
                    })
                }
              });
          },'tapactive',1);
        }else{
          function setProgress(p,obj,force){
            if(opts.radial){
              var rele=ele.find('.indicator');
              var indicator=rele.data('radialIndicator');
              if(indicator){
                  if(p==-1){
                      indicator.stop();
                  }else{
                      if(!force) p=p*.95;//give more room for uploading...
                      indicator.animate(p,1);
                  }
              }
            }
          }
          var exts= (opts.exts)?opts.exts:['jpg', 'jpeg', 'png']
          var dopts={
              button: ele[0], // file upload button
              url: opts.apiurl+'/upload/image/submit', // server side handler
              name: 'file', // upload parameter name        
              responseType: 'jsonp',
              progressUrl: opts.apiurl+'/upload/image/progress',
              cors:true,
              multiple:(opts.multiple)?1:0,
              allowedExtensions:exts,
              hoverClass:'hover',
              uploadOnClick:(opts.uploadOnClick)?1:0,
              maxSize: 1000000, // kilobytes
              onSubmit: function(obj) {
                  obj.mbsize=(obj.size/(1000)).toFixed(1);
                  if(opts.onSubmit) opts.onSubmit(obj);
                  if(opts.radial){
                  ele.css('position','relative');
                  ele.render({
                    template:'imageuploader_circle',
                    binding:function(ele){
                        ele.radialIndicator({
                            barColor: '#0e345e',
                            barWidth: 5,
                            initValue: 0,
                            roundCorner : true,
                            radius:20,
                            percentage: false,
                            displayNumber:false,
                            onAnimationComplete:function(cur_p){
                                if(cur_p==100){//set to done!
                                    ele.fadeOut(500,function(){
                                        $(this).remove();
                                    })
                                }
                            }
                        });
                        ele.find('canvas').css({position:'absolute',left:'50%',top:'50%',marginLeft:'-25px',marginTop:'-25px'})
                    }
                  })
                }
                if(opts.onUploadStart) opts.onUploadStart();
              },
              onQueue:function(obj){
                if(exts.indexOf(obj.ext.toLowerCase())>=0){
                  $.fn.bindUploader.localUrl(obj.file,function(timg){
                      if(opts.onPreviewReady) opts.onPreviewReady(timg,obj);
                  });
                }
              },
              onSizeError:function(obj){
                  opts.onError('Invalid File Size',obj)
              },
              onExtError:function(obj){
                  opts.onError('Invalid File Type',obj)
              },
              onComplete: function(obj, response) {
                //console.log(obj,response)
                  setProgress(100,obj,1);
                  if(opts.onSuccess){
                    var resp=JSON.parse(response);
                    opts.onSuccess(obj,resp,obj);
                  }
              }
          };
          var topts=dopts;
          if(opts) topts=$.extend(true,{},dopts,opts);
          topts.onProgress=function(p,obj){
            setProgress(p,obj);
            if(opts.onProgress) opts.onProgress(p,obj);
          }
          new ss.SimpleUpload(topts);
        }
      })
};
$.fn.bindUploader.localUrl=function(file,cb) {
    if(window.FileReader){
        if(file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                cb(e.target.result);
            }
            reader.readAsDataURL(file);
        }
    }
};