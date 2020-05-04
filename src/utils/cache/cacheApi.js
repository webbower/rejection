export default function makeCache(driver) {
    return {
        has(key) {
            // TODO add validation for args
            return driver.has(key);
        },
        get(key, dflt = null) {
            // TODO add validation for args
            return driver.get(key, dflt);
        },
        put(key, value) {
            // TODO add validation for args
            driver.put(key, value);
        },
    };
}