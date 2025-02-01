class AuthorizationError extends Error {
    public code: string;

	public constructor(error: string, description?: string, ...params: ErrorOptions[]) {
		super(description, ...params);
		Error.captureStackTrace(this, AuthorizationError);

		this.name = 'AuthorizationError';
		this.code = error;
	}
}

export default AuthorizationError;
