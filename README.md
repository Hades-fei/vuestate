#Vuestate

<p align="center">
	<img width="200px" src="https://raw.githubusercontent.com/Hades-fei/vuestate/master/img/Logo-vuestate.png">
</p>

##Vuestate是什么
一个基于Vuejs的面向对象的集中式状态管理架构

Vuestate借鉴了Flux和Vuex的设计思想，并集成了IOC与AOP特性的实现。



##Vuestate能做什么
如果仅仅是构建一个简单的小应用，还不需要用到Vuestate，
但如果你正在构建一个中等以上规模的SPA，并且页面上有复杂的状态切换逻辑，
这个时候你就可以考虑使用Vuestate. Vuestate在很多地方都借鉴并吸取了Vuex的优点，
使自己能在某些特定的场景下大显身手。

`正如Vuex在文档中的描述`：
“我们在单独使用 Vue.js 的时候，通常会把状态储存在组件的内部。也就是说，每一个组件都拥有当前应用状态的一部分，
`整个应用的状态是分散在各个角落的`。然而我们经常会需要把状态的一部分共享给多个组件。
一个常见的解决策略为：使用定制的事件系统，让一个组件把一些状态“发送”到其他组件中。这种模
式的问题在于，大型组件树中的事件流会很快变得非常繁杂，并且调试时很难去找出究竟哪错了。

为了更好的解决在大型应用中状态的共用问题，我们需要对组件的 组件`本地状态`(component local state) 
和 `应用层级状态`(application level state) 进行区分。`应用级的状态不属于任何特定的组件`，
但每一个组件仍然可以监视(Observe)其变化从而响应式地更新 DOM。
通过汇总应用的状态管理于一处，我们就不必到处传递事件。
因为任何牵扯到一个以上组件的逻辑，都应该写在这里。”

以上便是Vuex也是Vuestate主要解决的问题。
但Vuestate并不是在重复制造轮子。
我们发现，如果某个应用层级状态数据有多个可选的值，我们在组件内响应式的更新DOM时，
总是会顺其自然地写下一些if...else...语句。或者多个不同状态的值的组合对应一组DOM的更新，
这样会使我们的if...else...变得更多、更复杂，于是这些组件包含的逻辑代码越来越多
也越来越僵硬，(如果需求不停地增加或变更)最终仍然难逃难以维护的厄运。

有什么好的解决办法呢？ 

Vuestate推荐在编码前先对需求进行分析，对业务场景进行建模，抽象出具体的领域模型(`DomainModel`)以及其可能拥有的职能(`actions`)
例如一个在线购买的业务场景下，我们可以简单抽象出用户、商品、购物车等领域模型，
然后分析出这个领域模型可能拥有的状态，并分别编写在不同状态下不同职能的实现。
注意是`分别编写`，这样不同状态下的不同业务逻辑实现不会再混淆在一起难以区分，仅通过当前状态的命名便知道该逻辑是在什么情景下才会触发的。
那么组件如何在不同状态下渲染相应的DOM呢？ 很简单，状态的切换会触发Vue组件上'on'对象行绑定的相应的"状态切换事件监听"，
并在相应的状态下专注地渲染自身在这个状态下需要呈现的视图即可。

##使用Vuestate有哪些好处？
如上面所讲，使用Vuestate避免了在组件中为了呈现对应的状态数据而编写的大量if..else..语句，提供了一种面向对象(同时也是面向接口编程)的方式来管理状态的切换(Vuestate提供了一个轻量级的IOC实现，根据在Mapping上配置的匹配规则，动态地将不同的状态实现注入到相应的领域模型对象身上)。
同时这种方式会为每个领域模型及其不同的状态建立相应的命名空间，这样也为AOP(面向切面编程)这样强大的编程模式提供了一展身手的平台。
Vuestate支持配置AOP,通过为不同的actions配置切面，可以将大量相同逻辑的代码与各个不同的领域模型的方法绑定在一起。想象如果我们想在每个方法被调用的时候记录一下日志，如果在每个方法里都加入"记录日志方法"的调用代码，一定是一个枯燥且容易遗漏或出错的操作，更糟的是有一天统计的代码不需要了，我们此时的内心&^%$￥.....  不用担心，配置AOP可以很轻松的将两个不同的行为融合在一起，并且在不需要它们结合的时候仍然可以轻松的"拆开"它们，是不是很酷！

有人可能会问，既然Vuestate是基于Flux设计思想来实现的 ，那我们在单项数据流的结构中也是有机会为不同的行为记录日志的(例如Vuex的中间件)
这话没错，但是AOP能实现更强大的功能，在单项数据流中，所有对状态树数据的更改操作都会流经Dispatcher，即只能在action执行完毕以后才有机会被触发，
AOP直接将我们的业务逻辑代码根据配置进行"`切割`"，具体的切入点有"before"、"after"、"around"等，这样意味着我们可以在`一组业务逻辑`每次执行的之前、之后、或者环绕(之前与之后)时触发切面、我们甚至可以在切面中改变(过滤)action的参数或根据action的返回值执行相应的操作，重要的是这些对原有业务逻辑的装饰完全是"无痛"且极其灵活的。