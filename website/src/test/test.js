'use strict'

require.config({
  baseUrl: 'src',
  paths: {
    'lodash': ['lib/lodash'],
    'jasmine': ['lib/jasmine/lib/jasmine-2.5.2/jasmine'],
    'jasmine-html': ['lib/jasmine/lib/jasmine-2.5.2/jasmine-html'],
    'jasmine-boot': ['lib/jasmine/lib/jasmine-2.5.2/boot']
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
  require([
    'test/annotations.specs',
    'test/serial-buffer.specs',
    'test/proto-buf.specs',
    'test/priority.specs',
    'test/relay.specs',
    'test/message-rpc.specs',
    'test/messenger.specs',
    'test/binary-serializer.specs',
    'test/rpc-channel.specs',
    'test/outgoing-message-queue.specs'
  ], function(){
    window.onload();
  })
});