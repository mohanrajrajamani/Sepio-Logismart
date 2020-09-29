import React, { Component } from "react";
import { Toast, Container } from 'native-base';
import { Text, Keyboard, View, TouchableOpacity, Platform, Dimensions, StyleSheet, ActivityIndicator } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { widthPercentageToDP, heightPercentageToDP } from 'react-native-responsive-screen';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { withNavigation } from 'react-navigation';
import moment from "moment";
import SearchableDropdown from "./searchablebleDropdown";
const _ = require('lodash');
var jwtDecode = require('jwt-decode');
import APIService from '../component/APIServices';
import { connect } from 'react-redux';
import * as filter from '../actions/filterAction';
import Header from '../component/Header';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-community/async-storage';
import NetInfo from "@react-native-community/netinfo";
import color from '../styles/StyleConstants';

class TripFilterScreen extends Component {
    fromLocationData = [];
    constructor(props) {
        super(props);
        this.state = {
            isDateTimePickerVisible1: false,
            isDateTimePickerVisible2: false,
            isDateTimePickerVisible3: false,
            isDateTimePickerVisible4: false,
            isDateTimePickerVisible5: false,
            showResortDropdown: false,
            showlocationDropdown: false,
            showTolocationDropdown: false,
            data: '',
            isarrDatePickerVisible: false,
            isTimePickerVisible1: false,
            isTimePickerVisible2: false,
            fromdate: '',
            todate: '',
            time1: moment().format('HH:mm:ss'),
            time2: moment().format('HH:mm:ss'),
            isDateSelected: false,
            isTimeSelected: false,
            newValue: null,
            obj: {},
            loading: true,
            tripData: [],
            locationData: [],
            from_model: [],
            to_model: [],
            itemName: '',
            locationName: '',
            TolocationName: '',
            progressText: 'Loading...',
            decode: '',
            isFromLocation: false
        };
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

    async onReset() {
        await AsyncStorage.setItem("TRIP_ID", "");
        await AsyncStorage.setItem("FROM_LOCATION", "");
        await AsyncStorage.setItem("TO_LOCATION", "");
        await AsyncStorage.setItem("FROM_DATE", "");
        await AsyncStorage.setItem("TO_DATE", "");
        this.setState({ itemName: '', locationName: '', TolocationName: '', fromdate: '', todate: '' })
    }

    async componentDidMount() {
        this.state.decoded = jwtDecode(await AsyncStorage.getItem('user_token'));

        if (this.state.decoded.location_name != null) {
            this.state.decoded.location_name.forEach((locationName, index_of_locationName) => {
                this.state.decoded.location_id.forEach((locationId, index_of_locationId) => {
                    if (index_of_locationName == index_of_locationId) {
                        this.fromLocationData.push({ "id": locationId, "itemName": locationName })
                    }
                })
            });
        }

        this.setState({filter: this.props.navigation.state.params.item},()=>{
            console.log("itemName:",this.props.navigation.state.params.item)
            if(this.state.filter && this.state.filter.trip_id){
                this.setState({itemName:this.state.filter.trip_id})
            }
            if(this.state.filter && this.state.filter.from_location){
                this.setState({locationName:this.state.filter.from_location})

            }
            if(this.state.filter && this.state.filter.to_location){
                this.setState({TolocationName:this.state.filter.to_location})
            }
            if(this.state.filter && this.state.filter.from_datefilter){
                this.setState({fromdate:this.state.filter.from_datefilter})
            }
            if(this.state.filter && this.state.filter.To_datefilter){
                this.setState({todate:this.state.filter.To_datefilter})
            }
        })
    }

    getUserType() {
        //as per user type id
        if (this.state.decoded.user_type_id === 1 || this.state.decoded.user_type_id === 3) {
            this.adminDetails();
        }
        else if (this.state.decoded.user_type_id == 2) {
            this.userdetails();
        }
    }

    async userdetails() {
        var res = await APIService.execute('GET', APIService.URL + APIService.userdetails, null)
        console.log("user data : ", res.data.data[0].logismart_dropdown[0]);
        if (res.data.data[0].role_id === null) {
            var data = []
            for (let i = 0; i < res.data.data[0].location_id.length; i++) {
                var details = {}
                details.id = res.data.data[0].location_id[i]
                details.itemName = res.data.data[0].location_name[i]
                data.push(details)
            }
            console.log("user location : ", data);
        }
        else {
            console.log("dropdown val : ", res.data.data[0].logismart_dropdown[0]);
            if (res.data.data[0].logismart_dropdown[0] === 2 || res.data.data[0].logismart_dropdown[0] === 3) {
                var data = []
                for (let i = 0; i < res.data.data[0].location_id.length; i++) {
                    var details = {}
                    details.id = res.data.data[0].location_id[i]
                    details.itemName = res.data.data[0].location_name[i]
                    data.push(details)
                }
                console.log("user location : ", data);
                if (this.state.isFromLocation) {
                    this.setState({ showlocationDropdown: true, from_model: data });
                }
                else {
                    this.setState({ showTolocationDropdown: true, to_model: data });
                }
            }
            else if (res.data.data[0].logismart_dropdown[0] === 1) {
                this.ownedData();
            }
        }
    }

    async ownedData() {
        if (this.state.isFromLocation) {
            this.setState({ showlocationDropdown: true }, async () => {
                var res = await APIService.execute('GET', APIService.URL + APIService.listownedloccationdetailsall, null)
                this.setState({ from_model: res.data.location_id })
            });
        }
        else {
            this.setState({ showTolocationDropdown: true }, async () => {
                var res = await APIService.execute('GET', APIService.URL + APIService.listownedloccationdetailsall, null)
                this.setState({ to_model: res.data.location_id })
            });
        }
    }

    async adminDetails() {
        if (this.state.isFromLocation) {
            this.setState({ showlocationDropdown: true }, async () => {
                var res = await APIService.execute('GET', APIService.URL + APIService.listownedloccationdetailsall, null)
                console.log("res : ", res.data)
                this.setState({ from_model: res.data.location_id })
            });
        }
        else {
            this.setState({ showTolocationDropdown: true }, async () => {
                var res = await APIService.execute('GET', APIService.URL + APIService.listownedloccationdetailsall, null)
                this.setState({ to_model: res.data.location_id })
            });
        }
    }

    async onFilterSelected(itemName, locationName, TolocationName, fromdate, todate) {
        console.log('itemName',this.state.itemName)
        if(fromdate){
            await AsyncStorage.setItem("FROM_DATE", JSON.stringify(fromdate));
        }
        if(todate){
            await AsyncStorage.setItem("TO_DATE", JSON.stringify(todate));

        }
        this.props.navigation.goBack() 
    }

    updateSize = (height) => {
        this.setState({ height });
    }
    static navigationOptions =
        { headerShown: false };

    _showDateTimePicker1 = () => this.setState({ isDateTimePickerVisible1: true, });
    _hideDateTimePicker1 = () => this.setState({ isDateTimePickerVisible1: false });
    _showDateTimePicker2 = () => this.setState({ isDateTimePickerVisible2: true });
    _hideDateTimePicker2 = () => this.setState({ isDateTimePickerVisible2: false });
    _showDateTimePicker3 = () => this.setState({ isDateTimePickerVisible3: true });
    _hideDateTimePicker3 = () => this.setState({ isDateTimePickerVisible3: false });
    _showDateTimePicker4 = () => this.setState({ isDateTimePickerVisible4: true });
    _hideDateTimePicker4 = () => this.setState({ isDateTimePickerVisible4: false });
    _showDateTimePicker5 = () => this.setState({ isDateTimePickerVisible5: true });
    _hideDateTimePicker5 = () => this.setState({ isDateTimePickerVisible5: false });
    _handleDatePicked1 = (name, date) => {
        this._hideDateTimePicker1();
        var obj = {}
        obj[name] = date
        obj['isDateSelected'] = true
        this.setState(obj, () => {
            this.props.filterfromdate(obj);
        })
    };
    _handleDatePicked2 = (name, date) => {
        this._hideDateTimePicker2();
        var obj = {}
        obj[name] = date
        obj['isDateSelected'] = true
        this.setState(obj, () => {
            this.props.filtertodate(obj);
        })
    };

    _handleDatePicked3 = (name, date) => {
        this._hideDateTimePicker3();
        var obj = {}
        obj[name] = date
        obj['isDateSelected'] = true
        this.setState(obj, () => console.log('obj is', obj))
    };

    _handleDatePicked4 = (name, date) => {
        this._hideDateTimePicker4();
        var obj = {}
        obj[name] = date
        obj['isDateSelected'] = true
        this.setState(obj, () => console.log('obj is', obj))
    };

    _handleDatePicked5 = (name, date) => {
        this._hideDateTimePicker5();
        var obj = {}
        obj[name] = date
        obj['isDateSelected'] = true
        this.setState(obj, () => console.log('obj is', obj))
    };
    //Time   
    _showTimePicker1 = () => this.setState({ isTimePickerVisible1: true });
    _hideTimePicker1 = () => this.setState({ isTimePickerVisible1: false });

    _handleTimePicked1 = (time) => {
        this._hideTimePicker1();
        const newtime1 = moment(time).format('HH:mm:ss');
        this.setState({ time1: newtime1 })
        this.state.isTimeSelected = true;
    };

    _showTimePicker2 = () => this.setState({ isTimePickerVisible2: true });
    _hideTimePicker2 = () => this.setState({ isTimePickerVisible2: false });

    _handleTimePicked2 = (time) => {
        this._hideTimePicker2();
        const newtime2 = moment(time).format('HH:mm:ss');
        this.setState({ time2: newtime2 })
        this.state.isTimeSelected = true;
    };

    tripId() {
        this.setState({ showResortDropdown: true }, async () => {
            var body = JSON.stringify({
                user_type_id: this.state.decoded.user_type_id,
                location_id: this.state.decoded.location_id
            })
            var responseJson = await APIService.execute('POST', APIService.URL + APIService.listinitiatetrip, body)
            if (responseJson.data.data.length > 0) {
                this.setState({
                    data: responseJson.data.data
                });
            }
            else {
                this.setState({ showResortDropdown: false });
                this.showMessage("No Trip Id available")
            }
        });
    }

    //loader
    renderModalContent = () => {
        if (this.state.showResortDropdown || this.state.showlocationDropdown || this.state.showTolocationDropdown) {
            return (
                <View style={styles.overlay}>
                    <ActivityIndicator color="#fff" size="large" />
                    <Text style={{ marginTop: 20, fontSize: 14, fontWeight: 'bold', color: '#fff' }}>{this.state.progressText}</Text>
                </View>
            );
        }
        else {
            return null;
        }
    }

    render() {

        return (
            <Container style={{ flex: 1, height: heightPercentageToDP('100%'), backgroundColor: '#EDEEF2' }}>
                <Header label={"Filter"} expanded={true} onBack={() => { this.props.navigation.goBack() }} />
                <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: '#EDEEF2', marginBottom: heightPercentageToDP('10%') }}>
                    <View style={{ flex: 1, margin: 10 }} >
                        <View style={{ justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                            <Text style={{ fontSize: 16, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Mandatory Information</Text>
                        </View>
                        <View style={{ flex: 1, borderColor: '#969089', borderWidth: 0.5, marginTop: 5, marginBottom: 15 }} />
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Trip ID:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity onPress={() => { this.tripId() }} style={{ flex: 1, flexDirection: 'row', margin: 5, height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.itemName.itemName || 'Select Trip Id'}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            <Text style={{ flex: 1, justifyContent: 'flex-start', fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>From:</Text>
                            <Text style={{ flex: 1, justifyContent: 'flex-end', fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>To:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity onPress={() => this.setState({ isFromLocation: true }, () => { this.getUserType() })} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5, }}>
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 7 }}>{this.state.locationName.itemName || "Select From Location"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => this.setState({ isFromLocation: false }, () => { this.getUserType() })} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 7 }}>{this.state.TolocationName.itemName || "Select To Location"}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            <Text style={{ flex: 1, justifyContent: 'flex-start', fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Date From:</Text>
                            <Text style={{ flex: 1, justifyContent: 'flex-end', fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Date To:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity onPress={this._showDateTimePicker1} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 7 }}>{this.state.fromdate || "Select From Date"}</Text>
                                <DateTimePicker
                                    isVisible={this.state.isDateTimePickerVisible1}
                                    onConfirm={(value) => this._handleDatePicked1('fromdate', moment(value).format("D MMMM YYYY"))}
                                    onCancel={this._hideDateTimePicker1}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={this._showDateTimePicker2} style={{ flex: 1, flexDirection: 'row', margin: 5, backgroundColor: '#F5F5F4', height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 7 }}>{this.state.todate || "Select to Date"}</Text>
                                <DateTimePicker
                                    isVisible={this.state.isDateTimePickerVisible2}
                                    onConfirm={(value) => this._handleDatePicked2('todate', moment(value).format("D MMMM YYYY"))}
                                    onCancel={this._hideDateTimePicker2} />
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>
                <View style={{ flex: 1, position: 'absolute', bottom: 0, flexDirection: 'row' }}>
                    <TouchableOpacity onPress={() => this.onReset()}>
                        <View
                            style={[styles.center, {
                                width: widthPercentageToDP('50%'),
                                height: heightPercentageToDP('8%'),
                                borderTopLeftRadius: widthPercentageToDP('2.5%'),
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.8,
                                shadowColor: '#CECECE',
                                shadowRadius: 3,
                                elevation: 4,
                                backgroundColor: '#FFFFFF',
                                borderWidth: 0.2
                            }]}>

                            <View style={{ height: heightPercentageToDP('8%'), justifyContent: 'center', alignSelf: 'center' }}>
                                <Text style={styles.buttonCancel}>Reset</Text>
                            </View>

                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => this.onFilterSelected(this.state.itemName, this.state.locationName, this.state.TolocationName, this.state.fromdate, this.state.todate)}>
                        <LinearGradient
                            colors={[color.gradientStartColor, color.gradientEndColor]}
                            start={{ x: 0.0, y: 0.25 }} end={{ x: 1.2, y: 1.0 }}
                            style={[styles.center, {
                                width: widthPercentageToDP('50%'),
                                height: heightPercentageToDP('8%'),
                                borderWidth: 0.2,
                                borderTopRightRadius: widthPercentageToDP('2.5%'),
                            }]}>

                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={styles.buttonStart}>Filter</Text>
                            </View>

                        </LinearGradient>
                    </TouchableOpacity>
                </View>
                {this.renderModalContent()}

                {this.state.data.length > 0 ? (
                    <SearchableDropdown
                        title={'Search By Trip ID'}
                        data={this.state.data}
                        onSelect={(selectedItem) => { this.setState({ itemName: selectedItem, showResortDropdown: false }, async() => { await AsyncStorage.setItem("TRIP_ID", JSON.stringify(selectedItem)); }) }}
                        onCancel={() => { this.setState({ showResortDropdown: false }) }}
                        isVisible={this.state.showResortDropdown === true} />
                ) : null}
                {this.state.from_model.length > 0 ? (
                    <SearchableDropdown
                        title={'Search Location'}
                        data={this.state.from_model}
                        onSelect={(selectedItem) => { this.setState({ locationName: selectedItem, showlocationDropdown: false }, async() => { await AsyncStorage.setItem("FROM_LOCATION", JSON.stringify(selectedItem)); }) }}
                        onCancel={() => { this.setState({ showlocationDropdown: false }) }}
                        isVisible={this.state.showlocationDropdown === true} />
                ) : null}
                {this.state.to_model.length > 0 ? (
                    <SearchableDropdown
                        title={'Search Location'}
                        data={this.state.to_model}
                        onSelect={(selectedItem) => { this.setState({ TolocationName: selectedItem, showTolocationDropdown: false }, async() => { await AsyncStorage.setItem("TO_LOCATION", JSON.stringify(selectedItem)); }) }}
                        onCancel={() => { this.setState({ showTolocationDropdown: false }) }}
                        isVisible={this.state.showTolocationDropdown === true} />
                ) : null}
            </Container>
        );
    }
}
function mapStateToProps(state) {
    console.log('props',state)
    return {
        search: state.search,
        fromloc: state.fromloc,
        toloc: state.toloc,
        fromDate: state.fromDate,
        toDate: state.toDate
    }
}
export default connect(mapStateToProps, filter)(withNavigation(TripFilterScreen));

const styles = StyleSheet.create({
    overlay: {
        height: Platform.OS === "android" ? Dimensions.get("window").height : null,
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', alignItems: 'center', alignSelf: 'center'
    },
    buttonStart: {
        fontSize: widthPercentageToDP('5%'),
        color: '#FFFFFF',
        fontFamily: 'Nunito-Bold',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    buttonCancel: {
        fontSize: widthPercentageToDP('5%'),
        color: '#000000',
        fontFamily: 'Nunito-Bold',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
});