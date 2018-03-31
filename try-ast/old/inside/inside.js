export const oldoldold = makeActionCreator(({ body, ...res }) => ({
    type: OLD_OLD_OLD,
    method: 'old',
    url: 'old',
    body,
    ...res,
}));