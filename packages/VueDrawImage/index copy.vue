<template>
    <canvas :id="drawId" >
        您的浏览器不支持canvas,请升级或更换浏览器后重试!<br>
        Your browser does not support the HTML5 canvas tag.
    </canvas>
</template>
<script>
export default {
    name: 'VueDrawImage',
    props: {
        options: { //配置项
            required: false,
            type: [Object],
            default: () => null
        },

        drawId: {   //画布id
            required: false,
            type: [String],
            default: `draw-image__${Math.random().toString(36).substr(2).toLocaleUpperCase()}`
        },

        src: {	//图片地址(优先级高于config的src)
            required: false,
            type: [String],
            default: null
        },

        list: {	//坐标对象数组
            required: false,
            type: [String],
            default: null
        }
    },
    data () {
        return {
            config: {
                width: 600,
                height: 400,
                // maxWidth: 800, //画布的最大宽度
                // maxHeight: 600, //画布的最大高度
                scale: 1, //画布放大倍数
                imageScale: 1,  //图片的缩放比例
                scaleStep: 1.05,    //放大步长
                dashedColor: '#fff', //虚线颜色
                solidColor: '#fff', //实线颜色
                hoverBorderColor: '#ff0', //图形鼠标悬浮的时候边框颜色
                cursorOffset: 25,   //鼠标偏移量
                lineDash: [5], //虚线类型
                src: null, //图片的路径
                isSeries: false   //是否连续绘制
            },
            canvas: null,
            ctx: null,
            currentR: null, //单前点击的矩形框
            flag: 0, //是否点击鼠标的标志
            isDraw: true, //是否可以绘制的标志
            topDistance: 0, //顶部边距
            leftDistance: 0, //左侧边距
            startX: 0, //开始X坐标
            startY: 0, //开始Y坐标
            endX: 0, // 结束X坐标
            endY: 0, // 结束Y坐标
            optype: 0, //op操作类型 0 无操作 1 画矩形框 2 拖动矩形框
            layers: []  //图层
        };
    },
    mounted () {
        this.$nextTick(() => {
            this.init();
        });
    },
    watch:{
        list(arr){
            if(!arr) this.layers = arr || [];
        },

        src(url){
            if(url){
                this.config.src = url;
                this.setImageBackground(url);
            }
        },

        options:{   //配置项是对象,只能深度监听
            handler(){
               this.init();
            },
            deep:true
        }
    },
    methods: {

        init () {
            const options = this.options;
            if (options) {
                for (const key in options) {
                    this.config[key] = options[key];
                }
            }
            this.layers = this.list || [];
            if(this.src) this.config.src = this.src;
            this.initDarwImage();
        },

        /**
         * 初始化画布
         */
        initDarwImage () {
            const config = this.config;
            this.canvas = document.getElementById(this.drawId);
            this.ctx = this.canvas.getContext('2d');
            this.setImageBackground(config.src);
            //鼠标进入canvas的时候绑定事件
            this.canvas.onmouseenter = () => {
                this.canvas.onmousedown = this.mousedown.bind(this);
                this.canvas.onmousemove = this.mousemove.bind(this);
                document.onmouseup = this.mouseup.bind(this);
            };

            //鼠标移出canvas的时候移除事件
            this.canvas.onmouseleave = () => {
                this.canvas.onmousedown = null;
                this.canvas.onmousemove = null;
                this.canvas.onmouseup = null;
            };
        },

        /**
         * 根据坐标渲染图形
         */
        rederLayerByCoordinate () {
            this.layers.forEach(item => {
                this.ctx.beginPath();
                this.ctx.fillRect(item.x1, item.y1, item.width, item.height);
                this.ctx.fillStyle = item.fillStyle;
                this.ctx.fill();
            });
        },

        /**
         * 设置图片为canvas的背景
         */
        setImageBackground (src) {
            const img = new Image();
            // img.style.maxWidth = this.config.width;
            // img.style.maxHeight = this.config.height;
            img.src = src;
            img.onload = () => {
                const w = img.width * this.config.imageScale;
                const h = img.height * this.config.imageScale;
                this.canvas.width = w;
                this.canvas.height = h;
                this.canvas.style.backgroundImage = `url(${img.src})`;
                this.canvas.style.backgroundSize = `${w}px ${h}px`;
                this.canvas.style.backgroundRepeat = `no-repeat`;
                // this.rederLayerByCoordinate();
            };
        },

        /**
         * 左侧拉伸展
         */
        resizeLeft (rect) {
            this.canvas.style.cursor = 'w-resize';
            if (this.flag && this.optype == 0) { this.optype = 3; }
            if (this.flag && this.optype == 3) {
                if (!this.currentR) { this.currentR = rect; }
                this.currentR.x1 = this.endX;
                this.currentR.width = this.currentR.x2 - this.currentR.x1;
            }
        },

        /**
         * 上边框拉伸
         */
        resizeTop (rect) {
            this.canvas.style.cursor = 's-resize';
            if (this.flag && this.optype == 0) { this.optype = 4; }
            if (this.flag && this.optype == 4) {
                if (!this.currentR) { this.currentR = rect; }
                this.currentR.y1 = this.endY;
                this.currentR.height = this.currentR.y2 - this.currentR.y1;
            }
        },

        /**
         * 宽度拉伸
         */
        resizeWidth (rect) {
            this.canvas.style.cursor = 'w-resize';
            if (this.flag && this.optype == 0) { this.optype = 5; }
            if (this.flag && this.optype == 5) {
                if (!this.currentR) { this.currentR = rect; }
                this.currentR.x2 = this.endX;
                this.currentR.width = this.currentR.x2 - this.currentR.x1;
            }
        },

        /**
         * 高度拉伸
         */
        resizeHeight (rect) {
            this.canvas.style.cursor = 's-resize';
            if (this.flag && this.optype == 0) { this.optype = 6; }
            if (this.flag && this.optype == 6) {
                if (!this.currentR) { this.currentR = rect; }
                this.currentR.y2 = this.endY;
                this.currentR.height = this.currentR.y2 - this.currentR.y1;
            }
        },

        /**
         * 左上角拉伸
         */
        resizeLT (rect) {
            this.canvas.style.cursor = 'se-resize';
            if (this.flag && this.optype == 0) { this.optype = 7; }
            if (this.flag && this.optype == 7) {
                if (!this.currentR) { this.currentR = rect; }
                this.currentR.x1 = this.endX;
                this.currentR.y1 = this.endY;
                this.currentR.height = this.currentR.y2 - this.currentR.y1;
                this.currentR.width = this.currentR.x2 - this.currentR.x1;
            }
        },

        /**
         *
         */
        resizeWH (rect) {
            this.canvas.style.cursor = 'se-resize';
            if (this.flag && this.optype == 0) { this.optype = 8; }
            if (this.flag && this.optype == 8) {
                if (!this.currentR) { this.currentR = rect; }
                this.currentR.x2 = this.endX;
                this.currentR.y2 = this.endY;
                this.currentR.height = this.currentR.y2 - this.currentR.y1;
                this.currentR.width = this.currentR.x2 - this.currentR.x1;
            }
        },

        /**
         *
         */
        resizeLH (rect) {
            this.canvas.style.cursor = 'ne-resize';
            if (this.flag && this.optype == 0) { this.optype = 9; }
            if (this.flag && this.optype == 9) {
                if (!this.currentR) { this.currentR = rect; }
                this.currentR.x1 = this.endX;
                this.currentR.y2 = this.endY;
                this.currentR.height = this.currentR.y2 - this.currentR.y1;
                this.currentR.width = this.currentR.x2 - this.currentR.x1;
            }
        },

        /**
         *
         */
        resizeWT (rect) {
            this.canvas.style.cursor = 'ne-resize';
            if (this.flag && this.optype == 0) { this.optype = 10; }
            if (this.flag && this.optype == 10) {
                if (!this.currentR) { this.currentR = rect; }
                this.currentR.x2 = this.endX;
                this.currentR.y1 = this.endY;
                this.currentR.height = this.currentR.y2 - this.currentR.y1;
                this.currentR.width = this.currentR.x2 - this.currentR.x1;
            }
        },

        reshow (x, y) {
            let allNotIn = 1;   //全部不在的标识
            this.layers.forEach(item => {
                this.ctx.beginPath();
                // if ((this.upX > item.x1 && this.upX < item.x2) && (this.upY > item.y1 && this.upY < item.y2)) {
                //     this.ctx.fillStyle = this.config.hoverBorderColor;
                // } else {
                //     this.ctx.fillStyle = item.fillStyle;
                // }
                this.ctx.fillStyle = item.fillStyle;
                this.ctx.rect(item.x1, item.y1, item.width, item.height);
                // this.ctx.fillRect(item.x1, item.y1, item.width, item.height);
                // if (x >= (item.x1 - this.config.cursorOffset / this.config.scale) && x <= (item.x1 + this.config.cursorOffset / this.config.scale) && y <= (item.y2 - this.config.cursorOffset / this.config.scale) && y >= (item.y1 + this.config.cursorOffset / this.config.scale)) {
                //     this.resizeLeft(item);
                // } else if (x >= (item.x2 - this.config.cursorOffset / this.config.scale) && x <= (item.x2 + this.config.cursorOffset / this.config.scale) && y <= (item.y2 - this.config.cursorOffset / this.config.scale) && y >= (item.y1 + this.config.cursorOffset / this.config.scale)) {
                //     this.resizeWidth(item);
                // } else if (y >= (item.y1 - this.config.cursorOffset / this.config.scale) && y <= (item.y1 + this.config.cursorOffset / this.config.scale) && x <= (item.x2 - this.config.cursorOffset / this.config.scale) && x >= (item.x1 + this.config.cursorOffset / this.config.scale)) {
                //     this.resizeTop(item);
                // } else if (y >= (item.y2 - this.config.cursorOffset / this.config.scale) && y <= (item.y2 + this.config.cursorOffset / this.config.scale) && x <= (item.x2 - this.config.cursorOffset / this.config.scale) && x >= (item.x1 + this.config.cursorOffset / this.config.scale)) {
                //     this.resizeHeight(item);
                // } else if (x >= (item.x1 - this.config.cursorOffset / this.config.scale) && x <= (item.x1 + this.config.cursorOffset / this.config.scale) && y <= (item.y1 + this.config.cursorOffset / this.config.scale) && y >= (item.y1 - this.config.cursorOffset / this.config.scale)) {
                //     this.resizeLT(item);
                // } else if (x >= (item.x2 - this.config.cursorOffset / this.config.scale) && x <= (item.x2 + this.config.cursorOffset / this.config.scale) && y <= (item.y2 + this.config.cursorOffset / this.config.scale) && y >= (item.y2 - this.config.cursorOffset / this.config.scale)) {
                //     this.resizeWH(item);
                // } else if (x >= (item.x1 - this.config.cursorOffset / this.config.scale) && x <= (item.x1 + this.config.cursorOffset / this.config.scale) && y <= (item.y2 + this.config.cursorOffset / this.config.scale) && y >= (item.y2 - this.config.cursorOffset / this.config.scale)) {
                //     this.resizeLH(item);
                // } else if (x >= (item.x2 - this.config.cursorOffset / this.config.scale) && x <= (item.x2 + this.config.cursorOffset / this.config.scale) && y <= (item.y1 + this.config.cursorOffset / this.config.scale) && y >= (item.y1 - this.config.cursorOffset / this.config.scale)) {
                //     this.resizeWT(item);
                // }
                this.ctx.globalCompositeOperation = 'destination-over';
                if (this.ctx.isPointInPath(x * this.config.scale, y * this.config.scale)) {
                    this.render(item);
                    allNotIn = 0;
                    this.ctx.globalCompositeOperation = "source-over";
                }

                if(this.currentR ){

                }

                // this.ctx.fill();
                this.ctx.fill();
            });
            if (this.flag && allNotIn && this.optype < 3) {
                this.optype = 1;
            }
        },

        /**
         * 渲染当前的图形
         */
        render (rect) {
            this.canvas.style.cursor = 'move';
            if (this.flag && this.optype == 0) { this.optype = 2; }
            if (this.flag && this.optype == 2) {
                if (!this.currentR) { this.currentR = rect; }
                this.currentR.x2 += this.endX - this.leftDistance - this.currentR.x1;
                this.currentR.x1 += this.endX - this.leftDistance - this.currentR.x1;
                this.currentR.y2 += this.endY - this.topDistance - this.currentR.y1;
                this.currentR.y1 += this.endY - this.topDistance - this.currentR.y1;
            }
        },

        /**
         * 判断当前坐标内是否有图形
         */
        isPointInRetc (x, y) {
            let len = this.layers.length;
            for (let i = 0; i < len; i++) {
                if (this.layers[i].x1 < x && x < this.layers[i].x2 && this.layers[i].y1 < y && y < this.layers[i].y2) {
                    return this.layers[i];
                }
            }
        },

        /**
         * 固定矩形的位置,记录基本的坐标信息
         */
        fixPosition (position) {
            if (position.x1 > position.x2) {
                let x = position.x1;
                position.x1 = position.x2;
                position.x2 = x;
            }
            if (position.y1 > position.y2) {
                let y = position.y1;
                position.y1 = position.y2;
                position.y2 = y;
            }
            position.width = position.x2 - position.x1;
            position.height = position.y2 - position.y1;
            // if (position.width < 50 || position.height < 50) {
            //     position.width = 60;
            //     position.height = 60;
            //     position.x2 += position.x1 + 60;
            //     position.y2 += position.y1 + 60;
            // }
            return position;
        },

        /**
         * 鼠标按下
         */
        mousedown (e) {
            this.startX = (e.pageX - this.canvas.offsetLeft + this.canvas.parentElement.scrollLeft) / this.config.scale;
            this.startY = (e.pageY - this.canvas.offsetTop + this.canvas.parentElement.scrollTop) / this.config.scale;
            this.currentR = this.isPointInRetc(this.startX, this.startY);
            if (this.currentR) {
                this.resetHoverColor();
                this.currentR.fillStyle = this.config.hoverBorderColor;
                this.leftDistance = this.startX - this.currentR.x1;
                this.topDistance = this.startY - this.currentR.y1;
            }

            if(this.isDraw){   //手动绘制
                //鼠标按下确定矩形的起始坐标
                this.ctx.fillRect(this.endX, this.endY, 0, 0);
                this.ctx.globalCompositeOperation = "destination-over";
            }

            //设置画笔颜色
            this.ctx.fillStyle = this.config.dashedColor;
            this.flag = 1;
            console.log(`鼠标按下`,e);
        },

        /**
         * 鼠标移动
         */
        mousemove (e) {
            this.endX = (e.pageX - this.canvas.offsetLeft + this.canvas.parentElement.scrollLeft) / this.config.scale;
            this.endY = (e.pageY - this.canvas.offsetTop + this.canvas.parentElement.scrollTop) / this.config.scale;
             let moveR = this.isPointInRetc(this.endX, this.endY);
            if (moveR) {
                this.resetHoverColor();
               for(let i=0;i<this.layers.length;i++){
                   let item=this.layers[i]
                   if(moveR==item){
                      item.fillStyle=this.config.hoverBorderColor;
                   }
               }

            }
            this.ctx.save();
            this.ctx.setLineDash(this.config.lineDash);
            this.canvas.style.cursor = 'default';
            //清除画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.flag && this.optype == 1 && this.isDraw) {
                this.ctx.fillRect(this.startX, this.startY, this.endX - this.startX, this.endY - this.startY);
                this.ctx.globalCompositeOperation = 'destination-over';
            }
            this.ctx.restore(this.endX, this.endY);
            console.log(this.endX, this.endY);
            this.reshow(this.endX, this.endY);
            // console.log(`鼠标移动`,e);
        },

        /**
         * 鼠标抬起
         */
        mouseup (e) {
            if (this.optype == 1 && this.isDraw) {
                this.layers.push(this.fixPosition({
                    x1: this.startX,
                    y1: this.startY,
                    x2: this.endX,
                    y2: this.endY,
                    fillStyle: this.config.solidColor,
                    type: this.type
                }));
            } else if (this.optype >= 3) {
                this.fixPosition(this.currentR);
            }
            this.currentR = null;
            this.flag = 0;
            this.reshow(this.endX, this.endY);
            this.optype = 0;
            //设置为不可绘制
            // this.isDraw = false;
            console.log(`鼠标抬起`,e);
        },

        /**
         * 开始/结束此次绘制
         * @param isDraw { Boolean } true 为可绘制
         */
        draw(isDraw = true){
            this.isDraw = isDraw;
        },

        /**
         * 获取dom对象的偏移量 可以获取解决position定位的问题
         */
        offset(obj, direction) {
            //将top,left首字母大写,并拼接成offsetTop,offsetLeft
            const offsetDir = 'offset'+ direction[0].toUpperCase()+direction.substring(1);
            let realNum = obj[offsetDir];
            let positionParent = obj.offsetParent;  //获取上一级定位元素对象
            while(positionParent != null){
                realNum += positionParent[offsetDir];
                positionParent = positionParent.offsetParent;
            }
            return realNum;
        },

        /**
         * 重置所有的图形颜色为默认值
         */
        resetHoverColor(){
            this.layers.forEach(item => {
                item.fillStyle = this.config.solidColor;
            });
        }

    }
};
</script>
