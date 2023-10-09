$.fn.uploader=function(opts){
	if(!opts.onError) opts.onError=function(msg,obj){
        if(!opts.nospin) ele.spin(false);
        growl({
            id:id,
            content:'Error: '+msg,
            icon:'icon-warning-sign',
            remove:2500
        });
    }
    var dopts={
        button: ele[0], // file upload button
        url: app.apiurl+'/upload/file', // server side handler
        name: 'file', // upload parameter name        
        responseType: 'jsonp',
        progressUrl: app.apiurl+'/upload/progress',
        cors:true,
        multiple:0,
        allowedExtensions: (opts.exts)?opts.exts:['jpg', 'jpeg', 'png','gif'],
        hoverClass:'hover',
        maxSize: 1000000, // kilobytes
        onSubmit: function(obj) {
            //remove upload button/destroy
            obj.mbsize=(obj.size/(1000)).toFixed(1);
            if(opts.onSubmit){
                opts.onSubmit(obj);
            }else{
                if(!opts.nospin) ele.spin({size:16});
                var tele=growl({
                    id:id,
                    template:'fileupload',
                    temdata:{},
                    color:'white',
                    icon:'icon-refresh animate-spin',
                    remove:false
                });
                ele.data('ele',tele);
                //this.setFileSizeBox(tele.find('.uploadsize')[0]); // designate this element as file size container
                this.setProgressBar(tele.find('.progbar')[0]); // designate as progress bar
                tele.find('.uploadsize').html(obj.mbsize+ 'MB')
            }
        },  
        onSizeError:function(obj){
            opts.onError('Invalid File Size',obj)
        },
        onExtError:function(obj){
            opts.onError('Invalid File Type',obj)
        },
        onComplete: function(obj, response) {
            if(opts.onComplete){
                opts.onComplete(obj,response);
            }else{
                if(!opts.nospin) ele.spin(false);
                growl({
                    id:id,
                    color:'white',
                    content:'Complete!',
                    icon:'icon-thumbs-up',
                    remove:1500
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