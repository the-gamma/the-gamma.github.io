---
layout: page
title: Developers
subtitle: Using The Gamma JavaScript library
description: The Gamma is available on npm and you can use it as any other JavaScript component. 
  It provides a simple and extensible API that lets you specify data sources available in the 
  programming environment, create rich editor for your users and run scripts written using The 
  Gamma. This page gives an overview of how to use it on your web sites.
permalink: /developers/
---

The easiest way to embed The Gamma into your projects is to use [thegamma-script](https://www.npmjs.com/package/thegamma-script) 
npm package. A complete example that does this is available in [thegamma-sample-web](https://github.com/the-gamma/thegamma-sample-web)
repository on GitHub, so if you prefer to see code rather than read text, you can head straight
there! You can see the sample web page [running live online](http://thegamma-sample-web.azurewebsites.net/).

## Running the sample

Running the sample should be easy - it is a pure JavaScript node project using the Express.js web
server to host static files in the `web` subdirectory together with selected files from the 
`node_modules` folder. To run the sample web site, clone it and run:

```
git clone https://github.com/the-gamma/thegamma-sample-web.git
cd thegamma-sample-web
npm install
npm run start
```

The `npm run start` command should start a local server at [localhost:8089](http://localhost:8089/)
and open a browser with the sample web page. We use Node.js just to get the latest version of
thegamma-script from npm and serve static files, but there is no server-side processing here
(in a real web page, you probably also do not want to expose the contents of your 
`node_modules` in the server, but we do this to make the demo simpler).

## Using The Gamma in JavaScript

The Gamma source code editor is based on the [Monaco editor](https://github.com/Microsoft/monaco-editor).
As the recommended way of loading Monaco is to use a loader such as `require.js`, we're going to do
the same in our example. The following snippet:

 - References `thegamma.css` stylesheet, which contains some styling for the live previews
   in The Gamma editor. Feel free to copy and modify this to fit your needs!
   
 - Loads the standalone version of [Babel](https://babeljs.io/), which is used by The Gamma 
   compiler and interpreter to run your code. The standalone version comes with all you need
   to run The Gamma scripts in the browser.
   
 - Reference Google Charts API - this is currently used by The Gamma for creating charts.
   If you are interested in using other charting libraries, open an issue - adding support
   for other libraries would be a great contribution!   
   
Once we reference the required stylesheets and scripts, we can use `require.js` and use it  
to load the Monaco editor and the compiled `thegamma.js` script. Once the loading completes,
we can start using the `g` module to use The Gamma:
   
```html
<link href="/lib/thegamma.css" rel="stylesheet">
<script src="/node_modules/babel-standalone/babel.min.js"></script>
<script src="/node_modules/requirejs/require.js"></script>
<script src="//www.google.com/jsapi"></script>
<script>
  require.config({
    paths:{'vs':'node_modules/monaco-editor/min/vs'},
    map:{ "*":{"monaco":"vs/editor/editor.main"}}
  });
  require(
    [ "vs/editor/editor.main", 
      "node_modules/thegamma-script/dist/thegamma.js" ], 
    function (_, g) {      
      // Use the 'g' module to work with The Gamma!
    });
</script>
```

### Setting up programming environment

Once The Gamma is loaded, we can configure what data sources (type providers) are available
in the programming environment, run The Gamma scripts and create the editor component. The
sample application uses a sample service that provides Olympic medal data as `olympics`. 
As another example, we also provide `worldbank` value, which is another kind of type provider
(see below). Finally, we specify the libraries that are available to use in the user code:

```js
var services = "http://thegamma-services.azurewebsites.net/";
var libs = "/node_modules/thegamma-script/dist/libraries.json";

var providers = 
  g.providers.createProviders({ 
    "worldbank": g.providers.rest(services + "worldbank"),
    "olympics": g.providers.pivot(services + "pdata/olympics"),
    "libraries": g.providers.library(libs) });
    
var ctx = g.gamma.createContext(providers);
```

The `g.providers` API lets you define three kinds of "type providers" that define what code
can users write in The Gamma editor:

 - The `pivot` provider takes a service that can evaluate "data aggregation" requests.
   The demo uses a [sample implementation](https://github.com/the-gamma/thegamma-services/blob/master/src/pdata/server.fsx)
   for the Olympic medals data set. The protocol that the service exposes is documented at
   [publishing data](/publishing) page. The provider automatically generates members that let you
   write data aggregations and transformations using `.` as in the demo.  

 - The `library` provider takes a JSON that specifies the types and structure of JavaScript 
   libraries - the `thegamma-script` package comes with a couple of wrappers for Google Charts
   and for generating tables that you can see in the [Olympic Medalists demo](http://rio2016.thegamma.net/).
   You can create your own too, but it's not documented yet...
   
 - The `rest` provider is not fully documented yet, but it lets you provide types that expose
   any members. This is based on the [F# RestProvider project](https://fsprojects.github.io/RestProvider/),
   which provides minimal documentation - get in touch if you're interested in using non-pivot 
   data!
   
### Running code and error reporting
 
Now that we have The Gamma programming context `ctx`, we can use it in a number of ways:

 - `evaluate` lets you run user code written using The Gamma script.
 - `createEditor` lets you create Monaco editor for editing The Gamma code.
 - `errorReported` lets you register an event handler that is called code contains error.
   This is triggered when you run code using `evaluate` or while the user edits code in the editor.

As an example, assume we have the following The Gamma script code, embedded in the page in 
`<script>` tag with id `demo` (this is roughly what the homepage of this documentation uses):

```html
<script type="text/thegamma" id="demo">
  let data =
    olympics
      .'group data'.'by Athlete'.'sum Gold'.then
      .'sort data'.'by Gold descending'.then
      .paging.take(8)
      .'get series'.'with key Athlete'.'and value Gold'
    
  chart.column(data)
</script>
```

Now, we can call the `ctx.errorsReported` function to register an error handler that gets called
when we try to evaluate invalid code (the above code is correct, but you'll also get errors when
the user edits the code in the editor):

```js
ctx.errorsReported(function (errs) { 
  for(var i = 0; i < errs.length; i++) {
    var e = errs[i];
    console.log("error " + e.number + " at line " +
      e.startLine + " col " + e.startColumn + ": " +
      e.message);
  }
});
```

Finally, we can get the text of the sample snippet and run it using `ctx.evaluate`. The second
parameter specifies the id of a HTML element that will be used for output - this is where the
charts and tables that are produced by the script will go:

```js
var code = document.getElementById("demo").innerText;
ctx.evaluate(code, "out1");
```

### Creating and using the editor

Finally, the last feature that is currently exposed in The Gamma API is creating an editor that lets 
users modify code snippets. To create the editor, we first need to provide options. The available 
options and their default values are:

```js
{ // Width of the editor. When not specified,
  // use 'clientWidth' of the containing element
  "width": null,
  // Height of the editor. When not specified,
  // use 'clientHeight' of the containing element
  "height": null, 
  // When set to 'true', editor element is resized
  // to make all content visible (up to 'maxHeight')
  "autoHeight" : false,
  // When 'autoHeight' is 'true', this is the maximal
  // allowed height of the editor component
  "maxHeight": null,
  // A function that is called to specify the options
  // (font, etc.) of the Monaco text editor
  "monacoOptions": null }
```

The `monacoOptions` function is called with a value that is then passed to the Monaco editor. The
options that you can set on the value are specified in [the Monaco 
documentation](https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.ieditorconstructionoptions.html).
The following example creates an editor, disables line numbers and sets the Monaco font:

```js
var sizer = document.getElementById("sizer");
var opts =
  { height: sizer.clientHeight - 150,
    width: sizer.clientWidth - 40,
    monacoOptions: function(m) {
      m.fontFamily = "Inconsolata";
      m.fontSize = 15;
      m.lineHeight = 20;
      m.lineNumbers = false;
    } };
var editor = ctx.createEditor("ed1", code, opts);
```

When calling `createEditor`, we give it the id of a HTML element on the page that will contain
the editor, initial code and editor options. You can then use the returned `editor` value to
get and set the value (code) in the editor:

```js
var code = editor.getValue();
editor.setValue(code);
```

If you have any further questions or comments, please feel free to ping us on Twitter at
[@thegamma_net](http://twitter.com/thegamma_net) or open an issue on the project
[GitHub page](http://github.com/the-gamma/thegamma-script)!
