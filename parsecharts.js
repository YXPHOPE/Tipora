var debugMd = true;
var cssStyle = `
pre.md-meta-block.md-end-block,pre.md-fences.md-end-block.ty-contain-cm.modeLoaded[lang=style],pre.md-fences.md-end-block[lang=script] {
  padding: 5px;
  height: 30px;
  margin-bottom: 4px;
  opacity: 0.2;
  overflow: hidden;
  transition: opacity 0.4s;
}
pre.md-meta-block.md-end-block.md-focus,pre.md-fences.md-end-block.ty-contain-cm.modeLoaded.md-focus[lang=style],pre.md-fences.md-end-block.md-focus[lang=script] {
  padding: 16px;
  height: 100%;
  margin-bottom: 10px;
  opacity: 1;
}
#write img+p, #write svg+p {
	margin: 0;
  text-align: center;
}
#write .img-center{
  display: block;
  margin: auto;
}
.copyBtn {
  border-radius: 4px;
  opacity: .4;
}
.copyBtn:hover{opacity: 1;}
/* Integrated Window's header background color */
div.info-panel-tab{margin-top:0;}
div.sidebar-content{top:40px;}
header {background-color: aliceblue;}
/* scroll bar style */
::-webkit-scrollbar {display:none;}
content::-webkit-scrollbar {
  display:block;
  width:9px;
}
content::-webkit-scrollbar-thumb {
  background-color: rgba(200,200,220,.4);
  border-radius: 4px;
}
div.sidebar-mune#typora-sidebar {left:-1800px;}
.export-choice {
  position: absolute;
  left: -1px;
  padding: 5px;
  transition: all 0.2s;
  top: 0px;
  opacity: 0.2;
  width: 43px;
  font-size: 12px;
  z-index:-2;
}
.btn.toolbar-icon.mybtn {
  padding: 5px 13px;
  opacity: 0.5;
}
.btn.toolbar-icon.mybtn:hover {opacity: 1;}
.btn.toolbar-icon.mybtn:hover #expdf {top: 27px;opacity: 1;}
.btn.toolbar-icon.mybtn:hover #exhtml {top: 54px;opacity: 1;}
.export-choice:hover {background-color: aqua !important;}
content {left:0 !important;}
#typora-sidebar-resizer {transition: all 0.3s;cursor:grab;}
#top-titlebar {height: 28px;}
/*  关闭所有动画（浪费） 建议在大文件中自行加上此句样式，防止卡顿（其实就是content重新排版造成的卡顿）
html body * {transition: none !important;} */
`;
// 思来想去，与其自己做解析，还不如首行写上类型，然后提供一个按钮供用户选择是否粘贴该类型的模板
const Template = {
  bar: `option = {
title:{
    text: '这里是标题',
},
xAxis: {
  type: 'category',
  data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  name: 'xAxis',
},
yAxis: {
  type: 'value',
  name: 'yAxis',
},
series: [
  {
    data: [120, 200, 150, 80, 70, 110, 130],
    type: 'bar'
  },
  {
    data: [50,130,120,160,80,150,90],
    type: 'bar'
  }
]
};`,
  line: ``,
  scatter: ``,
  pie: ``,
  polar: ``,
  bar_race: `
`,
};
function $q(s) {
  return document.querySelector(s);
}
const metaProperty = ["title", "xlabel", "ylabel", "xrange", "yrange"];
const chartType = ["bar", "scatter", "function"];
var Coords = [0, 0];
if (!window.MDexport) {
  var MDexport = false;
}

var write = $q("div#write");
var styleCustom = nE("style", "custom", 0);
document.head.appendChild(styleCustom);
var customScript = nE("script", "customScript", 0);
document.head.appendChild(customScript);

function nE(e, id = undefined, cla = undefined, html = "") {
  var ele = document.createElement(e);
  id && (ele.id = id);
  cla && (ele.className = cla);
  html && (ele.innerHTML = html);
  return ele;
}

function getTip(str) {
  str = str.split("\n");
  var opt = { title: {}, xAxis: {}, yAxis: {} };
  str.forEach((v) => {
    var t = v.split(":");
    switch (t[0]) {
      case "title":
        opt.title = {};
        opt.title.text = t[1];
        break;
    }
    if (metaProperty.indexOf(t[0]) >= 0) {
      if (t[0].indexOf("range") >= 0) {
        eval("t[1] = " + t[1]);
      }
      opt[t[0]] = t[1];
    }
  });
  return opt;
}
function parseCode(pre, nofocus = false) {
  var lines = pre.querySelector(".CodeMirror-code");
  if (!lines) {
    return;
  }
  pre.className = "md-fences md-end-block md-diagram md-fences-advanced ty-contain-cm modeLoaded" + (nofocus ? "" : " md-focus");
  var script = "";
  var metaLine; // = lines.children[0].textContent;
  lines.childNodes.forEach((v) => {
    script += v.textContent + "\n";
  });
  script = script.slice(0, -1);
  var ind = script.indexOf("\n");
  if (ind >= 0) {
    metaLine = script.substring(0, ind);
    script = script.substring(ind + 1);
  } else {
    debugMd && console.log("Echarts script:", script);
    return;
  }
  var classDiagram = "option",
    size = ["100%", "500px"],
    mode = "svg",
    theme = null;
  metaLine.split(" ").forEach((v) => {
    switch (true) {
      case /[ \t]+/.test(v):
        break;
      case /^\d+x\d+$/.test(v):
        size = v.split("x");
        v[0] += "px";
        v[1] += "px";
        break;
      case /^\d+$/.test(v):
        size = ["100%", v + "px"];
        break;
      case /^svg|canvas$/.test(v):
        mode = v;
        break;
      case /^dark$/.test(v):
        theme = v;
        break;
      default:
        break;
    }
  });
  if (size[0] == "100%") {
    size[0] = pre.clientWidth + "px";
  }
  var diag = pre.querySelector(".md-diagram-panel");
  if (!diag) {
    var diag = nE("div", 0, "md-diagram-panel md-fences-adv-panel", '<div class="md-diagram-panel-header"></div><div class="md-diagram-panel-preview"></div><div class="md-diagram-panel-error"></div>');
    pre.append(diag);
  }
  var chart = diag.querySelector(".md-diagram-panel-preview");
  var error = diag.querySelector(".md-diagram-panel-error");
  chart.style.cssText = `height:${size[1]};width:${size[0]};`;
  var myChart = echarts.init(chart, theme, { renderer: mode, height: size[1] });
  var option;
  if (classDiagram === "option") {
    // 添加对图例模板的解析代码
    debugMd && console.log(option);
  }
  try {
    eval(script);
    if (!option) {
      eval(metaLine + "\n" + script);
    }
    if (option) {
      if (MDexport) {
        option.animation = false;
      }
      myChart.setOption(option);
      if (MDexport) {
        pre.firstChild.style.display = "none";
        pre.style.marginBottom = "0";
      }
      error.innerHTML = "";
    } else {
      error.innerHTML = "ERROR(ECharts@5.4.1, mdEcharts@1.0.1)";
      chart.innerHTML = "";
    }
  } catch (err) {
    error.innerHTML = "ERROR: " + err + " (ECharts@5.4.1, mdEcharts@1.0.1)";
  }
  if (!nofocus) {
    var h = 30;
    var d = pre.querySelector(".md-diagram-panel.md-fences-adv-panel");
    d && (h = d.clientHeight + 30);
    pre.style.marginBottom = h + "px";
  }
}

// 粘贴示例代码，textarea可以多行，input不行
const Cinput = document.createElement("textarea");
function copyStr(str) {
  // 不能设置display none，只能脱离文档流、全透明
  Cinput.style.cssText = "opacity:0;position:absolute;z-index:-1;";
  document.body.appendChild(Cinput);
  Cinput.value = str;
  Cinput.select();
  Cdocument.execCommand("Copy");
}

function addStyle(css) {
  let c = nE("style");
  c.innerHTML = css;
  document.head.append(c);
}
function imgProcess(v) {
  let n = v.nextElementSibling,
    t;
  if (v.alt) {
    t = v.alt;
  } else {
    t = v.querySelector("title");
    if (t) {
      t = t.textContent;
    }
  }
  if (n && n.tagName === "P") {
    if (n.alt !== t) {
      n.alt = t;
    }
  } else if (t) {
    v.classList.add("img-center");
    v.outerHTML += `<p alt="${t}"></p>`;
  } else if (v.tagName === "SVG") {
    v.classList.add("img-center");
    v.outerHTML += `<p alt="${t}"></p>`;
  }
}
function myTools() {
  // 额外的功能：对```style自主添加样式的支持, 在切换文件时生效
  let sty = write.querySelector(".md-fences.md-end-block[lang=style] .CodeMirror-code");
  if (sty && styleCustom.innerHTML !== sty.textContent) {
    styleCustom.innerHTML = sty.textContent;
    if (MDexport) {
      write.querySelector(".md-fences.md-end-block[lang=style]").style.display = "none";
    }
  } else if (!sty) {
    styleCustom.innerHTML = "";
  }
  if (MDexport) {
    write.querySelectorAll("p>img:only-child, svg[alt]").forEach(imgProcess);
  } else {
    write.querySelectorAll("p .md-image.md-img-loaded:only-child img, svg[alt]").forEach(imgProcess);
  }
  let b = write.lastElementChild;
  // 当第一行的内容超过两个字时移除复制按钮
  if (b && b.tagName === "BUTTON" && write.firstElementChild.textContent.length > 2) {
    b.remove();
  }
}

function parseHTML(pre, nofocus = false) {
  var lines = pre.querySelector(".CodeMirror-code");
  if (!lines) {
    return;
  }
  pre.className = "md-fences md-end-block md-diagram md-fences-advanced ty-contain-cm modeLoaded" + (nofocus ? "" : " md-focus");
  var script = lines.textContent;
  var diag = pre.querySelector(".md-diagram-panel");
  if (!diag) {
    var diag = nE("div", 0, "md-diagram-panel md-fences-adv-panel", '<div class="md-diagram-panel-header"></div><div class="md-diagram-panel-preview"></div><div class="md-diagram-panel-error"></div>');
    pre.append(diag);
  }
  var chart = diag.querySelector(".md-diagram-panel-preview");
  chart.innerHTML = script;
  if (!nofocus) {
    var h = 30;
    var d = pre.querySelector(".md-diagram-panel.md-fences-adv-panel");
    d && (h = d.clientHeight + 30);
    pre.style.marginBottom = h + "px";
  }
}
var initMD = function () {
  addStyle(cssStyle);
  write.addEventListener("input", (e) => {
    var pre = e.path[3] || {};
    if (pre && pre.lang === "echarts") {
      parseCode(pre);
    } else if (pre && pre.lang === "purehtml") {
      parseHTML(pre);
    }
  });
  // click事件被Typora给阻止冒泡了
  write.addEventListener("mousedown", (e) => {
    var pre;
    if (!e.path) {
      return;
    }
    for (let i = 0; i < e.path.length; i++) {
      pre = e.path[i];
      if (pre.lang === "echarts" || pre.lang === "purehtml") {
        // parseCode(pre);
        var h = 30;
        var d = pre.querySelector(".md-diagram-panel.md-fences-adv-panel");
        d && (h = d.clientHeight + 30);
        pre.style.marginBottom = h + "px";
        break;
      }
    }
  });
  if (MDexport) {
    myTools();
    var chartCode = document.querySelectorAll(".md-fences.md-end-block[lang=echarts]");
    chartCode.forEach((v) => {
      console.log("Render charts: ", v);
      parseCode(v, (nofocus = true));
    });
    return;
    // ！注意！在导出时，后面的代码将不再执行！
  }

  // 每隔一段时间检测文件更改状态
  // 暂未找到更好的方法确定打开另一个文件
  var FileTitle = "。";
  var tmp = $q("#top-titlebar .title-text");
  var intervalFileChange = setInterval(() => {
    if (tmp && tmp.textContent !== FileTitle) {
      FileTitle = tmp.textContent;
      console.log("File changed to:", FileTitle);
      if (write.textContent === "") {
        // 如果是新文档，则默认加上meta信息和自定义style
        // 注入html或者元素都无效（能看到，但是md里面没有），只能模拟系统粘贴或者给用户点击复制然后自行粘贴
        let button = nE("button", 0, "copyBtn", "复制meta信息和style样式");
        button.onclick = () => {
          copyStr(`---
title: Title
author: author
creator: creator
subject: subject
keywords: [keyword1, keyword2]
---

\`\`\`style
body #write{
	font-family: Consolas, Microsoft Yahei, Roman, "Cambria Math" , SimSun, monospace;
	width:100% !important;
	padding: 15px;
	counter-reset: h1;
	--figPre: "图";
	--figSuf: " ";
}
body {counter-reset: Figures;}
code {
	font-family: Consolas;
	padding: 1px 2px;
}
#write img+p:before, #write svg+p:before {
	counter-increment: Figures;
	content: var(--figPre, "Fig") counter(h1) "." counter(h2) "." counter(h3) "-" counter(Figures) var(--figSuf," ") attr(alt);
	display: block;
	text-align: center;
	margin-top: 4px;
	margin-bottom: 10px;
}
.md-toc { counter-reset: h1; }
#write h1:first-of-type {counter-reset:h1;}
.md-toc-item.md-toc-h1, #write h1 {
	counter-reset: h2;
}
#write h2 {
	counter-reset: h3;
}
.md-toc-item.md-toc-h1 a:before, #write h1:before {
	counter-increment: h1;
	content: counter(h1)
}
.md-toc-item.md-toc-h2 a:before, #write h2:before {
	counter-increment: h2;
	content: counter(h1) "." counter(h2)
}
.md-toc-item.md-toc-h3 a:before, #write h3:before {
	counter-increment: h3;
	content: counter(h1) "." counter(h2) "." counter(h3)
}
h1:before, h2:before, h3:before{
	color: #5A5A5A;
	margin-right:10px;
}
.md-toc-item a:before { margin-right:8px; }
h1 {page-break-before: always;}
h1+h2 {page-break-before: avoid;}
h2 {
	page-break-before: always;
}
\`\`\``);
          button.remove();
        };
        write.appendChild(button);
      }
      myTools();
      let script = write.querySelector(".md-fences.md-end-block[lang=script] .CodeMirror-code");
      if (script) {
        document.documentElement.appendChild(nE("script", 0, 0, script.textContent));
        if (MDexport) {
          write.querySelector(".md-fences.md-end-block[lang=script]").style.display = "none";
        }
      }
      var chartCode = write.querySelectorAll(".md-fences.md-end-block[lang=echarts]");
      chartCode.forEach((v) => {
        console.log("Render charts: ", v);
        parseCode(v, (nofocus = true));
      });
      var pureHTML = write.querySelectorAll(".md-fences.md-end-block[lang=purehtml]");
      pureHTML.forEach((v) => {
        parseHTML(v, (nofocus = true));
      });
    }
  }, 1000);
  // 每隔一段时间调用mytools 更新css、更新img名称
  setInterval(myTools, 5000);

  // echarts 代码块内右键菜单
  addStyle(`
#copyTemp>ul>li:hover {font-weight:bold;background-color:aqua;}
#copyTemp>ul>li {padding:2px 4px 2px 16px;}
`);

  var div = nE("div", "copyTemp", 0, "复制示例代码");
  var list = nE(
    "ul",
    0,
    0,
    `
<li type="bar">柱形图</li>
<li type="line">折线图</li>
<li type="scatter">散点图</li>
<li type="pie">饼图</li>
<li type="polar">极坐标</li>
<li type="bar_race">柱形追赶图</li>
`
  );
  div.append(list);
  list.style.cssText = `
display:none;
border-top:solid 2px #ccc;
text-align:left;
list-style: none;
padding: 0;
margin: 0;
`;
  div.style.cssText = `position: fixed;
right: 20px;
top: 10px;
z-index: 999;
border: solid 2px #ccc;
padding: 0;
border-radius: 5px;
background-color: #f8f8f8;
text-align: center;
width:130px;
cursor: pointer;display: none;`;
  document.body.append(div);
  div.mouseout = true;
  // 点击事件
  div.onclick = (e) => {
    if (e.target.tagName !== "LI") {
      return;
    }
    copyStr(Template[e.target.type]);
    div.style.display = "none";
  };
  div.addEventListener("mouseenter", (e) => {
    div.style.backgroundColor = "#ded";
    div.mouseout = false;
    list.style.display = "block";
  });
  div.addEventListener("mouseleave", () => {
    div.mouseout = true;
    div.style.backgroundColor = "#f8f8f8";
    list.style.display = "none";
    setTimeout(() => {
      if (div.mouseout) {
        div.style.display = "none";
      }
    }, 2000);
  });
  write.addEventListener("click", (e) => {
    // 检查有无正在输入的获得焦点的echarts pre
    if (write.querySelector("pre.md-fences.md-end-block.md-focus[lang=echarts]") && div.style.display !== "block") {
      // 显示按钮
      div.style.display = "block";
      div.style.left = e.screenX + 200 + "px";
      div.style.top = e.screenY - 80 + "px";
      setTimeout(() => {
        if (div.mouseout) {
          div.style.display = "none";
        }
      }, 2000);
    }
  });
  // sidebar 自动隐藏（两种外观模式下均有效）
  var sidebar = $q("#typora-sidebar");
  var resizer = $q("#typora-sidebar-resizer");
  var titlebar = $q("#top-titlebar");
  resizer.style.zIndex = 99999;
  var sidebarWidth = document.documentElement.style.getPropertyValue("--sidebar-width") || "255px";
  titlebar.style.left = sidebar.style.width = sidebarWidth;
  var content = $q("content");

  function barOut() {
    sidebar.style.left = "-" + sidebarWidth;
    resizer.style.cssText = "left:0;width:20px;border-left:3px solid rgba(200,200,200,0.3);";
    titlebar.style.left = 0;
  }
  function barIn(e) {
    if (e) {
      if (e.clientY < content.clientHeight / 2) {
        // 从上半部分进入显示文件
        sidebar.classList.remove("active-tab-outline");
        sidebar.classList.add("active-tab-files");
      } else {
        // 从下半部分进入显示大纲
        sidebar.classList.remove("active-tab-files");
        sidebar.classList.add("active-tab-outline");
      }
    }
    sidebar.style.left = "0";
    resizer.style.cssText = "width:0px;border-left:0px;left:"+sidebarWidth;
    titlebar.style.left = sidebarWidth;
  }
  sidebar.addEventListener("mouseenter", () => {
    barIn.call(sidebar);
  });
  sidebar.addEventListener("mouseleave", (e) => {
    if (e.clientX < 15) {
      return;
    }
    barOut();
  });
  resizer.addEventListener("mouseenter", (e) => {
    if (e.clientX > 30) {
      return;
    }
    barIn.call(resizer, e);
  });
  // 软件右上角添加 导出和设置 按钮 （经典模式下无效）
  var btns = $q("#w-traffic-lights");
  var html = $q(".do-export-button[data-key=html]");
  var pdf = $q(".do-export-button[data-key=pdf]");
  var pref = $q("a#m-preference");
  var exp = nE(
    "span",
    0,
    "btn toolbar-icon mybtn",
    `<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2634" width="15" height="15"><path d="M968.772267 508.791467 757.111467 297.0624 757.111467 455.611733 680.0384 455.611733 671.061333 455.611733 368.503467 455.611733 368.503467 562.005333 671.061333 562.005333 680.0384 562.005333 757.111467 562.005333 757.111467 720.452267Z" p-id="2635"></path><path d="M578.389333 781.585067c0 13.175467-10.717867 23.927467-23.927467 23.927467L126.976 805.512533c-13.2096 0-23.927467-10.752-23.927467-23.927467L103.048533 242.414933c0-13.175467 10.717867-23.927467 23.927467-23.927467l427.485867 0c13.2096 0 23.927467 10.752 23.927467 23.927467l0 99.191467 47.8208 0L626.210133 242.414933C626.210133 202.8544 594.0224 170.666667 554.461867 170.666667L126.976 170.666667C87.415467 170.666667 55.227733 202.8544 55.227733 242.414933l0 539.170133C55.227733 821.1456 87.415467 853.333333 126.976 853.333333l427.485867 0c39.560533 0 71.748267-32.187733 71.748267-71.748267l0-99.191467-47.8208 0L578.389333 781.585067z" p-id="2636"></path></svg><div style="position: absolute;height: 100%;width: 43px;left: -1px;top: 0;z-index: -1;"></div>`
  );
  exp.style.cssText = "position: relative;";
  var prefbtn = nE(
    "span",
    0,
    "btn toolbar-icon mybtn",
    '<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3650" width="15" height="15"><path d="M512 328c-100.8 0-184 83.2-184 184S411.2 696 512 696 696 612.8 696 512 612.8 328 512 328z m0 320c-75.2 0-136-60.8-136-136s60.8-136 136-136 136 60.8 136 136-60.8 136-136 136z" p-id="3651"></path><path d="M857.6 572.8c-20.8-12.8-33.6-35.2-33.6-60.8s12.8-46.4 33.6-60.8c14.4-9.6 20.8-27.2 16-44.8-8-27.2-19.2-52.8-32-76.8-8-14.4-25.6-24-43.2-19.2-24 4.8-48-1.6-65.6-19.2-17.6-17.6-24-41.6-19.2-65.6 3.2-16-4.8-33.6-19.2-43.2-24-14.4-51.2-24-76.8-32-16-4.8-35.2 1.6-44.8 16-12.8 20.8-35.2 33.6-60.8 33.6s-46.4-12.8-60.8-33.6c-9.6-14.4-27.2-20.8-44.8-16-27.2 8-52.8 19.2-76.8 32-14.4 8-24 25.6-19.2 43.2 4.8 24-1.6 49.6-19.2 65.6-17.6 17.6-41.6 24-65.6 19.2-16-3.2-33.6 4.8-43.2 19.2-14.4 24-24 51.2-32 76.8-4.8 16 1.6 35.2 16 44.8 20.8 12.8 33.6 35.2 33.6 60.8s-12.8 46.4-33.6 60.8c-14.4 9.6-20.8 27.2-16 44.8 8 27.2 19.2 52.8 32 76.8 8 14.4 25.6 22.4 43.2 19.2 24-4.8 49.6 1.6 65.6 19.2 17.6 17.6 24 41.6 19.2 65.6-3.2 16 4.8 33.6 19.2 43.2 24 14.4 51.2 24 76.8 32 16 4.8 35.2-1.6 44.8-16 12.8-20.8 35.2-33.6 60.8-33.6s46.4 12.8 60.8 33.6c8 11.2 20.8 17.6 33.6 17.6 3.2 0 8 0 11.2-1.6 27.2-8 52.8-19.2 76.8-32 14.4-8 24-25.6 19.2-43.2-4.8-24 1.6-49.6 19.2-65.6 17.6-17.6 41.6-24 65.6-19.2 16 3.2 33.6-4.8 43.2-19.2 14.4-24 24-51.2 32-76.8 4.8-17.6-1.6-35.2-16-44.8z m-56 92.8c-38.4-6.4-76.8 6.4-104 33.6-27.2 27.2-40 65.6-33.6 104-17.6 9.6-36.8 17.6-56 24-22.4-30.4-57.6-49.6-97.6-49.6-38.4 0-73.6 17.6-97.6 49.6-19.2-6.4-38.4-14.4-56-24 6.4-38.4-6.4-76.8-33.6-104-27.2-27.2-65.6-40-104-33.6-9.6-17.6-17.6-36.8-24-56 30.4-22.4 49.6-57.6 49.6-97.6 0-38.4-17.6-73.6-49.6-97.6 6.4-19.2 14.4-38.4 24-56 38.4 6.4 76.8-6.4 104-33.6 27.2-27.2 40-65.6 33.6-104 17.6-9.6 36.8-17.6 56-24 22.4 30.4 57.6 49.6 97.6 49.6 38.4 0 73.6-17.6 97.6-49.6 19.2 6.4 38.4 14.4 56 24-6.4 38.4 6.4 76.8 33.6 104 27.2 27.2 65.6 40 104 33.6 9.6 17.6 17.6 36.8 24 56-30.4 22.4-49.6 57.6-49.6 97.6 0 38.4 17.6 73.6 49.6 97.6-6.4 19.2-14.4 38.4-24 56z" p-id="3652"></path></svg>'
  );
  prefbtn.style.cssText = "margin-right: 15px;";
  var exhtml = nE("div", "exhtml", "export-choice", "HTML");
  // exhtml.style.top = '27px';
  var expdf = nE("div", "expdf", "export-choice", "PDF");
  exp.appendChild(expdf);
  exp.appendChild(exhtml);
  btns.insertBefore(prefbtn, btns.firstChild);
  btns.insertBefore(exp, btns.firstChild);
  prefbtn.addEventListener("click", () => {
    pref.click();
  });
  expdf.onclick = () => {
    pdf.click();
  };
  exhtml.onclick = () => {
    html.click();
  };
};

initMD();
