import test from 'tape';
import { take, put, call, select } from 'redux-saga/effects';

import {
    ASK_QUESTION,
    CACHE_KEY,
    askQuestion,
    loadState,
    getScore,
    getQuestions,
    getInitialState,
    default as reducer,
    rejectionPersistenceSaga,
} from '../../src/redux/rejection';
import { makeCache } from '../../src/utils/cache';
import { mockCacheDriver } from '../../src/utils/cache/testing-utils';

const q1 = 'Should I go shopping?';
const q2 = 'Would you like to go on a date with me?';
const q3 = 'Can I have a raise?';

const getInitialReducerState = (withQuestions = true, action) =>
    reducer(getInitialState(withQuestions ? {
        questions: [
            { question: q1, isRejected: false, },
            { question: q2, isRejected: true, },
        ],
    } : undefined), action);

const getInitialCache = (withData = true) =>
    makeCache(mockCacheDriver(getInitialReducerState(withData)));

test('rejection module action creators', assert => {
    assert.deepEqual(
        askQuestion(q1),
        { type: ASK_QUESTION, payload: { question: q1, isRejected: false } },
        'askQuestion(string) should return an un-rejected action'
    );

    assert.deepEqual(
        askQuestion(q1, false),
        { type: ASK_QUESTION, payload: { question: q1, isRejected: false } },
        'askQuestion(string, false) should return an un-rejected action'
    );

    assert.deepEqual(
        askQuestion(q1, true),
        { type: ASK_QUESTION, payload: { question: q1, isRejected: true } },
        'askQuestion(string, true) should return a rejected action'
    );

    assert.end();
});

test('rejection module reducer', assert => {
    assert.deepEqual(
        reducer(),
        { questions: [] },
        'reducer() should return default state'
    );

    assert.deepEqual(
        getInitialReducerState(),
        {
            questions: [
                { question: q1, isRejected: false, },
                { question: q2, isRejected: true, },
            ]
        },
        'reducer(state) should return custom initial state'
    );

    assert.deepEqual(
        getInitialReducerState(false, askQuestion(q3)),
        {
            questions: [{ question: q3, isRejected: false, }]
        },
        'reducer(undefined, askQuestion(string)) should add first entry to state'
    );

    assert.deepEqual(
        getInitialReducerState(true, askQuestion(q3, true)),
        {
            questions: [
                { question: q1, isRejected: false, },
                { question: q2, isRejected: true, },
                { question: q3, isRejected: true, },
            ]
        },
        'reducer(state, askQuestion(string, true)) should append new entry to state'
    );

    assert.deepEqual(
        getInitialReducerState(false, loadState(getInitialState({ questions: [{ question: q3, isRejected: true }] }))),
        {
            questions: [{ question: q3, isRejected: true }]
        },
        'reducer(undefined, loadState(state)) should set state'
    );

    assert.deepEqual(
        getInitialReducerState(true, loadState(getInitialState({ questions: [{ question: q3, isRejected: true }] }))),
        {
            questions: [{ question: q3, isRejected: true }]
        },
        'reducer(state, loadState(state)) should override current state'
    );

    assert.end();
});

test('rejection module selectors', assert => {
    assert.deepEqual(
        getQuestions(getInitialReducerState()),
        [
            { question: q1, isRejected: false, },
            { question: q2, isRejected: true, },
        ],
        'getQuestions(reducer(state)) should return array of questions'
    );

    assert.equal(
        getScore(getInitialReducerState(false)),
        0,
        'getScore(reducer(undefined)) should return expected score for empty state'
    );

    assert.equal(
        getScore(getInitialReducerState()),
        11,
        'getScore(reducer(state)) should return expected score'
    );

    assert.equal(
        getScore(getInitialReducerState(true, askQuestion(q3, true))),
        21,
        'getScore(reducer(state, askQuestion(string, true))) should return expected score'
    );

    assert.end();
});

test('rejection module sagas', assert => {
    {
        const cache = getInitialCache();
        const gen = rejectionPersistenceSaga(cache)();

        assert.deepEqual(
            gen.next().value,
            put(loadState(getInitialState())),
            'rejectionPersistenceSaga(cache)() should load the initial empty state with an empty cache'
        );

        assert.deepEqual(
            gen.next().value,
            take(ASK_QUESTION),
            'rejectionPersistenceSaga(cache)() should wait for a question to be submitted'
        );

        assert.deepEqual(
            gen.next().value,
            select(),
            'rejectionPersistenceSaga(cache)() should get the updated state'
        );

        assert.deepEqual(
            // NOTE Manually providing state since this isn't running attached to a Redux store
            gen.next(getInitialState()).value,
            call(cache.put, CACHE_KEY, { questions: [] }),
            'rejectionPersistenceSaga(cache)() should persist updated state to cache'
        );

        assert.deepEqual(
            gen.next().value,
            take(ASK_QUESTION),
            'rejectionPersistenceSaga(cache)() should wait for another question to be submitted'
        );
    }

    assert.end();
});
