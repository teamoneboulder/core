modules.admin_stats=function(options){
	var self=this;
	this.show=function(){
		options.ele.render({
			uid:'admin_stats',
			force:1,
			template:'admin_stats',
			binding:function(ele){
				self.ele=ele;
                self.refresh()
                self.interval();
                ele.find('#refreshstats').stap(function(){
                    self.refresh()
                });
                self.scroller=new modules.scroller(ele.find('.scroller'))
			}
		})
	}
	this.hide=function(){
        if(self.ci) clearInterval(self.ci);
		if(self.inf) self.inf.stop();
		self.ele.hide();
	}
	this.destroy=function(){
        if(self.ci) clearInterval(self.ci);
		self.ele.remove();
    }
    this.get=function(cb){
        if(self.getting) return false;
        self.getting=1;
        modules.api({
            caller:'Get stats',
            url: app.sapiurl+'/stats/get', 
            data:{
                token:window.uuid
            },
            error:function(){
                self.getting=0;
                cb({error:'error'});
            },
            callback: function(data){
                self.getting=0;
                cb(data)
            }
        })
        //self.getGraph();
    }
    this.load=function(data){
        //re-render stats!
        self.ele.find('#statspage').render({
            template:'admin_stats_data',
            append:false,
            data:data,
            binding:function(ele){
            }
        })
    }
    this.refresh=function(){
        self.ele.find('#refreshstats').addClass('animate-spin')               
        self.get(function(data){
            self.ele.find('#refreshstats').removeClass('animate-spin')
            self.load(data)
        });
    }
    this.interval=function(){
        self.ci=setInterval(function(){
            self.refresh()
        },60000);//every minute
    }
}