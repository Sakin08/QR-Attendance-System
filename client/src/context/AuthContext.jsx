import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI, handleApiError } from '../services/api';

// Initial state
const initialState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
};

// Action types
const AUTH_ACTIONS = {
    LOGIN_START: 'LOGIN_START',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    LOGOUT: 'LOGOUT',
    REGISTER_START: 'REGISTER_START',
    REGISTER_SUCCESS: 'REGISTER_SUCCESS',
    REGISTER_FAILURE: 'REGISTER_FAILURE',
    LOAD_USER_START: 'LOAD_USER_START',
    LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
    LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
    CLEAR_ERROR: 'CLEAR_ERROR',
    SET_LOADING: 'SET_LOADING',
};

// Reducer
const authReducer = (state, action) => {
    switch (action.type) {
        case AUTH_ACTIONS.LOGIN_START:
        case AUTH_ACTIONS.REGISTER_START:
        case AUTH_ACTIONS.LOAD_USER_START:
            return {
                ...state,
                isLoading: true,
                error: null,
            };

        case AUTH_ACTIONS.LOGIN_SUCCESS:
        case AUTH_ACTIONS.REGISTER_SUCCESS:
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                refreshToken: action.payload.refreshToken,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };

        case AUTH_ACTIONS.LOAD_USER_SUCCESS:
            return {
                ...state,
                user: action.payload.user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };

        case AUTH_ACTIONS.LOGIN_FAILURE:
        case AUTH_ACTIONS.REGISTER_FAILURE:
        case AUTH_ACTIONS.LOAD_USER_FAILURE:
            return {
                ...state,
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload,
            };

        case AUTH_ACTIONS.LOGOUT:
            return {
                ...initialState,
                isLoading: false,
            };

        case AUTH_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null,
            };

        case AUTH_ACTIONS.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload,
            };

        default:
            return state;
    }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Load user on app start
    useEffect(() => {
        loadUser();
    }, []);

    // Load user from token
    const loadUser = async () => {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');

        if (!token) {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
            return;
        }

        dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });

        try {
            const response = await authAPI.getMe();
            dispatch({
                type: AUTH_ACTIONS.LOAD_USER_SUCCESS,
                payload: {
                    user: response.data.data.user,
                },
            });
        } catch (error) {
            const errorData = handleApiError(error);
            dispatch({
                type: AUTH_ACTIONS.LOAD_USER_FAILURE,
                payload: errorData.message,
            });

            // Clear invalid tokens
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        }
    };

    // Login function
    const login = async (credentials) => {
        dispatch({ type: AUTH_ACTIONS.LOGIN_START });

        try {
            const response = await authAPI.login(credentials);
            const { user, token, refreshToken } = response.data.data;

            // Store in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));

            dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: { user, token, refreshToken },
            });

            return { success: true };
        } catch (error) {
            const errorData = handleApiError(error);
            dispatch({
                type: AUTH_ACTIONS.LOGIN_FAILURE,
                payload: errorData.message,
            });
            return { success: false, error: errorData.message };
        }
    };

    // Register function
    const register = async (userData) => {
        dispatch({ type: AUTH_ACTIONS.REGISTER_START });

        try {
            const response = await authAPI.register(userData);
            const { user, token, refreshToken } = response.data.data;

            // Store in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));

            dispatch({
                type: AUTH_ACTIONS.REGISTER_SUCCESS,
                payload: { user, token, refreshToken },
            });

            return { success: true };
        } catch (error) {
            const errorData = handleApiError(error);
            dispatch({
                type: AUTH_ACTIONS.REGISTER_FAILURE,
                payload: errorData.message,
            });
            return { success: false, error: errorData.message, errors: errorData.errors };
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
    };

    // Clear error function
    // Clear error function
    const clearError = useCallback(() => {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    }, []);

    // Check if user has specific role
    const hasRole = (role) => {
        return state.user?.role === role;
    };

    // Check if user has any of the specified roles
    const hasAnyRole = (roles) => {
        return roles.includes(state.user?.role);
    };

    const value = {
        ...state,
        login,
        register,
        logout,
        loadUser,
        clearError,
        hasRole,
        hasAnyRole,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;