import {
    SET_USER
} from '../actions/actionTypes';

const initialState = {
    user: {}
};

// eslint-disable-next-line
export default (state = initialState, action) => {
    switch (action.type) {
        case SET_USER:
            return {
                ...state,
                user: {...action.payload}
            };
        default:
            return state;
    }
};
