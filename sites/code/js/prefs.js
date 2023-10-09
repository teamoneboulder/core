modules.prefs={
    data:{},
    load:function(){
        modules.prefs.data=localStorage.getObject('prefs');
        modules.exp_prefs.load();
    },
    clear:function(){
        modules.prefs.data={};
        localStorage.setObject('prefs',modules.prefs.data);
    },
    get:function(id,def){
        return (modules.prefs.data[id])?modules.prefs.data[id]:((def)?def:false);
    },
    delete:function(id){
        if(modules.prefs.data[id]){
            delete modules.prefs.data[id];
            localStorage.setObject('prefs',modules.prefs.data);
        }
    },
    set:function(id,data){
        modules.prefs.data[id]=data;
        localStorage.setObject('prefs',modules.prefs.data);
    }
};
modules.exp_prefs={
    data:{},
    load:function(){
        modules.exp_prefs.data=localStorage.getObject('exp_prefs');
        var ct=new Date().getTime();
        for(var key in modules.exp_prefs.data){
            if(modules.exp_prefs.data[key].expires<=ct){
                console.log('data expired, clear it!');
                delete modules.exp_prefs.data[key];
            }
        }
        localStorage.setObject('exp_prefs',modules.exp_prefs.data);
    },
    clear:function(){
        modules.exp_prefs.data={};
        localStorage.setObject('exp_prefs',modules.exp_prefs.data);
    },
    get:function(id){
        if(modules.exp_prefs.data[id]){
            if(modules.exp_prefs.data[id].expires>new Date().getTime()){
                return modules.exp_prefs.data[id].data;
            }else{
                console.log('data expired, clear it!');
                delete modules.exp_prefs.data[id];
                localStorage.setObject('exp_prefs',modules.exp_prefs.data);
                return false;
            }
        }
        return false;
    },
    delete:function(id){
        if(modules.exp_prefs.data[id]){
            delete modules.exp_prefs.data[id];
            localStorage.setObject('exp_prefs',modules.exp_prefs.data);
        }
    },
    set:function(id,data,exp){
        if(!exp) return console.warn('Expiration time required');
        if(exp<new Date().getTime()) return console.warn('Expiration time before current time, dont save');
        modules.exp_prefs.data[id]={
            data:data,
            expires:exp
        }
        localStorage.setObject('exp_prefs',modules.exp_prefs.data);
    }
};