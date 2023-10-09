var VERSION='1.1';
var fs = require( 'fs' );
var app = require('express')();
var bodyParser = require('body-parser')
var querystring=require('querystring');
var https        = require('https');
var cors = require('cors');
var url = require('url');
var tools=require('./tools.js');
console.log('Starting API version '+VERSION);
tools.init();
tools.opentok.init();
var server = https.createServer({
    key: fs.readFileSync('/var/www/priv/api.'+tools.settings.domain+'/fullchain.pem'),
    cert: fs.readFileSync('/var/www/priv/api.'+tools.settings.domain+'/comb.pem'),
    ca: '',
    requestCert: false,
    rejectUnauthorized: false
},app);
//enables cors
app.use(cors({
  'allowedHeaders': ['sessionId', 'Content-Type'],
  'exposedHeaders': ['sessionId'],
  'origin': '*',
  'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'preflightContinue': false
}));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))
// parse application/json
app.use(bodyParser.json());

var os = require('os');
var ifaces = os.networkInterfaces();
var ipaddress='';
Object.keys(ifaces).forEach(function (ifname) {
  ifaces[ifname].forEach(function (iface) {
    if(ifname=='eth0'&&iface.family=='IPv4'){
    	ipaddress=iface.address;
    }
  });
});
tools.service.start('api2.js');
console.log('Connecting to DB: '+tools.conf.dbname);
tools.db.init(tools.conf.dbname,['anon_token','token','cache','search_weight','user','event','page','event_rsvp','chat_group','music_artist','podcast_artist','service','music','podcast','donation','fundraiser',"map_layer","sms_verify","user_profiles","user_questions","user_waiver","user_settings","games"],function(db){
	function parseRequest(req,res,cb){
		var u = url.parse(req.url, true);
		var path=u.pathname.split('/');
		if(path[1]=='healthcheck'){
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({success:true}));
			return false;
		}
		var respond=function(resp){
			if(typeof resp=='object') var tresp=JSON.stringify(resp);
			else var tresp=resp;
			if(!req.query.callback){
				res.setHeader('Content-Type', 'application/json');
				res.send(tresp);
			}else{
				res.send(req.query.callback+'('+tresp+')');
			}
		}
		var processRequest=function(auth){
			cb({auth:auth,qs:req.query,path:path,req:req,res:res,start:new Date().getTime(),write:function(r,resp){
				resp.info={
					internal_server:ipaddress
				}
				if(r.start){
					var diff=(new Date().getTime()-r.start)/1000;
					resp.info.processTime=diff;
				}
				resp.info.size='';
				//set header
				respond(resp);
			},tools:tools});
		}
		if(req.query.token==tools.settings.admin_token){
			processRequest({uid:'admin'});
		}else if(req.query.token){
			db.token.findOne({id:req.query.token},function(err,data){
				if(data){
					processRequest(data);
				}else{
					processRequest(false);
					//respond({error:'invalid_auth'});
				}
			})
		}else{
			//see if it can be anon
			if(req.query.anon_token){
				db.anon_token.findOne({id:req.query.anon_token},function(err,data){
					if(data){
						if(new Date(data.expires).getTime()>new Date().getTime()){
							processRequest(false);
						}else{
							respond({error:'invalid_auth'});
						}
					}else{
						respond({error:'invalid_auth'});
					}
				})
			}else{//allow anon!
				processRequest(false);
			}
		}
	}
	app.get('*', function(req, res){
		if(req.url.indexOf('favicon.ico')>=0) return res.send(JSON.stringify({error:'no_favicon'}));
		parseRequest(req,res,function(r){
			var path=__dirname+'/api2/'+r.path[1]+'.js';
			if(r.path[1]&&fs.existsSync(path)){
				try{
					require(path)(r.path[2],r,db);
				}catch(e){
					res.send(JSON.stringify({error:'error'}));
				}
			}else{
				res.send(JSON.stringify({error:'invalid_endpoint'}));
			}
		});	
	});
	server.listen(3333, function(){
	  console.log('listening on *:3333');
	});
});