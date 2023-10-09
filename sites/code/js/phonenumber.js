if(!window.modules) window.modules={};
window.modules.phonenumber=function(options){
    var self=this;
    self.options=options;
    this.init=function(){
        if(!options.ele.find('input').length){
            options.ele.append('<input type="text" inputmode="numeric" style="max-width:300px;width:90vw;font-size:20px;border:1px solid #ccc;" class="truebox s-corner-all">');
        }
        var normalvalidation=['us'];
        var validate=true;
        options.ele.find('input').on('countrychange',function(){
            var data=self.iti.getSelectedCountryData();
            if(normalvalidation.indexOf(data.iso2)>=0){
                if(!validate){
                    var c=options.ele.find('input').val().toPhoneNumber();
                    options.ele.find('input').val(c);
                }
                validate=true;
            }else{
                if(validate){
                    var c=options.ele.find('input').val().toPhoneNumber(1);
                    options.ele.find('input').val(c);
                }
                validate=false;
            }
        });
        self.iti=window.intlTelInput(options.ele.find('input')[0],{
            separateDialCode:true
        })
        if(options.phone&&options.phone.number){
            self.iti.setCountry(options.phone.iso2)
            if(normalvalidation.indexOf(options.phone.iso2)>=0){
                options.ele.find('input').val(options.phone.number.toPhoneNumber());
            }else{
                options.ele.find('input').val(options.phone.number.toPhoneNumber(1));
            }
        }
        options.ele.find('input').on('input',function(e){
            if(!validate) return false;
            phi.stop(e);
            var dont=[37,39,8]
            var cv=$(this).val();
            if(cv==')'||cv=='(') $(this).val('');
            if(dont.indexOf(e.which)>=0) return false;
            var v=cv.toPhoneNumber();
            if(v.length==0){
                $(this).val('');
            }else{
                $(this).val(v);
                //get placement of last number
                var li=0;
                $.each(v.split(''),function(i,v){
                    if(Number.isInteger(parseInt(v,10))){
                        li=i+1;
                    }
                });
                //$(this).caret(li);
            }
        }).on('focus',function(){
            if(!validate) return false;
            var ele=$(this);
            var v=options.ele.find('input').val();
            //get placement of last number
            var li=0;
            $.each(v.split(''),function(i,v){
                if(Number.isInteger(parseInt(v,10))){
                    li=i+1;
                }
            })
            setTimeout(function(){
                ele.caret(li);
            },20)
        })
    }
    this.clear=function(){
        options.ele.find('input').val('');
    }
    this.isValid=function(){
        return self.iti.isValidNumber();//not a thing
    }
    this.getNumber=function(){
        var data=self.iti.getSelectedCountryData();
        return {
            code:data.dialCode,
            number:options.ele.find('input').val().toPhoneNumber(1),
            iso2:data.iso2
        }
    }
    this.destroy=function(){
        if(self.iti) self.iti.destroy();
        delete self;
    }
    self.init();
}