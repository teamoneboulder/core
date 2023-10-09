if(!window.modules) window.modules={};
modules.notice_global={
    shouldShowToast:function(messagedata){
        if(app.isdev) console.log(messagedata)
        if(messagedata&&messagedata.page&&messagedata.page.module){
            switch(messagedata.page.module){
                case 'post':
                    if(messagedata.page.data.post_id&&messagedata.page.data.post_id==modules.viewdelegate.getCurrentView()){
                        return false;
                    }
                break;
                case 'chat':
                    //profile chat
                    if(!messagedata.page.data.page&&messagedata.page.data.people.length==1&&messagedata.page.data.people[0]==modules.viewdelegate.getCurrentView()){//single user
                        return false;
                    }
                    //group chat
                    if(messagedata.page.data.id&&messagedata.page.data.id==modules.viewdelegate.getCurrentView()){
                        return false;
                    }
                    //check web chat
                    if(app.home.chatmanager&&app.home.chatmanager.hasChat(messagedata.page.data.id)){
                        if(app.home.chatmanager.isActive(messagedata.page.data.id)){
                            console.log('isactive!')
                        }else{
                            console.log('showing but not active')
                        }
                        return false;
                    }
                    //check page thread too!!!!
                    if(messagedata.page.data.page&&modules.viewdelegate.getCurrentView()==messagedata.page.data.page){
                        //same page and same thread?
                        var view=modules.viewdelegate.getView(messagedata.page.data.page);
                        if(view.pages.threads.cpage&&view.pages.threads.cpage==messagedata.page.data.id){
                            return false;
                        }
                    }
                break;
                case 'connection':
                    if(messagedata.page.data.post_id&&messagedata.page.data.post_id==modules.viewdelegate.getCurrentView()){
                        return false;
                    }
                break;
                case 'fb_import':
                    if('fb_import'==modules.viewdelegate.getCurrentView()){
                        return false;
                    }
                break;
                case 'profile':
                break;
                case 'event':
                    if(messagedata.page.data.id&&messagedata.page.data.id==modules.viewdelegate.getCurrentView()){
                        return false;
                    }
                break;
                case 'fundraiser':
                    if(messagedata.page.data.id&&messagedata.page.data.id==modules.viewdelegate.getCurrentView()){
                        return false;
                    }
                break;
                case 'page':
                    if(messagedata.page.data.id&&messagedata.page.data.id==modules.viewdelegate.getCurrentView()){
                        return false;
                    }
                break;
                case 'rating':
                    if(messagedata.page.data.id&&'review_'+messagedata.page.data.id==modules.viewdelegate.getCurrentView()){
                        return false;
                    }
                break;
                default:
                    if(messagedata.page.module==modules.viewdelegate.getCurrentView()){
                        return false;
                    }
                break;
            }
        }else{
            if(messagedata) onerror('invalid post message ['+JSON.stringify(messagedata)+']');
            else onerror('invalid blank message');
        }
        return true;
    },
    viewNotice:function(messagedata,activityFeed){
      // return  console.log(notice);
        var data=messagedata.page.data;
        if(!data) data={};
        //force hide keyboard!
        modules.keyboard_global.hide(false,1);//might not fire if prevent_hide prevents
        switch(messagedata.page.module){
            case 'connection':
                modules.viewdelegate.register(messagedata.page.module,{id:data.post_id,load:true,data:{id:data.post_id}});
            break;
            case 'profile':
                if(data.reflection){
                    modules.viewdelegate.register('profile',{
                        id:app.user.profile.id,
                        data:{
                            id:app.user.profile.id,
                            view:{
                                type:'reflection',
                                data:data.reflection
                            }
                        }
                    });
                }else{
                    modules.viewdelegate.register(messagedata.page.module,{id:data.id,data:{id:data.id}});
                }
            break;
            case 'event':
                modules.viewdelegate.register(messagedata.page.module,{id:data.id,data:{id:data.id}});
            break;
            case 'fundraiser':
                modules.viewdelegate.register(messagedata.page.module,{id:data.id,data:{id:data.id}});
            break;
            case 'page':
                var opts={id:data.id,data:{id:data.id}};
                if(messagedata.page.state) opts.state=messagedata.page.state;
                modules.viewdelegate.register(messagedata.page.module,opts);
            break;
            case 'reviews':
                modules.viewdelegate.register(messagedata.page.module,{id:'review_'+data.id,data:{id:data.id,context:'page'}});
            break;
            case 'post':
                modules.viewdelegate.register(messagedata.page.module,{id:data.post_id,load:true,data:{id:data.post_id}});
            break;
            case 'stream_browse':
                //_alert('here')
                if(!activityFeed){//show full view
                    modules.viewdelegate.register(messagedata.page.module,{id:data.id,data:data});
                }else{//show condesned view (from notification feed)
                    if(modules.viewdelegate.getCurrentView()){
                        modules.viewdelegate.register('stream_browse',{
                            id:messagedata.page.data.id,
                            data:$.extend(true,{},{noDistance:true},messagedata.page.data)
                        });
                    }else{
                        modules.viewdelegate.register('stream_browse',{
                            id:messagedata.page.data.id,
                            data:$.extend(true,{},{noDistance:true},messagedata.page.data)
                        },false,1)
                    }
                }
            break;
            case 'chat':
                if(data.people.indexOf(app.user.profile.id)>=0){
                    data.people.splice(data.people.indexOf(app.user.profile.id),1);
                }
                if(app.isWebLayout()){
                    if(data.thread){
                        modules.viewdelegate.register('page',$.extend(true,{},{
                            id:data.page,
                            data:data.page_info,
                            state:'/threads/'+data.id
                        }));
                    }else{
                        app.home.chatmanager.add(data);
                    }
                }else{
                    if(data.thread){
                        modules.viewdelegate.register('page',$.extend(true,{},{
                            id:data.page,
                            data:data.page_info,
                            state:'/threads/'+data.id
                        }));
                    }else if(data.people.length==1&&!data.page){
                        modules.viewdelegate.register('profile',$.extend(true,{},{
                            id:data.id,
                        },{
                            page:'chat',
                            data:data.people_list[data.people[0]]
                        }));
                    }else{
                        modules.viewdelegate.register('chat',$.extend(true,{},{
                        },data));
                    }
                }
            break;
            case 'fb_import':
                if(modules.viewdelegate.getCurrentView()){
                    modules.viewdelegate.register('fb_import',{id:'fb_import',data:{}});
                }else{
                    modules.viewdelegate.register('fb_import',{
                        id:'fb_import',
                        data:{}
                    },false,1)
                }
            break;
            case 'affiliate':
                if(modules.viewdelegate.getCurrentView()){
                    modules.viewdelegate.register('affiliate',{id:'affiliate',data:data})
                }else{
                    modules.viewdelegate.register('affiliate',{
                        id:'affiliate',
                        data:data
                    },false,1)
                }
            break;
            case 'bank':
                if(modules.viewdelegate.getCurrentView()){
                    modules.viewdelegate.register('bank',{id:'bank',data:data})
                }else{
                    modules.viewdelegate.register('bank',{
                        id:'bank',
                        data:data
                    },false,1)
                }
            break;
            default:
                modules.viewdelegate.register(messagedata.page.module,{id:messagedata.data.id,data:messagedata.data});
            break;
        }
    },
    getNoticePicture:function(notice){
        var pic='';
        switch(notice.type){
            case 'fb_friend_added':
                pic=notice.data.users.list[notice.data.users.order[0]].pic;
            break;
            case 'ticket_purchase':
            case 'ticket_guestlist':
                pic=(notice.notice.data.from.pic)?notice.notice.data.from.pic:notice.notice.data.from.name[0];
            break;
            default:
                pic=notice.data.from.from;
            break;
        }
        return pic;
    },
    getNoticeMessage:function(notice){
        var self=this;
        var msg='';
        if(notice.data&&notice.data.override_message){
            return notice.data.override_message;
        }
        switch(notice.type){
            case 'facebook_friends_first':
                if(notice.data.total){
                    msg='We found '+notice.data.total+' of your facebook friends using Nectar!';
                }else{
                    msg='We didnt find any facebook friends yet';
                }
            break;
            case 'support_donation':
                if(notice.data.reservation){
                    msg='<div><span class="bold">'+notice.data.from.name+'</span> sent you $'+modules.tools.toMoney(notice.data.reservation.amount)+' in support</div>';
                }
            break;
            case 'ticket_purchase':
                if(notice.data.reservation){
                    var tt=(notice.data.reservation.tickets.length==1)?'1 ticket':notice.data.reservation.tickets.length+' tickets';
                    msg='<div><span class="bold">'+notice.data.from.name+'</span> purchased '+tt+' for $'+modules.tools.toMoney(notice.data.reservation.amount)+' to the event <span class="bold">'+notice.data.event.name+'</span></div>';
                }
            break;
            case 'ticket_guestlist':
                if(notice.data.reservation){
                    var tt=(notice.data.reservation.tickets.length==1)?'1 ticket was':notice.data.reservation.tickets.length+' tickets were';
                    msg='<div>'+tt+' added for <span class="bold">'+notice.data.from.name+'</span> on the Guest List for the event <span class="bold">'+notice.data.event.name+'</span></div>';
                }
            break;
            case 'new_group_thread':
                msg='<div><span class="bold">'+notice.data.from.name+'</span> added the thread "'+notice.data.thread_info.name+'" to the group <span class="bold">'+notice.data.page_info.name+'</span></div>';
            break;
            case 'group_invite_internal':
                msg='<div><span class="bold">'+notice.data.from.name+'</span> invited you to join the group <span class="bold">'+notice.data.page.name+'</span></div>';
            break;
            case 'bank_transaction':
                msg='<div><span class="bold">'+notice.data.from.name+'</span> just sent you <span class="bold">$'+modules.tools.toMoney(notice.data.transaction.amount)+'</span></div><div style="padding-top:5px;background:#fafafa;" class="s-corrner-all">'+notice.data.transaction.description+'</div>';
            break;
            case 'oracle_invite':
                msg='Congratulations!  You have been invited to be an Oracle in the Nectar Pollinator Program!';
            break;
            case 'oracle_upgrade':
                msg='Congratulations!  You have been promoted to an Oracle in the Nectar Pollinator Program!';
            break;
            case 'audio_upload_chat':
                msg='Your audio is done processing!';
            break;
            case 'video_upload_chat':
            case 'video_upload':
                msg='Your video is done processing!';
            break;
            case 'post_page_mention':
                msg='<span class="bold">'+notice.data.from.name+ '</span> mentioned your page in their post!';
            break;
            case 'page_follow':
                msg='<span class="bold">'+notice.data.from.name+ '</span> followed your page!';
            break;
            case 'page_rating':
                msg='<span class="bold">'+notice.data.from.name+ '</span> reviewed your page!';
            break;
            case 'comment_mention':
                if(notice.data.page){
                    msg='<span class="bold">'+notice.data.from.name+ '</span> mentioned your page in a comment!';
                }else{
                    msg='<span class="bold">'+notice.data.from.name+ '</span> mentioned you in a comment!';
                }
            break;
            case 'page_admin_add':
                msg='<span class="bold">'+notice.data.from.name+ '</span> added you as a admin to <span class="bold">'+notice.data.page.name+'</span>!';
            break;
            case 'event_cohost_add':
                msg='<span class="bold">'+notice.data.from.name+ '</span> added you as a cohost to an event!';
            break;
            case 'event_timechange_going':
                msg='An event you are planning on going to changed its start time.';
            break;
            case 'event_timechange_interested':
                msg='An event you are interested in going to changed its start time.';
            break;
            case 'event_cancelled_interested':
                msg='<span class="bold">'+notice.data.from.name+ '</span> canceled an event you were interested in';
            break;
            case 'event_cancelled_going':
                msg='<span class="bold">'+notice.data.from.name+ '</span> canceled an event you planned on going to';
            break;
            case 'post_added_event_friend':
                msg='<span class="bold">'+notice.data.from.name+ '</span> added a post to an event your are going to!';
            break;
            case 'post_added_event_host':
                msg='<span class="bold">'+notice.data.from.name+ '</span> added a post to an event your are hosting!';
            break;
            case 'post_added_fundraiser_host':
                msg='<span class="bold">'+notice.data.from.name+ '</span> added a post to a fundraiser your are hosting!';
            break;
            case 'post_event_mention':
                msg='<span class="bold">'+notice.data.from.name+ '</span> mentioned you in their post on an event!';
            break;
            case 'comment_on_event':
                msg='<span class="bold">'+notice.data.from.name+ '</span> commented on a post you made in an event!';
            break;
            case 'event_rsvp':
                msg='<span class="bold">'+notice.data.from.name+'</span> rsvp\'d to your event!';
            break;
            case 'event_invite':
                msg='<span class="bold">'+notice.data.from.name+'</span> invited you to an event!';
            break;
            case 'referal_added':
                msg='<span class="bold">'+notice.data.user.name+'</span> just joined under your affiliate code!';
            break;
            case 'fb_token_dropped':
                msg='We hit a snag with your facebook linking, please re-link your Facebook account.';
            break;
            case 'fb_friend_added':
                if(notice.data.users){
                    if(notice.data.added.length==1){
                        var k=notice.data.users.order[0];
                        msg='<span class="bold">'+notice.data.fb_friend.list[k].name+'</span> is now on Nectar as <span class="bold">'+notice.data.users.list[k].name+'</span>!';
                    }else{
                        msg='We just imported '+(notice.data.users.order.length)+' of your FB friends to Nectar!';
                    }
                }else{
                    msg='We just imported '+(notice.data.added.length)+' of your FB friends to Nectar!'; 
                }
            break;
            case 'post_with':
                msg='<span class="bold">'+notice.data.from.name+ '</span> was with you in their post!';
            break;
            case 'connection_with':
                msg='<span class="bold">'+notice.data.from.name+ '</span> was with you in their connection post!';
            break;
            case 'connection_mention':
                msg='<span class="bold">'+notice.data.from.name+ '</span> mentioned you in their connection post!';
            break;
            case 'post_added':
                if(notice.data.page){
                     msg='<span class="bold">'+notice.data.from.name+ '</span> added a stream post to <b>'+notice.data.page.name+'</b>';
                }else{
                    msg='<span class="bold">'+notice.data.from.name+ '</span> added a stream post!';
                }
            break;
            case 'qotd_added':
                msg='<span class="bold">'+notice.data.from.name+ '</span> added a Question of the Day!';
            break;
            case 'post_mention':
                msg='<span class="bold">'+notice.data.from.name+ '</span> mentioned you in their post!';
            break;
            case 'comment_on_post_event':
                msg='<span class="bold">'+notice.data.from.name+ '</span> commented on your post in an event!';
            break;
            case 'comment_on_post':
                msg='<span class="bold">'+notice.data.from.name+ '</span> commented on your post!';
            break;
            case 'reply_to_comment_event':
                if(notice.data.to==notice.data.post_info.by.id){
                    var whos='your';
                }else{
                    var whos=notice.data.post_info.by.name+"'s";
                }
                msg='<span class="bold">'+notice.data.from.name+ '</span> replied to your comment on '+whos+' post in an event!';
            break;
            case 'reply_to_comment':
                if(notice.data.to==notice.data.post_info.by.id){
                    var whos='your';
                }else{
                    var whos=notice.data.post_info.by.name+"'s";
                }
                msg='<span class="bold">'+notice.data.from.name+ '</span> replied to your comment on '+whos+' post!';
            break;
            case 'comment_on_connection':
                msg='<span class="bold">'+notice.data.from.name+ '</span> commented on your connection post!';
            break;
            case 'reply_on_connection':
                msg='<span class="bold">'+notice.data.from.name+ '</span> replied to your comment!';
            break;
            case 'post_to_timeline':
                msg='<span class="bold">'+notice.data.from.name+ '</span> posted on your timeline!';
            break;
            case 'video_to_timeline':
                msg='<span class="bold">'+notice.data.from.name+ '</span> shared a video to your timeline!';
            break;
            case 'added_tags_to_post':
                msg='<span class="bold">'+notice.data.from.name+ '</span> added the tags'+self.getTags(notice.data.tags)+' to your post!';
            break;
            case 'comment_on_support_post':
                msg='<span class="bold">'+notice.data.from.name+ '</span> commented on your support post.';
            break;
            case 'reply_to_support_comment':
                msg='<span class="bold">'+notice.data.from.name+ '</span> replied to your comment on a support post.';
            break;
            case 'comment_on_feedback_post':
                msg='<span class="bold">'+notice.data.from.name+ '</span> commented on your feedback post.';
            break;
            case 'comment_on_their_feedback_post':
                msg='<span class="bold">'+notice.data.from.name+ '</span> commented on their feedback post.';
            break;
            case 'reply_to_feedback_comment':
                msg='<span class="bold">'+notice.data.from.name+ '</span> replied to your comment on a feedback post.';
            break;
            case 'feedback_assign':
                msg='<span class="bold">'+notice.data.from.name+ '</span> assigned you to a feedback post.';
            break;
            case 'support_assign':
                msg='<span class="bold">'+notice.data.from.name+ '</span> assigned you to a support post.';
            break;
            case 'reflection':
                msg='<span class="bold">'+notice.data.from.name+ '</span> added a reflection to your profile!';
            break;
            case 'reflection_update':
                msg='<span class="bold">'+notice.data.from.name+ '</span> updated a reflection on your profile!';
            break;
            default:
                msg='Invalid Notice Type ['+notice.type+']';
            break;
        }
        return msg;
    },
    getTags:function(tags){
        var ttags='';
        $.each(tags,function(i,v){
            if(i>0) ttags+=',';
            ttags+=' #'+v;
        })
        return ttags;
    },
    getNoticeIcon:function(notice){
        var icon={};
        switch(notice.type){
            case 'support_donation':
                icon.type='icon-hands_heart';
                icon.color=app.themeColor;
            break;
            case 'ticket_purchase':
                icon.type='icon-ticket';
                icon.color=app.themeColor;
            break;
            case 'referal_added':
                icon.type='icon-hummingbird_wider';
                icon.color=app.themeColor;
            break;
            case 'fb_friend_added':
                icon.type='icon-facebook-squared';
                icon.color=app.themeColor;
            break;
            case 'page_follow':
                icon.type='icon-rss';
                icon.color=app.themeColor;
            break;
            case 'page_rating':
                icon.type='icon-star-empty';
                icon.color=app.themeColor;
            break;
            case 'audio_upload_chat':
            case 'audio_upload':
                icon.type='icon-mic-outline';
                icon.color=app.themeColor;
            break;
            case 'video_upload_chat':
            case 'video_upload':
                icon.type='icon-videocam';
                icon.color=app.themeColor;
            break;
            case 'comment_mention':
            case 'post_page_mention':
                icon.type='icon-at';
                icon.color=app.themeColor;
            break;
            case 'page_admin_add':
                icon.type='icon-trust';
                icon.color=app.themeColor;
            break;
            case 'event_cohost_add':
                icon.type='icon-groups';
                icon.color=app.themeColor;
            break;
            case 'event_timechange_going':
            case 'event_timechange_going':
                icon.type='icon-real-time';
                icon.color=app.themeColor;
            break;
            case 'comment_on_post_event':
                icon.type='icon-chat';
                icon.color=app.themeColor;
            break;
            case 'reply_to_comment_event':
                icon.type='icon-chat';
                icon.color=app.themeColor;
            break;
            case 'event_cancelled_going':
                icon.type='icon-calendar';
                icon.color=app.themeColor;
            break;
            case 'event_cancelled_interested':
            case 'event_cancelled_going':
                icon.type='icon-calendar';
                icon.color=app.themeColor;
            break;
            case 'post_event_mention':
                icon.type='icon-chat';
                icon.color=app.themeColor;
            break;
            case 'event_rsvp':
                icon.type='icon-calendar';
                icon.color=app.themeColor;
            break;
            case 'post_added_event_friend':
                icon.type='icon-blog';
                icon.color=app.themeColor;
            break;
            case 'post_added_event_host':
                icon.type='icon-blog';
                icon.color=app.themeColor;
            break;
            case 'post_added_fundraiser_host':
                icon.type='icon-blog';
                icon.color=app.themeColor;
            break;
            case 'comment_on_event':
                icon.type='icon-chat';
                icon.color=app.themeColor;
            break;
            case 'event_invite':
                icon.type='icon-calendar';
                icon.color=app.themeColor;
            break;
            case 'comment_on_connection':
            case 'reply_on_connection':
                icon.type='icon-chat';
                icon.color=app.themeColor;
            break;
            case 'connection_mention':
            case 'connection_with':
                icon.type='icon-blog';
                icon.color=app.themeColor;
            break;
            case 'comment_on_feedback_post':
            case 'comment_on_their_feedback_post':
            case 'reply_to_feedback_comment':
            case 'feedback_assign':
                icon.type='icon-help-quote';
                icon.color=app.themeColor;
            break;
            case 'qotd_added':
                icon.type='icon-inspiration';
                icon.color=app.themeColor;
            break;
            case 'comment_on_support_post':
            case 'reply_to_support_comment':
            case 'support_assign':
                icon.type='icon-help-quote';
                icon.color=app.themeColor;
            break;
            case 'comment_on_post':
            case 'reply_to_comment':
                icon.type='icon-chat';
                icon.color=app.themeColor;
            break;
            case 'post_to_timeline':
            case 'post_mention':
            case 'post_with':
            case 'post_added':
                icon.type='icon-blog';
                icon.color=app.themeColor;
            break;
            case 'video_to_timeline':
                icon.type='icon-videocam';
                icon.color=app.themeColor;
            break;
            case 'added_tags_to_post':
                icon.type='icon-blog';
                icon.color=app.themeColor;
            break;
            case 'reflection':
            case 'reflection_update':
                icon.type='icon-eye';
                icon.color=app.themeColor;
            break;
        }
        return icon;
    }
}