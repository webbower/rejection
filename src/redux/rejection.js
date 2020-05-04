import { take, put, call, select } from 'redux-saga/effects';
import { prop, pipe } from '../utils';

export const CACHE_KEY = 'rejection-app-state';

// Action Types
export const ASK_QUESTION = 'rejection-app/rejection/ASK_QUESTION';
export const LOAD_STATE = 'rejection-app/rejection/LOAD_STATE';

// Action Creators
export const askQuestion = (question = '', isRejected = false) => ({
    type: ASK_QUESTION,
    payload: { question, isRejected },
});

export const loadState = (state) => ({
    type: LOAD_STATE,
    payload: state,
})

// Selectors
const calculateScore = questions => questions.reduce(
    (score, { isRejected }) => score + (isRejected ? 10 : 1),
    0
);

export const getQuestions = prop('questions');
export const getScore = pipe(getQuestions, calculateScore);

// Initial State
export const getInitialState = ({ questions = [] } = {}) => ({
    questions,
});

// Reducer
export default function reducer(state = getInitialState(), action = {}) {
    switch (action.type) {
        case LOAD_STATE:
            return { ...action.payload };
        case ASK_QUESTION:
            return {
                ...state,
                questions: [...state.questions, action.payload],
            };
        default:
            return state;
    }
}

// Sagas
export function rejectionPersistenceSaga(cache) {
    if (!cache) {
        throw new TypeError('rejectionPersistenceSaga() requires a cache interface as its first argument');
    }

    return function* () {
        yield put(loadState(cache.get(CACHE_KEY, getInitialState())));
        while (true) {
            yield take(ASK_QUESTION);
            const state = yield select();
            yield call(cache.put, CACHE_KEY, state);
        }
    };
}
