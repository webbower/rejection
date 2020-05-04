export default function mockCacheDriver(initialState = {}) {
    const state = { ...initialState };

    return {
        has(key) {
            return state[key] != null;
        },
        get(key, dflt = null) {
            if (key === undefined) {
                return { ...state };
            }
            const value = state[key];
            return value == null ? dflt : value;
        },
        put(key, value) {
            state[key] = value;
        },
    };
}
