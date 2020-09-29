import moment from "moment";
import { Button, Container, Right, Title, Header, Body, Left } from 'native-base';
import React, { Component } from "react";
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl, Image } from "react-native";
import { ScrollView, TextInput } from "react-native-gesture-handler";
var jwtDecode = require('jwt-decode');
import { widthPercentageToDP, heightPercentageToDP } from 'react-native-responsive-screen';
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import APIService from '../component/APIServices';
import Modal from 'react-native-modalbox';
import { connect } from "react-redux";
import { Toast } from 'native-base';
import Header1 from '../component/Header';
import AsyncStorage from '@react-native-community/async-storage'
import NetInfo from "@react-native-community/netinfo";

class EndTripListScreen extends Component {
    decoded;
    static navigationOptions = { header: null }
    constructor(props) {
        super();
        this.state = {
            value: '',
            focus: false,
            data: '',
            loading: true,
            total: '',
            datatotal: '',
            fetching_Status: false,
            decoded: '',
            userDetails: [],
            feature_id: '',
            owned: 0,
            locationData: []
        };
        this.page = 0;
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

    componentWillReceiveProps(text) {
        this.loadmore();
    }

    _onRefresh = () => {
        this.setState({ refreshing: true, loading: true }, () => {
            this.componentDidMount();
            this.setState({ refreshing: false })
        });
    }

    async componentDidMount() {
        this.getUserDetails()
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

    async getUserDetails() {
        var userDetails = await APIService.execute('GET', APIService.URL + APIService.userdetails, null)
        if (userDetails.status === 200) {

            userDetails.data.data[0].logismart_feature_id !== null ?
                this.setState({ userDetails: userDetails.data.data[0], feature_id: userDetails.data.data[0].logismart_feature_id, decoded: jwtDecode(await AsyncStorage.getItem('user_token')) }) : this.setState({ userDetails: userDetails.data[0], feature_id: [], decoded: jwtDecode(await AsyncStorage.getItem('user_token')) })
            if (this.state.userDetails.status === 2) {
                this.refs.modal1.open()
            }
            else if (this.state.userDetails.status === 1) {
                if (this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3) {
                    var listLocationName = await APIService.execute('GET', APIService.URL + APIService.listlocationname, null)
                    var temp = [];
                    for (let i = 0; i < listLocationName.data.data.length; i++) {
                        temp.push(listLocationName.data.data[i].id);
                    }
                    this.setState({ locationData: temp, loading: false }, () => { this.page = 0; this.loadmore(); })
                }
                else if (this.state.decoded.user_type_id === 2) {
                    if (this.state.userDetails.role_id === null) {
                        this.setState({ owned: 0, locationData: this.state.userDetails.location_id, loading: false }, () => { this.page = 0; this.loadmore(); });
                    }
                    else {
                        var listOwnedLocationDetails = await APIService.execute('GET', APIService.URL + APIService.listownedloccationdetailsall, null)
                        console.log("listOwnedLocationDetails : ", listOwnedLocationDetails)
                        temp = [];
                        for (let i = 0; i < listOwnedLocationDetails.data.location_id.length; i++) {
                            temp.push(listOwnedLocationDetails.data.location_id[i].id);
                        }
                        this.setState({ locationData: temp, owned: 1, loading: false }, () => { this.page = 0; this.loadmore(); });
                    }
                }
            }
        }
        else {
            this.setState({ loading: false });
            this.showMessage("Something went wrong!")
            this.props.navigation.goBack();
        }

    }

    async loadmore() {
        this.setState({ fetching_Status: true, decoded: jwtDecode(await AsyncStorage.getItem('user_token')) })
        this.page = this.page + 5;

        var body;
        if (this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3) {
            body = JSON.stringify({
                page_no: '0',
                page_limit: this.page,
                location_id: 'all',
                owned: this.state.owned
            });
        }
        else if (this.state.decoded.user_type_id === 2) {
            body = JSON.stringify({
                page_no: '0',
                page_limit: this.page,
                location_id: this.state.locationData,
                owned: this.state.owned
            });
        }
        var responseJson = await APIService.execute('POST', APIService.URL + APIService.listenroutetripdetails, body)
        var res = responseJson.data;
        if (res.data[0]) {
            var total = res.data[0];
            var datatotal = res.data.length;
            this.setState({ total: total.total_records, datatotal: datatotal })
        }
        this.setState({ data: res.data, loading: false, fetching_Status: false });
        this.arrayholder = res.data;
    }

    searchFilterFunction = (text) => {
        this.setState({ value: text }, async () => {
            if (this.state.value) {
                var body;
                if (this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3) {
                    body = JSON.stringify({
                        page_no: '0',
                        page_limit: this.page,
                        user_type_id: this.state.decoded.user_type_id,
                        location_id: 'all',
                        sort_on: 't.created_at',
                        sort_by: 'desc',
                        search_string: this.state.value
                    });
                }
                else if (this.state.decoded.user_type_id === 2) {
                    body = JSON.stringify({
                        page_no: '0',
                        page_limit: this.page,
                        user_type_id: this.state.decoded.user_type_id,
                        location_id: this.state.locationData,
                        sort_on: 't.created_at',
                        sort_by: 'desc',
                        search_string: this.state.value,
                        access_right: null,
                        owned: this.state.owned
                    });
                }
                var responseJson = await APIService.execute('POST', APIService.URL + APIService.searchonlinetrip, body)
                this.setState({ data: responseJson.data.data });
            }
            else
            {
                this.page = 0;
                this.loadmore();
            }
        });
    }

    render() {
        return (
            <Container style={{ flex: 1 }}>
                <Header1 label={"Complete Trip"} expanded={true} onBack={() => {
                    const resetAction = StackActions.reset({
                        index: 0,
                        actions: [
                            NavigationActions.navigate({
                                routeName: "TabManager"
                            })
                        ]
                    });
                    this.props.navigation.dispatch(resetAction);
                }} />
                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this._onRefresh}
                            color={"#263C88"}
                        />} >
                    <View style={{ backgroundColor: 'white' }} >
                        <View style={{ marginTop: 10, backgroundColor: 'white' }} >
                            <View style={{ backgroundColor: 'white' }}>
                                <View style={{ flexDirection: 'row' }}>
                                    <View style={{ flex: 1, flexDirection: 'row', margin: 5, height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                        <TextInput placeholder={'Search by Trip ID'} value={this.state.value} onFocus={() => this.setState({ focus: false })} onChangeText={text => this.searchFilterFunction(text)} style={{ flex: 1, marginLeft: 10, fontSize: 14, justifyContent: 'center' }} />
                                        <Image source={require('../../assets/images/search.png')} style={{ height: heightPercentageToDP('3.5%'), width: widthPercentageToDP('5%'), margin: 10, justifyContent: 'flex-end', resizeMode: 'contain' }} />
                                    </View>
                                </View>
                            </View>
                            {this.state.loading === false ?
                                <FlatList
                                    data={this.state.data}
                                    renderItem={({ item }) => (
                                        <View>
                                            {item.trip_status === 1 ?
                                                <View style={{ backgroundColor: 'white', marginRight: widthPercentageToDP('3%'), marginLeft: widthPercentageToDP('3%'), marginTop: widthPercentageToDP('3%'), borderWidth: widthPercentageToDP('0.15%'), borderRadius: widthPercentageToDP('2%'), padding: widthPercentageToDP('1%') }}>
                                                    <TouchableOpacity onPress={() => this.props.navigation.navigate('EndtripDetail', { item: item })}>
                                                        <View style={{ flexDirection: 'column', backgroundColor: 'white' }}>
                                                            <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
                                                                <View style={{ flexDirection: 'row', justifyContent: 'center', }}>
                                                                    <Image source={require('../../assets/images/distance-grey.png')} style={{ height: 16, width: 16, margin: 10, justifyContent: 'flex-start' }} />
                                                                    <Text style={{ fontSize: 15, color: '#141312', justifyContent: 'center', alignSelf: 'center' }}>{'Trip ID:'}</Text>
                                                                    <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#141312', alignSelf: 'center' }}>{item.trip_id || "---"}</Text>
                                                                </View>
                                                            </View>
                                                            <View style={{ flexDirection: 'row', marginLeft: widthPercentageToDP('3%') }}>
                                                                <Text style={{ fontSize: 15, color: '#141312', justifyContent: 'center', alignSelf: 'center' }}>Sub Trip : </Text>
                                                                <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#141312', alignSelf: 'center' }}>{item.sub_trip_count}</Text>
                                                            </View>
                                                        </View>

                                                        <View style={{ flexDirection: 'row', }}>
                                                            <View style={{ flex: 1, flexDirection: 'row', }}>
                                                                <View style={{ flexDirection: 'column', justifyContent: 'flex-start', height: widthPercentageToDP('30%') }}>
                                                                    <Image source={require('../../assets/images/flags-green.png')} style={{ height: 16, width: 16, margin: 10, justifyContent: 'flex-start', alignSelf: 'center', resizeMode: 'contain' }} />
                                                                    {/* <Dash dashColor='#EFF0EA' style={{ flex: 1, height: 20, marginTop: -10, flexDirection: 'column', alignSelf: 'center' }} /> */}
                                                                    <Image source={require('../../assets/images/dotted-line.png')} style={{ height: 50, justifyContent: 'flex-start', alignSelf: 'center', marginTop: -10 }} />
                                                                    <Image source={require('../../assets/images/flags-red.png')} style={{ height: 16, width: 16, margin: 5, justifyContent: 'flex-start', resizeMode: 'contain', alignSelf: 'center' }} />
                                                                </View>
                                                                <View style={{ flexDirection: 'column', justifyContent: 'space-between', marginLeft: 10, margin: 10 }}>
                                                                    <Text style={{ fontSize: 14, color: '#949494' }}>From</Text>
                                                                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312' }}>{item.from_location || "---"}</Text>
                                                                    <Text style={{ fontSize: 15, color: '#949494', marginTop: 10 }}>To</Text>
                                                                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312' }}>{item.to_location || "---"}</Text>
                                                                </View>
                                                            </View>
                                                            {/* second */}
                                                            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-end', marginLeft: 30, marginTop: 5 }}>
                                                                <View style={{ flexDirection: 'column', justifyContent: 'flex-end', }}>
                                                                    <Image source={require('../../assets/images/truck.png')} style={{ height: 20, width: 20, justifyContent: 'flex-end', alignSelf: 'center', resizeMode: 'contain', }} />
                                                                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', }}>{item.vehicle_number || "---"}</Text>
                                                                </View>
                                                                <View style={{ flexDirection: 'column', justifyContent: 'flex-end', marginTop: 10 }}>
                                                                    <Image source={require('../../assets/images/driver.png')} style={{ height: 18, width: 18, justifyContent: 'flex-end', alignSelf: 'center', resizeMode: 'contain' }} />
                                                                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', marginBottom: 10 }}>{item.driver_name || "---"}</Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                        <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                                        <View style={{ flexDirection: 'row', flex: 1, margin: 10 }}>
                                                            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-start' }}>
                                                                <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center' }}>Expected Depature</Text>
                                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center' }}>{item.exp_departure_timestamp ? moment.unix(item.exp_departure_timestamp, 'DD-MM-YYYY').format('DD MMM YYYY HH:mm') : '----'}</Text>
                                                            </View>
                                                            <View style={{
                                                                borderLeftWidth: 0.5, justifyContent: 'center', marginTop: -10, marginBottom: -10,
                                                                borderLeftColor: '#ABB5C4',
                                                            }}></View>
                                                            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-end', alignContent: 'center', }}>
                                                                <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center' }}>Expected Arrival</Text>
                                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center' }}>{item.exp_arrival_timestamp ? moment.unix(item.exp_arrival_timestamp, 'DD-MM-YYYY').format('DD MMM YYYY HH:mm') : '----'}</Text>
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View> : null}
                                        </View>
                                    )}
                                    keyExtractor={item => item.lock_id}
                                /> : <View style={{ flex: 1, alignItems: 'center', backgroundColor: 'white', justifyContent: 'center', paddingTop: 50 }}>
                                    <ActivityIndicator size={'large'} color='#263C88' />
                                </View>}
                            {this.state.loading ? false : this.state.data == '' ? <View style={{
                                flex: 1, marginBottom: 10, marginLeft: 5, marginRight: 5, /*shadowColor: 'black',*/shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.8, shadowRadius: 1, elevation: 2, backgroundColor: 'white', borderRadius: 5
                            }}>
                                <View style={{ flex: 1, flexDirection: 'row', }}>
                                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-start', height: widthPercentageToDP('40%') }}>
                                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignContent: 'center' }}>
                                            <Text style={{ fontSize: 15, color: '#000000', justifyContent: 'center', alignSelf: 'center', fontWeight: 'bold' }}>No Records Found</Text>
                                        </View>
                                    </View>
                                </View>
                            </View> : null}

                            {this.state.data != '' && !this.state.value && this.state.loading === false && this.state.datatotal < this.state.total ?
                                <TouchableOpacity
                                    style={{
                                        justifyContent: 'center', alignSelf: 'center', padding: 7, margin: 40,
                                        flexDirection: 'row',
                                        backgroundColor: '#263C88',
                                        borderRadius: 100,
                                    }}
                                    onPress={() => this.loadmore()}  >
                                    <Text style={{ justifyContent: "center", alignSelf: 'center', color: '#fff', margin: 5 }}>LOAD MORE</Text>
                                    {(this.state.fetching_Status === true)
                                        ?
                                        <ActivityIndicator color="#fff" style={{ marginLeft: 6 }} />
                                        :
                                        null}
                                </TouchableOpacity> : null}
                        </View>
                    </View>
                </ScrollView>

                <Modal style={[styles.modal, styles.modal2]} position={"center"} ref={"modal1"} swipeArea={20}
                    backdropPressToClose={false}  >
                    <ScrollView keyboardShouldPersistTaps={false}>
                        <View style={{ marginTop: widthPercentageToDP('10%'), flex: 1, width: widthPercentageToDP('85%'), backgroundColor: '#fff', borderRadius: 4, flexDirection: 'column', padding: widthPercentageToDP('5%') }} >
                            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#141312' }}>Unauthorized Access.</Text>
                            <Text style={{ marginTop: widthPercentageToDP('5%'), fontSize: widthPercentageToDP('5%'), color: '#949494' }}>You are deactivated by admin. Try again later.</Text>

                            <TouchableOpacity style={{ width: widthPercentageToDP('25%'), alignSelf: 'center', justifyContent: 'center', padding: 7, marginTop: widthPercentageToDP('5%'), flexDirection: 'row', backgroundColor: '#263C88', borderRadius: 100 }} onPress={this.logout.bind(this)}>
                                <Text style={{ justifyContent: 'center', alignSelf: 'center', color: '#fff' }}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </Modal>
            </Container>
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
})
const mapStateToProps = state => ({
    data: state.user.data
});

export default connect(
    mapStateToProps,
    null
)(withNavigation(EndTripListScreen));