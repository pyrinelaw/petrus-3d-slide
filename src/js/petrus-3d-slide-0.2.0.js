/**
 * @author  Petrus.Law (petrus.law@outlook.com)
 * @date    2014-09-11 09:09:19
 * @desc    3D滑动组件，支持手机端
 * @github	https://github.com/pyrinelaw/
 * @version	0.2.0
 */

(function() {

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

	// 默认设置
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

	var Attrs = {

		/**
		 * 初始化
		 */
		initialize: function() {
			var options = this.options,
				$el = options.$el,
				orientation = options.orientation,
				perspective = options.perspective || 3;	// 视距: 默认3倍宽或高

			// 保存子元素，供后续使用
			options.$children = [];

			var $children = $el.children();

			if($children.length < 2) return false;

			$el.addClass('peturs-3d-slide-container');

			var $wrap = $("<div class='peturs-3d-slide-wrap'></div>");

			$wrap.css('perspective', orientation == 'y' ? ($el.height() * perspective) :  ($el.width() * perspective));

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
		},

		/**
		 * 滑动开始
		 */
		slideStart: function(e){
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
			var $sections = options.$sections,
				idx = options.idx,
				$children = options.$children,
				prevChild = this.getPrevChild(),
				nextChild = this.getNextChild();

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
		},

		/**
		 * 滑动轨迹运行中
		 */
		slideMove: function(e){

			var options = this.options;

			if(!options.allow) return;		// 当前不允许触摸

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

			this.set3D();
		},

		/**
		 * 滑动结束
		 */
		slideEnd: function(e) {
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

			var _this = this;

			// 由于在.animate方法中无法设置transform样式，所以以上代码使用css元素transition方法进行控制动作时间

			// 动画时间结束后执行滑动结束重置方法
			// 同transform样式类似，不能使用.animate方法执行回调，使用setTimeout进行控制结果可能会有少许误差
			setTimeout(function() {
				_this.endReset3DSlide();
			}, speed*1000);
		},

		/**
		 * 获取下一动作下标
		 */
		getNextAcIdx: function(isPrev) {
			var idx = this.options.idx,
				len = this.options.$children.length;

			if(isPrev) {
				return idx > 0 ? (idx-1) : (len-1);
			} else {
				return idx < (len - 1) ? (idx+1) : 0;
			}
		},

		/**
		 * 获取当前操作上一个子元素
		 */
		getPrevChild: function() {
			return this.options.$children[this.getNextAcIdx(true)];
		},

		/**
		 * 获取当前操作下一子元素
		 */
		getNextChild: function() {
			return this.options.$children[this.getNextAcIdx()];
		},

		/**
		 * 获取3D位移距离百分比
		 */
		get3DDisPercent: function(deg){
			var _deg = Math.abs(deg);

			if(_deg == 90) return 0;

			if(_deg == 0) return 100;

			var percent = (90-_deg) / 90 * 100;

			return percent;
		},

		/**
		 * 设置3D效果
		 */
		set3D: function() {
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
					translatePercent = this.get3DDisPercent(_deg);

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
					translatePercent = this.get3DDisPercent(_deg, orientation);

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
					translatePercent = this.get3DDisPercent(_deg, orientation);

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
					translatePercent = this.get3DDisPercent(_deg, orientation);

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
		},

		/**
		 * 滑动结束重设滑动数据
		 */
		endReset3DSlide: function(){
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
			options.idx = this.getNextAcIdx(cell < 0 ? false : true);

			// 以上代码主要是将滑动后打乱的滑动块元素以及样式重新定义
			// 看起来觉得很多余，其实很有必要

			// 自定义显示回调
			if(options.callbacks.show){
				options.callbacks.show.call(null, options.idx, options.$children[options.idx]);
			}

			// 滑动开始前重设数据
			$.extend(true, options, resetOptions);
		},

		/**
		 * 上一动作
		 */
		prev: function(){
			var options = this.options;

			if(!options.allow) return;
			options.startPos = 1;
			options.endPos = 2;
			this.slideStart(null);
			this.slideEnd(null);
		},

		// 下一动作
		next: function(){
			var options = this.options;

			if(!options.allow) return;
			// 通过设置初始触摸点与结束触摸点模拟调用开始触摸于结束触摸事件
			options.startPos = 2;
			options.endPos = 1;
			this.slideStart(null);
			this.slideEnd(null);
		}

	}

	var slide3D = function(settings){

		settings = settings || {};

		var options = this.options = {};

		$.extend(true, options, resetOptions, defaultOptions, settings);

		this.options = options;

		var $el = this.$el = options.$el,
			idx = options.idx = 0;

		$.extend(true, this, Attrs);

		// 初始化
		var initResult = this.initialize();

		if(!initResult) return;		// 初始化失败

		var _this = this;

		// 在容器中注册触摸时间
		$el[0].addEventListener('touchstart', function(e) {
			_this.slideStart(e);
		}, false);

		// 触摸移动与触摸结束点可以位于网页任何位置
		document.addEventListener('touchmove', function(e) {
			_this.slideMove(e);
		}, false);

		document.addEventListener('touchend', function(e) {
			_this.slideEnd(e);
		}, false);

		return this;
	}

	var petrus_3d_slide = function(settings){

		var slide = new slide3D(settings);

		return {
			prev: function(){
				slide.prev();
			},
			next: function(){
				slide.next();
			}
		}
	}

	$.petrus_3d_slide = function(settings){
		return new petrus_3d_slide(settings);
	}

	$.fn.petrus_3d_slide = function(settings){
		settings = settings || {};
		settings.$el = $(this);

		return petrus_3d_slide(settings);
	}

})()