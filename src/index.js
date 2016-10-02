import {
  mergeObjects, isObject,
  getNestedState, getWatcher
} from './util'
import Context from './Context'
import override from './install'

let Vue


let _context, mappingsOpt, aopOpt
function getContext(){
	if(!Vue){
		throw new Error('[vuestate]使用vuestate前请先调用Vue.use(vuestate)安装')
	}
	return _context?_context:(new Context( Vue, mappingsOpt, aopOpt));
}


function install (_Vue, opts) {
  if (Vue) {
    console.warn(
      '[vuex] already installed. Vue.use(Vuex) should be called only once.'
    )
    return
  }
  Vue = _Vue
  opts && (mappingsOpt = opts.mappings)
  opts && (aopOpt = opts.aop)
  override(Vue)
}

// auto install in dist mode
//if (typeof window !== 'undefined' && window.Vue) {
//install(window.Vue)
//}


export default {
	getContext,
	install
}
