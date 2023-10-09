/*Genneral Set-Up*/
var tools = require('groupup.js');
tools.init();
tools.setVar('debug',1);//set debug mode
tools.setVar('imageopts',{
    sizes:['small','full'],
    path:'/sites/threyda/artists/',
    force:0,
    preview:0
})
var cheerio = require('cheerio'), async = require('async');
var starttime=new Date().getTime();
var global={//put everything to save in save
    save:{},
    count:0,
    total:0,
};//store everything in out, its a global


var savepath='/var/www/root/node/tempdata/threyda_artists_2.json';
var odata=tools.getFile(savepath,1);
if(!odata) odata={};
global.save=odata;//include old data in save, if update
tools.get('https://www.threyda.com/pages/artists', function (resp) {
    var $ = cheerio.load(resp);
    var p=$('.feature_divider').next();
    var ps=p.children();
    var artists={};
    var content=[];
    var ac=0;
    var cc=0;
    var ic=0;
    var html=p.html();
    html=html.replace(/<br>/g,'\r\n');
    text=$(html).text()
    var text=text.split(/(?:\r\n|\r|\n)/);
    // console.log(text);
    // return false
    var artists=[];
    var ac=-1;
    var description='';
    var matt=0;
    for (var i = 0; i < text.length; i++) {
        var line=text[i];
        if(line.indexOf('view products')>=0||line.indexOf('view products')>=0||line.indexOf('Mike Cole')>=0||line.indexOf('Kent')>=0||(line.indexOf('Matthew Koscica')>=0&&!matt)){//crayzy cahart
            if(line.indexOf('Matthew Koscica')>=0) matt=1;
            var tp=line.split('|');
            var n=tp[0].replace(/\s+/g, " ");
            if(n[0]==' ') n=n.substr(1,n.length);
            if(n[n.length-1]==' ') n=n.substr(0,n.length-1);
            if(ac>=0){
                artists[ac].desc=description;
            }
            artists.push({
                name:n,
                _id:n.toLowerCase().replace(' ','-')
            })
            var description='';
            ac++;
        }else{
            description=description+line;
        }
    };
    if(description){
       artists[ac].desc=description; 
    }
   var imgs=[];
   var index={};
    p.find('img').each(function(i,v){
        var img=tools.fixUrl($(v).attr('src'),1);
        imgs.push(img)
        artists[i].src=img;
        index[img]=i;
        //console.log(artists[i])
    })
    tools.processImages(imgs,function(map){
        for (var mk in map) {
            artists[index[mk]].img=map[mk];
        }
        tools.saveFile(savepath,JSON.stringify(artists),function(){
            console.log('Saved '+artists.length+ ' Artists')
            process.exit(0);
        });
    })
});