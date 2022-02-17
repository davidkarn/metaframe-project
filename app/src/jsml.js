import React, {useState} from "react";

function flatten(arr) {
	var flattened = []
	for (var i in arr) {
            if (arr[i] instanceof Array)
		flattened = flattened.concat(flatten(arr[i]))
            else if (arr[i])
		flattened.push(arr[i])}
	return flattened }

export default function jsml(klass, ...args) {
  const attrs = args[0]
	var children = [];
	for (var i = 2; i < arguments.length;i++)
    if (arguments[i]) {
		  if (arguments[i] instanceof Array)
        children = children.concat(flatten(arguments[i]))
		  else
        children.push(arguments[i]); }
  
	var args = [klass, attrs].concat(children);
	return React.createElement.apply(React, args); }

