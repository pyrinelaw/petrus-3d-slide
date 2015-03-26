/**
 * @author  Petrus.Law (petrus.law@outlook.com)
 * @date    2014-09-04 16:13:13
 * @desc    3D滑动组件，支持手机端
 * @github	https://github.com/pyrinelaw/
 * @version	0.1.0
 */

(function() {

	/**
	 * 滑动开始前重设数据
	 */
	var resetOptions = {
		valid: false,	// 初始滑动生效,初始设置为false
		allow: true,	// 是否允许滑动触摸
		startPos: NaN,	// 滑动开始点
		movePos: NaN,	// 滑动移动触摸点
		endPos: NaN		// 滑动结束触摸点
	}

	/**
	 * 创建selection元素块
	 */
	var create$selection = function(idx, orientation) {
		var $selection = $('<section></section>');

		var styleClass = 'peturs-3d-slide-section-'+orientation+'-'+idx;

		$selection.addClass(styleClass);

		return $selection;
	}

	/**
	 * 初始化
	 */
	var initialize = function() {
		var options = this.options,
			$el = options.$el,
			orientation = options.orientation;

		options.perspective = options.perspective || 3;	// 视距: 默认3倍宽或高

		// 保存子元素，供后续使用
		options.$children = [];

		var $children = $el.children();

		if($children.length < 2) return false;

		$el.addClass('peturs-3d-slide-container');

		var $wrap = $("<div class='peturs-3d-slide-wrap'></div>");

		options.$children = $children;

		// 移除子元素
		$children.remove();

		var $sections = [];

		$sections[0] = create$selection(0, orientation);
		$sections[1] = create$selection(1, orientation);
		$sections[2] = create$selection(2, orientation);

		$el.prepend($wrap);

		// 默认显示第一个子元素
		$sections[1].append(options.$children[0]);

		$wrap.append($sections[0]);
		$wrap.append($sections[1]);
		$wrap.append($sections[2]);

		options.$wrap = $wrap;
		options.$sections = $sections;	// 保存块级元素供后续调用

		if(options.callbacks.init){
			options.callbacks.init();
		}

		return true;
	}

	/**
	 * 获取滑动方向获取首次触摸点位置
	 */
	var getFirstTouchEventPos = function(e, orientation) {
		var touches = e.touches,
			changedTouches = e.changedTouches,
			touchVo = null;

		if(changedTouches && changedTouches.length > 0) {
			touchVo = changedTouches[0];
		}
		else if(touches && touches.length > 0) {
			touchVo = touches[0];
		}

		if(touchVo){
			return touchVo['client'+orientation.toLocaleUpperCase()] || touchVo['page'+orientation.toLocaleUpperCase()];
		}

		return NaN;
	}

	/**
	 * 获取下一动作下标
	 */
	getNextAcIdx = function(idx, len, isPrev) {
		if(isPrev) {
			return idx > 0 ? (idx-1) : (len-1);
		} else {
			return idx < (len - 1) ? (idx+1) : 0;
		}
	}

	/**
	 * 获取当前操作上一个子元素
	 */
	var getPrevChild = function(idx, $children) {
		return $children[getNextAcIdx(idx, $children.length, true)];
	}

	/**
	 * 获取当前操作下一子元素
	 */
	var getNextChild = function(idx, $children) {
		return $children[getNextAcIdx(idx, $children.length)];
	}

	/**
	 * 滑动开始
	 */
	var slideStart = function(e){
		var options = this.options;

		if(!options.allow) return; 	// 当前触摸生效

		if(options.valid) return;	// 触摸已生效

		var orientation = options.orientation,
			pos = NaN,
			$children = options.$children;

		pos = e == null ? options.startPos : getFirstTouchEventPos(e, orientation);

		if(pos == NaN) return;

		options.startPos = pos;

		// 触摸开始时附加需要操作子元素
		var $el = options.$el,
			$wrap = options.$wrap,
			$sections = options.$sections,
			perspective = options.perspective,
			idx = options.idx,
			$children = options.$children,
			prevChild = getPrevChild(options.idx, $children),
			nextChild = getNextChild(options.idx, $children);

		// 每次触摸开始设置视距，防止容器大小变化导致视距出现偏差
		var perspective = orientation == 'y' ? ($el.height() * perspective) :  ($el.width() * perspective);
		$wrap.css('perspective', perspective);

		// 当前需要操作元素以及相邻元素移除hide样式，其余元素反向操作
		$children.each(function(i, ele){
			if(idx == i){
				$(ele).removeClass('peturs-3d-slide-hide');
			}else{
				$(ele).addClass('peturs-3d-slide-hide');
			}
		});

		$(prevChild).removeClass('peturs-3d-slide-hide');
		$(nextChild).removeClass('peturs-3d-slide-hide');

		// 两侧操作元素块初始透明度设置
		$sections[0].css('opacity', 0);
		$sections[2].css('opacity', 0);

		// 附加当前操作子元素相邻元素
		$sections[0].append(prevChild);
		$sections[2].append(nextChild);

		// 滑动触摸开始生效
		options.valid = true;
	}

	/**
	 * 滑动轨迹运行中
	 */
	var slideMove = function(e){

		var options = this.options;

		if(!options.allow) return;		// 当前不允许触摸

		if(!options.valid) return;		// 触摸未生效

		var orientation = options.orientation;
			pos = NaN;

		pos = getFirstTouchEventPos(e, orientation);

		if(pos != NaN) options.movePos = pos;

		// 只存在两屏处理
		if(options.$children.length == 2) {
			var cell = pos - options.startPos,
				$sections = options.$sections;

			if(cell < 0){
				$sections[2].append($sections[0].children());
			}else{
				$sections[0].append($sections[2].children());
			}
		}


		set3D.call(this);
	}

	/**
	 * 滑动结束重设滑动数据
	 */
	var endReset3DSlide = function(){
		var options = this.options,
			$wrap = options.$wrap,
			$sections = options.$sections,
			_$sections = [],
			idx = options.idx,
			orientation = options.orientation,
			cell = (options.endPos-options.startPos);

		// 初始化元素样式
		for(var i=0; i<3; i++){
			$sections[i].removeClass('peturs-3d-slide-section-'+orientation+'-'+i);
			$sections[i].css({
				'opacity': '',
				'transform': '',
				'transition': '',
				'transform-origin': ''
			})
		}

		// 重新设置操作元素块位置
		// 向前滑动
		if(cell <= 0){
			$wrap.append($sections[0]);
		}
		// 向后滑动
		else{
			$wrap.prepend($sections[2]);
		}

		// 重新定义元素块
		$sections = [];

		var $wrapChildren = $wrap.children();

		// 初始化元素块样式
		$wrapChildren.each(function(i, ele){
			$sections[i] = $(ele);
			$sections[i].addClass('peturs-3d-slide-section-'+orientation+'-'+i);
		});

		$sections[0].css('opacity', 0);
		$sections[2].css('opacity', 0);

		options.$sections = $sections;

		// 自定义隐藏回调
		if(options.callbacks.show){
			options.callbacks.hide.call(null, options.idx, options.$children[options.idx]);
		}

		// 当前操作子元素下标设置
		options.idx = getNextAcIdx(idx, options.$children.length, (cell < 0 ? false : true));

		// 以上代码主要是将滑动后打乱的滑动块元素以及样式重新定义
		// 看起来觉得很多余，其实很有必要

		// 自定义显示回调
		if(options.callbacks.show){
			options.callbacks.show.call(null, options.idx, options.$children[options.idx]);
		}

		// 滑动开始前重设数据
		$.extend(true, options, resetOptions);
	}

	/**
	 * 滑动结束
	 */
	var slideEnd = function(e) {
		var options = this.options;

		if(!options.allow) return;		// 当前不允许触摸

		var orientation = options.orientation;
			pos = NaN;

		pos = e == null ? options.endPos : getFirstTouchEventPos(e, orientation);

		options.endPos = pos;

		options.allow = false;	// 设置为禁止触摸

		var $el = options.$el,
			cell = pos-options.startPos,
			cell = (pos - options.startPos),			// 触摸移动间距
			dis = (orientation == 'y' ? $el.height() : $el.width()),		// 完整距离
			percent = cell/dis,
			$sections = options.$sections,
			speed = options.speed * (1-percent),
			_this = this;

		// 无滑动距离则重设触摸定义
		if(!cell){
			options.valid = false;
			options.allow = true;
			return;
		}

		// y方向滑动
		if(orientation == 'y') {
			// 向上滑动
			if(cell < 0) {
				// 底部元素快整体上移
				$sections[1].css({
					'transition': ('all '+speed+'s')
				});
				$sections[1].css({
					opacity: 0,
					'transform': 'translate(0%, -100%) rotateX(90deg)'
				});
				$sections[2].css({
					'transition': ('all '+speed+'s')
				});
				$sections[2].css({
					opacity: 1,
					'transform': 'translate(0%, 0%) rotateX(0deg)'
				});
			}
			// 向下滑动
			else {
				// 顶部元素快整体上移
				$sections[1].css({
					'transition': ('all '+speed+'s')
				});
				$sections[1].css({
					opacity: 0,
					'transform': 'translate(0%, 100%) rotateX(-90deg)'
				});
				$sections[0].css({
					'transition': ('all '+speed+'s')
				});
				$sections[0].css({
					opacity: 1,
					'transform': 'translate(0%, 0%) rotateX(0deg)'
				});
			}
		}
		// x方向滑动
		else {
			// 向左滑动
			if(cell < 0) {
				// 右侧元素块整体左移
				$sections[1].css({
					'transition': ('all '+speed+'s')
				});
				$sections[1].css({
					opacity: 0,
					'transform': 'translate(-100%, 0%) rotateY(-90deg)'
				});
				$sections[2].css({
					'transition': ('all '+speed+'s')
				});
				$sections[2].css({
					opacity: 1,
					'transform': 'translate(0%, 0%) rotateY(0deg)'
				});
			}
			// 向右滑动
			else {
				// 左侧元素块整体右移
				$sections[1].css({
					'transition': ('all '+speed+'s')
				});
				$sections[1].css({
					opacity: 0,
					'transform': 'translate(100%, 0%) rotateY(90deg)'
				});
				$sections[0].css({
					'transition': ('all '+speed+'s')
				});
				$sections[0].css({
					opacity: 1,
					'transform': 'translate(0%, 0%) rotateY(0deg)'
				});
			}
		}

		// 由于在.animate方法中无法设置transform样式，所以以上代码使用css元素transition方法进行控制动作时间

		// 动画时间结束后执行滑动结束重置方法
		// 同transform样式类似，不能使用.animate方法执行回调，使用setTimeout进行控制结果可能会有少许误差
		setTimeout(function() {
			endReset3DSlide.call(_this);
		}, speed*1000);
	}

	/**
	 * 获取3D位移距离百分比
	 */
	var get3DDisPercent = function(deg){
		var _deg = Math.abs(deg);

		if(_deg == 90) return 0;

		if(_deg == 0) return 100;

		var percent = (90-_deg) / 90 * 100;

		return percent;
	}

	/**
	 * 设置3D效果
	 */
	var set3D = function() {
		var options = this.options,
			$el = options.$el,
			idx = options.idx,
			orientation = options.orientation,
			cell = (options.movePos - options.startPos),			// 触摸移动间距
			dis = (orientation == 'y' ? $el.height() : $el.width()),// 完整距离
			percent = cell/dis,										// 移动间距百分比
			$sections = options.$sections,
			deg = _deg = 0,
			rotate = _rorate = 0,
			_dis = 0,
			translate = _translate = 0,
			translatePercent = 0,
			_opacity = Math.abs(percent),
			opacity = 1 - _opacity;

		// y方向滑动
		if(orientation == 'y') {
			// 向上滑动
			if(percent <=0 ) {
				_deg = (-90 - 90 * percent);
				deg = 90-Math.abs(_deg);
				translatePercent = get3DDisPercent(_deg);

				translate = 0-translatePercent;
				_translate = 100-translatePercent;

				$sections[1].css({
					opacity: opacity,
					'transform-origin': '50% 100% 0px',
					'transform': 'translate(0%, '+translate+'%) rotateX('+deg+'deg)'
				});
				$sections[2].css({
					opacity: _opacity,
					'transform': 'translate(0%, '+_translate+'%) rotateX('+_deg+'deg)'
				});
			}
			// 向下滑动
			else {
				_deg = 90 - (90 * percent);
				deg = 0-(90-_deg);
				translatePercent = get3DDisPercent(_deg, orientation);

				translate = translatePercent;
				_translate = -100+translatePercent;

				$sections[1].css({
					opacity: opacity,
					'transform-origin': '50% 0% 0px',
					'transform': 'translate(0%, '+translate+'%) rotateX('+deg+'deg)'
				});
				$sections[0].css({
					opacity: _opacity,
					'transform': 'translate(0%, '+_translate+'%) rotateX('+_deg+'deg)'
				});
			}
		}
		// x方向滑动
		else {
			// 向左滑动
			if(percent <=0) {
				_deg = 90 + (90 * percent);
				deg = 0-(90-_deg);
				translatePercent = get3DDisPercent(_deg);

				translate = 0-translatePercent;
				_translate = 100-translatePercent;

				$sections[1].css({
					opacity: opacity,
					'transform-origin': '100% 50% 0px',
					'transform': 'translate('+translate+'%, 0%) rotateY('+deg+'deg)'
				});
				$sections[2].css({
					opacity: _opacity,
					'transform': 'translate('+_translate+'%, 0%) rotateY('+_deg+'deg)'
				});
			}
			// 向右滑动
			else {
				_deg = -90 + (90 * percent);
				deg = 90-(0-_deg);
				translatePercent = get3DDisPercent(_deg);

				translate = translatePercent;
				_translate = -100+translatePercent;

				$sections[1].css({
					opacity: opacity,
					'transform-origin': '0% 50% 0px',
					'transform': 'translate('+translate+'%, 0%) rotateY('+deg+'deg)'
				});
				$sections[0].css({
					opacity: _opacity,
					'transform': 'translate('+_translate+'%, 0%) rotateY('+_deg+'deg)'
				});
			}
		}
	}

	var petrus_3d_slide = function(settings) {

		// 默认设置
		var options = {
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

		settings = settings || {};

		$.extend(true, options, settings, resetOptions);

		this.options = options;

		var $el = options.$el,
			idx = options.idx = 0;											// 当前操作下标

		// 初始化
		var initResult = initialize.call(this);

		if(!initResult) return;		// 初始化失败

		var _this = this;

		// 在容器中注册触摸时间
		$el[0].addEventListener('touchstart', function(e) {
			slideStart.call(_this, e);
		}, false);

		// 触摸移动与触摸结束点可以位于网页任何位置
		document.addEventListener('touchmove', function(e) {
			slideMove.call(_this, e);
		}, false);

		document.addEventListener('touchend', function(e) {
			slideEnd.call(_this, e);
		}, false);

		// 对外提供接口
		return {
			// 上一动作
			prev: function(){
				if(!options.allow) return;
				options.startPos = 1;
				options.endPos = 2;
				slideStart.call(_this, null);
				slideEnd.call(_this, null);
			},
			// 下一动作
			next: function(){
				if(!options.allow) return;
				// 通过设置初始触摸点与结束触摸点模拟调用开始触摸于结束触摸事件
				options.startPos = 2;
				options.endPos = 1;
				slideStart.call(_this, null);
				slideEnd.call(_this, null);
			}
		}
	}

	$.petrus_3d_slide = function(settings){
		return new petrus_3d_slide(settings);
	}

	$.fn.petrus_3d_slide = function(settings){
		settings = settings || {};
		settings.$el = $(this);
		return $.petrus_3d_slide(settings);
	}

})()