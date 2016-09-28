'use strict'

require.config({
  baseUrl: '/app/rpc/src',
  paths: {
    'lodash': ['/lib/lodash'],
    'jasmine': ['/lib/jasmine/lib/jasmine-2.5.2/jasmine'],
    'jasmine-html': ['/lib/jasmine/lib/jasmine-2.5.2/jasmine-html'],
    'jasmine-boot': ['/lib/jasmine/lib/jasmine-2.5.2/boot']
  },
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
  require(['buffer/buffer.specs', 'buffer/proto-buf.specs'], function(){
    //trigger Jasmine
    window.onload();
  })
});