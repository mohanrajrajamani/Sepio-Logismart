

import React, { Component } from "react";
import { Root } from 'native-base';
import { Provider } from "react-redux";
import configureStore from './store';
import Navigator from './Navigator';
_ = require('lodash');
moment = require('moment');
qs = require('querystring');

const store = configureStore();

const App = () => (
    <Provider store={store}>
        <Root>
            <Navigator />
        </Root>
    </Provider>
)

export default App;