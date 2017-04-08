(function()
{
	'use strict';
//created by Joseph
//handler for Application History
//Purpose is to handler all history when on single page 
//Basically we can use the browser native history.go() function :)

jEli
.jModule('jeli.history',{})
.jFactory('historyHandler',historyHandlerFn);

//inject dependencies
historyHandlerFn.$injector = ['$window','$rootModel','$state'];

//@function Name historyHandlerFn
function historyHandlerFn($window,$rootModel,$state)
{
	var handlers = ({
		initialize : activate,
		go : goHistory,
		$broadcast : $broadcast,
		$setPageState : setPageState,
		pushStack : $pushStack
	}),
	_history = {},
	_stack = {},
	_stackData = {};

	//set goHistory Function
	$rootModel.$go = goHistory;

	return handlers;


	function activate()
	{
		//register a new listener
		//beforeunload functionality

		$window.addEventListener('beforeunload',function(e)
		{
			//save current session
			if($rootModel.fromState)
			{
				sessionStorage.fromState = $rootModel.fromState;
				sessionStorage.fromParams = JSON.stringify( $rootModel.fromParams );
				//reference our history
				sessionStorage._history = JSON.stringify( _history );
			}

			//initialize all stacks
			var stacks = {};
			for(var stack in _stack)
			{
				//store required object in the stack
				stacks[stack] = _stack[stack]();
			}

			//store our stack
			sessionStorage._stack = JSON.stringify(stacks);
		});

		//retrieve the state from session
		if(sessionStorage.fromState)
		{
			$rootModel.fromState = sessionStorage.fromState;
			$rootModel.fromParams = JSON.parse( sessionStorage.fromParams );
			_history = JSON.parse( sessionStorage._history );
			$rootModel.refreshState = true;
		}

		//retreive saved stack results
		if(sessionStorage._stack)
		{
			//store our stack
			_stackData = JSON.parse(sessionStorage._stack);
		}

		//Add brodcast to $rootModel
		$rootModel.$on('$setHistroy',function(event,obj)
		{
			if($rootModel.refreshState)
			{
				delete $rootModel.refreshState;
				return;
			}

			//store the current state on our rootModele
			$rootModel.fromState = obj.fromState;
			$rootModel.fromParams = obj.fromParams;
		});

		//registers history from controller
		//can only be triggered on broadcast
		//parameter Object {parent:'pathway'}

		$rootModel.$on('$setPageHistory',function(event,param){
			setPageState(param.parent);
			var _len = _history[param.parent].length-1,
				_last = _history[param.parent][_len];

			if(!_last || (_last && _last.toState !== $rootModel.toState.name))
			{
				_history[param.parent].push({
					name : $rootModel.fromState,
					Param :  $rootModel.fromParams,
					toState : $rootModel.toState.name
				});
			}

		});

		//reset the storage
		sessionStorage.clear();

	}

	//To use history go function
	//define the parentName that stored the child
	//script navigates through the history Stack
	//if no history found in the stack
	//fallback to Native history

	function goHistory(parentName)
	{
		var state = _history[parentName];
		if(state.length)
		{
			var prevState = state.splice(state.length-1,1)[0];
			//goto the previous state
			if(prevState)
			{
				$state.go(prevState.name,prevState.Param);
			}else{
				history.go(-1);
			}

			return;
		}

		//for fallback we re using native history 
		history.go(-1);
	}

	function $broadcast(name,arg)
	{
		$rootModel.$broadcast(name,arg)
	}

	//creates a new Object history
	//child history will be saved in the parent
	function setPageState(state)
	{
		if(!_history[state])
		{
			_history[state] = [];
		}
	}


	//Push Stack to the History State
	//This will be triggered when page reloads
	//Only use this function if you want to store information
	//on the sessionstorage
	//Take note : sessionStorage will be emptied when page loads
	function $pushStack(name,fn,canInitialize)
	{

		this.$get = function(name)
		{
			return _stackData[name] || {};
		};

		//if name and fn
		if(!name || !fn){ return false;}

		_stack[name] = fn;

		//initialize the fn
		if(canInitialize){
			_stackData[name] = fn();
		}

	}

}

})();