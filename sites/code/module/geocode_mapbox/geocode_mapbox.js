if(!window.modules) window.modules={};
;modules.geocode={
    key:'pk.eyJ1IjoibmVjdGFyIiwiYSI6ImNqczZtdmJzcjBzMHc0M283c2NqcnNjcDQifQ.h9R1Y6AQnWhUhUp03Kpq1w',
    init:function(){
        var self=this;
        self.location.start();
    },
    type:'mapbox.places',
    getTypes:function(opts){
        var ret=[];
        if(opts.types){
            var map={
                '(cities)':'place',
                '(pois)':'poi'
            }
            $.each(opts.types,function(i,v){
                if(map[v]) ret.push(map[v]);
                else ret.push(v);
            })
        }
        return ret;
    },
    getText:function(data){
        var obj={};
        if(data.text) obj.text=data.text;
        if(data.place_name) obj.place_name=data.place_name;
        if(data.context){
            $.each(data.context,function(i,v){
                var dp=v.id.split('.');
                obj[dp[0]]=v.text;
            })
        }
        return obj;
    },
    parseData:function(resp){
        var self=this;
        self.cdata=[];
        if(resp.features&&resp.features.length){
            $.each(resp.features,function(i,v){
                self.cdata.push(v);
            })
        }
        return self.cdata;
    },
    getLoc:function(data,cb){
        var loc={
            lng:parseFloat(data.geometry.coordinates[0]),
            lat:parseFloat(data.geometry.coordinates[1])
        }
        if(cb) return cb(loc)
        return loc;
    },
    search:function(val,opts,cb){
        var self=this;
        var endpoint='https://api.mapbox.com/geocoding/v5/'+self.type+'/'+encodeURIComponent(val)+'.json?';
        endpoint+='autocomplete=true';
        var types=self.getTypes(opts);
        if(types.length){
            endpoint+='&types='+types.join(',');
        }
        endpoint+='&access_token='+self.key;
        var loc=phone.location.getNearestLocation();//syncronous
        if(loc){
            endpoint+='&proximity='+loc.lng+','+loc.lat;
        }
        self.current=val;
        modules.api({
            url:endpoint,
            type:'GET',
            cleanData:true,
            dataType:'json',
            callback:function(data){
                if(self.current==val){//always wait for most recent
                    if(data&&data.features&&data.features.length){//match data
                        cb(self.parseData(data));
                    }else{
                        if(cb) cb(false);   
                    }
                }
            }
        })
    }
}