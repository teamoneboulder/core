;function mobileCheck() {
    if( navigator.userAgent.match(/Android/i)
     || navigator.userAgent.match(/webOS/i)
     || navigator.userAgent.match(/iPhone/i)
     || navigator.userAgent.match(/iPad/i)
     || navigator.userAgent.match(/iPod/i)
     || navigator.userAgent.match(/BlackBerry/i)
     || navigator.userAgent.match(/Windows Phone/i)
     ){
        return true;
      }
     else {
        return false;
      }
};
window.isMobile=mobileCheck();
String.prototype.stripslashes=function() {
    var str=this;
  return (str + '')
    .replace(/\\(.?)/g, function(s, n1) {
      switch (n1) {
        case '\\':
          return '\\';
        case '0':
          return '\u0000';
        case '':
          return '';
        default:
          return n1;
      }
    });
}
$.fn.wire=function(bindings,data){
    this.each(function(ei,ev){
        var bo=$(ev);
        $.each(bindings,function(i,v){
            var obj=(v.selector)?bo.find(v.selector):bo;
            if(!v.type) v.type='click';//most used binding
            switch(v.type){
                case 'click':
                    obj.stap(v.binding,(!v.scrollable&&false)?0:1,'tapactive',v.dblclick);
                break;
                case 'fn':
                    v.binding(obj,data);
                break;
                default:
                    obj.on(v.type,v.binding);
                break;
            }
        });
    });
}
$.fn.render = function(options){
    try{
        var o=$.extend(true,{},{
            template:false,
            data:false,
            bindings:false,
            uid:Math.uuid(10,16),
            append:true,
            module:false,
            force:false,
            debug:0,
            wrap:'',
            returntemplate:false,
            returnhtml:false
        },options);
        o.data=$.extend(true,{},{
            template:o.template,
            uid:o.uid,
            _tid:o.uid
        },o.data);
        if(!this.length&&!options.returntemplate&&!options.returnhtml){
            console.warn('Element does not exist!')
            return false;
        }
        else o.data.isDeveloper=0;
        var template='';
        if($.fn.render.templates&&o.module&&$.fn.render.templates[o.module][o.template]) template=$.fn.render.templates[o.module][o.template];
        if(window.templates&&window.templates[o.template]) template=window.templates[o.template];
        else if($.fn.render.templates&&$.fn.render.templates[o.template]) template=$.fn.render.templates[o.template];
        if(o.module) o.data.uid=o.module+'_'+o.uid;
        var replacedWith=false;
        var hashData=false;
        try{
            if(template){
                if(o.returntemplate||o.returnhtml) return template.render(o.data);
                o.selector=(o.uid)?'[data-'+o.template+'="'+o.data._tid+'"]':false;
                if(hashData) var hash=JSON.stringify(o.data);
                else var hash='';
                var adata='';
                if(o.appendTemplate){
                    var appendTemplate='';
                    if($.fn.render.templates) appendTemplate=$.fn.render.templates[o.appendTemplate];
                    if(window.templates&&window.templates[o.appendTemplate]) appendTemplate=window.templates[o.appendTemplate];
                    if(appendTemplate) var adata=appendTemplate.render($.extend(true,{},{template:o.appendTemplate,_tid:Math.uuid(12)},(o.appendTemplateData)?o.appendTemplateData:{}))
                }
                var htmlcontent=template.render(o.data)+adata;
                if(o.wrap){
                    if(o.wrap=='div'){
                        o.selector='#'+o.uid;
                        htmlcontent='<div id="'+o.uid+'">'+htmlcontent+'</div>';
                    }
                }
                if(o.selector){
                    if(!this.find(o.selector).length){
                        if(o.debug) console.log('render');
                        if(o.append&&!o.prepend&&!o.after&&!o.replace) this.append(htmlcontent);
                        else if(o.prepend) this.prepend(htmlcontent);
                        else if(o.after) this.after(htmlcontent);
                        else if(o.replace){
                            var p=$(this).parent()
                            this.replaceWith(htmlcontent);
                            replacedWith=p.find(o.selector);
                        }
                        else this.html(htmlcontent);
                        //store the data in a hash
                        if(hashData) this.find(o.selector).data('hash',hash);
                    }else{
                        //only replace if data is changed
                        if(!hashData||this.find(o.selector).data('hash') != hash||o.force){
                            if(o.debug) console.log('replace');
                            //console.log(htmlcontent)
                            this.find(o.selector).replaceWith(htmlcontent);
                            if(hashData) this.find(o.selector).data('hash',hash);
                        }else{
                            if(o.debug) console.log('dont replace');
                            return this;
                        }
                    }
                }else{
                    if(o.append) this.append(template.render(o.data)+adata);
                    else this.html(template.render(o.data)+adata);
                }
            }else if(o.content){
                if(o.append&&!o.prepend&&!o.after&&!o.replace) this.append(o.content);
                else if(o.prepend) this.prepend(o.content);
                else if(o.after) this.after(o.content);
                else if(o.replace){
                    var p=$(this).parent()
                    this.replaceWith(o.content);
                    replacedWith=p.find(o.selector);
                }
                else this.html(o.content);
            }else{
                if(window.navigator.splashscreen) window.navigator.splashscreen.hide();
                alert('Template Error ['+o.template+']');
                return false;
            }
        }catch(e){
            return console.warn(e);
        }
        if(replacedWith){
            var ret=replacedWith
        }else{
            var ret=this.find(o.selector);
        }
        //var bo=(o.selector)?ret.find(o.selector):ret;
        if(o.binding){
            o.binding(ret,o.data);
        }
        if(o.bindings){
            ret.wire(o.bindings,o.data);
        }
        if(o.onUpdate) o.onUpdate();
        //bind any ui elements!
        ret.find('[link]').each(function(i,v){
            $(v).stap(function(){
                _.openLink({
                    intent:$(v).attr('link'),
                    type:$(v).attr('data-type')
                })
            },1,'tapactive')
        })
        if(window._ui){
            ret.find('[data-ui]').each(function(i,v){
                var id=$(v).attr('data-ui');
                var did=$(v).attr('id');
                if(window._ui[id]&&window._ui[id].bindings){
                    if(did&&o.data[did]){
                        $(v).wire(window._ui[id].bindings,o.data[did]);
                    }else{
                        $(v).wire(window._ui[id].bindings,o.data);
                    }
                }
            })
        }
        if(isPhoneGap()){
            ret.find('.wrappedlink').stap(function(e){
                _.openLink($(ret));
            },1,'tapactive')
        }else{
            ret.find('.wrappedlink').on('click',function(e){
                _.openLink($(ret));
            })
        }
        return ret;
    }catch(e){
        console.log(options)
        console.warn(e)
    }
};
$.fn.render.templates=window.templates;//link these or else will break

$.fn.render.loadTemplateUrl=function(url,cb){
    $.ajax({
        url:url,
        dataType:'text',
        crossDomain: true,
        success:function(resp){
            $.fn.render.loadTemplates(resp);
            cb(true);
        },
        error:function(){
            cb(false);
        }
    })
}
$.fn.render.getTemplate=function(tpl){
    if($.fn.render.templates&&$.fn.render.templates[tpl]) return $.fn.render.templates[tpl];
    if(window.templates&&window.templates[tpl]) return window.templates[tpl];
}
$.fn.render.loadTemplates=function(templs){
    var self=this;
    if(!$.fn.render.templates) $.fn.render.templates={};
    if(templs){
        var tpls=templs.split('@@@');
        var cn='';
        for (var i = 1; i <= tpls.length-1; i++) {
            if(i>0){
                if(i%2==1){ //name
                    cn=tpls[i];
                }else{
                    try{
                        window.templates[cn]=$.fn.render.templates[cn]=new EJS({text:tpls[i].stripslashes()});
                    }catch(e){
                        console.warn('error with template: ['+cn+'] ['+e.message+']');
                    }
                }
            }
        };
    }else{
        return false;
    }
    //$.fn.render.templates=templates;
};
$.fn.render.setTemplates=function(templates){
    $.fn.render.templates=templates;
};