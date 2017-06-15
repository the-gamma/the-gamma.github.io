if (!thegammaInit) { var thegammaInit = false; }

var thegammaVersion = "0.1";
var scripts = document.getElementsByTagName("script");
for(var i=0; i<scripts.length; i++) {
  var res = scripts[i].src.match(/https:\/\/thegamma\.net\/lib\/thegamma-([0-9\.]+)\/embed\.js/);
  if (res != null) thegammaVersion = res[1];
}

function openDialog(id) {
  document.getElementById("thegamma-" + id + "-dialog").style.display="block";
  setTimeout(function() { 
    document.getElementById("thegamma-" + id + "-dialog").style.opacity=1;
    document.getElementById("thegamma-" + id + "-dialog-window").style.top="0px";
  },1);
}
function closeDialog(id) {
  document.getElementById("thegamma-" + id + "-dialog").style.opacity=0;
  document.getElementById("thegamma-" + id + "-dialog-window").style.top="-500px";
  setTimeout(function() { 
    document.getElementById("thegamma-" + id + "-dialog").style.display="none";
  },400)
}

function loadTheGamma() {
  require.config({
    paths:{'vs':'https://thegamma.net/lib/thegamma/vs'},
    map:{ "*":{"monaco":"vs/editor/editor.main"}}
  });
  require(["monaco", "https://thegamma.net/lib/thegamma-" + thegammaVersion + "/thegamma.js"], function (_, g) {      
    thegamma.forEach(function (id) {
      var services = "https://thegamma-services.azurewebsites.net/";      
      var providers = 
        g.providers.createProviders({ 
          "worldbank": g.providers.rest(services + "worldbank"),
          "libraries": g.providers.library("https://thegamma.net/lib/thegamma-" + thegammaVersion + "/libraries.json"),
          "shared": g.providers.rest("https://gallery-csv-service.azurewebsites.net/providers/listing"),
          "expenditure": g.providers.rest("https://govuk-expenditure.azurewebsites.net/expenditure"),
          "olympics": g.providers.pivot(services + "pdata/olympics") });
        
      // Create context and setup error handler
      var ctx = g.gamma.createContext(providers);
      ctx.errorsReported(function (errs) { 
        var lis = errs.slice(0, 5).map(function (e) { 
          return "<li><span class='err'>error " + e.number + "</span>" +
            "<span class='loc'>at line " + e.startLine + " col " + e.startColumn + "</span>: " +
            e.message;
        });        
        var ul = "<ul>" + lis + "</ul>";
        document.getElementById("thegamma-" + id + "-errors").innerHTML = ul;
      });
      
      // Get and run default code, setup update handler
      var editor;
      var code = document.getElementById(id + "-code").innerHTML;
      ctx.evaluate(code, "thegamma-" + id + "-out");
      document.getElementById("thegamma-" + id + "-update").onclick = function() {
        ctx.evaluate(editor.getValue(), "thegamma-" + id + "-out");
        closeDialog(id);
        return false;
      }

      // Specify options and create the editor
      var opts =
        { height: document.getElementById("thegamma-" + id + "-sizer").clientHeight-250,
          width: document.getElementById("thegamma-" + id + "-sizer").clientWidth-20,
          monacoOptions: function(m) {
            m.fontFamily = "Inconsolata";
            m.fontSize = 15;
            m.lineHeight = 20;
            m.lineNumbers = false;
          } };
      editor = ctx.createEditor("thegamma-" + id + "-ed", code, opts);
    });
  });
}

var codeSvg = 
 '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 2000 1500">' +
 '<path d="M572 1126.667l-50 50q-10 10-23 10t-23-10l-466-466q-10-10-10-23t10-23l466-466q10-10 23-10t23 10l50 50q10 10 10 23t-10' + 
 ' 23l-393 393 393 393q10 10 10 23t-10 23zm591-1067l-373 1291q-4 13-15.5 19.5t-23.5 2.5l-62-17q-13-4-19.5-15.5t-2.5-24.5l373-1291q4-13' +
 ' 15.5-19.5t23.5-2.5l62 17q13 4 19.5 15.5t2.5 24.5zm657 651l-466 466q-10 10-23' + 
 ' 10t-23-10l-50-50q-10-10-10-23t10-23l393-393-393-393q-10-10-10-23t10-23l50-50q10-10 23-10t23 10l466 466q10 10 10 23t-10 23z"/>' +
 '</svg>';
 
function initTheGamma() {
  thegamma.forEach(function(id) {
    var el = document.getElementById(id);  
    el.innerHTML = 
     ("<p class='thegamma-edit-p'><a onclick='openDialog(\"[ID]\");'>" + codeSvg + " edit source code</a></p>" + 
      '<div id="thegamma-[ID]-out"><p class="placeholder">Loading the visualization...</p></div>' +
      '<div id="thegamma-[ID]-sizer" class="thegamma-sizer"></div>' +
      '<div id="thegamma-[ID]-dialog" class="thegamma-dialog">' +
      '  <div id="thegamma-[ID]-dialog-window" class="thegamma-dialog-window">' +
      '  <div class="header"><a href="javascript:closeDialog(\'[ID]\');">&times;</a><span>Edit source code</span></div>' +
      '  <div class="body"><div id="thegamma-[ID]-ed"></div><div id="thegamma-[ID]-errors" class="errors"></div>' +
      '    <button id="thegamma-[ID]-update">Update page</button></div>' +
      '</div></div>').replace(/\[ID\]/g, id);
  });
  loadTheGamma();
}

if (!thegammaInit) { 
  thegammaInit=true; 
  var ol = window.onload;
  window.onload = function() { initTheGamma(); if (ol) ol(); };
  var link = '<link href="https://thegamma.net/lib/thegamma-' + thegammaVersion + '/thegamma.css" rel="stylesheet">';
  var heads = document.getElementsByTagName("head");
  if (heads.length > 0) heads[0].innerHTML += link;
  else document.write(link);
}
