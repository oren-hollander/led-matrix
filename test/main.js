'use strict'

require.config({
  // to set the default folder
  baseUrl: '.',
  // paths: maps ids with paths (no extension)
  paths: {
    'jasmine': ['jasmine/lib/jasmine-2.5.2/jasmine'],
    'jasmine-html': ['jasmine/lib/jasmine-2.5.2/jasmine-html'],
    'jasmine-boot': ['jasmine/lib/jasmine-2.5.2/boot']
  },
  // shim: makes external libraries compatible with requirejs (AMD)
  shim: {
    'jasmine-html': {
      deps : ['jasmine']
    },
    'jasmine-boot': {
      deps : ['jasmine', 'jasmine-html']
    }
  }
});

require(['jasmine-boot'], function () {
  require(['test.specs'], function(){
    //trigger Jasmine
    window.onload();
  })
});