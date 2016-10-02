class State{
	constructor(){
		this.implements = {}
	}
	
	getImpl(implName){
		return implName?this.instances[implName]:this.instances
	}
	addimpl(implName, impl){
		this.implements[implName] = impl
		console.warn(`[vuestate] 同名状态实例 ${implName} 被覆盖 `)
	}
	
}

export default State