modules.loadError=function(opts){
    if((opts.error=='404'||opts.error==404)&&opts.ele_404){
        var id='id_'+Math.uuid(12);
         opts.ele_404.render({
            template:'loaderror_404',
            append:false,
            data:{
                hasBack:(opts.onBack)?1:0,
                id:id
            },
            binding:function(ele){
                ele.find('.x_back').stap(function(){
                    console.log(opts)
                    if(opts.onBack) opts.onBack();
                },1,'tapactive');
                phi.call('require',{
                    js:['https://cdnjs.cloudflare.com/ajax/libs/particles.js/2.0.0/particles.min.js']
                },function(){
                      particlesJS(id, {
                        "particles": {
                          "number": {
                            "value": 5,
                            "density": {
                              "enable": true,
                              "value_area": 800
                            }
                          },
                          "color": {
                            "value": "#fcfcfc"
                          },
                          "shape": {
                            "type": "circle",
                          },
                          "opacity": {
                            "value": 0.5,
                            "random": true,
                            "anim": {
                              "enable": false,
                              "speed": 1,
                              "opacity_min": 0.2,
                              "sync": false
                            }
                          },
                          "size": {
                            "value": 140,
                            "random": false,
                            "anim": {
                              "enable": true,
                              "speed": 10,
                              "size_min": 40,
                              "sync": false
                            }
                          },
                          "line_linked": {
                            "enable": false,
                          },
                          "move": {
                            "enable": true,
                            "speed": 8,
                            "direction": "none",
                            "random": false,
                            "straight": false,
                            "out_mode": "out",
                            "bounce": false,
                            "attract": {
                              "enable": false,
                              "rotateX": 600,
                              "rotateY": 1200
                            }
                          }
                        },
                          "interactivity": {
                          "detect_on": "canvas",
                          "events": {
                            "onhover": {
                              "enable": false
                            },
                            "onclick": {
                              "enable": false
                            },
                            "resize": true
                          }
                        },
                        "retina_detect": true
                      });
                })
                if(opts.binding) opts.binding(ele);
                ele.find('.x_retry').stap(function(e){
                    stopEvent(e);
                    $(this).find('i').addClass('animate-spin');
                    opts.onRetry();
                },1,'tapactive');
            }
        })
    }else{
        opts.ele.render({
            template:'loaderror',
            append:false,
            data:{
                icon:(opts.icon||opts.icon===false)?opts.icon:'icon-info-circled-alt',
                message:opts.error,
                extra_message:(opts.extra_message)?opts.extra_message:'',
                inline:(opts.inline)?1:0,
                background:(opts.background)?opts.background:'',
                buttonClass:(opts.buttonClass)?opts.buttonClass:'',
                disableRetry:(opts.disableRetry)?1:0,
                feed:(opts.feed)?opts.feed:0,
                hasBack:(opts.onBack)?1:0
            },
            binding:function(ele){
                if(opts.binding) opts.binding(ele);
                ele.find('.x_back').stap(function(){
                    if(opts.onBack) opts.onBack();
                },1,'tapactive');
                ele.find('.x_retry').stap(function(e){
                    stopEvent(e);
                    $(this).find('i').addClass('animate-spin');
                    opts.onRetry();
                },1,'tapactive');
            }
        })
    }
}