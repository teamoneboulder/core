if(!window.modules) window.modules={};
modules.saveimage={
	save:function(url,name){
		if(isPhoneGap()){
			function error(msg){
				modules.toast({
					content:'Save Image Error: '+msg,
					icon:'icon-warning-sign'
				})
			}
			function success(){
				modules.toast({
					content:'Successfully saved image!',
					icon:'icon-thumbs-up'
				})
			}
			var canvas, context, imageDataUrl, imageData;
		    var img = new Image();
		   	img.crossOrigin = "";
		    img.onload = function() {
		        canvas = document.createElement('canvas');
		        canvas.width = img.width;
		        canvas.height = img.height;
		        context = canvas.getContext('2d');
		        context.drawImage(img, 0, 0);
		        try {
		            imageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
		            //imageData = imageDataUrl.replace(/data:image\/jpeg;base64,/, '');
		            var params = {data: imageDataUrl, prefix: 'oneboulder_', format: 'JPG', quality: 100, mediaScanner: true};
				    window.imageSaver.saveBase64Image(params,
				        function (filePath) {
				          success();
				        },
				        function (msg) {
				          error(msg);
				        }
				      );
		        }
		        catch(e) {
		            error(e.message);
		        }
		    };
		    try {
		        img.src = url;
		    }
		    catch(e) {
		        error(e.message);
		    }
			//window.imageSaver.saveBase64Image()
		}else{
			if(!name) name='';
			var url=app.sapiurl+'/download?name='+name+'&src='+encodeURIComponent(url);
            window.open(url,'_self');
		}
	}
}