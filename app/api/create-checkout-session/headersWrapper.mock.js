// headersWrapper.mock.js
export async function cookies() {
    return {
      get: (name) => {
        if (name === 'sessionToken') return { value: 'validSessionToken' };
        if (name === 'csrfToken')    return { value: 'validCsrf' };
        return undefined;
      }
    };
  }