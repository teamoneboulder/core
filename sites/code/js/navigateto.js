modules.navigateTo=function(loc,loc_info){
    if(isPhoneGap()&&window.launchnavigator){
        launchnavigator.navigate(loc,{
            app:launchnavigator.APP.USER_SELECT,
            successCallback:function(){
                
            },
            errorCallback:function(e){
                //alert(JSON.stringify(e))
            }
        });
    }else{
        //http://maps.google.com/maps?q=24.197611,120.780512
        var tq=loc_info.lat+','+loc_info.lng;
        if(isPhoneGap()){
            window.open('https://www.google.com/maps/dir/?api=1&q='+loc,'_system');
        }else{
            _.openLink({
                intent:'https://www.google.com/maps/place/?q='+loc,
                type:'external'
            })
        }
    }
};