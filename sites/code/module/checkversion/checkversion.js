;modules.version={
    min:function(ver,test){
        if(isPhoneGap()&&window.app_conf&&window.app_conf.version||test){
            var vp=ver.split('.');
            var cversion={
                major:parseInt(vp[0],10),
                minor:parseInt(vp[1],10),
                build:parseInt(vp[2],10)
            }
            if(test){
                var vparts=test.split('.');
            }else{
                var vparts=window.app_conf.version.split('.');
            }
            app.appversion={
                major:parseInt(vparts[0],10),
                minor:parseInt(vparts[1],10),
                build:parseInt(vparts[2],10)//eventually replace
            }
            if(cversion.major>app.appversion.major){
                return false;
            }else if(cversion.major==app.appversion.major){//check next level!
                if(cversion.minor>app.appversion.minor){
                    return false;
                }else if(cversion.minor==app.appversion.minor){//check next level!
                    if(cversion.build>app.appversion.build){
                        return false
                    }else{
                        return true;
                    }
                }else{
                    return true;
                }
            }else{
                return true;
            }
        }else{
            return true;
        }
    },
    test:function(){
        var tests=[{
            current:'4.8.0',
            check:'4.8.1',
            expected:false
        },{
            current:'4.8.5',
            check:'4.8.4',
            expected:true
        },{
            current:'4.8.0',
            check:'5.0.0',
            expected:false,
        },{
            current:'4.8.0',
            check:'3.0.0',
            expected:true,
        },{
            current:'4.8.0',
            check:'4.7.0',
            expected:true
        },{
            current:'4.8.0',
            check:'4.9.0',
            expected:false
        },{
            current:'4.8.1',
            check:'4.8.1',
            expected:true
        }];
        $.each(tests,function(i,v){
            console.log('current ['+v.current+'] against ['+v.check+'] '+((modules.version.min(v.check,v.current)==v.expected)?'PASS':'FAIL'));
        })
    },
    getCurrentVersion:function(){
        return modules.version.current[app.device];
    },
    updateAlert:function(){
        $('body').alert({
            icon:false,
            image:false,
            background:'rgba(255,255,255,.85)',
            template:'updatealert',
            tempdata:{
                device:app.device,
                appname:'ONE|Boulder'
            },
            loc:'top',
            closer:false,
            buttons:[{
                btext:(app.device=='iOS')?'Update from App Store':'Update From Google Play',
                bclass:'x_update'
            }],
            bindings:[{
                type:'fn',
                binding:function(ele){
                    ele.find('.x_update').stap(function(){
                        if(app.device=='iOS'){
                            var store_id=app.ios_store_id;
                            if(window.cordova&&cordova.InAppBrowser){
                                _.openLink({intent:'itms-apps://itunes.apple.com/app/id'+store_id,type:'self'});
                            }else{
                                _.openLink({intent:'https://itunes.apple.com/us/app/apple-store/id'+store_id+'?mt=8'});
                            }
                        }else{
                            if(window.cordova&&cordova.InAppBrowser){
                                _.openLink({intent:'market://details?id='+window.app_conf.app_identifier,type:'self'});
                            }else{
                                _.openLink({intent:'https://play.google.com/store/apps/details?id='+window.app_conf.app_identifier});
                            }
                        }
                        $('body').spin({
                            bg:1,
                            size:80
                        })
                    },1,'tapactive')
                }
            }]
        })
    },
    check:function(current){
        modules.version.current=current;
        if(isPhoneGap()&&window.app_conf&&window.app_conf.version){
            var min=current[app.device];
            //_alert(min+' '+window.app_conf.version)
            if(min&&!modules.version.min(min)){//really try to get user to update
                if(app.isdev&&false){
                    _alert('Your app core is out of date. this is a Dev only message brought to you by Tom :) ');
                }else{
                    modules.version.updateAlert();
                    document.addEventListener("resume", function(){
                        $('body').spin(false);
                    }, false);
                    return false;//dont allow load...
                }
            }
        }
        return true;
    }
}