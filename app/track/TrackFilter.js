import React, { Component } from "react";
import { Button, Container, Toast, Fab, Footer, FooterTab, Right, Left, Body, Title, Item, Input } from 'native-base';
import { Text, StatusBar, Image, View, TouchableOpacity, Modal, TextInput, StyleSheet, Platform, Dimensions, ActivityIndicator } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { widthPercentageToDP, heightPercentageToDP } from 'react-native-responsive-screen';
import SearchableDropdown from '../trip/SearchableDropdownLockID';
import { connect } from 'react-redux';
const _ = require('lodash');
import * as filter from '../actions/filterAction';
import { SinglePickerMaterialDialog } from 'react-native-material-dialog';
import APIService from '../component/APIServices';
import { withNavigation } from 'react-navigation';
import Header from '../component/Header';
import LinearGradient from 'react-native-linear-gradient'
import color from '../styles/StyleConstants';
import AsyncStorage from '@react-native-community/async-storage';

class TrackFilter extends Component {

    filterOptions = [
        {
            value: 0,
            label: 'Completed'
        },
        {
            value: 1,
            label: 'Enroute'
        }
    ]
    constructor(props) {
        super(props);
        this.state = {
            data: '',
            focus: false,
            search: this.filterOptions[0],
            searchInput: this.props.vehicle || '',
            invoice: this.props.invoice || '',
            bill_no: this.props.bill_no || '',
            trip_status: '',
            singlePickerVisible: false,
            singlePickerSelectedItem: this.filterOptions[0],
            itemName: '',
            isDateSelected: false,
            isTimeSelected: false,
            newValue: null,
            obj: {},
            progressText: 'Loading...'

        };
    }
    updateSize = (height) => {
        this.setState({
            height
        });
    }

    getSelectedSortItem() {
        return _.find(this.filterOptions, { trip_status: this.state.trip_status });
    }

    vehicle(text) {
        this.setState({ searchInput: text })
        this.props.filterVehicle(text)
    }

    invoice(text) {
        this.setState({ invoice: text })
        this.props.filterIncoice(text)

    }

    bill_no(text) {
        this.setState({ bill_no: text })
        this.props.filterBill(text)

    }

    async componentDidMount(){
        this.setState({filter: this.props.navigation.state.params.item},()=>{
            console.log("itemName:",this.props.navigation.state.params.item)
            if(this.state.filter && this.state.filter.itemName){
                this.setState({itemName:this.state.filter.itemName})
            }
            if(this.state.filter && this.state.filter.vehicle_nofilter){
                this.setState({searchInput:this.state.filter.vehicle_nofilter})

            }
            if(this.state.filter && this.state.filter.invoice){
                this.setState({invoice:this.state.filter.invoice})
            }
            if(this.state.filter && this.state.filter.bill_no){
                this.setState({bill_no:this.state.filter.bill_no})
            }
            if(this.state.filter && this.state.filter.trip_status){
                this.setState({trip_status:this.state.filter.trip_status})
            }
        })
        // await AsyncStorage.getItem('LOCK_ID').then((value) => {
        //     var lock_id = JSON.parse(value);
        //     console.log("lock_id",lock_id)
        //     this.setState({
        //         itemName: lock_id
        //     })
        // });
        // await AsyncStorage.getItem('VEHICLE_NO').then((value) => {
        //     var vehicle_no = JSON.parse(value);
        //     console.log("vehicle_no",vehicle_no)
        //     this.setState({
        //         searchInput: vehicle_no
        //     })
        // });
    }

    async onFilterSelected(itemName, searchInput, invoice, bill_no, trip_status) { 
        console.log('data',this.state.trip_status)
        // await AsyncStorage.setItem("LOCK_ID", JSON.stringify(this.state.itemName))
        if(searchInput){
            await AsyncStorage.setItem("VEHICLE_NO", JSON.stringify(searchInput));
        }
        if(invoice){
            await AsyncStorage.setItem("INVOICE_NO", JSON.stringify(invoice));
        }
        if(bill_no){
            await AsyncStorage.setItem("BILL_NO", JSON.stringify(bill_no));
        }
        if(trip_status){
            await AsyncStorage.setItem("TRIP_STATUS", JSON.stringify(trip_status));

        }

        this.props.navigation.goBack() 
    }

    async onReset() {
        await AsyncStorage.setItem("LOCK_ID", "");
        await AsyncStorage.setItem("VEHICLE_NO", "");
        await AsyncStorage.setItem("INVOICE_NO", "");
        await AsyncStorage.setItem("BILL_NO", "");
        await AsyncStorage.setItem("TRIP_STATUS", "");
        this.setState({ itemName: '', searchInput: '', invoice: '', bill_no: '', trip_status: '' })
    }
    async SearchTrip() {
        var userDetails = await APIService.execute('GET', APIService.URL + APIService.listalllock, null)
        this.setState({ showResortDropdown: true, data: userDetails.data.data });
    }

    setData() {
        var temp = this.state.trip_status;

        if (temp) {
            var tempObj = {}
            var index = _.findIndex(this.filterOptions, function (o) { return o.label === temp });
            console.log("index : ", index)
            var selectedValue = this.filterOptions[index].value
            tempObj.value = selectedValue
            tempObj.label = this.state.trip_status
            // this.setState({ singlePickerVisible: true })
            console.log("already : ", this.state.singlePickerSelectedItem, " and new : ", tempObj)
            this.setState({ singlePickerSelectedItem: tempObj, singlePickerVisible: true }, () => { console.log("data : ", this.filterOptions[index].value) })
        }
        else {
            this.setState({ singlePickerVisible: true })
        }
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
        console.log("itemName",this.state.itemName)
        return (
            <Container style={{ flex: 1, backgroundColor: '#EDEEF2' }}>
                {
                    this.state.showResortDropdown ?
                        <SearchableDropdown
                            title={'Search By Trip ID'}
                            data={this.state.data}
                            onSelect={(selectedItem) => { this.setState({ itemName: selectedItem, showResortDropdown: false, }, async () => { await AsyncStorage.setItem("LOCK_ID", JSON.stringify(selectedItem)); }) }}
                            onCancel={() => { this.setState({ showResortDropdown: false }) }} isVisible={this.state.showResortDropdown === true} /> : null
                }

                <StatusBar barStyle="dark-content" hidden={false} backgroundColor="#FD8000" translucent={true} />
                <Header label={"Filter"} expanded={true} onBack={() => { this.props.navigation.goBack() }} />
                <ScrollView style={{ backgroundColor: '#EDEEF2' }}>
                    <View style={{ flex: 1, margin: 10 }} >
                        <View style={{ justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                            <Text style={{ fontSize: 16, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Mandatory Information</Text>
                        </View>
                        <View style={{ flex: 1, borderColor: '#969089', borderWidth: 0.5, marginTop: 5, marginBottom: 15 }} />
                        <View>
                            <Text style={{ fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Lock ID:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity onPress={() => this.SearchTrip()} style={{ flex: 1, flexDirection: 'row', margin: 5, height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 9 }}>{this.state.itemName ? this.state.itemName.itemName + " " + (this.state.itemName.lock_vendor === 'jt' ? "(SP701)" : "(SP777)") : this.state.itemName.itemName || 'Select Lock Id'}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            <Text style={{ flex: 1, justifyContent: 'flex-start', fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Vehicle No:</Text>
                            <Text style={{ flex: 1, justifyContent: 'flex-end', fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Invoice No:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 1, flexDirection: 'row', margin: 5, height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5, alignItems: 'center' }}>
                                <Input value={this.state.searchInput} onFocus={() => this.setState({ focus: false })} placeholder={'Enter No'} clearIcon onChangeText={(text) => this.vehicle(text)} style={{ marginLeft: 5, justifyContent: 'center', alignSelf: 'center' }} />
                            </View>
                            <View style={{ flex: 1, flexDirection: 'row', margin: 5, height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Input value={this.state.invoice} onFocus={() => this.setState({ focus: false })} placeholder={'Enter No'} clearIcon onChangeText={(text) => this.invoice(text)} style={{ marginLeft: 5, justifyContent: 'center', alignSelf: 'center' }} />
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            <Text style={{ flex: 1, justifyContent: 'flex-start', fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>E-way Bill No:</Text>
                            <Text style={{ flex: 1, justifyContent: 'flex-end', fontSize: 16, marginLeft: 10, fontFamily: 'avenir', marginTop: 5, marginBottom: 5, color: '#141312', fontWeight: 'bold' }}>Trip Status:</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                                style={{ flex: 1, flexDirection: 'row', margin: 5, height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Input value={this.state.bill_no} onFocus={() => this.setState({ focus: false })} placeholder={'Enter No'} clearIcon onChangeText={(text) => this.bill_no(text)} style={{ marginLeft: 5, justifyContent: 'center', alignSelf: 'center' }} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { this.setData() }} style={{ flex: 1, flexDirection: 'row', margin: 5, height: 40, marginBottom: 10, marginLeft: 5, backgroundColor: 'white', borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5 }}>
                                <Text style={{ flex: 1, marginLeft: 7, fontSize: 16, justifyContent: 'center', color: '#000', marginTop: 7 }}>{this.state.trip_status || this.state.trip_status || "Select Trip Status"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
                {this.renderModalContent()}
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
                    <TouchableOpacity onPress={() => this.onFilterSelected(this.state.itemName, this.state.searchInput, this.state.invoice, this.state.bill_no, this.state.trip_status)}>
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
                <SinglePickerMaterialDialog
                    title={'Pick one element!'}
                    items={this.filterOptions}
                    visible={this.state.singlePickerVisible}
                    selectedItem={this.state.singlePickerSelectedItem}
                    onCancel={() => this.setState({ singlePickerVisible: false })}
                    onOk={result => {
                        this.setState({ singlePickerVisible: false });
                        this.setState({ singlePickerSelectedItem: result.selectedItem, trip_status: result.selectedItem.label })

                        if (result.selectedItem.label !== this.state.trip_status) {
                            this.props.filterTrip_Status(result.selectedItem.label)
                            this.setState({ singlePickerVisible: false })
                        }
                        else { this.setState({ singlePickerVisible: false }) }
                    }} />
            </Container>
        );
    }
}

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

function mapStateToProps(state) {
    return {
        search: state.search,
        vehicle: state.vehicle,
        invoice: state.invoice,
        bill_no: state.bill_no,
        trip_status: state.trip_status
    }
}
export default connect(mapStateToProps, filter)(withNavigation(TrackFilter));