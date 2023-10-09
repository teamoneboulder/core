modules.footerbar={
    init:function(){
        $('body').render({
            template:'nectar_footer'
        });
        modules.footerbar.setColor();
    },
    getCurrent:function(){
        return this.color;
    },
    setColor:function(color){
        if(!color){
            var theme=app.user.getTheme();
            color=theme.footer.color;
        }
        TweenLite.to($('#footer_color'),.2,{backgroundColor:color})
        //$('#footer_color').css('background',color);
        this.color=color;
    }
}