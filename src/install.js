import {getWatcher, getDep} from './util'

export default function(Vue){
	const version = Number(Vue.version.split('.')[0]);
	
	if(version >=2){
		const usesInit = Vue.config._lifecycleHooks.indexOf('init') > -1
		Vue.mixin(usesInit ? { init :vuestateInit } : { beforeCreate : vuestateInit})
	}else{
		const _init = Vue.prototype._init
		Vue.prototype._init = function(options = {}){
			options.init = options.init
				? [vuestateInit].concat(options.init)
				: vuestateInit
			_init.call(this,options)
		}
	}
}

function vuestateInit(){
	const options = this.$options
	const { vuestateContext , vuestate } = options
	if(vuestateContext){
		this.$vuestateContext = vuestateContext
		vuestateContext._init()
	}else if(options.parent && options.parent.$vuestateContext){
		this.$vuestateContext = options.parent.$vuestateContext
	}
	
	
	if(vuestate){
		if(!this.$vuestateContext){
			console.warn(
				'[vuestate] vuestateContext not injected.make sure to '+
				'provide thie vuestateContext option in your root component.'
			)
		}
		
		if(typeof vuestate === 'object'){
			const domainModels = vuestate.domainModels || {}
			for(const domainkey in domainModels){
				initDomainModels(this,domainkey,domainModels[domainkey])
			}
			
			const getters = vuestate.getters || {}
			for(const key in getters){
				defineVuestateGetter(this, key, getters[key])
			}

			const on = vuestate.on || {}
			for(const key in on){
				addStateChangeListener(this, key, on[key])
				//this.$vuestateContext._notifyStateChangeListener(key)
			}
			
			//根据初始化的数据匹配对应的状态
			let useCache=false;
			for(let key in this.$vuestateContext._stateDataChangeListener){
				this.$vuestateContext._notifyStateDataListener(key, useCache)
			}
		}else{
			console.warn('[vuestate] vuestate配置项只支持对象类型数据')
		}
		
	}
}

function setter () {
	throw new Error('vuestate getter properties are read-only.')
}

function addStateChangeListener(vm, key, listener){
	let context = vm.$vuestateContext
	let listeners = context._stateChangeListener
	if(!listeners[key]){
		listeners[key] = []
	}
	listener['vm'] = vm
	listeners[key].push(listener)
}
  
function initDomainModels(vm, key, domainModelName){
	let domainModel
	if(typeof domainModelName === 'string'){
		domainModel = vm.$vuestateContext.getDomainModel(domainModelName)
	}/*else if(typeof state === 'object'){
		state = domainModelName
	}*/else{
		console.wran('不支持的配置类型')
	}
	
	if(domainModel){
		Object.defineProperty(vm, key, {
			enumerable : true,
			configruable: true,
			get : ()=>domainModel,
			set : setter
		})
		const {originalServices, mutations, datas, stateMap} = domainModel;
		
		if(originalServices){
			//改造actions 使其的第一位入参传入store
			for(const k in originalServices){
				originalServices[k] = makeBoundAction(vm.$vuestateContext.getStore(), originalServices[k], k)
			}
		}
		if(stateMap){
			for(let stateKey in stateMap){
				let services = stateMap[stateKey].services
				for(let servKey in services){
					if(services.hasOwnProperty(servKey)){
						services[servKey] = makeBoundAction(vm.$vuestateContext.getStore(), services[servKey], servKey)
					}
				}
			}
		}
	}
}


function makeBoundAction (store, service, key) {
	if (typeof service !== 'function') {
		console.warn('[vuestate] Service bound to key is not a function.')
	}
	return function boundAction (...args) {
		return service.call(this, store, ...args)
	}
}

function defineVuestateGetter(vm, key, getter){
	if(typeof getter !== 'function'){
		console.warn(`[vuestate] Getter bound to key 'vuestate.getters.${key}' is not a function.`)
	}else{
		Object.defineProperty(vm, key, {
			enumerable : true,
			configurable : true,
			get : makeComputedGetter(vm.$vuestateContext.getStore(), getter),
			set : setter
		})
	}
}

function makeComputedGetter(store, getter){
	const id = store._getterCacheId
	
	if(getter[id]){
		return getter[id]
	}
	const vm = store._vm
	const Watcher = getWatcher(vm)
	const Dep = getDep(vm)
	const watcher = new Watcher(
		vm,
		vm => getter(vm.stateDatas),
		null,
		{ lazy: true }
	)
	const computedGetter = ()=>{
		if(watcher.dirty){
			watcher.evaluate()
		}
		if(Dep.target){
			watcher.depend()
		}
		return watcher.value
	}
	getter[id] = computedGetter
	return computedGetter
}












