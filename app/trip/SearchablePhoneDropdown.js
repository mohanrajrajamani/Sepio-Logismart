import { Button, Container, Header, Icon, Input, Item, ListItem, Body } from 'native-base';
import React, { Component } from 'react';
import { ActivityIndicator, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, Alert, ScrollView, AsyncStorage } from "react-native";
import Modal from 'react-native-modalbox';
import { widthPercentageToDP, heightPercentageToDP } from 'react-native-responsive-screen'

export default class SearchablePhoneDropdown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            value: '',
            searchInput: '',
            data: this.props.data,
            filteredData: '',
        };
        this.arrayholder = [];
    }

    selectItem(item) { this.setState({ searchInput: '', data: this.props.data }, () => { this.props.onSelect(item); }) }
    searchText(text) {
        this.setState({ searchInput: text }, () => {
            if (text !== '') {
                var searchResults = [];
                for (var d of this.arrayholder) {
                    if (d.phone_code.toLowerCase().includes(text.toLowerCase())) {
                        searchResults.push(d);
                    }
                }
                this.setState({
                    data: searchResults,
                    searchInput: text
                })
            }
            else {
                this.setState({ data: this.arrayholder, searchInput: text })
            }
        });
    }

    load() { this.setState({ loading: false }) }

    render() {
        this.arrayholder = this.props.data;
        if (this.state.loading) {
            return (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}> <ActivityIndicator /> </View>
            );
        }
        return (
            this.props.isVisible ? (
                // <Modal isOpen={true} style={{ backgroundColor: 'yellow', flex: 1 }} backdrop={false} >
                //     <Container style={{ backgroundColor: '#fdfdfd', flex: 1 }}>
                //         <Header style={{ justifyContent: 'flex-start', flexDirection: 'row', backgroundColor: '#263C88' }} transparent
                //             searchBar containerStyle={{ justifyContent: 'center', alignItems: 'center' }}
                //             rounded>
                //             <Item>
                //                 <Button transparent onPress={() => { this.props.onCancel(); }}>
                //                     <Icon name="ios-arrow-back" size={22} style={{ fontSize: 32, marginBottom: 6, color: 'black' }} />
                //                 </Button>
                //                 <Input
                //                     autoFocus={true}
                //                     value={this.state.searchInput}
                //                     onFocus={() => this.setState({ focus: true })}
                //                     placeholder='Search'
                //                     clearIcon
                //                     onChangeText={(text) => this.searchText(text)}
                //                 />
                //             </Item>
                //         </Header>
                //         <ScrollView style={{ paddingBottom: 20 }} >
                //             <FlatList
                //                 style={{ marginHorizontal: 10 }}
                //                 data={this.state.data}

                //                 renderItem={({ item }) => (
                //                     <ListItem onPress={() => this.selectItem(item)}>
                //                         <Body>
                //                             <Text style={{ color: "#263C88" }}>{item.phone_code}</Text>
                //                         </Body>
                //                     </ListItem>
                //                 )}
                //             // keyExtractor={item => item._id}
                //             />
                //         </ScrollView>
                //     </Container >
                // </Modal>
                <Modal isOpen={true} style={{ backgroundColor: 'yellow', flex: 1 }} backdrop={false} >
                    <Container style={{ backgroundColor: 'white', flex: 1 }}>
                        <Header style={{ justifyContent: 'flex-start', flexDirection: 'row', backgroundColor: 'white' }} transparent
                            searchBar containerStyle={{ justifyContent: 'center', alignItems: 'center' }}
                            rounded>
                            <Item style={{
                                backgroundColor: 'white',
                                height: heightPercentageToDP('7%'),
                                justifyContent: 'center',
                                flex: 1, flexDirection: 'row', margin: 5, marginBottom: 10, marginLeft: 5, borderRadius: 5, shadowColor: 'grey', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, elevation: 2, shadowRadius: 1, marginRight: 5
                            }}>
                                <Button transparent onPress={() => { this.props.onCancel(); }}>
                                    <Icon name="ios-arrow-back" size={22} style={{ fontSize: 32, marginBottom: 6, color: 'black' }} />
                                </Button>
                                <Input
                                    autoFocus={true}
                                    value={this.state.searchInput}
                                    onFocus={() => this.setState({ focus: true })}
                                    placeholder='Search'
                                    clearIcon
                                    onChangeText={(text) => this.searchText(text)}
                                />
                            </Item>
                        </Header>
                        <ScrollView style={{ paddingBottom: 20 }} >
                            <FlatList
                                style={{ marginHorizontal: 10 }}
                                data={this.state.data}

                                renderItem={({ item }) => (
                                    <ListItem onPress={() => this.selectItem(item)}>
                                        <Body>
                                            <Text style={{ color: "#263C88" }}>{item.phone_code}</Text>
                                        </Body>
                                    </ListItem>
                                )}
                            // keyExtractor={item => item._id}
                            />
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

