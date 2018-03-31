import { queryToUrl } from 'utils';
import { makeActionCreator, createReducer, buildAsyncState } from '../../utils';

const GET_TODO = 'get_todo';
const ADD_TODO = 'add_todo';

const initialState = {
    todos: {},
};

export default createReducer(initialState,
    buildAsyncState(GET_TODO, { getTodo: {} }),
    buildAsyncState(ADD_TODO, { addToDo: {} })
);

export const getTodo1 = makeActionCreator(({ body, ...res }) => ({
    type: GET_TODO,
    method: 'get',
    url: 'todo',
    body,
    ...res,
}));


export const addTodo1 = makeActionCreator(({ body, ...res }) => ({
    type: ADD_TODO,
    method: 'post',
    url: 'todo',
    body,
    ...res,
}));