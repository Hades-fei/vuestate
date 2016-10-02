
let AOP = function(){
	
}
AOP.before = function(fn, beforeFn){
	let func = function(...args){
		let ret = beforeFn.call(this,{
			getTarget(){
				return fn
			},
			getArguments(){
				return args
			}
		})
		if(ret !== false){
			fn.call(this, ...args)
		}
	}
	func.functionName = fn.name;
	return func;
}

AOP.after = function(fn, afterFn){
	let func = function(...args){
		let ret = fn.call(this, ...args)
		afterFn.call(this, {
			getTarget(){
				return fn
			},
			getResult(){
				return ret
			},
			getArguments(){
				return args
			}
		})
	}
	func.functionName = fn.name;
	return func;
}

AOP.around = function(fn, aroundFn){
	let func = function(...args){
		let ret,
		invokeObj = {
			getAspect(){
				return aroundFn
			},
			getTarget(){
				return fn
			},
			getResult(){
				return ret;
			},
			getArguments(){
				return args;
			}
		};
		aroundFn.call(this, invokeObj);
		fn.call(this,...args);
		aroundFn.call(this, invokeObj);
	}
	func.functionName = fn.name;
	return func;
}

export default AOP