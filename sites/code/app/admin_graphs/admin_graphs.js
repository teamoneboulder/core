modules.admin_graphs=function(options){
	var self=this;
    if(options.store) self.store=options.store;
    else self.store={
        view:'active',
        type:'month'
    };
    self.options=options;
	this.show=function(){
		options.ele.render({
			uid:'admin_graphs',
			force:1,
			template:'admin_graphs',
			binding:function(ele){
				self.ele=ele;
                ele.find('.x_view').stap(function(){
                    self.setView($(this).attr('data-view'));
                },1,'tapactive')
                ele.find('.x_type').stap(function(){
                    self.setType($(this).attr('data-type'));
                },1,'tapactive')
                self.setType(self.store.type,1);
                self.setView(self.store.view,1);
                self.scroller=new modules.scroller(ele.find('.scroller'))
                ele.find('#graphselector').daterangepicker({
                    "opens": "left",
                    ranges: {
                       'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                       'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                       'This Month': [moment().startOf('month'), moment().endOf('month')],
                       'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
                       'Last 3 Months': [moment().subtract(3, 'month'),moment()],
                       'Last Year': [moment().subtract(12, 'month'),moment()]
                    },
                    "startDate": moment().subtract(30,'day').format('MM/DD/YYYY'),
                    "endDate": moment().format('MM/DD/YYYY')//today
                }, function(start, end, label) {
                    // pself.loadData(function(){
                    //     pself.refresh()
                    // })
                    self.getGraph();
                });
                self.getGraph();
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
    this.getDefaultOpts=function(){
        return {
            chart: {
                animation: false,
                marginTop:30,
                backgroundColor: 'white',
                type: 'spline'
            },
            title: {
                text: ''
            },
            subtitle: {
                text: ''
            },
            xAxis: {
                type: 'datetime',
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
                    text: 'Active Users'
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
                        enabled: false
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
    this.parseDonut=function(resp){
        var categories=[];
        var data=[];
        var colors = Highcharts.getOptions().colors
        var c=0;
        var total=0;
        $.each(resp.data,function(i,v){
            total+=v.total;
        });//could do it this way
        //var min=(resp.total/60).toFixed(0);
        var min=resp.total/60;
        if(min<(60*6)){
            var title='User activity ('+(resp.total/60).toFixed(0)+' minutes)';
        }else{
            var title='User activity ('+(min/60).toFixed(0)+' hours)';
        }
        $.each(resp.data,function(i,v){
            categories.push(i);
            if(v.subpage){
                var drilldown={
                    name:i,
                    categories:[],
                    data:[]
                }
                $.each(v.subpage,function(ti,tv){
                    drilldown.categories.push(ti);
                    drilldown.data.push(parseFloat(((tv/total*100)).toFixed(0)));//percentage
                })
            }else{
                var drilldown={
                    name:i,
                    categories:[],
                    data:[]
                }
                drilldown.categories.push(i);
                drilldown.data.push(parseFloat(((v.total/total)*100).toFixed(0)));
            }
            data.push({
                y:parseFloat(((v.total/total)*100).toFixed(0)),
                drilldown:drilldown,
                color:colors[c]
            })
            c++;
        })
        var maindata=[];
        var subdata=[];
        // Build the data arrays
        for (i = 0; i < data.length; i += 1) {
          // add browser data
            maindata.push({
                name: categories[i],
                y: data[i].y,
                mainpage:data[i].drilldown.name,
                color:data[i].color
            });
            drillDataLen = data[i].drilldown.data.length;
            for (j = 0; j < drillDataLen; j += 1) {
                brightness = 0.2 - (j / drillDataLen) / 5;
                subdata.push({
                  name: data[i].drilldown.categories[j],
                  y: data[i].drilldown.data[j],
                  mainpage:data[i].drilldown.name,
                  color: Highcharts.Color(data[i].color).brighten(brightness).get()
                });
            }
        }
        var opts={
          chart: {
            type: 'pie'
          },
          title: {
            text: title
          },
          plotOptions: {
            pie: {
              shadow: false,
              center: ['50%', '50%']
            }
          },
          tooltip: {
            formatter: function() {
                return this.point.mainpage+'<br/><b>' + this.point.name + ':</b> ' + this.y + '%';
            }
        },
          credits:{
            enabled:false
        },
          series: [{
            name: 'Main View',
            data: maindata,
            size: '60%',
            dataLabels: {
              formatter: function () {
                return false;
                return this.point.name
              },
              color: '#ffffff',
              distance: -30
            }
          }, {
            name: 'Sub Page',
            data: subdata,
            size: '80%',
            innerSize: '60%',
            dataLabels: {
              formatter: function () {
                // display only if larger than 1
                return '<b>' + this.point.name + ':</b> ' + this.y + '%';
              }
            },
            id: 'subpage'
          }]
        }
        return opts;
    }
    this.parseBox=function(resp){
        var categories=[];
        var data=[];
        $.each(resp.data,function(i,v){
            categories.push(i);
            data.push(v);
        })
        var opts={
            chart: {
                type: 'boxplot',
                zoomType:'x'
            },
            title: {
                text: ''
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                boxplot: {
                    fillColor: '#F0F0E0',
                    lineWidth: 2,
                    medianColor: '#0C5DA5',
                    medianWidth: 3,
                    stemColor: '#A63400',
                    stemDashStyle: 'dot',
                    stemWidth: 1,
                    whiskerColor: '#3D9200',
                    whiskerLength: '20%',
                    whiskerWidth: 3
                }
            },
            xAxis: {
                categories:categories,
                title: {
                    text: 'Path'
                }
            },
            series: [{
                name: 'Stats',
                 data: data
                //data: resp.data
            }]
        }
        console.log(opts)
        return opts;
    }
    this.loadGraph=function(resp){
        if(self.userchartday){
            self.userchartday.destroy();
            self.userchartday=false;
        }
        self.ele.find('.usergraph').children().remove();
        if(self.store.view=='page_activity'){
            //parse!!!
            var opts=self.parseDonut(resp);
            //self.ele.find('.usergraph').css('height',500);
            opts.chart.renderTo=self.ele.find('.usergraph')[0];
            self.userchartday=new Highcharts.Chart(opts);
            //self.userchartday=new Highcharts.Chart(chart);
        }else if(self.store.view=='api'){
            // var opts=self.parseBox(resp);
            // self.ele.find('.usergraph').css('height',500);
            // opts.chart.renderTo=self.ele.find('.usergraph')[0];
            // self.userchartday=new Highcharts.Chart(opts);
            self.ele.find('.usergraph').render({
                template:'api_data',
                data:{
                    data:resp.data
                },
                binding:function(){}
            })
        }else if(resp.data&&resp.data.graphs){
            var opts=$.extend(true,{},self.getDefaultOpts());
            //self.ele.find('.usergraph').css('height',300);
            opts.chart.renderTo=self.ele.find('.usergraph')[0];
            opts.series=[];
            if(df(resp,'data.opts.chart.type')=='column'){
                $.each(resp.data.graphs,function(i,v){
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
            self.userchartday=new Highcharts.Chart(opts);
        }else if(resp.data.chartType=='list'){
            self.ele.find('.usergraph').render({
                template:resp.data.template,
                data:resp.data
            })
        }else{
            self.ele.find('.usergraph').html('<div style="position:absolute;top:50%;left:50%;margin-top:-30px;padding:5px 10px;border:1px solid #ccc;background:#555;color:white;width:150px;margin-left:-75px;text-align:center" class="m-corner-all">No Data</div>')
        }
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
        if(typeof _id=='number') return _id-offset;
        var date = new Date(_id.year, 0);
        if(_id.minute){
            date.setDate(_id.day);
            date.setHours(_id.hour);
            return new Date(date.setMinutes(_id.minute)).getTime()-offset;
        }else if(_id.hour){
            date.setDate(_id.day)
            return new Date(date.setHours(_id.hour)).getTime()-offset;
        }else return new Date(date.setDate(_id.day)).getTime()-offset; // add the number of days
    }
    this.setView=function(view,load){
        if(view==self.store.view&&!load) return false;
        self.ele.find('.x_view').removeClass('selected');
        self.ele.find('[data-view='+view+']').addClass('selected');
        self.store.view=view;
        if(!load) self.getGraph();
    }
    this.setType=function(type,load){
        if(self.store.type==type&&!load) return false;
        self.store.type=type;
        self.ele.find('.x_type').removeClass('active');
        self.ele.find('[data-type='+type+']').addClass('active');
        if(!load) self.getGraph();
    }
    this.getGraph=function(cb){
        //clear graph and show loader...
        self.ele.find('.usergraph').children().remove();
        self.ele.find('.usergraph').html('<div class="sfit" style="background:#aaa;"></div>')
        var drp = self.ele.find('#graphselector').data('daterangepicker');
        var range={
            start:drp.startDate.unix(),
            end:drp.endDate.unix()
        }
        modules.api({
            caller:'Get stats',
            url: app.sapiurl+'/stats/timeline', 
            data:{
                range:range,
                token:window.uuid,
                type:self.store.type,
                view:self.store.view
            },
            timeout:20000,
            callback: function(data){
                if(!data.error){
                    self.getting=0;
                    self.loadGraph(data);
                }else{
                    alert('error loading: '+data.error)
                }
            }
        })
    }
    this.refresh=function(){
        self.ele.find('#refreshgraph').addClass('animate-spin')               
        self.get(function(data){
            self.ele.find('#refreshgraph').removeClass('animate-spin')
            self.load(data)
        });
    }
    this.interval=function(){
        self.ci=setInterval(function(){
            self.refresh()
        },60000);//every minute
    }
}