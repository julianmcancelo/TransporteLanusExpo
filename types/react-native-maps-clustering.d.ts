declare module 'react-native-maps-clustering' {
  import React from 'react';
  import { StyleProp, ViewStyle } from 'react-native';
  import { MapViewProps } from 'react-native-maps';

  export interface ClusteredMapViewProps extends MapViewProps {
    clustering?: boolean;
    clusterColor?: string;
    clusterTextColor?: string;
    clusterBorderColor?: string;
    clusterBorderWidth?: number;
    clusterTextSize?: number;
    radius?: number;
    maxZoom?: number;
    minZoom?: number;
    extent?: number;
    nodeSize?: number;
    children?: React.ReactNode;
    onClusterPress?: (cluster: any, markers: any[]) => void;
    preserveClusterPressBehavior?: boolean;
    layoutAnimationConf?: any;
    animationEnabled?: boolean;
    renderCluster?: (cluster: any, onPress: () => void) => React.ReactElement;
    spiderLineColor?: string;
    edgePadding?: {
      top: number;
      left: number;
      bottom: number;
      right: number;
    };
    mapPadding?: {
      top: number;
      left: number;
      bottom: number;
      right: number;
    };
    style?: StyleProp<ViewStyle>;
  }

  const ClusteredMapView: React.ForwardRefExoticComponent<ClusteredMapViewProps & React.RefAttributes<any>>;
  export default ClusteredMapView;
}
