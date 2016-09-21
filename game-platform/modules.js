'use strict'

const moduleDefinitions = {}

function define(module, imports, body) {
  moduleDefinitions[module] = {imports, body}
}

function main() {

  // function dependencies(module) {
  //   return moduleDefinitions[module].imports
  // }

  const mainModule = moduleDefinitions['Main']
  delete moduleDefinitions['Main']

  Object.keys(moduleDefinitions).forEach(module => {
    moduleDefinitions[module].body
    body(imports.map(dependencies))
  })

  mainModule()
}

// (function(){
//   'use strict'
//
//   const modules = []
//
//   self.modules = {
//     exp: (module, api) => {
//       if(modules.hasOwnProperty(module))
//         throw `Module ${module} already exported!`
//       else
//         modules[module] = api
//     },
//     imp: (module) => modules[module]
//   }
// }())
