// Word cloud layout by Jason Davies, http://www.jasondavies.com/word-cloud/
// Algorithm due to Jonathan Feinberg, http://static.mrfeinberg.com/bv_ch03.pdf
(function() {
  function cloud() {
    var size = [256, 256],
        text = cloudText,
        font = cloudFont,
        fontSize = cloudFontSize,
        fontStyle = cloudFontNormal,
        fontWeight = cloudFontNormal,
        rotate = cloudRotate,
        padding = cloudPadding,
        spiral = archimedeanSpiral,
        words = [],
        timeInterval = Infinity,
        event = d3.dispatch("word", "end"),
        timer = null,
        cloud = {};

    cloud.start = function() {
      var board = zeroArray((size[0] >> 5) * size[1]),
          bounds = null,
          n = words.length,
          i = -1,
          tags = [],
          data = words.map(function(d, i) {
            d.text = text.call(this, d, i);
            d.font = font.call(this, d, i);
            d.style = fontStyle.call(this, d, i);
            d.weight = fontWeight.call(this, d, i);
            d.rotate = rotate.call(this, d, i);
            d.size = ~~fontSize.call(this, d, i);
            d.padding = padding.call(this, d, i);
            return d;
          }).sort(function(a, b) { return b.size - a.size; });

      if (timer) clearInterval(timer);
      timer = setInterval(step, 0);
      step();

      return cloud;

      function step() {
        var start = +new Date,
            d;
        while (+new Date - start < timeInterval && ++i < n && timer) {
          d = data[i];
          d.x = (size[0] * (Math.random() + .5)) >> 1;
          d.y = (size[1] * (Math.random() + .5)) >> 1;
          cloudSprite(d, data, i);
          if (d.hasText && place(board, d, bounds)) {
            tags.push(d);
            event.word(d);
            if (bounds) cloudBounds(bounds, d);
            else bounds = [{x: d.x + d.x0, y: d.y + d.y0}, {x: d.x + d.x1, y: d.y + d.y1}];
            // Temporary hack
            d.x -= size[0] >> 1;
            d.y -= size[1] >> 1;
          }
        }
        if (i >= n) {
          cloud.stop();
          event.end(tags, bounds);
        }
      }
    }

    cloud.stop = function() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      return cloud;
    };

    cloud.timeInterval = function(x) {
      if (!arguments.length) return timeInterval;
      timeInterval = x == null ? Infinity : x;
      return cloud;
    };

    function place(board, tag, bounds) {
      var perimeter = [{x: 0, y: 0}, {x: size[0], y: size[1]}],
          startX = tag.x,
          startY = tag.y,
          maxDelta = Math.sqrt(size[0] * size[0] + size[1] * size[1]),
          s = spiral(size),
          dt = Math.random() < .5 ? 1 : -1,
          t = -dt,
          dxdy,
          dx,
          dy;

      while (dxdy = s(t += dt)) {
        dx = ~~dxdy[0];
        dy = ~~dxdy[1];

        if (Math.min(dx, dy) > maxDelta) break;

        tag.x = startX + dx;
        tag.y = startY + dy;

        if (tag.x + tag.x0 < 0 || tag.y + tag.y0 < 0 ||
            tag.x + tag.x1 > size[0] || tag.y + tag.y1 > size[1]) continue;
        // TODO only check for collisions within current bounds.
        if (!bounds || !cloudCollide(tag, board, size[0])) {
          if (!bounds || collideRects(tag, bounds)) {
            var sprite = tag.sprite,
                w = tag.width >> 5,
                sw = size[0] >> 5,
                lx = tag.x - (w << 4),
                sx = lx & 0x7f,
                msx = 32 - sx,
                h = tag.y1 - tag.y0,
                x = (tag.y + tag.y0) * sw + (lx >> 5),
                last;
            for (var j = 0; j < h; j++) {
              last = 0;
              for (var i = 0; i <= w; i++) {
                board[x + i] |= (last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0);
              }
              x += sw;
            }
            delete tag.sprite;
            return true;
          }
        }
      }
      return false;
    }

    cloud.words = function(x) {
      if (!arguments.length) return words;
      words = x;
      return cloud;
    };

    cloud.size = function(x) {
      if (!arguments.length) return size;
      size = [+x[0], +x[1]];
      return cloud;
    };

    cloud.font = function(x) {
      if (!arguments.length) return font;
      font = d3.functor(x);
      return cloud;
    };

    cloud.fontStyle = function(x) {
      if (!arguments.length) return fontStyle;
      fontStyle = d3.functor(x);
      return cloud;
    };

    cloud.fontWeight = function(x) {
      if (!arguments.length) return fontWeight;
      fontWeight = d3.functor(x);
      return cloud;
    };

    cloud.rotate = function(x) {
      if (!arguments.length) return rotate;
      rotate = d3.functor(x);
      return cloud;
    };

    cloud.text = function(x) {
      if (!arguments.length) return text;
      text = d3.functor(x);
      return cloud;
    };

    cloud.spiral = function(x) {
      if (!arguments.length) return spiral;
      spiral = spirals[x + ""] || x;
      return cloud;
    };

    cloud.fontSize = function(x) {
      if (!arguments.length) return fontSize;
      fontSize = d3.functor(x);
      return cloud;
    };

    cloud.padding = function(x) {
      if (!arguments.length) return padding;
      padding = d3.functor(x);
      return cloud;
    };

    return d3.rebind(cloud, event, "on");
  }

  function cloudText(d) {
    return d.text;
  }

  function cloudFont() {
    if(app.font&&app.font.main){
      return app.font.main.name;
    }else if(window.font_name){
      return window.font_name;
    }{
      return "Sans-Serif";
    }
  }

  function cloudFontNormal() {
    return "normal";
  }

  function cloudFontSize(d) {
    return Math.sqrt(d.value);
  }

  function cloudRotate() {
    return 0;//(~~(Math.random() * 6) - 3) * 30;
  }

  function cloudPadding() {
    return 1;
  }

  // Fetches a monochrome sprite bitmap for the specified text.
  // Load in batches for speed.
  function cloudSprite(d, data, di) {
    if (d.sprite) return;
    c.clearRect(0, 0, (cw << 5) / ratio, ch / ratio);
    var x = 0,
        y = 0,
        maxh = 0,
        n = data.length;
    --di;
    while (++di < n) {
      d = data[di];
      c.save();
      c.font = d.style + " " + d.weight + " " + ~~((d.size + 1) / ratio) + "px " + d.font;
      var w = c.measureText(d.text + "m").width * ratio,
          h = d.size << 1;
      if (d.rotate) {
        var sr = Math.sin(d.rotate * cloudRadians),
            cr = Math.cos(d.rotate * cloudRadians),
            wcr = w * cr,
            wsr = w * sr,
            hcr = h * cr,
            hsr = h * sr;
        w = (Math.max(Math.abs(wcr + hsr), Math.abs(wcr - hsr)) + 0x1f) >> 5 << 5;
        h = ~~Math.max(Math.abs(wsr + hcr), Math.abs(wsr - hcr));
      } else {
        w = (w + 0x1f) >> 5 << 5;
      }
      if (h > maxh) maxh = h;
      if (x + w >= (cw << 5)) {
        x = 0;
        y += maxh;
        maxh = 0;
      }
      if (y + h >= ch) break;
      c.translate((x + (w >> 1)) / ratio, (y + (h >> 1)) / ratio);
      if (d.rotate) c.rotate(d.rotate * cloudRadians);
      c.fillText(d.text, 0, 0);
      if (d.padding) c.lineWidth = 2 * d.padding, c.strokeText(d.text, 0, 0);
      c.restore();
      d.width = w;
      d.height = h;
      d.xoff = x;
      d.yoff = y;
      d.x1 = w >> 1;
      d.y1 = h >> 1;
      d.x0 = -d.x1;
      d.y0 = -d.y1;
      d.hasText = true;
      x += w;
    }
    var pixels = c.getImageData(0, 0, (cw << 5) / ratio, ch / ratio).data,
        sprite = [];
    while (--di >= 0) {
      d = data[di];
      if (!d.hasText) continue;
      var w = d.width,
          w32 = w >> 5,
          h = d.y1 - d.y0;
      // Zero the buffer
      for (var i = 0; i < h * w32; i++) sprite[i] = 0;
      x = d.xoff;
      if (x == null) return;
      y = d.yoff;
      var seen = 0,
          seenRow = -1;
      for (var j = 0; j < h; j++) {
        for (var i = 0; i < w; i++) {
          var k = w32 * j + (i >> 5),
              m = pixels[((y + j) * (cw << 5) + (x + i)) << 2] ? 1 << (31 - (i % 32)) : 0;
          sprite[k] |= m;
          seen |= m;
        }
        if (seen) seenRow = j;
        else {
          d.y0++;
          h--;
          j--;
          y++;
        }
      }
      d.y1 = d.y0 + seenRow;
      d.sprite = sprite.slice(0, (d.y1 - d.y0) * w32);
    }
  }

  // Use mask-based collision detection.
  function cloudCollide(tag, board, sw) {
    sw >>= 5;
    var sprite = tag.sprite,
        w = tag.width >> 5,
        lx = tag.x - (w << 4),
        sx = lx & 0x7f,
        msx = 32 - sx,
        h = tag.y1 - tag.y0,
        x = (tag.y + tag.y0) * sw + (lx >> 5),
        last;
    for (var j = 0; j < h; j++) {
      last = 0;
      for (var i = 0; i <= w; i++) {
        if (((last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0))
            & board[x + i]) return true;
      }
      x += sw;
    }
    return false;
  }

  function cloudBounds(bounds, d) {
    var b0 = bounds[0],
        b1 = bounds[1];
    if (d.x + d.x0 < b0.x) b0.x = d.x + d.x0;
    if (d.y + d.y0 < b0.y) b0.y = d.y + d.y0;
    if (d.x + d.x1 > b1.x) b1.x = d.x + d.x1;
    if (d.y + d.y1 > b1.y) b1.y = d.y + d.y1;
  }

  function collideRects(a, b) {
    return a.x + a.x1 > b[0].x && a.x + a.x0 < b[1].x && a.y + a.y1 > b[0].y && a.y + a.y0 < b[1].y;
  }

  function archimedeanSpiral(size) {
    var e = size[0] / size[1];
    return function(t) {
      return [e * (t *= .1) * Math.cos(t), t * Math.sin(t)];
    };
  }

  function rectangularSpiral(size) {
    var dy = 4,
        dx = dy * size[0] / size[1],
        x = 0,
        y = 0;
    return function(t) {
      var sign = t < 0 ? -1 : 1;
      // See triangular numbers: T_n = n * (n + 1) / 2.
      switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
        case 0:  x += dx; break;
        case 1:  y += dy; break;
        case 2:  x -= dx; break;
        default: y -= dy; break;
      }
      return [x, y];
    };
  }

  // TODO reuse arrays?
  function zeroArray(n) {
    var a = [],
        i = -1;
    while (++i < n) a[i] = 0;
    return a;
  }

  var cloudRadians = Math.PI / 180,
      cw = 1 << 11 >> 5,
      ch = 1 << 11,
      canvas,
      ratio = 1;

  if (typeof document !== "undefined") {
    canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    ratio = Math.sqrt(canvas.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2);
    canvas.width = (cw << 5) / ratio;
    canvas.height = ch / ratio;
  } else {
    // Attempt to use node-canvas.
    canvas = new Canvas(cw << 5, ch);
  }

  var c = canvas.getContext("2d"),
      spirals = {
        archimedean: archimedeanSpiral,
        rectangular: rectangularSpiral
      };
  c.fillStyle = c.strokeStyle = "red";
  c.textAlign = "center";

  if (typeof module === "object" && module.exports) module.exports = cloud;
  else (d3.layout || (d3.layout = {})).cloud = cloud;
})();
if(!window.visualization) window.visualization={};
visualization.wordcloud=function(options){
    var self=this;
    var debug=0;
    var ele=$(options.id);
    this.getTagByCoords=function(last){
        //convert coords to relative based on where the wordcloud is in dom
        if(debug){
            var pos=ele.offset();
            var dlast=$.extend(true,{},last);
            dlast.coords.clientX=dlast.coords.clientX-pos.left;
            dlast.coords.clientY=dlast.coords.clientY-pos.top;
            ele.append('<div style="position:absolute;top:'+dlast.coords.clientY+'px;left:'+dlast.coords.clientX+'px;width:10px;height:10px;background:red;margin-top:-5px;margin-left:-5px"></div>')
        }
        var overlaped=false;
        $.each(self.map,function(i,v){
            if(self.isWithin(last.coords,v)){
                overlaped=i;
            }
        })
        return {
            tag:_.getByKey(options.tags,overlaped,'id'),
            ele:ele.find('[data-id='+overlaped+']')
        }
    }
    this.isWithin=function(coords,bounds){
        var inx=false;
        var iny=false;
        if(coords.clientX>bounds.left&&coords.clientX<bounds.right){
            inx=true;
        }
        if(coords.clientY>bounds.top&&coords.clientY<bounds.bottom){
            iny=true;
        }
        if(inx&&iny) return true;
        return false;
    }
    if(options.heatmap){
        function getPercentage(v){
            var range=gmax-gmin;
            var diff=v-gmin;
            var p=diff/range;
            return p;
        }
        var gradient = tinygradient([
        {color: '#62bfdb', pos: 0},
        {color: '#4fa0e8', pos: 0.2},
        {color: '#8aa7f6', pos: 0.4},
        {color: '#b8a5fb', pos: 0.6},
        {color: '#cb82db', pos: 0.8},
        {color: '#D250A6', pos: 1}
      ]);
        var gmin=10000000;
        var gmax=0;
        $.each(options.tags,function(i,v){
            if(v.value<gmin) gmin=v.value;
            if(v.value>gmax) gmax=v.value;
        })
        var getGradient=function(obj){
            //var p=getPercentage(obj.value);
            var c=gradient.rgbAt(Math.random()).toHexString();
            return c;
        }
    }else{
        var fill = d3.scale.category20b();
    }

    var w = ele.width(),
            h = ele.height();
    var max,
            fontSize;

    var layout = d3.layout.cloud()
            .timeInterval(Infinity)
            .size([w, h])
            .fontSize(function(d) {
                if(options.heatmap&&false){
                    if(options.heatmap.fontSize) return options.heatmap.fontSize;
                    return 22;
                }else{
                    return fontSize(+d.value);
                }
            })
            .padding(function(){
                return 2;
            })
            .text(function(d) {
                return d.key;
            })
            .on("end", draw);

    var svg = d3.select(options.id).append("svg")
            .attr("width", w)
            .attr("height", h);

    var vis = svg.append("g").attr("transform", "translate(" + [w >> 1, h >> 1] + ")");
    update();
    // window.onresize = function(event) {
    //     update();
    // };

    function draw(data, bounds) {
       var w = ele.width(),
            h = ele.height();
        svg.attr("width", w).attr("height", h);

        scale = bounds ? Math.min(
                w / Math.abs(bounds[1].x - w / 2),
                w / Math.abs(bounds[0].x - w / 2),
                h / Math.abs(bounds[1].y - h / 2),
                h / Math.abs(bounds[0].y - h / 2)) / 2 : 1;

        var text = vis.selectAll("text")
                .data(data, function(d) {
                    return d.text;
                    //return d.text.toLowerCase();
                });
        text.transition()
                .duration(1000)
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .style("font-size", function(d) {
                    return d.size + "px";
                });
        text.enter().append("text")
                .attr("text-anchor", "middle")
                .attr("data-id", function(d) {
                    return d.id;
                })
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .style("font-size", function(d) {
                    return d.size + "px";
                })
                // .style("opacity", 1e-6)
                // .transition()
                // .duration(1000)
                // .style("opacity", 1);
        text.style("font-family", function(d) {
            return d.font;
        })
                .style("fill", function(d) {
                    if(options.heatmap){
                        return getGradient(d);
                    }else{
                        return fill(d.text);//.toLowerCase()
                    }
                })
                .text(function(d) {
                    return d.text;
                });

        vis.transition().attr("transform", "translate(" + [w >> 1, h >> 1] + ")scale(" + scale + ")");
        self.map={};//clear out
        if(!isMobile){
            //cache!
            ele.find('text').each(function(i,v){
                var bounds=v.getBoundingClientRect();
                var id=$(v).attr('data-id')
                self.map[id]=bounds;
            })
            ele.find('text').on('click',function(){
                var name=$(this).html();
                var tag_info=_.getByKey(options.tags,name,'key');
                options.onClick(name,tag_info);
            })
            ele.on('mousemove',function(e){
                //get last!
                self.last={
                    ts:new Date().getTime(),
                    coords:_.touchEvent.getCoords(e)
                };
                if(self.mmto) clearTimeout(self.mmto);
                self.mmto=setTimeout(function(){
                    var opts=self.getTagByCoords(self.last);
                    if(opts&&opts.tag){
                        options.onHold(opts.tag.key,opts.tag,opts.ele);
                    }else{
                        console.log('no selected');
                    }
                },200);
            })
        }else{
            ele.find('text').on('touchstart',function(e){
                self.start={
                    ts:new Date().getTime(),
                    coords:_.touchEvent.getCoords(e)
                };
                self.last=false;
                var te=$(this);
                self.pressing=true;
                self.to=setTimeout(function(){
                    if(self.pressing){
                        var end={
                            ts:new Date().getTime(),
                        }
                        var diff=end.ts-self.start.ts;
                        var thresh='';
                        var not_moved=false;
                        if(self.start&&self.last){
                            var dy=(self.last.coords.clientY-self.start.coords.clientY);
                            var dx=(self.last.coords.clientX-self.start.coords.clientX);
                            var d=Math.sqrt(dy*dy+dx*dx);
                            if(d<10){
                                not_moved=true
                            }
                        }else{
                            not_moved=true;//no last
                        }
                        if(not_moved){
                            var name=te.html();
                            var tag_info=_.getByKey(options.tags,name,'key');
                            options.onHold(name,tag_info,te);   
                        }
                    }
                },300);
            }).on('touchend',function(e){
                if(self.to) clearTimeout(self.to)
                self.pressing=false;
                var end={
                    ts:new Date().getTime(),
                }
                var diff=end.ts-self.start.ts;
                var thresh='';
                var not_moved=false;
                if(self.start&&self.last){
                    var dy=(self.last.coords.clientY-self.start.coords.clientY);
                    var dx=(self.last.coords.clientX-self.start.coords.clientX);
                    var d=Math.sqrt(dy*dy+dx*dx);
                    if(d<10){
                        not_moved=true
                    }
                }else{
                    not_moved=true;//no last
                }
                if(diff<300&&not_moved){
                    var name=$(this).html();
                    var tag_info=_.getByKey(options.tags,name,'key');
                    options.onClick(name,tag_info);
                }
            })
            ele.on('touchmove',function(e){
                self.last={
                    ts:new Date().getTime(),
                    coords:_.touchEvent.getCoords(e)
                };
            })
        }
    }

    function update() {
        var font=(app.font&&app.font.main)?app.font.main.name:'Sans-Serif';
        if(window.font_name) font=window.font_name;
        layout.font(font).spiral('archimedean');
        var range=(options.range)?options.range:[18, 36];
        fontSize = d3.scale['sqrt']().range(range);
        if (options.tags.length){
            if(options.heatmap&&false){
                fontSize.domain([16, 20]);
            }else{
                fontSize.domain([+options.tags[options.tags.length - 1].value || 1, +options.tags[0].value]);
            }
        }
        layout.stop().words(options.tags).start();
    }
}