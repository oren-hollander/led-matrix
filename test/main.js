'use strict'

require.config({
  // to set the default folder
  baseUrl: '/app/rpc',
  // paths: maps ids with paths (no extension)
  paths: {
    'lodash': ['/lib/lodash'],
    'jasmine': ['/lib/jasmine/lib/jasmine-2.5.2/jasmine'],
    'jasmine-html': ['/lib/jasmine/lib/jasmine-2.5.2/jasmine-html'],
    'jasmine-boot': ['/lib/jasmine/lib/jasmine-2.5.2/boot']
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
  require(['../../test/priority.specs', '../../test/remote-object.specs'], function(){
    //trigger Jasmine
    window.onload();
  })
});