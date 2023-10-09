if(!window.modules) window.modules={};
;modules.geocode={
    key:'6d0233642fdd1e',
    init:function(){
        var self=this;
        // if(!self.initd){
        //     var script='https://maps.googleapis.com/maps/api/js?key='+self.key+'&libraries=places';
        //     var jq = document.createElement('script');
        //     jq.src = script;
        //     jq.id="googleapi";
        //     document.getElementsByTagName('head')[0].appendChild(jq);
        //     self.inid=true;
        // }
    },
    getTypes:function(opts){
        var ret=[];
        if(opts.types){
            var map={
                '(cities)':'city'
            }
            $.each(opts.types,function(i,v){
                if(map[v]) ret.push(map[v]);
            })
        }
        return ret;
    },
    getBox:function(lnglat){
        //max_lon,max_lat,min_lon,min_lat
        var expand=.5;
        var data=[lnglat[0]+expand,lnglat[1]+expand,lnglat[0]-expand,lnglat[1]-expand];
        return data.join(',');
    },
    search:function(val,opts,cb){
        var self=this;
        var endpoint='https://us1.locationiq.com/v1/search.php?key='+self.key+'&format=json';
        var types=self.getTypes(opts);
        if(types.length){
            if(types.indexOf('city')>=0){
                endpoint+='&city='+val;
            }
        }else{
            endpoint+='&q='+val;
        }
        endpoint+='&extratags=1';
        if(true){
            var lnglat=[-105.2999986,40.0374149];
            endpoint+='&viewbox='+self.getBox(lnglat);//used for weighting search based on users location
        }
        console.log(endpoint)
        app.api({
            url:endpoint,
            type:'GET',
            dataType:'json',
            callback:function(data){
                console.log(data);
            }
        })
        // var service = new google.maps.places.AutocompleteService();
        // if(!opts) opts={};
        // service.getPlacePredictions($.extend(true,{},opts,{ input: val}), function(data){
        //     if(data&&data.length){
        //         var out=[];
        //         $.each(data,function(i,v){
        //             out.push({
        //                 text:{
        //                     main:v.structured_formatting.main_text,
        //                     secondary:v.structured_formatting.secondary_text
        //                 },
        //                 place_id:v.place_id
        //             })
        //         });
        //         //test
        //         // var id=data[0].place_id;
        //         // app().geocode.getLocation(id,function(data){
        //         // });
        //         if(cb) cb(out);
        //     }else{
        //         if(cb) cb(false);
        //     }
        // });
    },
    getLocation:function(placeid,cb){
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({ 
            placeId: placeid
        },function(data,status){
            if (status == 'OK') {
                if(cb) cb({
                    lat:data[0].geometry.location.lat(),
                    lng:data[0].geometry.location.lng()
                },(data[0].types.indexOf('street_address')>=0||data[0].types.indexOf('premise')>=0)?1:0,data[0])
            }else{
                _alert('Error using Geocoder')
            }
        });
    }
}