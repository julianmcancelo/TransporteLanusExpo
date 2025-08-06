import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../src/hooks/useTheme';

const ChevronRightIcon = ({ color }: { color: string }) => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

interface ActionCardProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ icon, title, subtitle, onPress }) => {
    const { styles } = useTheme();

    return (
    <TouchableOpacity onPress={onPress} style={styles.actionCard}>
        <View style={styles.actionIconContainer}>{icon}</View>
        <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
        <ChevronRightIcon color={styles.actionChevron.color} />
    </TouchableOpacity>
    );
};

export default ActionCard;
