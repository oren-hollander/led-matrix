'use strict'

define(['lodash', 'enum'], (_, Enum) => {

  function SerializerRegistry(serializers){
    const serializerIds = Enum(_.keys(serializers))
    function getSerializerByName(name) {
      return serializers[name]
    }

    function getSerializerById(id) {
      return serializers[serializerIds.name(id)]
    }

    var registry = {getSerializerByName, getSerializerById, getSerializerId: serializerIds.value};

    // _.forEach(serializers, serializer => {
    //   serializer.registry = registry
    // })

    return registry
  }

  return SerializerRegistry
})