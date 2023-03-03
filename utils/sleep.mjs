let delay
export const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export default {sleep}
