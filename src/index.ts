import Vue, { ComponentOptions } from 'vue'

type C = { new (...args: any[]): {} }

type R = Record<any, any>

export function makeOptions(model: R): ComponentOptions<any> {
  // prototype
  const prototype = Object.getPrototypeOf(model)
  if (!prototype || prototype === Object.prototype) {
    return {}
  }

  // parent options
  const extendsOptions = makeOptions(prototype)

  // descriptors
  const descriptors = Object.getOwnPropertyDescriptors(prototype)

  // options
  const name = prototype.constructor.name
  const data: R = {}
  const computed: R = {}
  const methods: R = {}
  const watch: R = {}

  // data, string watches
  Object.keys(model).forEach(key => {
    const value = model[key]
    if (key.startsWith('on:')) {
      watch[key.substring(3)] = value
    }
    else {
      data[key] = value
    }
  })

  // function watches, methods, computed
  Object.keys(descriptors).forEach(key => {
    if (key !== 'constructor' && !key.startsWith('__')) {
      const { value, get, set } = descriptors[key]
      if (key.startsWith('on:')) {
        watch[key.substring(3)] = value
      }
      else if (value) {
        methods[key] = value
      }
      else if (get && set) {
        computed[key] = { get, set }
      }
      else if (get) {
        computed[key] = get
      }
    }
  })

  // return
  return {
    name,
    extends: extendsOptions,
    computed,
    methods,
    watch,
    data,
  }
}

export function makeVue<T extends R> (model: T): T {
  const options = makeOptions(model)
  return (new Vue(options) as unknown) as T
}

export default function VueStore<T extends C> (constructor: T): T {
  function construct (...args: any[]) {
    const instance = new (constructor as C)(...args)
    return makeVue(instance)
  }
  return (construct as unknown) as T
}

VueStore.create = makeVue
