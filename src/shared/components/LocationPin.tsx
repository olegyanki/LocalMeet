import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface LocationPinProps {
  size?: number;
  color?: string;
}

export default function LocationPin({ size = 24, color = '#F27D11' }: LocationPinProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path 
        d="M10 2C7.24 2 5 4.24 5 7C5 10.88 10 18 10 18C10 18 15 10.88 15 7C15 4.24 12.76 2 10 2ZM10 9C8.9 9 8 8.1 8 7C8 5.9 8.9 5 10 5C11.1 5 12 5.9 12 7C12 8.1 11.1 9 10 9Z" 
        fill={color}
      />
    </Svg>
  );
}
