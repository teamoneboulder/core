if(!window.modules) window.modules={};
modules.chat_attachment_global={
    render:function(data,preview,container){
        var attachment=data.attachment;
        if(!attachment.preview){//could be passed directly
            if(preview) attachment.preview=true;
            else attachment.preview=false;
        }
        attachment.container=container;
        if(attachment.data){
            switch(attachment.type){
                case 'event':
                    return $.fn.render({template:'chat_attachment_event',data:{data:data},returntemplate:true});
                break;
                case 'page':
                    return $.fn.render({template:'chat_attachment_page',data:{data:data},returntemplate:true});
                break;
                case 'service_offering_request':
                    return $.fn.render({template:'chat_attachment_service_offering_request',data:{data:data},returntemplate:true});
                break;
                default:
                    return 'invalid_attachment_type';
                break;
            }
        }else{
            console.warn('attachment not found')
        }
    },
    bind:function(ele){

    }
}
modules.comment_global={
    viewUser:function(context){
        phi.registerView('profile',{
            renderTo:(_.isWebLayout())?$('#pages')[0]:$('#wrapper')[0],
            data:context.store.resp.data.from.data
        });
    },
    bind:function(ele,context){
        ele.find('.textarea_highlight_feed').stap(function(){
            modules.textarea_global.onClick($(this));
        },1,'tapactive');
        // $.each(ele.find('.nectar_comment_reactions'),function(i,v){
        //     new modules.nectarfeedback({
        //         ele:$(v),
        //         scroller:context.scroller.getScroller(),
        //         onMobileMenuShow:function(){
        //         },
        //         onMobileMenuHide:function(){
        //         },
        //         onChange:function(id,value){
        //             // self.setCommentReaction({
        //             //     id:id,
        //             //     v:value
        //             // })
        //         }
        //     })
        // })
        ele.find('.postimg').stap(function(){
            var comment=context.keyboard.infinitescroll.getById($(this).attr('data-id'));
            new modules.imageviewer({
                ele:$(this),
                index:parseInt($(this).attr('data-index'),10),
                data:comment.media.data
            })
        },1,'tapactive')
        ele.find('.x_more').stap(function(e){
            phi.stop(e)
            var item=context.keyboard.infinitescroll.getById($(this).attr('data-id'));
            //console.log(item,$(this),context)
            modules.comment_global.showMoreComment(item,$(this),context);
        },1,'tapactive')
        ele.find('.x_viewprofile').stap(function(){
            //register profile view!!!
            var item=context.keyboard.infinitescroll.getById($(this).attr('data-id'));
            if($(this).attr('data-reply')){
                phi.registerView('profile',{
                    renderTo:$('#wrapper')[0],
                    data:item.reply.user
                });
            }else{
                phi.registerView('profile',{
                    renderTo:$('#wrapper')[0],
                    data:item.user
                });
            }
        },1,'tapactive');
        ele.find('.linknav').stap(function(){
            _.openLink({
                intent:_.wrapExternalLink($(this).attr('data-intent')),
                type:'external'
            })
        },1,'tapactive');
        ele.find('.x_replyto').stap(function(e){
            phi.stop(e);
            var item=context.keyboard.infinitescroll.getById($(this).attr('data-id'));
            modules.comment_global.replyTo(item,context);
        },1,'tapactive')
    },
    showMoreComment:function(comment,ele,context){
        var self=this;
        var menu=[]
        if(app.user.profile.id==comment.by){
            menu.push({
                id:'delete',
                name:'Delete this comment',
                icon:'icon-trash-empty'
            })
            menu.push({
                id:'edit',
                name:'Edit this comment',
                icon:'icon-cog'
            })
            if(app.isdev){
               menu.push({
                    id:'report',
                    name:'Report this comment',
                    icon:'icon-megaphone'
                })  
            }
        }else{
            menu.push({
                id:'report',
                name:'Report this comment',
                icon:'icon-megaphone'
            })
            if(app.user.profile.admin){
                menu.push({
                    id:'delete',
                    name:'Delete this comment',
                    icon:'icon-trash-empty'
                })
            }
        }
        var alert=new modules.mobilealert({
            display:{
                ele:ele,
                container:context.ele.find('.scroller')
            },
            menu:menu,
            onSelect:function(id){
            },
            onEndAnimationSelect:function(id){
                if(id=='report'){
                    var report=new modules.report({
                        type:'chat',
                        id:comment._id,
                        context:(context.getPageInfo)?context.getPageInfo():false,
                        data:comment
                    })
                    report.show();
                }
                if(id=='delete'){
                    if(_.isWebLayout()){
                        var alert2=new modules.alertdelegate({
                            display:{
                                alert:1,
                                content:'Are you sure you want to delete this comment?'
                            },
                            menu:[{
                                id:'yes',
                                name:'Yes, delete comment',
                                icon:'icon-trash-empty'
                            },{
                                id:'no',
                                name:'No, keep comment',
                                icon:'icon-down-open'
                            }],
                            onSelect:function(id){
                                if(id=='no'){
                                    alert2.hide();
                                }else{
                                    modules.comment_global.deleteComment(comment,context);
                                }
                            }
                        });
                        alert2.show();
                    }else{
                        var alert2=new modules.mobilealert({
                            menu:[{
                                id:'yes',
                                name:'Yes, delete comment',
                                icon:'icon-trash-empty'
                            },{
                                id:'no',
                                name:'No, keep comment',
                                icon:'icon-down-open'
                            }],
                            onSelect:function(id){
                                if(id=='no'){
                                    alert2.hide();
                                }else{
                                    modules.comment_global.deleteComment(comment,context);
                                }
                            }
                        });
                        alert2.show();
                    }
                }
                if(id=='edit'){
                    self.editComment(comment,context);
                }
            }
        });
        alert.show();
    },
    deleteComment:function(comment,context){
        modules.api({
            url:app.sapiurl+'/module/feed/deletecomment',
            data:{
               id:comment._id 
            },
            timeout:5000,
            retry:5,
            callback:function(resp){
                if(resp.success){
                    if(comment.children){
                        context.ele.find('[data-parent='+comment._id+']').find('.content').html('[Deleted]');
                    }else{
                        context.keyboard.infinitescroll.remove(comment);
                    }
                    modules.toast({
                        icon:'icon-thumbs-up',
                        content:'Successfully removed comment'
                    })
                }else{
                    modules.toast({
                        icon:'icon-warning-sign',
                        content:'Error deleting comment: '+resp.error
                    })
                }
            }
        });
    },
    editComment:function(comment,context){
        //put text into keyboard
        context.keyboard.edit(comment);
    },
    replyTo:function(item,context){
        context.keyboard.replyTo(item);
    }
}
modules.chat_global={
    onDeletedChat:function(identity,chat){
        $('body').alert({
            closer:false,
            content:'<div style="padding:20px;font-size:16px">This user has chosen to delete their account so this chat is not available</div>'
        });//clear notification count!
        if(!chat.last||!chat.last._id){
            console.warn('cant clear');
            onerror('cant clear onDeletedChat: '+identity.id+' '+chat.id);
            return false;
        }
        app.api({
            url:app.sapiurl+'/module/chat/setread',
            data:{
                id:identity.id+'_'+chat.id,
                last:chat.last._id,
                room:chat.id,
                identity:identity.id
            },
            retry:5,
            success:function(resp){
            }
        });
    },
    renderComment:function(post){
        if(post.media.type&&post.media.data){//could be id...
            var tpl='';
            switch(post.media.type){
                case 'drive':
                    tpl=modules.drive_preview.render($.extend(true,{},{post:true,postid:post.id},post.media.data));
                break;
                case 'video':
                    tpl=modules.video_preview.render($.extend(true,{},{post:true,postid:post.id},post.media.data));
                break;
                case 'images':
                    tpl=$.fn.render({template:'comment_imagemedia',data:post,returntemplate:true});
                break;
                case 'link':
                    tpl=modules.links_global.render($.extend(true,{},{post:true,postid:post.id,small:true},post.media.data));
                break;
            }
            return tpl;
        }else{
            //clear
            return '';
        }
    },
    bindItems:function(ele,keyboard,attachment_only){
        if(isPhoneGap()){
            ele.find('.chatrow').stap(function(){
                if(modules.prefs.get('chattimes')){
                    keyboard.getScroller().removeClass('showtimes');
                    modules.prefs.set('chattimes',0);
                }else{
                    keyboard.getScroller().addClass('showtimes');
                    modules.prefs.set('chattimes',1);
                }
            },1,'tapactive',function(e){
                
                var item=keyboard.infinitescroll.getById($(this).attr('data-id'));
                var alert=new modules.mobilealert({
                    menu:[{
                        id:'copy',
                        name:'Copy Text',
                        icon:'icon-hero'
                    }],
                    onSelect:function(id){
                        switch(id){
                            case 'copy':
                                var clipboard=new ClipboardJS('.x_copy',{
                                    text: function(trigger) {
                                        return item.content;
                                    }
                                });
                                clipboard.on('success', function(e) {
                                    modules.toast({
                                        icon:'icon-thumbs-up',
                                        content:'Successfully Copied to Clipboard'
                                    })
                                })
                                clipboard.onClick(e);
                                clipboard.destroy();
                            break;
                        }
                    }
                });
                alert.show();
            })
        }
        ele.find('.x_reply').stap(function(e){
            phi.stop(e);
            var item=keyboard.infinitescroll.getById($(this).attr('data-chatid'));
            keyboard.replyTo(item);
            $(this).parents('.chatcontentarea').first().removeClass('chattoolsshowing')
        },1,'tapactive');
        ele.find('.chat_other').stap(function(e){
            phi.stop(e)
            $(this).parents('.chatcontentarea').first().toggleClass('chattoolsshowing')
        },1,'tapactive')
        ele.find('.x_viewattachment').stap(function(e){
            if(keyboard.getPost&&keyboard.getPost()){
                var item=keyboard.getPost();
            }else{
                if($(this).attr('data-id')){
                    var item=keyboard.infinitescroll.getById($(this).attr('data-id'));
                }else{
                    var p=$(this).parents('.chatrow').first();
                    var item=keyboard.infinitescroll.getById(p.attr('data-id'));
                }
            }
            switch(item.attachment.type){
                case 'post':
                    var post_id=item.attachment.data.id;
                    modules.viewdelegate.register('post',{
                        id:post_id,
                        load:true,
                        data:{
                            id:post_id
                        }
                    })
                break;
                case 'event':
                    var post_id=item.attachment.data.id;
                    modules.viewdelegate.register('event',{
                        id:post_id,
                        data:{
                            id:post_id
                        }
                    })
                break;
                case 'page':
                    var post_id=item.attachment.data.id;
                    modules.viewdelegate.register('page',{
                        id:post_id,
                        data:{
                            id:post_id
                        }
                    })
                break;
                case 'connection':
                    var post_id=item.attachment.data.id;
                    modules.viewdelegate.register('connection',{
                        id:post_id,
                        load:true,
                        data:{
                            id:post_id
                        }
                    })
                break;
            }
        },1,'tapactive')
        ele.find('.x_stopbubble').on('touchend',function(e){
            var that=this;
            app.bubbleTap(that);
        });
        ele.find('.x_rsvp').stap(function(e){
            var p=$(this).parents('.chatrow').first();
            var type=$(this).attr('data-rsvp');
            var event=$(this).attr('data-eventrsvp');
            if($(this).hasClass('selected')) type='clear';
            modules.chat_global.rsvp(event,type,function(success){
                if(success){
                    $('[data-eventrsvp='+event+']').removeClass('selected');
                    if(type!='clear') $('[data-eventrsvp='+event+'][data-rsvp='+type+']').addClass('selected');
                }
            })
        },1,'tapactive');
        // ele.find('.x_viewpost').stap(function(){
        //     var p=$(this).parents('.chatrow').first();
        //     var item=keyboard.infinitescroll.getById(p.attr('data-id'));
        //     var post_id=item.post.id;
        //     modules.viewdelegate.register('post',{
        //         id:post_id,
        //         load:true,
        //         data:{
        //             id:post_id
        //         }
        //     })
        // },1,'tapactive')
        if(!attachment_only){
            ele.find('.readmore').stap(function(e){
                var p=$(this).parents('.wrappedcontent').first();
                p.addClass('showtext')
                phi.stop(e)
            },1,'tapactive');
            ele.find('.showless').stap(function(e){
                var p=$(this).parents('.wrappedcontent').first();
                p.removeClass('showtext')
                phi.stop(e)
            },1,'tapactive');
            ele.find('.chatitem').stap(function(){
                if(!isPhoneGap()){
                    // var p=$(this).parents('.chatrow').first();
                    // var item=keyboard.infinitescroll.getById(p.attr('data-id'));
                    // keyboard.highlightItem(item)
                }
            },1,'tapactive',function(){
                // if(isPhoneGap()||isMobile){
                //     var p=$(this).parents('.chatrow').first();
                //     var item=keyboard.infinitescroll.getById(p.attr('data-id'));
                //     keyboard.highlightItem(item)
                // }
            })
            ele.find('.linknav').stap(function(e){
                phi.stop(e);
                modules.links_global.view($(this).attr('data-intent'))
            },1,'tapactive',function(e){
                phi.stop(e);
            });
            ele.find('.feedimg').stap(function(){
                var p=$(this).parents('.chatrow').first();
                var item=keyboard.infinitescroll.getById(p.attr('data-id'));
                if(item.attachment&&item.attachment.data) item=item.attachment.data;
                keyboard.infinitescroll.disable();
                if(item.media&&item.media.data){
                    new modules.imageviewer({
                        ele:$(this),
                        index:parseInt($(this).attr('data-index'),10),
                        data:item.media.data,
                        onClose:function(){
                            keyboard.infinitescroll.enable();
                        }
                    })
                }else{
                    onerror('Error .feedimg chat_global ['+p.attr('data-id')+']');
                }
            },1,'tapactive');
            //bind videos
            ele.find('.videoitem').each(function(){
                var t=$(this);
                var autoplay=false;
                //modules.video_preview.bind(t.find('video'))
                //var v=videojs(t.find('.video-js')[0],{muted:true});
                var video=new modules.video_player({
                    ele:t.find('.videoplayer')
                })
                var id=t.attr('data-id');
                // if(!opts.self.videos) opts.self.videos={};
                // //add waypoints!
                // opts.self.videos[id]={
                //     video:new modules.video_player({
                //         ele:t.find('.videoplayer')
                //     })
                // }
            });
            ele.find('.audioitem').each(function(){
                var item=keyboard.infinitescroll.getById($(this).attr('data-contentid'));
                if(!item||!item.media||!item.media.data) return false;
                //bind each player!
                var player=new Player($(this).find('.audiobox'),[{
                    file:modules.tools.getFile(item.media.data,'full'),
                    format:item.media.data.ext,
                    title:'',
                    howl: null
                  }])
                keyboard.audio_players.push(player);
                player.load();
            })
        }
    },
    getValidPeople:function(data){
        var out={
            order:[],
            list:{}
        }
        $.each(data.people,function(i,v){
            if(data.people_list&&data.people_list[v]){
                out.order.push(v);
                out.list[v]=data.people_list[v];
            }
        })
        if(data.people_list&&data.people_list[app.user.profile.id]){
            out.list[app.user.profile.id]=data.people_list[app.user.profile.id]
        }
        return out;
    },
    rsvp:function(id,type,cb){
        modules.api({
            url:app.sapiurl+'/module/event/'+id+'/rsvp',
            data:{
                rsvp:type
            },
            key:'event_interested',
            timeout:5000,
            callback:function(resp){
                if(resp.success){
                    cb(true)
                }else{
                    modules.toast({
                        content:'Error saving: '+resp.error
                    })
                    cb(false);
                }
            }
        });
    },
    render:function(post,aspost,container){
        if(post.media&&post.media.type&&post.media.data){//could be id...
            var tpl='';
            switch(post.media.type){
                case 'drive':
                    var d=$.extend(true,{},{feed:true},post.media.data);
                    if(aspost) d.inlinepost=true;
                    tpl=modules.drive_preview.render(d);
                break;
                case 'video':
                    var d=$.extend(true,{},{feed:true},post.media.data);
                    if(aspost) d.inlinepost=true;
                    if(!d.size) d.size={};
                    d.size.container=container;
                    tpl=modules.video_preview.render(d);
                break;
                case 'audio':
                    var d=$.extend(true,{},{feed:true},post.media.data);
                    if(aspost) d.inlinepost=true;
                    if(!d.size) d.size={};
                    d.size.container=container;
                    d.id=post._id;
                    tpl=modules.audio_preview.render(d);
                break;
                case 'images':
                    var d=$.extend(true,{},{chat:true},post.media)
                    if(aspost) d.inlinepost=true;
                    d.data.container=container;
                    tpl=$.fn.render({template:'keyboard_imagemedia',data:d,returntemplate:true});
                break;
                case 'link':
                    var d=$.extend(true,{},{feed:false},post.media.data);
                    if(aspost) d.inlinepost=true;
                    tpl=modules.links_global.render(d,container);
                break;
            }
            return tpl;
        }else if(post.post){
            return $.fn.render({template:'chat_post_preview',data:{data:$.extend(true,{},post.post,{_id:post.post._id['$oid']})},returntemplate:true});
        }else{
            //clear
            return '';
        }
    }
}
modules.keyboard_global={
	//debug
	debug:1,
    hasWebKeyboard:function(){
        return false;
        return app.isdev;
    },
    showWebKeyboard:function(){
        var self=this;
        if(!self.hasWebKeyboard()) return false;
        if(self.webkeyboard) self.webkeyboard.remove();
        $('body').render({
            template:'keyboard_web',
            binding:function(ele){
                //show it!
                self.webkeyboard=ele;
                ele.find('.x_close').stap(function(){
                    self.hideWebKeyboard();
                },1,'tapactive')
                var h=ele.find('.keyboard').outerHeight();
                TweenLite.set(ele.find('.keyboard'),{y:h});
                self.keyboardHeight=modules.keyboard_global.getKeyboardHeight(h);
                self.events.keyboardWillShow({keyboardHeight:h});
                setTimeout(function(){
                    TweenLite.to(ele.find('.keyboard'),.2,{y:0,onComplete:function(){
                        self.events.keyboardDidShow({keyboardHeight:h});
                    }});
                },20)
            }
        })
    },
    hideWebKeyboard:function(){
        var self=this;
        if(!self.hasWebKeyboard()) return false;
        if(self.webkeyboard){
            var h=self.webkeyboard.find('.keyboard').outerHeight();
            self.events.keyboardWillHide()
            TweenLite.to(self.webkeyboard.find('.keyboard'),.2,{y:h,onComplete:function(){
                self.webkeyboard.remove();
                delete self.webkeyboard;
                self.events.keyboardDidHide()
            }})
        }
    },
	log:function(msg){
		if(this.debug) modules.tools.log('KEYBOARD: '+msg,'keyboard');
	},
	//Global events for keyboard
	onKeyboardDidShow:false,
	onKeyboardWillShow:false,
	onKeyboardDidHide:false,
	onKeyboardWillHide:false,
    oneTimeKeyboardOnHide:false,
    oneTimeKeyboardOnShow:false,
	oneTimeKeyboardWillShow:false,
    overrides:false,
    events:{
        keyboardWillShow:function(e){
            var self=modules.keyboard_global;
            self.log('keyboardWillShow');
            if(self.overrides){
                self.keyboardHeight=modules.keyboard_global.getKeyboardHeight(e.keyboardHeight);
                if(self.overrides.onKeyboardWillShow){
                    self.throttleEvent('will',function(){
                        self.log('onKeyboardWillShow')
                        self.overrides.onKeyboardWillShow(self.keyboardHeight);
                    })
                }
            }else{
                self.keyboardHeight=modules.keyboard_global.getKeyboardHeight(e.keyboardHeight);
                if(self.oneTimeKeyboardWillShow){
                    self.oneTimeKeyboardWillShow(self.keyboardHeight);
                    self.oneTimeKeyboardWillShow=false;
                }
                if(self.onKeyboardWillShow){
                    self.throttleEvent('will',function(){
                        self.log('onKeyboardWillShow')
                        self.onKeyboardWillShow(self.keyboardHeight);
                    })
                }
            }
            phi.onKeyboardWillShow();
        },
        keyboardDidShow:function(e){
            var self=modules.keyboard_global;
            self.log('keyboardDidShow')
            if(self.overrides){
                self.keyboardHeight=modules.keyboard_global.getKeyboardHeight(e.keyboardHeight);
                if(self.overrides.onKeyboardDidShow){
                    self.throttleEvent('did',function(){
                        self.log('onKeyboardDidShow')
                        self.overrides.onKeyboardDidShow(self.keyboardHeight);
                    })
                }
            }else{
                if(self.oneTimeKeyboardOnShow){
                    self.oneTimeKeyboardOnShow();
                    self.oneTimeKeyboardOnShow=false;
                }
                if(self.onKeyboardDidShow) self.throttleEvent('did',function(){
                    self.log('onKeyboardDidShow')
                    self.onKeyboardDidShow(modules.keyboard_global.getKeyboardHeight(e.keyboardHeight));
                })
            }
            phi.onKeyboardDidShow();
        },
        keyboardWillHide:function(){
            var self=modules.keyboard_global;
            self.log('keyboardWillHide')
            self.keyboardHeight=0;
            if(self.overrides){
                if(self.overrides.onKeyboardWillHide){
                    self.throttleEvent('will',function(){
                        self.log('onKeyboardWillHide')
                        self.overrides.onKeyboardWillHide(self.keyboardHeight);
                    })
                }
            }else{
                if(self.oneTimeKeyboardWillHide){
                    self.oneTimeKeyboardWillHide();
                    self.oneTimeKeyboardWillHide=false;
                }
                if(self.onKeyboardWillHide) self.throttleEvent('will',function(){
                    self.log('onKeyboardWillHide')
                    self.onKeyboardWillHide();
                })
            }
            phi.onKeyboardWillHide();
        },
        keyboardDidHide:function(){
            var self=modules.keyboard_global;
            self.log('keyboardDidHide')
            self.hiding=0;
            self.keyboardHeight=0;
            if(self.overrides){
                if(self.overrides.onKeyboardDidHide){
                    self.throttleEvent('did',function(){
                        self.log('onKeyboardDidHide')
                        self.overrides.onKeyboardDidHide(self.keyboardHeight);
                    })
                }
            }else{
                if(self.oneTimeKeyboardOnHide){
                    self.oneTimeKeyboardOnHide();
                    self.oneTimeKeyboardOnHide=false;
                }
                if(self.onKeyboardDidHide) self.throttleEvent('did',function(){
                    self.onKeyboardDidHide();
                })
            }
            phi.onKeyboardDidHide();
        }
    },
    //collapsing:true,
    trackKeyboardHeight:function(stop){
        var self=this;
        if(!stop){
            self.animationframe=requestAnimationFrame(function(ts){
                self.setKeyboardHeight();
            });
        }else{
            $('body').css({maxHeight:'100%'});
            if(self.animationframe){
                cancelAnimationFrame(self.animationframe);
            }
        }
    },
    setKeyboardHeight:function(){
        var self=this;
        var ch=document.documentElement.clientHeight;
        var diff=window.screen.height-document.documentElement.clientHeight;
        self.trackKeyboardHeight();
    },
	init:function(){
		var self=this;
        self.keyboardHeight=0;
        if(self.getVersion()=='UI'){
            window.Keyboard=window.cordova.plugins.Keyboard;
            Keyboard.disableScroll(true);
            window.addEventListener('native.keyboardshow', function(e){
                $('body,html').css({height:window.screen.height});
                if(self.collapsing){
                    $('body').css({height:window.screen.height,maxHeight:''});
                    self.trackKeyboardHeight();
                }
                self.events.keyboardWillShow(e);
            });
            window.addEventListener('native.keyboardhide', function(){
                if(self.collapsing) self.trackKeyboardHeight(1);
                $('body,html').css({height:''});
                if(self.preventHiding) return false;
                self.events.keyboardWillHide();
            });
        }else{
            window.addEventListener('keyboardWillShow', function(e){
                if(self.collapsing){
                    $('body').css({height:window.screen.height,maxHeight:''});
                    self.trackKeyboardHeight();
                }
                self.events.keyboardWillShow(e);
            });
            window.addEventListener('keyboardDidShow', function(e){
                if(self.collapsing) self.trackKeyboardHeight(1);
               self.events.keyboardDidShow(e);
            });
            window.addEventListener('keyboardWillHide', function(){
                if(self.collapsing) self.trackKeyboardHeight(1);
                if(self.preventHiding){
                    //$('#ghostinput').focus();//keep focus on an element in mean time
                    return false;
                }
                self.events.keyboardWillHide();
            });
            window.addEventListener('keyboardDidHide', function(){
                if(self.collapsing) self.trackKeyboardHeight(1);
                if(self.preventHiding) return false;
                self.events.keyboardDidHide();
            });
        }
	},
    getVersion:function(){
        if(isPhoneGap()&&window.cordova.plugins.Keyboard){
            return 'UI';
        }else{
            return 'WK';
        }
    },
    getKeyboardHeight:function(h){
        if(phi.getMinimizedView()){
            h-=phi.getMinimizedView().height();//for the "become a player banner"
        }
        // if(phone.hasBottomNotch()){
        //     h-=20;
        // }
        return h;
    },
	clearBindings:function(){
		var self=this;
		self.onKeyboardDidShow=false;
		self.onKeyboardWillShow=false;
		self.onKeyboardDidHide=false;
		self.onKeyboardWillHide=false;
		self.oneTimeKeyboardOnHide=false;
	},
	timeouts:{},
	throttleEvent:function(key,cb){//use last fired keyboard event!
		var self=this;
        return cb();//prevent for now, fire immediately
		if(self.timeouts[key]) clearTimeout(self.timeouts[key]);
        self.timeouts[key]=setTimeout(function(){
            cb();
        },50)
	},
	showAccessoryBar:function(){
		if(isPhoneGap()&&Keyboard.hideFormAccessoryBar) Keyboard.hideFormAccessoryBar(false)
	},
	hideAccessoryBar:function(){
		if(isPhoneGap()&&Keyboard.hideFormAccessoryBar) Keyboard.hideFormAccessoryBar(true)
	},
    show:function(){
        if(isPhoneGap()){
            Keyboard.show();//really ensure it shows
        }
    },
    preventHide:function(){
        var self=this;
        self.log('preventHide')
        self.preventHiding=true;
        if(self.clearTimeout) clearTimeout(self.clearTimeout);
        self.clearTimeout=setTimeout(function(){
            self.preventHiding=false;
        },200);
    },
    clearPreventHide:function(){
        var self=this;
        self.log('clearPreventHide')
        self.preventHiding=false;
        if(self.clearTimeout) clearTimeout(self.clearTimeout);
    },
	hide:function(ele,force){
		var self=this;
        if(force) self.clearPreventHide();
		self.log('Hide');
        if(self.preventHiding) return false;
		if(isMobile){
            if(isPhoneGap()){
                if(Keyboard.isVisible&&!self.hiding||self.getVersion()=='UI') {
                	self.hiding=1;
                    //$("#ghostinput").focus().blur();
                    if(document.activeElement) document.activeElement.blur();
                    if(Keyboard.hide) Keyboard.hide();//really ensure it closes
                    if(Keyboard.close) Keyboard.close();//really ensure it closes
                }
            }else{
                if(app.device=='Android'){
                    if(ele) ele.blur();
                }else{
                    if(ele&&ele.is(':focus')) $("#ghostinput").focus().blur();
                    else if(document.activeElement) document.activeElement.blur();
                }
            }
        }else{
            if(document.activeElement) document.activeElement.blur();
        }
        if(self.hasWebKeyboard()) modules.keyboard_global.hideWebKeyboard();
	}
}
modules.keyboard=function(options){
	var self=this;
	self.options=options;
    self.isVisible=1;
	var opts=options;
    self.messageTrace=false;
    //self.messageTrace=true;
	this.debug=1;
	this.hide=function(){
		modules.keyboard_global.hide();
	}
	this.log=function(msg,force){
    	if(self.debug||force){
            if(typeof msg == 'object') modules.tools.log('CHAT: '+JSON.stringify(msg),'keyboard');
            else modules.tools.log('CHAT: '+msg,'keyboard');
        }
    }
	this.stop=function(){
        if(self.active){//dont allow a double stop!
            self.log('STOP');
            var t=new Date().getTime()
            if(options.disableSockets){
                return false;//console.warn('Sockets Disabled')
            }else{
    		  app.user.stopSocket(self.options.room, self.onMessage);
            }
    		modules.keyboard_global.onKeyboardWillShow=false;
    		modules.keyboard_global.onKeyboardWillHide=false;
    		//reset keyboard position
    		self.onKeyboardWillHide(0);
            self.active=0;
        }
	}
	this.start=function(){
        if(!self.active){
            self.log('START');
            self.active=1;
            if(options.disableSockets){
                return false;
                //return console.warn('Sockets Disabled')
            }else{
    		  app.user.startSocket(self.options.room, self.onMessage);
            }
    		modules.keyboard_global.onKeyboardWillShow=function(height){
                if(phone.hasBottomNotch()){//adjust for bottom notch mode!
                    height-=20;
                }
                self.onKeyboardWillShow(height,.2);
                $('body').addClass('keyboardshowing');//[performance???]
            }
            modules.keyboard_global.onKeyboardWillHide=function(height){
                self.onKeyboardWillHide(.2);
                $('body').removeClass('keyboardshowing');
            }
            self.setHeight();
        }
	}
	this.onKeyboardWillShow=function(height,time){
        if(self.options.showDiff) height=height-self.options.showDiff;
		self.keyboardHeight=height;
        if(self.messageTrace) messageTrace('keyboard','onKeyboardWillShow ['+opts.room+']');
        var ch=self.getHeaderHeight();
        //if(!self.showTween){//must take te most recent
            if(self.showTween){
                self.showTween.kill();
                self.showTween=false;
            }
            self.showTween=TweenLite.to(opts.ele,time,{bottom:height+'px',onComplete:function(){
                self.showTween=false;
            }});
            //move up scroller position!
            if(opts.scrollele){
                var diff=height+ch;
                if(phone.hasBottomNotch()){
                    diff-=20;
                }
                TweenLite.set(opts.scrollele,{bottom:diff+'px',onComplete:function(){
                    opts.ele.toggleClass('force-redraw');
                    self.refreshScroller();
                    //if(self.options.showDiff) diff-=self.options.showDiff;
                    diff=diff-ch;
                    if(opts.keyboardOptions.adjustOnKeyboardShow) self.scrollBy(-diff);
                    // if(self.scrollToBottomOnKeyboardShow){
                    // 	_alert('here')
                    // 	self.scrollToBottom(0);
                    // 	self.scrollToBottomOnKeyboardShow=0;
                    // }
                }})
            }
            self.setAvailableHeight();
        //}
	}
    this.cacheMessage=function(clear){
        if(self.options.cache){
            if(clear){
                modules.exp_prefs.delete(self.options.room);
            }else{
                //if(app.isdev) console.log('cache message for room ['+self.options.room+']');
                modules.exp_prefs.set(self.options.room,{
                    message:self.getTextAreaValue()
                },self.options.cache.until);
            }
        }
    }
    this.setAvailableHeight=function(){
        var offset=self.getScroller().offset();
        var top=offset.top;
        var bottom=$('body').height()-self.keyboardHeight;
        var available=bottom-top;
        //add in height for
        //_alert(top+ ' '+bottom)
        available-=100;//give some extra space for search and original post
        if(self.newtextarea) self.newtextarea.setMaxHeight(available);
    }
	this.onKeyboardWillHide=function(time){
		self.keyboardHeight=0;
        var h=0;//default to bottom
        if(!app.inForeground) return false;//fixes issue with resuming!
        if(self.showTween){
            self.showTween.kill();//if the showing animation is triggered, and call is called
            self.showTween=false;//remove reference or next show may not work
        }
        if(self.messageTrace) messageTrace('keyboard','onKeyboardWillHide ['+opts.room+']');
        //if(self.options.showDiff) h=self.options.showDiff;
        TweenLite.to(opts.ele,time,{bottom:h+'px'});
        var ch=self.getHeaderHeight();
        if(self.getScroller()) TweenLite.to(self.getScroller(),time,{bottom:ch+'px',onComplete:function(){
            self.refreshScroller()
            opts.ele.toggleClass('force-redraw');
        }})
	}
    this.onShow=function(){
        self.isVisible=true;
        if(self.lastRead){
            self.setRead(self.lastRead);
            //scrolltobottom
            self.scrollToBottom(100);
            self.lastRead=false;
        }
    }
    this.onHide=function(){
        self.isVisible=false;
    }
    this.getIdentity=function(){
        if(self.currentCommentIdentity){
            //self.log('identity::'+JSON.stringify(self.currentCommentIdentity));
            return self.currentCommentIdentity;
        }else if(options.identity){
            //self.log('identity::'+JSON.stringify(options.identity))
            return options.identity;
        }else{
            //self.log('identity::',app.user.profile)
            return {
                id:app.user.profile.id,
                name:app.user.profile.name,
                pic:app.user.profile.pic
            }
        }
    }
    this.audio_players=[];
	this.onResume=function(){
		if(self.infinitescroll){
			self.infinitescroll.onResume(function(mostRecent){
                if(opts.readReceipts){
                    self.setRead(mostRecent,function(){
                        self.loadRead();
                    });
                    self.setReadReceipt(self.getIdentity().id,mostRecent);
                }
            });
		}
	}
	this.setHeight=function(setheight){
        if(!self.keyboardele) return false;
        var height=self.getHeaderHeight();
        var ch=parseInt(opts.ele.find('.keyboardheader').css('height'),10);
        if(!options.keyboardOptions||options.keyboardOptions.mode!='web_inline') opts.ele.find('.keyboardheader').css('height',height-20);
        //height=height+opts.ele.find('.keyboard_web_extra').outerHeight();
        var diff=height-ch;
        if(self.options.keyboardOptions&&self.options.keyboardOptions.mode=='picture'){
            height-=30;
        }
        if(window.Keyboard&&Keyboard.isVisible){
            if(opts.showDiff) height-=opts.showDiff;
        }
        if(!modules.keyboard_global.keyboardHeight) modules.keyboard_global.keyboardHeight=0;
        //set bottom of 
        if(opts.scrollele){
            var extraheight=0;
            //var extraheight=self.keyboardele.find('.morekeyboardview').outerHeight();
            //  if(options.keyboardOptions&&self.options.keyboardOptions.mode=='advanced'&&!isPhoneGap()){
            //     extraheight+=opts.ele.find('.keyboard_web_extra').outerHeight();
            // }
            if(modules.video_global&&modules.video_global.isUploading){
                extraheight+=30;
            }
            if(setheight){
                setheight=setheight+modules.keyboard_global.keyboardHeight+extraheight;
                //setheight-=40;
                diff=setheight;
                if(self.epicker) self.epicker.css('bottom',setheight+2);
                TweenLite.to(opts.scrollele,.3,{bottom:setheight,onComplete:function(){
                    if(diff){
                        self.scrollBy(-diff+height);
                    }
                	self.refreshScroller()
                }});
            }else{
                setheight=height=height+modules.keyboard_global.keyboardHeight+extraheight+10;
                //height-=40;
                var lastBottom=parseInt(opts.scrollele.css('bottom'),10);
                opts.scrollele.css('bottom',height);
                if(self.epicker) self.epicker.css('bottom',height+2);
                self.refreshScroller();
                var diff_new=height-lastBottom;
                if(diff_new&&self.heightLoaded){
                    self.scrollBy(-diff_new);
                }
                self.heightLoaded=1;
            }
        }
        if(!self.currentHeight||setheight!=self.currentHeight){
            //console.log('===========',opts)
            self.currentHeight=setheight;
            self.currentContentHeight=self.currentHeight-modules.keyboard_global.keyboardHeight;
            if(opts.onHeightUpdate) opts.onHeightUpdate();
            if(opts.context&&opts.context.setMenuBottom) opts.context.setMenuBottom();
        }
    }
    this.destroy=function(){
        self.stop();
        if(self.newtextarea) self.newtextarea.destroy();
        if(self.lastTypeUpdate) clearTimeout(self.lastTypeUpdate);
        if(self.infinitescroll) self.infinitescroll.destroy();
        if(modules.tools.size(self.modules)) $.each(self.modules,function(i,v){
            v.destroy();
        })
        if(self.audio_players.length){
            $.each(self.audio_players,function(i,v){
                v.destroy();
            })
        }
        opts.ele.children().remove();
        self.options=false;
        delete self;
    }
    this.showMoney=function(){
        self.keyboardele.find('.keyboardmore').hide();
        self.keyboardele.find('.keyboardless').hide();
        opts.ele.addClass('toolshowing keyboardfullscreen');
    	self.curinstance=opts.ele.find('.extrainput').mobiscroll().numpad({ 
            theme: mobiscroll.settings.theme,
            preset: 'decimal',
            display:'inline',
            min: 5,
            max: 500,
            deleteIcon:'',
            prefix: '$',
            onClose:function(){
                self.keyboardele.find('.keyboardless').hide();
                self.keyboardele.find('.keyboardmore').show();
                opts.ele.removeClass('toolshowing keyboardfullscreen');
                setTimeout(function(){
                    self.setHeight();
                },20)
            }
        });
        //add back button
        opts.ele.find('.extrainput').append('<div class="x_delete" style="text-align:center;position:absolute;bottom:5px;right:0px;width:33%;padding:10px;z-index:99999" class="truebox"><i class="icon-level-up" style="font-size:30px;color:black"></i></div>')
        opts.ele.find('.extrainput').find('.x_delete').stap(function(){
            var cv=opts.ele.find('.extrainput').mobiscroll('getArrayVal');
            if(cv&&cv.length){
                cv.splice(0,1);
                var t=0;
                $.each(cv,function(i,v){
                    var tens=Math.pow(10,(i-2));
                    t+=v*tens;
                })
                opts.ele.find('.extrainput').mobiscroll('setVal',t);
            }
            // var tcv=cv+'';
            // tcv=tcv.replace('.','');
        },1,'tapactive')
        opts.ele.find('.extrainput').show();
        //animate show
        self.setHeader('Send Money');
        opts.ele.data('view','money');
        self.setHeight(370);
        TweenLite.to(opts.ele,.3,{bottom:320});
    }
    this.showCalendar=function(){
    	setTimeout(function(){
            opts.ele.find('.extrainput').render({
                template:'keyboard_calendar',
                binding:function(tele){
                    tele.find('.pagenav').stap(function(){
                        if($(this).hasClass('active')) return false;
                        tele.find('.pagenav').removeClass('active');
                        $(this).addClass('active');
                        var page=$(this).attr('data-page');
                        tele.find('.calpage').hide();
                        tele.find('.'+page).show();
                    },1,'tapactive');
                    var dateobj=new Date();
                    var ct=new Date(dateobj.getFullYear(),dateobj.getMonth(),dateobj.getDate(),dateobj.getHours());
                    tele.find('.starttime').mobiscroll().datetime({
                        //theme:'material',//mobiscroll.settings.theme,//'ios',
                        animate:true,
                        rows:4,
                        display:'inline',
                        dateWheels: '|D M d|',
                        steps:{
                            minute:5
                        },
                        min:ct,
                        onChange:function(event){
                            var ct=new Date(event.valueText);
                            //set min of End Time!
                            tele.find('.endtime').mobiscroll('option',{
                                min:ct
                            })
                        }
                    })
                    tele.find('.endtime').mobiscroll().datetime({
                        //theme:'material',//mobiscroll.settings.theme,//'ios',
                        animate:true,
                        rows:4,
                        min:ct,
                        display:'inline',
                        dateWheels: '|D M d|',
                        steps:{
                            minute:5
                        }
                    })
                    opts.ele.find('.extrainput').show()
                    opts.ele.data('toolshowing',1);
                    opts.ele.addClass('toolshowing keyboardfullscreen');
                    //animate show
                    self.setHeader('Make Plans');
                    self.setHeight(255);
                    TweenLite.to(opts.ele,.3,{bottom:200});
                    opts.ele.data('view','calendar');
                }
            })
        },20);
    }
    this.closeExtraNav=function(cb){
    	//self.keyboardele.removeClass('toolshowing keyboardfullscreen');
        //self.clearHeader();
        self.clearHeader();
        self.setHeight(0);
        TweenLite.to(opts.ele,.3,{bottom:0,onComplete:function(){
            if(self.curinstance) self.curinstance.mobiscroll('destroy')
            self.keyboardele.find('.extrainput').html('').hide();
            self.keyboardele.data('view','text');
            if(cb) cb();
        }});   
    }
    this.showMore=function(ele){
    	//self.keyboardele.addClass('toolshowing keyboardfullscreen');
        self.keyboardele.find('.morearea').show();
        self.setHeader('More Options');
        self.setHeight(130);
        TweenLite.to(opts.ele,.3,{bottom:75});
    }
    this.setHeader=function(text,close){
        if(text){
            //self.keyboardele.find('.hideonapp').hide();
        	self.keyboardele.find('.subnavtext').html(text);
            self.keyboardele.find('.keyboardnav').show();
        }else{
            //self.keyboardele.find('.hideonapp').show();
            var cur=self.textarea.val();
            var remaining=(options.getContainerWidth)?options.getContainerWidth():$('body').width();
            if(self.hasFeature('extra')){
                var sendbtn=(self.options.keyboardOptions.mode=='advanced'&&!isPhoneGap())?0:self.keyboardele.find('.x_send').outerWidth();
                var remaining=remaining-sendbtn-12;//fudge
                if(!self.cantAddTools){
                    remaining-=self.keyboardele.find('.keyboardmore').outerWidth();
                }
                if(self.currentwidth!=remaining){
                    //self.keyboardele.find('.keyboardcontainer').css('width',remaining);
                    self.currentwidth=remaining;
                }
            }
        }
    }
    this.setCantAdd=function(set){
        //self.cantAddTools=set;
        self.setHeader();
        if(set){
            self.keyboardele.find('.keyboardmore').hide()
            self.keyboardele.find('.keyboardless').show()
        }else{
            self.keyboardele.find('.keyboardless').hide()
            self.keyboardele.find('.keyboardmore').show()
        }
    }
    this.clearHeader=function(){
    	self.keyboardele.find('.subnavtext').html('');
        self.keyboardele.find('.keyboardnav').hide();
    }
    this.getTextArea=function(){
        if(self.newtextarea){
            return self.newtextarea;
        }else{
            return opts.ele.find('textarea')
        }
    }
    this.getTextAreaValue=function(){
        var data={};
        if(self.newtextarea){
            var nd=self.newtextarea.getCurrent();
            data.content=nd.message;
            if(modules.tools.size(nd.at)) data.at=nd.at;
        }else{
            var v=opts.ele.find('textarea').val();
            if(v) data.content=v;
            else data.content='';
        }
        return data;
    }
    this.setTextAreaValue=function(value,set){
        if(self.newtextarea){
            self.newtextarea.setCurrent(value);
        }else{
            opts.ele.find('textarea').val(value);
        }
        if(!set) self.onKeyUp();
    }
    this.getData=function(opts){
    	var view=opts.ele.data('view');
        var data={};
        switch(view){
            case 'audio':
                var data=self.getTextAreaValue();
                data.room=opts.room;
                data.by=self.getIdentity().id;
                self.modules.audio.process({
                    type:'chat',
                    data:data
                });
                self.clear();
                return false;
            break;
            case 'video':
                var data=self.getTextAreaValue();
                data.room=opts.room;
                data.by=self.getIdentity().id;
                self.modules.video.process({
                    type:'chat',
                    data:data
                });
                self.clear();
                return false;
            break;
            case 'text':
                var data=self.getTextAreaValue();
                if(self.images&&self.images.order.length){
                    data.media={
                        type:'images',
                        data:self.getImages()
                    }
                }
                if(self.videodata&&modules.tools.size(self.videodata)){
                    data.media=self.videodata;
                }
                if(self.link){
                    data.media={
                        type:'link',
                        data:self.link
                    }
                }
                if((!data.content&&!self.images.order.length)||self.isUploadingImage()){
                    if(self.isUploadingImage()){
                        modules.toast({
                            content:'Image still uploading, please wait till it is done.',
                            remove:2500,
                            icon:'icon-warning-sign'
                        });
                    }else if(!data.content){
                        modules.toast({
                            content:'No content to send',
                            remove:2500,
                            icon:'icon-warning-sign'
                        });
                    }
                    return false;
                }
            break;
            case 'calendar':
                var start=opts.ele.find('.starttime').mobiscroll('getVal',true);
                var end=opts.ele.find('.endtime').mobiscroll('getVal',true);
                var startts=(new Date(start).getTime())/1000;
                var endts=(new Date(end).getTime())/1000;
                data.start=startts;
                if(startts!=endts){
                    data.end=endts;
                }
                //app.comingSoon();
                return false;
            break;
            case 'money':
                var val=opts.ele.find('.extrainput').mobiscroll('getVal',true);
                val=parseFloat(val);
                val=Math.floor(val*100);
                if(!val){
                    modules.toast({
                        content:'Please add a value'
                    })
                    return false;
                }
                self.onMessageSent=function(){
                    self.setHeight();
                }
                //app.comingSoon();
                return false;
                data.amount=val;
                data.to=self.options.sendTo;//default for now
            break;
            default:
                alert('invalid option!')
            break;
        }
        data.appid=app.appid;
        data.token=app.user.token;
        data.room=opts.room;
        data.by=self.getIdentity().id;
        data.from=window.uuid;
        data.user=self.getIdentity();
        if(self.replyingTo) data.parent=self.replyingTo._id;
        if(self.currentConnectin) data.attachment={
            id:self.currentConnectin.id,
            type:'tags',
            data:self.currentConnectin.info
        }
        if(self.editing){
            data._id=self.editing._id;//ensure _id copies over, the rest should update properly, should also render update properly too!
            //ensure parent stays too!
            if(self.editing.parent) data.parent=self.editing.parent;
        }
        data.tempid=Math.uuid();//create a temp id to ensure that a message only saves/sends once!
        return data;
    }
    this.images={list:{},order:[]}
    this.connectIn=function(info){
        self.clear();
        self.currentConnectin=info;
        self.keyboardele.find('.replytoarea').render({
            template:'keyboard_connectin',
            data:info,
            binding:function(ele){
                ele.find('.x_cancel').stap(function(){
                    self.clear();
                },1,'tapactive')
            }
        });
        self.setHeight();
    }
    this.clearConnectin=function(){
        self.keyboardele.find('.replytoarea').html('');
        //self.ensureTextArea();
        self.currentConnectin=false;
    }
    this.clearImages=function(){
        self.images={list:{},order:[]};
        self.keyboardele.find('.imagepreviewarea').html('');
    }
    this.clearVideo=function(){
        self.videodata=false;
        self.keyboardele.find('.videopreviewarea').html('');
    }
    this.clearAudio=function(){
        self.keyboardele.find('.audiopreviewarea').html('');
    }
    this.clearSearch=function(){
        if(self.newtextarea) self.newtextarea.clearSearch();
    }
    this.clear=function(cb){
        if(self.newtextarea){
            self.newtextarea.clear();
        }else{
            opts.ele.find('textarea').val('');
            opts.ele.find('textarea').css('height','30px');//reset height
        }
        self.cacheMessage(1);//clear out cache message!
        self.setCantAdd(0);
        self.clearImages();
        self.clearVideo();
        self.clearAudio();
        self.clearReplyTo();
        self.clearConnectin();
        self.clearLink();
        self.setHeight();
        self.editing=false;
        opts.ele.find('.imagepreviewarea').html('');
        opts.ele.removeClass('keyboardfullscreen istyping')
        if(opts.ele.hasClass('toolshowing')){
            self.closeExtraNav(function(){
                if(cb) cb();
            })
        }else{
            if(cb) cb();
        }
    }
    this.clearReplyTo=function(){
        self.keyboardele.find('.replytoarea').html('');
        self.keyboardele.find('textarea').val('');
        self.ensureTextArea();
        self.replyingTo=false;
    }
    this.replyTo=function(post){
        self.clear();
        self.replyingTo=post;
        //render replyto header
        self.keyboardele.find('.replytoarea').render({
            template:'keyboard_replyto',
            data:post,
            binding:function(ele){
                ele.find('.x_cancel').stap(function(){
                    self.clear();
                },1,'tapactive')
            }
        });
        //focus keyboard!
        setTimeout(function(){
            self.setHeight();
            self.focus();
            setTimeout(function(){
                self.focus();
            },100)
        },50)
    }
    this.clearEdit=function(){
        //self.keyboardele.find('.replytoarea').html('');
        //self.keyboardele.find('textarea').val('');
        self.clear();
        self.editing=false;
    }
    this.edit=function(comment){
        self.clearEdit();
        self.editing=comment;
        //render replyto header
        self.keyboardele.find('.replytoarea').render({
            template:'keyboard_editing',
            binding:function(ele){
                ele.find('.x_cancel').stap(function(){
                    self.clearEdit();
                },1,'tapactive')
            }
        });
        if(self.newtextarea){
            self.newtextarea.set({
                message:comment.content,
                at:comment.at
            })
        }else{
            //set content of input
            self.textarea.val(comment.content);
        }
        //also render any attachments like images!
        if(comment.media&&comment.media.type=='images'){
            $.each(comment.media.data.order,function(i,v){
                var item=comment.media.data.list[v];
                self.renderPreviewImage(self.keyboardele,Math.uuid(8),item.pic,1);
            })
        }
        if(comment.media&&comment.media.type=='link'){
            self.renderLink(comment.media.data);
        }
        self.ensureTextArea();
        setTimeout(function(){
            self.onKeyUp();
            //focus keyboard!
            self.setHeight();
            setTimeout(function(){
                self.focus();
            },10)
        },10)
    }
    this.ensureTextArea=function(){
        self.textarea.autosize({
            scroller:self.getScroller(),
            onresize:function(){
                self.setHeight();
            }
        });//refresh
    }
    this.focus=function(){
        self.keyboardele.find('textarea').focus();
    }
    this.setImgWidth=function(){
        return false;
        if(options.keyboardOptions&&options.keyboardOptions.mode=='web_inline'){
            self.setHeight();
            return false;
        }
        var w=0;
        $.each(self.imgele.find('.previewimg'),function(i,v){
            w+=$(v).outerWidth()+10;//include margins
        })
        self.imgele.find('.imagecontent').width(w);
        var cw=$('body').width()-self.imgele.find('.imgcontrols').width();
        self.imgele.find('.scrollX').width(cw);
        self.setHeight();
    }
    this.renderPreviewVideo=function(ele){
        var file=$.extend(true,{},self.videodata.data);
        //if(editing) file.editing=true;
        file.editing=true;//always eidting
        //file.processed=(self.cpost.id)?1:0;
        file.processed=1;
        file.height='200px';
        file.container={
            width:self.getScroller().width(),
            height:self.getScroller().height()
        }
        ele.find('.videopreviewarea').html(modules.video_preview.render(file));
        self.video=new modules.video_player({
            ele:ele.find('.videopreviewarea').find('video'),
            editing:1
        })
        //bindings!
        ele.find('.videopreviewarea').find('.x_remove').stap(function(){
            self.modules.video.abort();
            self.videodata=false;
            ele.find('.videopreviewarea').html('');
            self.setHeight();
        },1,'tapactive');
        self.setHeight();
    }
    this.renderPreviewImage=function(ele,id,img,edit){
        if(edit) self.addImage(id,img);
        else self.addImage(id);
        self.setHeight();
        //ability to upload
        if(ele.find('.imagepreviewarea').html()==''){
            ele.find('.imagepreviewarea').render({
                template:(options.keyboardOptions&&options.keyboardOptions.mode=='web_inline')?'keyboard_imagearea_inline':'keyboard_imagearea',
                binding:function(ele){
                    self.imgele=ele;
                    if(options.keyboardOptions&&options.keyboardOptions.mode=='web_inline'){

                    }else{
                        if(ele.find('.x_photo').length) self.bindPhotos(ele.find('.x_photo'));
                        if(ele.find('.x_camera').length) self.bindCamera(ele.find('.x_camera'));
                    }
                }
            })
        }
    	ele.find('.imagecontent').render({
	        template:'keyboard_previewimg',
	        prepend:true,
	        data:{
	            id:id,
                editing:(edit)?0:1
	            //img:(edit)?modules.tools.getImg(img,'small'):img
	        },
	        binding:function(tele){
                tele.find('.previewimg').on('load',function(){
                    self.setImgWidth();
                });
                tele.find('.previewimg').attr('src',(edit)?modules.tools.getImg(img,'small'):img);
                if(!edit){
                    tele.find('.indicator').radialIndicator({
                        barColor: '#0e345e',
                        barWidth: 5,
                        initValue: 0,
                        roundCorner : true,
                        radius:20,
                        percentage: false,
                        displayNumber:false,
                        onAnimationComplete:function(cur_p){
                            if(cur_p==100){//set to done!
                                tele.find('.indicator').fadeOut(500,function(){
                                    $(this).remove();
                                })
                            }
                        }
                    });
                    tele.find('.indicator').find('canvas').css({position:'absolute',left:'50%',top:'50%',marginLeft:'-25px',marginTop:'-25px'})
	            }
                tele.find('.x_remove').stap(function(e){
                    phi.stop(e);
                    self.ensureFocus();
	                var tid=$(this).attr('data-id');
	                tele.fadeOut(500,function(){
	                    $(this).remove()
                        self.setImgWidth();
	                    self.removeImage(tid);
                        self.setHeight();
	                })
	            },1,'tapactive');
	        }
	    });
    }
    this.setUploadProgress=function(ele,id,p,force){
        var rele=ele.find('.imagepreviewarea').find('[data-image='+id+']').find('.indicator');
        var indicator=rele.data('radialIndicator');
        if(indicator){
            if(p==-1){
                indicator.stop();
            }else{
                if(!force) p=p*.95;//give more room for uploading...
                indicator.animate(p,1);
            }
        }
    }
    this.getHeaderHeight=function(){
        if(self.audioShowing){
            var height=opts.ele.find('.audiopreviewarea').outerHeight();
        }else if(self.options.keyboardOptions&&self.options.keyboardOptions.mode=='picture'){
            var height=opts.ele.find('.keyboardcontainer').outerHeight()+20;
        }else if(self.options.keyboardOptions&&self.options.keyboardOptions.mode=='advanced'){
            var height=opts.ele.find('.keyboardcontainer').outerHeight()+opts.ele.find('.keyboard_web_extra').outerHeight();
            //var height=(opts.ele.find('textarea').outerHeight()+14);
        }else{
            var height=opts.ele.find('.keyboardcontainer').outerHeight();
            //var height=(opts.ele.find('textarea').outerHeight()+14);
        }
        if(options.keyboardOptions&&self.options.keyboardOptions.mode=='web_inline'){
            var height=opts.ele.find('.keyboardcontainer').outerHeight();
        }
        return height;
    }      
    this.ensureKeyboardHidden=function(cb){
    	if(modules.keyboard_global.keyboardHeight){
            modules.keyboard_global.oneTimeKeyboardOnHide=function(){
                //refresh scroller!
                self.refreshScroller()
                cb();
            }
            self.hide();
        }else cb();
    }  
    this.loadRead=function(){
    	modules.api({
            url:app.sapiurl+'/module/chat/loadread',
            data:{
                room:opts.room
            },
            retry:5,
            success:function(resp){
                self.readReceipts=(resp.data&&resp.data.read)?resp.data.read:false;
                self.ensureReadReceipts();//render if loaded!
            }
        });
    }
    this.setReadReceipt=function(uid,id){
        if(!self.readReceipts) self.readReceipts={};
        self.readReceipts[uid]=id;
        self.ensureReadReceipts();
    }
    this.ensureReadReceipts=function(retry,cb){
        if(!opts.readReceipts) return false;
    	if(self.pageReady){
    		if(self.readReceipts){
    			//group by message id!
    			var after={};
    			$.each(self.readReceipts,function(i,v){
    				if(!after[v]) after[v]=[];
    				after[v].push(i);
    			});
    			//will do animations in future...
    			//remove all old read receipts
    			self.getScroller().find('.readreceipts').remove();
    			$.each(after,function(i,v){
    				var ele=self.getScroller().find('[data-message='+i+']');
    				if(ele.length){//its been loaded!
    					var msg=self.infinitescroll.data[i];
    					if(msg){//should exist by why not check!
	    					//remove the person who sent it!
	    					//var readby=v.diff([msg.by]);
	    					var readby=v;
	    					ele.render({
	    						template:'chat_readreceipts',
	    						data:{
	    							readby:readby
	    						},
	    						after:true
	    					})
	    				}else{
                            console.log('no data')
                        }
    				}else{
                        console.log('ele doesnt exist')
                    }
    			})
                //if not loaded, scroll to bottom
                if(cb) cb();              
    		}
    		//update read receipts!
    	}else{
    		self.log('waiting for page to be ready!!')
            if(!retry) retry=0;
            retry++;
            if(retry<10){
                setTimeout(function(){
                    self.ensureReadReceipts(retry);
                },50);
            }
    	}
    }
    this.setRead=function(last,cb){
        modules.api({
            url:app.sapiurl+'/module/chat/setread',
            data:{
                id:app.user.profile.id+'_'+opts.room,
                last:last,
                room:opts.room,
                identity:self.getIdentity().id
            },
            retry:5,
            success:function(resp){
                if(cb) cb();
                //self.log(resp);
            }
        });
        phone.badge.removeChat(opts.room);
        phi.emit(opts.room,{
            id:opts.room,
            unread:0
        })
        //app.home.badge.removeChat(opts.room);
    }
    this.renderMessage=function(ele,msg,noscroll){
        if(!ele||!ele.length){
            return console.warn('invalid elevent to renderMessage')
        }
        if(!opts.messageRenderBinding) opts.messageRenderBinding=function(){}
        ele.find('.chatarea').find('.nomessages').remove();
        ele.find('.chatarea').find('.no_data').remove();
        if(opts.parseMessage) msg=opts.parseMessage(msg);
        var uid=(msg._id)?msg._id:msg.tempid;
        var template=(opts.renderTemplate)?opts.renderTemplate:'chat_item';
        if(self.options.keyboardOptions&&self.options.keyboardOptions.disableNewMessageScroll){
            noscroll=true;
        }
        //msg.children=self.getChildren(msg._id);
        //add children
        if(msg.parent){
            if(options.moveParentReplyToBottom){
                var c=self.infinitescroll.getById(msg.parent);
                if(!c.notify){
                    c.notify=[];
                    self.infinitescroll.setById(msg.parent,c);
                    //re-render this one too!
                    self.renderMessage(ele,c,1);
                }
                ele.find('.chatarea').find('[data-parent='+msg.parent+']').appendTo(ele.find('.chatarea'));
            }
            if(ele.find('.chatarea').find('[data-parent='+msg.parent+']').find('.'+msg.parent+'_replies').find('[data-comment='+uid+']').length){//edit
                ele.find('.chatarea').find('[data-parent='+msg.parent+']').find('.'+msg.parent+'_replies').find('[data-comment='+uid+']').render({
                    template:template,
                    uid:uid,
                    wrap:'div',
                    replace:true,
                    data:{data:msg,list:(opts.infinitescroll&&opts.infinitescroll.addListData)?self.infinitescroll.data:false,opts:{identity:self.getIdentity()},renderData:(opts.infinitescroll&&opts.infinitescroll.renderData)?opts.infinitescroll.renderData:''},
                    binding:opts.messageRenderBinding
                });
            }else{//add
                ele.find('.chatarea').find('[data-parent='+msg.parent+']').find('.'+msg.parent+'_replies').render({
                    template:template,
                    uid:uid,
                    wrap:'div',
                    data:{data:msg,list:(opts.infinitescroll&&opts.infinitescroll.addListData)?self.infinitescroll.data:false,opts:{identity:self.getIdentity(),renderData:(opts.infinitescroll&&opts.infinitescroll.renderData)?opts.infinitescroll.renderData:''}},
                    binding:opts.messageRenderBinding
                });
            }
            //refresh!
            if(!noscroll){
                if(options.moveParentReplyToBottom){
                    self.scrollToBottom(100);
                }else{
                    if(msg.tempid) self.scrollToElement(ele.find('.chatarea').find('[data-tempid='+msg.tempid+']'),100);
                    else self.scrollToElement(ele.find('.chatarea').find('[data-message='+msg._id+']'),100);
                }
            }
        }else{
            if(msg._id&&(ele.find('.chatarea').find('[data-comment='+uid+']').length||ele.find('.chatarea').find('#'+uid).length)){//re-render message
                if(ele.find('.chatarea').find('#'+uid).length){
                    var tele=ele.find('.chatarea').find('#'+uid);
                }else{
                    var tele=ele.find('.chatarea').find('[data-comment='+uid+']');
                }
                tele.render({
                    template:template,
                    uid:uid,
                    wrap:'div',
                    replace:true,
                    data:{data:msg,list:(opts.infinitescroll&&opts.infinitescroll.addListData)?self.infinitescroll.data:false,opts:{identity:self.getIdentity()},renderData:(opts.infinitescroll&&opts.infinitescroll.renderData)?opts.infinitescroll.renderData:''},
                    binding:opts.messageRenderBinding
                });
            }else{//new message
                ele.find('.chatarea').render({
                    template:template,
                    uid:uid,
                    wrap:'div',
                    data:{data:msg,list:(opts.infinitescroll&&opts.infinitescroll.addListData)?self.infinitescroll.data:false,opts:{identity:self.getIdentity()},renderData:(opts.infinitescroll&&opts.infinitescroll.renderData)?opts.infinitescroll.renderData:''},
                    binding:opts.messageRenderBinding
                });
            }
            //refresh!
            if(!noscroll){
                if(options.moveParentReplyToBottom){
                    self.scrollToBottom(100);
                }else{
                    if(msg.tempid) self.scrollToElement(ele.find('.chatarea').find('[data-tempid='+msg.tempid+']'),100);
                    else self.scrollToElement(ele.find('.chatarea').find('[data-id='+msg._id+']'),100);
                }
            }
        }
        if(opts.onRenderAreaHeightChange) opts.onRenderAreaHeightChange();
        //do binding!
        if(opts.infinitescroll&&opts.infinitescroll.onPageReady){
            if(msg._id) opts.infinitescroll.onPageReady(ele.find('.chatarea').find('[data-message='+msg._id+']'));
            else opts.infinitescroll.onPageReady(ele.find('.chatarea').find('[data-tempid='+msg.tempid+']'));
        }
    }
    this.typetimeouts={};
    this.onType=function(msg){
    	if(self.infinitescroll&&self.infinitescroll.scroller){
	    	if(!self.infinitescroll.scroller.getScroller().find('[data-typing='+msg.by.id+']').length){//render!
	    		self.infinitescroll.scroller.getScroller().render({
	    			template:'chat_ontyping',
	    			data:{
	    				by:msg.by
	    			}
	    		});
	    		self.scrollToBottom(100);
	    	}
	    	if(self.typetimeouts[msg.by.id]) clearTimeout(self.typetimeouts[msg.by.id]);
	    	self.typetimeouts[msg.by.id]=setTimeout(function(){
	    		self.clearTyping(msg.by);
	    	},30000);//if after 30 seconds there isnt
	    }
    }
    this.clearTyping=function(by){
    	self.log('clearTyping')
    	if(self.infinitescroll){
	    	self.infinitescroll.scroller.getScroller().find('[data-typing='+by.id+']').remove();
	    	if(self.typetimeouts[by.id]) clearTimeout(self.typetimeouts[by.id]);
	    }
    }
    this.getRenderArea=function(){
        return (opts.renderEle)?opts.renderEle:opts.scrollele;
    }
    this.onMessage=function(msg){
        if(app.isdev||app.user.profile.admin){
            console.log(msg)
        }
        var rele=self.getRenderArea();
        if(!rele) return console.warn('No Ele to render to onMessage')
        if(msg.type=='message'){
        	rele.find('[data-tempid='+msg.tempid+']').remove();//will re-render
        	self.clearTyping({id:msg.by});//remove the typeing bubble
            //return false;
            if(msg._id){//from web socket, not front end.
                if(self.infinitescroll){
                    self.infinitescroll.onMessage(msg);//data must be registered before any bindings can occur
                }
            }
            if(opts.renderMessage){
                opts.renderMessage(rele,msg);
            }else{//default
                self.renderMessage(rele,msg);
            }
            //register with infinit
            //refresh scroller!
            if(!msg.parent&&self.options.keyboardOptions&&self.options.keyboardOptions.scrollOnNewMessage&&opts.scroller) self.scrollToBottom(100);
            if(msg._id){//from web socket, not front end.
                if(self.getIdentity().id!=msg.by){//the read receipt is
                    if(opts.readReceipts){
                        self.log('visible: '+self.isVisible);
                        if(self.isVisible){
                            self.setRead(msg._id)
                        }else{
                            self.lastRead=msg._id;
                        }
                    }
                }else{
                    self.setReadReceipt(msg.by,msg._id)
                }
                if(opts.onMessage) opts.onMessage(msg);
	        }
        }else if(msg.type=='readreceipt'){
        	//update read receipts and re-render!
        	if(!self.readReceipts) self.readReceipts={};
        	self.readReceipts[msg.data.by]=msg.data.message_id;
        	self.ensureReadReceipts();
        }else if(msg.type=='typestart'){
        	if(msg.by.id!=self.getIdentity().id){
        		self.onType(msg);
        	}
        }else if(msg.type=='promote'){
            self.destroy();
            //create new keyboard with old, upgraded opts.
            //opts.room=msg.room;
            // self.create(opts);
            //replace!
            modules.viewdelegate.register('chat',msg.chatopts,1);//replace!
            // modules.toast({
            //     content:'You just started a chat with <b>'+msg.with.name+'</b>',
            //     remove:2500,
            //     images:[msg.with.pic]
            // });
        }else if(msg.type=='friendrequest'){
            if(self.options.onFriendRequest) self.options.onFriendRequest(msg);
        }else if(msg.type=='clearfriendrequest'){
            if(self.options.onClearFriendRequest) self.options.onClearFriendRequest(msg);
        }else if(msg.type=='confirmfriend'){
            if(self.options.onConfirmFriend) self.options.onConfirmFriend(msg);
        }else if(msg.type=='stats'){
            if(self.options.onStatsUpdate) self.options.onStatsUpdate(msg.data);
        }else{
            self.log(msg)
        }
    }
    this.isSimple=function(){
        return (self.options.keyboardOptions&&self.options.keyboardOptions.mode=='simple')?1:0;
    }
    this.updateToTyping=function(){
    	if(!self.lastTypeUpdate){
    		self.log('updateToTyping');
    		if(app.user.socket) app.user.socket.emit('typestart', {type:'typestart',room:self.options.room,by:self.getIdentity(),appid:app.appid,token:app.user.token});
    		self.lastTypeUpdate=setTimeout(function(){
    			self.lastTypeUpdate=0;
    		},5000);//do this every 5 seconds, someone may be just joining the chat...
    	}
    }
    this.onKeyUp=function(){
        if(!self.textarea.val()){
            opts.ele.removeClass('keyboardfullscreen istyping');
        }else{
            if(!opts.ele.hasClass('istyping')) opts.ele.addClass('keyboardfullscreen istyping');
        }
        var height=self.textarea.outerHeight();
        if(height!=self.textarea.data('height')){
            self.setHeight();
        }
        self.textarea.data('height',height);
        //if cursor is not in position
        
        self.updateToTyping();
        self.setHeader();
        if(opts.onKeyUp) opts.onKeyUp();
        self.cacheMessage();
    }
    this.clearLink=function(){
        opts.ele.find('.linkpreviewarea').html('');
        self.link=false;
        self.setCantAdd(0);
    }
    this.loadLink=function(link){
        //show loader
        opts.ele.find('.linkpreviewarea').render({
            template:'keyboard_link_loading',
            append:false
        });
        self.setHeight();
        self.setCantAdd(1);
        //fetch
        modules.links_global.get(link,function(data){
            if(data.success){
                self.renderLink(data.data,data.mid);
            }else{
                self.renderLinkError(data,link);
            }
        })
    }
    this.renderLinkError=function(data,link){
        if(data.error&&data.error!='invalid_link'){
            opts.ele.find('.linkpreviewarea').render({
                template:'keyboard_link_error',
                append:false,
                data:{
                    data:data
                },
                binding:function(ele){
                    self.setHeight();
                    ele.find('.x_remove').stap(function(){
                        opts.ele.find('.linkpreviewarea').html('');
                        self.setHeight();
                    },1,'tapactive')
                    ele.find('.x_retry').stap(function(){
                        opts.ele.find('.linkpreviewarea').html('');
                        self.loadLink(link);
                    },1,'tapactive')
                }
            })
        }else{
             opts.ele.find('.linkpreviewarea').html('');
        }
    }
    this.renderLink=function(data,id){
        self.link=data;
        opts.ele.find('.linkpreviewarea').html(modules.links_global.render($.extend(true,{},{small:true,editing:true},data))); 
        opts.ele.find('.linkpreviewarea').find('.x_remove').stap(function(){
            self.clearLink();
            self.setHeight();
        },1,'tapactive')
    }
    this.retrieveImageFromClipboard=function(pasteEvent, callback){
        var items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (index in items) {
            var item = items[index];
            if (item.kind === 'file') {
              var blob = item.getAsFile();
              // var URLObj = window.URL || window.webkitURL;
              //   callback(URLObj.createObjectURL(blob))
              var reader = new FileReader();
              reader.onload = function(event){
                var URLObj = window.URL || window.webkitURL;
                callback(event.target.result)
                }; // data url!
              reader.readAsDataURL(blob);
            }
          }
    }
    this.uploadPastedImage=function(blob){
        var fd = new FormData();
        fd.append('base64', blob);
        fd.append('appid',app.appid);
        fd.append('token',app.user.token)
        fd.append('path','/img/')
        fd.append('sizes',['full','small'])
        fd.append('site','nectar');
        self.hideTools();
        var obj={
            id:Math.uuid(12)
        }
        self.renderPreviewImage(self.keyboardele,obj.id,blob);
        self.setHeight();
        var progress=0;
        self.upint=setInterval(function(){
            progress++;
            if(progress<100){
                self.setUploadProgress(self.keyboardele,obj.id,progress);
            }
        },50);
        $.ajax({
            type: 'POST',
            url: app.uploadurl+'/upload/image/submit',
            data: fd,
            processData: false,
            contentType: false,
            success:function(resp){
                if(self.upint) clearInterval(self.upint);
                if(resp.success){
                    var img={
                      path:resp.path,
                      ext:resp.ext,
                      ar:resp.ar
                  };
                    self.setUploadProgress(self.keyboardele,obj.id,100,1);
                    self.addImage(obj.id,img);
                }else{
                   self.setUploadProgress(self.keyboardele,obj.id,-1);
                    modules.toast({
                        content:'Error Uploading Image: '+resp.error
                    }) 
                }
            },
            error:function(resp){
                if(self.upint) clearInterval(self.upint);
                self.setUploadProgress(self.keyboardele,obj.id,-1);
                modules.toast({
                    content:'Error Uploading Image'
                })
            }
        })
    }
    this.bindTextArea=function(){
        if(!self.keyboardele) return false;
        if(self.keyboardBound) return false;
        self.keyboardBound=true;//only allow binding onece!
    	var te=self.textarea;
        if(opts.keyboardOptions.tag){
            self.newtextarea=new modules.textarea({
                ele:self.keyboardele.find('.dynamictextarea'),
                scroller:self.scroller,
                searchEle:self.keyboardele.find('.keyboardsearch'),
                allowNoResults:true,
                filters:['people','page','event'],
                search_web_placement:(opts.search_web_placement)?opts.search_web_placement:'',
                noFit:true,
                autosize:true,
                onPaste:function(val,e){
                    self.retrieveImageFromClipboard(e,function(data){
                        if(data){
                            self.uploadPastedImage(data);
                        }
                    });
                    var height=te.outerHeight();
                    if(height!=te.data('height')){
                        self.setHeight();
                    }
                    te.data('height',height);
                    //check content for links!
                    setTimeout(function(){
                        var link=modules.links_global.getLinks(te.val());
                        if(link.length){
                            self.loadLink(link[0]);
                        }
                    })
                },
                onFocus:function(){
                    self.isWindowActive=true;
                },
                onBlur:function(){
                    self.isWindowActive=false;
                },
                onSearchUpdate:function(hasResults){
                   // if(hasResults){
                        //get height of results,
                        var rh=self.keyboardele.find('.keyboardsearch').children().first().height();
                        //available!
                        var ah=self.getScroller().outerHeight();
                        ah+=self.keyboardele.find('.morekeyboardview').outerHeight()
                        if(rh>ah){
                            self.keyboardele.find('.keyboardsearch').height(ah);
                        }else{
                            self.keyboardele.find('.keyboardsearch').height(rh);
                        }
                   // }
                },
                onSubmit:function(){
                    self.send();
                },
                onHeightUpdate:function(){
                    self.setHeight();
                    if(opts.onHeightUpdate) opts.onHeightUpdate();
                }
            });
            self.setHeight();
        }else{
            self.ensureTextArea();
            te.on('input keyup',function(e){
                self.onKeyUp();
                if(self.onRelease&&e.which==13&&e.type=='keyup'){
                    self.onRelease=false;
                    self.ensureTextArea();
                    var ta=te.textareaHelper('caretPos');
                    var ct=te.scrollTop();
                    var h=te.height();
                    var bottom=h+ct;
                    var ttop=ta.top+ct;
                    if(ttop>bottom){
                        var diff=ttop-bottom+20;
                        //app.scroller.scrollBy(te,-diff,0);
                        te.animate({ scrollTop: diff+"px" },0);
                    }
                    //console.log('move to cursor position!',ta);
                }
            }).on('keydown',function(e){
                if(!isPhoneGap()&&!isMobile){
                    if(e.which==13){
                        if(e.shiftKey){
                            //new line!
                            var ci=te.caret();
                            var newtext=self.getTextAreaValue().content.insertAt(ci,'\n')
                            self.setTextAreaValue(newtext);
                            te.caret(ci+1);
                            self.onRelease=true;
                        }else{
                            self.send();
                            phi.stop(e);
                        }
                        return false;
                    }
                }
            }).on('paste',function(e){
                console.log('PASTE!')
                self.retrieveImageFromClipboard(e,function(data){
                    if(data){
                        self.uploadPastedImage(data);
                    }
                });
            	var height=te.outerHeight();
            	if(height!=te.data('height')){
                    self.setHeight();
                }
                te.data('height',height);
                //check content for links!
                setTimeout(function(){
                    var link=modules.links_global.getLinks(te.val());
                    if(link.length){
                        self.loadLink(link[0]);
                    }
                })
            });
            te.on('focus',function(){//ensure all extra junk is hidden!
                self.isWindowActive=true;
                self.keyboardele.find('.extrainput').html('').hide();
                self.keyboardele.find('.morearea').hide();
            }).on('blur',function(){
                self.isWindowActive=false;
            })
            if(opts.keyboardOptions.focusOnLoad){
            	self.scrollToBottomOnKeyboardShow=1;
                te.focus();
            }
            self.setHeight();
        }
        if(self.options.cache){
            var data=modules.exp_prefs.get(self.options.room);
            if(data&&data.message&&data.message.content){
                self.setTextAreaValue(data.message.content,1);
                self.getTextArea().trigger('refresh.autosize')
            }
            //console.log('===========',data)
        }
    }
    this.unbookmark=function(id){
        modules.api({
            url:app.sapiurl+'/module/chat/unbookmark',
            data:{
                id:id
            },
            retry:5,
            success:function(resp){
                if(resp.success){
                    //update this item!
                    var c=self.infinitescroll.getById(id);
                    c.bookmark=false;
                    self.infinitescroll.setById(id,c);
                    //re-render!
                    if(opts.renderMessage){
                        opts.renderMessage(self.getRenderArea(),c);
                    }else{//default
                        self.renderMessage(self.getRenderArea(),c);
                    }
                }else{
                    modules.toast({
                        content:'Error bookmarking, please try again.  '+resp.error,
                        remove:2500,
                        icon:'icon-warning-sign'
                    });
                }
            }
        });
    }
    this.bookmark=function(id){
        modules.api({
            url:app.sapiurl+'/module/chat/bookmark',
            data:{
                id:id
            },
            retry:5,
            success:function(resp){
                if(resp.success){
                    //update this item!
                    var c=self.infinitescroll.getById(id);
                    c.bookmark=true;
                    self.infinitescroll.setById(id,c);
                    //re-render!
                    if(opts.renderMessage){
                        opts.renderMessage(self.getRenderArea(),c);
                    }else{//default
                        self.renderMessage(self.getRenderArea(),c);
                    }
                }else{
                    modules.toast({
                        content:'Error bookmarking, please try again.  '+resp.error,
                        remove:2500,
                        icon:'icon-warning-sign'
                    });
                }
            }
        });
    }
    this.highlightItem=function(item){
        self.keyboardele.hide();
        self.getScroller().parent().render({
            template:'keyboardhighlight',
            data:{
                bookmarked:(item.bookmark)?1:0
            },
            binding:function(ele){
                self.hele=ele;
                ele.find('.x_bookmark').stap(function(e){
                    self.bookmark(item._id);
                },1,'tapactive')
                ele.find('.x_unbookmark').stap(function(e){
                    self.unbookmark(item._id);
                },1,'tapactive')
                ele.find('.x_copy').stap(function(e){
                    phi.stop(e);
                    var clipboard=new ClipboardJS('.x_copy',{
                        text: function(trigger) {
                            return item.content;
                        }
                    });
                    clipboard.on('success', function(e) {
                        ele.find('.x_selector').hide();
                        ele.find('.x_response').show();
                        ele.find('.responsetext').html('Successfully Copied!');
                        setTimeout(function(){
                            self.hideHighlight();
                        },1000)
                    })
                    clipboard.onClick(e);
                    clipboard.destroy();
                },1,'tapactive')
                ele.stap(function(e){
                    self.hideHighlight();
                },1,'tapactive');
                ele.on('touchmove',function(e){
                    phi.stop(e)
                })
                setTimeout(function(){
                    TweenLite.to(ele.find('.header'),.3,{marginBottom:0});
                },20);
            }
        })
    }
    this.hideHighlight=function(){
        TweenLite.to(self.hele,.3,{marginBottom:'-40px',onComplete:function(){
            self.hele.remove();
            self.keyboardele.show();
        }});
    }
    this.onPageReady=function(){
        // app.kb=self;
        // return false;
        if(self.pageReady) return false;//already done!
        self.pageReady=1;
        self.log('Page Ready!');
        if(self.hasFeature('extra')){
            self.setHeader();
        }
        self.bindTextArea();//now that its visible!
    	self.infinitescroll.onPageReady();//now render!
        //bind
        if(self.options.readReceipts) self.ensureReadReceipts(false,function(){
            self.scrollToBottom(0,1);//read receipts add height! 
        });
        self.scrollToBottom(0,1);//read receipts add height!
    }
    this.getInitialScroller=function(){
        if(self.options.scroller){
            if(self.options.scroller.scroller){
                return self.options.scroller.scroller;
            }
            return self.options.scroller;
        }else if(options.scrollele){
            return options.scrollele;
        }
        return false;
    }
    this.getScroller=function(){
        if(self.infinitescroll){
            return self.infinitescroll.getScroller()
        }else if(self.options.scroller){
            if(self.options.scroller.scroller){
                return self.options.scroller.scroller;
            }
            return self.options.scroller;
        }else if(options.scrollele){
            return options.scrollele;
        }else{
            return self.scroller;
        }
    }
    this.refreshScroller=function(){
    	if(self.scroller) self.scroller.refresh();
    }
    this.scrollBy=function(height){
        self.scroller.scrollBy(height);
		// if(self.infinitescroll){
  //   		if(self.infinitescroll.scroller) self.infinitescroll.scroller.scrollBy(height);
  //   	}else if(self.scroller){
  //   		app.scroller.scrollBy(self.getScroller(),height);
  //   	}
	}
    this.scrollToElement=function(ele,time){
        self.scroller.scrollTo({ele:ele,time:time})
        // if(self.infinitescroll){
        //     self.infinitescroll.scroller.scrollTo({ele:ele,time:time});
        // }else if(self.scroller){
        //     app.scroller.scrollTo(self.scroller,{ele:ele,time:time});
        // }else if(options.scrollele){
        //     app.scroller.scrollTo(options.scrollele,{ele:ele,time:time});
        // }
    }
    this.scrollToBottom=function(time,load){
        self.log('scrollToBottom')
        if(self.messageTrace) messageTrace('keyboard','ScrollToBottom ele.length ['+((self.getScroller())?self.getScroller().length:0)+']')
        self.scroller.scrollToBottom(time);
    }
    this.hasFeature=function(type){
        var hasFeature=false;
        //alert(self.options.keyboardOptions.mode)
        if(self.options.keyboardOptions&&self.options.keyboardOptions.mode){
            switch(type){
                case 'extra':
                    var modes=['advanced'];
                    if(modes.indexOf(self.options.keyboardOptions.mode)>=0) hasFeature=true;
                break;
                case 'mention':
                    var modes=['picture'];
                    if(modes.indexOf(self.options.keyboardOptions.mode)>=0) hasFeature=true;
                break;
                case 'money':
                    var modes=[];
                    if(!isPhoneGap()){
                        modes.push('advanced');
                    }
                    if(modes.indexOf(self.options.keyboardOptions.mode)>=0) hasFeature=true;
                break;
                case 'emoji':
                    var modes=[];
                    if(!isPhoneGap()){
                        modes.push('advanced');
                        modes.push('picture');
                        modes.push('web_inline');
                    }
                    if(modes.indexOf(self.options.keyboardOptions.mode)>=0) hasFeature=true;
                break;
                case 'audio':
                    var modes=[];
                    modes.push('advanced');
                    if(modes.indexOf(self.options.keyboardOptions.mode)>=0) hasFeature=true;
                break;
                case 'video':
                    var modes=[];
                    modes.push('advanced');
                    if(modes.indexOf(self.options.keyboardOptions.mode)>=0) hasFeature=true;
                break;
                case 'photos':
                    var modes=['picture','comment','mention','web_inline'];
                    //if(!isPhoneGap()){
                        modes.push('advanced');
                    //}
                    if(modes.indexOf(self.options.keyboardOptions.mode)>=0) hasFeature=true;
                break;
                case 'camera':
                    var modes=['picture','comment','advanced'];
                    if(modes.indexOf(self.options.keyboardOptions.mode)>=0&&isPhoneGap()) hasFeature=true;
                break;
            }
        }
        if(self.options.keyboardOptions.disableFeature&&self.options.keyboardOptions.disableFeature.indexOf(type)>=0) hasFeature=false;
        return hasFeature;
    }
    this.removeImage=function(id){
        if(self.images.order.indexOf(id)>=0){
            self.images.order.splice(self.images.order.indexOf(id),1);
            if(self.images.list[id]) delete self.images.list[id];
            if(!self.images.order.length){
                self.setCantAdd(0);
                //clear 
                self.clearImages();
            }
        }
    }
    this.hasImage=function(){
        if(self.images.order.length) return true;
        return false;
    }
    this.getImages=function(){
        var data={
            list:{},
            order:[]
        }
        if(self.images.order.length){
            imgs=[];
            $.each(self.images.order,function(i,v){
                data.order.push(v);
                data.list[v]={
                    pic:self.images.list[v]
                }
            });
        }
        return data;
    }
    this.addImage=function(id,img){
        if(img){
            if(self.images.order.indexOf(id)==-1) self.images.order.push(id);
            self.images.list[id]=img;
        }else{
            self.images.order.push(id);
        }
    }
    this.isUploadingImage=function(){
        var uploading=false;
        $.each(self.images.order,function(i,v){
            if(!self.images.list[v]) uploading=true;
        })
        return uploading;
    }
    this.ensureFocus=function(){
        if(window.Keyboard&&Keyboard.isVisible){
            self.keepFocus=1;
        }else{
            self.keepFocus=0;
        }
    }
    this.showTools=function(){
        if(self.toolsShowing) return false;
        opts.ele.find('.advancedtools').render({
            template:'keyboard_advanced',
            data:{
                web:(modules.tools.isWebLayout())?1:0
            },
            binding:function(ele){
                self.toolsShowing=true;
                if(ele.find('.x_photo').length) self.bindPhotos(ele.find('.x_photo'));
                if(ele.find('.x_camera').length) self.bindCamera(ele.find('.x_camera'));
                if(ele.find('.x_video').length) self.bindVideo(ele.find('.x_video'));
                if(ele.find('.x_audio').length) self.bindAudio(ele.find('.x_audio'));
                ele.find('.x_money').stap(function(){
                    self.ensureKeyboardHidden(function(){
                        self.hideTools(1);
                        self.showMoney();
                    });
                },1,'tapactive')
                ele.find('.x_filter').stap(function(){
                    self.renderFilter();
                },1,'tapactive')
                ele.find('.x_event').stap(function(){
                    self.hideTools();
                    self.setHeight();
                    self.showCalendar();
                },1,'tapactive')
                ele.find('.x_clear').stap(function(){
                    self.hideTools();
                    self.setCantAdd(0);
                    self.setHeight();
                    self.setHeader();
                },1,'tapactive')
            }
        });
        self.setCantAdd(1);
        //self.setHeight();
    }
    this.setFilter=function(type,name){
        self.filter=type;
        self.infinitescroll.options.opts.filter=self.filter;
        self.infinitescroll.reload(function(){
            self.scrollToBottom(0);
        });//reload with new filter!
        //render filter area
        self.keyboardele.find('.filterarea').html('');
        self.keyboardele.find('.filtername').render({
            template:'keyboard_filtername',
            data:{
                name:name
            },
            binding:function(ele){
                ele.find('.x_clear').stap(function(){
                    self.clearFilter();
                },1,'tapactive')
            }
        })
        self.setHeight();
        self.setCantAdd(1);
    }
    this.isActive=function(){
        //determin if textarea has focus
        return self.isWindowActive;
    }
    this.clearFilter=function(){
        self.filter=false;
        self.toolsShowing=false;
        if(self.infinitescroll.options.opts.filter) delete self.infinitescroll.options.opts.filter
        self.infinitescroll.reload(function(){
            self.scrollToBottom(0);
        });//reload with new filter!
        self.keyboardele.find('.filtername').html('');
        self.setHeight();
        self.setCantAdd(0);
    }
    this.renderFilter=function(){
        self.hideTools(1);
        self.keyboardele.find('.filterarea').render({
            template:'keyboard_filter',
            binding:function(ele){
                ele.find('.x_back').stap(function(){
                    self.keyboardele.find('.filterarea').html('');
                    self.toolsShowing=false;
                    self.showTools();
                },1,'tapactive')
                ele.find('.x_done').stap(function(){
                    self.hideTools();
                },1,'tapactive')
                ele.find('.x_filter').stap(function(){
                    self.setFilter($(this).attr('data-type'),$(this).attr('data-name'));
                },1,'tapactive')
                ele.find('.x_clear').stap(function(){
                    self.keyboardele.find('.filterarea').html('');
                    self.setCantAdd(0);
                    self.setHeight();
                    self.setHeader();
                },1,'tapactive')
            }
        })
        self.setHeight();
    }
    this.hideTools=function(skip){
        self.keyboardele.find('.filterarea').html('');
        opts.ele.find('.advancedtools').html('');
        if(!skip){
            self.setCantAdd(0);
            self.toolsShowing=false;
        }
        self.setHeight();
        self.setHeader();
    }
    this.bindVideo=function(ele){
        if(self.modules.video) self.modules.video.destroy();
        self.modules.video=new modules.video({
            ele:ele,
            transcode:{},//transcode settings!
            data:{
                path:'/video/'
            },
            onProgress:function(p,fileobj){
                //self.postele.find('.progbar').css('width',(p*.95)+'%');
            },
            onClick:function(){
                modules.keyboard_global.hide();
            },
            onError:function(fileobj,err){
                //if(app.isdev) _alert(err);
                modules.toast({
                    content:err,
                    icon:'icon-warning-sign',
                    remove:3000
                });
            },
            onUploadStart:function(){
                //_alert('uploadstart')
                // self.postele.find('.mediaselector').hide();
            },
            onPreviewReady:function(data,fileobj){
                opts.ele.data('view','video');
                self.videodata={};
                self.videodata.type='video';
                //_alert('previewready')
                self.videodata.data={
                    uri:data,
                    ext:fileobj.ext
                };
                self.hideTools();
                self.renderPreviewVideo(self.keyboardele);
            },
            onSuccess:function(data,resp,fileobj){
                
            }
        });
    }
    this.modules={}
    this.bindAudio=function(ele){
        ele.stap(function(){
            //present audio capture
            if(self.audioShowing){
                self.keyboardele.find('.keyboardheader').show();
                self.keyboardele.find('.keyboard_web_extra').show();
                self.audioShowing=false;
                self.clearAudio();
                self.setHeight();
                self.modules.audio.destroy();
                self.modules.audio=false;
            }else{
                self.audioShowing=true;
                self.keyboardele.find('.keyboardheader').hide();
                self.keyboardele.find('.keyboard_web_extra').hide();
                self.modules.audio=new modules.media_capture({
                    ele:self.keyboardele.find('.audiopreviewarea'),
                    onStart:function(){
                       self.setHeight(); 
                    },
                    onSave:function(){
                        self.audioShowing=false;
                        self.keyboardele.find('.keyboardheader').show();
                        self.keyboardele.find('.keyboard_web_extra').show();
                        self.clear();//submitted
                    },  
                    onHide:function(){
                        self.keyboardele.find('.keyboardheader').show();
                        self.keyboardele.find('.keyboard_web_extra').show();
                        self.audioShowing=false;
                        self.setHeight();
                    },
                    onDestroy:function(){
                        self.keyboardele.find('.keyboardheader').show();
                        self.keyboardele.find('.keyboard_web_extra').show();
                        self.audioShowing=false;
                        self.setHeight();
                    },
                    getProcessData:function(){
                        var data=self.getTextAreaValue();
                        data.room=opts.room;
                        data.by=self.getIdentity().id;
                        return {
                            type:'chat',
                            data:data
                        }
                    }
                });
                self.modules.audio.show();
                self.setHeight();
            }
        },1,'tapactive')
    }
    this.bindEmoji=function(ele,reload){
        if(!window.EmojiButton){
            ele.hide();
            if(!reload) setTimeout(function(){
                self.bindEmoji(ele,1);
            },2000);
            return false;
        }
        ele.show();
        ele.stap(function(){
            var te=$(this);
            te.addClass('menushowing');
            var s=self.options.ele;
            if(self.options.keyboardOptions.overlayWebEmoji&&modules.tools.isWebLayout()){
                self.emojiPicker=new EmojiButton({
                    position:(self.options.keyboardOptions.overlayWebEmojiPlacement)?self.options.keyboardOptions.overlayWebEmojiPlacement:'bottom-start',
                    rootElement:self.getScroller().parent()[0],
                    autoHide:false,
                    positionFixed:true,
                    onHide:function(){
                        te.removeClass('menushowing');
                        self.emojiPicker=false;
                    }
                });
                self.emojiPicker.on('emoji',function(emoji){
                    self.insertAtCursor(emoji);
                })
                self.emojiPicker.showPicker(te[0]);
            }else{
                var s=self.getScroller().parent();
                if(!self.emojiPicker){
                    s.append('<div class="sfit emojipickercontainer" style="z-index:100;color:black"><div class="keyboardpicker sfit"></div></div>');
                    self.epicker=s.find('.emojipickercontainer');
                    self.emojiPicker=new EmojiButton({
                        position:'bottom',
                        rootElement:s.find('.keyboardpicker')[0],
                        autoHide:false,
                        positionFixed:true,
                        onHide:function(){
                            self.epicker.remove();
                            te.removeClass('menushowing');
                            self.emojiPicker=false;
                        }
                    });
                    self.emojiPicker.on('emoji',function(emoji){
                        self.insertAtCursor(emoji);
                    })
                }
                if(self.emojiPicker.pickerVisible){
                    self.emojiPicker.hidePicker();
                }else{
                    self.emojiPicker.showPicker(s.find('.keyboardpicker')[0]);
                    self.setHeight();
                }
            }
        },1,'tapactive');
    }
    this.insertAtCursor=function(val){
        if(self.newtextarea){
            self.newtextarea.insertAtCursor(val);
        }else{
            var cp=self.textarea.caret();
            self.setTextAreaValue(self.getTextAreaValue().content.insertAt(cp,val));
            self.textarea.caret(cp+val.length);
        }
    } 
    this.bindCamera=function(ele){
        if(self.modules.camera) self.modules.camera.destroy();
        self.modules.camera=new modules.imageuploader({
            ele:ele,
            apiurl:app.uploadurl,
            directUpload:0,
            phoneType:'camera',
            multiple:true,
            data:{
                sizes:['full','small'],
                path:'/img/',
                site:'nectar'
            },
            onError:function(msg,obj){
                modules.toast({
                    content:msg,
                    remove:2500,
                    icon:'icon-warning-sign'
                });
            },
            onPreviewReady:function(data,obj){//render preview
                self.hideTools();
                self.renderPreviewImage(self.keyboardele,obj.id,data);
                self.setHeight();
                self.log('preview ready!')
            },
            onProgress:function(p,obj){
                self.setUploadProgress(self.keyboardele,obj.id,p);
                self.log('onprogress ['+p+']!')
            },
            onClick:function(){
                //if(!app.onlyMembers()) return false;
                self.clearSearch();
                self.ensureFocus();
            },
            onUploadStart:function(){
            },
            onSuccess:function(obj,resp){
                self.setUploadProgress(self.keyboardele,obj.id,100,1);
                  var img={
                      path:resp.path,
                      ext:resp.ext,
                      ar:resp.ar
                  };
                  self.addImage(obj.id,img);
            }
        });
    }
    this.bindPhotos=function(ele){
        ele.addClass('_stap')
        if(self.modules.multiimage) self.modules.multiimage.destroy();
        self.modules.multiimage=new modules.multiimage({
            ele:ele,
            data:{
                sizes:['full','small'],
                path:'/img/'
            },
            onPreviewReady:function(data,obj){//render preview
                self.hideTools();
                self.renderPreviewImage(self.keyboardele,obj.id,data);
                self.setHeight();
                self.log('preview ready!')
            },
            onProcessStart:function(fileobj,clearcb){
                // self.filestats[fileobj.id].status='uploading';
                // self.filestats[fileobj.id].clearcb=clearcb;
            },
            onProgress:function(p,obj){
                self.setUploadProgress(self.keyboardele,obj.id,p);
                self.log('onprogress ['+p+']!')
            },
            onClick:function(){
                //if(!app.onlyMembers()) return false;
                self.clearSearch();
                self.ensureFocus();
            },
            onError:function(obj){
                self.setUploadProgress(self.keyboardele,obj.id,-1);
                modules.toast({
                    content:'Error Processing Image',
                    remove:2500,
                    icon:'icon-warning-sign'
                });
            },
            onSuccess:function(data,resp,obj){
                console.log('success!?!');
                self.setUploadProgress(self.keyboardele,obj.id,100,1);
                var img={
                    path:resp.path,
                    ext:resp.ext,
                    ar:resp.ar
                };
                self.addImage(obj.id,img);                
            }
        })
    }
    this.loadCommentIdentity=function(){
        if(self.options.enableIdentity){
            self.currentCommentIdentity=app.user.getIdentity().data;
            return self.currentCommentIdentity
        }else{
            self.currentCommentIdentity=false;
            return false;
        }
    }
    this.changeIdentity=function(ele){
        var identities=self.getIdentities();
        if(identities.length>1){
            var alert=new modules.alertdelegate({
                display:{
                    ele:ele,
                    container:self.getScroller(),
                    locations:['bottomleft']
                },
                menu:identities,
                render_template:'modules_mobilealert_identity',
                onEndAnimationSelect:function(id,data){
                    self.setIdentity(data);
                }
            });
            alert.show();
        }
    }
    this.setIdentity=function(data){
        self.currentCommentIdentity=data;
        self.keyboardele.find('.x_identity').css('backgroundImage','url('+modules.tools.getImg(data.pic,'small')+')');
    }
    this.getIdentities=function(){
        var identities=[];
        identities.push({
            id:app.user.profile.id,
            name:app.user.profile.name,
            pic:app.user.profile.pic,
            selected:(self.currentCommentIdentity.id==app.user.profile.id)?1:0
        })
        if(app.user.profile.pages){
            $.each(app.user.profile.pages.order,function(i,v){
                var id=$.extend(true,{},app.user.profile.pages.list[v]);
                if(id.id==self.currentCommentIdentity.id) id.selected=1;
                identities.push(id);
            })
        }
        return identities;
    }
    this.bindMention=function(ele){
        ele.stap(function(e){
            phi.stop(e);
            modules.keyboard_global.preventHide();
            self.newtextarea.startAt();
        },1,'tapactive');
    }
    this.getFeatures=function(){
        var types=['extra','mention','photos','camera','emoji'];
        var features=[];
        $.each(types,function(i,v){
            if(self.hasFeature(v)) features.push(v);
        })
        return features;
    }
    this.putMessageInRetry=function(data){
        if(data.tempid){
            var rele=self.getRenderArea();
            rele.find('[data-tempid='+data.tempid+']').find('.x_retry').find('i').removeClass('animate-spin');
            if(!rele.find('[data-tempid='+data.tempid+']').hasClass('retrymode')){
                rele.find('[data-tempid='+data.tempid+']').addClass('retrymode');
                rele.find('[data-tempid='+data.tempid+']').data('retrydata',data);
                rele.find('[data-tempid='+data.tempid+']').find('.x_retry').stap(function(){
                    $(this).find('i').addClass('animate-spin');
                    self.send(rele.find('[data-tempid='+data.tempid+']').data('retrydata'))
                },1,'tapactive')
            }else{
                rele.find('[data-tempid='+data.tempid+']').find('.retrymessage').shake();
            }
        }
    }
    this.send=function(retryData){
        if(!app.user.socket._connected){
            modules.toast({
                icon:'icon-tower',
                type:'danger',
                content:'Chat is currently offline, please try again soon.'
            })
            return false;
        }
        if(!app.user.getId()){
            app.user.promptLogin();
            return false;
        }
        if(self.emojiPicker&&self.emojiPicker.pickerVisible){
            self.emojiPicker.hidePicker();
        }
        // if(!app.user.profile){
        //     return app.onlyMembers();
        // }
        if(!retryData) var data=self.getData(opts);
        else var data=retryData;
        if(!data) return false;
        if(self.options.keyboardOptions.keepFocusOnSend){
            if(isPhoneGap()){
                modules.keyboard_global.preventHide();
                self.textarea.one('blur',function(){
                    self.textarea.focus();
                    if(self.options.keyboardOptions&&self.options.keyboardOptions.disableNewMessageScroll){
                    }else{
                        if(data.parent) self.scrollToElement(self.getRenderArea().find('[data-tempid='+data.tempid+']'),100);
                        else self.scrollToBottom(0);
                    }
                })
            }
        }else{
            self.ensureKeyboardHidden(function(){
                if(self.options.keyboardOptions&&self.options.keyboardOptions.disableNewMessageScroll){
                }else{
                    if(data.parent) self.scrollToElement(self.getRenderArea().find('[data-tempid='+data.tempid+']'),100);
                    else self.scrollToBottom(0);
                }
            });
        }
        if(!self.options.keyboardOptions.keepFocusOnSend) modules.keyboard_global.hide();
        if(self.lastTypeUpdate) clearTimeout(self.lastTypeUpdate);//will enable
        self.clear(function(){
            setTimeout(function(){//hack for voice dictation
                if(self.newtextarea){//this text area seems ok
                    //self.newtextarea.clear(false,1);
                }else{
                    opts.ele.find('textarea').val('');
                    opts.ele.find('textarea').css('height','30px');//reset height
                    self.setHeight();
                }
            },200);
            opts.ele.find('textarea').val('');
            opts.ele.find('textarea').css('height','30px');//reset height
            self.setHeight();
            if(opts.onSubmit) opts.onSubmit(data);
            else{//default
                var rdata=$.extend(true,{},data,{
                    user:self.getIdentity()
                })
                if(!retryData) self.renderMessage(self.getRenderArea(),rdata);
            }
            if(opts.onUpdate) opts.onUpdate(data);
            if(opts.keyboardOptions&&opts.keyboardOptions.module){
                data.module=opts.keyboardOptions.module;
            }
            if(opts.keyboardOptions&&opts.keyboardOptions.endpoint){
                data.endpoint=opts.keyboardOptions.endpoint;
            }
            if(opts.keyboardOptions&&opts.keyboardOptions.endpoint_module){
                data.endpoint_module=opts.keyboardOptions.endpoint_module;
            }
            if(opts.keyboardOptions&&opts.keyboardOptions.special){
                data.special=opts.keyboardOptions.special;
            }
            if(data.module=='chat'){
                if(options.room[0]=='G'){
                    var tp=options.room.split('_');
                    data.module='page/'+tp[0];
                }
            }
            console.log(data);
            if(data.media&&data.media.type=='video'){
                console.log('background upload!',data)
            }else{
                app.user.socket.emit('message', data,function(){
                    self.putMessageInRetry(data);
                });
            }
            //opts.ele.toggleClass('force-redraw');
            // if(!self.options.keyboardOptions.keepFocusOnSend){
            //     self.ensureKeyboardHidden(function(){
            //         if(self.options.keyboardOptions&&self.options.keyboardOptions.disableNewMessageScroll){
            //         }else{
            //             if(data.parent) self.scrollToElement(self.keyboardele.find('.chatarea').find('[data-tempid='+data.tempid+']'),100);
            //             else self.scrollToBottom(0);
            //         }
            //     });
            // }else{
            //     // if(isPhoneGap()){
            //     //     modules.keyboard_global.preventHide();
            //     //     self.textarea.one('blur',function(){
            //     //         self.textarea.focus();
            //     //         if(self.options.keyboardOptions&&self.options.keyboardOptions.disableNewMessageScroll){
            //     //         }else{
            //     //             if(data.parent) self.scrollToElement(self.keyboardele.find('.chatarea').find('[data-tempid='+data.tempid+']'),100);
            //     //             else self.scrollToBottom(0);
            //     //         }
            //     //     })
            //     // }
            // }
        });
    }
    this.getTemplate=function(){
        var t=(self.options.keyboardOptions&&self.options.keyboardOptions.mode)?('keyboard_input_'+self.options.keyboardOptions.mode):'keyboard_input';
        if(self.options.keyboardOptions&&self.options.keyboardOptions.mode&&self.options.keyboardOptions.mode=='advanced'&&!isPhoneGap()){
            t+='_web';
        }
        return t;
    }
    this.serviceDecline=function(e,container,target,data){
        var c=self.infinitescroll.getById(data.tid);
        if(opts.onAction) opts.onAction('serviceDecline',c.attachment.data);
    }
    this.servicePay=function(e,container,target,data){
        //_alert('servicePay')
        var c=self.infinitescroll.getById(data.tid);
        //bring up screen
        if(opts.onAction) opts.onAction('servicePay',c.attachment.data);
    }
    this.create=function(){
        if(!opts.backgroundClass) opts.backgroundClass='';
        self.start();
        var maxHeight=80;
        var scroller=self.getInitialScroller();
        var sh=scroller.height();
        maxHeight=sh*.4;
        if(maxHeight<80) maxHeight=80;
        if(maxHeight>200) maxHeight=200;
        if(opts.ele) opts.ele.render({
            template:self.getTemplate(),
            data:{
                maxHeight:maxHeight+'px',
                features:self.getFeatures(),
                identity:self.loadCommentIdentity(),
                placeholder:(opts.placeholder)?opts.placeholder:'Enter Text...',
                backgroundClass:opts.backgroundClass,
                keyboardOptions:self.options.keyboardOptions,
                room:(options.room)?options.room:'',
                mode:(self.options.keyboardOptions&&self.options.keyboardOptions.mode)?self.options.keyboardOptions.mode:'full'
            },
            binding:function(ele){
            	self.keyboardele=ele;
                self.textarea=self.keyboardele.find('textarea');
                opts.ele.data('view','text');
                ele.find('.x_identity').stap(function(){
                    self.changeIdentity($(this));
                },1,'tapactive')
                modules.tools.onHover(ele.find('.x_identity'),function(te){
                    self.changeIdentity(te);  
                })
                ele.find('.x_send').stap(function(e){
                    self.send();
                },1,'tapactive');
                if(self.hasFeature('extra')){
                    ele.find('.x_clearapp').stap(function(){
                        self.setHeader(false,true);
                        self.closeExtraNav(function(){
                            //self.setHeader(false,true);
                        })
                    },1,'tapactive')
                    ele.find('.x_showtools').stap(function(){
                        self.showTools();
                    },1,'tapactive')
                    ele.find('.x_hidetools').stap(function(){
                        self.hideTools();
                    },1,'tapactive')
                    self.textarea.on('blur',function(){
                        if(self.keepFocus){
                            self.focus();
                            self.keepFocus=false;
                        }
                        return false;
                    });
                    ele.find('.x_money').stap(function(e){
                        phi.stop(e);
                        self.ensureKeyboardHidden(function(){
                            self.showMoney();
                        });
                    },1,'tapactive')
                    ele.find('.x_calendar').stap(function(){
                        self.ensureKeyboardHidden(function(){
                            self.showCalendar();
                        });
                    },1,'tapactive')
                	// ele.find('.showextranav').stap(function(){
	                //     var t=$(this).attr('data-type');
	                //     if(opts.ele.hasClass('istyping')){
	                //         opts.ele.removeClass('istyping keyboardfullscreen')
	                //     }else if(opts.ele.hasClass('toolshowing')){
	                //         self.closeExtraNav(opts.ele,function(){//for more extra nav
	                //             switch(t){
	                //                 case 'money':
	                //                     self.showMoney();
	                //                 break;
	                //             }
	                //         });

	                //     }else{
	                //         //ensure keyboard is hidden!
	                //         self.ensureKeyboardHidden(function(){
	                //             switch(t){
	                //                 case 'more':
	                //                     self.showMore();
	                //                 break;
	                //                 case 'calendar':
	                //                     self.showCalendar();
	                //                 break;
	                //                 default:
	                //                     alert('feature coming soon!')
	                //                 break;
	                //             }
	                //         })
	                //     }
	                // },1,'tapactive');
                }
                if(self.hasFeature('camera')){
                    self.bindCamera(ele.find('.x_camera'));
                }
                if(self.hasFeature('emoji')){
                    self.bindEmoji(ele.find('.x_emoji'));
                }
                if(self.hasFeature('audio')){
                    self.bindAudio(ele.find('.x_audio'));
                }
                if(self.hasFeature('photos')){
                    self.bindPhotos(ele.find('.x_photo'));
                }
                if(self.hasFeature('mention')){
                    self.bindMention(ele.find('.x_at'));
                }
                if(self.hasFeature('video')){
                    self.bindVideo(ele.find('.x_video'));
                }
                self.setHeader();
            }
        });
		if(opts.infinitescroll){
			self.lasty=0;
            self.ctop=0;
            var sopts=opts.infinitescroll;
            if(!sopts.ele) sopts.ele=opts.scrollele.children().first();
            if(!sopts.scroller) sopts.scroller=opts.scrollele;
            sopts.datakey='_id';
            sopts.onLoad=function(resp){//once loaded, set last read!
            	if(resp.data&&resp.data.order&&resp.data.order.length&&opts.readReceipts){
            		self.setRead(resp.data.order[0]);
            	}
            }
            sopts.isFeed=function(){return 1};
            sopts.onFirstLoad=function(resp){
                if(opts.keyboardOptions.scrollToBottom){
                    self.scrollToBottom(0);
                }
                if(self.messageTrace) messageTrace('keyboard','sopts.onFirstLoad');
            }
            if(opts.asyncLoad) sopts.asyncLoad=true;
            if(self.options.debug) sopts.debug=true;
            sopts.opts.identity=self.getIdentity();
            if(!sopts.renderData) sopts.renderData={};
            sopts.renderData=$.extend(true,{},{
                container:{
                    width:sopts.scroller.find('.chatarea').width(),
                    height:sopts.scroller.height()
                }
            })
            //sopts.context=self;
            self.infinitescroll=new modules.infinitescroll(sopts);
            self.scroller=self.infinitescroll.scroller;
		}else if(options.scroller){
            self.scroller=options.scroller;
        }else{
			//initialize infinite scroller!!
            var ropts={forceNative:true,hideKeyboardOnScroll:true}
            var sopts={};
            if(self.options.swipeContainer){
                ropts.swipeContainer=self.options.swipeContainer
            }
	        if(opts.scrollele) self.scroller=new modules.scroller(opts.scrollele,ropts,sopts);
	        if(opts.keyboardOptions.scrollToBottom){
	            self.scrollToBottom(0);
	        }
	    }
        if(self.options.timeToggle){
            var scroller=self.getScroller();
            if(scroller){
                var lts={};
                var lte={};
                var cts={};
                var moved=false;
                var events=('ontouchstart' in document.documentElement)?'touchstart touchend touchmove _tap':'mouseup';
                scroller.on(events,function(e){
                    if(e.type=='touchstart'){
                        lts={t:new Date().getTime(),coords:modules.tools.touchEvent.getCoords(e)};
                        cts={};
                        moved=false;
                    }
                    if(e.type=='mouseup'){
                        if(modules.prefs.get('chattimes')){
                            scroller.removeClass('showtimes');
                            modules.prefs.set('chattimes',0);
                        }else{
                            scroller.addClass('showtimes');
                            modules.prefs.set('chattimes',1);
                        }
                        return false;
                    }
                    if(e.type=='_tap'){
                        modules.tools.throttle('chat_click',false);
                    }
                    if(e.type=='touchmove'){
                        cts={t:new Date().getTime(),coords:modules.tools.touchEvent.getCoords(e)};
                    }
                    if(e.type=='touchend'){
                        lte={t:new Date().getTime()};
                        if(lts.t){
                            var diff=lte.t-lts.t;
                            if(lts&&cts.coords){
                                var info=modules.tools.touchEvent.getInfo(lts.coords,cts.coords);
                                if(info.dist>15) moved=true;
                            }
                            if(diff<250&&!moved){
                                modules.tools.throttle('chat_click',100,function(){//if after 100ms, a _tap hasnt bubbled up, go ahead and toggle times
                                    if(window.Keyboard&&Keyboard.isVisible){
                                        modules.keyboard_global.hide();
                                        return false;
                                    }
                                    if(modules.prefs.get('chattimes')){
                                        scroller.removeClass('showtimes');
                                        modules.prefs.set('chattimes',0);
                                    }else{
                                        scroller.addClass('showtimes');
                                        modules.prefs.set('chattimes',1);
                                    }
                                })
                            }
                        }
                    }
                })
                var cs=modules.prefs.get('chattimes');
                if(cs){
                    scroller.addClass('showtimes')
                }
            }else{
                console.warn('no scroller!?!')
            }
        }
	    if(self.options.readReceipts){
	    	self.loadRead();
	    }
        self.bindTextArea();//opts.asyncload
        self.setHeight();
        self.loaded=1;
    } 
    self.create();    
}