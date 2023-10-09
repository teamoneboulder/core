modules.img={
    cdot:'',
    getImg:function(obj,type,forcegroot){
        //if(app.nointernet) return modules.img.cdot;
        var s3=(typeof obj=='obj'&&obj.s3)?obj.s3:app.s3;//hack!!!;
        if(forcegroot) s3='https://s3-us-west-2.amazonaws.com/groot';//for mapping stuff
        if(!obj) return '';
        var out='';
        if(typeof obj=='object'){
            if(!obj.path){
                out='https://s3-us-west-2.amazonaws.com/groot/common/earth_user.jpg';
            }else{
                if(type) out=s3+obj.path+'/'+type+'.'+obj.ext;
                else out=s3+obj.path+'/full.'+obj.ext;
            }
        }else{
            if(obj&&obj.indexOf('http://')==-1&&obj.indexOf('https://')==-1&&obj.indexOf('www')==-1) out=s3+obj;
            else if(obj.indexOf(app.s3)>=0) out=obj;
            else{
                if(obj.indexOf('https://')!=-1) out=obj.replace(/ /g,'%20');//allow for remote sites using https
                else out=app.apiurl+'/proxy/image?img='+encodeURIComponent(obj);
            }
        }
        return out;
    }
}