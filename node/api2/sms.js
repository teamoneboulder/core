module.exports=function(path,r,db){
	if(!this.smsapi){
		this.smsapi=require('@vonage/server-sdk')
		this.smsInstance = new this.smsapi({
		  apiKey: r.tools.conf.vonage.access_token,
		  apiSecret: r.tools.conf.vonage.secret_key
		})
		this.senderNumber=r.tools.conf.vonage.sender_number
	}
	var self=this;
	var api={
		send:function(r,db){
			if(!r.qs.number){
				return r.write(r,{error:'Number Required'});
			}
			if(!r.qs.number_clean){
				if(r.tools.settings.isdev){
					r.write(r,{success:true,data:{token:'ABCD'}})
				}else{
					return r.write(r,{error:'Number Required'});
				}
			}
			//create short code and store in DB
			var ts=new Date().getTime();
			var save={
				id:r.tools.crypto.createHash('md5').update(r.qs.number+'_'+ts).digest('hex'),
				number:r.qs.number,
				token:r.tools.getUniqueNumber(6),
				ts:ts
			}
			db.user.findOne({'phone.number':r.qs.number_clean},function(err,resp){
				if(resp&&!r.tools.settings.isdev){
					r.write(r,{error:true,error_message:'Phone number already in use'})
				}else{
					db.sms_verify.updateOne({id:save.id},{$set:save},{upsert:true}, function(err,resp){
						r.tools.dblog('🔥🔥🔥 Send SMS to '+r.qs.number,function(){
							self.smsInstance.message.sendSms(self.senderNumber, r.qs.number, 'Your confirmation code is: '+save.token, (err, responseData) => {
								if (err) {
							        console.log(err);
							        r.write(r,{error:true,error_message:err})
							    } else {
							        if(responseData.messages[0]['status'] === "0") {
							            console.log("Message sent successfully.");
							            r.write(r,{success:true,data:{token:save.id}})
							        } else {
							            console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
							            r.write(r,{error:true,error_message:responseData.messages[0]['error-text']})
							        }
							    }
							})
						})
					});
				}
			});
		},
		confirm:function(r,db){
			if(r.tools.settings.isdev){
				return r.write(r,{success:true})
			}
			if(!r.qs.code){
				return r.write(r,{error:'Code Required'});
			}
			if(!r.qs.token){
				return r.write(r,{error:'Token Required'});
			}
			db.sms_verify.findOne({id:r.qs.token,token:r.qs.code},function(err,resp){
				if(resp){
					r.write(r,{success:true})
				}else{
					r.write(r,{error:'Invalid Code'})
				}
			});
		}	
	}
	if(api[path]&&path[0]!='_'){
		api[path](r,db);
	}else{
		r.write(r,{error:'invalid_method'})
	}
}