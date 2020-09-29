import React from "react";
import { StyleSheet, View, StatusBar, Text, TouchableOpacity, Image, TextInput, Keyboard, ActivityIndicator } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import firebase from 'react-native-firebase'
import { Toast } from 'native-base';
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
import NetInfo from "@react-native-community/netinfo";
import LinearGradient from 'react-native-linear-gradient';
import { getUserData, saveUserData } from "../store/actions/userActions";
import AsyncStorage from '@react-native-community/async-storage';
import Globals from '../Globals';
const axios = require('axios');
class LoginScreen extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            fcm_token: '',
            token: "",
            emailid: "",
            loading: false,
            password: '',
            hidePassword: true
        }
    }

    showMessage(message) {
        Keyboard.dismiss()
        Toast.show({
            text: message,
            duration: 2000
        })
    }


    getFcmToken = async () => {
        const fcmToken = await firebase.messaging().getToken();
        if (fcmToken) {
            console.log("fcm : ", fcmToken);
            this.setState({ fcm_token: fcmToken })
            this.messageListener();
            //this.showAlert('Your Firebase Token is:', fcmToken);
        } else {
            this.showMessage('Failed', 'No token received');
        }
    }

    requestPermission = async () => {
        try {
            await firebase.messaging().requestPermission();
            // User has authorised
        } catch (error) {
            // User has rejected permissions
        }
    }

    messageListener = async () => {
        this.notificationListener = firebase.notifications().onNotification((notification) => {
            const localNotification = new firebase.notifications.Notification({
                sound: 'sampleaudio',
                show_in_foreground: true,
            })
                .setSound('sampleaudio.wav')
                .setNotificationId(notification.notificationId)
                .setTitle(notification.title)
                .setBody(notification.body)
                .android.setChannelId('fcm_FirebaseNotifiction_default_channel') // e.g. the id you chose 
                .android.setLargeIcon('ic_launcher')
                .android.setPriority(firebase.notifications.Android.Priority.High);
            firebase.notifications()
                .displayNotification(localNotification)
                .catch(err => console.error(err));
        });

        const channel = new firebase.notifications.Android.Channel('fcm_FirebaseNotifiction_default_channel', 'Demo app name', firebase.notifications.Android.Importance.High)
            .setDescription('Demo app description')
            .setSound('sampleaudio.wav')

        firebase.notifications().android.createChannel(channel);

        this.notificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen) => {
            const { title, body } = notificationOpen.notification;
            // this.showAlert(title, body);
        });

        const notificationOpen = await firebase.notifications().getInitialNotification();
        if (notificationOpen) {
            const { title, body } = notificationOpen.notification;
            // this.showAlert(title, body);
        }

        this.messageListener = firebase.messaging().onMessage((message) => {
            console.log(JSON.stringify(message));
        });
    }

    UNSAFE_componentWillMount() {
        this.checkPermission();
    }

    checkPermission = async () => {
        const enabled = await firebase.messaging().hasPermission();
        if (enabled) {
            this.getFcmToken();
        } else {
            this.requestPermission();
        }
    }

    checkInternet() {
        return new Promise((resolve, reject) => {
            NetInfo.fetch().then(state => {
                //console.log("Connection type", state.type);
                if (state.isConnected) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
        })

    }

    componentWillUnmount() {

    }

    componentDidMount() {
        Keyboard.dismiss();
    }

    navigationBack() {
        this.props.navigation.state.params.returnSignup();
        this.props.navigation.goBack()
    }

    setPasswordVisibility = () => {
        this.setState({ hidePassword: !this.state.hidePassword });
    }

    isValidEmail = (text) => {
        var reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        return reg.test(text)
    }

    async login() {
        if (this.state.emailid === "" || !this.isValidEmail(this.state.emailid)) {
            this.showMessage("Please provide a valid Email ID")

        }
        else if (this.state.password === "") {
            this.showMessage("Please provide password")

        }
        else {
            this.setState({ loading: true })

            var url = Globals.URL + Globals.login;
            let data = {}
            data.username = this.state.emailid
            data.password = this.state.password

            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
            try {
                var response = await axios.post(url, data, {
                    headers: headers
                })
                if (response.status === 200) {

                    console.log("data : ", response.data)
                    this.setState({
                        token: response.data.token
                    }, async () => {
                        await AsyncStorage.setItem('user_token', response.data.token);
                        await AsyncStorage.setItem('fcm_token', this.state.fcm_token);
                        var jwtDecode = require('jwt-decode');
                        var decoded = jwtDecode(response.data.token);
                        if (decoded.user_type_id === 1 || decoded.user_type_id === 2 || decoded.user_type_id === 3) {
                            if (decoded.status === 1) {
                                this.userdetails()
                            }
                            else {
                                this.setState({ emailid: '', password: '' });
                                this.showMessage("Inactive By Admin")
                                this.setState({ loading: false })
                            }
                        }
                        else {
                            this.setState({ emailid: '', password: '' });
                            this.showMessage("Invalid Credential")
                            this.setState({ loading: false })
                        }
                    })
                }

                else {
                    this.setState({ loading: false })
                    this.showMessage(response.data.errors);
                }
            }
            catch (error) {
                this.setState({ loading: false })
                console.log("error : ", error.response);
                this.showMessage(error.message);

            }
        }
    }

    async userdetails() {
        const url = Globals.URL + Globals.userDetails;
        try {
            const headers = {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + (this.state.token),
                'Content-Type': 'application/json'
            }
            var response = await axios.get(url, {
                headers: headers
            })
            if (response.status === 200) {
                console.log("response : ", response.data.data[0])
                console.log("data : ", response.data.data[0].module_selected)
                var data = response.data.data[0].module_selected;
                if (data) {
                    data.map(async (item) => {
                        if (item === 1) {
                            //await AsyncStorage.setItem('loginData', JSON.stringify(res));
                            this.updatefcmtoken(response.data.data[0])
                        }
                        else {
                            // ToastAndroid.show("You are not authorized to login", ToastAndroid.LONG, 25, 50);
                            this.setState({ loading: false, focus: false });
                        }


                    })
                }
                else {
                    this.showMessage("Invalid Credential")
                    this.setState({ loading: false });
                }
                this.setState({
                    loading: false
                })
            }
            else {
                var data1 = response.data.error;
                this.showMessage(data1);
                this.setState({
                    loading: false
                })
            }
        }
        catch (e) {
            console.log("error : ", error)
            this.showMessage(error);
        }

    }

    async updatefcmtoken(user_data) {

        var token = await AsyncStorage.getItem('user_token');
        var url = Globals.URL + Globals.update_token;
        console.log("token:", this.state.fcm_token)
        let data = {
            fcm: this.state.fcmToken
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
                    await this.props.saveUserData(user_data);
                    this.setState({ loading: false })
                    this.showMessage("Login successful")
                    const resetAction = StackActions.reset({
                        index: 0,
                        actions: [
                            NavigationActions.navigate({
                                routeName: "InitialScreen"
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
            this.showMessage("Something went wrong!!");
        }
    }

    render() {
        const { navigate } = this.props.navigation;

        return (

            <View style={[commonStyles.container, { backgroundColor: 'white' }]}>
                <StatusBar barStyle="dark-content" hidden={false} backgroundColor="transparent" translucent={true} />
                <View style={{ flex: 1, justifyContent: 'center', alignContent: 'center' }}>

                    <Image style={styles.logo_container}
                        source={require('../../assets/images/sepio_white.png')} />
                    <View style={[styles.backgroundBox, { marginTop: hp('5%'), }]}>

                        <TextInput
                            autoCapitalize={'none'}
                            keyboardType={'email-address'}
                            style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.5), { width: wp('83%'), paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), marginTop: hp('-1%') }]}
                            placeholder={'Enter email id'}
                            placeholderTextColor={color.neavyBlue}
                            value={this.state.emailid}
                            onChangeText={emailid => {
                                this.setState({ emailid })
                            }}
                            returnKeyType={"next"}
                            onSubmitEditing={() => { this.passwordInput.focus() }}
                            blurOnSubmit={false}
                        />

                    </View>

                    <View style={[styles.backgroundBox, { marginBottom: hp('2%'), marginTop: hp('2%') }]}>
                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            <TextInput
                                ref={(input) => { this.passwordInput = input }}
                                autoCapitalize={'none'}
                                secureTextEntry={this.state.hidePassword}
                                style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.5), { width: wp('79%'), paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), marginTop: hp('-1%') }]}
                                placeholder={'Enter password'}
                                placeholderTextColor={color.neavyBlue}
                                value={this.state.password}
                                onChangeText={password => {
                                    this.setState({ password })
                                }}
                            />
                            <TouchableOpacity activeOpacity={0.8} style={{ alignSelf: 'center' }} onPress={this.setPasswordVisibility}>
                                <Image source={(this.state.hidePassword) ? require('../../assets/images/hidden.png') : require('../../assets/images/eye.png')} style={{ width: wp('5%'), height: hp('4.5%'), marginTop: hp('1.5%'), resizeMode: 'contain' }} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row' }}>

                        </View>
                    </View>

                    <View style={{ marginTop: hp('3%') }}>

                        <TouchableOpacity
                            onPress={async () => {
                                //console.log("internet : ", await this.checkInternet());
                                if (await this.checkInternet()) {
                                    this.login()
                                }
                                else {
                                    this.showMessage("No Internet Connectivity!")
                                }
                            }
                            }>
                            <LinearGradient
                                colors={[color.gradientStartColor, color.gradientEndColor]}
                                start={{ x: 0.0, y: 0.25 }} end={{ x: 1.2, y: 1.0 }}
                                style={[styles.center, {
                                    marginTop: hp('1%'),
                                    height: hp('8%'),
                                    borderRadius: 5
                                }]}>

                                {
                                    this.state.loading === true ? (
                                        <View style={{ height: hp('8%'), justifyContent: 'center', alignItems: 'center', flexDirection: 'row', flex: 1 }}>
                                            <View style={{ paddingRight: wp('5%'), backgroundColor: 'transparent' }}>
                                                <ActivityIndicator size={'small'} color='#FFFFFF' />
                                            </View>
                                            <View style={{ backgroundColor: 'transparent' }}>
                                                <Text style={[commonStyles.fontSize(2.5), commonStyles.fontFamilyBold, { color: '#FFFFFF' }]}>Logging in...</Text>
                                            </View>
                                        </View>
                                    ) : (
                                            <View style={{ height: hp('8%'), justifyContent: 'center', alignSelf: 'center' }}>
                                                <Text style={[commonStyles.fontSize(2.5), commonStyles.fontFamilyBold, { color: '#ffffff' }]}>LOG IN</Text>
                                            </View>
                                        )
                                }
                            </LinearGradient>
                        </TouchableOpacity>

                    </View>
                </View>
            </View>

        );
    }

}

const styles = StyleSheet.create({
    logo_container: {
        height: hp('10%'),
        alignSelf: 'center',
        width: wp('55%'),
        resizeMode: 'contain'
    },
    backgroundBox: {
        height: hp('8%'),
        padding: wp('3%'),
        borderWidth: 0.5,
        borderRadius: 5,
        backgroundColor: '#E8F0FE',
        borderColor: color.grayColor,
        elevation: 3,
        shadowColor: color.grayColor,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    icons: {
        width: wp('3%'),
        height: hp('2.5%'),
        resizeMode: 'contain'
    },
});

const mapStateToProps = state => ({
    data: state.user.data
});

const mapDispatchToProps = dispatch => ({
    getUserData: () => dispatch(getUserData()),
    saveUserData: data => dispatch(saveUserData(data)),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withNavigation(LoginScreen));