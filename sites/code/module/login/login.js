modules.login=function(opts){
	var self=this;
	self.options=opts;
	this.init=function(){
        if(opts.alert){
            $('body').alert({
                template:'login',
                image:false,
                icon:false,
                buttons:false,
                overlay:true,
                zIndex:1000000,
                title:'Nectar Sign In',
                tempdata:{
                    background:(opts.background)?opts.background:false,
                    inline:true,
                    user:(opts.user)?opts.user:false,
                    prettyClass:self.getClass(),
                    placeholder:(opts.noPlaceholder)?0:1
                },
                binding:function(ele){
                    self.ele=ele;
                    ele.addClass('fadeinform');
                    self.bindFBLogin();
                    ele.find('input').on('keyup input',function(){
                        if($(this).val()) $(this).parents('.'+self.getClass()).addClass('hasvalue');
                        else $(this).parents('.'+self.getClass()).removeClass('hasvalue');
                        if($(this).attr('id')=='email'){
                            ele.find('#resetemail').val($(this).val());
                            if($(this).val()){
                                ele.find('#resetemail').parents('.'+self.getClass()).addClass('hasvalue');
                            }else{
                                ele.find('#resetemail').parents('.'+self.getClass()).removeClass('hasvalue');
                            }
                        }
                    })
                    ele.find('.x_forgot').stap(function(){
                        $('#loginform').hide();
                        $('#forgotform').show();
                    },1,'tapactive');
                    ele.find('.x_tologin').stap(function(){
                        $('#loginform').show();
                        $('#forgotform').hide();
                    },1,'tapactive');
                    ele.find('#reset').stap(function(){
                        self.reset({
                            un:self.ele.find('#resetemail').val()
                        },function(success,err){
                            if(success){
                                self.ele.find('#resetresponse').html('Successfully sent and email to reset your password!').show();
                            }else{
                                self.ele.find('#resetresponse').html(err).show();
                            }
                        });
                    },1,'tapactive')
                    self.ele.find('#email').on('keyup',function(e){
                        if(e.which==13){
                            self.doLogin()
                        }
                    })
                    self.ele.find('#password').on('keyup',function(e){
                        if(e.which==13){
                            self.doLogin()
                        }
                    })
                    ele.find('.x_loginbtn').stap(function(){
                        self.doLogin()
                    },1,'tapactive')
                }
            })
        }else{
		  self.render();
        }
	}
    this.doLogin=function(){
        self.login({
            un:self.ele.find('#email').val(),
            pw:self.ele.find('#password').val(),
            preview:(self.hasPassword)?'':1,
        },function(success,err,data){
            if(success){
                if(opts.alert) $.fn.alert.closeAlert();
                self.options.onLogin(data);
            }else{
                self.ele.find('#signinresponse').html(err).show();
            }
        });
    }

    this.showSetPassword=function(resp){
        self.createResponse=resp;
        $('#loginform').hide();
        $('#forgotform').hide();
        $('#setform').show();
        if(resp.hasPic){
            $('#setprofilepic').hide();
        }else{
            $('#setprofilepic').show();
        }
    }
	this.reset=function(data,cb){
        self.sending=1;
        data.redirect=window.location.href;//no redirect in mobile
        var c=self.ele.find('#reset').html();
        self.ele.find('#reset').html('<i class="icon-refresh animate-spin"></i>');
        modules.api({
            caller:'User Login',
            url: app.sapiurl+'/user/reset', 
            data:data,
            callback: function(data){
                self.sending=0;
                self.ele.find('#reset').html(c);
                if(data.error){
                    if(data.error=='user_not_found'){
                        cb(false,'Sorry, we could not find the email you provided.<br/>Please Try Again.');
                    }else if(data.error=='must_set_password'){
                        self.showSetPassword(data);
                    }else{
                        cb(false,data.error);
                    }
                }else{
                    cb(true);
                }
            }
        });
    }
    this.bindFBLogin=function(){
        self.ele.find('.x_fblogin').stap(function(){
            var scopes=[''];
            var payload={
                provider:'facebook',
                app:'nectar',
                login:'fb_login',
                queue:[],
            }
            if(options.force_redirect){
                payload.force_redirect=1;
            }
            modules.oauth({
                payload:payload,
                scope:scopes
            },{
                onAuthOpen:function(){
                    //cur.removeClass('submitting')
                },
                onSuccess:function(resp){
                    //reload onboard/login!
                    if(resp.magic){
                        //login and re-start onboaring!
                        app.user.magicLink=resp.magic;
                        app.user.get(function(loggedin,skip){
                            self.destroy();
                            app.setTheme();//will be based on user
                            $('#wrapper').show();
                            if(!skip){
                                if(loggedin||!app.requireLogin){
                                    app.home=new modules.home({});
                                }else{
                                    var w=new modules.welcome();
                                    w.show();
                                }
                            }
                        });
                    }else{
                        $('body').alert({
                            zIndex:10000000,
                            icon:'icon-warning-sign',
                            content:'Sorry, we ran into an unexpected error, please try again'
                        })
                    }
                },
                onError:function(data){
                    if(data&&data.error) $('body').alert({
                        zIndex:10000000,
                        icon:'icon-warning-sign',
                        content:'Error: '+data.error
                    })
                    else if(app.isdev){
                        _alert('dev error: '+JSON.stringify(data));
                    }
                }
            });
        },1,'tapactive')
    }
    this.destroy=function(){
        self.ele.remove()
    }
    this.getClass=function(){
        return (opts.prettyClass)?opts.prettyClass:'prettyinput';
    }
	this.render=function(){
    	opts.ele.render({
    		template:'login',
    		append:false,
    		data:{
                titleTemplate:(opts.titleTemplate)?opts.titleTemplate:false,
                background:(opts.background)?opts.background:false,
                backgroundColor:(opts.backgroundColor)?opts.backgroundColor:false,
                inline:(opts.inline)?opts.inline:false,
    			user:(opts.user)?opts.user:false,
                hasCreate:(self.options.onCreate)?1:0,
                prettyClass:self.getClass(),
                placeholder:(opts.noPlaceholder)?0:1
    		},
    		binding:function(ele){
    			self.ele=ele;
                ele.find('.x_back').stap(function(){
                    if(opts.onBack) opts.onBack()
                },1,'tapactive');
                if(ele.find('.profilepicupload').length&&modules.cropuploader){
                    self.picuploader=new modules.cropuploader({
                        btn:ele.find('.profilepicupload'),
                        sizes:['small','full','square'],
                        directUpload:true,
                        data:{
                            title:'Set Profile Picture',
                            crops:[{
                                title:'Crop Square',
                                width:200,
                                height:200,
                                cropKey:'square'
                            }]
                        },
                        onSuccess:function(data){
                            //self.picuploader.saving();
                            self.picuploader.destroy();
                            self.ele.find('.uploadimgcover').hide();
                            self.ele.find('.profilepic').css('backgroundImage','url('+_.getImg(data,'square')+')');
                            self.profilepic=data;
                            //self.store.pic=data;
                        }
                    })
                }
                ele.find('.x_create').stap(function(){
                    if(self.options.onCreate) self.options.onCreate()
                },1,'tapactive');
                self.bindFBLogin();
                ele.addClass('fadeinform');
    			ele.find('input').on('keyup input',function(){
    				if($(this).val()) $(this).parents('.'+self.getClass()).addClass('hasvalue');
    				else $(this).parents('.'+self.getClass()).removeClass('hasvalue');
    				if($(this).attr('id')=='email'){
    					ele.find('#resetemail').val($(this).val());
    					if($(this).val()){
    						ele.find('#resetemail').parents('.'+self.getClass()).addClass('hasvalue');
    					}else{
    						ele.find('#resetemail').parents('.'+self.getClass()).removeClass('hasvalue');
    					}
    				}
    			})
    			ele.find('.x_forgot').stap(function(){
                    $('#loginform').hide();
                    $('#forgotform').show();
                },1,'tapactive');
                ele.find('.x_tologin').stap(function(){
                    $('#loginform').show();
                    $('#forgotform').hide();
                    $('#setform').hide();
                },1,'tapactive');
                ele.find('#reset').stap(function(){
                    self.reset({
                        un:self.ele.find('#resetemail').val()
                    },function(success,err){
                        if(success){
                            self.ele.find('#resetresponse').html('Successfully sent and email to reset your password!').show();
                        }else{
                            self.ele.find('#resetresponse').html(err).show();
                        }
                    });
                },1,'tapactive')
                ele.find('#setpw').stap(function(){
                    var data={
                        email:self.ele.find('#email').val(),
                        p1:self.ele.find('#setpass1').val(),
                        p2:self.ele.find('#setpass2').val()
                    }
                    if(!self.createResponse.hasPic){
                        if(!self.profilepic){
                            self.ele.find('#setresponse').html('Please upload a profile pic').show().shake();
                            return false;
                        }
                        data.pic=self.profilepic;
                    }
                    if(!data.p1||data.p1!=data.p2){
                        self.ele.find('#setresponse').html('Please ensure passwords are set and match.').show().shake();
                        return false;
                    }
                    self.ele.find('#setresponse').html('').hide();
                    self.setpw(data,function(success,err,data){
                        if(success){
                            self.ele.find('#setresponse').html('').hide();
                            self.options.onLogin(data);
                        }else{
                            self.ele.find('#setresponse').html(err).show();
                        }
                    });
                },1,'tapactive')
                self.ele.find('#email').on('keyup',function(e){
                    if(e.which==13){
                        self.doLogin()
                    }
                })
                self.ele.find('#password').on('keyup',function(e){
                    if(e.which==13){
                        self.doLogin()
                    }
                })
                ele.find('.x_loginbtn').stap(function(){
                    self.doLogin()
                    // self.login({
                    //     un:self.ele.find('#email').val(),
                    //     pw:self.ele.find('#password').val(),
                    //     preview:(self.hasPassword)?'':1,
                    // },function(success,err,data){
                    //     if(success){
                    //         self.options.onLogin(data);
                    //     }else{
                    //         self.ele.find('#signinresponse').html(err).show();
                    //     }
                    // });
                },1,'tapactive')
    		}
    	});
    }
    this.setpw=function(data,cb){
        if(self.sending) return false;
        self.sending=1;
        self.ele.find('.seticon').removeClass('icon-logout').addClass('icon-refresh animate-spin');
        data.appid=app.appid;
        modules.api({
            url: app.sapiurl+'/user/setpw', 
            data:data,
            cleanData:true,
            callback: function(data){
                self.sending=0;
                self.ele.find('.seticon').addClass('icon-logout').removeClass('icon-refresh animate-spin')
                if(data.error){
                    cb(false,data.error);
                }else if(data.profile){
                    cb(true,false,data);
                }else{
                    cb(false,'unknown_error');
                }
            }
        });
    }
    this.login=function(data,cb){
        if(self.sending) return false;
        self.sending=1;
        var c=self.ele.find('#signin').html();
        self.ele.find('#signin').html('<i class="icon-refresh animate-spin"></i>');
        data.appid=app.appid;
        var user=self.options.user;
        if(user) data.uid=user.id;
        if(self.options.customProfile) data.customProfile=self.options.customProfile;
        modules.api({
            caller:'User Login',
            url: app.sapiurl+'/user/login', 
            data:data,
            cleanData:true,
            callback: function(resp){
                self.sending=0;
                self.ele.find('#signin').html(c);
                if(resp.success&&data.preview){
                    //show the password field!
                    self.hasPassword=1;
                    self.ele.find('#signinresponse').html('').hide()
                    self.ele.find('#passwordbox').show();
                    setTimeout(function(){
                        self.ele.find('#password').focus()
                    },50)
                }else if(resp.error){
                    if(resp.error=='user_not_found'){
                        if(self.hasPassword) cb(false,'Sorry, The email and password provided do not match.<br/>Please Try Again.');
                        else cb(false,'Sorry, we couldnt find this account, please try again.');
                    }else if(resp.error=='must_set_password'){
                        self.showSetPassword(resp);
                    }else{
                        cb(false,resp.error);
                    }
                }else if(resp.profile){
                   	cb(true,false,resp);
                }
            }
        });
    }
    self.init();
}