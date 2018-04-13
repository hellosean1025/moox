
import {combineReducers, createStore as _createStore, applyMiddleware} from 'redux'
import produce from "immer"
import {extend} from "./utils"

const ActionSuffix = 'Action'
const CONFIG = {}

function getType(modelName, actionName){
  return 'moox/' + modelName + '/' + actionName
}

function getActionByTypeName(type){
  return type.split('/')[2]
}

function isPromise(val) {
  return val && typeof val.then === 'function';
}

function loadModel(name, model){
  const initialState = model.state;
  return  function reducer(state = initialState, action){
    let params = action.params;
    let actionFn = getActionByTypeName(action.type);
    if(model[actionFn]){
      if(CONFIG.immer){
        return produce(state, draftState=>{          
          return model[actionFn](draftState, params, state)
        })
      }
      return model[actionFn](state, params)
    }    
    return state
  }
}

function loadActions(name, model){
  const store = this;
  const keys = Object.keys(model);
  const actions = {}
  keys.forEach(item=>{
    let len = item.length;
    if(item.substr(len-6) === ActionSuffix){
      actions[item] = function actionCreator(params){
        return store.dispatch({
          type: getType(name, item),
          params
        })
      }
    }
  })
  return actions;
}

const defaultMiddleware = []

function moox(models, config = {}){
  const MOOX = {}
  const reducers = {}
  let   store;

  const keys = Object.keys(models);  
  extend(CONFIG, {
    middleware:[],
    immer: true
  },config)

  keys.forEach(name=>{
    reducers[name] = loadModel(name, models[name])
  })

  MOOX.getReducers = ()=> reducers;

  const middleware = defaultMiddleware.concat(CONFIG.middleware)
  store = applyMiddleware(...middleware)(_createStore)(combineReducers(reducers), CONFIG.preloadedState, CONFIG.enhancer);
  
  MOOX.getStore = ()=> store

  MOOX.getState = ()=> store.getState()

  keys.forEach(name=>{
    MOOX[name] = loadActions.call(store, name, models[name])
  })
  
  return MOOX;
}


module.exports = moox;