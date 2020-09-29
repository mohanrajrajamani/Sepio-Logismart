import moment from "moment";
import { Toast, Fab } from 'native-base';
import NetInfo from "@react-native-community/netinfo";
import React, { Component } from "react";
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl, Keyboard, Image } from "react-native";
import { ScrollView, TextInput, ForceTouchGestureHandler } from "react-native-gesture-handler";
import { widthPercentageToDP, heightPercentageToDP } from 'react-native-responsive-screen';
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from 'react-redux';
import * as filter from '../actions/filterAction';
import APIService from '../component/APIServices';
var jwtDecode = require('jwt-decode');
import Modal from 'react-native-modalbox';
import AsyncStorage from '@react-native-community/async-storage';
import Header from '../component/Header'

class TrackScreen extends Component {
    static navigationOptions = { header: null }
    constructor(props) {
        super();
        this.state = {
            value: '',
            focus: false,
            data: '',
            loading: true,
            filtered: '',
            fetching_Status: false,
            datatotal: 0,
            total: 1,
            isConnected: true,
            connection_Status: true,
            retryload: false,
            refreshing: false,

            decoded: '',
            userDetails: [],
            feature_id: '',
            owned: 0,
            locationData: [],
            lock_idfilter:'',
            vehicle_nofilter:'',
            invoice:'',
            bill_no:'',
            trip_status:''
        };
        this.arrayholder = [];
        this.page = 0;
        this.searchpage = 5;
    }

    async Load_more() {
        this.page = this.page + 5;
        this.setState({
            fetching_Status: true, value: ''
        });
        
        this.props.filterChange(null);
        this.props.filterVehicle(null);
        this.props.filterIncoice(null);
        this.props.filterBill(null);
        this.props.filterTrip_Status(null);
        
        var body;
        if (this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3) {

            body = JSON.stringify({
                page_no: 0,
                page_limit: this.page,
                user_type_id: this.state.decoded.user_type_id,
                location_id: "all",
                sort_on: 't.created_at',
                sort_by: 'desc'
            })
        }

        else if (this.state.decoded.user_type_id === 2) {

            body = JSON.stringify({
                page_no: 0,
                page_limit: this.page,
                user_type_id: this.state.decoded.user_type_id,
                location_id: this.state.locationData,
                access_right: null,
                sort_on: 't.created_at',
                sort_by: 'desc',
                owned: this.state.owned
            })
        }

        var res = await APIService.execute('POST', APIService.URL + APIService.listonlinetripdetails, body)
        console.log('res::',res)

        if (res.status === 200) {

            var total = res.data.data[0];
            var datatotal = res.data.data.length;
            this.setState({ total: total.total_records, datatotal: datatotal })
            this.setState({ data: res.data.data, fetching_Status: false, loading: false, refreshing: false }); this.arrayholder = res.data.data;
        }
        else {
            this.setState({ fetching_Status: false, loading: false, refreshing: false });
            this.showMessage("Something went wrong!")
            // this.props.navigation.goBack();
        }
    }

    Retry() {
        if (this.state.isConnected) {
            this.setState({ retryload: true }, async () => {
                this.setState({ connection_Status: false, retryload: false })
                let req = await fetch('https://www.google.com');
                let hasConnection = req.status === 200;
                if (hasConnection) {
                    this.setState({ connection_Status: hasConnection, retryload: false })
                }
            });
        }
    }

    handleRefresh = () => {
        this.page = 0
        this.setState({ loading: true, refreshing: true }, () => {
            this.Load_more()
        })
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

    async componentDidMount() {
        this.onReset()

        this.willFocusSubscription = this.props.navigation.addListener(
            'willFocus',
            () => {
                this.setState({ loading: true });
                this.page = 0;
                this.page = this.page + 5;
                this.TrackFilter()
                this.getUserDetails()
                // this.filtered()
            }
        );

    }

    async onReset() {
        await AsyncStorage.setItem("LOCK_ID", "");
        await AsyncStorage.setItem("VEHICLE_NO", "");
        await AsyncStorage.setItem("INVOICE_NO", "");
        await AsyncStorage.setItem("BILL_NO", "");
        await AsyncStorage.setItem("TRIP_STATUS", "");
        this.setState({lock_idfilter:'', vehicle_nofilter:'', invoice:'', bill_no:'', trip_status:''})
    }

    async TrackFilter(){
        await AsyncStorage.getItem('LOCK_ID').then((value) => {
            var lock_id = JSON.parse(value);
            console.log("lock_id",lock_id)
            this.setState({
                lock_idfilter: lock_id
            })
        });
        await AsyncStorage.getItem('VEHICLE_NO').then((value) => {
            var vehicle_no = JSON.parse(value);
            console.log("vehicle_no",vehicle_no)
            this.setState({
                vehicle_nofilter: vehicle_no
            })
        });
        await AsyncStorage.getItem('INVOICE_NO').then((value) => {
            var invoice_no = JSON.parse(value);
            console.log("invoice_no",invoice_no)
            this.setState({
                invoice: invoice_no
            })
        });
        await AsyncStorage.getItem('BILL_NO').then((value) => {
            var bill_no = JSON.parse(value);
            console.log("bill_no",bill_no)
            this.setState({
                bill_no: bill_no
            })
        });
        await AsyncStorage.getItem('TRIP_STATUS').then((value) => {
            var trip_status = JSON.parse(value);
            console.log("trip_status",trip_status)
            this.setState({
                trip_status: trip_status
            })
        });
        if(this.state.lock_idfilter || this.state.vehicle_nofilter || this.state.invoice || this.state.bill_no || this.state.trip_status){
            this.filtered()
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
                    this.setState({ locationData: temp, loading: false }, () => { this.filtered() })
                }
                else if (this.state.decoded.user_type_id === 2) {
                    if (this.state.userDetails.role_id === null) {
                        this.setState({ owned: 0, locationData: this.state.userDetails.location_id, loading: false }, () => { this.filtered() });
                    }
                    else {
                        var listOwnedLocationDetails = await APIService.execute('GET', APIService.URL + APIService.listownedloccationdetailsall, null)

                        temp = [];
                        for (let i = 0; i < listOwnedLocationDetails.data.location_id.length; i++) {
                            temp.push(listOwnedLocationDetails.data.location_id[i].id);
                        }
                        this.setState({ locationData: temp, owned: 1, loading: false }, () => { this.filtered() });
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


    async userdetails() {
        var response = await APIService.execute('GET', APIService.URL + APIService.userdetails, null)

        if (response.status === 200) {

            this.setState({ feature_id: response.data.data[0].logismart_feature_id })
            return response.data;
        }
        else {
            this.showMessage("Something went wrong!")
            // this.props.navigation.goBack();
        }
    }

    async getListLocationName() {
        var response = await APIService.execute('POST', APIService.URL + APIService.listlocationname, body)

        if (response.status === 200) {

            this.setState({ feature_id: response.data.data[0].logismart_feature_id })
            return response.data

        }
        else {
            this.showMessage("Something went wrong!")
        }
    }

    async getListOwnedLocationDetails() {
        var response = await APIService.execute('GET', APIService.URL + APIService.listownedloccationdetailsall, null)


        if (response.status === 200) {
            return response.data
        }
        else {
            this.showMessage("Something went wrong!")
        }
    }

    searchLoadList = () => {
        this.searchpage = this.searchpage + 5;
        this.searchFilterFunction(this.state.value);
    }

    searchFilterFunction = (text) => {
        this.setState({
            value: text
        }, async () => {
            if (text) {
                this.setState({ fetching_Status: true, loading: true })
                var loginData = await AsyncStorage.getItem('user_token');
                var decoded = jwtDecode(loginData);

                var body;
                if (this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3) {
                    body = JSON.stringify({
                        page_no: '0',
                        page_limit: this.searchpage,
                        user_type_id: this.state.decoded.user_type_id,
                        location_id: 'all',
                        sort_on: 't.created_at',
                        sort_by: 'desc',
                        search_string: text
                    });
                }
                else if (this.state.decoded.user_type_id === 2) {
                    body = JSON.stringify({
                        page_no: '0',
                        page_limit: this.searchpage,
                        user_type_id: this.state.decoded.user_type_id,
                        location_id: this.state.locationData,
                        sort_on: 't.created_at',
                        sort_by: 'desc',
                        search_string: text,
                        access_right: null,
                        owned: this.state.owned
                    });
                }

                var res = await APIService.execute('POST', APIService.URL + APIService.searchonlinetrip, body)


                if (res.status === 200) {
                    if (res.data.data[0]) {
                        var total = res.data.data[0];
                        var datatotal = res.data.data.length;
                        this.setState({ total: total.total_records, datatotal: datatotal })
                    }
                    this.setState({ data: res.data.data, fetching_Status: false, loading: false });

                }
                else {
                    this.setState({ loading: false, fetching_Status: false });
                    this.showMessage("Something went wrong!")
                }

            }else{
                this.Load_more()
            }
        });
    }

    async fliterLoadList() {
        this.page = this.page + 5;
        this.setState({fetching_Status:true},()=>{
            this.filtered()
        })
    }

    async filtered() {

        if (this.state.lock_idfilter || this.state.vehicle_nofilter || this.state.invoice || this.state.bill_no || this.state.trip_status) {

            const url = APIService.URL + 'dashboard/filterviewtrip';

            var body;
            if (this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3) {


                body = {
                    page_no: 0,
                    page_limit: this.page,
                    from_id: undefined,
                    to_id: undefined,
                    lr_number: undefined,
                    exp_idle: undefined,
                    exp_delay: undefined,
                    exp_auth_open: undefined,
                    act_unauth_open: undefined,
                    trip_id: undefined,
                    invoice_no: this.state.invoice || undefined,
                    vehicle_number: this.state.vehicle_nofilter || undefined,
                    e_way_bill_no: this.state.bill_no || undefined,
                    lock_id: this.state.lock_idfilter ? this.state.lock_idfilter.id: undefined ,
                    trip_status: this.state.trip_status === 'Enroute' ? 1 : this.state.trip_status === 'Completed' ? 3 : undefined,
                    trip_start_timestamp: undefined,
                    trip_end_timestamp: undefined,
                    user_type_id: this.state.decoded.user_type_id,
                    location_id: this.state.locationData,
                    access_right: this.state.decoded.access_right,
                    sort_on: "t.created_at",
                    sort_by: "desc"
                }

            }



            else if (this.state.decoded.user_type_id === 2) {


                body = {
                    page_no: 0,
                    page_limit: this.page,
                    from_id: undefined,
                    to_id: undefined,
                    lr_number: undefined,
                    exp_idle: undefined,
                    exp_delay: undefined,
                    exp_auth_open: undefined,
                    act_unauth_open: undefined,
                    trip_id: undefined,
                    invoice_no: this.state.invoice || undefined,
                    vehicle_number: this.state.vehicle_nofilter || undefined,
                    e_way_bill_no: this.state.bill_no || undefined,
                    lock_id: this.state.lock_idfilter ? this.state.lock_idfilter.id: undefined ,
                    trip_status: this.state.trip_status === 'Enroute' ? 1 : this.state.trip_status === 'Completed' ? 3 : undefined,
                    trip_start_timestamp: undefined,
                    trip_end_timestamp: undefined,
                    user_type_id: this.state.decoded.user_type_id,
                    location_id: this.state.locationData,
                    access_right: this.state.decoded.access_right,
                    sort_on: "t.created_at",
                    sort_by: "desc",
                    owned: this.state.owned
                }
            }



            fetch(url, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (await AsyncStorage.getItem('user_token'))
                }
            })
                .then((response) => { return response.json(); })
                .then((res) => {
                    if (res.data[0]) {
                        var total = res.data[0];
                        var datatotal = res.data.length;
                        this.setState({ total: total.total_records, datatotal: datatotal })
                    }
                    this.setState({ data: res.data, filtered: res.data, loading: false, fetching_Status: false });
                })
                .catch((error) => { this.showMessage(error.message); this.setState({ loading: false, fetching_Status: false }) })
        } else {
            this.setState({ loading: true }, () => {
                this.page = 0;
                this.Load_more();
            })
        }

    }

    _onRefresh = () => {
        this.onReset()

        this.setState({ refreshing: true, loading: true }, () => {
            this.page = 0;
            this.Load_more();
            this.setState({ refreshing: false })
        });
    }



    async UNSAFE_componentWillReceiveProps(text) {
        this.setState({ loading: true });
        this.page = 0;
        this.page = this.page + 5;
        this.filtered(text)
    }

    filteredtrack() {
        this.setState({data:''})
        var item ={}
        item.itemName = this.state.lock_idfilter;
        item.vehicle_nofilter = this.state.vehicle_nofilter
        item.invoice = this.state.invoice
        item.bill_no = this.state.bill_no
        item.trip_status = this.state.trip_status
        this.props.navigation.navigate('TrackFilter',{item:item})
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

    render() {
        const { navigate } = this.props.navigation;
        console.log('datatotal',this.state.data != '' && this.state.datatotal < this.state.total && !this.state.value && this.state.loading === false  )
        return (
            < View style={[commonStyles.column, { flex: 1 }]} >
                <Header onBack={() => {
                    const resetAction = StackActions.reset({
                        index: 0,
                        actions: [
                            NavigationActions.navigate({
                                routeName: "TabManager"
                            })
                        ]
                    });
                    this.props.navigation.dispatch(resetAction);
                }} label={"Track"} onNotificationURL={() => { navigate('NotificationScreen') }} onProfileUrl={() => { navigate('ProfileScreen') }} expanded={true} />
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this._onRefresh}
                        />
                    } >
                    <View style={{
                        backgroundColor: 'white',
                        flex: 1
                    }}>
                        <View style={{ marginTop: 10, backgroundColor: 'white' }}>
                            <View style={{ backgroundColor: 'white' }}>
                                <View style={{ flexDirection: 'row' }}>
                                    <View /*onPress={() => Actions.searchcomplete()}*/ style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                        <TextInput placeholder={'Search by Trip ID'} value={this.state.value} onFocus={() => this.setState({ focus: false })} onChangeText={text => this.searchFilterFunction(text)} style={{ flex: 1, marginLeft: 10, fontSize: 14, justifyContent: 'center' }} />
                                        <Image source={require('../../assets/images/search.png')} style={{ height: heightPercentageToDP('3.5%'), width: widthPercentageToDP('5%'), margin: 10, justifyContent: 'flex-end', resizeMode: 'contain' }} />
                                    </View>
                                </View>
                            </View>
                            {this.state.loading === false ?
                                <FlatList
                                    data={this.state.data}
                                    renderItem={({ item }) => {
                                        console.log('item',item)
                                        return (
                                            <View style={{ flex: 1, backgroundColor: 'white', marginRight: widthPercentageToDP('3%'), marginLeft: widthPercentageToDP('3%'), marginTop: widthPercentageToDP('3%'), borderWidth: widthPercentageToDP('0.15%'), borderRadius: widthPercentageToDP('2%'), padding: widthPercentageToDP('1%') }}>
                                                <TouchableOpacity onPress={() => this.props.navigation.navigate('TrackDetail', { item: item })} >
                                                    <View style={{ flexDirection: 'column', backgroundColor: 'white' }}>
                                                        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                                            <View style={{ flexDirection: 'row', justifyContent: 'center', }}>
                                                                <Image source={require('../../assets/images/distance-grey.png')} style={{ height: 16, width: 16, margin: 10, justifyContent: 'flex-start' }} />
                                                                <Text style={{ fontSize: 15, color: '#141312', justifyContent: 'center', alignSelf: 'center' }}>{'Trip ID:'}</Text>
                                                                <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#141312', alignSelf: 'center' }}>{item.trip_id || '---'}</Text>
                                                            </View>
                                                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', marginRight: 10 }}>
                                                                <View style={{ height: 25, width: 100, borderRadius: 40, backgroundColor: item.trip_status === 1 ? "#FFA838" : "#7ED321", justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                                                                    <Text style={{ color: 'white' }}>{item.trip_status === 1 || item.trip_status !== 3 ? 'Enroute' : 'Completed'}</Text>
                                                                </View>
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
                                                                <Image source={require('../../assets/images/dotted-line.png')} style={{ height: 50, justifyContent: 'flex-start', alignSelf: 'center', marginTop: -10 }} />
                                                                <Image source={require('../../assets/images/flags-red.png')} style={{ height: 16, width: 16, margin: 5, justifyContent: 'flex-start', resizeMode: 'contain', alignSelf: 'center' }} />
                                                            </View>
                                                            <View style={{ flexDirection: 'column', justifyContent: 'space-between', marginLeft: 10, margin: 10 }}>
                                                                <Text style={{ fontSize: 14, color: '#949494' }}>From</Text>
                                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312' }}>{item.from_location || "----"}</Text>
                                                                <Text style={{ fontSize: 14, color: '#949494' }}>To</Text>
                                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312' }}>{item.to_location || "----"}</Text>
                                                            </View>
                                                        </View>
                                                        {/* second */}
                                                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-end', marginLeft: 30, marginTop: 5 }}>
                                                            <View style={{ flexDirection: 'column', justifyContent: 'flex-end', }}>
                                                                <Image source={require('../../assets/images/truck.png')} style={{ height: 20, width: 20, justifyContent: 'flex-end', alignSelf: 'center', resizeMode: 'contain', }} />
                                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', }}>{item.vehicle_number || "----"}</Text>
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
                                                            <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center' }}>Expected Departure</Text>
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
                                            </View>)
                                    }} 
                                    keyExtractor={item => item.trip_id || '-'} 
                                    /> :
                                <View style={{ height: heightPercentageToDP('100%'), flex: 1, backgroundColor: 'white', paddingTop: heightPercentageToDP('10%') }}>
                                    <ActivityIndicator size={'large'} color='#263C88' />
                                </View>
                            }
                            {this.state.loading ? false : this.state.data == '' ? <View style={{
                                flex: 1, backgroundColor: 'white', marginRight: widthPercentageToDP('3%'), marginLeft: widthPercentageToDP('3%'), marginTop: widthPercentageToDP('3%'), borderWidth: widthPercentageToDP('0.15%'), borderRadius: widthPercentageToDP('2%'), padding: widthPercentageToDP('1%')
                            }}>
                                <View style={{ flex: 1, flexDirection: 'row', }}>
                                    <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-start', height: widthPercentageToDP('40%') }}>
                                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignContent: 'center' }}>
                                            <Text style={{ fontSize: 15, color: '#000000', justifyContent: 'center', alignSelf: 'center', fontWeight: 'bold' }}>No Records Found</Text>
                                        </View>
                                    </View>
                                </View>
                            </View> : null}
                            {this.state.data != '' && this.state.datatotal < this.state.total && !this.state.value && this.state.loading === false && !this.state.lock_idfilter && !this.state.vehicle_nofilter && !this.state.invoice  && !this.state.bill_no  && !this.state.trip_status ?
                                <TouchableOpacity style={{ justifyContent: 'center', alignSelf: 'center', padding: 7, margin: 40, flexDirection: 'row', backgroundColor: '#263C88', borderRadius: 100 }} onPress={() => this.Load_more()} >
                                    <Text style={{ justifyContent: "center", alignSelf: 'center', color: '#fff', margin: 5 }}>LOAD MORE</Text>
                                    {(this.state.fetching_Status === true) ? <ActivityIndicator color="#fff" style={{ marginLeft: 6 }} /> : null}
                                </TouchableOpacity>
                                : null}
                            {this.state.data != '' && this.state.datatotal < this.state.total && this.state.value && this.state.loading === false ?
                                <TouchableOpacity style={{ justifyContent: 'center', alignSelf: 'center', padding: 7, margin: 40, flexDirection: 'row', backgroundColor: '#263C88', borderRadius: 100 }}
                                    onPress={() => this.searchLoadList()} >
                                    <Text style={{ justifyContent: "center", alignSelf: 'center', color: '#fff', margin: 5 }}>LOAD MORE</Text>
                                    {(this.state.fetching_Status === true) ? <ActivityIndicator color="#fff" style={{ marginLeft: 6 }} /> : null}
                                </TouchableOpacity>
                                : null}
                            {this.state.data != '' && this.state.datatotal < this.state.total && this.state.value == '' && this.state.loading === false && (this.state.lock_idfilter || this.state.vehicle_nofilter || this.state.invoice || this.state.bill_no || this.state.trip_status) ?
                                <TouchableOpacity style={{ justifyContent: 'center', alignSelf: 'center', padding: 7, margin: 40, flexDirection: 'row', backgroundColor: '#263C88', borderRadius: 100 }} onPress={() => this.fliterLoadList()}>
                                    <Text style={{ justifyContent: "center", alignSelf: 'center', color: '#fff', margin: 5 }}>LOAD MORE</Text>
                                    {(this.state.fetching_Status === true) ? <ActivityIndicator color="#fff" style={{ marginLeft: 6 }} /> : null}
                                </TouchableOpacity>
                                : null}
                        </View>
                    </View>
                </ScrollView>
                <Fab
                    onPress={() => { this.filteredtrack() }}
                    direction="up"
                    containerStyle={{ bottom: 30, marginRight: widthPercentageToDP('5%') }}
                    style={{ backgroundColor: '#3394E6', height: 55, width: 55 }}
                    position="bottomRight">
                    < Image source={require('../../assets/images/filter.png')} style={{ height: 20, width: 20, resizeMode: 'contain', tintColor: 'white' }} />
                </Fab>

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


            </View >
        )

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
function mapStateToProps(state) {
    return {
        search: state.search,
        vehicle: state.vehicle,
        invoice: state.invoice,
        bill_no: state.bill_no,
        trip_status: state.trip_status
    }
}
export default connect(mapStateToProps, filter)(withNavigation(TrackScreen));

