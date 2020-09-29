
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import styles from '../styles/Common';
import styleConstants from '../styles/StyleConstants';

const LoadingIndicator = () => (
    <View style={[styles.full, styles.center,{backgroundColor: styleConstants.blackTransparent}]}>
        <ActivityIndicator 
            size='large'
            color={styleConstants.gradientStartColor}
        />
    </View>
)

export default LoadingIndicator;