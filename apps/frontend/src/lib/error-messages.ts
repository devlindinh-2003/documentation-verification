import { ApiError } from '../types/api';

/**
 * Maps backend ApiError objects to user-friendly messages.
 * Handles NestJS default error format.
 */
export function mapErrorToMessage(error: ApiError | unknown): string {
  // Handle network or unexpected errors
  if (!error || typeof error !== 'object') {
    return 'Something went wrong. Please try again later.';
  }

  const apiError = error as ApiError;

  // Handle validation errors (array of messages)
  if (Array.isArray(apiError.message)) {
    return apiError.message[0] ?? 'Please check your input.';
  }

  // Fallback for missing status code
  if (!apiError.statusCode) {
    return 'Network error. Please check your connection.';
  }

  switch (apiError.statusCode) {
    case 400:
      return 'Please check your input.';
    case 401:
      return 'Please log in again.';
    case 403:
      return 'You don’t have permission to perform this action.';
    case 404:
      return 'The requested information could not be found.';
    case 409:
      return 'This item was recently updated. Please refresh the page and try again.';
    case 500:
      return 'Server error. Our team has been notified.';
    default:
      return apiError.message || 'Something went wrong.';
  }
}
