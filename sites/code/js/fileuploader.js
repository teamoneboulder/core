$.fn.fileUploader=function(opts){
    var ele=$(this);
    var id=Math.uuid(8);
    var tmodule=opts.module;
    if(!tmodule) tmodule='file';
	if(!opts.onError) opts.onError=function(msg,obj){
        if(!opts.nospin) ele.spin(false);
        modules.toast({
            id:id,
            content:'Error: '+msg,
            icon:'icon-warning-sign',
            remove:2500
        });
    }
    var exts=(opts.exts)?opts.exts:['pdf'];
    var dopts={
        button: ele[0], // file upload button
        url: app.uploadurl+'/upload/'+tmodule+'/submit', // server side handler
        name: 'file', // upload parameter name        
        responseType: 'jsonp',
        progressUrl: app.uploadurl+'/upload/'+tmodule+'/progress',
        cors:true,
        previewOnly:(opts.previewOnly)?1:0,
        multiple:0,
        allowedExtensions: exts,
        hoverClass:'hover',
        maxSize: 1000000, // kilobytes (1GB)
        onSubmit: function(obj) {
            //remove upload button/destroy
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
                tele.find('.uploadsize').html(obj.mbsize+ 'MB')
            }
        },  
        onSizeError:function(obj,err){
            opts.onError('Invalid File Size',obj)
        },
        onExtError:function(obj){
            opts.onError('Sorry, only '+exts.join(', ')+ ' can be uploaded.',obj)
        },
        onComplete: function(obj, response) {
            console.log(response)
            if(opts.onComplete){
                opts.onComplete(obj,response);
            }else{
                if(!opts.nospin) ele.spin(false);
                modules.toast({
                    id:id,
                    content:'Complete!',
                    icon:'icon-thumbs-up',
                    remove:2000
                });
                if (!response) {
                    alert(filename + 'upload failed');
                    return false;            
                }else{
                    if(cb) cb(JSON.parse(response),obj)
                }
            }
        }
    };
    var topts=dopts;
    if(opts) topts=$.extend(true,{},dopts,opts);
    var ul= new ss.SimpleUpload(topts);
    return ul;
}