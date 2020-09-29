import isArray from 'lodash';
import { Button, Container, Header, Icon, Input, Item, ListItem, Body } from 'native-base';
import React, { Component } from 'react';
import { ActivityIndicator, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, Alert, ScrollView, AsyncStorage } from "react-native";
import Modal from 'react-native-modalbox';
import { heightPercentageToDP } from 'react-native-responsive-screen';

export default class searchableVehicleDropdown extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            value: '',
            searchInput: '',
            data: [],
            filteredData:''
        };
        this.arrayholder=[];
    }

    async componentDidMount() {
        var loginData = await AsyncStorage.getItem('user_token');
        const url = 'https://theft-tamper-backend.herokuapp.com/v1/dashboard/listVehicle';
        fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (loginData)
            }
        })
        .then((response) => {  return response.json(); })
        .then((res) => { console.log('response1 ', res); this.setState({ data: res.data }); this.arrayholder = res.data })
        .catch((error) => { console.log('error ', error); })
    }
    selectItem(item) { this.props.onSelect(item); }
    searchText(text) {
        this.setState({ searchInput: text, loading: true }, () => {
          const newData = this.arrayholder.filter(item => {
            var itemData = item.itemName ? (item.itemName) : '----';
            const textData = text.toUpperCase();
            return itemData.indexOf(textData) > -1;
          });
          this.setState({data: newData, loading: false});
        });
      }
    render() {
        console.log("item",this.state.data)
        if (this.state.loading) {
            return (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator />
                </View>
            );
        }
        return (
            this.props.isVisible ? (
                <Modal
                    isOpen={true}
                    backdrop={false}
                    style={{ backgroundColor: 'yellow', flex: 1 }}>
                    <Container style={{ backgroundColor: '#fdfdfd', flex: 1 }}>
                        <Header style={{ justifyContent: 'flex-start', flexDirection: 'row', backgroundColor: '#263C88' }} transparent
                            searchBar containerStyle={{ justifyContent: 'center', alignItems: 'center' }}
                            rounded>
                            <Item style={{ backgroundColor: 'white', 
                            height: heightPercentageToDP('7%'), 
                            justifyContent: 'center',
                            flex: 1, flexDirection: 'row', margin: 5, marginBottom: 10, marginLeft: 5, borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5}}>
                                <Button transparent onPress={() => { this.props.onCancel(); }}>
                                    <Icon name="ios-arrow-back" size={22} style={{ fontSize: 32, marginBottom: 6, color: 'black' }} />
                                </Button>
                                <Input
                                    autoFocus={true}
                                    value={this.state.searchInput}
                                    onFocus={() => this.setState({ focus: true })}
                                    placeholder='Search by vehicle number'
                                    clearIcon
                                    onChangeText={(text) => this.searchText(text)} />
                            </Item>
                        </Header>
                        <ScrollView style={{ paddingBottom: 20 }} >
                            <FlatList
                                style={{ marginHorizontal: 10 }}
                                data={this.state.data}
                                renderItem={({ item }) =>
                                    <ListItem onPress={() => this.selectItem(item)}>
                                        <Body>
                                            <Text style={{ color: "#263C88" }}>{item.itemName}</Text>
                                        </Body>
                                    </ListItem>
                                } keyExtractor={(item) => item.id} />
                        </ScrollView>
                    </Container >
                </Modal>
            ) : null
        );
    }
}
const styles = StyleSheet.create({

    item: {
        padding: 10,
        marginHorizontal: 20,
        fontSize: 18,
        height: 44,
    },
})