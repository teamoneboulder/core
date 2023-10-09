if(!window.modules) window.modules={};
modules.drive_preview={
	previewbase:'https://drive.google.com/thumbnail?authuser=0&sz=w320&id=',
	icons:{
		"application/vnd.google-apps.spreadsheet":{
			"pic":'https://s3.amazonaws.com/wearenectar/static/sheet.png',
			"name":"Google Sheet"
		},
		"image/png":{
			pic:'https://s3.amazonaws.com/wearenectar/static/picture.png',
			name:'Image/PNG'
		},
		"image/jpeg":{
			pic:'https://s3.amazonaws.com/wearenectar/static/picture.png',
			name:'Image/JPEG'
		},
        "application/vnd.google-apps.form":{
            pic:"https://s3.amazonaws.com/wearenectar/static/forms.png",
            name:'Google Form'
        },
		"application/vnd.google-apps.document":{
			pic:"https://s3.amazonaws.com/wearenectar/static/docs.png",
			name:'Google Doc'
		},
		// "application/vnd.google-apps.folder":{
		// 	pic:'https://s3.amazonaws.com/wearenectar/static/folder.png',
		// 	name:'Google Drive Folder'
		// },
		//"application/json":"",
		//"application/vnd.jgraph.mxfile.realtime":"",
		//"image/x-photoshop":"",
		//"video/mp4":""
		"default":{
			pic:'https://s3.amazonaws.com/wearenectar/static/folder.png',
			name:'Google Drive Resource'
		}
	},
	render:function(file){
		var self=this;
		return $.fn.render({template:'module_drive_preview',data:{file:file,icons:self.icons,base:self.previewbase},returntemplate:true});
	}
}
modules.drive=function(options){
	var self=this;
	self.options=options;
	this.show=function(){
        async.parallel([self.showLoader,self.loadData],function(){
            self.onViewReady();
        })
	}
    this.showLoader=function(cb){
        $('#homecontainer').subpage({
            loadtemplate:'module_drive_loading',
            data:{},
            onPageReady:function(ele,onback){
            	self.pele=ele;
                ele.find('.backbtn').stap(function(){
                    //self.onPageWillHide();
                    if(self.cfile){
                    	if(options.onSelect) options.onSelect(self.cfile);
                    	setTimeout(function(){//give a few seconds for the newly rendered thing to be ready to view
                    		onback();
                    	},20);
                    }else onback();
                },1,'tapactive');
                cb();
            },
            onPageReturn:function(){
             	self.destroy()   
            }
        });
    }
    this.destroy=function(){
    	delete self;
    }
    this.loadData=function(cb){
        app.api({
            url:app.sapiurl+'/module/drive/load',
            data:{
            },
            timeout:5000,
            callback:function(resp){
                self.data=resp;
                cb();
            }
        });
    }
    // this.checkPermissions=function(file,cb){
    // 	$('body').spin({
    // 		bg:true
    // 	})
    // 	 app.api({
    //         url:app.sapiurl+'/module/drive/checkpermissions',
    //         data:{
    //         	id:file.id
    //         },
    //         timeout:5000,
    //         callback:function(resp){
    //         	$('body').spin(false)
    //         	if(resp.success){
    //         		if(resp.public_view){
    //         			cb();//good to go!
    //         		}else{
    //         			self.ensurePerms(file,function(){

    //         			});
    //         		}
    //         	}else{
    //         		_alert('error loading, please try again.')
    //         	}
    //         }
    //     });	
    // }
    this.ensurePerms=function(file,cb){
    	$('body').alert({
    		template:'module_drive_checkperms',
    		tempdata:{
    			file:file
    		},
    		buttons:false,
    		binding:function(ele){
    			ele.find('.permbtn').stap(function(){
    				var role=$(this).attr('data-role');
    				ele.find('.x_loading').show();
    				self.setPerms(file,role,function(success,err){
    					if(success){
    						$.fn.alert.closeAlert();
    						cb();
    					}else{
    						_alert(JSON.stringify(err));
    					}
    				});
    			},1,'tapactive')
    		}
    	})
    }
    this.setPerms=function(file,role,cb){
    	app.api({
            url:app.sapiurl+'/module/drive/setpermissions',
            data:{
            	id:file.id,
            	role:role
            },
            timeout:5000,
            callback:function(resp){
            	if(resp.success){
            		cb(true);
            	}else{
            		cb(false,resp.error);
            	}
            }
        });	
    }
    this.onViewReady=function(){
    	self.pele.find('.content').render({
    		append:false,
    		template:'module_drive_files',
    		data:self.data,
    		binding:function(ele){
    			ele.find('.file').stap(function(){
    				var id=$(this).attr('data-id');
    				//get resource!
    				var file=app.getByKey(self.data.files,id,'id');
    				//ensure permsissions!
    				self.ensurePerms(file,function(){
    					self.cfile=file;
	    				self.pele.find('.backbtn').stap();
    				})
    			},1,'tapactive')
    		}
    	})
    }
}