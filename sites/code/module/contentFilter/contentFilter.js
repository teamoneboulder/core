modules.contentFilter=function(options){
	var self=this;
	self.options=options;
	options.ele.stap(function(){
        var types=[{
                id:'all',
                name:'All Items',
                icon:'icon-planetchange'
            },{
                id:'video',
                name:'Videos',
                icon:'icon-play'
            },{
                id:'audio',
                name:'Audio',
                icon:'icon-volume-up'
            },{
                id:'link',
                name:'Link',
                icon:'icon-link'
            },{
                id:'post',
                name:'Post',
                icon:'icon-blog'
            }]
		self.alert=new modules.mobilealert({
            display:{
                ele:$(this),
                container:options.container,
                locations:['topright']
            },
            menu:types,
            onSelect:function(id){
               if(options.onChange) options.onChange(id);
               var item=app.getByKey(types,id,'id');
               options.ele.find('.sorttype').html(item.name)
            }
        });
        self.alert.show();
	},1,'tapactive');
}