import React, { Fragment, useEffect } from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import styles from '../styles/Common';
import styleConstants from '../styles/StyleConstants';
import TripScreen from '../dashboard/TripScreen';
import TrackScreen from '../dashboard/Track';
import LockScreen from '../dashboard/LockScreen';
import { Toast } from "native-base";
import { heightPercentageToDP, widthPercentageToDP } from "react-native-responsive-screen";
const iconTrip = require('../../assets/images/location-gray.png');
const iconTripSelected = require('../../assets/images/location-blue.png');
const iconTrack = require('../../assets/images/truck-gray.png');
const iconTrackSelected = require('../../assets/images/truck-blue.png');
const iconLock = require('../../assets/images/lock-gray.png');
const iconLockSelected = require('../../assets/images/lock-blue.png');
import { connect } from "react-redux";
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';

class TabManager extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedIndex: 0,
        }
    }


    showMessage(message) {
        Toast.show({
            text: message,
            duration: 2000
        })
    }

    icons = [
        {
            label: 'Trip',
            normal: iconTrip,
            selected: iconTripSelected
        },
        {
            label: 'Track',
            normal: iconTrack,
            selected: iconTrackSelected
        },
        {
            label: 'Lock',
            normal: iconLock,
            selected: iconLockSelected
        }
    ]


    getSelectedScreen() {
        if (this.state.selectedIndex === 0) {
            return <TripScreen
                onAssignToMe={() => {
                    this.setState({ selectedIndex: 1 })
                }} />;
        }
        else if (this.state.selectedIndex === 1) {
            return <TrackScreen />;
        }
        else if (this.state.selectedIndex === 2) {
            return <LockScreen />;
        }
    }


    render() {
        return (
            <View style={[styles.full, styles.backgroundColor]}>
                <StatusBar barStyle="dark-content" hidden={false} backgroundColor="transparent" translucent={true} />
                <View style={{ flex: 1 }}>
                    <View style={[styles.full]}>
                        {this.getSelectedScreen()}
                    </View>
                </View>

                <View style={[styles.rh(10), styles.row, styles.center, { backgroundColor: 'white', borderRadius: widthPercentageToDP('3%') }]}>
                    {
                        this.icons.map((item, index) => {
                            return (
                                <TouchableOpacity
                                    onPress={async () => {

                                        this.setState({
                                            selectedIndex: index
                                        })
                                    }}
                                    style={[styles.full, styles.column, styles.center]}>
                                    <Image
                                        style={{ height: heightPercentageToDP('5%'), width: widthPercentageToDP('5%') }}
                                        resizeMode='contain'
                                        source={this.state.selectedIndex === index ? this.icons[index].selected : this.icons[index].normal}
                                    />
                                    <Text
                                        style={[
                                            styles.fontFamilyBold,
                                            styles.fontSize(2.2),
                                            {
                                                color: this.state.selectedIndex === index ? styleConstants.neavyBlue : styleConstants.inactiveColor
                                            }
                                        ]}>
                                        {this.icons[index].label}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })
                    }
                </View>

            </View>

        )
    }
}

const mapStateToProps = state => ({
    data: state.user.data
});

const style = StyleSheet.create({


})

export default connect(
    mapStateToProps,
    null
)(withNavigation(TabManager));
