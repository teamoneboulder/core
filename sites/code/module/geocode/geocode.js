if(!window.modules) window.modules={};
;modules.geocode={
    key:'AIzaSyC4eFhCuaXMgkF1MCopODiwlcOey9mv7_4',
    init:function(){
        var self=this;
        if(!self.initd){
            var script='https://maps.googleapis.com/maps/api/js?key='+self.key+'&libraries=places';
            var jq = document.createElement('script');
            jq.src = script;
            jq.id="googleapi";
            document.getElementsByTagName('head')[0].appendChild(jq);
            self.inid=true;
        }
    },
    search:function(val,opts,cb){
        var service = new google.maps.places.AutocompleteService();
        if(!opts) opts={};
        service.getPlacePredictions($.extend(true,{},opts,{ input: val}), function(data){
            if(data&&data.length){
                var out=[];
                $.each(data,function(i,v){
                    out.push({
                        text:{
                            main:v.structured_formatting.main_text,
                            secondary:v.structured_formatting.secondary_text
                        },
                        place_id:v.place_id
                    })
                });
                //test
                // var id=data[0].place_id;
                // app().geocode.getLocation(id,function(data){
                // });
                if(cb) cb(out);
            }else{
                if(cb) cb(false);
            }
        });
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