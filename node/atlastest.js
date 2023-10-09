var MongoClient = require('mongodb').MongoClient;
var un='tbassett44';
var pw='lpFXDmoAQDLIDxiB';
//var uri = "mongodb+srv://"+un+":"+pw+"@nectar-lmf7p.mongodb.net/test?ssl=true&authSource=admin";
var uri = "mongodb://tbassett44:"+pw+"@XXXXXX-00-00-lmf7p.mongodb.net:27017,XXXXXX-00-01-lmf7p.mongodb.net:27017,XXXXXX-00-02-lmf7p.mongodb.net:27017/test?ssl=true&replicaSet=XXXXXX-0&authSource=admin";
// MongoClient.connect(uri, function(err, client) {
//    const collection = client.db("test").collection("test");
//    // perform actions on the collection object
//    var obj={content:'test',ts:new Date().getTime()};
//    collection.insertOne(obj,function(err,r){
//    		console.log('successfully saved')
//    		client.close();
//    		process.exit(0);
//    })
// });
(async function() {
  let client;

  try {
    client = await MongoClient.connect(uri);
    console.log("Connected correctly to server");

    const col = client.db('test').collection('test');

    // Get the cursor
    const cursor = col.find();

    // Iterate over the cursor
    while(await cursor.hasNext()) {
      const doc = await cursor.next();
      console.dir(doc);
    }
  } catch (err) {
    console.log(err.stack);
  }

  // Close connection
  client.close();
})();