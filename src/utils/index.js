export const prop = key => obj => obj[key];

export const pipe = (...fns) => x => fns.reduce((memo, fn) => fn(memo), x);