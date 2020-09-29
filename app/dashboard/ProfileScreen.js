import React from "react";
import {
    StyleSheet, View, Text, TouchableOpacity, Image, Alert,
} from 'react-native';
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
import LinearGradient from 'react-native-linear-gradient';
import { ScrollView } from "react-native-gesture-handler";
import { Toast } from 'native-base';
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from '@react-native-community/async-storage';
import Header from '../component/Header';
import Globals from '../Globals';
const axios = require('axios');
class ProfileScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            expanded: true
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
        Toast.show({
            text: message,
            duration: 2000
        })
    }

    logout = async () => {
        Alert.alert(
            'Logout',
            'You will be returned to the login screen.',
            [
                {
                    text: 'Cancel', onPress: () => {

                    }, style: 'cancel'
                },
                {
                    text: 'Logout', onPress: async () => {
                        this.updatefcmtoken();
                    }
                },
            ],
            { cancelable: false }
        )
    }

    async updatefcmtoken() {

        var token = await AsyncStorage.getItem('user_token');
        var fcm_token = await AsyncStorage.getItem('fcm_token');
        var url = Globals.URL + Globals.update_token;
        console.log("token:", token)
        let data = {
            fcm: fcm_token
        }
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + (token)
        }
        try {
            var response = await axios.put(url, data, {
                headers: headers
            })

            if (response.status === 200) {
                console.log("data : ", response.data)
                this.setState({ loading: false }, async () => {

                    await AsyncStorage.removeItem('user_token', null);
                    await AsyncStorage.removeItem('fcm_token', null);
                    await AsyncStorage.removeItem('USER_DATA', null);
                    const resetAction = StackActions.reset({
                        index: 0,
                        actions: [
                            NavigationActions.navigate({
                                routeName: "LoginScreen"
                            })
                        ]
                    });
                    this.props.navigation.dispatch(resetAction);
                })
            }
            else {
                this.setState({ loading: false });
                this.showMessage("Invalid Credentials");
            }
        }
        catch (error) {
            this.setState({ loading: false });
            console.log("error : ", error)
            this.showMessage("Something went wrong!!");
        }
    }

    render() {
        const { navigate } = this.props.navigation;

        return (
            <View style={[commonStyles.column, { flex: 1, marginTop: hp('4%') }]}>
                <Header label={"Profile"} expanded={this.state.expanded} onBack={() => { this.props.navigation.goBack() }} />
                <View style={[commonStyles.margin, { flex: 1 }]}>
                    <View style={[commonStyles.center, { marginTop: hp('2%') }]}>

                        <View style={styles.imageBG}>
                            <Image style={[styles.clientImage]}
                                resizeMode={"cover"}
                                resizeMethod={"resize"}
                                source={require('../../assets/images/profile.png')} />
                        </View>
                        <View>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { marginTop: hp('2%'), color: color.neavyBlue }]}>{this.props.data.first_name + ' ' + this.props.data.last_name}</Text>
                        </View>
                    </View>

                    <ScrollView style={{ marginTop: hp('1%'), marginBottom: hp('8.2%'), }} showsVerticalScrollIndicator={false}>
                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { marginLeft: wp('2%'), width: wp('83%'), marginTop: hp('4%'), color: color.grayColor }]}>Mobile Number</Text>
                        <View style={[styles.backgroundBox, { marginTop: hp('1%') }]}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.5), { width: wp('83%'), paddingHorizontal: wp('0%') }]}>{this.props.data.mobile ? this.props.data.mobile : "---"}</Text>
                        </View>

                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { marginLeft: wp('2%'), width: wp('83%'), marginTop: hp('2%'), color: color.grayColor }]}>Email ID</Text>
                        <View style={[styles.backgroundBox, { marginTop: hp('1%') }]}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.5), { width: wp('83%'), paddingHorizontal: wp('0%') }]}>{this.props.data.email ? this.props.data.email : "---"}</Text>
                        </View>

                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { marginLeft: wp('2%'), width: wp('83%'), marginTop: hp('2%'), color: color.grayColor }]}>Emp ID</Text>
                        <View style={[styles.backgroundBox, { marginTop: hp('1%') }]}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.5), { width: wp('83%'), paddingHorizontal: wp('0%') }]}>{this.props.data.emp_id ? this.props.data.emp_id : "---"}</Text>
                        </View>

                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { marginLeft: wp('2%'), width: wp('83%'), marginTop: hp('2%'), color: color.grayColor }]}>Location</Text>
                        <View style={[styles.backgroundBox, { marginBottom: hp('2%'), marginTop: hp('1%') }]}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.5), { width: wp('83%'), paddingHorizontal: wp('0%') }]}>{this.props.data.location_name !== null ? this.props.data.location_name + ' ' : "All"}</Text>
                        </View>
                    </ScrollView>

                </View>
                <View style={{
                    flex: 1, position: 'absolute',
                    bottom: 0,
                }}>
                    <LinearGradient
                        colors={[color.gradientStartColor, color.gradientEndColor]}
                        // style={styles.linearGradient}
                        start={{ x: 0.0, y: 0.25 }} end={{ x: 1.2, y: 1.0 }}
                        style={[commonStyles.center, {
                            marginTop: hp('1%'),
                            width: wp('100.1%'),
                            height: hp('8%'),
                            borderTopLeftRadius: wp('2.5%'),
                            borderTopRightRadius: wp('2.5%'),
                        }]}>
                        <TouchableOpacity onPress={async () => { 
                             if (await this.checkInternet()) {
                                this.logout()
                            }
                            else {
                                this.showMessage("No Internet Connectivity!")
                            }
                             }}>
                            <View style={{ height: hp('8%'), justifyContent: 'center', alignSelf: 'center' }}>
                                <Text style={[commonStyles.fontSize(3), commonStyles.fontFamilyBold, { color: '#ffffff' }]}>Logout</Text>
                            </View>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>

            </View>

        );


    }
}

const styles = StyleSheet.create({
    backgroundBox: {
        width: wp('86%'),
        alignSelf: 'center',
        padding: wp('2%'),
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
    clientImage: {
        marginTop: hp('4%'),
        alignItems: 'center',
        alignSelf: 'center',
        width: wp('10%'), height: hp('10%'),
        aspectRatio: 1,
        borderRadius: wp('50%'),
    },
    imageBG: {
        aspectRatio: 1,
        backgroundColor: 'white',
        width: wp('18%'), height: hp('18%'),
        borderWidth: 0.5,
        borderRadius: wp('50%'),
        borderColor: '#CBD5EA',
        elevation: 10,
        shadowColor: '#CBD5EA',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
});

const mapStateToProps = state => ({
    data: state.user.data
});

export default connect(
    mapStateToProps,
    null
)(withNavigation(ProfileScreen));