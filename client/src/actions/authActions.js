import {
    IS_SIGNED_IN,
    IS_SIGNED_OUT
} from '../actions/actionTypes';

import template from 'url-template';

import { get } from 'lodash';

import baseApi from '../apis/baseApi';

const SignInUrl = template.parse('/auth/signin');
const SignUpUrl = template.parse('/auth/signup');
const SignOutUrl = template.parse('/auth/signout');

export const signIn = (username, password) => async dispatch => {
    try {
        const response = await baseApi.post(
            SignInUrl.expand({}),
            {
                username,
                password
            }
        );

        const accessToken = get(response, 'data.accessToken', '') || '';

        sessionStorage.setItem('accessToken', accessToken);

        dispatch({
            type: IS_SIGNED_IN
        });
    } catch (error) {
        console.log('error: ', error);
    }
};

export const signUp = (username, password, email) => async dispatch => {
    // Pass username, email, password
    // try/catch on the signUp API, return true/false
};

export const signOut = () => async dispatch => {

    dispatch({
        type: IS_SIGNED_OUT
    });
};