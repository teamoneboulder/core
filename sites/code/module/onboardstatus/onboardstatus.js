modules.onboardstatus=function(options){
	var self=this;
	this.init=function(){
		self.loadOnboardStatus();
		options.headerele.stap(function(){
            if(self.onboardstatus&&self.onboardstatus.percent!=100){
                if(self.onboardStatusShowing){
                    self.hideOnboardStatus();
                }else{
                    self.showOnboardStatus();
                }
            }
        },1,'tapactive')
	}
	this.hideOnboardStatus=function(){
		if(options.headerele.find('.spinner').length){
			TweenLite.to(options.headerele.find('.spinner'),.3,{rotation:0,transformOrigin:"50% 50%"})
		}
        self.onboardStatusShowing=false;
        options.menuele.parent().hide();
    }
    this.renderOnboardStatus=function(reload){
        options.headerele.render({
            append:false,
            template:(options.mobile)?'onboardstatus_complete_profile_mobile':'onboardstatus_complete_profile',
            binding:function(ele){
                self.indicator=ele.find('.indicator').radialIndicator({
                    barColor: '#87CEEB',
                    barWidth: 3,
                    initValue: self.onboardstatus.percent,
                    radius:17,
                    roundCorner : true,
                    percentage: true
                });
                ele.find('.x_close').stap(function(e){
                	phi.stop(e);
                	self.clear();
                },1,'tapactive')
                if(options.contentele){
                	options.contentele.css('top',ele.outerHeight());
                }
            }
        })
        if(app.isWebLayout()||reload){
            self.showOnboardStatus();//re-render
        }
        if(reload||!app.prefs.get('onboarded')){//on first load show the load
            //also show facebook linking automatically!
            if(!reload&&(!app.user.profile.creds||!app.user.profile.creds.facebook)){
                var onb=new modules.onboard({
                    ele:$('body'),
                    nocache:true,
                    canClose:true,
                    noLoad:true,
                    noAgreement:true,
                    animateShow:true,
                    noLogin:true,
                    //noSave:true,
                    pages:['link_fb'],
                    type:'simple',
                    onComplete:function(){
                        self.loadOnboardStatus(false,1);
                    }
                })
                onb.show();
            }
            app.prefs.set('onboarded',1);
        }
    }
    this.clear=function(){
    	options.headerele.html('');//clear out 
        if(options.contentele){
        	options.contentele.css('top',0);
        }
        options.menuele.html('');
        self.hideOnboardStatus();
    }
    this.loadOnboardStatus=function(retry,reload){
         app.api({
            url: app.apiurl2+'/home/onboardstatus',
            type:'GET',
            data:{
            },
            callback:function(data){
                if(data.success){
                    self.onboardResponse=data;
                    self.onboardstatus=self.getOnboardStatus(data);
                    if(self.onboardstatus.percent!=100){
                        self.renderOnboardStatus(reload);
                    }else{
                        self.clear();
                    }
                }else{
                    //keep on retrying
                    if(!retry) retry=0;
                    retry++;
                    if(retry<5){
                        self.loadOnboardStatus(retry);
                    }
                }
            }
        });
    }
    this.showOnboardStatus=function(){
        //render
        if(options.headerele.find('.spinner').length){
			TweenLite.to(options.headerele.find('.spinner'),.3,{rotation:180,transformOrigin:"50% 50%"})
		}
        if(options.onShow) options.onShow();
        self.onboardStatusShowing=true;
        options.menuele.render({
            template:'onboardstatus_complete_profile_nav',
            append:false,
            data:{
                name:app.user.profile.name,
                data:self.onboardstatus,
                items:{
                    user_bg:{
                        id:'user_bg',
                        title:'Background Image',
                        icon:'icon-images',
                        content:'Add a background photo to your profile!'
                    },
                    pollinator:{
                        id:'pollinator',
                        title:'Pollinator Program',
                        icon:'icon-images',
                        content:'Join the Pollinator Program and help us grow!'
                    },
                    dietary:{
                        id:'dietary',
                        title:'Set Dietary Preferences',
                        icon:'icon-meals',
                        content:'Set your dietary preferences to support our meal based tools and groups!'
                    },
                    facebook:{
                        id:'facebook',
                        title:'Link Facebook',
                        icon:'icon-facebook-squared',
                        content:'Link your Facebook account and sync your posts and friends'
                    },
                    facebook_posts:{
                        id:'facebook_posts',
                        title:'Facebook Posts',
                        icon:'icon-facebook-squared',
                        content:'Connect your Facebook account and link the posts you make on Facebook to Nectar.'
                    },
                    facebook_friends:{
                        id:'facebook_friends',
                        title:'Facebook Friends',
                        icon:'icon-facebook-squared',
                        content:'Connect your Facebook account and automatically import your Facebook friends who join Nectar!'
                    },
                    location:{
                        id:'location',
                        title:'Home City',
                        icon:'icon-location-1',
                        content:'Add your current home city'
                    },
                    intro_video:{
                        id:'intro_video',
                        title:'Intro Video',
                        icon:'icon-videocam',
                        content:'Add an Intro Video and introduce yourself to the community'
                    },
                    partial_page:{
                        id:'partial_page',
                        title:'Complete Your Page!',
                        icon:'icon-pages',
                        content:'Finish your page so that more people can discover it!'
                    },
                    contact_card:{
                        id:'contact_card',
                        title:'Contact Card',
                        icon:'icon-address-card-o',
                        content:'Complete your Contact Card'
                    },
                    connection_post:{
                        id:'connection_post',
                        title:'Connection Post',
                        icon:'icon-connect-new',
                        content:'Add your first Connection Post!'
                    },
                    stream_post:{
                        id:'stream_post',
                        title:'Stream Post',
                        icon:'icon-streams',
                        content:'Add your first Stream Post!'
                    },
                    real_name:{
                        id:'real_name',
                        title:'Update Identity',
                        icon:'icon-user-circle-o',
                        content:'Update your Real and Social Names'
                    },
                    skills:{
                        id:'skills',
                        title:'Skills',
                        icon:'icon-hands_heart',
                        content:'Add your skills!'
                    },
                    tags:{
                        id:'tags',
                        title:'Tags',
                        icon:'icon-tags',
                        content:'Add interest and connection tags!'
                    }
                }
            },
            binding:function(ele){
                ele.find('.x_close').stap(function(){
                    self.hideOnboardStatus();
                },1,'tapactive')
                ele.find('.x_onboarditem').stap(function(){
                    var type=$(this).attr('data-type');
                    switch(type){
                        case 'pollinator':
                            modules.viewdelegate.register('affiliate',{
                                id:'affiliate',
                                data:{}
                            })
                        break;
                        case 'user_bg':
                            var picker=new modules.cropuploader({
                                btn:ele.find('.x_editprofile'),
                                sizes:['small','full','background'],
                                directUpload:true,
                                data:{
                                    title:'Set Background Picture',
                                    crops:[{
                                        title:'Crop Background Picture',
                                        width:500,
                                        height:250,
                                        cropKey:'background'
                                    }]
                                },
                                onSuccess:function(data){
                                    picker.saving();
                                    self.updateUser({bg:data},function(success,err){
                                        if(success){
                                            picker.destroy();
                                            //update!
                                            self.loadOnboardStatus(false,1);
                                        }else{
                                            modules.toast({
                                                content:'Error Saving: '+err
                                            })
                                        }
                                    })
                                }
                            })
                            picker.show();
                        break;
                        case 'facebook':
                        case 'facebook_friends':
                        case 'facebook_posts':
                            var onb=new modules.onboard({
                                ele:$('body'),
                                nocache:true,
                                canClose:true,
                                noLoad:true,
                                noAgreement:true,
                                animateShow:true,
                                noLogin:true,
                                //noSave:true,
                                pages:['link_fb'],
                                type:'simple',
                                onComplete:function(){
                                    self.loadOnboardStatus(false,1);
                                }
                            })
                            onb.show();
                        break;
                        case 'connection_post':
                            var adder=new modules.add({
                                type:'connection',
                                enableMore:false,
                                data:{
                                    current:false,
                                    onSuccess:function(){
                                        self.loadOnboardStatus(false,1);
                                    } 
                                }
                            });
                            adder.show();
                        break;
                        case 'stream_post':
                            var adder=new modules.add({
                                type:'post',
                                enableMore:false,
                                data:{
                                    current:false,
                                    onSuccess:function(){
                                        self.loadOnboardStatus(false,1);
                                    } 
                                }
                            });
                            adder.show();
                        break;
                        case 'intro_video':
                            var adder=new modules.add({
                                type:'intro-video',
                                enableMore:false,
                                data:{
                                    current:false,
                                    onSuccess:function(){
                                        self.forceIntro=true;//trust
                                        self.loadOnboardStatus(false,1);
                                    } 
                                }
                            });
                            adder.show();
                        break;
                        case 'location':
                            var onb=new modules.onboard({
                                ele:$('body'),
                                nocache:true,
                                canClose:true,
                                noTags:true,
                                noAgreement:true,
                                noLogin:true,
                                animateShow:true,
                                pages:['location'],
                                type:'simple',
                                onComplete:function(){
                                    self.loadOnboardStatus(false,1);
                                }
                            })
                            onb.show();
                        break;
                        case 'partial_page':
                            var data=self.onboardResponse.data.partial_page;
                            var adder=new modules.add({
                                type:'page',
                                enableMore:false,
                                data:{
                                    current:data,
                                    onSuccess:function(){
                                        self.loadOnboardStatus(false,1);
                                    } 
                                }
                            });
                            adder.show();
                        break;
                        case 'dietary':
                            var onb=new modules.onboard({
                                ele:$('body'),
                                nocache:true,
                                canClose:true,
                                noLoad:true,
                                noTags:true,
                                noSave:true,
                                noAgreement:true,
                                noLogin:true,
                                animateShow:true,
                                pages:['dietary_info','diet','diet_allergies'],
                                type:'simple',
                                onComplete:function(){
                                    self.loadOnboardStatus(false,1);
                                }
                            })
                            onb.show();
                        break;
                        case 'contact_card':
                            var onb=new modules.onboard({
                                ele:$('body'),
                                nocache:true,
                                canClose:true,
                                noTags:true,
                                noAgreement:true,
                                noLogin:true,
                                animateShow:true,
                                pages:['personal_info'],
                                type:'simple',
                                onComplete:function(){
                                    self.loadOnboardStatus(false,1);
                                }
                            })
                            onb.show();
                        break;
                        case 'real_name':
                            var onb=new modules.onboard({
                                ele:$('body'),
                                nocache:true,
                                canClose:true,
                                noTags:true,
                                noAgreement:true,
                                noLogin:true,
                                animateShow:true,
                                pages:['name'],
                                type:'simple',
                                onComplete:function(){
                                    self.loadOnboardStatus(false,1);
                                }
                            })
                            onb.show();
                        break;
                        case 'tags':
                            var onb=new modules.onboard({
                                ele:$('body'),
                                nocache:true,
                                canClose:true,
                                noAgreement:true,
                                noLogin:true,
                                animateShow:true,
                                pages:['tag_preview','passion_preview','passions','connection_preview','connections'],
                                type:'simple',
                                onComplete:function(){
                                    self.loadOnboardStatus(false,1);
                                }
                            })
                            onb.show();
                        break;
                        case 'skills':
                            var onb=new modules.onboard({
                                ele:$('body'),
                                nocache:true,
                                canClose:true,
                                noLoad:true,
                                noTags:true,
                                noAgreement:true,
                                noLogin:true,
                                animateShow:true,
                                pages:['skills'],
                                type:'simple',
                                onComplete:function(){
                                    self.loadOnboardStatus(false,1);
                                }
                            })
                            onb.show();
                        break;
                    }
                },1,'tapactive')
            }
        })
        setTimeout(function(){
            options.menuele.parent().show();
        },50)
    }
    this.updateUser=function(save,cb){
        app.api({
            url:app.sapiurl+'/user/update',
            data:{data:save},
            logurl:true,
            timeout:5000,
            callback:function(resp){
                if(resp.success){
                    cb(true);
                }else{
                    cb(false,resp.error)
                }
            }
        });
    }
    this.getOnboardStatus=function(data){
        var total=0;
        var completed=0;
        var needs=[];
        //Facebook
        if(data.data.facebook){
            if(data.data.facebook==2){//doesnt want to link!

            }else{
                total++;
                if(data.data.facebook&&data.data.facebook.friends){
                    completed++;
                }else{
                    needs.push('facebook_friends');
                }
                //Facebook
                total++;
                if(data.data.facebook&&data.data.facebook.posts){
                    completed++;
                }else{
                    needs.push('facebook_posts');
                }
            }
        }else{
            total++;
            needs.push('facebook');
        }
        $.each(data.data.contact_card.list,function(i,v){
            if(v) completed++;
            total++;
        });
        //superpwers post
        total++;
        if(data.data.tags.skills){
            completed++;
        }else{
            needs.push('skills');
        }
        //tags post
        total++;
        if(data.data.tags.tags){
            completed++;
        }else{
            needs.push('tags');
        }
        //dietary
        total++;
        if(data.data.dietary){
            completed++;
        }else{
            needs.push('dietary');
        }
        //bg
        total++;
        if(data.data.user_bg){
            completed++;
        }else{
            needs.push('user_bg');
        }
        //Facebook
        total++;
        if(data.data.partial_page){
            needs.push('partial_page');
        }else{
            completed++;
        }
        //intro_video
        total++;
        if(data.data.intro_video||self.forceIntro){
            completed++;
        }else{
            needs.push('intro_video');
        }
        //Facebook
        total++;
        if(data.data.real_name){
            completed++;
        }else{
            needs.push('real_name');
        }
        //location
        total++;
        if(data.data.location){
            completed++;
        }else{
            needs.push('location');
        }
        //connection post
        total++;
        if(data.data.connection_post){
            completed++;
        }else{
            needs.push('connection_post');
        }
        //stream post
        total++;
        if(data.data.stream_post){
            completed++;
        }else{
            needs.push('stream_post');
        }
        if(data.data.contact_card.total!=data.data.contact_card.completed){
            needs.push('contact_card')
        }
        //bg
        total++;
        if(data.data.pollinator){
            completed++;
        }else{
            needs.push('pollinator');
        }
        //start at 50
        var percent=50;
        var pt=parseFloat((((completed/total)*100)/2).toFixed(2));
        percent+=pt;
        return {
            total:total,
            completed:completed,
            percent:percent,
            needs:needs
        }
    }
}