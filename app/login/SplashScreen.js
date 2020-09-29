import React from "react";
import { StyleSheet, View, Image, Platform, StatusBar } from 'react-native';
import commonStyles from '../styles/Common';
import { widthPercentageToDP, heightPercentageToDP } from "react-native-responsive-screen";
import color from '../styles/StyleConstants';

export default class SplashScreen extends React.Component {


    async componentDidMount() {
        console.disableYellowBox = true;
        // Start counting when the page is loaded
        this.timeoutHandle = setTimeout(() => {
            // Add your logic for the transition
            this.props.navigation.replace('InitialScreen')
        }, 3000);
    }

    componentWillUnmount() {
        clearTimeout(this.timeoutHandle); // This is just necessary in the case that the screen is closed before the timeout fires, otherwise it would cause a memory leak that would trigger the transition regardless, breaking the user experience.
    }

    render() {
        return (
            <View style={[commonStyles.container,{backgroundColor: 'white'}]}>
                <StatusBar barStyle="dark-content" hidden={false} backgroundColor="transparent" translucent={true} />
                <View style={{ flex: 1,  justifyContent: 'center', alignContent: 'center' }}>
                    <Image style={styles.logo_container}
                        source={require('../../assets/images/sepio_white.png')} />
                </View>


            </View>
        );
    }
}

const styles = StyleSheet.create({

    logo_container: {
        width: widthPercentageToDP('55%'),
        height: heightPercentageToDP('40%'),
        resizeMode: 'contain'
    },
});