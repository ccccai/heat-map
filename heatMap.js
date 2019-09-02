/**
 * 对Date的扩展，将 Date 转化为指定格式的String
 * 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 * 例子：
 * (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
 * (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
 *  @param fmt 日期格式
 */
Date.prototype.format = function (fmt) {
  var o = {
      "M+": this.getMonth() + 1, //月份
      "d+": this.getDate(), //日
      "h+": this.getHours(), //小时
      "m+": this.getMinutes(), //分
      "s+": this.getSeconds(), //秒
      "q+": Math.floor((this.getMonth() + 3) / 3), //季度
      "S": this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
      if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}

/**
 * 字符串转换为日期对象
 * @param dateStr Date 格式为yyyy-MM-dd HH:mm:ss，必须按年月日时分秒的顺序，中间分隔符不限制
 */
Date.prototype.strToDate = function (dateStr) {
  var data = dateStr
  var reCat = /(\d{1,4})/gm
  var t = data.match(reCat)
  t[1] = t[1] - 1
  eval('var d = new Date(' + t.join(',') + ')')
  return d
}

/**
 * 获取日期列表，不传参默认当前时间为截止日期，去年的今天为起始日期
 * @param dateStart 起始日期 格式为yyyy-MM-dd，必须按年月日的顺序，中间分隔符不限制
 * @param dateEnd 截止日期 格式为yyyy-MM-dd，必须按年月日的顺序，中间分隔符不限制
 */
Date.prototype.getDateList = function (dateStart, dateEnd) {
  try {
    var date, diff, list = {}
    // 缺一不可，缺任何一个都采取默认时间
    if (!dateStart || !dateEnd) {
      // 当前时间
      date = new Date()
      // 当前时间往前推一年
      date.setFullYear(date.getFullYear() - 1)
      // 如果去年的今天不是星期天的话，补充天数直到起始日期是星期天为止
      while (date.getDay() > 0) {
        date.setDate(date.getDate() - 1)
      }
      // 计算相差的天数
      diff = parseInt((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    } else {
      // 转换为日期对象
      var start = this.strToDate(dateStart)
      var end = this.strToDate(dateEnd)
      // 补充天数直到起始日期是星期天为止
      while (start.getDay() > 0) {
        start.setDate(start.getDate() - 1)
      }
      // 计算相差的天数
      diff = parseInt((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      date = start
    }
    // 实际上连最后一天也要算上，所以diff加2
    for (i = 1; i < diff + 2; i++) {
      list[date.format("yyyy-MM-dd")] = date.getDay()
      date.setDate(date.getDate() + 1)
    }
    return list
  } catch(e) {
    return {}
  }
}

var weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
var monthMap = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
var colorMap = {
  'blue': ['#003C9D', '#409EFF', '#87CEFA', '#E0FFFF', '#EBEDF0'],
  'pink': ['#990099', '#CC00CC', '#FF88C2', '#FFB7DD', '#EBEDF0'],
  'green': ['#196127', '#239A3B', '#7BC96F', '#C6E48B', '#EBEDF0'],
  'orange': ['#A42D00', '#CC6600', '#EE7700', '#FFAA33', '#EBEDF0'],
  'gray': ['#303133', '#444444', '#808080', '#C0C0C0', '#EBEDF0']
}

// 合并两个object，以mainObj为基准
function matchObj(mainObj, obj) {
  var resultObj = {}
  for (var key in mainObj) {
    if (!obj.hasOwnProperty(key)) {
      resultObj[key] = mainObj[key]
    } else if (Object.prototype.toString.call(mainObj[key]) === '[Object Object]' && key !== 'data') {
      resultObj[key] = matchObj(mainObj[key], obj[key])
    } else {
      resultObj[key] = obj[key]
    }
  }
  return resultObj
}

function HeatMapDate() {
  this.option = {
    type: 'date', // 类型：date-日历型，custom-自定义型
    xAxis: [], // 横坐标的label，type=custom起作用
    yAxis: [], // 纵坐标的label，type=custom起作用
    gap: 3, // 方格之间的间隔
    /* 数据
     * 如果type是date。那data是Object类型，格式是{ 'yyyy-MM-dd' : value }
     * 如果type是custom。那data是Array类型，格式是[[x, y, value], ..., [x, y, value]]
     */
    data: {},
    rect: {
      stroke: {
        show: false,
        background: '#333', // 正方形的边框颜色
        opacity: 0.6 // 正方形的边框透明度
      },
      colourMatching: '', //配色方案，有custom-自定义和reen、pink、blue、orange、gray五种渐变色
      backgroundArr: [] // 自定义配色方案，程度由重到轻
    },
    dateStart: '',
    dateEnd: '',
    min: 0, // 分级最低值，总共五个等级，不传默认值是0
    max: 0, // 分级最高值，总共五个等级，不传默认值是
    tip: { // 顶部鼠标悬浮小气泡
      show: true, // 是否展示
      /** 文本内容
       * type为date的时候{a}表示日期，{b}表示数值
       * type为custom的时候表示{x}x轴对应的值，{y}y轴对应的值，{b}表示数值
       * 如果在替换字符串前加反斜杠(例如/{b})，则不会替换该字符串
       */
      formatter: ''
    }
  }

  // 初始化参数，没传的就使用默认值
  this.setOption = (obj) => {
    this.option = matchObj(this.option, obj)
    if (!this.option.max) {
      this.option.max = Object.values(obj.data).sort(function(a, b) {
        return b - a
      })[0] || 0
    }
  }

  this.init = (dom) => {
    // 初始化dom的样式
    dom.setAttribute('style', 'width:100%;height:100%;position:relative;')
    // 获取父级dom的宽度
    var parentWidth = dom.offsetWidth
    // 通过createElementNS创建svg元素并设置属性
    var svg = document.createElementNS('http://www.w3.org/2000/svg','svg')
    svg.setAttribute('version', '1.1')
    svg.setAttribute('class', 'svg-container')
    dom.appendChild(svg) // 挂载元素。SVG元素添加到页面内显示

    // 显示顶部提示小气泡
    if (this.option.tip.show) {
      // 创建tip容器并设置属性
      var tip = document.createElement('div')
      tip.setAttribute('class', 'svg-tip svg-tip-one-line')
      var title = document.createElement('strong')
      tip.appendChild(title) // 挂载到父节点上
      dom.appendChild(tip) // 挂载元素。挂载顶部提示气泡
    }

    // 创建svg的group元素并设置属性
    var group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    var translateX = 20 // 横轴方向的偏移值
    var translateY = 40 // 纵轴方向的偏移值
    group.setAttribute('transform', 'translate(' + translateX + ',' + translateY + ')')
    svg.appendChild(group) // 挂载到父节点上

    var maxYLabelFontSize = 12
    var labelPadding = 10
    var maxStrLength = 0

    if (this.option.type === 'date') {
      // 获取全部天数列表
      var dateList = (new Date()).getDateList(this.option.dateStart, this.option.dateEnd)
      var columnCount = Math.ceil(Object.keys(dateList).length / 7)
      var size = Math.floor((parentWidth - translateX / 2 - maxYLabelFontSize * 2 - labelPadding - this.option.gap * columnCount) / columnCount)
      var section = size + this.option.gap

      // 纵轴的label值，这里是星期值
      for (var w = 0; w < 7; w++) {
        //创建矩形元素并设置属性
        var yText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        yText.style.fontSize = section * 0.7 > maxYLabelFontSize ? maxYLabelFontSize : section * 0.7 // 字体大小响应，最大是12px
        yText.setAttribute('dx', -labelPadding)
        yText.setAttribute('dy', w * section + size / 2 + 4)
        yText.setAttribute('class', 'wday')
        yText.innerHTML = weekMap[w]
        group.appendChild(yText)
        if (maxStrLength < yText.getBBox().width) {
          maxStrLength = yText.getBBox().width
        }
      }

      var index = 0 // 天数列表索引
      var column = 0 // 分组索引，完整的一周为一组
      for (var dateKey in dateList) {
        // 完整的一周为一组
        if (index === 0 || index % 7 === 0) {
          // 创建svg的group元素并设置属性，一周为一组
          var xGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
          // 设置偏移值
          xGroup.setAttribute('transform', 'translate(' + (column * section + maxStrLength) + ', 0)')
          group.appendChild(xGroup) // 挂载到父节点
          column++ // 递增组数索引

          // 判断在哪个分组的上方增加横轴的label值，在这里是月份
          if (index > 0) {
            var startMonth = dateKey.split('-')[1]
            var preStartMonth = Object.keys(dateList)[index - 7].split('-')[1]
            
            if (Math.abs(Number(startMonth) - Number(preStartMonth)) > 0) {
              //创建text元素并设置属性
              var fontSize = section * 0.8 > maxYLabelFontSize ? maxYLabelFontSize : section * 0.8 // 字体大小响应，最大是14px
              var xText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
              xText.style.fontSize = fontSize
              xText.setAttribute('x', column * section)
              xText.setAttribute('y', -labelPadding)
              xText.setAttribute('class', 'month')
              xText.innerHTML = monthMap[Number(startMonth) - 1]
              group.appendChild(xText)
            }
          }
        }
        if(this.option.data.hasOwnProperty(dateKey)) {
          // 开始画正方形啦~创建矩形元素并设置属性
          var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
          rect.setAttribute('x', 0)
          rect.setAttribute('y', dateList[dateKey] * section)
          rect.setAttribute('id', dateKey) // 设置日期为id值
          rect.setAttribute('week', dateList[dateKey]) // 设置星期几属性
          rect.setAttribute('column', column) // 设置分组的组索引属性
          rect.setAttribute('width', size)
          rect.setAttribute('height', size)

          color = '#fff' // 默认颜色是白色，就是啥也没有时候的颜色，以你的背景色为准 
          var colorSelect = ''
          // 选择的颜色系列
          if (this.option.rect.colourMatching === 'custom') {
            colorSelect = this.option.rect.backgroundArr
          } else {
            colorSelect = colorMap[this.option.rect.colourMatching]
          }
          // 默认绿色为基本配色方案
          colorSelect = colorSelect ? colorSelect : colorMap['green']
          // 分为五个等级，小于最小值最低等级，大于最大值最高等级。中间还应该有三个等级（可自定义）
          var levelGap = (this.option.max - this.option.min) / (colorSelect.length - 2)
          if (this.option.data.hasOwnProperty(dateKey)) {
            var differ = this.option.max - this.option.data[dateKey]
            // 小正方形的颜色决定于他的值处在哪个level里头
            switch(true) {
              case (this.option.data[dateKey] >= this.option.max) :
                color = colorSelect[0]
                break
              case (differ < levelGap) :
                color = colorSelect[1]
                break
              case (differ < levelGap * 2) :
                color = colorSelect[2]
                break
              case (differ < levelGap * 3) :
                color = colorSelect[3]
                break
              default:
                color = colorSelect[4]
            }
            // 设置小矩形的颜色
            rect.setAttribute('style', 'fill:' + color)
          
            // 显示顶部提示小气泡
            if (this.option.tip.show) {
              //矩形元素绑定鼠标事件实现动态效果
              // 鼠标移入
              rect.onmouseover = (e) => {
                if (this.option.rect.stroke.show) {
                  e.srcElement.setAttribute('stroke-width', 1)
                  e.srcElement.setAttribute('stroke', this.option.rect.stroke.background)
                  e.srcElement.setAttribute('stroke-opacity', this.option.rect.stroke.opacity)
                }


                // 提示小气泡的文本内容,默认==>日期：值
                if (this.option.tip.formatter) {
                  var tipText = this.option.tip.formatter.replace(/(?<!\/){a}/g, e.target.id).replace(/(?<!\/){b}/g, this.option.data[e.target.id])
                  tip.innerHTML = tipText
                } else {
                  tip.innerHTML = e.target.id + '：' + this.option.data[e.target.id]
                }
                tip.style.display = 'block'
                tip.style.top = (e.target.attributes.week.value * section + dom.querySelector('.svg-tip').offsetHeight / 2 - translateY / 2 - labelPadding) + 'px'
                tip.style.left = ((e.target.attributes.column.value - 1) * section + size / 2 + translateX / 2 + maxStrLength + labelPadding - dom.querySelector('.svg-tip').offsetWidth / 2) + 'px'
              }
              // 鼠标移出
              rect.onmouseout = (e) => {
                if (this.option.rect.stroke.show) {
                  e.srcElement.setAttribute('stroke-width', 0)
                }
                tip.style.display = 'none'
              }
            }
          }
          xGroup.appendChild(rect) //挂载矩形元素添加到小分组元素内
        }
        index++
      }

      // 设置svg元素的宽高
      svg.style.width = section * columnCount + translateX / 2 + maxStrLength + labelPadding
      svg.style.height = section * 7 + translateY
    }

    if (this.option.type === 'custom') {
      var size = parseInt(parentWidth / this.option.xAxis.length) - this.option.gap * this.option.xAxis.length 
      var section = size + this.option.gap
      var fontSize = section * 0.7 > maxYLabelFontSize ? maxYLabelFontSize : section * 0.7 // 字体大小响应，最大是12px

      this.option.xAxis.forEach((xItem,xIndex) => {
        var xGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        group.appendChild(xGroup)

        this.option.yAxis.forEach((yItem,yIndex) => {
          if (xIndex === 0) {
            //创建矩形元素并设置属性
            var yText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
            yText.style.fontSize = fontSize
            yText.setAttribute('dx', -labelPadding)
            yText.setAttribute('dy', yIndex * section + size / 2 + 4)
            yText.setAttribute('class', 'wday')
            yText.innerHTML = yItem
            group.appendChild(yText)
            if (maxStrLength < yText.getBBox().width) {
              maxStrLength = yText.getBBox().width
            }
          }

          this.option.data.some((elem, i) => {
            if (elem[0] === xIndex && elem[1] === yIndex) {
              color = 'rgb(255, 255, 255)' // 默认颜色是白色，就是啥也没有时候的颜色，以你的背景色为准 
              var colorSelect = ''
              // 选择的颜色系列
              if (this.option.rect.colourMatching === 'custom') {
                colorSelect = this.option.rect.backgroundArr
              } else {
                colorSelect = colorMap[this.option.rect.colourMatching]
              }
              // 默认绿色为基本配色方案
              colorSelect = colorSelect ? colorSelect : colorMap['green']
              // 分为五个等级，小于最小值最低等级，大于最大值最高等级。中间还应该有三个等级（可自定义）
              var levelGap = (this.option.max - this.option.min) / (colorSelect.length - 2)
              var differ = this.option.max - elem[2]
              // 小正方形的颜色决定于他的值处在哪个level里头
              switch(true) {
                case (elem[2] >= this.option.max) :
                  color = colorSelect[0]
                  break
                case (differ < levelGap) :
                  color = colorSelect[1]
                  break
                case (differ < levelGap * 2) :
                  color = colorSelect[2]
                  break
                case (differ < levelGap * 3) :
                  color = colorSelect[3]
                  break
                default:
                  color = colorSelect[4]
              }

              //创建矩形元素并设置属性
              var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
              rect.setAttribute('x', 0)
              rect.setAttribute('y', elem[1] * section)
              rect.setAttribute('id', elem[0] + '_' + elem[1]) // 设置日期为id值
              rect.setAttribute('row', yIndex)
              rect.setAttribute('column', xIndex)
              rect.setAttribute('width', size)
              rect.setAttribute('height', size)
              rect.setAttribute('style', 'fill:' + color)

              // 显示顶部提示小气泡
              if (this.option.tip.show) {
                //矩形元素绑定鼠标事件实现动态效果
                // 鼠标移入
                rect.onmouseover = (e) => {
                  if (this.option.rect.stroke.show) {
                    e.srcElement.setAttribute('stroke-width', 1)
                    e.srcElement.setAttribute('stroke', this.option.rect.stroke.background)
                    e.srcElement.setAttribute('stroke-opacity', this.option.rect.stroke.opacity)
                  }

                  var xyArr = e.target.id.split('_')
                  // 提示小气泡的文本内容,默认==>x_y：值
                  if (this.option.tip.formatter) {
                    var tipText = this.option.tip.formatter.replace(/(?<!\/){x}/g, this.option.xAxis[xyArr[0]]).replace(/(?<!\/){y}/g, this.option.yAxis[xyArr[1]]).replace(/(?<!\/){b}/g, elem[2])
                    tip.innerHTML = tipText
                  } else {
                    tip.innerHTML = e.target.id + '：' + elem[2]
                  }
                  tip.style.display = 'block'
                  tip.style.top = (e.target.attributes.row.value * section + dom.querySelector('.svg-tip').offsetHeight / 2 - translateY / 2 - labelPadding) + 'px'
                  tip.style.left = (e.target.attributes.column.value * section + size / 2 + translateX / 2 + maxStrLength + labelPadding - dom.querySelector('.svg-tip').offsetWidth / 2) + 'px'
                }
                // 鼠标移出
                rect.onmouseout = (e) => {
                  if (this.option.rect.stroke.show) {
                    e.srcElement.setAttribute('stroke-width', 0)
                  }
                  tip.style.display = 'none'
                }
              }
              //将矩形元素添加到SVG元素内
              xGroup.appendChild(rect)
              return true
            } else {
              return false
            }
          })
        })

        xGroup.setAttribute('transform', 'translate(' + (xIndex * section + maxStrLength) + ', 0)')
        
        //创建text元素并设置属性
        var xText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        xText.style.fontSize = fontSize
        xText.setAttribute('x', xIndex * section + maxStrLength)
        xText.setAttribute('y', -labelPadding)
        xText.setAttribute('class', 'month')
        xText.innerHTML = xItem
        group.appendChild(xText)
        xText.setAttribute('textLength', size < xText.getBBox().width ? size : xText.getBBox().width)
      })
      // 设置svg元素的宽高
      svg.style.width = section * this.option.xAxis.length + translateX / 2 + labelPadding + maxStrLength
      svg.style.height = section * this.option.yAxis.length + translateY
    }
  }
}