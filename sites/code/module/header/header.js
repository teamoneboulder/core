if(!window.modules) window.modules={};
;modules.header=function(ele,options){
	var self=this;
	self.options=options;
    this.init=function(){
        ele.render({
            template:'header',
            data:options,
            append:false,
            binding:function(ele){
                self.ele=ele;
                ele.find('.x_logout').stap(function(){
                    app.user.logout();
                },1,'tapactive')
                ele.find('.x_continue_fb').stap(function(){
                    var scopes=[''];
                    var payload={
                        provider:'facebook',
                        app:'nectar',
                        login:'fb_login',
                        type:'continue_fb',
                        queue:[]
                    }
                    modules.oauth({
                        payload:payload,
                        scope:scopes
                    },{
                        onAuthOpen:function(){
                            //cur.removeClass('submitting')
                        },
                    });
                },1,'tapactive')
                ele.find('.x_learnmore').stap(function(){
                    var onboard=new modules.onboard({ele:$('body'),create:1,noTags:1,onComplete:function(){
                        //self.showLoading(function(){
                            app.user.reRender();
                            self.destroy();
                        //});
                    }});
                    onboard.show();
                    // var alert=new modules.alertdelegate({
                    //     display:{
                    //         ele:$(this),
                    //         container:ele,
                    //     },
                    //     hideOverflow:true,
                    //     group:'logincreate',
                    //     width:'300px',
                    //     height:'100px',
                    //     renderFunction:function(ele){
                    //         self.welcome=new modules.welcome({ele:ele,web:1,action:'create',onHeightChange:function(h,set){
                    //             TweenLite.set(ele,{height:h});
                    //             TweenLite.set(ele.parents('.webcontextscroller'),{height:h});
                    //             if(set) TweenLite.set(ele.parents('.webcontextbox'),{height:h});
                    //             else TweenLite.to(ele.parents('.webcontextbox'),.2,{height:h})
                    //         }})
                    //         self.welcome.show()
                    //     }
                    // });
                    // alert.show();
                },1,'tapactive')
                ele.find('.x_login').stap(function(){
                    // self.login=new modules.login({
                    //     ele:$('#wrapper'),
                    //     prettyClass:'prettyinput3',
                    //     alert:true,
                    //     noPlaceholder:true,
                    //     onLogin:function(data){
                    //         app.user.load(data,function(){
                    //             app.refresh();
                    //         });
                    //     }
                    // });
                    var alert=new modules.alertdelegate({
                        display:{
                            ele:$(this),
                            container:ele,
                        },
                        group:'logincreate',
                        hideOverflow:true,
                        width:'300px',
                        height:'100px',
                        renderFunction:function(ele){
                            self.welcome=new modules.welcome({ele:ele,web:1,action:'signin',onHeightChange:function(h,set){
                                TweenLite.set(ele,{height:h});
                                TweenLite.set(ele.parents('.webcontextscroller'),{height:h});
                                if(set) TweenLite.set(ele.parents('.webcontextbox'),{height:h});
                                else TweenLite.to(ele.parents('.webcontextbox'),.2,{height:h})
                            },onLogin:function(data){
                                app.user.initApp(data);
                            }})
                            self.welcome.show()
                        }
                    });
                    alert.show();
                },1,'tapactive')
                if(app.user.profile&&app.isWebLayout()){
                    self.onboardstatus=new modules.onboardstatus({
                        menuele:self.ele.find('.onboardcontent'),
                        headerele:self.ele.find('.x_complete'),
                        onShow:function(){
                            self.hideMenus();
                        }
                    });
                    self.onboardstatus.init();
                }
                ele.find('.x_notifications').stap(function(){
                    self.hideContext();
                    self.showNotifications();
                },1,'tapactive')
                ele.find('.x_chats').stap(function(){
                    self.hideContext();
                    self.showChats();
                },1,'tapactive')
                ele.find('.backicon').stap(function(e){
                    if(app.device=='iOS'&&!app.isWkWebview()){
                        setTimeout(function(){//UIView Fix for ios, otherwise input shows..
                            if(app.home.manager.canGoBack()){
                                console.log('goback!');
                            }
                        },100)
                    }else{
                        if(app.home.manager.canGoBack()){
                            console.log('goback!');
                        }
                    }
                },1,'tapactive');
                self.searchbar=new modules.search({
                    allowAdd:false,
                    multiple:false,
                    renderTemplate:'modules_search_chat',
                    dontShow:[],
                    input:ele.find('.chatsearch'),
                    searchEle:ele.find('.chatsearcharea'),
                    endpoint:app.apiurl2+'/search/chat',
                    endpointData:{
                        
                    },
                    getEndpointData:function(){
                        return {
                            identity:app.home.getIdentity().data.id
                        }
                    },
                    showNoResults:true,
                    disableLoading:false,
                    cancelEle:ele.find('.x_cancelchatsearch'),
                    onKeyUp:function(val){
                    },
                    onCancel:function(){
                        self.exitChatSearch();
                    },
                    onSelect:function(id,item){//might want or need full item.
                       //console.log(id,item)
                       //register chat!
                       self.exitChatSearch();
                       self.hideChats();
                       app.home.chatmanager.add(item);
                    }
                });
                ele.find('.x_addchat').stap(function(){
                    self.hideChats();
                    self.adder=new modules.add({
                        type:'chat',
                        enableMore:false,
                        data:{
                        }
                    });
                    self.adder.show();
                },1,'tapactive');
                ele.find('.x_cancelchatsearch').stap(function(){
                    self.exitChatSearch();
                },1,'tapactive');
                ele.find('.x_searchchat').stap(function(){
                    self.enterChatSearch();
                },1,'tapactive');
                ele.find('.x_add').stap(function(){
                    self.hideContext();
                    app.home.onAdd({
                        webcreate:true
                    });
                },1,'tapactive')
                ele.find('.currentpage').stap(function(){
                    if(options.onClick) options.onClick();
                },1,'tapactive')
                ele.find('.x_cancelsearch').stap(function(){
                    if(ele.find('.searchinput').val()){
                        self.search.clear()
                    }else{
                        self.search.exit();
                    }
                },1,'tapactive')
                ele.find('.cancelicon').stap(function(){
                    //temporary
                    if(self.search.showing){
                        self.search.close();
                    }else{
                        
                    }
                },1,'tapactive')
                ele.find('.searchinput').on('keyup',function(e){
                    if(e.which==27){
                        self.search.exit();
                    }else{
                        self.search.keyup($(this).val());
                    }
                }).on('keydown',function(e){
                    if(e.which==38){
                        self.search.incriment('-');
                        return false;
                    }
                    if(e.which==40){
                        self.search.incriment('+');
                    }
                    if(e.which==13){
                        self.search.select();
                    }
                }).on('focus',function(){
                    //special stuff here
                    self.search.onWebShow();
                    if(!options.onExit) self.focus();
                });
            }

        })
    }
    this.hideContext=function(){
        if(app.home.identityalert) app.home.identityalert.destroy();
    }
    this.enterChatSearch=function(){
        self.ele.find('.defaultview').hide()
        self.ele.find('.searchview').show()
        self.searchbar.onShow();
        setTimeout(function(){
            self.ele.find('.chatsearch').focus();
        },50)
    }
    this.exitChatSearch=function(){
        self.ele.find('.chatsearch').val('');
        self.ele.find('.defaultview').show()
        self.ele.find('.searchview').hide()
    }
    this.showChats=function(){
        if(self.chats){
            return self.hideMenus();
        }
        self.hideMenus();
        $('#webcover').show();
        self.ele.find('.chats').show();
        self.chats=new modules.chats({
            ele:self.ele.find('.chatspage'),
            identity:app.home.getIdentity(),
            onClick:function(chat){
                self.hideChats();
                //show web chat for
                if(chat.thread){
                    modules.viewdelegate.register('page',$.extend(true,{},{
                        id:chat.page,
                        data:chat.page_info,
                        state:'/threads/'+chat.id
                    }));
                }else{
                    app.home.chatmanager.add(chat);
                }
            }
        });
        self.chats.show();
    }
    this.hideChats=function(){
        if(self.chats) self.chats.destroy();
        delete self.chats;
        self.ele.find('.chats').hide();
        $('#webcover').hide();
    }
    this.hideMenus=function(){
        if(self.notifications) self.hideNotifications()
        if(self.chats) self.hideChats();
        if(self.onboardstatus) self.onboardstatus.hideOnboardStatus()
    }
    this.hideNotifications=function(){
        if(self.notifications) self.notifications.destroy();
        delete self.notifications;
        self.ele.find('.notifications').hide();
        $('#webcover').hide();
    }
    this.showNotifications=function(){
        if(self.notifications){
            return self.hideMenus();
        }
        self.hideMenus();
        $('#webcover').show();
        self.ele.find('.notifications').show();
        self.notifications=new modules.notifications({
            ele:self.ele.find('.notificationpage'),
            identity:app.home.getIdentity(),
            onClick:function(){
                self.hideNotifications();
            }
        });
        self.notifications.show();
    }
    this.ensureBack=function(){
        if(app.home.manager.views.current){
            self.ele.addClass('cangoback');
        }else{
            self.ele.removeClass('cangoback');
        }
    }
    this.focus=function(){
        app.home.hideContextMenu();
        self.search.show();
    }
    this.search={
        incriment:function(dir){
            if(dir=='+'){
                self.search.searchIndex++;
            }
            if(dir=='-'){
                self.search.searchIndex--;
            }
            if(self.search.current){
               // return false;
                var current=self.search.resp.data.list[self.search.resp.data.order[self.search.searchIndex-1]];
                var tclass='searchitem';
                var key='id';
                var idkey='oid';
            }else{
                var current=self.search.infinitescroller.getByIndex(self.search.searchIndex-1);
                var tclass='historyitem';
                var key='_id';
                var idkey='oid';
            }
            //var current=self.resp.data.list[self.resp.data.order[self.searchIndex-1]];
            var sel=self.options.resultsEle;
            sel.find('.'+tclass).removeClass('hovering');
            if(current){
                sel.find('[data-'+idkey+'='+current[key]+']').addClass('hovering')
            }
        },
        select:function(){
            if(self.search.current){
                var current=self.search.resp.data.list[self.search.resp.data.order[self.search.searchIndex-1]];
                var tclass='searchitem';
                var key='id';
            }else{
                var current=self.search.infinitescroller.getByIndex(self.search.searchIndex-1);
                var tclass='historyitem';
                var key='_id';
            }
            var sel=self.options.resultsEle;
            if(current){
                sel.find('[data-oid='+current[key]+']').stap();
            }
        },
        exit:function(){
            var ele=self.ele;
            ele.find('.webheader').find('.x_cancelsearch').hide()
            if(options.onExit) return options.onExit();
            setTimeout(function(){
                self.search.opts={};
                ele.find('.searchinput').val('');
                modules.keyboard_global.hide(ele.find('.searchinput'));
                ele.removeClass('showsearch');
                self.search.close();
            },20)
        },
        clear:function(){
            if(self.search.opts){
                self.search.exit();
            }else{
                var ele=self.ele;
                ele.find('.searchinput').val('');
                self.search.keyup('',1);
                setTimeout(function(){
                    ele.find('.searchinput').focus();
                },50)
            }
        },
        close:function(){
            $('body').removeClass('searchshowing')
            //$('#mainapppages').show();
            self.options.resultsEle.html('')
            modules.keyboard_global.hide();
            self.search.current='';
            self.ele.find('.searchinput').val('')
            self.options.resultsPage.hide();
            self.search.showing=false;
        },
        opts:{},
        keyup:function(val,force){
            if(val!=self.search.current||force){
                self.search.current=val;
                if(app.currentModule&&app.currentModule.search){
                    app.currentModule.search(val);
                }else{
                    if(val==''||!val){
                        if(!self.search.opts.noHistory){
                            self.search.renderHistory(self.options.resultsEle);
                        }
                    }else{
                        if(!self.search.filter) self.search.filter='all';
                        if(self.options.resultsEle.find('.resultslist').length){
                            _ui.pageloader.render({theme:false,themeClass:'lds-ellipsis-black'},self.options.resultsEle.find('.resultslist'),1);
                        }else{
                            _ui.pageloader.render({theme:false,themeClass:'lds-ellipsis-black'},self.options.resultsEle,1);
                        }
                        if(self.search.filter=='all'){
                            var endpoint=app.apiurl2+'/search/aggregate'
                            var opts={
                                search:val,
                                stats:1,
                                mutual:1,
                                info:1
                            }
                        }else if(self.search.filter=='users'){
                            var endpoint=app.apiurl2+'/search/aggregate'
                            var opts={
                                search:val,
                                filters:['people'],
                                stats:1,
                                mutual:1
                            }
                        }else if(self.search.filter=='pages'){
                            var endpoint=app.apiurl2+'/search/aggregate'
                            var opts={
                                search:val,
                                filters:['page'],
                                info:1
                            }
                        }else if(self.search.filter=='posts'){
                            var endpoint=app.apiurl2+'/search/aggregate'
                            var opts={
                                search:val,
                                filters:['post']
                            }
                        }else if(self.search.filter=='events'){
                            var endpoint=app.apiurl2+'/search/aggregate'
                            var opts={
                                search:val,
                                filters:['event'],
                                info:1
                            }
                        }else if(self.search.filter=='fundraisers'){
                            var endpoint=app.apiurl2+'/search/aggregate'
                            var opts={
                                search:val,
                                filters:['fundraiser'],
                                info:1
                            }
                        }else{
                            var endpoint=app.sapiurl+'/search/'+self.search.filter;
                            var opts={
                                search:val
                            }
                        }
                        var uid=Math.uuid(12);
                        if(app.isdev) console.time('Search Load Time ['+uid+']');
                        if(!app.user.profile){
                            self.options.resultsEle.render({
                                template:'header_public',
                                append:false
                            })
                        }else{
                            app.api({
                                url:endpoint,
                                data:opts,
                                type:'GET',
                                success:function(resp){
                                    self.cresptcurrent=val;
                                    if(app.isdev) console.timeEnd('Search Load Time ['+uid+']');
                                    self.search.renderResults(self.options.resultsEle,resp);
                                }
                            })
                        }
                    }
                }
            }
        },
        renderHistory:function(rele){
            //var self=this;
            var nav=[{
                _id:'all',
                name:'All History',
                selected:true
            },{
                _id:'post',
                name:'Posts'
            },{
                _id:'person',
                name:'People'
            },{
                _id:'event',
                name:'Events'
            },{
                _id:'fundraiser',
                name:'Fundraisers'
            },{
                _id:'page',
                name:'Pages'
            }]
            rele.render({
                template:'search_history',
                append:false,
                data:{
                    nav:nav
                },
                binding:function(ele){
                    self.search.hele=ele;
                    window._ui.register('historynav',{
                        onNavSelect:function(cur){
                            modules.keyboard_global.preventHide();
                            self.search.setHistoryScroller(cur);
                            //bing back focus
                            setTimeout(function(){
                                self.ele.find('.mainsearchinput').focus();
                            },100)
                        }
                    });
                    //infinitiscroller
                    self.search.setHistoryScroller('all');
                }
            });
        },
        setHistoryScroller:function(type){
            var self=this;
            if(self.infinitescroller) self.infinitescroller.destroy();
            if(type=='all'){
                var data={
                    success:true,
                    data:app.user.profile.history
                }
            }else{
                var data=false;
            }
            self.searchIndex=0;
            self.infinitescroller=new modules.infinitescroll({
                ele:self.hele.find('.content'),
                endpoint:app.sapiurl+'/user/loadhistory',
                loaderClass:'lds-ellipsis-black',
                loadData:data,
                offset:'200%',
                onInterval:{
                    time:3000,
                    callback:function(){
                    }
                },
                checkNextPage:true,
                opts:{
                    filter:type
                },
                max:10,
                template:'search_history_item',
                endOfList:' ',
                nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>No History Yet.</div></div>',
                onPageReady:function(ele){
                    ele.find('.historyitem').stap(function(){
                        var item=self.infinitescroller.getById($(this).attr('data-oid'));
                        var data=item.object.data;
                        data.type=item.object.type;
                        self.handleClick(data);
                    },1,'tapactive')
                },
                scrollBindings:{
                    scrollStart:function(){
                        modules.keyboard_global.hide();
                    },
                    scroll:function(obj){
                    }
                }
            });
        },
        handleClick:function(item){
            if(item.type){
                //close serach
                var exit=1;
                switch(item.type){
                    case 'person':
                    case 'people':
                        //app.setApp('profile',item);
                        modules.viewdelegate.register('profile',{
                            id:item.id,
                            metadata:item,
                            data:item
                        })
                    break;
                    case 'post':
                        //app.setApp('profile',item);
                        modules.viewdelegate.register('post',{
                            id:item.id,
                            metadata:item,
                            load:true,
                            data:item
                        })
                    break;
                    case 'page':
                        //app.setApp('profile',item);
                        modules.viewdelegate.register('page',{
                            id:item.id,
                            metadata:item,
                            data:item
                        })
                    break;
                    case 'event':
                        modules.viewdelegate.register('event',{
                            id:item.id,
                            metadata:item,
                            data:item
                        })
                    break;
                    case 'fundraiser':
                        modules.viewdelegate.register('fundraiser',{
                            id:item.id,
                            metadata:item,
                            data:item
                        })
                    break;
                    case 'group':
                        app.setGroup(item.id);
                    break;
                    case 'tags':
                        exit=0;
                        //get current text and replace last string
                        var tp=self.cresptcurrent.split(' ');
                        tp[tp.length-1]='#'+item.id;
                        var c=tp.join(' ')+' ';
                        self.ele.find('.mainsearchinput').val(c);
                        self.search.keyup(self.ele.find('.mainsearchinput').val(),1);
                        //refocus
                        self.ele.find('.mainsearchinput').focus();
                    break;
                    default:
                        _alert('not configured')
                    break;
                }
                if(exit) self.search.exit();
            }else{
                
            }
        },
        updateHistory:function(data){
            app.user.profile.history=data;
        },
        setHistory:function(type,id,weight,weight_only){
            var self=this;
            if(!weight){
                console.warn('invalid Weight ['+weight_type+']!');
            }
            app.api({
                url:app.sapiurl+'/user/sethistory',
                data:{
                    type:type,
                    id:id,
                    weight:(weight)?weight:'',
                    weight_only:(weight_only)?weight_only:''
                },
                success:function(resp){
                    if(resp.success&&resp.data){//will also do websocket
                        app.user.profile.history=resp.data;
                    }
                }
            }) 
        },
        renderResults:function(rele,resp){
            //add in 
            var self=this;
            self.searchIndex=0;
            var order=['all','users','events','pages','posts','bookmarks'];
            var data={
                all:{
                    _id:'all',
                    name:'All'
                },
                users:{
                    _id:'users',
                    name:'People'
                },
                events:{
                    _id:'events',
                    name:'Events'
                },
                posts:{
                    _id:'posts',
                    name:'Posts'
                },
                tags:{
                    _id:'tags',
                    name:'Tags'
                },
                pages:{
                    _id:'pages',
                    name:'Pages'
                },
                bookmarks:{
                    _id:'bookmarks',
                    name:'Bookmarks'
                }
            }
            if(self.opts&&self.opts.page){
                var nl=order.splice(order.indexOf(self.opts.page),1);
                order.unshift(self.opts.page);
            }
            resp.header=[];
            $.each(order,function(i,v){
                resp.header.push(data[v]);
            })
            resp.filter=self.filter;
            if(!resp.filter) self.filter=resp.filter=resp.header[0]._id;
            $.each(resp.header,function(i,v){
                if(v._id==self.filter) resp.header[i].selected=true;
            })
            self.resp=resp;
            rele.render({
                template:(self.filter=='all')?'search_results_all':'search_results',
                data:resp,
                append:false,
                binding:function(ele){
                    var scroller=new modules.scroller(ele);
                    window._ui.register('searchnav',{
                        onNavSelect:function(cur,ele){
                            self.filter=cur;
                            modules.keyboard_global.preventHide();
                            self.keyup(self.current,1);
                        }
                    })   
                    // if(self.filter=='posts'){
                    //     modules.feed_global.bindPosts(ele,{
                    //         scroller:scroller,
                    //         self:self,
                    //         getPost:function(id){
                    //             if(!id) return false;
                    //             return resp.data.list[id];
                    //         },
                    //         setPost:function(id,current){
                    //            resp.data.list[id]=current;
                    //         }
                    //     });//bind all posts in that page!
                    // }
                    ele.find('.x_arefriends').stap(function(e){
                        phi.stop(e);
                        var item=resp.data.list[$(this).attr('data-id')];
                        var fr=new modules.permissions($.extend(true,{},item,{current:true,onSuccess:function(){
                            te.removeClass('icon-add-clean x_toaddfriend').addClass('icon-hourglass');
                            te.addClass('sent');
                        }}));
                        fr.show();
                    },1,'tapactive')
                    ele.find('.x_toaddfriend').stap(function(e){
                        var te=$(this);
                        if(te.hasClass('sent')) return true;//allow bubble
                        phi.stop(e);
                        var item=resp.data.list[$(this).attr('data-id')];
                        var fr=new modules.permissions($.extend(true,{},item,{onSuccess:function(){
                            te.removeClass('icon-add-clean x_toaddfriend').addClass('icon-hourglass');
                            te.addClass('sent');
                        }}));
                        fr.show();
                    },1,'tapactive');
                    ele.find('.searchitem').stap(function(){
                        var item=resp.data.list[$(this).attr('data-id')];
                        if(item._type) item.type=item._type;
                        self.handleClick(item);
                    },1,'tapactive')
                    new modules.scroller(ele,{},{
                        scrollStart:function(){
                            modules.keyboard_global.hide();
                        }
                    });
                }
            });
        },
        onWebShow:function(){
            ele.find('.webheader').find('.x_cancelsearch').show();
        },
        show:function(opts){
            if(self.search.showing) return false;
            self.hideMenus();
            self.ele.addClass('showsearch');
            var setval='';
            if(opts){
                self.search.opts=opts;
                setval=opts.value;
                self.ele.find('.mainsearchinput').val(setval)
                if(!options.onExit) self.ele.find('.mainsearchinput').focus();
                self.search.filter=opts.page;
            }else{
                self.search.opts={};
                self.search.filter='all';
            }
            //if(!options.onExit) $('#mainapppages').hide();
            $('body').addClass('searchshowing')
            self.options.resultsPage.show();
            self.search.showing=true;
            self.search.keyup((setval)?setval:'',1);
            // if(!opts&&app.currentModule&&app.currentModule.search){

            // }else{
            //     //self[app.currentScope.page].search.onKeyUp(self.options.resultsEle,'');
            //     self.search.keyup((setval)?setval:'',1);
            // }
        }
    }
    this.destroy=function(){
        delete self;
    }
    self.init();
}