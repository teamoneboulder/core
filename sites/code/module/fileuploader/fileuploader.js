if(!window.modules) window.modules={};
modules.fileuploader=function(opts){
    var id=Math.uuid(8);
    var self=this;
    var ele=opts.ele;
    self.opts=opts;
    if(!ele.length) return false;
    if(!opts.onError) opts.onError=function(msg,obj,b,c){
        if(!opts.nospin) ele.spin(false);
        modules.toast({
            id:id,
            content:'Error: '+msg,
            icon:'icon-warning-sign',
            remove:10000,
            type:'warning'
        });
    }
    var extensions=(opts.allowedExtensions)?opts.allowedExtensions:['pdf'];
    self.uploading=false;
    var dopts={
        button: ele[0], // file upload button
        //debug:1,
        url: app.uploadurl+'/upload/'+((opts.module)?opts.module:'file')+'/submit', // server side handler
        name: 'file', // upload parameter name        
        responseType: 'jsonp',
        progressUrl: app.uploadurl+'/upload/'+((opts.module)?opts.module:'file')+'/progress',
        cors:true,
        multiple:(opts.multiple)?1:0,
        previewOnly:(opts.previewOnly)?1:0,
        allowedExtensions: extensions,
        hoverClass:'hover',
        maxSize: (1000000), // kilobytes
        onSubmit: function(obj) {
            self.uploading=true;
            obj.mbsize=(obj.size/(1000)).toFixed(1);
            if(opts.onSubmit){
                opts.onSubmit(obj);
            }else{
                if(!opts.nospin) ele.spin({size:16});
                var tele=modules.toast({
                    id:id,
                    template:'fileupload',
                    temdata:{},
                    icon:'icon-refresh animate-spin',
                    remove:false
                });
                ele.data('ele',tele);
                //this.setFileSizeBox(tele.find('.uploadsize')[0]); // designate this element as file size container
                this.setProgressBar(tele.find('.progbar')[0]); // designate as progress bar
                tele.find('.uploadsize').html(obj.mbsize+' MB');
            }
        }, 
        onQueue:function(obj){
            self.loaded=true;
            obj.ext=obj.ext.toLowerCase();
            if(!opts.noPreview){
                if(extensions.indexOf(obj.ext)>=0){
                   if(opts.onLoadingPreview) opts.onLoadingPreview();
                  self.localUrl(obj.file,function(timg){
                      if(opts.onPreviewReady) opts.onPreviewReady(timg,obj);
                  });
                }else{
                    //opts.onError('Invalid File Type, currently only the following types are supported: '+extensions.join(', '),obj)
                }
            }
        }, 
        onSizeError:function(obj){
            self.uploading=false;
            opts.onError('Invalid File Size',obj)
        },
        onExtError:function(obj){
            self.uploading=false;
            opts.onError('Sorry only '+extensions.join(', ')+ ' files can be uploaded.',obj)
        },
        onAbort:function(){
            self.uploading=false;
            if(opts.onAbort) opts.onAbort();
        },
        onComplete: function(obj, response) {
            self.uploading=false;
            if(opts.onDone){
                if(typeof response=='string') var resp=JSON.parse(response);//assume it came back as text/json
                else var resp=response;
                opts.onDone(obj,resp);
            }else{
                if(!opts.nospin) ele.spin(false);
                modules.toast({
                    id:id,
                    content:'Complete!',
                    icon:'icon-thumbs-up',
                    remove:1500
                });
            }
        }
    };
    var topts=dopts;
    if(opts.onComplete){
        opts.onDone=opts.onComplete;
        delete opts.onComplete;
    }
    if(opts) topts=$.extend(true,{},dopts,opts);
    self.uploader= new ss.SimpleUpload(topts);
    //self.uniqueid=Math.uuid();//unique for each filec uploaded
    // $('body').append('<div id="'+self.uniqueid+'"></div>')
    // self.uploader.setAbortBtn($('#'+self.uniqueid)[0]);
    this.abortMap={};
    this.isUploading=function(){
        return self.uploading;
    }
    this.hasVideo=function(){
        return self.loaded;
    }
    this.abort=function(id){
        $('#'+id+'_abort').trigger('click');
    }
    this.destroy=function(){
        self.uploader.destroy();
    }
    this.processUpload=function(data){
        if(isPhoneGap()){
          if(opts.onUploadStart) opts.onUploadStart();//to show prog bar 
          var qsdata=$.extend(true,{},opts);
          self.uploading=true;
          self.ft=app.core.camera.uploadimg(self.data,qsdata,self.fileobj,function(resp){
            self.uploading=false;
              if(resp){
                  if(opts.onSuccess) opts.onSuccess(self.fileobj,resp,self.fileobj);
              }else{
                  if(opts.onError) opts.onError('Upload aborted');
                  else _alert('error!')
              }
          })
        }else{
          if(!self.uploader._opts.data) self.uploader._opts.data={};
          self.uploader._opts.data=$.extend(true,{},self.uploader._opts.data,data);
          self.uploader._opts.token=app.user.token;
          self.uploader._opts.appid=app.appid;
          //self.uploader._opts.submitOnClick=false;//enable upload to ahppen
          self.uploader.processUpload();
        }
      }
    this.submitBlob=function(blob,form_data,cb){
        var fd = new FormData();
        fd.append('base64', blob);
        fd.append('appid',app.appid);
        fd.append('token',app.user.token)
        if(form_data) $.each(form_data,function(i,v){
            fd.append(i,v);
        })
        fd.append('path','/audio/')
        fd.append('site','nectar');
        var obj={
            id:Math.uuid(12)
        }
        //self.renderPreviewImage(self.keyboardele,obj.id,blob);
        var progress=0;
        self.upint=setInterval(function(){
            progress++;
            if(progress<100){
                //self.setUploadProgress(self.keyboardele,obj.id,progress);
            }
        },50);
        if(opts.onUploadStart) opts.onUploadStart();//to show prog bar 
        $.ajax({
            type: 'POST',
            url: app.uploadurl+'/upload/'+((opts.module)?opts.module:'file')+'/submit',
            data: fd,
            processData: false,
            contentType: false,
            success:function(resp){
                if(self.upint) clearInterval(self.upint);
                if(resp.success){
                    var file={
                      path:resp.path,
                      meta:resp.meta
                  };
                    if(cb) cb(file)
                }else{
                    if(cb) cb(false)
                    modules.toast({
                        content:'Error Uploading File: '+resp.error
                    }) 
                }
            },
            error:function(resp){
                if(self.upint) clearInterval(self.upint);
                //self.setUploadProgress(self.keyboardele,obj.id,-1);
                modules.toast({
                    content:'Error Uploading File'
                })
                if(cb) cb(false);
            }
        })
    }
    this.localUrl=function(file,cb){
        var reader = new window.FileReader(),
        reader = window.URL || window.webKitURL;
         if (reader && reader.createObjectURL) {
            url = reader.createObjectURL(file);
            return cb(url);
            // reader.revokeObjectURL(url);  //free up memory
            // return;
        }else{
            reader.onload = function (e) {
                cb(e.target.result);
            }
            reader.readAsDataURL(file);
        }
    }
}