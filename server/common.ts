export const isNode = process.env.IS_NODE === 'TRUE'
export const staticUrl = isNode ? 'http://127.0.0.1:8080' : 'https://p.chilfish.top'
