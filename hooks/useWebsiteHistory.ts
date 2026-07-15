"use client";
import { useCallback, useReducer, type SetStateAction } from "react";
import type { WebsiteJSON } from "@/types/website";

type State={past:WebsiteJSON[];present:WebsiteJSON;future:WebsiteJSON[];group:string|null;groupedAt:number};
type Action={type:"commit";value:SetStateAction<WebsiteJSON>;group?:string;now:number}|{type:"replace";value:WebsiteJSON}|{type:"undo"}|{type:"redo"};
const LIMIT=100;
const GROUP_WINDOW_MS=1200;
function reducer(state:State,action:Action):State{
 if(action.type==="replace")return{past:[],present:action.value,future:[],group:null,groupedAt:0};
 if(action.type==="undo"){const previous=state.past.at(-1);return previous?{past:state.past.slice(0,-1),present:previous,future:[state.present,...state.future],group:null,groupedAt:0}:state}
 if(action.type==="redo"){const next=state.future[0];return next?{past:[...state.past,state.present].slice(-LIMIT),present:next,future:state.future.slice(1),group:null,groupedAt:0}:state}
 const next=typeof action.value==="function"?action.value(state.present):action.value;
 if(Object.is(next,state.present))return state;
 const continuesGroup=Boolean(action.group&&action.group===state.group&&action.now-state.groupedAt<GROUP_WINDOW_MS);
 return{past:continuesGroup?state.past:[...state.past,state.present].slice(-LIMIT),present:next,future:[],group:action.group??null,groupedAt:action.group?action.now:0};
}
export function useWebsiteHistory(initial:WebsiteJSON){const[state,dispatch]=useReducer(reducer,{past:[],present:initial,future:[],group:null,groupedAt:0});return{website:state.present,setWebsite:useCallback((value:SetStateAction<WebsiteJSON>,group?:string)=>dispatch({type:"commit",value,group,now:Date.now()}),[]),replaceWebsite:useCallback((value:WebsiteJSON)=>dispatch({type:"replace",value}),[]),undo:useCallback(()=>dispatch({type:"undo"}),[]),redo:useCallback(()=>dispatch({type:"redo"}),[]),canUndo:state.past.length>0,canRedo:state.future.length>0}}
