modules.formbuilder_global={
	version:1,
	getError:function(data){
		var html='<div class="error_box">';
        if(data.error){
            if(typeof data.error=='object'){
                $.each(data.error,function(i,v){
                    //set title
                    html+='<div class="error_header">'+i+'</div>';
                    $.each(v,function(ei,ev){
                        html+='<div class="error_row">'+ev.name+'</div>';
                    })
                })
            }else{
               html+='<div class="error_row error_center">'+data.error+'</div>'; 
            }
        }
        html+='</div>';
        return html;
	},
	getValidationError:function(data){
		var html='<div class="error_box">';
        if(data.length){
            $.each(data,function(i,v){
                //set title
                //html+='<div class="error_header">'+i+'</div>';
                html+='<div class="error_row">'+v+'</div>';
            })
        }
        html+='</div>';
        return html;
	},
	save:function(options){
		modules.api({
            url:(options.endpoint)?options.endpoint:app.sapiurl+'/module/formbuilder/save',
            data:{
                current:options.data,
                schema:options.schema
            },
            timeout:5000,
            callback:options.callback
        });
	}
}