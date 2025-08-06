import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
    color?: string;
    size?: number;
}

export const WifiIcon = ({ color = '#000000', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path 
            d="M12 20h.01M8.5 16.5a5 5 0 017 0M5 13a10 10 0 0114 0M1.5 9.5a16 16 0 0121 0" 
            stroke={color} 
            strokeWidth={2} 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
    </Svg>
);

export const WifiOffIcon = ({ color = '#000000', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path 
            d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" 
            stroke={color} 
            strokeWidth={2} 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
    </Svg>
);
