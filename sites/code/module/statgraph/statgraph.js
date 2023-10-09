modules.statgraph=function(options){
	var self=this;
	self.options=options;
	this.init=function(){
		phi.render(options.ele,{
			context:self,
			template:'statgraph',
			data:{
				graphs:options.graphs
			},
			binding:function(ele){
				self.setPage(false,false,false,{graph:options.graphs.order[0]});
			}
		})
	}
	this.loadGraph=function(resp){
		if(resp.error){
			if(self.chart){
	            self.chart.destroy();
	            self.chart=false;
	        }
	        self.ele.find('.grapharea').children().remove();
	        self.ele.find('.grapharea').html('<div style="position:absolute;top:50%;left:50%;margin-top:-30px;padding:5px 10px;border:1px solid #ccc;background:#555;color:white;width:150px;margin-left:-75px;text-align:center" class="m-corner-all">Error Loading: '+resp.error+'</div>')
			return false;
		}
        if(self.chart){
            self.chart.destroy();
            self.chart=false;
        }
        self.ele.find('.grapharea').children().remove();
        if(resp.data&&resp.data.graphs&&resp.data.graphs[0].data){
            var opts=$.extend(true,{},self.getDefaultOpts());
            //self.ele.find('.grapharea').css('height',300);
            opts.chart.renderTo=self.ele.find('.grapharea')[0];
            opts.series=[];
            if(df(resp,'data.opts.chart.type')=='column'){
                $.each(resp.data.graph,function(i,v){
                    opts.series.push(v);
                })
            }else{
                $.each(resp.data.graphs,function(i,v){
                    opts.series.push(self.getSeries(v.data,v.name,1));
                })
            }
            if(resp.data.opts){
                opts=$.extend(true,{},opts,resp.data.opts);
            }
            self.chart=new Highcharts.Chart(opts);
        }else{
            self.ele.find('.grapharea').html('<div style="position:absolute;top:50%;left:50%;margin-top:-30px;padding:5px 10px;border:1px solid #ccc;background:#555;color:white;width:150px;margin-left:-75px;text-align:center" class="m-corner-all">No Data</div>')
        }
    }
    this.getDefaultOpts=function(){
        return {
            chart: {
                animation: false,
                marginTop:30,
                backgroundColor: 'white',
                type: 'column'
            },
            title: {
                text: ''
            },
            subtitle: {
                text: ''
            },
            xAxis: {
                type: 'datetime',
                labels: {
			      format: "{value:%b %e}"
			    },
                dateTimeLabelFormats: { // don't display the dummy year
                    second:'%l:%M:%S %P',
                    hour:'%l %P',
                    minute:'%l:%M %P',
                    day:'%l %P<br/><b>%a %m/%e</b>',
                    month:'<b>%m/%e</b>',
                    year: '%b'
                },
                title: {
                    text: null
                }
            },
            yAxis: {
                title: {
                    text: 'Count'
                },
                min: 0
            },
            plotOptions: {
                spline: {
                    animation: false,
                    tooltip:{
                        dateTimeLabelFormats:{
                            hour:'%l:%M %P %m/%e/%Y',
                            minute:'%l:%M %P %m/%e/%Y',
                            day:'%l:%M %P %m/%e/%Y',
                            week:'%l:%M %P %m/%e/%Y'
                        }
                    },
                    marker: {
                        enabled: true
                    }
                }
            },
            credits:{
                enabled:false
            },
            legend:{
                enabled:true
            }
        };
    }
	this.getSeries=function(data,name,shift){
        var tdata={
            name:name,
            data:[]
        };
        if(shift){
            tshift=0;
            var toffset = ((new Date().getTimezoneOffset())*1000*60-1)*2;//once for Date() and once for highcharts...
        }else var toffset=0;
        $.each(data,function(i,v){
            var ts=self.getTime(v._id,toffset);
            if(v.max!=null){
                tdata.data.push([ts,parseFloat(v.max,10)]);
            }else if(v.count!=null){
                tdata.data.push([ts,parseFloat(v.count,10)]);
            }

        })
        return tdata;
    }
    this.getTime=function(_id,offset){
        var date = new Date(_id.year, 0);
        if(_id.minute){
            date.setDate(_id.day);
            date.setHours(_id.hour);
            return new Date(date.setMinutes(_id.minute)).getTime()-offset;
        }else if(_id.hour){
            date.setDate(_id.day)
            return new Date(date.setHours(_id.hour)).getTime()-offset;
        }else{
        	date.setDate(_id.day);
        	return new Date(date.setHours(12)).getTime()-offset; // add the number of days make noon or timezone shift may put to different day
    	}
    }
	this.setPage=function(e,container,target,data){
		self.ele.find('.x_toggles').removeClass('button1');
		self.ele.find('.x_toggles[data-graph='+data.graph+']').addClass('button1');
		self.page=data.graph;
		self.current=options.graphs.list[data.graph];
		self.load();
	}
	this.load=function(){
		modules.api({
            url:app.sapiurl+'/stats/dashboard',
            data:{
                link_id:self.current.link_id,
                action:self.current.action
            },
            timeout:5000,
            callback:function(resp){
               	self.loadGraph(resp);
            }
        });
	}
	this.init()
}