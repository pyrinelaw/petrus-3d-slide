# petrus-3d-slide 3D滑动控件

标签（空格分隔）： 控件 CSS3 jQuery zepto 前端

---


## 关于petrus_3d_slide

> * 3D滑动控件，支持手机端
> * 优先支持触摸拖动，若浏览器不支持则使用鼠标拖动事件
> * 如需兼容IE10+，勿使用zepto库，请使用jQuery库
> * 非触摸设备请添加touche插件支持
> * 使用css3效果，兼容chrome，firefox大部分浏览器
> * 下载：https://github.com/pyrinelaw/petrus_3d_slide
> * 部分微信中不支持

## 引用js

```javascript
    <script type="text/javascript" src="src/lib/zepto-1.1.6.js"></script>
    <script type="text/javascript" src="src/lib/touche.js"></script>
    <script type="text/javascript" src="src/js/petrus-3d-slide-0.1.0.js"></script>
```

如需兼容非触摸设备添加touche插件支持,(使用本库中已修正过的touche.js)

```javascript
    <script type="text/javascript" src="src/lib/touche.js"></script>
```

当然你也可以使用jQuery

```javascript
    <script type="text/javascript" src="src/lib/jQuery-1.1.2.js"></script>
    <script type="text/javascript" src="src/js/petrus-3d-slide-0.1.0.js"></script>
```

## html格式
```html
<div class="slide">
    <div class="xx"></div>
    <div class="xx"></div>
    <div class="xx"></div>
    <div class="xx"></div>
    <div class="xx"></div>
    <div class="xx"></div>
</div>
```

### 参数
```javascript
var defaultOptions = {
	orientation: 'y',		// 滑动方向
	$el: null,				// 容器
	perspective: NaN, 		// 视距
	speed: 0.5,				// 滑屏速度(秒)
	// 回调
	callbacks:{
		show: null,			// 滑动完成
		hide: null,			// 滑动隐藏
		init: null			// 初始化完成
	}
}
```

## 调用
```javascript
$.petrus_3d_slide({
    $el: $('.demo'),
    orientation: 'x'
});
```
或者
```javascript
$('.demo-3').petrus_3d_slide({
    $el: $('.demo-3')
});
```


### 返回
```javascript
{
	prev: function(){},     // 上一动作
	next: function(){}      // 下一动作
}
```

### 示例
```javascript
var show = function(idx, ele){
    console.warn(‘当前动作图片下标:’+idx);
};

var hide = function(idx, ele){
    console.warn(‘当前隐藏动作图片下标:’+idx);
}

var init = function(){
    alert('初始化完成');
}

var $slide = $('.demo').petrus_3d_slide({
    callbacks: {
        show: show,
        hide: hide,
        init: init
    }
});

$('.prev').click(function(event) {
    console.warn('上一动作');
});

$('.next').click(function(event) {
    console.warn('下一动作');
});
```

------
![file-list](res/demo.png)

------
感谢花费时间阅读此份文稿
更多插件请访问: https://github.com/pyrinelaw
作者：Petrus.Law

------

**Demo:** [http://pyrinelaw.github.io/petrus-3d-slide/](http://pyrinelaw.github.io/petrus-3d-slide/)

**Download:** [https://www.github.com/pyrinelaw/petrus-3d-slide](https://www.github.com/pyrinelaw/petrus-3d-slide)
