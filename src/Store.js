import {
  mergeObjects
} from './util'

let Vue
let uid = 0


let Store = function(vue){
	vue && (Vue = vue);
	this._getterCacheId = 'vuestate_store_' + uid++
	
	
	this._mutations = {}
	this._datas = {}
	

	const dispatch = this.dispatch
	this.dispatch = (...args)=>{
		dispatch.apply(this,args)
	}
		
	const silent = Vue.config.silent
	Vue.config.silent = true
	this._vm = new Vue({
		data : {
			stateDatas : this._datas
		}
	})
	Vue.config.silent = silent
	
}

Store.prototype = {
	//在store中获取vuestateContext中存储的domainModel
	getDomainModel(key){
		//待改善
		return this.getContext().getDomainModel(key)
	},
	getDatas(key){
		return key?this._datas[key]:this._datas
	},
	bindData(domainModel, domainName){
		Vue.set(this._datas, domainName, domainModel.datas || {})
		//setup mutations
		if(domainModel.mutations){
			this._mutations = mergeObjects([this._mutations, domainModel.mutations])
		}
	},
	dispatch(type, ...payload){
		const handler = this._mutations[type]
		const stateDatas = this._datas;
		if(handler){
			handler(stateDatas, ...payload)
		}
	}
	
}


export default Store