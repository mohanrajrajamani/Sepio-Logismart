import React from "react";
import { ImageBackground, View, Image, SafeAreaView, TouchableOpacity, StatusBar, Platform, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { widthPercentageToDP as wp, heightPercentageToDP as hp, widthPercentageToDP } from 'react-native-responsive-screen';
import commonStyles from '../styles/Common'
import styleConstants from '../styles/StyleConstants'

const Header = ({
    expanded,
    label,
    onBack,
    onProfileUrl,
    onNotificationURL,
    edit,
    editURL
}) => {

    if (expanded) {
        return (
            <SafeAreaView>
                <StatusBar barStyle="light-content" hidden={false} backgroundColor="transparent" translucent={true} />

                <View style={[commonStyles.row, styles.rh(12.5), { backgroundColor: styleConstants.gradientStartColor, width: "100%", marginTop: hp('-5%') }]}>
                    <View style={[commonStyles.full, styles.row, { marginLeft: wp('1%'), marginRight: wp('2%'), marginTop: hp('3%') }]}>

                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', }}>
                            <TouchableOpacity style={[commonStyles.row, { justifyContent: 'flex-start', flexDirection: 'row', padding: wp('2%') }]} onPress={() => {
                                onBack()
                            }}>
                                <Image style={[{ width: wp('8%'), height: hp('10%'), aspectRatio: 1 }]}
                                    fadeDuration={0}
                                    source={require('../../assets/images/arrow.png')} />

                            </TouchableOpacity>
                            <Text style={[commonStyles.fontSize(3.5), { width: widthPercentageToDP('70%'), marginLeft: wp('2%'), color: 'white', fontFamily: 'Nunito-Bold' }]}>{label}</Text>
                            {
                                edit ?
                                    <TouchableOpacity style={[commonStyles.row, { width: widthPercentageToDP('10%'), justifyContent: 'flex-start', flexDirection: 'row', padding: wp('2%') }]} onPress={editURL}>
                                        <Image style={[{ width: wp('6%'), height: hp('10%'), aspectRatio: 1, tintColor: 'white' }]}
                                            fadeDuration={0}
                                            source={require('../../assets/images/pencil-edit-button.png')} />
                                    </TouchableOpacity> : null
                            }
                        </View>

                    </View>
                </View>

            </SafeAreaView>

        )
    }
    else {
        return (
            <SafeAreaView>
                <StatusBar barStyle="dark-content" hidden={false} backgroundColor="transparent" translucent={true} />
                <View style={[commonStyles.row, commonStyles.rh(13), { paddingLeft: wp('5%'), paddingRight: wp('5%'), backgroundColor: 'white', width: "100%", marginTop: Platform.OS === 'android' ? hp('0.1%') : hp('-2.5%') }]}>

                    <View style={[commonStyles.full, commonStyles.row, { justifyContent: 'center', alignItems: 'center' }]}>
                        {
                            <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity style={{ width: wp('6%'), height: hp('6%') }} onPress={() => { onProfileUrl() }}>
                                    <Image style={{ width: wp('6%'), height: hp('6%'), resizeMode: 'contain' }}
                                        source={require('../../assets/images/user.png')} />
                                </TouchableOpacity>

                                <Image style={{ flex: 1, width: wp('10%'), height: hp('6%'), resizeMode: 'contain' }}
                                    source={require('../../assets/images/sepio_white.png')} />
                                <TouchableOpacity style={{ width: wp('6%'), height: hp('6%') }} onPress={() => { onNotificationURL() }}>
                                    <Image style={{ width: wp('6%'), height: hp('6%'), resizeMode: 'contain' }}
                                        source={require('../../assets/images/notification.png')} />
                                </TouchableOpacity>
                            </View>

                        }
                    </View>
                </View>

            </SafeAreaView>
        )

    }
}
export default Header;
