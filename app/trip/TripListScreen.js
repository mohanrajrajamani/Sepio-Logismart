import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator, FlatList, RefreshControl, TextInput } from 'react-native';
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
import LinearGradient from 'react-native-linear-gradient';
import { ScrollView } from "react-native-gesture-handler";
import { Toast, Fab } from 'native-base';
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from '@react-native-community/async-storage';
import Header from '../component/Header';
import * as filter from '../actions/filterAction';
import Modal from 'react-native-modalbox';
import APIService from '../component/APIServices';
var jwtDecode = require('jwt-decode');
class TripListScreen extends React.Component {

    constructor(props) {
        super();
        this.state = {
            expanded: true,
            value: '',
            focus: false,
            data: '',
            isPagable: false,
            fetching_Status: false,
            loading: true,
            isConnected: true,
            connection_Status: true,
            retryload: false,
            datatotal: 0,
            total: 1,
            refreshing: false,
            decoded: '',
            userDetails: [],
            feature_id: '',
            owned: 0,
            locationData: [],
            location_id_admin: 'all',
            trip_idfilter:'',
            from_filter:'',
            to_locationfilter:'',
            from_datefilter:'',
            To_datefilter:''
        };
        this.pageNo = 0;
        this.page = 0;
        this.searchpage = 5;
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

    async filtered() {
        console.log("filtered : ", this.state.trip_idfilter)
        this.setState({ loading: true })
        if (this.state.trip_idfilter || this.state.from_filter || this.state.to_locationfilter || this.state.from_datefilter || this.state.To_datefilter ) {
            if (this.state.from_datefilter ? this.state.from_datefilter : false) {
                var from_date_time = moment(this.state.from_datefilter, 'DD MMM YYYY').utc().unix();
            }
            if (this.state.To_datefilter ? this.state.To_datefilter : false) {
                var to_Date_time = moment(this.state.To_datefilter, 'DD MMM YYYY').utc().unix();
            }
            if (this.state.from_datefilter ? !this.state.from_datefilter : false) {
                alert("Please select from Date")
            } else if (this.state.To_datefilter ? !this.state.To_datefilter : false) {
                alert("Please select to Date")
            } else if (from_date_time > to_Date_time) {
                alert("Please select proper from Date & to Date")
            }
            else {
                var body;
                if (this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3) {
                    body = {
                        page_no: 0,
                        page_limit: this.page,
                        from_id: this.state.from_filter ? this.state.from_filter.id : undefined,
                        to_id: this.state.to_locationfilter ? this.state.to_locationfilter.id : undefined,
                        trip_id: this.state.trip_idfilter ? this.state.trip_idfilter.itemName : undefined,
                        trip_start_timestamp: from_date_time || undefined,
                        trip_end_timestamp: to_Date_time || undefined,
                        user_type_id: this.state.decoded.user_type_id || undefined,
                        location_id: this.state.locationData,
                        sort_on: "created_at",
                        sort_by: "desc"
                    }

                    var res = await APIService.execute('POST', APIService.URL + APIService.filterInitiateTrip, body)
                    if (res.data.data[0]) {
                        var total = res.data.data[0];
                        var datatotal = res.data.data.length;
                        this.setState({ total: total.total_records, datatotal: datatotal })
                    }
                    this.setState({ data: res.data.data, loading: false });
                }
                else if (this.state.decoded.user_type_id === 2) {

                    body = {
                        page_no: 0,
                        page_limit: this.page,
                        from_id: this.state.from_filter ? this.state.from_filter.id : undefined,
                        to_id: this.state.to_locationfilter ? this.state.to_locationfilter.id : undefined,
                        trip_id: this.state.trip_idfilter ? this.state.trip_idfilter.itemName : undefined,
                        trip_start_timestamp: from_date_time || undefined,
                        trip_end_timestamp: to_Date_time || undefined,
                        user_type_id: this.state.decoded.user_type_id || undefined,
                        location_id: this.state.locationData,
                        sort_on: "created_at",
                        sort_by: "desc",
                        owned: this.state.owned
                    }
                    console.log("user type 2 : ", body);
                    var res = await APIService.execute('POST', APIService.URL + APIService.filterInitiateTrip, body)
                    if (res.data.data[0]) {
                        var total = res.data.data[0];
                        var datatotal = res.data.data.length;
                        this.setState({ total: total.total_records, datatotal: datatotal })
                    }
                    this.setState({ data: res.data.data, loading: false });
                }
            }
        }
        else {
            this.setState({ refreshing: true, loading: true }, () => {
                this.page = 0;
                this.getUserDetails();
                this.setState({ value: '', refreshing: false })
            });
        }
        this.setState({ loading: false })
    }

    async componentWillReceiveProps(text) {
        console.log('Working')
        this.setState({ loading: true });
        this.page = 0;
        this.page = this.page + 5;
        this.filtered()
    }
    async fliterLoadList() {
        this.page = this.page + 5;
        this.filtered()
    }

    async componentDidMount() {
        this.onReset()
        this.getUserDetails()
        this.props.navigation.addListener('didFocus', () => { 
        console.log('Working did focus')
            this.setState({ loading: true });
            this.page = 0;
            this.page = this.page + 5;
            this.TripFilter()
        });
    }
    

    async onReset() {
        await AsyncStorage.setItem("TRIP_ID", "");
        await AsyncStorage.setItem("FROM_LOCATION", "");
        await AsyncStorage.setItem("TO_LOCATION", "");
        await AsyncStorage.setItem("FROM_DATE", "");
        await AsyncStorage.setItem("TO_DATE", "");
        this.setState({trip_idfilter:'', from_filter:'', to_locationfilter:'', from_datefilter:'', To_datefilter:''})
    }

    async TripFilter(){
        await AsyncStorage.getItem('TRIP_ID').then((value) => {
            var trip_id = JSON.parse(value);
            console.log("trip_id",trip_id)
            this.setState({
                trip_idfilter: trip_id
            })
        });
        await AsyncStorage.getItem('FROM_LOCATION').then((value) => {
            var from_filter = JSON.parse(value);
            console.log("from_filter",from_filter)
            this.setState({
                from_filter: from_filter
            })
        });
        await AsyncStorage.getItem('TO_LOCATION').then((value) => {
            var to_locationfilter = JSON.parse(value);
            console.log("to_locationfilter",to_locationfilter)
            this.setState({
                to_locationfilter: to_locationfilter
            })
        });
        await AsyncStorage.getItem('FROM_DATE').then((value) => {
            var from_datefilter = JSON.parse(value);
            console.log("from_datefilter",from_datefilter)
            this.setState({
                from_datefilter: from_datefilter
            })
        });
        await AsyncStorage.getItem('TO_DATE').then((value) => {
            var To_datefilter = JSON.parse(value);
            console.log("To_datefilter",To_datefilter)
            this.setState({
                To_datefilter: To_datefilter
            })
        });
        if(this.state.trip_idfilter || this.state.from_filter || this.state.to_locationfilter || this.state.from_datefilter || this.state.To_datefilter){
            this.filtered()
        }
        else{
            this.getUserDetails()
        }
    }

    async getUserDetails() {
        var userDetails = await APIService.execute('GET', APIService.URL + APIService.userdetails, null)
        if (userDetails.status === 200) {
            await AsyncStorage.setItem("TRIP_ID", "");
            await AsyncStorage.setItem("FROM_LOCATION", "");
            await AsyncStorage.setItem("TO_LOCATION", "");
            await AsyncStorage.setItem("FROM_DATE", "");
            await AsyncStorage.setItem("TO_DATE", "");

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
                    this.setState({ locationData: temp, loading: false }, () => { this.Load_more() })
                }
                else if (this.state.decoded.user_type_id === 2) {
                    if (this.state.userDetails.role_id === null) {
                        this.setState({ owned: 0, locationData: this.state.userDetails.location_id, loading: false }, () => { this.Load_more() });
                    }
                    else {
                        var listOwnedLocationDetails = await APIService.execute('GET', APIService.URL + APIService.listownedloccationdetailsall, null)
                        console.log("listOwnedLocationDetails : ", listOwnedLocationDetails)
                        temp = [];
                        for (let i = 0; i < listOwnedLocationDetails.data.location_id.length; i++) {
                            temp.push(listOwnedLocationDetails.data.location_id[i].id);
                        }
                        this.setState({ locationData: temp, owned: 1, loading: false }, () => { this.Load_more() });
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

    async Load_more() {
        this.setState({ loading: true }, async () => {
            this.page = this.page + 5;
            var tripListUrl = APIService.URL + APIService.listtripdetails;
            var body;
            if (this.state.decoded.user_type_id === 2) {
                body = JSON.stringify({
                    page_no: this.pageNo,
                    page_limit: this.page,
                    user_type_id: this.state.decoded.user_type_id,
                    location_id: this.state.locationData,
                    sort_on: "created_at",
                    sort_by: "desc",
                    owned: this.state.owned
                });
            }
            else if (this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3) {
                body = JSON.stringify({
                    page_no: this.pageNo,
                    page_limit: this.page,
                    user_type_id: this.state.decoded.user_type_id,
                    location_id: "all",
                    sort_on: "created_at",
                    sort_by: "desc",
                });
            }
            var tripList = await APIService.execute('POST', tripListUrl, body)
            console.log("triplist : ", tripList)
            this.setState({ loading: false })
            if (tripList.data.data[0]) {
                console.log("response : ", tripList.data.data)
                var total = tripList.data.data[0];
                var datatotal = tripList.data.data.length;
                this.setState({ total: total.total_records, datatotal: datatotal })
            }
            this.setState({ data: tripList.data.data, loading: false, fetching_Status: false })
        });
    }

    searchLoadList = () => {
        if (this.state.value) {
            this.searchpage = this.searchpage + 5;
            this.searchList(this.state.value);
        }
    }

    searchList = (text) => {
        this.setState({
            value: text
        }, async () => {
            if (this.state.value) {
                //this.setState({ loading: true })

                var body;
                if (this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3) {
                    body = JSON.stringify({
                        page_no: '0',
                        page_limit: this.searchpage,
                        user_type_id: this.state.decoded.user_type_id,
                        location_id: 'all',
                        sort_on: 'created_at',
                        sort_by: 'desc',
                        search_string: this.state.value
                    });
                }
                else if (this.state.decoded.user_type_id === 2) {
                    body = JSON.stringify({
                        page_no: '0',
                        page_limit: this.searchpage,
                        user_type_id: this.state.decoded.user_type_id,
                        location_id: this.state.locationData,
                        sort_on: 'created_at',
                        sort_by: 'desc',
                        search_string: this.state.value,
                        access_right: null,
                        owned: this.state.owned
                    });
                }

                var responseJson = await APIService.execute('POST', APIService.URL + APIService.searchtrip, body)
                if (responseJson.data.data[0]) {
                    var total = responseJson.data.data[0];
                    var datatotal = responseJson.data.data.length;
                    this.setState({ total: total.total_records, datatotal: datatotal })
                }
                this.setState({ data: responseJson.data.data });
            }
            else {
                this.page = 0;
                this.Load_more();
            }
        })
    }

    _onRefresh = () => {
        this.onReset()
        this.setState({ refreshing: true, loading: true }, () => {
            this.page = 0;
            this.getUserDetails();
            this.setState({ value: '', refreshing: false })
        });
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

    addTripButton() {
        return (
            <Fab
                onPress={() => { this.props.navigation.navigate('TripAdd') }}
                direction="left"
                containerStyle={{ marginBottom: hp('3%') }}
                style={{ backgroundColor: color.orange, height: hp('8%'), width: hp('8%') }}
                position="bottomLeft">
                <Image source={require('../../assets/images/plus.png')} style={{ height: hp('6%'), width: wp('6%'), resizeMode: 'contain', tintColor: 'white' }} />
            </Fab>
        )
    }

    filteredtrip(){
        this.setState({data:''})
        var item ={}
        item.trip_id = this.state.trip_idfilter;
        item.from_location = this.state.from_filter
        item.to_location = this.state.to_locationfilter
        item.from_datefilter = this.state.from_datefilter
        item.To_datefilter = this.state.To_datefilter
        this.props.navigation.navigate('TripFilterScreen',{item:item})
    }


    render() {
        const { navigate } = this.props.navigation;
        if (this.state.loading) {
            return (
                <View style={[commonStyles.column, { flex: 1, marginTop: hp('4%') }]}>
                    <Header label={"Trip List"} expanded={this.state.expanded} onBack={() => { this.props.navigation.goBack() }} />
                    <View style={{ flex: 1, marginTop: hp('10%') }}>
                        <ActivityIndicator
                            size='large'
                            color={color.gradientStartColor}
                        />
                    </View>
                </View>
            )
        }
        else {
            return (
                <View style={[commonStyles.column, { flex: 1, marginTop: hp('4%'), backgroundColor: 'white' }]}>
                    <Header label={"Trip List"} expanded={this.state.expanded} onBack={() => {
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
                                color={"#263C88"} />
                        } >
                        <View style={{
                            backgroundColor: 'white',
                            flex: 1
                        }} >
                            <View style={{
                                marginTop: 10,
                                backgroundColor: 'white'
                            }} >
                                <View style={{ backgroundColor: 'white' }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <View /*onPress={() => Actions.searchcomplete()}*/ style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                            <TextInput placeholder={'Search by Trip ID'} value={this.state.value} onFocus={() => this.setState({ focus: false })} onChangeText={text => this.searchList(text)} style={{ flex: 1, marginLeft: 10, fontSize: 14, justifyContent: 'center' }} />
                                            <Image source={require('../../assets/images/search.png')} style={{ height: hp('3.5%'), width: wp('5%'), margin: 10, justifyContent: 'flex-end', resizeMode: 'contain' }} />
                                        </View>
                                    </View>
                                </View>
                                {this.state.loading === false ?
                                    <FlatList
                                        data={this.state.data}
                                        renderItem={({ item }) => (
                                            <View style={{ flex: 1, backgroundColor: 'white', marginRight: wp('3%'), marginLeft: wp('3%'), marginTop: wp('3%'), borderWidth: wp('0.15%'), borderRadius: wp('2%'), padding: wp('1%') }}>
                                                {
                                                    this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3 ?
                                                        <TouchableOpacity onPress={() => this.props.navigation.navigate('TripDetailScreen', { item: item })} >
                                                            <View style={{ flexDirection: 'column', backgroundColor: 'white' }}>
                                                                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                                                    <View style={{ flexDirection: 'row', justifyContent: 'center', }}>
                                                                        <Image source={require('../../assets/images/distance-grey.png')} style={{ height: 16, width: 16, margin: 10, justifyContent: 'flex-start' }} />
                                                                        <Text style={{ fontSize: 15, color: '#141312', justifyContent: 'center', alignSelf: 'center' }}>{'Trip ID:'}</Text>
                                                                        <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#141312', alignSelf: 'center' }}>{item.trip_id}</Text>
                                                                    </View>
                                                                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', marginRight: 10 }}>
                                                                        <View style={{ height: 25, width: 140, borderRadius: 40, backgroundColor: item.lock_id == null ? "#FFA838" : "#263C88", justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                                                                            <Text style={{ color: 'white' }}>{item.lock_id == null ? 'Lock not assigned' : 'Lock assigned'}</Text>
                                                                        </View>
                                                                    </View>
                                                                </View>
                                                                <View style={{ flexDirection: 'row', marginLeft: wp('3%') }}>
                                                                    <Text style={{ fontSize: 15, color: '#141312', justifyContent: 'center', alignSelf: 'center' }}>Sub Trip : </Text>
                                                                    <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#141312', alignSelf: 'center' }}>{item.sub_trip_count}</Text>
                                                                </View>
                                                            </View>

                                                            <View style={{ flexDirection: 'row', }}>
                                                                <View style={{ flex: 1, flexDirection: 'row', }}>
                                                                    <View style={{ flexDirection: 'column', justifyContent: 'flex-start', height: wp('30%') }}>
                                                                        <Image source={require('../../assets/images/flags-green.png')} style={{ height: 16, width: 16, margin: 10, justifyContent: 'flex-start', alignSelf: 'center', resizeMode: 'contain' }} />
                                                                        <Image source={require('../../assets/images/dotted-line.png')} style={{ height: 50, justifyContent: 'flex-start', alignSelf: 'center', marginTop: -10 }} />
                                                                        <Image source={require('../../assets/images/flags-red.png')} style={{ height: 16, width: 16, margin: 5, justifyContent: 'flex-start', resizeMode: 'contain', alignSelf: 'center' }} />
                                                                    </View>
                                                                    <View style={{ flexDirection: 'column', justifyContent: 'space-between', margin: 10, }}>
                                                                        <Text style={{ fontSize: 14, color: '#949494' }}>From</Text>
                                                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312' }}>{item.from_location}</Text>
                                                                        <Text style={{ fontSize: 14, color: '#949494' }}>To</Text>
                                                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312' }}>{item.to_location}</Text>
                                                                    </View>
                                                                </View>
                                                                <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-end', marginLeft: 30, marginTop: 5 }}>
                                                                    <View style={{ flexDirection: 'column', justifyContent: 'flex-end', }}>
                                                                        <Image source={require('../../assets/images/truck.png')} style={{ height: 20, width: 20, justifyContent: 'flex-end', alignSelf: 'center', resizeMode: 'contain', }} />
                                                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', }}>{item.vehicle_number}</Text>
                                                                    </View>
                                                                    <View style={{ flexDirection: 'column', justifyContent: 'flex-end', marginTop: 15 }}>
                                                                        <Image source={require('../../assets/images/driver.png')} style={{ height: 18, width: 18, justifyContent: 'flex-end', alignSelf: 'center', resizeMode: 'contain' }} />
                                                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', marginBottom: 10 }}>{item.driver_name || "---"}</Text>
                                                                    </View>
                                                                </View>
                                                            </View>
                                                            <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                                            <View style={{ flexDirection: 'row', flex: 1, margin: 10 }}>
                                                                <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-start' }}>
                                                                    <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center' }}>Expected Depature</Text>
                                                                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center' }}>{moment.unix(item.exp_departure_timestamp, 'DD-MM-YYYY').format('DD MMM YYYY HH:mm') || '----'}</Text>
                                                                </View>
                                                                <View style={{
                                                                    borderLeftWidth: 0.5, justifyContent: 'center', marginTop: -10, marginBottom: -10,
                                                                    borderLeftColor: '#ABB5C4',
                                                                }}></View>
                                                                <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-end', alignContent: 'center', }}>
                                                                    <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center' }}>Expected Arrival</Text>
                                                                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center' }}>{moment.unix(item.exp_arrival_timestamp, 'DD-MM-YYYY').format('DD MMM YYYY HH:mm') || '----'}</Text>
                                                                </View>
                                                            </View>
                                                        </TouchableOpacity>
                                                        : this.state.decoded.user_type_id === 2 ?
                                                            this.state.feature_id === null || this.state.feature_id.indexOf(4) > -1 ?
                                                                <TouchableOpacity onPress={() => this.props.navigation.navigate('TripDetailScreen', { item: item })} >
                                                                    <View style={{ flexDirection: 'column', backgroundColor: '#F5F5F4' }}>
                                                                        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                                                                            <View style={{ flexDirection: 'row', justifyContent: 'center', }}>
                                                                                <Image source={require('../../assets/images/distance-grey.png')} style={{ height: 16, width: 16, margin: 10, justifyContent: 'flex-start' }} />
                                                                                <Text style={{ fontSize: 15, color: '#141312', justifyContent: 'center', alignSelf: 'center' }}>{'Trip ID:'}</Text>
                                                                                <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#141312', alignSelf: 'center' }}>{item.trip_id}</Text>
                                                                            </View>
                                                                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', marginRight: 10 }}>
                                                                                <View style={{ height: 25, width: 140, borderRadius: 40, backgroundColor: item.lock_id == null ? "#FFA838" : "#263C88", justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                                                                                    <Text style={{ color: 'white' }}>{item.lock_id == null ? 'Lock not assigned' : 'Lock assigned'}</Text>
                                                                                </View>
                                                                            </View>
                                                                        </View>
                                                                        <View style={{ flexDirection: 'row', marginLeft: wp('3%') }}>
                                                                            <Image style={{ height: 16, width: 16, margin: 10, justifyContent: 'flex-start' }} />
                                                                            <Text style={{ fontSize: 15, color: '#141312', justifyContent: 'center', alignSelf: 'center' }}>Sub Trip : </Text>
                                                                            <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#141312', alignSelf: 'center' }}>{item.sub_trip_count}</Text>
                                                                        </View>
                                                                    </View>
                                                                    <View style={{ flexDirection: 'row', }}>
                                                                        <View style={{ flex: 1, flexDirection: 'row', }}>
                                                                            <View style={{ flexDirection: 'column', justifyContent: 'flex-start', height: wp('30%') }}>
                                                                                <Image source={require('../../assets/images/flags-green.png')} style={{ height: 16, width: 16, margin: 10, justifyContent: 'flex-start', alignSelf: 'center', resizeMode: 'contain' }} />
                                                                                <Image source={require('../../assets/images/dotted-line.png')} style={{ height: 50, justifyContent: 'flex-start', alignSelf: 'center', marginTop: -10 }} />
                                                                                <Image source={require('../../assets/images/flags-red.png')} style={{ height: 16, width: 16, margin: 5, justifyContent: 'flex-start', resizeMode: 'contain', alignSelf: 'center' }} />
                                                                            </View>
                                                                            <View style={{ flexDirection: 'column', justifyContent: 'space-between', margin: 10, }}>
                                                                                <Text style={{ fontSize: 14, color: '#949494' }}>From</Text>
                                                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312' }}>{item.from_location}</Text>
                                                                                <Text style={{ fontSize: 15, marginTop: 10 }}>To</Text>
                                                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312' }}>{item.to_location}</Text>
                                                                            </View>
                                                                        </View>
                                                                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-end', marginLeft: 30, marginTop: 5 }}>
                                                                            <View style={{ flexDirection: 'column', justifyContent: 'flex-end', }}>
                                                                                <Image source={require('../../assets/images/truck.png')} style={{ height: 20, width: 20, justifyContent: 'flex-end', alignSelf: 'center', resizeMode: 'contain', }} />
                                                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', }}>{item.vehicle_number}</Text>
                                                                            </View>
                                                                            <View style={{ flexDirection: 'column', justifyContent: 'flex-end', marginTop: 15 }}>
                                                                                <Image source={require('../../assets/images/driver.png')} style={{ height: 18, width: 18, justifyContent: 'flex-end', alignSelf: 'center', resizeMode: 'contain' }} />
                                                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', marginBottom: 10 }}>{item.driver_name || "---"}</Text>
                                                                            </View>
                                                                        </View>
                                                                    </View>
                                                                    <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                                                    <View style={{ flexDirection: 'row', flex: 1, margin: 10 }}>
                                                                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-start' }}>
                                                                            <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center' }}>Expected Depature</Text>
                                                                            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center' }}>{moment.unix(item.exp_departure_timestamp, 'DD-MM-YYYY').format('DD MMM YYYY HH:mm') || '----'}</Text>
                                                                        </View>
                                                                        <View style={{
                                                                            borderLeftWidth: 0.5, justifyContent: 'center', marginTop: -10, marginBottom: -10,
                                                                            borderLeftColor: '#ABB5C4',
                                                                        }}></View>
                                                                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-end', alignContent: 'center', }}>
                                                                            <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center' }}>Expected Arrival</Text>
                                                                            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center' }}>{moment.unix(item.exp_arrival_timestamp, 'DD-MM-YYYY').format('DD MMM YYYY HH:mm') || '----'}</Text>
                                                                        </View>
                                                                    </View>
                                                                </TouchableOpacity>
                                                                : <View>
                                                                    <View style={{ flexDirection: 'row', justifyContent: 'center', backgroundColor: '#F5F5F4' }}>
                                                                        <View style={{ flexDirection: 'row', justifyContent: 'center', }}>
                                                                            <Image source={require('../../assets/images/distance-grey.png')} style={{ height: 16, width: 16, margin: 10, justifyContent: 'flex-start' }} />
                                                                            <Text style={{ fontSize: 15, color: '#141312', justifyContent: 'center', alignSelf: 'center' }}>{'Trip ID:'}</Text>
                                                                            <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#141312', alignSelf: 'center' }}>{item.trip_id}</Text>
                                                                        </View>
                                                                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', marginRight: 10 }}>
                                                                            <View style={{ height: 25, width: 140, borderRadius: 40, backgroundColor: item.lock_id == null ? "#FFA838" : "#263C88", justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                                                                                <Text style={{ color: 'white' }}>{item.lock_id == null ? 'Lock not assigned' : 'Lock assigned'}</Text>
                                                                            </View>
                                                                        </View>
                                                                    </View>
                                                                    <View style={{ flexDirection: 'row', }}>
                                                                        <View style={{ flex: 1, flexDirection: 'row', }}>
                                                                            <View style={{ flexDirection: 'column', justifyContent: 'flex-start', height: wp('30%') }}>
                                                                                <Image source={require('../../assets/images/flags-green.png')} style={{ height: 16, width: 16, margin: 10, justifyContent: 'flex-start', alignSelf: 'center', resizeMode: 'contain' }} />
                                                                                <Image source={require('../../assets/images/dotted-line.png')} style={{ height: 50, justifyContent: 'flex-start', alignSelf: 'center', marginTop: -10 }} />
                                                                                <Image source={require('../../assets/images/flags-red.png')} style={{ height: 16, width: 16, margin: 5, justifyContent: 'flex-start', resizeMode: 'contain', alignSelf: 'center' }} />
                                                                            </View>
                                                                            <View style={{ flexDirection: 'column', justifyContent: 'space-between', margin: 10, }}>
                                                                                <Text style={{ fontSize: 14, color: '#949494' }}>From</Text>
                                                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312' }}>{item.from_location}</Text>
                                                                                <Text style={{ fontSize: 15, marginTop: 10 }}>To</Text>
                                                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312' }}>{item.to_location}</Text>
                                                                            </View>
                                                                        </View>
                                                                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-end', marginLeft: 30, marginTop: 5 }}>
                                                                            <View style={{ flexDirection: 'column', justifyContent: 'flex-end', }}>
                                                                                <Image source={require('../../assets/images/truck.png')} style={{ height: 20, width: 20, justifyContent: 'flex-end', alignSelf: 'center', resizeMode: 'contain', }} />
                                                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', }}>{item.vehicle_number}</Text>
                                                                            </View>
                                                                            <View style={{ flexDirection: 'column', justifyContent: 'flex-end', marginTop: 15 }}>
                                                                                <Image source={require('../../assets/images/driver.png')} style={{ height: 18, width: 18, justifyContent: 'flex-end', alignSelf: 'center', resizeMode: 'contain' }} />
                                                                                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center', marginBottom: 10 }}>{item.driver_name || "---"}</Text>
                                                                            </View>
                                                                        </View>
                                                                    </View>
                                                                    <View style={{ flex: 1, backgroundColor: '#ABB5C4', height: 0.5 }}></View>
                                                                    <View style={{ flexDirection: 'row', flex: 1, margin: 10 }}>
                                                                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-start' }}>
                                                                            <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center', alignContent: 'center' }}>Expected Depature</Text>
                                                                            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center' }}>{moment.unix(item.exp_departure_timestamp, 'DD-MM-YYYY').format('DD MMM YYYY HH:mm') || '----'}</Text>
                                                                        </View>
                                                                        <View style={{
                                                                            borderLeftWidth: 0.5, justifyContent: 'center', marginTop: -10, marginBottom: -10,
                                                                            borderLeftColor: '#ABB5C4',
                                                                        }}></View>
                                                                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-end', alignContent: 'center', }}>
                                                                            <Text style={{ fontSize: 14, color: '#949494', alignSelf: 'center' }}>Expected Arrival</Text>
                                                                            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#141312', alignSelf: 'center' }}>{moment.unix(item.exp_arrival_timestamp, 'DD-MM-YYYY').format('DD MMM YYYY HH:mm') || '----'}</Text>
                                                                        </View>
                                                                    </View>
                                                                </View> : null
                                                }
                                            </View>
                                        )}
                                        keyExtractor={item => item._id} /> :
                                    <View style={{ flex: 1, alignItems: 'center', backgroundColor: 'white', justifyContent: 'center', paddingTop: 50 }}>
                                        <ActivityIndicator size={'large'} color='#263C88' />
                                    </View>}
                                {this.state.loading ? false : this.state.data == '' ? <View style={{
                                    flex: 1, backgroundColor: 'white', marginRight: wp('3%'), marginLeft: wp('3%'), marginTop: wp('3%'), borderWidth: wp('0.15%'), borderRadius: wp('2%'), padding: wp('1%')
                                }}>
                                    <View style={{ flex: 1, flexDirection: 'row', }}>
                                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-start', height: wp('40%') }}>
                                            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignContent: 'center' }}>
                                                <Text style={{ fontSize: 15, color: '#000000', justifyContent: 'center', alignSelf: 'center', fontWeight: 'bold' }}>No Records Found</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View> : null}
                                {this.state.data != '' && this.state.datatotal < this.state.total && !this.state.value && this.state.loading === false && !this.state.trip_idfilter && !this.state.from_filter && !this.state.to_locationfilter && !this.state.from_datefilter  && this.state.To_datefilter?
                                    <TouchableOpacity
                                        style={{ justifyContent: 'center', alignSelf: 'center', padding: 7, margin: 40, flexDirection: 'row', backgroundColor: '#263C88', borderRadius: 100 }}
                                        onPress={() => this.Load_more()}>
                                        <Text style={{ justifyContent: "center", alignSelf: 'center', color: '#fff', margin: 5 }}>LOAD MORE</Text>
                                        {(this.state.fetching_Status === true) ? <ActivityIndicator color="#fff" style={{ marginLeft: 6 }} /> : null}
                                    </TouchableOpacity>
                                    : null}
                                {this.state.data != '' && this.state.datatotal < this.state.total && this.state.value && this.state.loading === false && this.props.search === null && this.props.fromloc === null && this.props.toloc === null && this.props.fromDate === null && this.props.toDate === null ?
                                    <TouchableOpacity
                                        style={{ justifyContent: 'center', alignSelf: 'center', padding: 7, margin: 40, flexDirection: 'row', backgroundColor: '#263C88', borderRadius: 100 }}
                                        onPress={() => this.searchLoadList()} >
                                        <Text style={{ justifyContent: "center", alignSelf: 'center', color: '#fff', margin: 5 }}>LOAD MORE</Text>
                                        {(this.state.fetching_Status === true) ? <ActivityIndicator color="#fff" style={{ marginLeft: 6 }} /> : null}
                                    </TouchableOpacity>
                                    : null}
                                {this.state.data != '' && this.state.datatotal < this.state.total && this.state.value == '' && this.state.loading === false && (this.props.search || this.props.fromloc || this.props.toloc || this.props.fromDate || this.props.toDate) ?
                                    <TouchableOpacity
                                        style={{ justifyContent: 'center', alignSelf: 'center', padding: 7, margin: 40, flexDirection: 'row', backgroundColor: '#263C88', borderRadius: 100 }} onPress={() => this.fliterLoadList()}>
                                        <Text style={{ justifyContent: "center", alignSelf: 'center', color: '#fff', margin: 5 }}>LOAD MORE</Text>
                                        {(this.state.fetching_Status === true) ? <ActivityIndicator color="#fff" style={{ marginLeft: 6 }} /> : null}
                                    </TouchableOpacity> : null}
                            </View>
                        </View>
                    </ScrollView>

                    {
                        this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3 ?
                            this.addTripButton()
                            : this.state.decoded.user_type_id === 2 ?
                                this.state.feature_id === null || this.state.feature_id.indexOf(1) > -1 ?
                                    this.addTripButton() : null : null}
                    <Fab
                        // onPress={() => { navigate('TripFilterScreen') }}
                        onPress={() => { this.filteredtrip() }}
                        direction="up"
                        containerStyle={{ marginBottom: hp('3%') }}
                        style={{ backgroundColor: color.gradientStartColor, height: hp('8%'), width: hp('8%') }}
                        position="bottomRight">
                        <Image source={require('../../assets/images/filter.png')} style={{ height: hp('6%'), width: wp('6%'), resizeMode: 'contain', tintColor: 'white' }} />
                    </Fab>
                    <Modal style={[styles.modal, styles.modal2]} position={"center"} ref={"modal1"} swipeArea={20}
                        backdropPressToClose={false}  >
                        <ScrollView keyboardShouldPersistTaps="never">
                            <View style={{ flex: 1, width: wp('85%'), backgroundColor: '#fff', borderRadius: 4, flexDirection: 'column', padding: wp('5%') }} >
                                <Text style={{ fontFamily: 'Nunito-ExtraBold', fontSize: hp('3%'), color: '#141312' }}>Unauthorized Access.</Text>
                                <Text style={{ fontFamily: 'Nunito-Regular', marginTop: wp('5%'), fontSize: hp('3%'), color: '#949494' }}>You are deactivated by admin. Try again later.</Text>

                                <TouchableOpacity style={{ width: wp('25%'), alignSelf: 'center', justifyContent: 'center', padding: wp('3%'), marginTop: wp('5%'), flexDirection: 'row', backgroundColor: color.loginBG, borderRadius: wp('10%') }} onPress={() => { this.logout() }}>
                                    <Text style={{ fontFamily: 'Nunito-Bold', justifyContent: 'center', alignSelf: 'center', color: 'white' }}>OK</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </Modal>
                </View>
            );
        }

    }
}

const styles = StyleSheet.create({
    modal: {
        marginTop: wp('3%'),
        justifyContent: 'center',
        alignItems: 'center',
        position: "absolute",
        backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    modal2: {
        maxHeight: hp('50%'),
        minHeight: hp('15%')
    },
});

const mapStateToProps = state => ({
    data: state.user.data
});

export default connect(
    mapStateToProps,
    filter
)(withNavigation(TripListScreen));