fs = require('fs');
var mongojs = require('mongojs');
var db = mongojs('prod');
var async=require('async');
var path='/var/www/root/_manage/city.list.us.json';
var collection='weather_index';
var tcollection = db.collection(collection);
var thequeue=[];
var queue = async.queue(function(opts, fin) {
   tcollection.save(opts.data,function(e){
      if(opts.i%1000==0){
        process.stdout.write('Done Saving '+(opts.i/total*100).toFixed(2) + '%... \r');
      }
      fin();
    });
}, 5);
var total=0;
queue.drain=function(){
  console.log('Done loading ['+total+'] records');
  process.exit(0)
}
fs.readFile(path,'utf8', function (err, data) {
  if (err) throw err;
  try{
    tcollection.remove({},function(err){
      var rows=data.split('\n');
      //var json=JSON.parse(data);
      //remove first
      total=rows.length;
      console.log('loading ['+total+'] records');
      var i=0;
      for(var row in rows)
      {
        if(rows[row]){
          var tr=JSON.parse(rows[row]);
          i++;
          queue.push({
            data:tr,
            i:i
          })
        }
      }
    });
  }catch(e){
    console.log(data)
    console.log('Invalid JSON: '+path);
    //process.exit(0)
  }
});