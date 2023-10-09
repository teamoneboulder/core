var app={
    ver:1,
    appid:'2344d44c84409765d9a5ab39ae8cabcd',//web appid
	init:function(vars){
        app.year=2022;
        $('body').append('<div id="growlarea" style="position:absolute;bottom:5px;left:5px;z-index: 100000;"></div>');
		if(vars) $.each(vars,function(i,v){
            if(i!='modules') app[i]=v;
        });
        if(window.mobiscroll) mobiscroll.settings = {
            theme: 'ios'
        };
        //
        app.user=new modules.user({
            onboardVersion:2,
            onLogout:function(){
                app.renderLogin();
            },
            onValidAuth:function(){
                app.render();
                app.doneLoading()  
            },
            onNoAuth:function(){
                app.renderLogin()
                app.doneLoading()
            },
            onDoneLoading:function(){
                app.doneLoading()
            }
        });
    },
    renderLogin:function(){
        app.login=new modules.login({
            ele:$('#wrapper'),
            background:'',
            titleTemplate:'app_title',
            prettyClass:'prettyinput3',
            noPlaceholder:true,
            canCreate:true,
            onLogin:function(data){
                app.user.load(data,function(){
                    app.render();
                });
            }
        });
    },
    render:function(){
    	$('#wrapper').render({
    		append:false,
    		template:'home',
    		data:{
                year:app.year,
            },
    		binding:function(ele){
                app.ele=ele;
                ele.find('.x_logout').stap(function(){
                    app.user.logout()
                })
                ele.find('.x_print').stap(function(){
                    html2pdf($('#content')[0],{
                      margin:       20,
                      filename:     app.year+'_expense_report ('+app.user.profile.name+').pdf'
                  });
                })
                modules.api({
                    url:app.sapiurl+'/user/eoy_report',
                    dataType:'json',
                    type:'GET',
                    data:{
                        year:app.year
                    },
                    success:function(data){
                        app.renderList(data);
                    }
                })
                //load
                app.doneLoading();
    		}
    	})
    },
    renderList:function(resp){
        $('#content').render({
            template:'list',
            data:{
                resp:resp,
                year:app.year
            }
        })
    },
    doneLoading:function(){
        $('#wrapper').show()
        $('#splash').hide()
    	$('.page-loader').fadeOut(500,function(){
    		$(this).remove();
    	})
    }
};