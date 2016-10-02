import DomainModel from './DomainModel'
import Store from './Store'
import AOP from './AOP'

let Vue
let Context = function( _Vue, mappings=[], aops=[]){
	Vue = _Vue
	let self = this;
	this.mappings = mappings
	this.aopArray = aops
	this.store = new Store(Vue)
	this.store.getContext = function(){return self;};
	this.domainModelMap = {}
	//状态切换时的消息通知集合
	this._stateChangeListener = {}
	//数据改变时的消息通知集合
	this._stateDataChangeListener = {}
	
	//_init.call(this)
}

let _inited = false
Context.prototype = {
	_init(){
		if(!_inited){
			if(this.mappings){
				this._initMapping(this.mappings)
			}
			if(this.aopArray){
				this._initAOP(this.aopArray)
			}
			//根据初始化的数据匹配对应的状态
			for(let key in this._stateDataChangeListener){
				this._notifyStateDataListener(key)
			}
			_inited = true
		}
		
	},
	getStore(){
		return this.store
	},
	defineDomainModel(name, opts){
		let _store = this.store
		
		let domainModel = new DomainModel()
		let services = opts.services
		if(services){
			//state自己的prototype用来放置子具体对象的action，
			//在fn的prototype中放置抽象state的action，当做具体状态对象的默认action
			let fn = function(){}
			fn.prototype = services
			Object.setPrototypeOf(domainModel, new fn())
			domainModel.originalServices = services
		}
		domainModel['domainName'] = name;
		domainModel['datas'] = opts.datas
		domainModel['mutations'] = opts.mutations
		
		//如果store已实例化 则向其身上绑定新创建的抽象状态对象
		_store && _store.bindData(domainModel, name)
		this.domainModelMap[name] = domainModel
		
		
		return domainModel
	},
	createDomainState(domainModelName, stateName, opts){
		let domainModel = this.getDomainModel(domainModelName)
		if(!domainModel){
			console.warn('[vuestate] 注册子对象时，找不到相应的领域模型对象')
			return false
		}
		opts['stateName'] = stateName;
		domainModel.addState(stateName, opts)
		
		//根据初始化的数据匹配对应的状态
		/*for(let key in this._stateDataChangeListener){
			this._notifyStateDataListener(key)
		}*/
		this._notifyStateDataListener(domainModelName)
	},
	getDomainModel(modelName){
		return this.domainModelMap[modelName]
	},
	_notifyStateChangeListener(key){
		let listeners = this._stateChangeListener[key]
		if(listeners ){
			for(let i=0,len=listeners.length;i<len;i++){
				listeners[i].call(listeners[i]['vm'])
			}
			
		}
	},
	_initMapping(mappings){
		const store = this.store
		if(Array.isArray(mappings)){
			for(let mapp of mappings){
				mapp = this._buildMapping(mapp)
				this._addStateDataListener([mapp.state.split('@')[0]] , mapp)
			}
		}else if(typeof mappings === 'object'){
			let mapp = this._buildMapping(mappings)
		}else{
			console.warn('[vuestate] 不支持的映射类型')
		}
	},
	_buildMapping(mapping){
		let match = mapping.match
		let self = this;
		const store = this.store
		const matchState = mapping.state
		const matchStateName = matchState.split('@')[0]
		if(!Array.isArray(match)){
			match = [match]
		}
		let domainModelName, propertyPath, level=0, val,_keyarr
		for(let m of match){
			_keyarr = m.key?m.key.split(':'):['','']
			domainModelName = _keyarr[0]
			propertyPath = _keyarr[1]
			
			if(domainModelName && propertyPath){
				//'stateDatas.UserState.isLogin'
				store._vm.$watch(`stateDatas.${domainModelName}.${propertyPath}`,function(newData,oldData){
					//console.log('!!!!!!!!!!!!!!!!!!!!!!@@@@@@@@@@@@ '+newData)
					self._notifyStateDataListener([matchStateName])
				})
			}
			
			
			m.domainModelName = domainModelName
			m.propertyPath = propertyPath
			val = m.val
			if(val===null || val===undefined){
				console.warn('[veustate] 匹配的值为'+val)
			}
			if(typeof val === 'object'){
				level += 0
				if(val.min || val.max){
					level += 5
				}
			}else{
				level = +10
			}
		}
		mapping.level = level
		return mapping
	},
	_addStateDataListener(key,val){
		this._stateDataChangeListener[key] = this._stateDataChangeListener[key] || []
		this._stateDataChangeListener[key].push(val)
	},
	_notifyStateDataListener(key, useCache=true){
		let listener = this._stateDataChangeListener[key]
		if(listener){
			let matchObjs = {};

			for(let item of listener){
				let state = item.state
				if(state.indexOf('@')<0){
					console.warn('[vuestate] state配置项有误')
					return false
				}
				let _keyArr = state.split('@')
				let domainModel = _keyArr[0]
				let stateName = _keyArr[1]
				if(!matchObjs[domainModel]){
					matchObjs[domainModel] = {level:0}
				}
				
				if(this._checkMapping(item)){
					if(item.level > matchObjs[domainModel].level){
						matchObjs[domainModel] = item
					}
				}
				
			}
			
			this._switchState(matchObjs,useCache)
		}
	},
	//检查每一项映射是否匹配
	_checkMapping(mappngItem){
		let ret = true
		let stateData = this.store.getDatas()
		let matchs = mappngItem.match
		if(!Array.isArray(matchs)){
			matchs = [matchs]
		}
		let matchVal,domainModelName,propertyPath,propertyArr,dataVal
		for(let m of matchs){
			domainModelName = m.domainModelName
			propertyPath = m.propertyPath
			matchVal = m.val
			if(domainModelName && propertyPath){
				//propertyPath = propertyPath.split('.').unshift(domainModelName)
				propertyArr = [domainModelName].concat(propertyPath.split('.'))
				dataVal = _getValueBypropertyPath(stateData, propertyArr)
				if(typeof matchVal === 'object'){
					if(matchVal.min && dataVal<matchVal.min  ||  matchVal.max && dataVal>matchVal.max){
						ret = false
						break
					}
				}else if(dataVal !== matchVal){
					ret = false
					break
				}
			}else{
				ret = false
				console.warn(`[vuestate] 检查数据映射时出错，没有找到映射的对象或属性：${m.kay}`)
				break
			}
		}
		return ret;
	},
	_switchState(matchObjs, useCache=true){
		let maxLevelItem
		for(let absStateName in matchObjs){
			if(matchObjs[absStateName].level > 0){
				maxLevelItem = matchObjs[absStateName]
				let state = maxLevelItem.state
				if(state.indexOf('@')<0){
					console.warn('[vuestate] state配置项有误')
					return false
				}
				let _keyArr = state.split('@')
				let domainModelName = _keyArr[0]
				let stateName = _keyArr[1]
				
				let domainModel = this.domainModelMap[domainModelName]
				let stateImpl = domainModel.getState(stateName)
				
				if(stateImpl){
					let currAction = domainModel.__proto__
	
					//如果匹配到状态和当前状态不一样的时候(并且没有指定强制刷新状态useCache=false 例如组件初始化时调用on事件)才改变
					if(!useCache || (currAction !== stateImpl.services)){
						let orgServices = domainModel.originalServices
						Object.setPrototypeOf(stateImpl.services,orgServices)
						Object.setPrototypeOf(domainModel,stateImpl.services)
						
						//通知页面上配置的'on' 状态改变了
						this._notifyStateChangeListener(state)
					}
					domainModel.currentState = stateImpl;
				}
			}else{//如果没有匹配的状态，则还原为默认的抽象状态
				//console.log('如果没有匹配的状态，则还原为默认的抽象状态')
				let domainModel = this.domainModelMap[absStateName]
				let orgServices = domainModel.originalServices
				Object.setPrototypeOf(domainModel, orgServices)
				domainModel.currentState = {
					stateName : 'defaultState',
					services : orgServices
				};
			}
		}
	},
	_initAOP(aopArray){
		for(let i=0,len=aopArray.length;i<len;i++){
			let aopItem = aopArray[i]
			let {target, before, after, around} = aopItem
			if(!Array.isArray(target)){
				target = [target]
			}
			for(let k=0,len=target.length;k<len;k++){
				var _t = target[k]
				if(typeof _t === 'string'){
					if(_t.indexOf('@')>=0){
						let _keyArr = _t.split('@')
						let domainModelName = _keyArr[0]
						let domainModel = this.domainModelMap[domainModelName]
						let express = _keyArr[1]
						if(domainModelName && express){
							express = express.split('.')
							if(express[0] === '*'){
								//所有状态 //domain@.*
								let states = domainModel.getState()
								for(let stateName in states){
									let stateImpl = states[stateName]
									let services = stateImpl.services
									for(let funcName in services){
										this._bindAOP(services,funcName,before,after,around)
									}
								}
								let originalServices = domainModel.originalServices;
								for(let funcName in originalServices){
									this._bindAOP(originalServices,funcName,before,after,around)
								}
							}else{
								let stateName = express[0]
								let stateImpl = domainModel.getState(stateName)
								//例:"Game@user-state-loggedin.*" 先去掉状态名称user-state-loggedin
								//express.shift()
								if(stateImpl){
									//domain@stateImpl.*  || domain@stateImpl
									if(express[1] === '*' && express.length===2 || express.indexOf('*')<0 && express.length===1){
										//绑定切面  stateImpl.services
										let services = stateImpl.services
										for(let funcName in services){
											this._bindAOP(services,funcName,before,after,around)
										}
										
									}else if(express.indexOf('*')<0 && express.length===2){
										//domain@stateImpl.prototype
										let property = stateImpl.services[express[1]]
										if(typeof property === 'function'){
											//绑定切面 property
											this._bindAOP(stateImpl.services,express[1],before,after,around)
										}
									}else{
										console.warn(`[vuestate] AOP表达式有误: "${_t}"`)
									}
									
								}
							}
						}else{
							console.warn(`[vuestate] AOP表达式有误: "${_t}"`)
						}
					}else{
						//domain.prototype
						let express = _t.split('.')
						let domainModelName = express[0]
						let domainModel = this.domainModelMap[domainModelName]
						if(express[1]){
							express.shift()
							let orgServices = domainModel.originalServices
							let property = _getValueBypropertyPath(orgServices,express)
							if(typeof property === 'function'){
								//绑定切面
								this._bindAOP(orgServices,express[0],before,after,around)
							}else{
								console.warn(`[vuestate] AOP表达式有误: "${_t}"`)
							}
						}else if(domainModel){  // domain
							let originalServices = domainModel.originalServices;
							for(let funcName in originalServices){
								this._bindAOP(originalServices,funcName,before,after,around)
							}
						}else{
							console.warn(`[vuestate] AOP表达式有误: "${_t}"`)
						}
					}
				}
			}
		}
	},
	_bindAOP(obj,fnName,before,after,around){
		if(before){
			let fn = obj[fnName]
			if(!Array.isArray(before)){
				before = [before]
			}
			for(let i=0,len=before.length;i<len;i++){
				if(typeof before[i] !== 'function'){
					console.warn('[vuestate] AOP配置项必须为function')
					continue
				}
				obj[fnName] = AOP.before(fn,before[i])
			}
		}
		if(after){
			let fn = obj[fnName]
			if(!Array.isArray(after)){
				after = [after]
			}
			for(let i=0,len=after.length;i<len;i++){
				if(typeof after[i] !== 'function'){
					console.warn('[vuestate] AOP配置项必须为function')
					continue
				}
				obj[fnName] = AOP.after(fn,after[i])
			}
		}
		if(around){
			let fn = obj[fnName]
			if(!Array.isArray(around)){
				around = [around]
			}
			for(let i=0,len=around.length;i<len;i++){
				if(typeof around[i] !== 'function'){
					console.warn('[vuestate] AOP配置项必须为function')
					continue
				}
				obj[fnName] = AOP.around(fn,around[i])
			}
		}
	}
	
}


//根据属性path获得对象身上的属性值
function _getValueBypropertyPath(obj,propertyArr){
	if(propertyArr.length<=0){
		return undefined
	}else if(propertyArr.length<=1){
		return obj[propertyArr[0]]
	}
	let propertyKey = propertyArr.shift()
	return obj[propertyKey]?_getValueBypropertyPath(obj[propertyKey], propertyArr) : undefined
}

export default Context