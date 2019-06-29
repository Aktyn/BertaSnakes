import * as React from 'react';

const RewardIndicator = ({reward}: {reward: number}) => {
	return <span>{reward >= 0 ?
		<span style={{color: '#8BC34A'}}>&#9650;</span> :
		<span style={{color: '#e57373'}}>&#9660;</span>}
		{Math.round(Math.abs(reward))}
	</span>;
};

export default RewardIndicator;