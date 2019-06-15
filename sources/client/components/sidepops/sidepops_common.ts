import * as React from 'react';

export const offsetTop = {marginTop: '10px'};

export function removeWhitechars(e: React.ChangeEvent<HTMLInputElement>) {
	//remove white characters
	e.target.value = e.target.value.replace(/\s/g, '');
}