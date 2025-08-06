import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { WifiIcon, WifiOffIcon } from '../icons/Icons';
import { useTheme } from '../../src/hooks/useTheme';

export const Clock = () => {
    const { styles } = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date: Date) => {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
    };

    return (
        <View>
            <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
            <Text style={styles.timeText}>{currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
    );
};

export const ConnectionStatus = ({ isConnected }: { isConnected: boolean | null }) => {
    const { colors, styles } = useTheme();
    if (isConnected === null) return null;

    const statusStyles = isConnected ? styles.onlinePill : styles.offlinePill;
    return (
        <View style={[styles.connectionPill, statusStyles]}>
            {isConnected ? <WifiIcon color={colors.white} /> : <WifiOffIcon color={colors.white} />}
            <Text style={styles.connectionPillText}>{isConnected ? 'Online' : 'Offline'}</Text>
        </View>
    );
};

export const OfflineDataStatus = ({ status }: { status: string | null }) => {
    const { styles } = useTheme();
    const hasData = !!status;
    const containerStyle = hasData ? styles.offlineStatusContainerSuccess : styles.offlineStatusContainerEmpty;
    
    let content;
    if (hasData) {
        const date = new Date(status ?? "");
        const formattedDate = date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const formattedTime = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        content = `Última actualización: ${formattedDate} a las ${formattedTime} hs.`;
    } else {
        content = "No hay datos guardados para modo offline.";
    }

    return (
        <View style={containerStyle}>
            <Text style={styles.offlineStatusText}>{content}</Text>
        </View>
    );
};
