import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Image, Alert } from 'react-native';
import commonStyles from '../styles/Common';
import { widthPercentageToDP, heightPercentageToDP } from "react-native-responsive-screen";
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
import { Toast } from 'native-base';
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from '@react-native-community/async-storage';
import Header from '../component/Header';
import { ScrollView, TextInput } from "react-native-gesture-handler";
import APIService from '../component/APIServices';
var jwtDecode = require('jwt-decode');
const lockIcon = require('../../assets/images/unlock.png');
import Modal from 'react-native-modalbox';
class LockScreen extends React.Component {

    static navigationOptions = { header: null }
    decoded = null;
    constructor(props) {
        super();
        this.state = {
            value: '',
            focus: false,
            loading: true,
            listData: [],
            statusData: [],
            asset_id: '',
            title: '',
            visible: true,
            data: '',
            lock_Id: '',
            f_battery_percent: '',
            percent: '',
            to_location: '',
            from_location: '',
            lock_status: '',
            isConnected: true,
            connection_Status: true,
            retryload: false,
            userdata: ''
        };
    }

    handleAlert = (f_asset_id) => {
        Alert.alert(
            'Confirmation',
            'Do you want to unlock this lock?',
            [
                { text: 'Yes', onPress: () => { this.unlockLock(f_asset_id) } },
                { text: 'No', onPress: () => console.log('No Pressed') },
            ],
            { cancelable: false }
        );
    }


    handleBackButton = () => {
        BackHandler.exitApp()
        return true;
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

    logout = async () => {
        this.setState({ loading: true });
        try {
            var token = await AsyncStorage.getItem('user_token');
            var url = APIService.URL + APIService.updatefcm;
            let data = {
                fcm: null
            }
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (token)
            }
            try {
                await axios.put(url, data, {
                    headers: headers
                })
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
                return true;
            }
            catch (error) {
                this.showMessage("Something went wrong!!");
            }
        }
        catch (exception) {
            this.setState({ loading: false });
            return false;
        }
    }

    async componentDidMount() {

        var userDetails = await APIService.execute('GET', APIService.URL + APIService.userdetails, null)
        this.setState({ userDetails: userDetails.data.data[0], decoded: jwtDecode(await AsyncStorage.getItem('user_token')) })
        if (this.state.userDetails.status === 2) {
            this.refs.modal1.open()
        }
        else if (this.state.userDetails.status === 1) {
            this.setState({ loading: true }, async () => {
                this.statusCount();

                var listlockdetails = await APIService.execute('GET', APIService.URL + APIService.listlockdetails + '?page_no=0&sort_on=created_at&sort_by=desc', null)
                console.log("listlockdetails : ", listlockdetails.data)
                this.setState({ loading: false, listData: listlockdetails.data.data })
            });
        }
    }

    async statusCount() {
        var userDetails = await APIService.execute('GET', APIService.URL + APIService.lockstatuscount, null)
        this.setState({ statusData: userDetails.data.data })
    }

    getStatus(lock_status) {
        if (lock_status == 1) {
            return ["Online", styles.statusOnline, ''];
        }
        else if (lock_status == 2) {
            return ["Offline", styles.statusOffline, ''];
        }
        else if (lock_status == 3) {
            return ["On-trip", styles.statusOntrip, ''];
        }
        else if (lock_status == 4) {
            return ["Assigned", styles.statusAssigned, ''];
        }
    }

    getbatteryPercent(f_battery_percent) {
        if (f_battery_percent == 255) {
            return "Charging"
        }
        else if (f_battery_percent == null) {
            return '----'
        }
        else {
            return f_battery_percent + '%'
        }
    }

    getLocation(item) {
        if (item.lock_status == 1 || item.lock_status == 4) {
            return item.to_location
        }
        else if (item.lock_status == 2) {
            return ("----");
        }
        else if (item.lock_status == 3) {
            return item.from_location
        }
        else if (item.from_location === null) {
            return "----"
        }
    }

    searchLock = (text) => {
        this.setState({
            value: text
        }, async () => {
            var responseJson = await APIService.execute('GET', APIService.URL + APIService.searchLock + '?page_no=0&sort_on=created_at&sort_by=desc&search_string=' + this.state.value, null)
            this.setState({
                listData: responseJson.data.data
            });
        })
    }

    async unlockLock(f_asset_id) {

        var body= JSON.stringify({
            asset_id: f_asset_id
        })
        console.log("body : ", body)
        var responseJson = await APIService.execute('POST', APIService.lOCK_URL + 'remoteUnlockOfftrip', body)
        if(responseJson.error)
        {
            this.showMessage(responseJson.error)
        }
        else
        {
            console.log("response : ", responseJson)
            this.showMessage(responseJson.data.message)
        }
        
	}

    render() {
        const { navigate } = this.props.navigation;

        return (
            <View style={[commonStyles.column, { flex: 1, backgroundColor: '#EDEEF2' }]}>
                <Header onNotificationURL={()=>{navigate('NotificationScreen')}} onProfileUrl={()=>{navigate('ProfileScreen')}} expanded={this.state.expanded} />
                <ScrollView>
                    <View style={{
                        backgroundColor: '#EDEEF2',
                        flex: 1
                    }} >
                        <View style={{
                            flex: 1, marginTop: 10,
                            marginHorizontal: 5, flexDirection: 'row', justifyContent: 'space-evenly'
                        }}>

                            <View style={{ backgroundColor: '#fff', shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, borderRadius: 5, width: 100, height: 60, justifyContent: 'center', alignSelf: 'center', }}>
                                <Text style={{ justifyContent: 'center', alignSelf: 'center', fontFamily: 'Nunito-Bold', color: 'black' }}>{this.state.statusData.online_lock}</Text>
                                <Text style={{ justifyContent: 'center', alignSelf: 'center', fontFamily: 'Nunito-Regular', color: 'black' }}>Online</Text>

                            </View>
                            <View style={{ backgroundColor: '#fff', shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, borderRadius: 5, width: 100, height: 60, justifyContent: 'center', alignSelf: 'center' }}>
                                {/* <View style={{ margin: 20 }}> */}

                                <Text style={{ justifyContent: 'center', alignSelf: 'center', fontFamily: 'Nunito-Bold', color: 'black' }}>{this.state.statusData.offline_lock}</Text>
                                <Text style={{ justifyContent: 'center', alignSelf: 'center', fontFamily: 'Nunito-Regular', color: 'black' }}>Offline</Text>
                                {/* </View> */}
                            </View>
                            <View style={{ backgroundColor: '#fff', shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, borderRadius: 5, width: 100, height: 60, justifyContent: 'center', alignSelf: 'center' }}>
                                {/* <View style={{ margin: 20 }}> */}
                                <Text style={{ justifyContent: 'center', alignSelf: 'center', fontFamily: 'Nunito-Bold', color: 'black' }}>{this.state.statusData.on_trip_lock}</Text>
                                <Text style={{ justifyContent: 'center', alignSelf: 'center', fontFamily: 'Nunito-Regular', color: 'black' }}>On-trip</Text>
                                {/* </View> */}


                            </View>

                        </View>
                        <View style={{
                            marginTop: 10
                        }} >
                            <View style={{
                                backgroundColor: '#EDEEF2', marginLeft: 10,
                                marginRight: 10,
                            }}>
                                <View style={{ flexDirection: 'row', backgroundColor: '#EDEEF2' }}>
                                    <View style={{ backgroundColor: '#EDEEF2', flex: 1, flexDirection: 'row', margin: 5, height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                        <TextInput placeholder={'Search by Lock ID'} /*value={this.state.value}*/ onFocus={() => this.setState({ focus: false })} onChangeText={(text) => this.searchLock(text)} style={{ flex: 1, marginLeft: 10, fontSize: 14, justifyContent: 'center' }} />
                                        <Image source={require('../../assets/images/search.png')} style={{ height: 21, width: 20, margin: 10, justifyContent: 'flex-end' }} />
                                    </View>
                                </View>
                            </View>
                            {this.state.loading === false ?
                                <FlatList
                                    data={this.state.listData}
                                    renderItem={({ item }) => (
                                        <View>
                                            <View style={{ flex: 1, backgroundColor: 'white', marginRight: widthPercentageToDP('3%'), marginLeft: widthPercentageToDP('3%'), marginTop: widthPercentageToDP('3%'), borderWidth: widthPercentageToDP('0.15%'), borderRadius: widthPercentageToDP('2%'), padding: widthPercentageToDP('1%') }}>
                                                <View>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'center', backgroundColor: '#F5F5F4' }}>
                                                        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>

                                                            <Image source={require('../../assets/images/lock-grey.png')} style={{ height: 15, width: 15, margin: 10, justifyContent: 'flex-start', resizeMode: 'contain' }} />
                                                            <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#141312', justifyContent: 'center', alignSelf: 'center' }}>{item.f_asset_id} {item.lock_vendor === 'jt' ? "(SP701)" : "(SP777)"} </Text>
                                                        </View>
                                                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', marginRight: 10 }}>
                                                            {
                                                                this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3 ?
                                                                    item.lock_status == 1 || item.lock_status == 4 ?
                                                                        <TouchableOpacity onPress={() => this.handleAlert(item.f_asset_id)}>
                                                                            <Image source={lockIcon} style={{ height: 20, width: 20, margin: 10, justifyContent: 'flex-start', resizeMode: 'contain' }} />
                                                                        </TouchableOpacity> : null
                                                                    : this.state.decoded.user_type_id === 2 ?
                                                                        this.location(item.to_location, item.lock_status) && (item.lock_status == 1 || item.lock_status == 4) && this.state.feature_id.indexOf(5) > -1 ?
                                                                            <TouchableOpacity onPress={() => this.handleAlert(item.f_asset_id)}>
                                                                                <Image source={lockIcon} style={{ height: 25, width: 25, margin: 10, justifyContent: 'flex-start', resizeMode: 'contain' }} />
                                                                            </TouchableOpacity> : null : null
                                                            }
                                                            <View style={[styles.statusView, this.getStatus(item.lock_status)[1]]}>
                                                                <Text style={{ color: 'black' }}>{this.getStatus(item.lock_status)[0]}</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>

                                                        <View style={{ flexDirection: 'column', margin: 20, justifyContent: 'center', alignSelf: 'center' }}>
                                                            <Image source={require('../../assets/images/location-grey.png')} style={{ height: 20, width: 20, justifyContent: 'center', alignSelf: 'center', resizeMode: 'contain', }} />
                                                            <Text>{this.getLocation(item)}</Text>
                                                        </View>
                                                        <View style={styles.batteryView}>
                                                            <Image source={require('../../assets/images/battery-grey.png')} style={{ height: 20, width: 20, justifyContent: 'center', alignSelf: 'center', resizeMode: 'contain', }} />
                                                            <Text style={[styles.battery, (item.f_battery_percent < 30 ? styles.batteryLow : null)]}>{this.getbatteryPercent(item.f_battery_percent)}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                    keyExtractor={item => item._id}
                                />
                                : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 50 }}>
                                    <ActivityIndicator size={'large'} color='#263C88' />
                                </View>}
                            {this.state.loading === true ? null : this.state.listData.length === 0 ? <View style={{
                                flex: 1, marginBottom: 10, marginLeft: 5, marginRight: 5, /*shadowColor: 'black',*/shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.8, shadowRadius: 1, elevation: 2, backgroundColor: 'white', borderRadius: 5
                            }}>
                                <View style={{ flex: 1, flexDirection: 'row', }}>
                                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-start', height: widthPercentageToDP('40%') }}>
                                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignContent: 'center' }}>
                                            <Text style={{ fontSize: 15, color: '#000000', justifyContent: 'center', alignSelf: 'center', fontWeight: 'bold' }}>No lock Found</Text>
                                        </View>
                                    </View>
                                </View>
                            </View> : null}
                        </View>
                    </View>
                </ScrollView>

                <Modal style={[styles.modal, styles.modal2]} position={"center"} ref={"modal1"} swipeArea={20}
                    backdropPressToClose={false}  >
                    <ScrollView keyboardShouldPersistTaps={false}>
                        <View style={{ flex: 1, width: widthPercentageToDP('85%'), backgroundColor: '#fff', borderRadius: 4, flexDirection: 'column', padding: widthPercentageToDP('5%') }} >
                            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#141312' }}>Unauthorized Access.</Text>
                            <Text style={{ marginTop: widthPercentageToDP('5%'), fontSize: widthPercentageToDP('5%'), color: '#949494' }}>You are deactivated by admin. Try again later.</Text>

                            <TouchableOpacity style={{ width: widthPercentageToDP('25%'), alignSelf: 'center', justifyContent: 'center', padding: 7, marginTop: widthPercentageToDP('5%'), flexDirection: 'row', backgroundColor: '#263C88', borderRadius: 100 }} onPress={this.logout.bind(this)}>
                                <Text style={{ justifyContent: 'center', alignSelf: 'center', color: '#fff' }}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </Modal>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF'
    },
    textStyle: {
        color: '#FFFFFF'
    },
    buttonContainer: {
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 10
        },
        shadowRadius: 5,
        shadowOpacity: 1.0,
        flexDirection: 'row', margin: 5
    },
    statusView: {
        height: 25,
        width: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center'
    },
    batteryView: {
        flexDirection: 'column',
        margin: 20,
        justifyContent: 'center'
    },
    battery: {
        color: '#000000'
    },
    batteryLow: {
        color: '#F33D54'
        // color: this.f_battery_percent < 30 ? '#F33D54': ''
    },
    statusOffline: {
        backgroundColor: '#F33D54'
    },
    statusOnline: {
        backgroundColor: '#008000'
    },
    statusOntrip: {
        backgroundColor: 'orange'
    },
    statusAssigned: {
        backgroundColor: '#263C88'
    },
    modal: {
        marginTop: widthPercentageToDP('3%'),
        justifyContent: 'center',
        alignItems: 'center',
        position: "absolute",
        backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    modal2: {
        maxHeight: 500,
        minHeight: 80
    },
});

const mapStateToProps = state => ({
    data: state.user.data
});

export default connect(
    mapStateToProps,
    null
)(withNavigation(LockScreen));