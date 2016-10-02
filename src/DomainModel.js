let DomainModel = function(opts={}){
	this.stateMap = {}
	
	this.addState = function(key, state){
		this.stateMap[key] = state;
	},
	this.getState = function(key){
		return key?this.stateMap[key]:this.stateMap;
	}
}
DomainModel.prototype = {
	
}

export default DomainModel