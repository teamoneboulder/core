fs = require('fs');
var mongojs = require('mongojs');
var async=require('async');
var tools=require('./tools.js');
tools.init();
var dbfolder='/var/www/'+tools.conf.project+'/_manage/db';
//console.log(dbfolder);
//process indexes
var thequeue=[];
var d=tools.getFile('/var/www/'+tools.conf.project+'/_manage/schema.json',1);
var colls=Object.keys(d);
// fs.readdirSync(dbfolder).forEach(file => {
//   if(file.indexOf('.json')>=0){
//     var p=file.split('.');
//     colls.push(p[0]);
//   }
// })
if(tools.settings.isdev){
  console.log('====load dev indexes')
  for(var key in d){
    var coll=d[key];
    if(coll.hasDev){
      colls.push(key+'_dev');
    }
  }
}
tools.db.init(tools.conf.dbname,colls,function(db){
for(var key in d){
  var item=d[key];
  var indexes=[];
  for(var fieldk in item.fields){
    var field=item.fields[fieldk];
    if(field._index){
      thequeue.push({
        field:fieldk,
        index:field._index,
        collection:db[key],
        collection_name:key
      });
      if(item.hasDev&&tools.settings.isdev){
        thequeue.push({
          field:fieldk,
          index:field._index,
          collection:db[key+'_dev'],
          collection_name:key+'_dev'
        });
      }
    }
  }
}
var savedindexes={};
var queue=async.queue(function(opts,fin){
  if(opts.path){//depreciated
    fs.readFile(opts.path,'utf8', function (err, data) {
      if (err) throw err;
      try{
        var collection = db.collection(opts.collection);
        collection.remove({},function(err){
          var json=JSON.parse(data);
          //remove first
          var l=json.length;
          var i=0;
          for(var object in json)
          {
            collection.save(json[object],function(e){
              i++;
              if(i==l){
                console.log('Saved ['+json.length+'] records to '+opts.collection)
                fin();
                // setTimeout(function(){
                //   fin();
                // },1000)
                }
            });
          }
        });
      }catch(e){
        console.log(data)
        console.log('Invalid JSON: '+opts.path);
        process.exit(0)
      }
    });
  }else if(opts.index){
    var index={};
    index[opts.field]=opts.index;
    opts.collection.createIndex(index,function(err,result){
      if(err){
        console.log(err);
        console.log('INDEX FAILED ['+opts.collection_name+'] field ['+opts.field+'] value ['+opts.index+'] ')
      }else{
        if(!savedindexes[opts.collection_name]) savedindexes[opts.collection_name]=[];
        savedindexes[opts.collection_name].push(opts.field+':'+opts.index);
        //console.log('INDEX ['+opts.collection_name+'] field ['+opts.field+'] value ['+opts.index+'] ')
      }
      fin();
    })
  }
},100)
queue.drain=function(){
  //console.log('Database Loaded!');
  console.log('Indexes!');
  console.log(savedindexes);
  process.exit(0)
}
for (var i = 0; i < thequeue.length; i++) {
   var item=thequeue[i];
   queue.push(item);
 }
})
// // connect to DB
// fs.readdir(dbfolder, function(err,files){
//   for(var name in files) {
//      var colnames=files[name].split('.');
//      if(colnames[1] == 'json') // has to be json file
//      {
//       thequeue.push({
//         path:dbfolder+'/'+files[name],
//         collection:colnames[0]
//       })
//   	}
//    }
//    for (var i = 0; i < thequeue.length; i++) {
//      var item=thequeue[i];
//      queue.push(item);
//    }
// });
