---
layout: page
title: Contributing
subtitle: Building from the source code
description: If you are a developer and want to help us build better tools for open and transparent
  data-driven story-telling, this is the place to start! The Gamma is written using the awesome 
  F# language and compiled to JavaScript using Fable, so this is fun project if you want to play 
  with some nice technology!
permalink: /contributing/
---

## The Gamma project structure 

All project source code is available under the [the-gamma organization on GitHub](https://github.com/the-gamma).
If you want to run everything locally, you'll need to clone and run the following three projects:

 - [**thegamma-script**](https://github.com/the-gamma/thegamma-script) is the most important one.
   It implements the parser, compiler, analyzer and live editor for the simple programming language
   that powers The Gamma. The project is written using F# and compiled to JavaScript
   via [Fable](http://fable.io).

 - [**thegamma-sample-web**](https://github.com/the-gamma/thegamma-sample-web) is a minimal web
   site that you can use for testing your changes. This is a pure Node.js web page using the 
   [Express](http://expressjs.com/) framework. Live version is [running on 
   Azure](http://thegamma-sample-web.azurewebsites.net/), but it's a plain Node.js web site and will
   run anywhere.
   
 - [**thegamma-services**](http://thegamma-sample-web.azurewebsites.net/) implements the REST service
   that provides data for the sample visualizations. This is built using F# and [Suave](http://suave.io)
   and there are a number of scripts. The data source for Olympic medals is implemented
   [here](https://github.com/the-gamma/thegamma-services/blob/master/src/pdata/server.fsx).

## Getting started with F# &nbsp;

If you are new to Fable and F#, you'll need to install F# first. There is a good documentation on 
how to do this on [fsharp.org](http://fsharp.org) for all platforms.

 * On [Mac](http://fsharp.org/use/mac/) and [Linux](http://fsharp.org/use/linux/), the best option
   is to use mono (which is the runtime that F# uses). F# works with many popular editors including
   Emacs and Atom. If you have no preferences, many people use Visual Studio Code with the 
   [Ionide plugin](http://ionide.io/).
   
 * On [Windows](http://fsharp.org/use/windows/), most F# developers use the latest version of
   Visual Studio, which comes with F# support (but make sure to choose it during the installation),
   although you can also use more lightweight Visual Studio Code with [Ionide plugin](http://ionide.io/).
   The .NET runtime is already included with Windows.

 * No special installation is needed for Fable. Fable is available on npm and it will get downloaded
   for you when you build The Gamma. However, the [Fable web site](http://fable.io/) contains 
   plenty of useful resources if you want to learn more about it!

## Cloning and running locally

To run The Gamma locally, you first need to clone [thegamma-script](https://github.com/the-gamma/thegamma-script)
repository. This is the source code for [thegamma-script npm package](https://www.npmjs.com/package/thegamma-script),
which implements the compiler etc.:

```
git clone https://github.com/the-gamma/thegamma-script.git
cd thegamma-script
npm install
npm link
npm run watch
```

The `npm run watch` command will run the Fable compiler in background and watch for changes in the
source code. When you make any change and save the file, the compiled output (in the `dist` folder)
will be updated. Before running `npm run watch`, it is a good idea to run `npm link`
[see docs](https://docs.npmjs.com/cli/link), which lets you reference the local version of the
package from the sample web site (and see your changes instantly).

Next, we clone and run [thegamma-sample-web](https://github.com/the-gamma/thegamma-sample-web),
which is a minimal web site that uses thegamma-script package:

```
git clone https://github.com/the-gamma/thegamma-sample-web.git
cd thegamma-sample-web
npm install
npm link thegamma-script
npm start
```

If you run `npm link thegamma-script`, your local build of the package `thegamma-script` will be 
used instead of the one from the npm. When you save a file in `thegamma-script` project, you will
see the changes (almost) immediately in the sample web site! Running `npm start` should also open
browser window with the locally hosted demo.

Finally, if you also want to run a local version of the REST service that provides data for the
`olympics` (and other data sources), you need to clone [thegamma-services](https://github.com/the-gamma/thegamma-services)
too:

```
git clone https://github.com/the-gamma/thegamma-services.git
cd thegamma-services
./build.sh
```

The `build.sh` script will download dependencies and start the services in background at 
[localhost:10042](http://localhost:10042). It will watch for file changes and when you make a 
change, it will automatically reload the modified services. To use the local version of services
in the sample web, modify the line that defines the `services` variable in 
[index.html](https://github.com/the-gamma/thegamma-sample-web/blob/f7b19937df37b6a476cfa9d6e998070a6ac2e779/web/index.html#L134).


 
