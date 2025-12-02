import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    // When running in a Google Cloud environment, the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable is automatically set. The SDK uses this to initialize.
    try {
        admin.initializeApp();
    } catch(e) {
        console.warn(
            'Admin SDK initialization failed. This may happen in local development if GOOGLE_APPLICATION_CREDENTIALS is not set. The Genkit flow might not work.'
        );
    }
}

export { admin };
