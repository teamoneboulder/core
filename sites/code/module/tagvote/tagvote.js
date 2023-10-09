if(!window.modules) window.modules={};
;modules.tagvote={
	render:function(options){
		var self=this;
		if(!options.data.stats) options.data.stats={};
		if(!options.data.tag_info) options.data.tag_info={};
		if(!options.data.selected) options.data.selected=[];
		if(options.ele){
			options.ele.render({
				template:'tagvote_list',
				data:options,
				append:false,
				binding:function(ele){
					if(options.binding){
						options.binding(ele,options)
					}else{
						self.bind(ele,options);
					}
				}
			})
		}else{
			return $.fn.render({
				template:'tagvote_list',
				returntemplate:1,
				data:options
			})
		}	
	},
	bind:function(ele,options){
		var self=this;
		ele.find('.tagitem').stap(function(e){
			phi.stop(e);
			var tag=$(this).attr('data-id');
			if(tag=='add'){
				_alert('add')
			}else{
				var set=($(this).hasClass('upvoted'))?0:1;
				var eid=$(this).attr('data-eid');
				if(eid) options.id=eid;
				self.vote(tag,set,options);
				$(this).addClass('upvoted')
			}
		},1,'tapactive');
	},
	vote:function(tag,val,options){
		var self=this;
		app.api({
            url:options.endpoint,
            data:{
            	id:options.id,
            	tag_id:tag,
            	val:val
            },
            timeout:5000,
            callback:function(resp){
            	if(resp.success){
            		options.data.stats=resp.data;
            		options.data.selected=resp.user_votes;
            		self.render(options);
            	}else{
            		onerror('vote didnt save!');
            	}
            }
        });
	}
}