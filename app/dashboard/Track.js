import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
import { Toast } from 'native-base';
import NetInfo from "@react-native-community/netinfo";
import Header from '../component/Header'
class Track extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            expanded: false
        }
    }


    checkInternet() {
        return new Promise((resolve, reject) => {
            NetInfo.fetch().then(state => {

                if (state.isConnected) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
        })

    }

    showMessage(message) {
        Keyboard.dismiss()
        Toast.show({
            text: message,
            duration: 2000
        })
    }



    async UNSAFE_componentWillMount() {

    }

    render() {
        const { navigate } = this.props.navigation;
        return (
            <View style={[commonStyles.column, { flex: 1 }]}>
                <Header onNotificationURL={()=>{navigate('NotificationScreen')}} onProfileUrl={()=>{navigate('ProfileScreen')}} expanded={this.state.expanded} />
                <View style={[commonStyles.margin, { flex: 1, marginTop: hp('5%') }]}>
                    <View style={[styles.backgroundBox, { marginTop: hp('5%'), paddingLeft: wp('5%') }]}>
                        <TouchableOpacity onPress={async ()=>{
                            if (await this.checkInternet()) {
                                navigate("TrackScreen")
                            }
                            else {
                                this.showMessage("No Internet Connectivity!")
                            }
                        }} style={{ flex: 1, flexDirection: 'row' }}>
                            <Image style={styles.icons}
                                source={require('../../assets/images/start-trip.png')} />
                            <View style={{ flex: 1, flexDirection: 'column', marginLeft: wp('5%'), justifyContent: 'center' }}>
                                <Text style={[commonStyles.fontFamilyExtraBold, commonStyles.fontSize(2.5), { color: color.loginBG }]}>TRACK YOUR TRIP</Text>
                                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { color: color.grayColor }]}>View trip to track and take actions</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    backgroundBox: {
        height: hp('12%'),
        padding: wp('3%'),
        borderWidth: 0.5,
        borderRadius: 5,
        backgroundColor: 'white',
        borderColor: color.grayColor,
        elevation: 3,
        shadowColor: color.grayColor,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    icons: {
        justifyContent: 'center',
        alignSelf: 'center',
        width: wp('10%'),
        height: hp('5%'),
        resizeMode: 'contain'
    },
});

const mapStateToProps = state => ({
    data: state.user.data
});

export default connect(
    mapStateToProps,
    null
)(withNavigation(Track));