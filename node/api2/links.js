module.exports=function(path,r,db){
	var self=this;
	if(!self.initd){
		//import and require things!
		//return false;
		self.metascraper = require('metascraper')([
		  require('metascraper-author')(),
		  require('metascraper-image')(),
		  require('metascraper-title')(),
		  require('metascraper-date')(),
		  require('metascraper-description')(),
		  require('metascraper-logo')(),
		  require('metascraper-publisher')(),
		  require('metascraper-amazon')(),
		  require('metascraper-url')()
		])
		self.extractor = require('unfluff');
		self.got = require('got')
		self.initd=true;
	}
	var api={
		get:function(r,db){
			//r.write(r,{qs:r.qs});
			if(r.qs.url){
				r.qs.url=decodeURIComponent(r.qs.url);
				async function get(){
				  //r.write(r,{qs:r.qs});
				  const {body: html, url} = await self.got(r.qs.url);
				  //r.write(r,{html:html});
				  const metadata = await self.metascraper({html, url})
				  //console.log(metadata);
				  //if(int) clearInterval(int);
				  //return 'here';
				  //console.log('ok2');
				  //console.log(JSON.stringify(metadata))
				  if(metadata.title){
				  	metadata.title=metadata.title.substr(0,100);
				  }
				  if(metadata.description){
				  	metadata.description=metadata.description.substr(0,300);
				  }
				  return {metadata:metadata,html:html};
				};
				get().then(function(res){
				  data = self.extractor(res.html);
				  delete res.html;//dont return full html
				  res.full_text=data.text;
				  r.write(r,{success:true,data:res});
				}).catch(function(e){
					console.log(e);
					r.write(r,{error:e});
				});
			}else{
				r.write(r,{error:'invalid_url'});
			}
		}
	}
	if(api[path]&&path[0]!='_'){
		api[path](r,db);
	}else{
		r.write(r,{error:'invalid_method'})
	}
}